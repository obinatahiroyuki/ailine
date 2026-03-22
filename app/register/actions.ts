"use server";

import { signIn } from "@/auth";
import { db } from "@/lib/db";
import {
  users,
  lineChannels,
  lineChannelContentAdmins,
  prompts,
  userRoles,
  plans,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { ROLE_CONTENT_ADMIN } from "@/lib/auth";
import { getBillingEnabled } from "@/lib/billing";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function registerWithBilling(formData: FormData) {
  const email = formData.get("email")?.toString()?.trim()?.toLowerCase();
  const name = formData.get("name")?.toString()?.trim();
  const password = formData.get("password")?.toString();
  const channelId = formData.get("channelId")?.toString()?.trim();
  const channelSecret = formData.get("channelSecret")?.toString()?.trim();
  const accessToken = formData.get("accessToken")?.toString()?.trim();
  const planId = formData.get("planId")?.toString()?.trim();

  if (!email || !password) return { error: "メールアドレスとパスワードは必須です" };
  if (password.length < 8) return { error: "パスワードは8文字以上で入力してください" };
  if (!channelId || !channelSecret || !accessToken) {
    return { error: "LINEチャネル情報（ID、シークレット、アクセストークン）は必須です" };
  }

  const [existingUser] = await db.select().from(users).where(eq(users.email, email));
  if (existingUser) return { error: "このメールアドレスは既に登録されています" };

  const [existingChannel] = await db
    .select()
    .from(lineChannels)
    .where(eq(lineChannels.channelId, channelId));
  if (existingChannel) return { error: "このチャネルIDは既に登録されています" };

  const billingEnabled = await getBillingEnabled();
  let needCheckout = false;
  let selectedPlanId = planId;
  if (billingEnabled) {
    if (!planId) return { error: "プランを選択してください" };
    if (!stripe) return { error: "課金設定が完了していません" };
    const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
    if (!plan?.stripePriceId) return { error: "選択したプランの課金設定がありません" };
    needCheckout = true;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(users)
      .values({
        email,
        name: name || null,
        password: passwordHash,
      })
      .returning();
    if (!user) return { error: "ユーザーの作成に失敗しました" };

    await db.insert(userRoles).values({
      userId: user.id,
      roleId: ROLE_CONTENT_ADMIN,
    });

    const [channel] = await db
      .insert(lineChannels)
      .values({
        channelId,
        channelSecret,
        accessToken,
      })
      .returning();
    if (!channel) return { error: "チャネルの作成に失敗しました" };

    await db.insert(lineChannelContentAdmins).values({
      lineChannelId: channel.id,
      userId: user.id,
    });

    await db.insert(prompts).values({
      lineChannelId: channel.id,
    });

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (needCheckout && stripe && selectedPlanId) {
      const [plan] = await db.select().from(plans).where(eq(plans.id, selectedPlanId));
      if (!plan?.stripePriceId) return { error: "プラン設定が見つかりません" };

      const baseUrl =
        process.env.NEXTAUTH_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        success_url: `${baseUrl}/admin/channels/${channel.id}?stripe=success`,
        cancel_url: `${baseUrl}/admin/channels/${channel.id}?stripe=cancel`,
        client_reference_id: channel.id,
        metadata: {
          lineChannelId: channel.id,
          planId: selectedPlanId,
          userId: user.id,
        },
        subscription_data: {
          metadata: { lineChannelId: channel.id, planId: selectedPlanId },
        },
        customer_email: email,
      });

      return { success: true, checkoutUrl: session.url };
    }

    return {
      success: true,
      redirectUrl: `/admin/channels/${channel.id}`,
    };
  } catch (err) {
    console.error(err);
    return { error: "登録に失敗しました" };
  }
}
