import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { brotliDecompressSync } from "node:zlib";

const ROOT = process.cwd();
const blobCache = new Map();

function resolvePartBlob(folder, name) {
  const cacheKey = `${folder}/${name}`;
  if (blobCache.has(cacheKey)) return blobCache.get(cacheKey);
  const text = readFileSync(resolve(ROOT, "lib/hymns", folder, name), "utf8");
  const imports = [...text.matchAll(/from\s+"\.(\/[^"]+)"/g)].map((match) => match[1].slice(1));
  let blob;
  if (imports.length > 0) {
    blob = imports.map((imported) => resolvePartBlob(folder, imported.endsWith(".ts") ? imported : `${imported}.ts`)).join("");
  } else {
    const match = text.match(/export default\s+(["'])([\s\S]*?)\1/);
    if (!match) throw new Error(`No encoded blob found in ${folder}/${name}`);
    blob = match[2];
  }
  blobCache.set(cacheKey, blob);
  return blob;
}

function decodeParts(folder, names) {
  const encoded = names.map((name) => resolvePartBlob(folder, name)).join("");
  return JSON.parse(brotliDecompressSync(Buffer.from(encoded, "base64")).toString("utf8"));
}

function lyricsText(sections) {
  return sections
    .map((section) => {
      const heading = section.type === "verse" ? String(section.number ?? "") : "Chorus";
      return [heading, ...section.lines].filter(Boolean).join("\n");
    })
    .join("\n\n");
}

function expand(record, defaults) {
  const sections = record.s.map(([type, number, text]) => ({
    type: type === "v" ? "verse" : "chorus",
    number,
    lines: text.split(defaults.splitPattern),
  }));
  const firstLine = sections.flatMap((section) => section.lines).find(Boolean) ?? null;
  return {
    id: String(record.n),
    number: record.n,
    collection: defaults.collection,
    language: defaults.language,
    title: firstLine,
    first_line: firstLine,
    theme: record.t ?? null,
    page_heading: `#${record.n}`,
    metadata: defaults.metadata?.(record) ?? {},
    cross_references: defaults.crossReferences?.(record) ?? {},
    audio_url: null,
    sections,
    source_file: defaults.sourceFile(record),
    lyrics_text: lyricsText(sections),
  };
}

const matuNames = ["part01","part02","part03","part04","part05","part06","part07","part08","part09","part10","part11"].map((name)=>`${name}.ts`);
const kachinNames = ["part01","part02","part03","part04","part05","part06","part07","part08","part09","part10","part11","part12","part13","part14","part15","part16"].map((name)=>`${name}.ts`);

const matuRecords = decodeParts("matu-parts", matuNames).map((record) =>
  expand(record, {
    collection: "matu_hymns",
    language: "matu",
    splitPattern: "\n",
    metadata: (r) => (r.r ? { Scripture: r.r } : {}),
    crossReferences: (r) => ({ Myanmar: String(r.n), ...(r.e ? { Eng: String(r.e) } : {}) }),
    sourceFile: (r) => `mthymns/${r.n}.html`,
  }),
);

const kachinRecords = decodeParts("kachin-parts", kachinNames).map((record) =>
  expand(record, {
    collection: "kachin_hymns",
    language: "kachin",
    splitPattern: /\n+/,
    crossReferences: (r) => ({ ...(r.m ? { Myanmar: String(r.m) } : {}), ...(r.e ? { Eng: String(r.e) } : {}) }),
    sourceFile: (r) => `kchymns/${r.n}.html`,
  }),
);

for (const [name, records] of [["matu_hymns", matuRecords], ["kachin_hymns", kachinRecords]]) {
  writeFileSync(
    resolve(ROOT, "hymn_dataset", `${name}.json`),
    `${JSON.stringify(records, null, 2)}\n`,
  );
  const numbers = records.map((r) => r.number);
  console.log(`${name}.json: ${records.length} hymns (#${Math.min(...numbers)} – #${Math.max(...numbers)})`);
}
