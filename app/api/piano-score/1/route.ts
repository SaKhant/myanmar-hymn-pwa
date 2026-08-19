import { getHymn } from "@/lib/hymns/data";

const PIANO_SOURCE="https://www.hymnal.net/Hymns/Hymnal/svg/e0001_p.svg";

function escapeXml(value:string):string {
  return value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
}

function escapeRegExp(value:string):string {
  return value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
}

function replaceTspanText(svg:string,english:string,myanmar:string):string {
  const pattern=new RegExp(`(<tspan>)\\s*${escapeRegExp(english.trim())}\\s*(<\\/tspan>)`,"g");
  return svg.replace(pattern,`$1${escapeXml(myanmar)}$2`);
}

function removeSerifTextRow(svg:string,y:string):string {
  const escapedY=escapeRegExp(y);
  const pattern=new RegExp(`<g transform="translate\\(([-\\d.]+), ${escapedY}\\)">\\s*<text font-family="serif"[\\s\\S]*?<\\/text>\\s*<\\/g>`,`g`);
  return svg.replace(pattern,"");
}

function myanmarText(x:number,y:number,text:string,size=2.18):string {
  return `<g transform="translate(${x.toFixed(4)}, ${y.toFixed(4)})"><text font-family="Myanmar Text, Noto Sans Myanmar, sans-serif" font-size="${size.toFixed(4)}" text-anchor="start" fill="#111"><tspan>${escapeXml(text)}</tspan></text></g>`;
}

function localizePianoSvg(source:string):string {
  const hymn=getHymn("hymns","my","1");
  if(!hymn)return source;
  const verses=hymn.sections.filter(section=>section.type==="verse");
  if(verses.length<6)return source;

  // Remove the syllabified English first verse first, while its original serif markers are intact.
  let svg=removeSerifTextRow(source,"31.5821");
  svg=removeSerifTextRow(svg,"43.8057");

  const englishVerses=[
    ["Glory be to God the Father,","And to Christ the Son,","Glory to the Holy Spirit—","Ever One."],
    ["As we view the vast creation,","Planned with wondrous skill,","So our hearts would move to worship,","And be still."],
    ["But, our God, how great Thy yearning","To have sons who love","In the Son e’en now to praise Thee,","Love to prove!"],
    ["’Twas Thy thought in revelation,","To present to men","Secrets of Thine own affections,","Theirs to win."],
    ["So in Christ, through His redemption","(Vanquished evil powers!)","Thou hast brought, in new creation,","Worshippers!"],
    ["Glory be to God the Father,","And to Christ the Son,","Glory to the Holy Spirit—","Ever One."],
  ];

  for(let verseIndex=1;verseIndex<englishVerses.length;verseIndex++){
    englishVerses[verseIndex].forEach((english,lineIndex)=>{
      const burmese=verses[verseIndex]?.lines[lineIndex];
      if(burmese)svg=replaceTspanText(svg,english,burmese);
    });
  }

  svg=svg
    .replace('width="215.90mm" height="279.40mm" viewBox="0.0000 -0.0000 153.5737 198.7425"','width="153.5737" height="123.5000" viewBox="0 0 153.5737 123.5" preserveAspectRatio="xMidYMin meet"')
    .replace('<tspan>Glory be to God the Father</tspan>',`<tspan>${escapeXml(hymn.title||hymn.first_line||"Myanmar Hymn 1")}</tspan>`)
    .replace('<tspan>Blessing of the Trinity — His Plan</tspan>','<tspan></tspan>')
    .replace(/font-family="serif"/g,'font-family="Myanmar Text, Noto Sans Myanmar, sans-serif"')
    .replace(/<g transform="translate\(69\.8408, 191\.9677\)">[\s\S]*?<\/g>/,"" );

  const first=verses[0].lines;
  const overlay=[
    myanmarText(18.2,31.65,first[0]||"",2.05),
    myanmarText(91.0,31.65,first[1]||"",2.05),
    myanmarText(18.2,43.88,first[2]||"",2.05),
    myanmarText(116.0,43.88,first[3]||"",2.05),
  ].join("");

  svg=svg.replace("</style>","</style><rect x=\"0\" y=\"0\" width=\"153.5737\" height=\"123.5\" fill=\"#fff\"/>");
  return svg.replace("</svg>",`${overlay}</svg>`);
}

export async function GET(){
  try{
    const response=await fetch(PIANO_SOURCE,{next:{revalidate:60*60*24*30}});
    if(!response.ok)return new Response("Piano source unavailable",{status:404});
    const svg=localizePianoSvg(await response.text());
    return new Response(svg,{headers:{"Content-Type":"image/svg+xml; charset=utf-8","Cache-Control":"public, s-maxage=2592000, stale-while-revalidate=604800"}});
  }catch{
    return new Response("Unable to load piano score",{status:502});
  }
}
