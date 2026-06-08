import { NextResponse } from "next/server";
import { getHyvStatus } from "@/lib/hyv";

export async function GET() {
  return NextResponse.json(getHyvStatus());
}
