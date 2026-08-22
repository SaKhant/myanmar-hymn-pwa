# Hymn dataset

This folder holds the songbook data for the Hymn House app.
The app reads these files through `lib/hymns/data.ts`.

## App data (do not move or rename)

| File | What it is |
|---|---|
| `myanmar_hymns.json` | Myanmar main hymnal (includes recovered hymns 675–686) |
| `english_hymns.json` | English main hymnal |
| `myanmar_yp.json` | Myanmar YP songs |
| `english_yp.json` | English YP songs |
| `matu_hymns.json` | Matu hymns (decoded from the old compressed format) |
| `kachin_hymns.json` | Kachin hymns (decoded from the old compressed format) |
| `categories.json` | Myanmar book category index |

Each hymn record keeps: page heading, metadata, cross references, audio URL (when present), verse/chorus sections, and a plain `lyrics_text` field.

## Folders

| Folder | What it is |
|---|---|
| `yp-batches/` | YP songs grouped by the batch they were typed in (e.g. `myanmar_yp_195_200.json`). Merged into the main YP list at load time. |
| `backups/` | Snapshots taken before big data changes. Never read by the app. |
| `guitar/` | Guitar chord working files for scripts. Not read by the app. |
| `legacy/` | Old files kept for history (`hymn_library.csv`, `summary.json`). Not read by the app. |

## Rules for editing data

1. Never translate or invent Myanmar lyrics — the physical songbook is the only authority.
2. Take a snapshot copy into `backups/` before a big change.
3. After changing any file, run `npm run build` to confirm the app still compiles.
