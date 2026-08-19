export type TranslationDisplayLine={
  text:string;
  indent:number;
  kind:"lyric"|"repeat"|"ellipsis"|"blank";
};

export type TranslationDisplaySection={
  number:number|null;
  lines:TranslationDisplayLine[];
};

const BURMESE_DIGITS:Record<string,string>={"၀":"0","၁":"1","၂":"2","၃":"3","၄":"4","၅":"5","၆":"6","၇":"7","၈":"8","၉":"9"};

export function toArabicDigits(value:string):string {
  return value.replace(/[၀-၉]/g,digit=>BURMESE_DIGITS[digit]??digit);
}

function leadingTabs(value:string):number {
  return value.match(/^\t*/)?.[0].length??0;
}

function lineKind(text:string):TranslationDisplayLine["kind"]{
  const trimmed=text.trim();
  if(!trimmed)return "blank";
  if(trimmed==="...")return "ellipsis";
  if(/^ထပ်ဆို(?:\s|$)/.test(trimmed))return "repeat";
  return "lyric";
}

function displayLine(raw:string,stripLeadingTabs=true):TranslationDisplayLine {
  const indent=leadingTabs(raw);
  const text=stripLeadingTabs?raw.replace(/^\t+/,""):raw;
  return {text,indent,kind:lineKind(text)};
}

export function parseNumberedTranslationLines(rawLines:string[]):TranslationDisplaySection[]{
  const sections:TranslationDisplaySection[]=[];
  let current:TranslationDisplaySection|null=null;
  for(const raw of rawLines){
    const match=raw.match(/^\s*([၀-၉0-9]+)[။.]\s*(.*)$/);
    if(match){
      if(current)sections.push(current);
      current={number:Number(toArabicDigits(match[1])),lines:[displayLine(match[2])]};
    }else if(current){
      current.lines.push(displayLine(raw));
    }else if(raw.trim()){
      current={number:null,lines:[displayLine(raw)]};
    }
  }
  if(current)sections.push(current);
  return sections;
}

export function parseNewYpTranslationLines(rawLines:string[]):TranslationDisplaySection[]{
  const sections:TranslationDisplaySection[]=[];
  let current:TranslationDisplaySection|null=null;
  const push=()=>{if(current){sections.push(current);current=null;}};

  for(const raw of rawLines){
    const match=raw.match(/^\s*([၀-၉0-9]+)[။.]\s*(.*)$/);
    if(match){
      push();
      current={number:Number(toArabicDigits(match[1])),lines:[displayLine(match[2])]};
      continue;
    }
    if(!current)current={number:null,lines:[]};
    current.lines.push(displayLine(raw));
  }
  push();
  return sections.filter(section=>section.lines.some(line=>line.kind!=="blank"));
}

export function lyricLineCount(section:TranslationDisplaySection):number {
  return section.lines.filter(line=>line.kind==="lyric").length;
}
