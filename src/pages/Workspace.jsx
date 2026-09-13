import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ConsoleLayout from "../components/ConsoleLayout";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { ROLE_LABELS, formatMoney, getTimeGreeting, useAuth } from "../lib/auth";

const QUICK_LINKS = [
  {
    to: "/manage/events",
    title: "Events & notices",
    description: "Publish updates and keep every department in step.",
    allow: (auth) => auth.isStaff,
    tone: "clay",
  },
  {
    to: "/treasury",
    title: "Treasury",
    description: "Review giving, expenditure, budgets and approvals.",
    allow: (auth) => auth.isTreasurer,
    tone: "gold",
  },
  {
    to: "/records",
    title: "Digital records",
    description: "File, find and audit the church's important records.",
    allow: (auth) => auth.isStaff,
    tone: "forest",
  },
  {
    to: "/admin",
    title: "People & roles",
    description: "Manage accounts, roles and department leadership.",
    allow: (auth) => auth.isAdmin,
    tone: "ink",
  },
];

export default function Workspace() {
  const auth = useAuth();
  const [counts, setCounts] = useState({
    people: null,
    notices: null,
    events: null,
    records: null,
    balance: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !auth.isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const requests = [
      supabase.from("notices").select("id", { count: "exact", head: true }),
      supabase.from("events").select("id", { count: "exact", head: true }),
    ];

    if (auth.isStaff) {
      requests.push(
        supabase.from("records").select("id", { count: "exact", head: true }),
      );
    }

    if (auth.isAdmin) {
      requests.push(
        supabase
          .from("account_directory")
          .select("id", { count: "exact", head: true }),
      );
    }

    if (auth.isTreasurer) {
      requests.push(
        supabase
          .from("transactions")
          .select("direction,amount")
          .limit(1000),
      );
    }

    const results = await Promise.all(requests);
    const failure = results.find((result) => result.error);
    if (failure?.error) setError(failure.error.message);

    const next = {
      notices: results[0].count ?? 0,
      events: results[1].count ?? 0,
      records: auth.isStaff ? results[2]?.count ?? 0 : null,
      people: auth.isAdmin
        ? results[auth.isStaff ? 3 : 2]?.count ?? 0
        : null,
      balance: null,
    };

    if (auth.isTreasurer) {
      const transactionIndex = 2 + (auth.isStaff ? 1 : 0) + (auth.isAdmin ? 1 : 0);
      const transactions = results[transactionIndex]?.data || [];
      next.balance = transactions.reduce(
        (total, transaction) =>
          total +
          (transaction.direction === "income" ? 1 : -1) *
            Number(transaction.amount || 0),
        0,
      );
    }

    setCounts(next);
    setLoading(false);
  }, [auth.isAdmin, auth.isAuthenticated, auth.isStaff, auth.isTreasurer]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    const channel = supabase
      .channel("workspace-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notices" },
        () => void load(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const firstName = useMemo(
    () => (auth.profile?.display_name || "there").split(" ")[0],
    [auth.profile?.display_name],
  );
  const roleLabel = ROLE_LABELS[auth.profile?.role] || "Member";

  return (
    <ConsoleLayout
      title={getTimeGreeting(firstName)}
      intro="Your church workspace at a glance. Move from the next priority to the right tool in one click."
      allow={(_profile, context) => context.isStaff}
      denyMessage="The workspace is available to pastors, treasurers, department leaders and administrators."
    >
      <section className="workspace-hero">
        <div>
          <span className="eyebrow">Today at AIC Hola · {new Intl.DateTimeFormat("en-KE", { weekday: "long", hour: "numeric", minute: "2-digit", timeZone: "Africa/Nairobi" }).format(new Date())} EAT</span>
          <h3>{getTimeGreeting(firstName)}.</h3>
          <p>
            You are signed in as <strong>{roleLabel}</strong>. Everything you
            can access is protected by your existing church permissions.
          </p>
        </div>
        <span className="workspace-mark" aria-hidden="true">✦</span>
      </section>

      {error ? <p className="badge" role="alert">{error}</p> : null}

      <section className="stat-grid workspace-stats" aria-label="Workspace summary">
        <div className="stat">
          <span>Published notices</span>
          <strong>{loading ? "—" : counts.notices}</strong>
          <small>Visible to the church</small>
        </div>
        <div className="stat">
          <span>Upcoming events</span>
          <strong>{loading ? "—" : counts.events}</strong>
          <small>Shared calendar entries</small>
        </div>
        {auth.isStaff ? (
          <div className="stat">
            <span>Digital records</span>
            <strong>{loading ? "—" : counts.records}</strong>
            <small>Protected archive items</small>
          </div>
        ) : null}
        {auth.isAdmin ? (
          <div className="stat">
            <span>Active people</span>
            <strong>{loading ? "—" : counts.people}</strong>
            <small>Accounts in the directory</small>
          </div>
        ) : null}
        {auth.isTreasurer ? (
          <div className="stat positive">
            <span>Recorded balance</span>
            <strong>{loading ? "—" : formatMoney(counts.balance)}</strong>
            <small>From the latest 1,000 entries</small>
          </div>
        ) : null}
      </section>

      <section className="section-heading workspace-section-heading">
        <div>
          <span className="eyebrow">Quick access</span>
          <h2>What would you like to do?</h2>
        </div>
        <p>Purpose-built spaces for every responsibility in the church.</p>
      </section>

      <div className="workspace-actions">
        {QUICK_LINKS.filter((item) => item.allow(auth)).map((item) => (
          <Link key={item.to} to={item.to} className={`workspace-action ${item.tone}`}>
            <span className="workspace-action-arrow" aria-hidden="true">↗</span>
            <strong>{item.title}</strong>
            <span>{item.description}</span>
          </Link>
        ))}
      </div>
    </ConsoleLayout>
  );
}
