import React, { useCallback, useEffect, useMemo, useState } from "react";
import ConsoleLayout from "../components/ConsoleLayout";
import { supabase } from "../lib/supabase";
import {
  ASSIGNABLE_ROLES,
  DEPARTMENTS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  departmentLabel,
  getTimeGreeting,
  useAuth,
} from "../lib/auth";
import { getAuthRedirectUrl } from "../lib/url";

/**
 * Administration console.
 *
 * This is the one place people and authority are managed. Everything here is
 * backed by rules enforced inside Postgres
 * (supabase/schema-03-accounts-admin.sql): only an administrator reaches this
 * screen, only an administrator may change a role or status, an administrator
 * cannot lock themselves out, department heads must be authorised, and every
 * change lands in the audit log.
 */
export default function Admin({ initialTab = "people" }) {
  const auth = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [people, setPeople] = useState([]);
  const [heads, setHeads] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const [peopleResult, headsResult] = await Promise.all([
      // account_directory joins the profile to its email; RLS shows it only
      // to administrators, and it never exposes auth.users directly.
      supabase
        .from("account_directory")
        .select(
          "id,display_name,role,status,email,created_at,led_departments,departments",
        )
        .order("created_at", { ascending: true }),

      supabase
        .from("department_heads")
        .select("department,head_id,appointed_at"),
    ]);

    const failure = peopleResult.error || headsResult.error;

    setError(failure ? failure.message : "");
    setPeople(peopleResult.data || []);
    setHeads(headsResult.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const adminCount = useMemo(
    () =>
      people.filter((p) => p.role === "admin" && p.status === "active").length,
    [people],
  );

  const headFor = (dept) =>
    heads.find((h) => h.department === dept)?.head_id || "";

  const run = async (work, busyKey, successMessage) => {
    setBusyId(busyKey);
    setStatus("");
    setError("");

    const { error: failure } = await work();

    if (failure) {
      setError(failure.message);
    } else {
      setStatus(successMessage);
    }

    await load();
    setBusyId(null);
  };

  const updateRole = (id, role) =>
    run(
      () => supabase.from("profiles").update({ role }).eq("id", id),
      id,
      `Role updated to ${ROLE_LABELS[role]}.`,
    );

  const setStatusFor = (id, next) =>
    run(
      () => supabase.from("profiles").update({ status: next }).eq("id", id),
      `status-${id}`,
      next === "suspended"
        ? "Account suspended."
        : "Account reinstated.",
    );

  const deleteAccount = (person) => {
    if (person.id === auth.profile?.id) {
      setError("You cannot delete your own administrator account.");
      return;
    }

    const name = person.display_name || person.email || "this member";
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the account for "${name}"?\n\nThis will permanently delete their profile, department leadership seats, and church access. This action cannot be undone.`
    );

    if (!confirmed) return;

    return run(
      async () => {
        // Try the administrator delete RPC first
        const { error: rpcError } = await supabase.rpc("admin_delete_user", {
          target_user_id: person.id,
        });

        if (!rpcError) return { error: null };

        // Fallback to manual table cleanup if RPC is pending
        await supabase
          .from("department_heads")
          .delete()
          .eq("head_id", person.id);
        await supabase
          .from("department_memberships")
          .delete()
          .eq("user_id", person.id);
        await supabase
          .from("direct_messages")
          .delete()
          .or(`sender_id.eq.${person.id},recipient_id.eq.${person.id}`);

        return supabase.from("profiles").delete().eq("id", person.id);
      },
      `delete-${person.id}`,
      `Account for "${name}" permanently deleted.`,
    );
  };

  const appointHead = (dept, headId) =>
    run(
      () =>
        headId
          ? supabase
              .from("department_heads")
              .upsert(
                { department: dept, head_id: headId },
                { onConflict: "department" },
              )
          : supabase
              .from("department_heads")
              .delete()
              .eq("department", dept),
      `head-${dept}`,
      headId
        ? "Department head appointed."
        : "Department head cleared.",
    );

  const toggleMembership = (person, dept) => {
    const held = (person.departments || []).includes(dept);

    return run(
      () =>
        held
          ? supabase
              .from("department_memberships")
              .delete()
              .eq("user_id", person.id)
              .eq("department", dept)
          : supabase
              .from("department_memberships")
              .insert({
                user_id: person.id,
                department: dept,
              }),
      `member-${person.id}-${dept}`,
      held ? "Membership removed." : "Membership added.",
    );
  };

  const firstName = useMemo(
    () => (auth.profile?.display_name || "Administrator").split(" ")[0],
    [auth.profile?.display_name],
  );

  const isPastorOnly = !auth.isAdmin && auth.isPastor;

  return (
    <ConsoleLayout
      title={
        isPastorOnly
          ? `${getTimeGreeting(firstName)} · Congregation Directory`
          : `${getTimeGreeting(firstName)} · Administration`
      }
      intro={
        isPastorOnly
          ? "Spiritual shepherd oversight: view registered members, contact information, active status, and ministry departments across the congregation."
          : "Assign church-wide roles and appoint a head for every department. Only administrators and the pastor hold authority over all departments."
      }
      allow={(_profile, authContext) => authContext.isAdmin || authContext.isPastor}
      denyMessage="Only administrators and the pastor can open the congregation directory and administration console."
    >
      <section className="workspace-hero" style={{ marginBottom: "1.5rem" }}>
        <div>
          <span className="eyebrow">
            {isPastorOnly ? "Pastoral Roster" : "Hola Command Centre"} ·{" "}
            {new Intl.DateTimeFormat("en-KE", {
              weekday: "long",
              hour: "numeric",
              minute: "2-digit",
              timeZone: "Africa/Nairobi",
            }).format(new Date())}{" "}
            EAT
          </span>
          <h3>{getTimeGreeting(firstName)}.</h3>
          <p>
            {isPastorOnly
              ? "Browse the church congregation roster to support pastoral care, fellowship, prayer, and ministry follow-up. Administrative account management and role assignments are stewarded by church administrators."
              : "You hold church-wide administrative authority. Oversee registered accounts, assign ministry leadership roles, and steward church governance with accountability."}
          </p>
        </div>
        <span className="workspace-mark" aria-hidden="true">✦</span>
      </section>

      <div className="row">
        {[
          ["people", isPastorOnly ? "People & directory" : "People & roles"],
          ["heads", "Department heads"],
          ...(!isPastorOnly ? [["invite", "Add a person"]] : []),
        ].map(([key, label]) => (
          <button
            key={key}
            className={`button ${tab === key ? "" : "ghost"}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="badge" role="alert">
          {error}
        </p>
      ) : null}

      {status ? (
        <p className="badge subtle" role="status">
          {status}
        </p>
      ) : null}

      {!loading && adminCount === 0 ? (
        <section className="panel">
          <h3 className="panel-title">No administrator on record</h3>
          <p className="panel-sub">
            Run the bootstrap in{" "}
            <code>supabase/schema-03-accounts-admin.sql</code> or call{" "}
            <code>claim_admin_seat()</code> from the first account to seat the
            church administrator.
          </p>
        </section>
      ) : null}

      {tab === "invite" ? (
        <InvitePanel
          onDone={load}
          setStatus={setStatus}
          setError={setError}
        />
      ) : null}

      {/* =========================================================
          DEPARTMENT HEADS
          ========================================================= */}

      <section className="panel" hidden={tab !== "heads"}>
        <h3 className="panel-title">Department heads</h3>

        <p className="panel-sub">
          A head can create, edit and delete their own department’s events and
          notices. Only an authorised person can be appointed, and a suspended
          account cannot lead. Administrators and the pastor can manage every
          department regardless.
        </p>

        <div className="stack">
          {DEPARTMENTS.map((dept) => (
            <div className="mini-item" key={dept.value}>
              <div>
                <strong>{dept.label}</strong>
                <br />
                <small>
                  {headFor(dept.value)
                    ? "Head appointed"
                    : "No head appointed"}
                </small>
              </div>

              {isPastorOnly ? (
                <span className="badge subtle">
                  {people.find((p) => p.id === headFor(dept.value))?.display_name || "No head appointed"}
                </span>
              ) : (
                <select
                  className="select"
                  style={{ maxWidth: 280 }}
                  value={headFor(dept.value)}
                  disabled={busyId === `head-${dept.value}`}
                  onChange={(event) =>
                    appointHead(dept.value, event.target.value)
                  }
                >
                  <option value="">— None —</option>

                  {people.map((person) => (
                    <option
                      key={person.id}
                      value={person.id}
                      disabled={person.status === "suspended"}
                    >
                      {person.display_name ||
                        person.email ||
                        person.id.slice(0, 8)}
                      {person.status === "suspended"
                        ? " (suspended)"
                        : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================
          PEOPLE & ROLES
          ========================================================= */}

      <section className="panel" hidden={tab !== "people"}>
        <div className="panel-head">
          <div>
            <h3 className="panel-title">
              People &amp; church-wide roles
            </h3>

            <p className="panel-sub">
              “Administrator” and “Pastor” hold power over all departments.
              “Department head” is scoped to the departments they lead.
              “Treasurer” unlocks the finance workspace.
            </p>
          </div>

          {!loading ? (
            <span className="badge subtle">
              {people.length}{" "}
              {people.length === 1 ? "person" : "people"}
            </span>
          ) : null}
        </div>

        <div className="people-grid">
          {people.length === 0 ? (
            <p className="empty-state">
              {loading
                ? "Loading people…"
                : "No profiles yet. Accounts appear here after people register."}
            </p>
          ) : (
            people.map((person) => {
              const isMe = person.id === auth.profile?.id;
              const suspended = person.status === "suspended";
              const departments = person.departments || [];

              const roleDescription =
                ROLE_DESCRIPTIONS[person.role] ||
                "Standard church account";

              const roleLabel =
                ROLE_LABELS[person.role] || person.role;

              return (
                <article
                  key={person.id}
                  className={`person-card ${
                    isMe ? "person-card-me" : ""
                  } ${suspended ? "person-card-suspended" : ""}`}
                >
                  {/* -------------------------------------------------
                      HEADER
                     ------------------------------------------------- */}

                  <div className="person-card-header">
                    <div className="person-identity">
                      <div
                        className="person-avatar"
                        aria-hidden="true"
                      >
                        {(person.display_name || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="person-name-block">
                        <div className="person-name-row">
                          <h4>
                            {person.display_name || "Unnamed"}
                          </h4>

                          {isMe ? (
                            <span className="person-you-badge">
                              YOU
                            </span>
                          ) : null}
                        </div>

                        <span className="person-email">
                          {person.email ||
                            `${person.id.slice(0, 8)}…`}
                        </span>
                      </div>
                    </div>

                    <div className="person-status-group">
                      <span
                        className={`person-status ${
                          suspended
                            ? "is-suspended"
                            : "is-active"
                        }`}
                      >
                        <span className="person-status-dot" />
                        {suspended ? "Suspended" : "Active"}
                      </span>

                      {isMe ? (
                        <span className="person-protected">
                          <span aria-hidden="true">◆</span>
                          Protected
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* -------------------------------------------------
                      ROLE
                     ------------------------------------------------- */}

                  <div className="person-card-section">
                    <div className="person-section-label">
                      Church-wide role
                    </div>

                    <div className="person-role-row">
                      <div>
                        <span className="person-role-title">
                          {roleLabel}
                        </span>

                        <p className="person-role-description">
                          {roleDescription}
                        </p>
                      </div>

                      {isPastorOnly ? (
                        <span className="badge subtle" style={{ alignSelf: "center" }}>
                          {ROLE_LABELS[person.role] || person.role}
                        </span>
                      ) : (
                        <select
                          className="select person-role-select"
                          value={person.role}
                          disabled={
                            busyId === person.id || isMe
                          }
                          title={
                            isMe
                              ? "Your administrator account is protected."
                              : roleDescription
                          }
                          onChange={(event) =>
                            updateRole(
                              person.id,
                              event.target.value,
                            )
                          }
                        >
                          {ASSIGNABLE_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* -------------------------------------------------
                      ACCESS
                     ------------------------------------------------- */}

                  <div className="person-card-section">
                    <div className="person-section-label">
                      Access
                    </div>

                    <div className="person-access-list">
                      {(person.role === "admin" ||
                        person.role === "pastor") && (
                        <>
                          <span className="person-access-chip">
                            <span>✓</span>
                            All departments
                          </span>

                          <span className="person-access-chip">
                            <span>✓</span>
                            Manage people
                          </span>
                        </>
                      )}

                      {person.role === "admin" ? (
                        <span className="person-access-chip">
                          <span>✓</span>
                          Manage roles
                        </span>
                      ) : null}

                      {(person.role === "admin" ||
                        person.role === "pastor") && (
                        <span className="person-access-chip">
                          <span>✓</span>
                          Department heads
                        </span>
                      )}

                      {person.role === "treasurer" ? (
                        <span className="person-access-chip">
                          <span>✓</span>
                          Finance workspace
                        </span>
                      ) : null}

                      {person.role === "department_head" ? (
                        <span className="person-access-chip">
                          <span>✓</span>
                          Department management
                        </span>
                      ) : null}

                      {person.role === "department_editor" ? (
                        <span className="person-access-chip">
                          <span>✓</span>
                          Department editing
                        </span>
                      ) : null}

                      {person.role === "member" ? (
                        <span className="person-access-chip muted">
                          Standard member access
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* -------------------------------------------------
                      DEPARTMENTS
                     ------------------------------------------------- */}

                  <div className="person-card-section">
                    <div className="person-section-heading">
                      <div>
                        <div className="person-section-label">
                          Departments
                        </div>

                        <span className="person-section-helper">
                          {departments.length === 0
                            ? "No department memberships"
                            : `${departments.length} department${
                                departments.length === 1
                                  ? ""
                                  : "s"
                              }`}
                        </span>
                      </div>

                      {!isPastorOnly && (
                        <details className="membership-details">
                          <summary>
                            {isMe
                              ? "Manage memberships"
                              : "Edit memberships"}
                          </summary>

                          <div className="membership-editor">
                            {DEPARTMENTS.map((dept) => {
                              const held = departments.includes(
                                dept.value,
                              );

                              return (
                                <button
                                  key={dept.value}
                                  type="button"
                                  className={`membership-button ${
                                    held ? "is-held" : ""
                                  }`}
                                  disabled={
                                    busyId ===
                                    `member-${person.id}-${dept.value}`
                                  }
                                  onClick={() =>
                                    toggleMembership(
                                      person,
                                      dept.value,
                                    )
                                  }
                                >
                                  <span>
                                    {held ? "✓" : "+"}
                                  </span>

                                  {dept.label}
                                </button>
                              );
                            })}
                          </div>
                        </details>
                      )}
                    </div>

                    <div className="person-departments">
                      {departments.length === 0 ? (
                        <span className="person-no-departments">
                          None assigned
                        </span>
                      ) : (
                        departments.map((dept) => (
                          <span
                            key={dept}
                            className="department-chip"
                          >
                            {departmentLabel(dept)}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* -------------------------------------------------
                      FOOTER
                     ------------------------------------------------- */}

                  <div className="person-card-footer">
                    <div className="person-footer-note">
                      {isMe ? (
                        <>
                          <span aria-hidden="true">◆</span>

                          Your administrator account is
                          protected from self-lockout.
                        </>
                      ) : suspended ? (
                        "This account currently cannot access protected workspaces."
                      ) : (
                        "Account is active and can access its assigned workspaces."
                      )}
                    </div>

                    {isPastorOnly ? (
                      <span className="badge subtle" style={{ fontSize: "0.78rem" }}>
                        Pastoral Roster · Confidential Shepherding
                      </span>
                    ) : !isMe ? (
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                        <button
                          className={`button ${
                            suspended ? "" : "ghost"
                          } person-account-action`}
                          disabled={
                            busyId === `status-${person.id}` ||
                            busyId === `delete-${person.id}`
                          }
                          onClick={() =>
                            setStatusFor(
                              person.id,
                              suspended
                                ? "active"
                                : "suspended",
                            )
                          }
                        >
                          {suspended
                            ? "Reinstate account"
                            : "Suspend account"}
                        </button>

                        <button
                          type="button"
                          className="button ghost person-account-action"
                          style={{
                            color: "#c62828",
                            borderColor: "rgba(198, 40, 40, 0.4)",
                          }}
                          disabled={
                            busyId === `delete-${person.id}` ||
                            busyId === `status-${person.id}`
                          }
                          onClick={() => deleteAccount(person)}
                          title="Permanently delete this account"
                        >
                          {busyId === `delete-${person.id}`
                            ? "Deleting…"
                            : "Delete account"}
                        </button>
                      </div>
                    ) : (
                      <span className="person-protected-footer">
                        Protected account
                      </span>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </ConsoleLayout>
  );
}

/**
 * Create a brand-new account. Self-registration is open too; this is the
 * administrator's way to seat someone directly. signUp creates the auth user
 * and the on_auth_user_created trigger writes the matching profile row.
 */
function InvitePanel({ onDone, setStatus, setError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("member");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    setBusy(true);
    setStatus("");
    setError("");

    const { data, error: signUpError } =
      await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
          },
          emailRedirectTo: getAuthRedirectUrl("/account"),
        },
      });

    if (signUpError) {
      setError(signUpError.message);
      setBusy(false);
      return;
    }

    if (data?.user && role !== "member") {
      const { error: roleError } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", data.user.id);

      if (roleError) {
        setError(roleError.message);
      } else {
        setStatus(
          `Account created as ${ROLE_LABELS[role]}.`,
        );
      }
    } else {
      setStatus("Account created.");
    }

    setEmail("");
    setPassword("");
    setDisplayName("");
    setRole("member");
    setBusy(false);

    await onDone();
  };

  return (
    <form className="panel form-grid" onSubmit={submit}>
      <h3 className="panel-title span-2">
        Add a person
      </h3>

      <p className="panel-sub span-2">
        Creates a real sign-in account and, when chosen, seats
        them straight into a role. New accounts default to
        “Member”.
      </p>

      <label className="field">
        <span>Full name</span>

        <input
          className="input"
          required
          value={displayName}
          onChange={(event) =>
            setDisplayName(event.target.value)
          }
        />
      </label>

      <label className="field">
        <span>Email address</span>

        <input
          className="input"
          type="email"
          required
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
        />
      </label>

      <label className="field">
        <span>Temporary password</span>

        <input
          className="input"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
        />
      </label>

      <label className="field">
        <span>Role</span>

        <select
          className="select"
          value={role}
          onChange={(event) =>
            setRole(event.target.value)
          }
        >
          {ASSIGNABLE_ROLES.map((value) => (
            <option key={value} value={value}>
              {ROLE_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      <div className="row span-2">
        <button className="button" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </button>
      </div>
    </form>
  );
}
