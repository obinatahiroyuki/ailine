import "../lib/env";
import { db } from "../lib/db";
import { users, userRoles } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const email = process.env.INITIAL_ADMIN_EMAIL ?? "obinata@bois-mc.com";

async function check() {
  const user = await db.select().from(users).where(eq(users.email, email));
  if (user.length === 0) {
    console.log(`❌ ${email} は未登録です`);
    return;
  }
  console.log(`✅ ${email} は登録済みです`);
  console.log("  ユーザーID:", user[0].id);
  const roles = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, user[0].id));
  console.log("  ロール:", roles.map((r) => r.roleId).join(", ") || "なし");
}

check().then(() => process.exit(0)).catch(console.error);
