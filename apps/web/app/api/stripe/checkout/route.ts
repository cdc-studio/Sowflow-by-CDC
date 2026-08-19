import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { getAuthUserId } from "@/lib/authUser";

export const runtime = "nodejs";

const PLAN_PRICE_ENV: Record<string, string> = {
  starter: "STRIPE_PRICE_ID_STARTER",
  pro: "STRIPE_PRICE_ID_PRO",
  enterprise: "STRIPE_PRICE_ID_ENTERPRISE",
};

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(secretKey);
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const plan = typeof body?.plan === "string" ? body.plan : undefined;
  const envKey = plan ? PLAN_PRICE_ENV[plan] : undefined;
  const priceId = envKey ? process.env[envKey] : undefined;

  if (!priceId) {
    return NextResponse.json({ error: "Unknown or unconfigured plan" }, { status: 400 });
  }

  try {
    const stripe = getStripeClient();
    const user = await currentUser();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
    // "always" (default) matches typical SaaS practice and avoids trial abuse;
    // flip to false to let Checkout skip card collection while $0 is due.
    const requiresCard = process.env.STRIPE_TRIAL_REQUIRES_CARD !== "false";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      customer_email: user?.emailAddresses[0]?.emailAddress,
      subscription_data: {
        trial_period_days: 7,
        metadata: { ownerId: userId },
      },
      payment_method_collection: requiresCard ? "always" : "if_required",
      success_url: `${appUrl}/dashboard/settings/billing?checkout=success`,
      cancel_url: `${appUrl}/dashboard/settings/billing?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout session creation failed", error);
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 502 });
  }
}
