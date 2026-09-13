import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const moderationRules: Array<[string, RegExp]> = [
  ["profanity", /\b(?:fuck|fucking|shit|bitch|bastard|asshole|bullshit|damn)\b/i],
  ["insult", /\b(?:idiot|stupid|moron|fool|loser|imbecile|scum|trash)\b/i],
  ["targeted abuse", /\b(?:shut\s+up|go\s+to\s+hell|kill\s+yourself|you\s+are\s+useless)\b/i],
];

const normalise = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("@", "a")
    .replaceAll("1", "i")
    .replaceAll("3", "e")
    .replaceAll("0", "o")
    .replaceAll("$", "s");

const findMatches = (body: string) => {
  const value = normalise(body);
  const compact = value.replace(/[^a-z]/g, "");
  return moderationRules
    .filter(([, rule]) => rule.test(value) || rule.test(compact))
    .map(([name]) => name);
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Authentication required" }, 401);

  const caller = await admin.auth.getUser(token);
  if (caller.error || !caller.data.user) return json({ error: "Authentication required" }, 401);

  const senderId = caller.data.user.id;
  const input = await request.json().catch(() => null);
  const recipientId = typeof input?.recipient_id === "string" ? input.recipient_id : "";
  const body = typeof input?.body === "string" ? input.body.trim() : "";
  if (!recipientId || !body || body.length > 2000) {
    return json({ error: "Choose a recipient and write a message up to 2,000 characters." }, 400);
  }
  if (recipientId === senderId) return json({ error: "You cannot message your own account." }, 400);

  const { data: sender } = await admin
    .from("profiles")
    .select("id,display_name,status")
    .eq("id", senderId)
    .maybeSingle();
  const { data: recipient } = await admin
    .from("profiles")
    .select("id,status")
    .eq("id", recipientId)
    .maybeSingle();
  if (!sender || sender.status !== "active") return json({ error: "This account cannot send messages." }, 403);
  if (!recipient || recipient.status !== "active") return json({ error: "That recipient is not available." }, 404);

  const matches = findMatches(body);
  if (matches.length > 0) {
    const { count } = await admin
      .from("message_violations")
      .select("id", { count: "exact", head: true })
      .eq("offender_id", senderId);
    const strike = Math.min((count ?? 0) + 1, 3);
    const deleted = strike >= 3;
    const excerpt = body.slice(0, 240);

    const violation = await admin.from("message_violations").insert({
      offender_id: senderId,
      matched_terms: matches,
      body_excerpt: excerpt,
      strike_number: strike,
    }).select("id").single();
    if (violation.error) return json({ error: "We could not record the moderation decision." }, 500);

    const { data: recipients } = await admin
      .from("profiles")
      .select("id,role,status")
      .eq("status", "active")
      .in("role", ["admin", "pastor"]);
    const { data: secretaries } = await admin
      .from("department_memberships")
      .select("user_id")
      .eq("department", "church_secretary");
    const reportIds = new Set((recipients ?? []).map((item) => item.id));
    (secretaries ?? []).forEach((item) => reportIds.add(item.user_id));
    const reports = [...reportIds].map((reportRecipientId) => ({
      recipient_id: reportRecipientId,
      offender_id: senderId,
      offender_name: sender.display_name || caller.data.user.email || "Registered user",
      matched_terms: matches,
      body_excerpt: excerpt,
      strike_number: strike,
      action: deleted ? "account_deleted" : "warning",
    }));
    if (reports.length > 0) {
      const reportResult = await admin.from("moderation_reports").insert(reports);
      if (reportResult.error) return json({ error: "We could not deliver the moderation report." }, 500);
    }

    if (deleted) {
      const deletion = await admin.auth.admin.deleteUser(senderId);
      if (deletion.error) return json({ error: "The third violation was recorded, but account deletion failed. An administrator must intervene immediately." }, 500);
      return json({
        accepted: false,
        deleted: true,
        message: "This message was blocked. Your account has been permanently deleted after three moderated violations. A detailed report was sent to church leadership.",
      });
    }
    return json({
      accepted: false,
      deleted: false,
      strikesRemaining: 3 - strike,
      message: `This message was blocked for vulgar or insulting language. Warning ${strike} of 3. One more confirmed violation will permanently delete this account.`,
    });
  }

  const result = await admin.from("direct_messages").insert({
    sender_id: senderId,
    recipient_id: recipientId,
    body,
  }).select("id,sender_id,recipient_id,body,created_at").single();
  if (result.error) return json({ error: "We could not send your message." }, 500);
  return json({ accepted: true, message: result.data });
});
