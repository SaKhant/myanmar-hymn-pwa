import type { ReactNode } from "react";
import MatuVersionLink from "@/components/matu-version-link";

export default function AppTemplate({ children }: { children: ReactNode }) {
  return (
    <>
      <MatuVersionLink />
      {children}
    </>
  );
}
