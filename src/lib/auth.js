import { useEffect, useState, useCallback } from "react";
import { isSupabaseConfigured, supabase } from "./supabase";

// Role & authority helpers shared by every staff screen.
// Mirrors the SQL functions in supabase/schema-02-roles-finance-records.sql.

export const DEPARTMENTS = [
  { value: "church_secretary", label: "Church Secretary" },
  { value: "church_treasurer", label: "Church Treasurer" },
  { value: "pastor", label: "Pastor" },
  { value: "youth", label: "Youth" },
  { value: "sunday_school", label: "Sunday School" },
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "media", label: "Media" },
];

export const ROLE_LABELS = {
  member: "Member",
  department_editor: "Department Editor",
  department_head: "Department Head",
  treasurer: "Treasurer",
  pastor: "Pastor",
  admin: "Administrator",
};

// Roles an administrator may hand out, in ascending order of authority.
// Mirrors the member_role enum in supabase/schema.sql.
export const ASSIGNABLE_ROLES = [
  "member",
  "department_editor",
  "department_head",
  "treasurer",
  "pastor",
  "admin",
];

export const ROLE_DESCRIPTIONS = {
  member: "Read public content only.",
  department_editor: "Publish notices and events for their own departments.",
  department_head: "Create, edit and delete their department's events and notices.",
  treasurer: "Funds, income, expenses, budgets, reports and finance records.",
  pastor: "Authority over every department, treasury and records.",
  admin: "Everything, plus managing people, roles and department heads.",
};

export const departmentLabel = (value) =>
  DEPARTMENTS.find((d) => d.value === value)?.label || value || "—";

export const getEffectiveHour = (now = new Date()) => {
  let hour = now.getHours();
  try {
    // When executing in UTC environments (cloud containers, CI, headless previews),
    // align with East Africa Time (Africa/Nairobi UTC+3) so church leadership sees the correct time-of-day greeting.
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "UTC" || !tz) {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Africa/Nairobi",
        hour: "numeric",
        hourCycle: "h23",
      });
      const parts = formatter.formatToParts(now);
      const hourPart = parts.find((p) => p.type === "hour");
      if (hourPart) {
        hour = parseInt(hourPart.value, 10);
      }
    }
  } catch {
    hour = now.getHours();
  }
  return hour;
};

export const getTimeGreeting = (name = "there", now = new Date()) => {
  const hour = getEffectiveHour(now);
  if (hour >= 0 && hour < 5) return `Good evening, ${name}`;
  if (hour >= 5 && hour < 12) return `Good morning, ${name}`;
  if (hour >= 12 && hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
};

export const getTimePeriod = (now = new Date()) => {
  const hour = getEffectiveHour(now);
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  return "Evening";
};


export const formatMoney = (amount, currency = "KES") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

// A suspended account keeps its history but loses every elevated power.
// Matches the `status` guard on the SQL authority helpers.
export const isActive = (profile) =>
  !profile || profile.status === undefined || profile.status === "active";

export const isAdmin = (profile) =>
  isActive(profile) && profile?.role === "admin";

export const isOverseer = (profile) =>
  isActive(profile) &&
  (profile?.role === "admin" || profile?.role === "pastor");

export const isTreasurer = (profile) =>
  isActive(profile) && ["treasurer", "admin", "pastor"].includes(profile?.role);

export const isStaff = (profile) =>
  isActive(profile) &&
  [
    "department_head",
    "department_editor",
    "treasurer",
    "pastor",
    "admin",
  ].includes(profile?.role);

// Can this profile create/edit/delete content for `department`?
export const canEditDepartment = (profile, department, memberships = []) => {
  if (!profile || !isActive(profile)) return false;
  if (isOverseer(profile)) return true;
  if (
    !["department_head", "department_editor", "treasurer"].includes(
      profile.role,
    )
  )
    return false;
  return (
    memberships.includes(department) ||
    profile.ledDepartments?.includes(department)
  );
};

// Departments a profile may act on (for pickers).
export const editableDepartments = (profile, memberships = []) => {
  if (!profile) return [];
  if (isOverseer(profile)) return DEPARTMENTS.map((d) => d.value);
  return DEPARTMENTS.map((d) => d.value).filter((d) =>
    canEditDepartment(profile, d, memberships),
  );
};

/**
 * Loads the signed-in user plus their profile, department memberships and the
 * departments they lead. Re-runs whenever auth state changes.
 */
export function useAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [ledDepartments, setLedDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setMemberships([]);
      setLedDepartments([]);
      return;
    }
    const [profileResult, membershipResult, headResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,display_name,role,status")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("department_memberships")
        .select("department")
        .eq("user_id", userId),
      supabase
        .from("department_heads")
        .select("department")
        .eq("head_id", userId),
    ]);
    const base = profileResult.data || {
      id: userId,
      display_name: "",
      role: "member",
      status: "active",
    };
    const led = (headResult.data || []).map((row) => row.department);
    setProfile({ ...base, ledDepartments: led });
    setMemberships((membershipResult.data || []).map((row) => row.department));
    setLedDepartments(led);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      await loadProfile(data.session?.user?.id);
      if (active) setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, next) => {
        setSession(next);
        await loadProfile(next?.user?.id);
      },
    );
    return () => {
      active = false;
      subscription?.subscription?.unsubscribe();
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    await loadProfile(null);
  }, [loadProfile]);

  return {
    session,
    user: session?.user ?? null,
    profile,
    memberships,
    ledDepartments,
    loading,
    isAuthenticated: Boolean(session),
    // A suspended account is signed in but stripped of every authority. The
    // console screens surface this rather than silently denying access.
    isSuspended: Boolean(profile) && profile?.status === "suspended",
    isAdmin: isAdmin(profile),
    isOverseer: isOverseer(profile),
    isTreasurer: isTreasurer(profile),
    isStaff: isStaff(profile),
    signOut,
    refresh: () => loadProfile(session?.user?.id),
  };
}
