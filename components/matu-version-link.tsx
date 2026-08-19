"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const MATU_LAST_HYMN = 560;
const MATU_MISSING = new Set([284]);

function validMatuNumber(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= MATU_LAST_HYMN && !MATU_MISSING.has(value);
}

function findMyanmarNumber(kicker: Element, pathname: string): number | null {
  const myRoute = pathname.match(/^\/hymns\/my\/(\d+)$/);
  if (myRoute) return Number(myRoute[1]);

  if (/^\/hymns\/en\/\d+$/.test(pathname)) {
    const myLink = kicker.querySelector<HTMLAnchorElement>('a[href^="/hymns/my/"]');
    const match = myLink?.getAttribute("href")?.match(/^\/hymns\/my\/(\d+)$/);
    if (match) return Number(match[1]);
  }

  return null;
}

export default function MatuVersionLink() {
  const pathname = usePathname();

  useEffect(() => {
    if (!/^\/hymns\/(?:my|en)\/\d+$/.test(pathname)) return;

    const addLink = () => {
      const kicker = document.querySelector(".reader-kicker");
      if (!kicker) return false;

      const myanmarNumber = findMyanmarNumber(kicker, pathname);
      if (myanmarNumber === null || !validMatuNumber(myanmarNumber)) return false;

      const existingServerLink = kicker.querySelector<HTMLAnchorElement>(`a[href="/hymns/matu/${myanmarNumber}"]`);
      if (existingServerLink) {
        kicker.querySelectorAll('[data-matu-version="true"]').forEach((node) => node.remove());
        return true;
      }

      if (kicker.querySelector('[data-matu-version="true"]')) return true;

      const separator = document.createElement("span");
      separator.className = "reader-version-separator";
      separator.textContent = "•";
      separator.dataset.matuVersion = "true";

      const link = document.createElement("a");
      link.href = `/hymns/matu/${myanmarNumber}`;
      link.textContent = `MT${myanmarNumber}`;
      link.className = "reader-version-link focus-ring";
      link.dataset.matuVersion = "true";

      kicker.append(separator, link);
      return true;
    };

    if (addLink()) return;

    const observer = new MutationObserver(() => {
      if (addLink()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const timeout = window.setTimeout(() => observer.disconnect(), 3000);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, [pathname]);

  return null;
}
