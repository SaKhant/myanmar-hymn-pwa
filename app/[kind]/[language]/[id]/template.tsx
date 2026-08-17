import type { ReactNode } from "react";
import MatuVersionLink from "@/components/matu-version-link";

export default function ReaderTemplate({ children }: { children: ReactNode }) {
  return (
    <>
      <MatuVersionLink />
      {children}
    </>
  );
}
