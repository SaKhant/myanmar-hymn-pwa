import { readFileSync, writeFileSync } from "node:fs";

const primary = JSON.parse(readFileSync("hymn_dataset/myanmar_hymns.json", "utf8"));
const hymnByNumber = new Map(
  [...primary]
    .filter((hymn) => Number.isInteger(hymn.number) && hymn.number >= 1 && hymn.number <= 700)
    .map((hymn) => [hymn.number, hymn]),
);

const range = (start, end) => Array.from({ length: end - start + 1 }, (_, index) => start + index);
const numbers = (...parts) => parts.flatMap((part) => Array.isArray(part) ? part : [part]);

const original = [
  ["သုံးပါးတစ်ပါးဘုရားကို ကောင်းချီးပေးခြင်း", range(1, 9), 3],
  ["ခမည်းတော်ကို ကိုးကွယ်ခြင်း", range(10, 56), 3],
  ["သခင်ဘုရားကို ချီးမွမ်းခြင်း", range(57, 140), 3, 4],
  ["ဝိညာဉ်တော်နှင့် ပြည့်ဝခြင်း", range(141, 167), 4],
  ["ကယ်တင်ခြင်းစိတ်ချမှုနှင့် ဝမ်းမြောက်ခြင်း", range(168, 205), 4],
  ["တောင့်တခြင်းများ", range(206, 243), 4, 5],
  ["ဆက်ကပ်အပ်နှံခြင်း", range(244, 272), 5],
  ["ခရစ်တော်နှင့် ပေါင်းစည်းခြင်း", range(273, 283), 5],
  ["ခရစ်တော်ကို တွေ့ကြုံခံစားခြင်း", range(284, 358), 5, 6],
  ["ဘုရားသခင်ကို တွေ့ကြုံခံစားခြင်း", range(359, 368), 6],
  ["ကားတိုင်၌ ဘုန်းထင်ရှားခြင်း", range(369, 371), 6],
  ["ကားတိုင်လမ်း", range(372, 376), 6],
  ["ရှင်ပြန်ထမြောက်ခြင်းအသက်တာ", [377], 6],
  ["ခွန်အားပေးခြင်း", range(378, 386), 6],
  ["ဒုက္ခဆင်းရဲ၌ နှစ်သိမ့်မှုပေးခြင်း", range(387, 402), 6],
  ["အတွင်းအသက်တာ၏ ပုံပန်းသဏ္ဌာန်အမျိုးမျိုး", range(403, 408), 6, 7],
  ["အနာရောဂါငြိမ်းစေခြင်း", [409], 7],
  ["ဆုတောင်းခြင်း", range(410, 419), 7],
  ["နှုတ်ကပတ်တော်ကို လေ့လာခြင်း", range(420, 426), 7],
  ["အသင်းတော်", range(427, 459), 7],
  ["စုဝေးခြင်းများ", range(460, 467), 7],
  ["ဝိညာဉ်ရေးရာတိုက်ပွဲ", range(468, 480), 7, 8],
  ["အစေခံခြင်း", range(481, 488), 8],
  ["ဧဝံဂေလိတရားဟောပြောခြင်း", range(489, 496), 8],
  ["ဗတ္တိဇံ", range(497, 498), 8],
  ["နိုင်ငံတော်", range(499, 501), 8],
  ["ဘုန်းတော်မျှော်လင့်ခြင်း", range(502, 510), 8],
  ["အဆုံးစွန်ဘုန်းထင်ရှားခြင်း", range(511, 516), 8],
  // The book places the Scripture-song block immediately after the gospel block;
  // keeping it as a final subcategory here produces the photographed total of 55 cards.
  ["ဧဝံဂေလိတရား", range(517, 560), 8, 9],
];

const supplement = [
  ["သခင်ဘုရားကို ချီးမွမ်းခြင်း", numbers(range(561, 564), range(576, 587), range(647, 648)), 9],
  ["ဝိညာဉ်တော်နှင့် ပြည့်ဝခြင်း", numbers(range(588, 589), 649), 9],
  ["ကယ်တင်ခြင်းစိတ်ချမှုနှင့် ဝမ်းမြောက်ခြင်း", range(650, 651), 9],
  ["တောင့်တခြင်းများ", numbers(range(590, 591), range(652, 655)), 9],
  ["ဆက်ကပ်အပ်နှံခြင်း", [592, 656], 9],
  ["ခရစ်တော်နှင့် ပေါင်းစည်းခြင်း", [593, 657], 9],
  ["ခရစ်တော်ကို တွေ့ကြုံခံစားခြင်း", numbers(570, range(594, 599), range(658, 668)), 9, 10],
  ["ဘုရားသခင်ကို တွေ့ကြုံခံစားခြင်း", [571, 669, 670], 10],
  ["ကားတိုင်လမ်း", [600], 10],
  ["ခွန်အားပေးခြင်း", [601, 671, 672], 10],
  ["ဒုက္ခဆင်းရဲ၌ နှစ်သိမ့်မှုပေးခြင်း", [602, 673], 10],
  ["အတွင်းအသက်တာ၏ ပုံပန်းသဏ္ဌာန်အမျိုးမျိုး", numbers(565, 572, range(603, 608)), 10],
  ["ဆုတောင်းခြင်း", range(609, 614), 10],
  ["နှုတ်ကပတ်တော်ကို လေ့လာခြင်း", range(615, 618), 10],
  ["ဘုရားသခင်၏ နှုတ်ကပတ်တော်", range(674, 675), 10],
  ["အသင်းတော်", numbers(range(566, 567), range(573, 574), range(619, 627), range(676, 687)), 10, 11],
  ["ဝိညာဉ်ရေးရာတိုက်ပွဲ", numbers(range(628, 630), range(688, 691)), 11],
  ["အစေခံခြင်း", range(631, 633), 11],
  ["ဧဝံဂေလိဟောပြောခြင်း", numbers(range(634, 636), 692), 11],
  ["ဗတ္တိဇံ", [637], 11],
  ["သခင်ဘုရား၏နေ့", range(638, 639), 11],
  ["နိုင်ငံတော်", [640, 693], 11],
  ["ဘုန်းတော်မျှော်လင့်ခြင်း", numbers(575, range(641, 642), range(694, 698)), 11],
  ["အဆုံးစွန်ဘုန်းထင်ရှားခြင်း", range(643, 646), 11],
  ["ဧဝံဂေလိတရား", [568, 569, 699], 11],
  ["ဧဝံဂေလိတရားဟောပြောခြင်း", [700], 11],
];

const forcedSubcategories = new Map([
  [7, [
    ["မေတ္တာဖြင့် ဆွဲဆောင်ခြင်း", range(244, 247), true],
    ["သခင်ဘုရားဖြင့် ဆွဲဆောင်ခြင်း", [248], true],
    ["သခင်ဘုရားထံ ခွဲခြားခံရခြင်း", range(249, 250)],
    ["သခင်ဘုရားထံ အလုံးစုံအပ်နှံခြင်း", range(251, 255)],
    ["အားလုံးယဇ်ပလ္လင်ပေါ်", [256]],
    ["သခင်ဘုရားထံ ပေးအပ်ထားခြင်း", range(257, 260)],
    ["သခင်ဘုရားအတွက် အသက်ရှင်ခြင်း", range(261, 262)],
    ["သခင်ဘုရားထံ နောက်တော်လိုက်ခြင်း", range(263, 264)],
    ["သခင်ဘုရားကို အစေခံခြင်း", range(265, 267)],
    ["သခင်ဘုရား၏ အုပ်စိုးခြင်းကိုသိကျွမ်းခြင်း", range(268, 269)],
    ["သခင်ဘုရားနှင့်အတူ စစ်တိုက်ခြင်း", range(270, 271)],
    ["သခင်ဘုရား၌ အရာအားလုံးကိုပိုင်ဆိုင်ခြင်း", [272]],
  ]],
  [29, [["ကျမ်းပိုဒ်သီချင်းများ", range(556, 560), true]]],
  [38, [["ကားတိုင်၏အဓိပ္ပာယ်", [600]]]],
  [39, [
    ["ခရစ်တော်ကို ဆင်ခြင်ရန်", [601]],
    ["အသန့်ရှင်းဆုံးဌာနသို့ ဝင်ရောက်ခြင်းအတွက်", [671, 672], true],
  ]],
]);

function clean(text) {
  return text
    .replace(/^Hymns,\s*#\d+\s*/u, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function themeSuffix(theme) {
  const cleaned = clean(theme || "");
  const separator = cleaned.search(/[–—-]/u);
  return separator >= 0 ? clean(cleaned.slice(separator + 1)) : "အထွေထွေ";
}

function keyFor(title) {
  return title
    .replace(/[၊။'"“”‘’\s]/gu, "")
    .replace(/နှင့်/gu, "နှင့်")
    .replace(/ဂရုဏာ/gu, "ကရုဏာ")
    .replace(/ခရစ်တော(?!်)/gu, "ခရစ်တော်")
    .replace(/ခွဲံ/gu, "ခွဲ")
    .toLowerCase();
}

function reference(number) {
  const hymn = hymnByNumber.get(number);
  if (!hymn) throw new Error(`Missing Myanmar hymn ${number}`);
  return { number, first_line: hymn.first_line || null };
}

function slugify(title, index) {
  return `book-${String(index).padStart(2, "0")}-${Buffer.from(title).toString("hex").slice(0, 16)}`;
}

function makeSubcategories(categoryNumber, selectedNumbers) {
  const selected = new Set(selectedNumbers);
  const forced = forcedSubcategories.get(categoryNumber) || [];
  const result = [];

  for (const [title, hymnNumbers, needsReview = false] of forced) {
    const included = hymnNumbers.filter((number) => selected.delete(number));
    if (!included.length) continue;
    result.push({ title, hymnNumbers: included, needsReview });
  }

  const grouped = new Map();
  for (const number of selectedNumbers) {
    if (!selected.has(number)) continue;
    const title = themeSuffix(hymnByNumber.get(number)?.theme);
    const key = keyFor(title);
    const group = grouped.get(key) || { title, hymnNumbers: [], needsReview: false };
    group.hymnNumbers.push(number);
    grouped.set(key, group);
  }
  result.push(...grouped.values());

  return result
    .sort((a, b) => Math.min(...a.hymnNumbers) - Math.min(...b.hymnNumbers))
    .map((group, index) => ({
      slug: `topic-${String(index + 1).padStart(2, "0")}`,
      title: group.title,
      ...(group.needsReview ? { needs_review: true } : {}),
      hymns: group.hymnNumbers.sort((a, b) => a - b).map(reference),
    }));
}

const definitions = [...original, ...supplement];
if (definitions.length !== 55) throw new Error(`Expected 55 categories, found ${definitions.length}`);

const categories = definitions.map(([title, hymnNumbers, ...pages], index) => {
  const categoryNumber = index + 1;
  const sortedNumbers = [...new Set(hymnNumbers)].sort((a, b) => a - b);
  return {
    slug: slugify(title, categoryNumber),
    category: `${categoryNumber}. ${title}`,
    hymns: sortedNumbers.map(reference),
    subcategories: makeSubcategories(categoryNumber, sortedNumbers),
    source_file: `physical-book-contents-pages-${pages.join("-")}`,
  };
});

const assigned = categories.flatMap((category) => category.hymns.map((hymn) => hymn.number));
const missing = range(1, 700).filter((number) => !assigned.includes(number));
const duplicates = [...new Set(assigned.filter((number, index) => assigned.indexOf(number) !== index))];
if (missing.length || duplicates.length) {
  throw new Error(`Category coverage failed; missing=${missing.join(",")} duplicates=${duplicates.join(",")}`);
}

writeFileSync("hymn_dataset/categories.book-draft.json", `${JSON.stringify(categories, null, 2)}\n`);
console.log(`Created 55 categories, ${categories.reduce((sum, category) => sum + category.subcategories.length, 0)} subcategories, and ${assigned.length} unique hymn references.`);
