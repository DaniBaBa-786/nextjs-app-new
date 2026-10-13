import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

function isAuthenticated(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  return authHeader.startsWith("Bearer ") && authHeader.slice(7).trim().length > 0;
}

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function getAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  return ALLOWED_ORIGINS.includes(origin) ? origin : null;
}

export async function GET(request: Request) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ orders: [] });

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const allowedOrigin = getAllowedOrigin(request);

  return NextResponse.json(
    { orders: data },
    {
      headers: allowedOrigin
        ? { "Access-Control-Allow-Origin": allowedOrigin }
        : {},
    },
  );
}

export async function POST(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const body = await request.json();

  const { data, error } = await supabase
    .from("orders")
    .insert({
      customer_id: body.customerId,
      total_cents: body.totalCents,
      status: body.status ?? "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ order: data });
}

export async function DELETE(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  const { error } = await supabase.from("orders").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
