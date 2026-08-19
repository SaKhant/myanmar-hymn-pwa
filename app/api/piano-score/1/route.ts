import { getHymn } from "@/lib/hymns/data";

const PIANO_SOURCE="https://www.hymnal.net/Hymns/Hymnal/svg/e0001_p.svg";

function escapeXml(value:string):string {
  return value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
}

function escapeRegExp(value:string):string {
  return value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
}

function replaceTspanText(svg:string,english:string,myanmar:string):string {
  const pattern=new RegExp(`(<tspan>)\\s*${escapeRegExp(english.trim())}\\s*(<\\/tspan>)`);
  return svg.replace(pattern,`$1${escapeXml(myanmar)}$2`);
}

function replaceSyllables(svg:string,englishSyllables:string[],myanmarSyllables:string[]):string {
  if(englishSyllables.length!==myanmarSyllables.length)return svg;
  return englishSyllables.reduce((current,english,index)=>replaceTspanText(current,english,myanmarSyllables[index]),svg);
}

function removeLyricHyphens(svg:string,y:string):string {
  const escapedY=escapeRegExp(y);
  const pattern=new RegExp(`<g transform="translate\\(([-\\d.]+), ${escapedY}\\)">\\s*<rect x="0\\.0000" y="-0\\.5714"[\\s\\S]*?<\\/g>`,`g`);
  return svg.replace(pattern,"");
}

function increaseLowerVerseLineSpacing(svg:string):string {
  const yMap:Record<string,string>={
    "56.2578":"56.7578",
    "59.2578":"60.2578",
    "62.2578":"63.7578",
    "70.2578":"70.7578",
    "73.2578":"74.2578",
    "76.2578":"77.7578",
    "84.2578":"84.7578",
    "87.2578":"88.2578",
    "90.2578":"91.7578",
    "98.2578":"98.7578",
    "101.2578":"102.2578",
    "104.2578":"105.7578",
    "112.2578":"112.7578",
    "115.2578":"116.2578",
    "118.2578":"119.7578",
  };
  for(const [from,to] of Object.entries(yMap)){
    svg=svg.replaceAll(`translate(62.1172, ${from})`,`translate(62.1172, ${to})`);
  }
  return svg;
}

function localizePianoSvg(source:string):string {
  const hymn=getHymn("hymns","my","1");
  if(!hymn)return source;
  const verses=hymn.sections.filter(section=>section.type==="verse");
  if(verses.length<6)return source;

  // Hymnal.net E1 places the first verse syllable-by-syllable under the notes.
  // Keep every original x/y lyric anchor and swap only the text at those anchors.
  const firstSystemEnglish=["Glo","ry","be","to","God","the","Fa","ther,","And","to","Christ","the","Son,"];
  const firstSystemMyanmar=["ခ","မည်း","တော်","ဘု","ရား","ဘုန်း","ကြီး","စေ၊","သား","တော်","ဘုန်း","ကြီး","စေ"];
  const secondSystemEnglish=["Glo","ry","to","the","Hol","y","Spir","it—","Ev","er","One."];
  const secondSystemMyanmar=["သန့်","ရှင်း","ဝိ","ညာဉ်","တော်","ဘုန်း","ကြီး","စေ၊","ထာ","ဝ","ရ။"];

  let svg=replaceSyllables(source,firstSystemEnglish,firstSystemMyanmar);
  svg=replaceSyllables(svg,secondSystemEnglish,secondSystemMyanmar);

  // English syllable hyphens no longer correspond to Burmese orthography.
  svg=removeLyricHyphens(svg,"31.5821");
  svg=removeLyricHyphens(svg,"43.8057");

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

  svg=increaseLowerVerseLineSpacing(svg);

  svg=svg
    .replace('width="215.90mm" height="279.40mm" viewBox="0.0000 -0.0000 153.5737 198.7425"','width="153.5737" height="123.5000" viewBox="0 0 153.5737 123.5" preserveAspectRatio="xMidYMin meet"')
    .replace('<tspan>Glory be to God the Father</tspan>',`<tspan>${escapeXml(hymn.title||hymn.first_line||"Myanmar Hymn 1")}</tspan>`)
    .replace('<tspan>Blessing of the Trinity — His Plan</tspan>','<tspan></tspan>')
    .replace(/font-family="serif"/g,'font-family="Myanmar Text, Noto Sans Myanmar, sans-serif"')
    .replace(/<g transform="translate\(69\.8408, 191\.9677\)">[\s\S]*?<\/g>/,"" );

  svg=svg.replace("</style>","</style><rect x=\"0\" y=\"0\" width=\"153.5737\" height=\"123.5\" fill=\"#fff\"/>");
  return svg;
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
