import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  lineChannels,
  lineChannelContentAdmins,
  aiProviders,
  prompts,
  channelDocuments,
  users,
  subscriptions,
  plans,
  userRoles,
} from "@/lib/db/schema";
import { eq, and, isNotNull, ne, desc } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiProviderForm } from "./ai-form";
import { PromptForm } from "./prompt-form";
import { DocumentsSection } from "./documents-section";
import { isSystemAdmin } from "@/lib/auth";
import { ChannelAdminsSection } from "./channel-admins";
import { SubscriptionSection } from "./subscription-section";
import { getBillingEnabled } from "@/lib/billing";
import { ROLE_SYSTEM_ADMIN } from "@/lib/auth";

/** Webhook URL のベース。本番は NEXTAUTH_URL を優先（VERCEL_URL はプレビューでも変わるため） */
function getWebhookBaseUrl() {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }
  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export default async function ChannelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id } = await params;
  const systemAdmin = isSystemAdmin(session);

  const [adminLink] = await db
    .select()
    .from(lineChannelContentAdmins)
    .where(
      and(
        eq(lineChannelContentAdmins.lineChannelId, id),
        eq(lineChannelContentAdmins.userId, session.user.id)
      )
    );

  if (!adminLink && !systemAdmin) {
    notFound();
  }

  const [ch] = await db
    .select()
    .from(lineChannels)
    .where(eq(lineChannels.id, id));

  if (!ch) {
    notFound();
  }

  const channelAdmins = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(lineChannelContentAdmins)
    .innerJoin(users, eq(lineChannelContentAdmins.userId, users.id))
    .where(eq(lineChannelContentAdmins.lineChannelId, id));

  const [aiProvider] = await db
    .select({ provider: aiProviders.provider, model: aiProviders.model })
    .from(aiProviders)
    .where(eq(aiProviders.lineChannelId, id));

  const [prompt] = await db
    .select()
    .from(prompts)
    .where(eq(prompts.lineChannelId, id));

  const documents = await db
    .select({
      id: channelDocuments.id,
      filename: channelDocuments.filename,
      contentType: channelDocuments.contentType,
      createdAt: channelDocuments.createdAt,
    })
    .from(channelDocuments)
    .where(eq(channelDocuments.lineChannelId, id))
    .orderBy(desc(channelDocuments.createdAt));

  const billingEnabled = await getBillingEnabled();

  let isExempt = false;
  if (billingEnabled) {
    for (const a of channelAdmins) {
      const roles = await db
        .select({ roleId: userRoles.roleId })
        .from(userRoles)
        .where(eq(userRoles.userId, a.id));
      if (roles.some((r) => r.roleId === ROLE_SYSTEM_ADMIN)) {
        isExempt = true;
        break;
      }
    }
  }

  const [sub] = await db
    .select({
      status: subscriptions.status,
      planId: subscriptions.planId,
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
    })
    .from(subscriptions)
    .where(eq(subscriptions.lineChannelId, id));

  const [plan] = sub
    ? await db
        .select({ name: plans.name, monthlyPrice: plans.monthlyPrice })
        .from(plans)
        .where(eq(plans.id, sub.planId))
    : [null];

  const plansWithStripe = await db
    .select({
      id: plans.id,
      name: plans.name,
      monthlyPrice: plans.monthlyPrice,
    })
    .from(plans)
    .where(and(isNotNull(plans.stripePriceId), ne(plans.stripePriceId, "")));

  const baseUrl = getWebhookBaseUrl();
  const webhookUrl = `${baseUrl}/api/webhook/line/${ch.channelId}`;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/channels"
          className="text-sm text-neutral-500 hover:text-neutral-700"
        >
          ← チャネル一覧
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">
        チャネル設定
      </h1>

      <div className="space-y-6">
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 font-medium text-neutral-900">基本情報</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-neutral-500">チャネルID</dt>
              <dd className="font-mono">{ch.channelId}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">登録日</dt>
              <dd>{new Date(ch.createdAt).toLocaleDateString("ja-JP")}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h2 className="mb-3 font-medium text-amber-900">
            このチャネル用 Webhook URL
          </h2>
          <p className="mb-2 text-sm text-amber-800">
            LINE Developers の Messaging API 設定で、以下のURLをそのままコピーして Webhook URL に登録してください。
          </p>
          <code className="block break-all rounded bg-amber-100 px-3 py-3 text-sm text-amber-900">
            {webhookUrl}
          </code>
          <div className="mt-4 rounded bg-amber-100/50 p-3 text-xs text-amber-900">
            <p className="font-medium mb-2">登録手順:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>LINE Developers コンソール（<a href="https://developers.line.biz/console/" target="_blank" rel="noopener noreferrer" className="underline">developers.line.biz/console</a>）にログイン</li>
              <li>該当チャネルのプロバイダーを選択</li>
              <li>「Messaging API」タブを開く</li>
              <li>「Webhook URL」欄に上記URLを貼り付け</li>
              <li>「検証」ボタンで接続を確認</li>
              <li>「Webhookの利用」をオンにする</li>
            </ol>
          </div>
        </div>

        <AiProviderForm
          lineChannelId={id}
          existing={aiProvider ?? null}
        />

        <DocumentsSection
          lineChannelId={id}
          documents={documents}
        />

        {prompt && (
          <PromptForm
            lineChannelId={id}
            initial={{
              systemPrompt: prompt.systemPrompt,
              contextTurns: prompt.contextTurns,
              summaryMessageCount: prompt.summaryMessageCount,
              maxResponseChars: prompt.maxResponseChars,
            }}
          />
        )}

        {!prompt && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6">
            <p className="text-sm text-neutral-600">
              プロンプト設定はチャネル作成時に自動作成されます。表示されない場合はページを再読み込みしてください。
            </p>
          </div>
        )}

        <SubscriptionSection
          lineChannelId={id}
          billingEnabled={billingEnabled}
          isExempt={isExempt}
          subscription={
            sub && plan
              ? {
                  status: sub.status,
                  planName: plan.name,
                  monthlyPrice: plan.monthlyPrice,
                  stripeSubscriptionId: sub.stripeSubscriptionId,
                }
              : null
          }
          plans={plansWithStripe}
        />

        {systemAdmin && (
          <ChannelAdminsSection
            lineChannelId={id}
            admins={channelAdmins}
          />
        )}
      </div>
    </div>
  );
}
