import { NextResponse } from "next/server";

export async function GET() {
  const url="https://www.hymnal.net/Hymns/LongBeach/svg/lb65_g.svg";
  const response=await fetch(url,{cache:"no-store"});
  const text=await response.text();
  return new NextResponse(text.slice(0,30000),{
    status:response.ok?200:response.status,
    headers:{"content-type":"text/plain; charset=utf-8"},
  });
}
