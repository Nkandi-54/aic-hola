import React, { useCallback, useEffect, useMemo, useState } from "react";
import ConsoleLayout from "../components/ConsoleLayout";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const emptyPulpitForm = {
  id: "",
  service_date: new Date().toISOString().slice(0, 10),
  service_type: "Sunday Main Service",
  preacher: "",
  sermon_theme: "",
  scripture_reading: "",
  liturgist: "",
  notes: "",
  status: "confirmed",
};

const emptyCareForm = {
  id: "",
  member_name: "",
  phone_contact: "",
  care_type: "home_visit",
  visit_date: new Date().toISOString().slice(0, 10),
  pastoral_notes: "",
  prayer_items: "",
  follow_up_date: "",
  status: "in_progress",
  confidentiality_level: "pastor_only",
};

const SERVICE_TYPES = [
  "Sunday 1st Service (Swahili)",
  "Sunday 2nd Service (English)",
  "Combined Sunday Service",
  "Wednesday Midweek Prayer",
  "Friday Youth Kesha",
  "Special Celebration / Thanksgiving",
];

const CARE_TYPES = [
  { value: "home_visit", label: "Home Fellowship & Visit" },
  { value: "hospital_visit", label: "Hospital & Sick Shepherding" },
  { value: "counseling", label: "Spiritual & Life Counseling" },
  { value: "bereavement", label: "Bereavement & Grief Comfort" },
  { value: "prayer_support", label: "Special Intercessory Prayer" },
  { value: "new_believer", label: "New Convert & Discipleship" },
];

export default function PastorDesk() {
  const [tab, setTab] = useState("pulpit");
  const [schedules, setSchedules] = useState([]);
  const [careRecords, setCareRecords] = useState([]);
  const [pulpitForm, setPulpitForm] = useState(emptyPulpitForm);
  const [careForm, setCareForm] = useState(emptyCareForm);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCareType, setFilterCareType] = useState("all");

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setError("");

    const [schedulesResult, careResult] = await Promise.all([
      supabase
        .from("pulpit_schedule")
        .select("id,service_date,service_type,preacher,sermon_theme,scripture_reading,liturgist,notes,status,created_at")
        .order("service_date", { ascending: false }),
      supabase
        .from("pastoral_care_records")
        .select("id,member_name,phone_contact,care_type,visit_date,pastoral_notes,prayer_items,follow_up_date,status,confidentiality_level,created_at")
        .order("visit_date", { ascending: false }),
    ]);

    if (schedulesResult.error) {
      setError(`Pulpit schedule: ${schedulesResult.error.message}`);
    } else {
      setSchedules(schedulesResult.data || []);
    }

    if (careResult.error) {
      // Don't overwrite if schedule had an error
      if (!schedulesResult.error) {
        setError(`Pastoral records: ${careResult.error.message}`);
      }
    } else {
      setCareRecords(careResult.data || []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetPulpit = () => {
    setPulpitForm(emptyPulpitForm);
  };

  const resetCare = () => {
    setCareForm(emptyCareForm);
  };

  const savePulpit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");

    try {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        service_date: pulpitForm.service_date,
        service_type: pulpitForm.service_type,
        preacher: pulpitForm.preacher.trim(),
        sermon_theme: pulpitForm.sermon_theme.trim(),
        scripture_reading: pulpitForm.scripture_reading.trim(),
        liturgist: pulpitForm.liturgist.trim(),
        notes: pulpitForm.notes.trim(),
        status: pulpitForm.status,
      };

      if (!payload.preacher || !payload.sermon_theme) {
        setError("Please enter the preacher name and sermon theme.");
        setBusy(false);
        return;
      }

      if (pulpitForm.id) {
        const { error: updateError } = await supabase
          .from("pulpit_schedule")
          .update(payload)
          .eq("id", pulpitForm.id);
        if (updateError) throw updateError;
        setStatus("Pulpit schedule entry updated successfully.");
      } else {
        payload.created_by = userData?.user?.id;
        const { error: insertError } = await supabase
          .from("pulpit_schedule")
          .insert([payload]);
        if (insertError) throw insertError;
        setStatus("New sermon & preaching service scheduled.");
      }

      resetPulpit();
      await load();
    } catch (err) {
      setError(err.message || "Failed to save preaching schedule.");
    } finally {
      setBusy(false);
    }
  };

  const deletePulpit = async (item) => {
    if (!window.confirm(`Remove preaching schedule for "${item.sermon_theme}"?`)) return;
    setBusy(true);
    try {
      const { error: delError } = await supabase
        .from("pulpit_schedule")
        .delete()
        .eq("id", item.id);
      if (delError) throw delError;
      setStatus("Schedule entry removed.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveCareRecord = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");

    try {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        member_name: careForm.member_name.trim(),
        phone_contact: careForm.phone_contact.trim(),
        care_type: careForm.care_type,
        visit_date: careForm.visit_date,
        pastoral_notes: careForm.pastoral_notes.trim(),
        prayer_items: careForm.prayer_items.trim(),
        follow_up_date: careForm.follow_up_date || null,
        status: careForm.status,
        confidentiality_level: careForm.confidentiality_level,
      };

      if (!payload.member_name || !payload.pastoral_notes) {
        setError("Please provide member name and pastoral notes.");
        setBusy(false);
        return;
      }

      if (careForm.id) {
        const { error: updateError } = await supabase
          .from("pastoral_care_records")
          .update(payload)
          .eq("id", careForm.id);
        if (updateError) throw updateError;
        setStatus("Pastoral care record updated.");
      } else {
        payload.ministered_by = userData?.user?.id;
        const { error: insertError } = await supabase
          .from("pastoral_care_records")
          .insert([payload]);
        if (insertError) throw insertError;
        setStatus("Pastoral visit & counseling log recorded safely.");
      }

      resetCare();
      await load();
    } catch (err) {
      setError(err.message || "Failed to save pastoral care record.");
    } finally {
      setBusy(false);
    }
  };

  const deleteCareRecord = async (item) => {
    if (!window.confirm(`Delete confidential pastoral record for "${item.member_name}"?`)) return;
    setBusy(true);
    try {
      const { error: delError } = await supabase
        .from("pastoral_care_records")
        .delete()
        .eq("id", item.id);
      if (delError) throw delError;
      setStatus("Pastoral care record deleted.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const filteredCareRecords = useMemo(() => {
    return careRecords.filter((rec) => {
      if (filterCareType !== "all" && rec.care_type !== filterCareType) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        rec.member_name?.toLowerCase().includes(q) ||
        rec.pastoral_notes?.toLowerCase().includes(q) ||
        rec.prayer_items?.toLowerCase().includes(q)
      );
    });
  }, [careRecords, filterCareType, searchQuery]);

  return (
    <ConsoleLayout
      title="Pastor's Study & Pulpit Desk"
      intro="Spiritual shepherd desk: plan the pulpit preaching rota, prepare sermon themes, and shepherd the flock through confidential pastoral care records."
      allow={(_profile, auth) => auth.isPastor}
      denyMessage="The Pastor's Study is reserved for the pastor and church overseers."
    >
      <div className="tab-row" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "pulpit"}
          className={`tab-button ${tab === "pulpit" ? "active" : ""}`}
          onClick={() => setTab("pulpit")}
        >
          Pulpit &amp; Preaching Schedule ({schedules.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "care"}
          className={`tab-button ${tab === "care" ? "active" : ""}`}
          onClick={() => setTab("care")}
        >
          Confidential Pastoral Care ({careRecords.length})
        </button>
      </div>

      {status ? (
        <p className="badge subtle" role="status">
          {status}
        </p>
      ) : null}

      {error ? (
        <p className="badge" role="alert">
          {error}
        </p>
      ) : null}

      {tab === "pulpit" ? (
        <div className="console-split">
          <section className="panel" aria-labelledby="pulpit-form-heading">
            <h3 id="pulpit-form-heading" className="panel-title">
              {pulpitForm.id ? "Edit Preaching Schedule" : "Plan Upcoming Sermon"}
            </h3>
            <p className="panel-sub">
              Coordinate preaching themes, Scripture readings, and liturgists for the congregation.
            </p>

            <form onSubmit={savePulpit} className="stack">
              <label>
                <span>Service Date</span>
                <input
                  type="date"
                  required
                  value={pulpitForm.service_date}
                  onChange={(e) =>
                    setPulpitForm({ ...pulpitForm, service_date: e.target.value })
                  }
                />
              </label>

              <label>
                <span>Service Type</span>
                <select
                  value={pulpitForm.service_type}
                  onChange={(e) =>
                    setPulpitForm({ ...pulpitForm, service_type: e.target.value })
                  }
                >
                  {SERVICE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid two">
                <label>
                  <span>Preacher / Speaker</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rev. Senior Pastor, Elder"
                    value={pulpitForm.preacher}
                    onChange={(e) =>
                      setPulpitForm({ ...pulpitForm, preacher: e.target.value })
                    }
                  />
                </label>
                <label>
                  <span>Liturgist / Leader</span>
                  <input
                    type="text"
                    placeholder="e.g. Service Leader"
                    value={pulpitForm.liturgist}
                    onChange={(e) =>
                      setPulpitForm({ ...pulpitForm, liturgist: e.target.value })
                    }
                  />
                </label>
              </div>

              <label>
                <span>Sermon Theme / Title</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Walking in Unwavering Faith"
                  value={pulpitForm.sermon_theme}
                  onChange={(e) =>
                    setPulpitForm({ ...pulpitForm, sermon_theme: e.target.value })
                  }
                />
              </label>

              <label>
                <span>Scripture Reading</span>
                <input
                  type="text"
                  placeholder="e.g. Hebrews 11:1-6; Romans 8:28"
                  value={pulpitForm.scripture_reading}
                  onChange={(e) =>
                    setPulpitForm({ ...pulpitForm, scripture_reading: e.target.value })
                  }
                />
              </label>

              <label>
                <span>Sermon Exposition Notes &amp; Points</span>
                <textarea
                  rows={4}
                  placeholder="Key theological points, illustrations, and church prayer focus..."
                  value={pulpitForm.notes}
                  onChange={(e) =>
                    setPulpitForm({ ...pulpitForm, notes: e.target.value })
                  }
                />
              </label>

              <label>
                <span>Status</span>
                <select
                  value={pulpitForm.status}
                  onChange={(e) =>
                    setPulpitForm({ ...pulpitForm, status: e.target.value })
                  }
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="draft">Draft Planning</option>
                  <option value="completed">Completed / Preached</option>
                </select>
              </label>

              <div className="row end">
                {pulpitForm.id ? (
                  <button
                    type="button"
                    className="button ghost"
                    onClick={resetPulpit}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                ) : null}
                <button type="submit" className="button primary" disabled={busy}>
                  {busy ? "Saving…" : pulpitForm.id ? "Update Schedule" : "Schedule Sermon"}
                </button>
              </div>
            </form>
          </section>

          <section className="panel" aria-labelledby="pulpit-list-heading">
            <h3 id="pulpit-list-heading" className="panel-title">
              Pulpit Preaching Calendar
            </h3>
            <p className="panel-sub">
              Upcoming themes and minister assignments for worship leadership.
            </p>

            {schedules.length === 0 ? (
              <p className="empty-state">No upcoming sermons scheduled yet.</p>
            ) : (
              <div className="table-wrap">
                <table className="console-table">
                  <thead>
                    <tr>
                      <th>Date &amp; Service</th>
                      <th>Preacher &amp; Theme</th>
                      <th>Scripture</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.service_date}</strong>
                          <br />
                          <small>{item.service_type}</small>
                        </td>
                        <td>
                          <strong>{item.sermon_theme}</strong>
                          <br />
                          <small>By {item.preacher}</small>
                        </td>
                        <td>{item.scripture_reading || "—"}</td>
                        <td>
                          <span
                            className={`badge ${
                              item.status === "confirmed"
                                ? "positive"
                                : item.status === "completed"
                                ? "subtle"
                                : ""
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <div className="row end">
                            <button
                              type="button"
                              className="icon-button"
                              title="Edit"
                              onClick={() => setPulpitForm(item)}
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              className="icon-button"
                              title="Delete"
                              onClick={() => deletePulpit(item)}
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="console-split">
          <section className="panel" aria-labelledby="care-form-heading">
            <h3 id="care-form-heading" className="panel-title">
              {careForm.id ? "Edit Pastoral Care Log" : "Record Pastoral Shepherding"}
            </h3>
            <p className="panel-sub">
              Confidential record for hospital visitation, family home blessing, counseling, or prayer needs.
            </p>

            <form onSubmit={saveCareRecord} className="stack">
              <div className="grid two">
                <label>
                  <span>Member / Family Name</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sister Grace M. & Family"
                    value={careForm.member_name}
                    onChange={(e) =>
                      setCareForm({ ...careForm, member_name: e.target.value })
                    }
                  />
                </label>
                <label>
                  <span>Phone / Contact</span>
                  <input
                    type="text"
                    placeholder="e.g. +254 7..."
                    value={careForm.phone_contact}
                    onChange={(e) =>
                      setCareForm({ ...careForm, phone_contact: e.target.value })
                    }
                  />
                </label>
              </div>

              <div className="grid two">
                <label>
                  <span>Care Ministry Type</span>
                  <select
                    value={careForm.care_type}
                    onChange={(e) =>
                      setCareForm({ ...careForm, care_type: e.target.value })
                    }
                  >
                    {CARE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Visit / Meeting Date</span>
                  <input
                    type="date"
                    required
                    value={careForm.visit_date}
                    onChange={(e) =>
                      setCareForm({ ...careForm, visit_date: e.target.value })
                    }
                  />
                </label>
              </div>

              <label>
                <span>Pastoral Observations &amp; Spiritual Notes</span>
                <textarea
                  rows={4}
                  required
                  placeholder="Record spiritual counsel given, family circumstances, and pastoral observations..."
                  value={careForm.pastoral_notes}
                  onChange={(e) =>
                    setCareForm({ ...careForm, pastoral_notes: e.target.value })
                  }
                />
              </label>

              <label>
                <span>Prayer Items &amp; Intercession Needs</span>
                <textarea
                  rows={2}
                  placeholder="Specific needs to uphold in prayer..."
                  value={careForm.prayer_items}
                  onChange={(e) =>
                    setCareForm({ ...careForm, prayer_items: e.target.value })
                  }
                />
              </label>

              <div className="grid two">
                <label>
                  <span>Follow-Up Date (Optional)</span>
                  <input
                    type="date"
                    value={careForm.follow_up_date}
                    onChange={(e) =>
                      setCareForm({ ...careForm, follow_up_date: e.target.value })
                    }
                  />
                </label>
                <label>
                  <span>Care Status</span>
                  <select
                    value={careForm.status}
                    onChange={(e) =>
                      setCareForm({ ...careForm, status: e.target.value })
                    }
                  >
                    <option value="in_progress">In Progress</option>
                    <option value="followup_needed">Follow-Up Needed</option>
                    <option value="completed">Shepherding Concluded</option>
                  </select>
                </label>
              </div>

              <div className="row end">
                {careForm.id ? (
                  <button
                    type="button"
                    className="button ghost"
                    onClick={resetCare}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                ) : null}
                <button type="submit" className="button primary" disabled={busy}>
                  {busy ? "Saving…" : careForm.id ? "Update Care Log" : "Record Shepherding"}
                </button>
              </div>
            </form>
          </section>

          <section className="panel" aria-labelledby="care-list-heading">
            <h3 id="care-list-heading" className="panel-title">
              Pastoral Care Log
            </h3>
            <p className="panel-sub">
              Confidential visits, counseling meetings, and follow-up reminders.
            </p>

            <div className="grid two" style={{ marginBottom: "1rem" }}>
              <input
                type="search"
                placeholder="Search member name or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                value={filterCareType}
                onChange={(e) => setFilterCareType(e.target.value)}
              >
                <option value="all">All Care Types</option>
                {CARE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {filteredCareRecords.length === 0 ? (
              <p className="empty-state">No pastoral care entries found.</p>
            ) : (
              <div className="table-wrap">
                <table className="console-table">
                  <thead>
                    <tr>
                      <th>Member &amp; Date</th>
                      <th>Type</th>
                      <th>Pastoral Notes</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCareRecords.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.member_name}</strong>
                          {item.phone_contact ? (
                            <>
                              <br />
                              <small>{item.phone_contact}</small>
                            </>
                          ) : null}
                          <br />
                          <small>{item.visit_date}</small>
                        </td>
                        <td>
                          <span className="badge subtle">
                            {CARE_TYPES.find((c) => c.value === item.care_type)?.label || item.care_type}
                          </span>
                        </td>
                        <td>
                          <p style={{ margin: 0, fontSize: "0.86rem", maxWidth: "260px" }}>
                            {item.pastoral_notes}
                          </p>
                          {item.prayer_items ? (
                            <small style={{ color: "var(--clay)", display: "block", marginTop: "4px" }}>
                              <strong>Prayer:</strong> {item.prayer_items}
                            </small>
                          ) : null}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              item.status === "completed"
                                ? "positive"
                                : item.status === "followup_needed"
                                ? "alert"
                                : ""
                            }`}
                          >
                            {item.status.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          <div className="row end">
                            <button
                              type="button"
                              className="icon-button"
                              title="Edit"
                              onClick={() => setCareForm(item)}
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              className="icon-button"
                              title="Delete"
                              onClick={() => deleteCareRecord(item)}
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </ConsoleLayout>
  );
}

