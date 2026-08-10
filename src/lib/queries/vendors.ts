import "server-only";
import { prisma } from "@/lib/prisma";
export async function getVendorMasters(){
  const rows=await prisma.vendor.findMany({orderBy:{name:"asc"},include:{_count:{select:{purchaseOrders:true,expenses:true}},purchaseOrders:{take:1,orderBy:{date:"desc"},select:{date:true,poNo:true,grandTotal:true}}}});
  return rows.map((v)=>({...v,purchaseOrders:v.purchaseOrders.map((p)=>({...p,grandTotal:Number(p.grandTotal)}))}));
}
export type VendorMasterItem=Awaited<ReturnType<typeof getVendorMasters>>[number];
