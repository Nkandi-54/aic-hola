import { isSupabaseConfigured, supabase } from "./supabase";

/**
 * The church inbox.
 *
 * Everything the public sends us — contact form notes and pastoral prayer
 * requests — is written to `public.contact_messages`
 * (supabase/schema-11-production-readiness.sql). Nothing is kept only in the
 * browser, and nothing reports success unless the church office actually
 * received it.
 */

/**
 * Send a message or prayer request to the church office.
 *
 * Returns { ok: true } only when the row really landed in the database.
 * Anything else returns { ok: false, error } with a message safe to show.
 */
export async function sendChurchMessage({
  kind = "message",
  name,
  email = "",
  phone = "",
  category = "General Inquiry",
  message,
}) {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      error:
        "The church office inbox is not connected yet. Please call the church office on +254 727 175 730.",
    };
  }

  const payload = {
    kind: kind === "prayer" ? "prayer" : "message",
    name: String(name || "").trim(),
    email: String(email || "").trim(),
    phone: String(phone || "").trim(),
    category: String(category || "General Inquiry").trim(),
    message: String(message || "").trim(),
  };

  if (payload.name.length < 2) {
    return { ok: false, error: "Please enter your name." };
  }

  if (payload.message.length < 2) {
    return {
      ok: false,
      error:
        kind === "prayer"
          ? "Please write your prayer request."
          : "Please write your message.",
    };
  }

  const { error } = await supabase.from("contact_messages").insert(payload);

  if (error) {
    return {
      ok: false,
      error:
        "We could not deliver your message just now. Please check your internet connection and try again, or call the church office on +254 727 175 730.",
    };
  }

  return { ok: true };
}
