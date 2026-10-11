import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
export const dynamic="force-dynamic";

export async function GET(){
  const configured=Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  let dbReady=false;
  if(configured){
    try {
      const db=await createClient();
      const {data,error}=await db.rpc("aos_healthcheck");
      dbReady=!error && data===true;
    } catch{ dbReady=false; }
  }
  const healthy=configured&&dbReady;
  return NextResponse.json({
    status:healthy?"ok":"setup_pending",
    checks:{authConfigured:configured,databaseReady:dbReady,paymentsEnabled:false},
    updatedAt:new Date().toISOString(),
  },{status:healthy?200:503,headers:{"cache-control":"private, no-store"}});
}
