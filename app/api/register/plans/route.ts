import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { and, isNotNull, ne } from "drizzle-orm";
import { getBillingEnabled } from "@/lib/billing";

export const dynamic = "force-dynamic";

export async function GET() {
  const billingEnabled = await getBillingEnabled();

  const plansWithStripe = billingEnabled
    ? await db
        .select({
          id: plans.id,
          name: plans.name,
          monthlyPrice: plans.monthlyPrice,
        })
        .from(plans)
        .where(and(isNotNull(plans.stripePriceId), ne(plans.stripePriceId, "")))
    : [];

  return NextResponse.json({
    billingEnabled,
    plans: plansWithStripe,
  });
}
