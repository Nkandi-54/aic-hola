import React from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth, isPastor, canManageMedia } from "../lib/auth";

/**
 * Every console page a signed-in staff member can reach, in one place. Each
 * entry declares who may see it, so the nav is identical across pages: the same
 * complete list of links follows you wherever you are, showing exactly the
 * pages *your* account can open.
 */
export const CONSOLE_PAGES = [
  { to: "/workspace", label: "Workspace home", end: true, allow: (a) => a.isStaff },
  { to: "/admin/people", label: "People & directory", end: true, allow: (a) => a.isAdmin || a.isPastor },
  { to: "/admin/departments", label: "Department heads", end: true, allow: (a) => a.isAdmin || a.isPastor },
  { to: "/admin/invitations", label: "Add a person", end: true, allow: (a) => a.isAdmin },
  { to: "/manage/events", label: "Events & notices", allow: (a) => a.canPublish },
  { to: "/media", label: "Worship media", allow: (a) => a.canManageMedia || a.isAdmin || a.isPastor },
  { to: "/pastor-desk", label: "Pastor's Study", end: true, allow: (a) => a.isPastor },
  { to: "/treasury", label: "Treasury", allow: (a) => a.isTreasurer },
  { to: "/records", label: "Digital records", allow: (a) => a.isStaff },
];

/**
 * Shared chrome for every staff console. Renders the role-aware side nav and
 * guards its children behind an optional authority check.
 *
 * props:
 *   title, intro   — heading copy
 *   allow          — predicate(profile, auth) → boolean; gates the console body
 *   denyMessage    — shown when `allow` is false
 *   hideNav        — suppress the side nav (account-style standalone pages)
 */
export default function ConsoleLayout({
  title,
  intro,
  allow = () => true,
  denyMessage = "Your account does not have access to this area.",
  hideNav = false,
  children,
}) {
  const auth = useAuth();
  const { profile, loading, isAuthenticated, isSuspended } = auth;
  // Authorship of worship media: exactly who may publish events & notices.
  const canPublish = Boolean(auth.isStaff);
  const navAuth = {
    ...auth,
    canPublish,
    canPublishMedia: canManageMedia(profile, auth.memberships),
    isPastor: isPastor(profile),
  };
  const navItems = CONSOLE_PAGES.filter((page) => page.allow(navAuth));

  if (loading) {
    return (
      <div className="page-shell">
        <p className="empty-state">Verifying your access…</p>
      </div>
    );
  }

  if (isSuspended) {
    return (
      <div className="page-shell">
        <div className="panel gate-card">
          <span className="badge">Suspended</span>
          <h2 className="panel-title">Your account is suspended</h2>
          <p className="panel-sub">
            An administrator has suspended this account, so staff access is
            paused. Please speak to the church administrator to restore it.
          </p>
          <Link className="button ghost" to="/">
            Return home
          </Link>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="page-shell">
        <div className="panel gate-card">
          <span className="badge">Restricted</span>
          <h2 className="panel-title">Staff sign-in required</h2>
          <p className="panel-sub">
            This workspace holds church records and finances. Please sign in
            with your staff account.
          </p>
          <Link className="button" to="/account">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (!allow(profile, auth)) {
    return (
      <div className="page-shell">
        <div className="panel gate-card">
          <span className="badge subtle">Not assigned</span>
          <h2 className="panel-title">You don’t have access here yet</h2>
          <p className="panel-sub">{denyMessage}</p>
          <Link className="button ghost" to="/">
            Return home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="console-shell">
        {hideNav ? null : (
          <nav className="console-nav" aria-label="Staff workspace navigation">
            <p className="console-nav-title">Staff workspace</p>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {item.label}
              </NavLink>
            ))}
            <Link className="console-nav-exit" to="/">
              ← Public site
            </Link>
          </nav>
        )}
        <div className="console-main">
          <header className="console-head">
            <div>
              <span className="eyebrow">AIC Hola workspace</span>
              <h2>{title}</h2>
              {intro ? <p>{intro}</p> : null}
            </div>
            <span className="badge subtle">
              {profile?.display_name || profile?.email || auth.user?.email} ·{" "}
              {profile?.role || "member"}
            </span>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
