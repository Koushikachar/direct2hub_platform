"use client";
import { useEffect } from "react";
import { FiX } from "react-icons/fi";

const CLAUSES = [
  {
    title: "1. Digital Product",
    body: "This is a digital ebook and related bonus resources. No physical product will be shipped.",
  },
  {
    title: "2. Personal Use Only",
    body: "Your purchase is for personal use only. You may not copy, resell, redistribute, share, upload, or reproduce the ebook or bonus materials without written permission from Direct2Hub.",
  },
  {
    title: "3. No Guaranteed Results",
    body: "The information provided is for educational and informational purposes only. Ecommerce results depend on factors such as product selection, pricing, market conditions, effort, competition, and execution. Direct2Hub does not guarantee specific sales, profits, or business results.",
  },
  {
    title: "4. Accuracy of Information",
    body: "We aim to provide practical and accurate information, but marketplace rules, fees, policies, prices, and business conditions may change over time.",
  },
  {
    title: "5. Access & Downloads",
    body: "Once your details are submitted, access to the digital product is delivered instantly on this site. Each link allows a limited number of downloads; after the limit is reached, the file can no longer be downloaded from that link.",
  },
  {
    title: "6. Refunds",
    body: "Due to the digital nature of the product and instant access after submission, refunds may not be available once the ebook has been accessed, except where required by applicable law.",
  },
  {
    title: "7. Intellectual Property",
    body: "All content, designs, worksheets, calculators, and materials included in The Ecommerce Playbook remain the intellectual property of Direct2Hub.",
  },
  {
    title: "8. Updates",
    body: "Direct2Hub may update or modify these Terms & Conditions when necessary.",
  },
];

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function TermsModal({ open, onClose }: TermsModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-brick-950">Terms and conditions</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full text-brick-700 hover:bg-black/5"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-brick-800">
          <p>By submitting your details for The Ecommerce Playbook from Direct2Hub, you agree to the following:</p>
          {CLAUSES.map((c) => (
            <div key={c.title}>
              <p className="mb-1 font-semibold text-brick-950">{c.title}</p>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
