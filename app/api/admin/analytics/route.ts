import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { getReviewsPage } from "@/lib/reviews";

const DAY_MS = 86_400_000;

function startOfWeek(d: Date): string {
  const date = new Date(d);
  const day = date.getUTCDay(); // 0=Sun
  const diff = (day + 6) % 7; // days since Monday
  date.setUTCDate(date.getUTCDate() - diff);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function GET(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

  try {
    const since = new Date(Date.now() - 370 * DAY_MS); // last ~1 year covers every chart below

    const [paidSubmissions, totalSubmissions, reviewsPage] = await Promise.all([
      prisma.submission.findMany({
        where: { paymentStatus: "paid", paidAt: { gte: since } },
        select: { amountPaise: true, paidAt: true },
        orderBy: { paidAt: "asc" },
      }),
      prisma.submission.count(),
      getReviewsPage(1, null),
    ]);

    const totalPaidCount = await prisma.submission.count({ where: { paymentStatus: "paid" } });
    const totalRevenuePaise = await prisma.submission.aggregate({
      where: { paymentStatus: "paid" },
      _sum: { amountPaise: true },
    });

    // Bucket every paid submission by day, week, and month all at once —
    // each chart range below just reads however many buckets it needs.
    const dailyMap = new Map<string, { count: number; revenue: number }>();
    const weeklyMap = new Map<string, { count: number; revenue: number }>();
    const monthlyMap = new Map<string, { count: number; revenue: number }>();

    for (const sub of paidSubmissions) {
      if (!sub.paidAt) continue;
      const day = sub.paidAt.toISOString().slice(0, 10);
      const wk = startOfWeek(sub.paidAt);
      const mo = monthKey(sub.paidAt);

      const d = dailyMap.get(day) || { count: 0, revenue: 0 };
      d.count += 1;
      d.revenue += sub.amountPaise;
      dailyMap.set(day, d);

      const w = weeklyMap.get(wk) || { count: 0, revenue: 0 };
      w.count += 1;
      w.revenue += sub.amountPaise;
      weeklyMap.set(wk, w);

      const m = monthlyMap.get(mo) || { count: 0, revenue: 0 };
      m.count += 1;
      m.revenue += sub.amountPaise;
      monthlyMap.set(mo, m);
    }

    // Zero-filled buckets, oldest to newest, one series per chart range.
    const daily: { label: string; sales: number; revenue: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const key = new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10);
      const bucket = dailyMap.get(key) || { count: 0, revenue: 0 };
      daily.push({ label: key, sales: bucket.count, revenue: Math.round(bucket.revenue / 100) });
    }

    const weekly: { label: string; sales: number; revenue: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(Date.now() - i * 7 * DAY_MS);
      const key = startOfWeek(d);
      const bucket = weeklyMap.get(key) || { count: 0, revenue: 0 };
      weekly.push({ label: key, sales: bucket.count, revenue: Math.round(bucket.revenue / 100) });
    }

    const sixMonth: { label: string; sales: number; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setUTCMonth(d.getUTCMonth() - i);
      const key = monthKey(d);
      const bucket = monthlyMap.get(key) || { count: 0, revenue: 0 };
      sixMonth.push({ label: key, sales: bucket.count, revenue: Math.round(bucket.revenue / 100) });
    }

    const yearly: { label: string; sales: number; revenue: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setUTCMonth(d.getUTCMonth() - i);
      const key = monthKey(d);
      const bucket = monthlyMap.get(key) || { count: 0, revenue: 0 };
      yearly.push({ label: key, sales: bucket.count, revenue: Math.round(bucket.revenue / 100) });
    }

    const today = new Date().toISOString().slice(0, 10);
    const todaySales = paidSubmissions.filter((s: { paidAt: Date | null }) => s.paidAt?.toISOString().slice(0, 10) === today).length;

    return NextResponse.json({
      ok: true,
      totals: {
        totalSubmissions,
        totalPaid: totalPaidCount,
        totalRevenueInr: Math.round((totalRevenuePaise._sum.amountPaise || 0) / 100),
        conversionRate: totalSubmissions > 0 ? Math.round((totalPaidCount / totalSubmissions) * 1000) / 10 : 0,
        todaySales,
        averageRating: reviewsPage.summary.average,
        reviewCount: reviewsPage.summary.count,
      },
      daily,
      weekly,
      sixMonth,
      yearly,
      ratingBreakdown: reviewsPage.summary.breakdown,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json({ error: "Could not load analytics." }, { status: 500 });
  }
}
