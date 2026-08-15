const MYANMAR_MARK_RANK: Record<string, number> = {
  "\u103b": 10, "\u103c": 11, "\u103d": 12, "\u103e": 13,
  "\u1031": 20,
  "\u102b": 30, "\u102c": 31,
  "\u102d": 40, "\u102e": 41, "\u102f": 42, "\u1030": 43, "\u1032": 44,
  "\u1036": 50, "\u103a": 60, "\u1037": 70, "\u1038": 80,
};

function normalizeMyanmarMarkOrder(value: string): string {
  return value
    .replace(/[\u200b-\u200d\ufeff\ufe00-\ufe0f]/gu, "")
    .replace(/[\u102b-\u103a]+/gu, marks => {
      if (marks.includes("\u1039")) return marks;
      return Array.from(marks)
        .map((mark, index) => ({ mark, index, rank: MYANMAR_MARK_RANK[mark] ?? 100 }))
        .sort((a, b) => a.rank - b.rank || a.index - b.index)
        .map(item => item.mark)
        .join("");
    });
}

export function normalizeSearchText(value: unknown): string {
  return normalizeMyanmarMarkOrder(String(value ?? "")
    .normalize("NFC")
    .toLocaleLowerCase())
    .replace(/\s+/gu, " ")
    .trim();
}

export function normalizeTitlePrefix(value: unknown): string {
  return normalizeSearchText(value);
}

export function normalizeHymnNumberQuery(value: unknown): string | undefined {
  const normalized = normalizeSearchText(value);
  if (!/^[0-9၀-၉]+$/u.test(normalized)) return undefined;
  return normalized.replace(/[၀-၉]/gu, digit => String(digit.codePointAt(0)! - 0x1040));
}
