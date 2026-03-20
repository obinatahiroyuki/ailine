import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  lineChannels,
  lineChannelContentAdmins,
  plans,
  subscriptions,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";
import { getBillingEnabled } from "@/lib/billing";
import { isSystemAdmin } from "@/lib/auth";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enabled = await getBillingEnabled();
  if (!enabled) {
    return NextResponse.json(
      { error: "課金は無効です" },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const lineChannelId = searchParams.get("channelId");
  const planId = searchParams.get("planId");

  if (!lineChannelId || !planId) {
    return NextResponse.json(
      { error: "channelId と planId が必要です" },
      { status: 400 }
    );
  }

  const [ch] = await db
    .select()
    .from(lineChannels)
    .where(eq(lineChannels.id, lineChannelId));

  if (!ch) {
    return NextResponse.json({ error: "チャネルが見つかりません" }, { status: 404 });
  }

  const sysAdmin = isSystemAdmin(session);
  const [adminLink] = await db
    .select()
    .from(lineChannelContentAdmins)
    .where(
      and(
        eq(lineChannelContentAdmins.lineChannelId, lineChannelId),
        eq(lineChannelContentAdmins.userId, session.user.id)
      )
    );

  if (!adminLink && !sysAdmin) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, planId));

  if (!plan?.stripePriceId) {
    return NextResponse.json(
      { error: "このプランはStripeの設定がありません" },
      { status: 400 }
    );
  }

  const [existingSub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.lineChannelId, lineChannelId));

  if (existingSub?.stripeSubscriptionId && existingSub.status === "active") {
    return NextResponse.json(
      { error: "既にサブスクリプションがあります" },
      { status: 400 }
    );
  }

  if (!stripe) {
    return NextResponse.json(
      { error: "Stripeが設定されていません" },
      { status: 500 }
    );
  }

  const baseUrl =
    process.env.NEXTAUTH_URL ??
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

  try {
    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: `${baseUrl}/admin/channels/${lineChannelId}?stripe=success`,
      cancel_url: `${baseUrl}/admin/channels/${lineChannelId}?stripe=cancel`,
      client_reference_id: lineChannelId,
      metadata: {
        lineChannelId,
        planId,
        userId: session.user.id,
      },
      subscription_data: {
        metadata: { lineChannelId, planId },
      },
    };

    if (existingSub?.stripeCustomerId) {
      checkoutParams.customer = existingSub.stripeCustomerId;
    } else {
      checkoutParams.customer_email = session.user.email ?? undefined;
    }

    const stripeSession = await stripe.checkout.sessions.create(checkoutParams);

    return NextResponse.json({
      url: stripeSession.url,
    });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "チェックアウトの作成に失敗しました" },
      { status: 500 }
    );
  }
}
