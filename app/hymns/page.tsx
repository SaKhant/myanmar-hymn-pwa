import { redirect } from "next/navigation";

export default async function LegacyHymnsPage({searchParams}:{searchParams:Promise<{q?:string}>}) {
  const params=await searchParams;
  const query=new URLSearchParams();
  if(params.q) query.set("q",params.q);
  redirect(query.size?`/?${query.toString()}`:"/");
}
