# Guitar arrangement workflow

Reviewed arrangements used by the app live as individual TypeScript modules under
`lib/hymns/guitar/arrangements/`. The production index imports only arrangements
whose status is `reviewed`.

Development preparation data is generated here and is never imported by a client
component. To inspect a real dataset range:

```bash
node scripts/generate-guitar-batch.mjs 2 20
npm run guitar:validate
```

The script resolves every source through the Myanmar record's exact
`cross_references.Eng`, checks the corresponding official hymnal.net page, and
records source metadata and chord availability. Generated entries default to
`needs-review`; they contain no Myanmar chord anchors and cannot enable Guitar
mode. A reviewer must create explicit Myanmar text segments, verify every chord
change against the melody, set the arrangement to `reviewed`, and add its module
to the production index. Missing or ambiguous sources are `unavailable`.

No PDF, SVG, audio, English lyrics, or other external lead-sheet asset is stored.
