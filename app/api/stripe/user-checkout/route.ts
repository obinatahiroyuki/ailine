import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  lineChannels,
  plans,
  channelUserSubscriptions,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/** LINEユーザー用のStripeチェックアウト（認証不要・LINEからリンク経由） */
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripeが設定されていません" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { lineChannelId, lineUserId } = body as {
    lineChannelId?: string;
    lineUserId?: string;
  };

  if (!lineChannelId || !lineUserId) {
    return NextResponse.json(
      { error: "lineChannelId と lineUserId が必要です" },
      { status: 400 }
    );
  }

  const [channel] = await db
    .select()
    .from(lineChannels)
    .where(eq(lineChannels.id, lineChannelId));

  if (!channel) {
    return NextResponse.json({ error: "チャネルが見つかりません" }, { status: 404 });
  }

  if (!channel.userPaymentRequired || !channel.userPlanId) {
    return NextResponse.json(
      { error: "このチャネルはユーザー課金を設定していません" },
      { status: 400 }
    );
  }

  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, channel.userPlanId));

  if (!plan?.stripePriceId) {
    return NextResponse.json(
      { error: "ユーザー向けプランのStripe設定がありません" },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select()
    .from(channelUserSubscriptions)
    .where(
      and(
        eq(channelUserSubscriptions.lineChannelId, lineChannelId),
        eq(channelUserSubscriptions.lineUserId, lineUserId)
      )
    );

  if (existing?.status === "active") {
    return NextResponse.json(
      { error: "既に課金済みです。LINEでメッセージを送信してご利用ください。" },
      { status: 400 }
    );
  }

  const baseUrl =
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  try {
    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: `${baseUrl}/user-payment-success?channelId=${lineChannelId}&lineUserId=${lineUserId}`,
      cancel_url: `${baseUrl}/user-payment-cancel`,
      metadata: {
        subscriptionType: "user",
        lineChannelId,
        lineUserId,
        planId: plan.id,
      },
      subscription_data: {
        metadata: {
          subscriptionType: "user",
          lineChannelId,
          lineUserId,
          planId: plan.id,
        },
      },
    };

    if (existing?.stripeCustomerId) {
      checkoutParams.customer = existing.stripeCustomerId;
    }

    const stripeSession = await stripe.checkout.sessions.create(checkoutParams);

    return NextResponse.json({ url: stripeSession.url });
  } catch (err) {
    console.error("Stripe user checkout error:", err);
    return NextResponse.json(
      { error: "チェックアウトの作成に失敗しました" },
      { status: 500 }
    );
  }
}
