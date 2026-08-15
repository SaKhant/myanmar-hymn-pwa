import type { GuitarArrangement, GuitarLine } from "../../guitar-types";

const chorus:GuitarLine[]=[
  {segments:[{text:"ချီးမွမ်းကြစို့၊ ",chord:"D"},{text:"ချီးမွမ်းကြစို့"}],phraseBreaks:[1]},
  {segments:[{text:"သုံးပါးတစ်ပါးအား",chord:"D"},{text:"ချီးမွမ်း",chord:"A"}]},
  {segments:[{text:"ဘုန်းကြီးတော်မူသော ",chord:"D"},{text:"ဘုရားရှင်"}],phraseBreaks:[1]},
  {segments:[{text:"ကျွန်ုပ်တွက် အံ့ဖွယ်ရာ",chord:"D"},{text:"များ",chord:"A"},{text:"ပြုပေး။",chord:"D"}],phraseBreaks:[1]},
];

export const hymnSevenArrangement:GuitarArrangement={
  myanmarHymnNumber:7,englishSourceNumber:7,originalKey:"Eb Major",originalKeyDisplay:"E♭",playKey:"D",capo:1,timeSignature:"4/4",meter:"8.7.8.7. with chorus.",chordsUsed:["D","Em","A7","G","A"],status:"reviewed",
  verses:[
    {number:1,lines:[
      {segments:[{text:"ဘုန်းကြီးပါစေသော ",chord:"D"},{text:"ခမည်းတော်",chord:"Em"}]},
      {segments:[{text:"ဘုန်းကြီးပါစေသော ",chord:"A7"},{text:"သားတော်",chord:"D"}]},
      {segments:[{text:"ဘုန်းကြီးပါစေသော ",chord:"D"},{text:"ဝိညာဉ်တော်",chord:"G"}],phraseBreaks:[1]},
      {segments:[{text:"ဘုန်းကြီးစေ ",chord:"D"},{text:"သုံး",chord:"A"},{text:"ပါး",chord:"A7"},{text:"တစ်ပါး။",chord:"D"}]},
    ]},
    {type:"chorus",number:null,lines:chorus},
    {number:2,lines:[
      {segments:[{text:"ကြံစည်ရှိ အဖအား ",chord:"D"},{text:"ချီးမွမ်း",chord:"Em"}]},
      {segments:[{text:"လုပ်ဆောင်သောသားအား ",chord:"A7"},{text:"ချီးမွမ်း",chord:"D"}]},
      {segments:[{text:"ဖြန့်ဖြူးပေးဝိညာဉ်တော် ",chord:"D"},{text:"ချီးမွမ်း",chord:"G"}],phraseBreaks:[1]},
      {segments:[{text:"သုံးပါးတစ်",chord:"D"},{text:"ပါးအား ",chord:"A"},{text:"ချီး",chord:"A7"},{text:"မွမ်း။",chord:"D"}]},
    ]},
    {type:"chorus",number:null,lines:chorus},
  ],
};
