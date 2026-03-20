import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";

const uuid = () => crypto.randomUUID();

// ユーザー（管理画面のログイン用）
export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(uuid),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  password: text("password"), // bcrypt ハッシュ（Credentials ログイン用、OAuth ユーザーは null）
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ロール定義
export const roles = sqliteTable("roles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(uuid),
  name: text("name").notNull().unique(),
  description: text("description"),
});

// Auth.js 用: OAuth アカウント
export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]
);

// Auth.js 用: セッション
export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

// Auth.js 用: メール認証トークン（Magic Link 等）
export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

// ユーザーとロールの紐付け（多対多）
export const userRoles = sqliteTable(
  "user_roles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] })]
);

// LINE公式アカウント設定
export const lineChannels = sqliteTable("line_channels", {
  id: text("id")
    .primaryKey()
    .$defaultFn(uuid),
  channelId: text("channel_id").notNull().unique(),
  channelSecret: text("channel_secret").notNull(),
  accessToken: text("access_token").notNull(),
  tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// LINEチャネルとコンテンツ管理者の紐付け（多対多）
export const lineChannelContentAdmins = sqliteTable(
  "line_channel_content_admins",
  {
    lineChannelId: text("line_channel_id")
      .notNull()
      .references(() => lineChannels.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.lineChannelId, t.userId] })]
);

// AIプロバイダ設定（LINEチャネルに紐付け）
export const aiProviders = sqliteTable("ai_providers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(uuid),
  lineChannelId: text("line_channel_id")
    .notNull()
    .references(() => lineChannels.id, { onDelete: "cascade" })
    .unique(),
  provider: text("provider").notNull(), // 'openai' | 'anthropic' | 'google'
  apiKeyEncrypted: text("api_key_encrypted").notNull(),
  model: text("model").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// システムプロンプト（LINEチャネルに紐付け）
export const prompts = sqliteTable("prompts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(uuid),
  lineChannelId: text("line_channel_id")
    .notNull()
    .references(() => lineChannels.id, { onDelete: "cascade" })
    .unique(),
  systemPrompt: text("system_prompt").notNull().default(""),
  contextTurns: integer("context_turns").notNull().default(15),
  summaryMessageCount: integer("summary_message_count").notNull().default(20),
  maxResponseChars: integer("max_response_chars").notNull().default(5000),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// 料金プラン
export const plans = sqliteTable("plans", {
  id: text("id")
    .primaryKey()
    .$defaultFn(uuid),
  name: text("name").notNull(),
  monthlyPrice: integer("monthly_price").notNull(),
  apiUsageLimitRatio: integer("api_usage_limit_ratio").notNull().default(50), // 50 = 50%
  stripePriceId: text("stripe_price_id"), // Stripe Price ID（課金有効時のみ使用）
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// 課金契約（LINEチャネルに紐付け）
export const subscriptions = sqliteTable("subscriptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(uuid),
  lineChannelId: text("line_channel_id")
    .notNull()
    .references(() => lineChannels.id, { onDelete: "cascade" })
    .unique(),
  planId: text("plan_id")
    .notNull()
    .references(() => plans.id),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  billingStartDate: integer("billing_start_date", { mode: "timestamp" }),
  status: text("status").notNull().default("active"), // 'active' | 'cancelled' | 'past_due'
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// API使用量
export const apiUsage = sqliteTable("api_usage", {
  id: text("id")
    .primaryKey()
    .$defaultFn(uuid),
  lineChannelId: text("line_channel_id")
    .notNull()
    .references(() => lineChannels.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// 会話セッション
export const conversations = sqliteTable("conversations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(uuid),
  lineChannelId: text("line_channel_id")
    .notNull()
    .references(() => lineChannels.id, { onDelete: "cascade" }),
  lineUserId: text("line_user_id").notNull(),
  summary: text("summary"), // 要約（1つのみ保持）
  lastMessageAt: integer("last_message_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// メッセージ履歴
export const messages = sqliteTable("messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(uuid),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// 監査ログ
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(uuid),
  userId: text("user_id").references(() => users.id),
  action: text("action").notNull(),
  resource: text("resource"),
  resourceId: text("resource_id"),
  details: text("details"), // JSON
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// システム設定（課金ON/OFF等）
export const systemSettings = sqliteTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Webhookイベント（冪等性のため）
export const webhookEvents = sqliteTable("webhook_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(uuid),
  webhookEventId: text("webhook_event_id").notNull().unique(),
  lineChannelId: text("line_channel_id").notNull(),
  processedAt: integer("processed_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
