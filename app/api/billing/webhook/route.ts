import { NextResponse } from "next/server";
import { refreshEntitlementCache } from "../../../../lib/revenuecat/server";

function webhookAuthorized(request: Request) {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH?.trim();
  if (!expected) {
    return false;
  }
  const header = request.headers.get("authorization") ?? "";
  return header === expected || header === `Bearer ${expected}`;
}

function webhookUserId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const event = (payload as { event?: unknown }).event;
  if (!event || typeof event !== "object") {
    return null;
  }
  const appUserId = (event as { app_user_id?: unknown }).app_user_id;
  if (typeof appUserId === "string" && appUserId.trim()) {
    return appUserId.trim();
  }
  const original = (event as { original_app_user_id?: unknown })
    .original_app_user_id;
  if (typeof original === "string" && original.trim()) {
    return original.trim();
  }
  return null;
}

export async function POST(request: Request) {
  if (!process.env.REVENUECAT_WEBHOOK_AUTH?.trim()) {
    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 503 },
    );
  }

  if (!webhookAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = webhookUserId(payload);
  if (!userId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    await refreshEntitlementCache(userId);
  } catch {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
