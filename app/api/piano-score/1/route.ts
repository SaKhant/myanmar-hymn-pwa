export async function GET(){
  try{
    const response=await fetch("https://www.hymnal.net/Hymns/Hymnal/svg/e0001_p.svg",{next:{revalidate:60*60*24*30}});
    if(!response.ok)return new Response("Piano source unavailable",{status:404});
    const svg=await response.text();
    return new Response(svg,{headers:{"Content-Type":"image/svg+xml; charset=utf-8","Cache-Control":"public, s-maxage=2592000, stale-while-revalidate=604800"}});
  }catch{
    return new Response("Unable to load piano score",{status:502});
  }
}
