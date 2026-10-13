import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("Missing required environment variable: STRIPE_SECRET_KEY");
  }

  const { amountCents } = await request.json();

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][product_data][name]": "ShopFlow order",
      "line_items[0][price_data][unit_amount]": String(amountCents),
      "line_items[0][quantity]": "1",
      mode: "payment",
      success_url: "http://localhost:3000/success",
    }),
  });

  const session = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: session.error?.message ?? "Checkout failed" }, { status: 500 });
  }

  return NextResponse.json(session);
}