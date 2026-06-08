import { NextResponse } from "next/server";
import { getGlobalLeaderboard } from "@/lib/db";

export async function GET() {
  return NextResponse.json(getGlobalLeaderboard());
}
