import Link from "next/link";
import Image from "next/image";
import { FaBolt, FaRegLightbulb, FaChartLine, FaShieldAlt, FaStar, FaCheckCircle } from "react-icons/fa";
import Nav from "@/components/Nav";
import VideoShowcase from "@/components/VideoShowcase";
import { getProduct } from "@/lib/product";
import { getReviewsPage } from "@/lib/reviews";

export const revalidate = 60;

const FEATURES = [
  {
    icon: FaRegLightbulb,
    title: "120+ Winning Product Ideas",
    text: "Skip months of guesswork with a curated list of products that are already proven to sell.",
  },
  {
    icon: FaChartLine,
    title: "Profit & Pricing Calculator",
    text: "Know your margins before you spend a rupee — sourcing cost, fees, and profit, worked out for you.",
  },
  {
    icon: FaBolt,
    title: "30-Day Launch Plan",
    text: "A day-by-day roadmap to go from zero to your first sale on Amazon, Flipkart & Meesho.",
  },
  {
    icon: FaShieldAlt,
    title: "Beginner-Safe & Practical",
    text: "No fluff, no theory-only chapters — every page is built around what to actually do next.",
  },
];

export default async function HomePage() {
  const [product, reviewsPage] = await Promise.all([getProduct(), getReviewsPage(1, null)]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Nav logoUrl={product.logoUrl} name="Direct2hub" />

      {/* HERO */}
      <section className="hero-glow relative">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2">
          <div className="animate-fade-up space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-ember-600/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-ember-600">
              <FaStar className="h-3 w-3" /> Rated {reviewsPage.summary.average || 4.7} / 5 by real buyers
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Start, sell &amp; <span className="text-gradient">scale</span> your ecommerce business
            </h1>
            <p className="mx-auto max-w-xl text-lg text-brick-700/80 dark:text-cream/70 lg:mx-0">
              {product.tagline ||
                "A practical, beginner-friendly playbook with product ideas, pricing math, and a 30-day launch plan — everything you need to get your first sale."}
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/price"
                className="w-full rounded-full bg-ember-600 px-8 py-3.5 text-center font-semibold text-white shadow-lg shadow-ember-600/30 transition hover:-translate-y-0.5 hover:bg-ember-500 sm:w-auto"
              >
                Get the Playbook — ₹199
              </Link>
              <Link
                href="/about"
                className="w-full rounded-full border border-brick-700/20 px-8 py-3.5 text-center font-semibold text-brick-800 transition hover:bg-brick-950/5 dark:border-white/20 dark:text-cream dark:hover:bg-white/10 sm:w-auto"
              >
                Watch the story
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-sm text-brick-700/70 dark:text-cream/60 lg:justify-start">
              <span className="flex items-center gap-1.5"><FaCheckCircle className="text-ember-500" /> Instant access</span>
              <span className="flex items-center gap-1.5"><FaCheckCircle className="text-ember-500" /> 86-page playbook</span>
              <span className="flex items-center gap-1.5"><FaCheckCircle className="text-ember-500" /> One-time payment</span>
            </div>
          </div>

          <div className="animate-float relative flex justify-center">
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-ember-500/20 via-transparent to-transparent blur-2xl" />
            <VideoShowcase src={product.videoUrl || "/videos/showcase.mp4"} />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Everything you need, nothing you don&apos;t</h2>
          <p className="mt-3 text-brick-700/70 dark:text-cream/60">
            Built for people starting from zero — no prior ecommerce experience required.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card group p-6 transition hover:-translate-y-1 hover:shadow-2xl">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-ember-600/10 text-ember-600 transition group-hover:bg-ember-600 group-hover:text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 font-display text-base font-bold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-brick-700/75 dark:text-cream/60">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCT PREVIEW STRIP */}
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="card grid grid-cols-1 items-center gap-6 overflow-hidden p-6 sm:grid-cols-[auto_1fr_auto] sm:p-8">
          <div className="relative mx-auto h-28 w-44 shrink-0 overflow-hidden rounded-xl shadow-md sm:mx-0">
            <Image src={product.heroImageUrl} alt={product.title} fill sizes="176px" className="object-cover" />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-display text-xl font-bold">{product.title}</h3>
            <p className="mt-1 text-sm text-brick-700/70 dark:text-cream/60">
              By {product.learnFrom} · {reviewsPage.summary.count > 0 ? `${reviewsPage.summary.count}+ happy buyers` : "New & growing"}
            </p>
          </div>
          <Link
            href="/price"
            className="whitespace-nowrap rounded-full bg-ember-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-md transition hover:bg-ember-500"
          >
            See pricing →
          </Link>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="hero-glow card relative overflow-hidden p-10 text-center sm:p-14">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Ready to launch your <span className="text-gradient">first store</span>?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-brick-700/75 dark:text-cream/65">
            Join {reviewsPage.summary.count > 0 ? reviewsPage.summary.count : "hundreds of"} sellers who used this
            exact playbook to go from idea to their first sale.
          </p>
          <Link
            href="/price"
            className="mt-6 inline-block rounded-full bg-ember-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-ember-600/30 transition hover:-translate-y-0.5 hover:bg-ember-500"
          >
            Get instant access — ₹199
          </Link>
        </div>
      </section>

      <footer className="border-t border-black/5 px-4 py-8 text-center text-sm text-brick-700/60 dark:border-white/10 dark:text-cream/50">
        © {new Date().getFullYear()} {product.learnFrom || "Direct2hub"}. All rights reserved.
      </footer>
    </div>
  );
}
