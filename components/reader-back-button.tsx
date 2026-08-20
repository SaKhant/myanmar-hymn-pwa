"use client";

import { useRouter } from "next/navigation";

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
      aria-label={label}
      title={label}
      className="reader-back-icon focus-ring"
    />
  );
}
