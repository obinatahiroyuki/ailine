/**
 * 初期データ投入スクリプト
 * 実行: npm run db:seed
 */
import "../lib/env";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../lib/db";
import { roles, users, userRoles, plans, systemSettings } from "../lib/db/schema";

const SYSTEM_ADMIN_ROLE_ID = "system_admin";
const CONTENT_ADMIN_ROLE_ID = "content_admin";

async function seed() {
  console.log("🌱 シードを開始します...");

  // ロールを投入（存在しない場合のみ）
  const existingRoles = await db.select().from(roles);

  if (existingRoles.length === 0) {
    await db.insert(roles).values([
      {
        id: SYSTEM_ADMIN_ROLE_ID,
        name: "system_admin",
        description: "システム管理者",
      },
      {
        id: CONTENT_ADMIN_ROLE_ID,
        name: "content_admin",
        description: "コンテンツ管理者",
      },
    ]);
    console.log("✅ ロールを投入しました");
  } else {
    console.log("⏭️ ロールは既に存在します");
  }

  // INITIAL_ADMIN_EMAIL が設定されている場合、初回管理者を作成
  const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL;
  const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD;
  if (initialAdminEmail) {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, initialAdminEmail));

    if (existingUser.length === 0) {
      const userId = crypto.randomUUID();
      const passwordHash = initialAdminPassword
        ? await bcrypt.hash(initialAdminPassword, 10)
        : null;
      await db.insert(users).values({
        id: userId,
        email: initialAdminEmail,
        name: "システム管理者",
        password: passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await db.insert(userRoles).values({
        userId,
        roleId: SYSTEM_ADMIN_ROLE_ID,
      });
      console.log(
        `✅ 初回管理者を登録しました: ${initialAdminEmail}${passwordHash ? "（パスワード付き）" : ""}`
      );
    } else if (initialAdminPassword) {
      // 既存ユーザーにパスワードを設定
      const passwordHash = await bcrypt.hash(initialAdminPassword, 10);
      await db
        .update(users)
        .set({ password: passwordHash, updatedAt: new Date() })
        .where(eq(users.email, initialAdminEmail));
      console.log(`✅ 初回管理者のパスワードを更新しました: ${initialAdminEmail}`);
  } else {
    console.log("⏭️ 初回管理者は既に存在します");
    }
  }

  // プランを投入（存在しない場合のみ）
  const existingPlans = await db.select().from(plans);
  const standardPriceId = process.env.STRIPE_PRICE_ID_STANDARD || null;
  const proPriceId = process.env.STRIPE_PRICE_ID_PRO || null;
  const userStandardPriceId =
    process.env.STRIPE_PRICE_ID_USER_STANDARD || null;
  const userProPriceId = process.env.STRIPE_PRICE_ID_USER_PRO || null;

  if (existingPlans.length === 0) {
    await db.insert(plans).values([
      {
        name: "スタンダード",
        monthlyPrice: 3000,
        apiUsageLimitRatio: 50,
        stripePriceId: standardPriceId,
        planType: "channel",
      },
      {
        name: "プロ",
        monthlyPrice: 10000,
        apiUsageLimitRatio: 50,
        stripePriceId: proPriceId,
        planType: "channel",
      },
      {
        name: "ユーザー向け ライト",
        monthlyPrice: 500,
        apiUsageLimitRatio: 0,
        stripePriceId: userStandardPriceId,
        planType: "user",
      },
      {
        name: "ユーザー向け スタンダード",
        monthlyPrice: 1000,
        apiUsageLimitRatio: 0,
        stripePriceId: userProPriceId,
        planType: "user",
      },
    ]);
    console.log("✅ プランを投入しました");
  } else {
    for (const p of existingPlans) {
      const priceId =
        p.planType === "user"
          ? p.name.includes("ライト")
            ? userStandardPriceId
            : userProPriceId
          : p.name === "スタンダード"
            ? standardPriceId
            : p.name === "プロ"
              ? proPriceId
              : null;
      if (priceId) {
        await db
          .update(plans)
          .set({ stripePriceId: priceId, updatedAt: new Date() })
          .where(eq(plans.id, p.id));
      }
    }
    const userPlans = existingPlans.filter((p) => p.planType === "user");
    if (userPlans.length === 0) {
      await db.insert(plans).values([
        {
          name: "ユーザー向け ライト",
          monthlyPrice: 500,
          apiUsageLimitRatio: 0,
          stripePriceId: userStandardPriceId,
          planType: "user",
        },
        {
          name: "ユーザー向け スタンダード",
          monthlyPrice: 1000,
          apiUsageLimitRatio: 0,
          stripePriceId: userProPriceId,
          planType: "user",
        },
      ]);
      console.log("✅ ユーザー向けプランを追加しました");
    } else if (standardPriceId || proPriceId) {
      console.log("✅ プランの Stripe Price ID を更新しました");
    } else {
      console.log("⏭️ プランは既に存在します");
    }
  }

  // 課金設定（デフォルト無効）
  const [billingSetting] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, "billing_enabled"));
  if (!billingSetting) {
    await db.insert(systemSettings).values({
      key: "billing_enabled",
      value: "false",
      updatedAt: new Date(),
    });
    console.log("✅ 課金設定を初期化しました（デフォルト: 無効）");
  }

  console.log("🎉 シードが完了しました");
}

seed().catch(console.error).finally(() => process.exit(0));
