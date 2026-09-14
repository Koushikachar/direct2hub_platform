"use client";
import { useEffect, useState, type FormEvent } from "react";
import { FaStar } from "react-icons/fa";
import type { ReviewView, ReviewsSummary } from "@/lib/types";

interface ReviewsProps {
  initialReviews: ReviewView[];
  initialSummary: ReviewsSummary;
  initialCursor: string | null;
}

const TOKEN_PREFIX = "d2h-review-token:";
const tokenKey = (id: string) => `${TOKEN_PREFIX}${id}`;

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5 text-ember-500" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <FaStar key={i} size={size} className={i <= Math.round(value) ? "" : "text-brick-700/15"} />
      ))}
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

function timeAgo(iso: string): string {
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

export default function Reviews({ initialReviews, initialSummary, initialCursor }: ReviewsProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [summary, setSummary] = useState(initialSummary);
  const [cursor, setCursor] = useState(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [myTokens, setMyTokens] = useState<Record<string, string>>({});

  // Load this browser's own edit tokens once on mount.
  useEffect(() => {
    const found: Record<string, string> = {};
    for (const r of reviews) {
      const token = typeof window !== "undefined" ? window.localStorage.getItem(tokenKey(r.id)) : null;
      if (token) found[r.id] = token;
    }
    setMyTokens((prev) => ({ ...found, ...prev }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/reviews?cursor=${encodeURIComponent(cursor)}`);
      const data = await res.json();
      setReviews((prev) => [...prev, ...data.reviews]);
      setCursor(data.nextCursor);
      const found: Record<string, string> = {};
      for (const r of data.reviews as ReviewView[]) {
        const token = window.localStorage.getItem(tokenKey(r.id));
        if (token) found[r.id] = token;
      }
      setMyTokens((prev) => ({ ...prev, ...found }));
    } finally {
      setLoadingMore(false);
    }
  }

  function handleSubmitted(review: ReviewView, editToken: string) {
    window.localStorage.setItem(tokenKey(review.id), editToken);
    setMyTokens((prev) => ({ ...prev, [review.id]: editToken }));
    setReviews((prev) => [review, ...prev]);
    setSummary((prev) => {
      const count = prev.count + 1;
      const sum = prev.average * prev.count + review.rating;
      const key = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
      return {
        average: Math.round((sum / count) * 10) / 10,
        count,
        breakdown: { ...prev.breakdown, [key]: prev.breakdown[key] + 1 },
      };
    });
    setFormOpen(false);
  }

  function handleUpdated(updated: ReviewView, oldRating: number) {
    setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (updated.rating !== oldRating) {
      setSummary((prev) => {
        const sum = prev.average * prev.count - oldRating + updated.rating;
        const oldKey = Math.min(5, Math.max(1, Math.round(oldRating))) as 1 | 2 | 3 | 4 | 5;
        const newKey = Math.min(5, Math.max(1, Math.round(updated.rating))) as 1 | 2 | 3 | 4 | 5;
        return {
          average: prev.count ? Math.round((sum / prev.count) * 10) / 10 : 0,
          count: prev.count,
          breakdown: {
            ...prev.breakdown,
            [oldKey]: Math.max(0, prev.breakdown[oldKey] - 1),
            [newKey]: prev.breakdown[newKey] + 1,
          },
        };
      });
    }
  }

  function handleDeleted(id: string, rating: number) {
    window.localStorage.removeItem(tokenKey(id));
    setMyTokens((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setSummary((prev) => {
      const count = Math.max(0, prev.count - 1);
      const sum = prev.average * prev.count - rating;
      const key = Math.min(5, Math.max(1, Math.round(rating))) as 1 | 2 | 3 | 4 | 5;
      return {
        average: count ? Math.round((sum / count) * 10) / 10 : 0,
        count,
        breakdown: { ...prev.breakdown, [key]: Math.max(0, prev.breakdown[key] - 1) },
      };
    });
  }

  return (
    <section className="mt-10 sm:mt-12">
      <div className="card p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold text-brick-950 sm:text-2xl">Customer reviews</h2>

        <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex flex-col items-start gap-1 sm:items-center sm:border-r sm:border-brick-700/10 sm:pr-8">
            <span className="font-display text-4xl font-bold text-brick-950">{summary.average.toFixed(1)}</span>
            <Stars value={summary.average} size={16} />
            <span className="text-sm text-brick-700/70">{summary.count} reviews</span>
          </div>

          <div className="space-y-1.5">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = summary.breakdown[star] || 0;
              const pct = summary.count ? Math.round((count / summary.count) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs text-brick-700/70">
                  <span className="w-3">{star}</span>
                  <FaStar size={10} className="text-ember-500" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-brick-700/10">
                    <div className="h-full rounded-full bg-ember-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setFormOpen((v) => !v)}
          className="mt-6 rounded-lg border border-ember-600 px-4 py-2 text-sm font-semibold text-ember-600 transition hover:bg-ember-600/10"
        >
          {formOpen ? "Cancel" : "Write a review"}
        </button>

        {formOpen && <ReviewForm onSubmitted={handleSubmitted} />}

        <ul className="mt-8 space-y-6 divide-y divide-brick-700/10">
          {reviews.map((r) => (
            <ReviewItem
              key={r.id}
              review={r}
              editToken={myTokens[r.id]}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </ul>

        {cursor && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="mt-6 w-full rounded-lg border border-brick-700/15 py-2.5 text-sm font-medium text-brick-800 transition hover:bg-brick-950/5 disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : "Load more reviews"}
          </button>
        )}
      </div>
    </section>
  );
}

function ReviewItem({
  review,
  editToken,
  onUpdated,
  onDeleted,
}: {
  review: ReviewView;
  editToken?: string;
  onUpdated: (updated: ReviewView, oldRating: number) => void;
  onDeleted: (id: string, rating: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(review.name);
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSave() {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rating, comment, editToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update your review.");
      onUpdated(data.review, review.rating);
      setEditing(false);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not update your review.");
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete your review? This can't be undone.")) return;
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete your review.");
      onDeleted(review.id, review.rating);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not delete your review.");
    }
  }

  if (editing) {
    return (
      <li className="pt-6 first:pt-0">
        <div className="space-y-3 rounded-xl border border-ember-600/30 bg-cream/60 p-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => setRating(i)}
                aria-label={`${i} star${i > 1 ? "s" : ""}`}
                className="text-ember-500"
              >
                <FaStar size={20} className={i <= rating ? "" : "text-brick-700/15"} />
              </button>
            ))}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="w-full rounded-lg border border-brick-700/20 bg-white px-3 py-2 text-sm outline-none ring-ember-500/40 focus:ring-2"
          />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={600}
            rows={3}
            className="w-full rounded-lg border border-brick-700/20 bg-white px-3 py-2 text-sm outline-none ring-ember-500/40 focus:ring-2"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={status === "loading"}
              className="rounded-lg bg-ember-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember-500 disabled:opacity-60"
            >
              {status === "loading" ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border border-brick-700/20 px-4 py-2 text-sm text-brick-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="pt-6 first:pt-0">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ember-600/10 text-xs font-semibold text-ember-600">
          {initials(review.name) || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-brick-950">{review.name}</span>
            <span className="text-xs text-brick-700/60">{timeAgo(review.createdAt)}</span>
            {editToken && <span className="text-xs font-medium text-ember-600">· Your review</span>}
          </div>
          <Stars value={review.rating} />
          <p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-brick-800">
            {review.comment}
          </p>
          {editToken && (
            <div className="mt-2 flex gap-3 text-xs font-medium">
              <button onClick={() => setEditing(true)} className="text-ember-600 hover:underline">
                Edit
              </button>
              <button onClick={handleDelete} className="text-brick-700/60 hover:underline">
                Delete
              </button>
            </div>
          )}
          {error && !editing && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </li>
  );
}

function ReviewForm({ onSubmitted }: { onSubmitted: (review: ReviewView, editToken: string) => void }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rating, comment, website: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't submit your review.");
      onSubmitted(data.review, data.editToken);
      setName("");
      setRating(5);
      setComment("");
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't submit your review.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-xl border border-brick-700/10 bg-cream/60 p-4 sm:p-5">
      <div>
        <label className="mb-1 block text-xs font-medium text-brick-700/80">Your rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              type="button"
              key={i}
              onClick={() => setRating(i)}
              onMouseEnter={() => setHoverRating(i)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`${i} star${i > 1 ? "s" : ""}`}
              className="text-ember-500"
            >
              <FaStar size={22} className={i <= (hoverRating || rating) ? "" : "text-brick-700/15"} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-brick-700/80">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="Your name"
          className="w-full rounded-lg border border-brick-700/20 bg-white px-3 py-2.5 text-sm text-brick-950 outline-none ring-ember-500/40 focus:ring-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-brick-700/80">Review</label>
        <textarea
          required
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={600}
          rows={3}
          placeholder="What did you think?"
          className="w-full rounded-lg border border-brick-700/20 bg-white px-3 py-2.5 text-sm text-brick-950 outline-none ring-ember-500/40 focus:ring-2"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        disabled={status === "loading"}
        className="rounded-lg bg-ember-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ember-500 disabled:opacity-60"
      >
        {status === "loading" ? "Submitting…" : "Submit review"}
      </button>

      <p className="text-xs text-brick-700/50">
        You'll be able to edit or delete this review later from this browser.
      </p>
    </form>
  );
}
