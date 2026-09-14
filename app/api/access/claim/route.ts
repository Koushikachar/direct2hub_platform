import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateDeviceToken, deviceCookieName } from "@/lib/tokens";

// This only ever runs once per submission — the *first* request to the
// access page for a paid link that has no deviceToken yet gets redirected
// here (see app/access/[token]/page.tsx). We generate a per-device secret,
// save it on the submission, and set it as an httpOnly cookie before
// bouncing back to the access page. From then on the page can tell "the
// person who unlocked this" apart from anyone else who gets sent the same
// URL.
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const token = searchParams.get("token") || "";

  if (!token) {
    return NextResponse.redirect(new URL("/", origin));
  }

  const destination = new URL(`/access/${encodeURIComponent(token)}`, origin);

  try {
    const submission = await prisma.submission.findUnique({ where: { accessToken: token } });
    if (!submission || submission.paymentStatus !== "paid") {
      return NextResponse.redirect(destination);
    }

    const deviceToken = generateDeviceToken();

    // Only claim if it's genuinely still unclaimed — guards against a race
    // between two near-simultaneous first requests (e.g. two tabs) ever
    // claiming the link with two different secrets.
    const claimed = await prisma.submission.updateMany({
      where: { id: submission.id, deviceToken: null },
      data: { deviceToken },
    });

    const res = NextResponse.redirect(destination);
    if (claimed.count > 0) {
      res.cookies.set(deviceCookieName(submission.id), deviceToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }
    return res;
  } catch (err) {
    console.error("Access claim error:", err);
    return NextResponse.redirect(destination);
  }
}
