import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "./supabase";

/**
 * The church's real-world details, in one place.
 *
 * The Lipa na M-PESA paybill and account number below are the church's genuine
 * collection details. They are the fallback used before the database row has
 * loaded (and if the site is ever rendered without a backend), so the site
 * always quotes the correct paybill — never a placeholder.
 *
 * `church_settings` (supabase/schema-11-production-readiness.sql) holds the
 * authoritative copy, which an administrator can update without a redeploy.
 */
export const CHURCH_PAYBILL = "542542";
export const CHURCH_PAYBILL_ACCOUNT = "01410637946150";

export const CHURCH_CONTACT = {
  email: "contacts@aichola.org",
  phone: "+254 727 175 730",
  postal: "P.O. Box 24 – 70101, Hola, Kenya",
  location: "AIC Hola Church, Hola Town, Tana River County, Kenya",
  bankName: "Equity Bank",
  bankAccountName: "AIC Hola Church",
};

export const DEFAULT_CHURCH_SETTINGS = {
  paybill: CHURCH_PAYBILL,
  paybill_account: CHURCH_PAYBILL_ACCOUNT,
  bank_name: CHURCH_CONTACT.bankName,
  bank_account_name: CHURCH_CONTACT.bankAccountName,
  contact_email: CHURCH_CONTACT.email,
  contact_phone: CHURCH_CONTACT.phone,
  postal_address: CHURCH_CONTACT.postal,
  physical_location: CHURCH_CONTACT.location,
};

/**
 * Giving categories. Every category is paid to the same official paybill and
 * account; the category is what the giver states as the purpose of the gift.
 */
export const GIVING_CATEGORIES = [
  {
    key: "tithe",
    label: "Tithe",
    purpose: "Tithe (Firstfruits)",
  },
  {
    key: "offering",
    label: "General Offering",
    purpose: "Sunday & Midweek Offertory",
  },
  {
    key: "building",
    label: "Church Building",
    purpose: "Church Development & Maintenance",
  },
  {
    key: "missions",
    label: "Missions & Outreach",
    purpose: "Evangelism & Regional Mission Fields",
  },
  {
    key: "benevolence",
    label: "Needy & Benevolence",
    purpose: "Compassion Ministry & Vulnerable Families",
  },
  {
    key: "thanksgiving",
    label: "Thanksgiving",
    purpose: "Special Praise & Thanksgiving Giving",
  },
];

/**
 * Read the church's live settings. Returns the built-in official values
 * immediately and upgrades them once the database answers, so a slow network
 * never shows an empty or wrong paybill.
 */
export function useChurchSettings() {
  const [settings, setSettings] = useState(DEFAULT_CHURCH_SETTINGS);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    let active = true;

    const load = async () => {
      const { data, error } = await supabase
        .from("church_settings")
        .select("*")
        .eq("id", "primary")
        .maybeSingle();

      if (!active || error || !data) return;

      setSettings((current) => ({
        ...current,
        ...Object.fromEntries(
          Object.entries(data).filter(
            ([, value]) =>
              value !== null && value !== undefined && value !== "",
          ),
        ),
      }));
    };

    void load();

    const channel = supabase
      .channel("public-church-settings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "church_settings" },
        () => void load(),
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  return settings;
}
