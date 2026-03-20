import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const lineChannelId = session.metadata?.lineChannelId ?? sub.metadata?.lineChannelId;
          const planId = session.metadata?.planId ?? sub.metadata?.planId;

          if (lineChannelId && planId) {
            const [existing] = await db
              .select()
              .from(subscriptions)
              .where(eq(subscriptions.lineChannelId, lineChannelId));

            const values = {
              planId,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: sub.id,
              billingStartDate: new Date(),
              status: "active" as const,
              updatedAt: new Date(),
            };

            if (existing) {
              await db
                .update(subscriptions)
                .set(values)
                .where(eq(subscriptions.lineChannelId, lineChannelId));
            } else {
              await db.insert(subscriptions).values({
                lineChannelId,
                ...values,
              });
            }
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const lineChannelId = sub.metadata?.lineChannelId;

        if (lineChannelId) {
          const status =
            sub.status === "active"
              ? "active"
              : sub.status === "past_due"
                ? "past_due"
                : "cancelled";

          await db
            .update(subscriptions)
            .set({ status, updatedAt: new Date() })
            .where(eq(subscriptions.stripeSubscriptionId, sub.id));
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | { id: string };
        };
        const subRef = invoice.subscription;
        if (subRef) {
          const subId =
            typeof subRef === "string" ? subRef : subRef.id;
          await db
            .update(subscriptions)
            .set({ status: "past_due", updatedAt: new Date() })
            .where(eq(subscriptions.stripeSubscriptionId, subId));
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
