import { NextResponse } from "next/server";
import packageJson from "../../../../package.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: packageJson.version,
  });
}
