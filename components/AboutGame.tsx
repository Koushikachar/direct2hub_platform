"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaLock, FaCheck, FaGift } from "react-icons/fa";

interface Chapter {
  id: number;
  label: string;
  teaser: string;
  image: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    label: "Chapter 01 · Foundations",
    teaser: "The 4 questions every winning product idea has to survive — before you spend a rupee sourcing it.",
    image: "/uploads/pdf-preview/page-01.jpg",
  },
  {
    id: 2,
    label: "Chapter 02 · Sourcing",
    teaser: "How to vet a supplier in under 10 minutes, and the 3 red flags that should make you walk away.",
    image: "/uploads/pdf-preview/page-02.jpg",
  },
  {
    id: 3,
    label: "Chapter 03 · Pricing & Profit",
    teaser: "The exact formula to price for Amazon, Flipkart & Meesho without quietly losing money on fees.",
    image: "/uploads/pdf-preview/page-03.jpg",
  },
];

export default function AboutGame({ pdfSizeKb = 422, totalPages = 86 }: { pdfSizeKb?: number; totalPages?: number }) {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const unlockedCount = useMemo(() => Object.values(flipped).filter(Boolean).length, [flipped]);
  const allUnlocked = unlockedCount === CHAPTERS.length;

  function toggle(id: number) {
    setFlipped((f) => ({ ...f, [id]: !f[id] }));
  }

  return (
    <div className="space-y-8">
      {/* progress */}
      <div className="mx-auto max-w-md text-center">
        <p className="mb-2 text-sm font-medium text-brick-700/70 dark:text-cream/60">
          Tap each card to preview a chapter — {unlockedCount}/{CHAPTERS.length} explored
        </p>
        <div className="flex items-center justify-center gap-2">
          {CHAPTERS.map((c) => (
            <span
              key={c.id}
              className={`progress-dot h-2.5 w-2.5 rounded-full ${
                flipped[c.id] ? "scale-125 bg-ember-600" : "bg-brick-700/20 dark:bg-white/15"
              }`}
            />
          ))}
        </div>
      </div>

      {/* flip cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {CHAPTERS.map((chapter) => {
          const isFlipped = !!flipped[chapter.id];
          return (
            <button
              key={chapter.id}
              type="button"
              onClick={() => toggle(chapter.id)}
              aria-label={`Preview ${chapter.label}`}
              className={`flip-card relative h-72 w-full text-left focus:outline-none ${isFlipped ? "is-flipped" : ""}`}
            >
              <div className="flip-card-inner h-full w-full">
                {/* front */}
                <div className="flip-card-face game-glow overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
                  <div className="relative h-full w-full">
                    <Image src={chapter.image} alt={chapter.label} fill sizes="320px" className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ember-300">{chapter.label}</p>
                      <p className="mt-1 text-sm font-semibold text-white">Tap to reveal the takeaway →</p>
                    </div>
                  </div>
                </div>
                {/* back */}
                <div className="flip-card-face flip-card-back card flex h-full flex-col justify-between p-5">
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ember-600">
                      <FaCheck className="h-3 w-3" /> {chapter.label}
                    </p>
                    <p className="text-sm leading-relaxed text-brick-800 dark:text-cream/80">{chapter.teaser}</p>
                  </div>
                  <p className="text-xs text-brick-700/50 dark:text-cream/40">Tap again to flip back</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* locked full playbook reveal */}
      <div
        className={`card relative mx-auto max-w-xl overflow-hidden p-6 text-center transition-all duration-500 sm:p-8 ${
          allUnlocked ? "game-glow" : ""
        }`}
      >
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-ember-600/10 text-ember-600">
          {allUnlocked ? <FaGift className="h-6 w-6" /> : <FaLock className="h-6 w-6" />}
        </div>
        {allUnlocked ? (
          <>
            <h3 className="font-display text-xl font-bold text-ember-600">You've unlocked the preview 🎉</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-brick-700/75 dark:text-cream/65">
              That's just 3 of {totalPages} pages. The full playbook ({Math.round(pdfSizeKb / 1024) || 1}MB+) has the
              complete product list, calculator, and launch plan waiting inside.
            </p>
          </>
        ) : (
          <>
            <h3 className="font-display text-xl font-bold">{CHAPTERS.length - unlockedCount} more chapter(s) to preview</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-brick-700/70 dark:text-cream/60">
              Explore every card above to see what's really inside the {totalPages}-page playbook.
            </p>
          </>
        )}
        <Link
          href="/price"
          className="mt-5 inline-block rounded-full bg-ember-600 px-7 py-3 font-semibold text-white shadow-lg shadow-ember-600/30 transition hover:-translate-y-0.5 hover:bg-ember-500"
        >
          Unlock the full playbook — ₹199
        </Link>
      </div>
    </div>
  );
}
