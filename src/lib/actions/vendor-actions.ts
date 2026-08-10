"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, fail, ok, zodError } from "@/lib/actions/action-utils";

const schema = z.object({
  code: z.string().trim().max(40).optional().nullable(),
  name: z.string().trim().min(1).max(200),
  contactPerson: z.string().trim().max(150).optional().nullable(),
  phone: z.string().trim().max(60).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  address: z.string().trim().max(1000).optional().nullable(),
  gstin: z.string().trim().max(20).optional().nullable(),
  pan: z.string().trim().max(20).optional().nullable(),
});
const clean = <T extends Record<string, any>>(data:T) => Object.fromEntries(Object.entries(data).map(([k,v])=>[k,v === "" ? null : v])) as T;
function refresh(){ revalidatePath("/vendors"); revalidatePath("/purchase-orders"); }
export async function createVendorMaster(input:z.infer<typeof schema>){ const {user,error}=await authorize("purchase_orders","create"); if(!user)return error; const parsed=schema.safeParse(input); if(!parsed.success)return zodError(parsed.error); try{const record=await prisma.vendor.create({data:clean(parsed.data)}); refresh(); return ok(record);}catch(e){return fail(e instanceof Error?e.message:"Could not create vendor.");}}
export async function updateVendorMaster(id:string,input:z.infer<typeof schema>){ const {user,error}=await authorize("purchase_orders","edit"); if(!user)return error; const parsed=schema.safeParse(input); if(!parsed.success)return zodError(parsed.error); const record=await prisma.vendor.update({where:{id},data:clean(parsed.data)}); refresh(); return ok(record);}
export async function deleteVendorMaster(id:string){ const {user,error}=await authorize("purchase_orders","delete"); if(!user)return error; const used=await prisma.purchaseOrder.count({where:{vendorId:id}}); if(used>0)return fail("Vendor is linked to purchase orders and cannot be deleted. Keep the master for history."); await prisma.vendor.delete({where:{id}}); refresh(); return ok(undefined);}
