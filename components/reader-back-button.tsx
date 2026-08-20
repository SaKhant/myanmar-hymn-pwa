"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function ReaderBackButton({
  fallback,
  label,
}: {
  fallback: string;
  label: string;
}) {
  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.replace(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="focus-ring mb-6 inline-flex items-center gap-2 rounded-lg text-xs font-semibold text-[var(--muted)]"
    >
      <ArrowLeft size={15} />
      {label}
    </button>
  );
}