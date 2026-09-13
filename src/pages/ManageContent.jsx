import React, { useCallback, useEffect, useMemo, useState } from "react";
import ConsoleLayout from "../components/ConsoleLayout";
import { supabase } from "../lib/supabase";
import {
  DEPARTMENTS,
  editableDepartments,
  canEditDepartment,
  departmentLabel,
  useAuth,
} from "../lib/auth";

const emptyEvent = {
  id: "",
  title: "",
  description: "",
  department: "",
  starts_at: "",
  ends_at: "",
  location: "",
};
const emptyNotice = {
  id: "",
  title: "",
  description: "",
  department: "",
  pinned: false,
};

const toLocalInput = (value) =>
  value ? new Date(value).toISOString().slice(0, 16) : "";

export default function ManageContent() {
  const [tab, setTab] = useState("events");
  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [noticeForm, setNoticeForm] = useState(emptyNotice);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [eventResult, noticeResult] = await Promise.all([
      supabase
        .from("events")
        .select("id,title,description,department,starts_at,ends_at,location")
        .order("starts_at", { ascending: false }),
      supabase
        .from("notices")
        .select("id,title,description,department,pinned,published_at")
        .order("published_at", { ascending: false }),
    ]);
    setEvents(eventResult.data || []);
    setNotices(noticeResult.data || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const allow = (profile, auth) =>
    auth.isOverseer ||
    auth.isStaff ||
    editableDepartments(profile, auth.memberships).length > 0;

  const saveEvent = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    if (!event.department) {
      setStatus("Choose a department.");
      setBusy(false);
      return;
    }
    const payload = {
      title: event.title,
      description: event.description,
      department: event.department,
      starts_at: new Date(event.starts_at).toISOString(),
      ends_at: new Date(event.ends_at).toISOString(),
      location: event.location,
    };
    const result = eventForm.id
      ? await supabase.from("events").update(payload).eq("id", eventForm.id)
      : await supabase.from("events").insert(payload);
    setStatus(
      result.error
        ? `Could not save event: ${result.error.message}`
        : "Event saved.",
    );
    if (!result.error) {
      setEventForm(emptyEvent);
      await load();
    }
    setBusy(false);
  };

  const saveNotice = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    if (!event.department) {
      setStatus("Choose a department.");
      setBusy(false);
      return;
    }
    const payload = {
      title: event.title,
      description: event.description,
      department: event.department,
      pinned: event.pinned,
    };
    const result = noticeForm.id
      ? await supabase.from("notices").update(payload).eq("id", noticeForm.id)
      : await supabase.from("notices").insert(payload);
    setStatus(
      result.error
        ? `Could not save notice: ${result.error.message}`
        : "Notice saved.",
    );
    if (!result.error) {
      setNoticeForm(emptyNotice);
      await load();
    }
    setBusy(false);
  };

  const removeRow = async (table, id) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    setStatus(error ? `Could not delete: ${error.message}` : "Deleted.");
    await load();
  };

  return (
    <ConsoleLayout
      title="Events & notices"
      intro="Department heads publish for their own department. Administrators and the pastor can publish for every department."
      allow={allow}
      denyMessage="You are not a department head, editor, treasurer, administrator or pastor, so you have no publishing access."
    >
      <div className="row">
        <button
          className={`button ${tab === "events" ? "" : "ghost"}`}
          onClick={() => setTab("events")}
        >
          Events
        </button>
        <button
          className={`button ${tab === "notices" ? "" : "ghost"}`}
          onClick={() => setTab("notices")}
        >
          Notices
        </button>
      </div>
      {status ? (
        <p className="badge subtle" role="status">
          {status}
        </p>
      ) : null}

      {tab === "events" ? (
        <EventWorkspace
          events={events}
          form={eventForm}
          setForm={setEventForm}
          onSave={saveEvent}
          onDelete={(id) => removeRow("events", id)}
          busy={busy}
        />
      ) : (
        <NoticeWorkspace
          notices={notices}
          form={noticeForm}
          setForm={setNoticeForm}
          onSave={saveNotice}
          onDelete={(id) => removeRow("notices", id)}
          busy={busy}
        />
      )}
    </ConsoleLayout>
  );
}

function DepartmentPicker({ value, onChange, auth, profile }) {
  const options = useMemo(() => {
    const allowed = editableDepartments(profile, auth.memberships);
    return DEPARTMENTS.filter((d) => allowed.includes(d.value));
  }, [auth.memberships, profile]);
  return (
    <label className="field">
      <span>Department</span>
      <select
        className="select"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select department…</option>
        {options.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EventWorkspace({ events, form, setForm, onSave, onDelete, busy }) {
  const auth = useAuth();
  return (
    <div className="stack">
      <form className="panel form-grid" onSubmit={onSave}>
        <h3 className="panel-title span-2">
          {form.id ? "Edit event" : "New event"}
        </h3>
        <label className="field span-2">
          <span>Title</span>
          <input
            className="input"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>
        <DepartmentPicker
          value={form.department}
          onChange={(v) => setForm({ ...form, department: v })}
          auth={auth}
          profile={auth.profile}
        />
        <label className="field">
          <span>Location</span>
          <input
            className="input"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Starts</span>
          <input
            className="input"
            type="datetime-local"
            required
            value={toLocalInput(form.starts_at)}
            onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Ends</span>
          <input
            className="input"
            type="datetime-local"
            required
            value={toLocalInput(form.ends_at)}
            onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
          />
        </label>
        <label className="field span-2">
          <span>Description</span>
          <textarea
            className="textarea"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <div className="row span-2">
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : form.id ? "Update event" : "Publish event"}
          </button>
          {form.id ? (
            <button
              type="button"
              className="button ghost"
              onClick={() =>
                setForm({
                  id: "",
                  title: "",
                  description: "",
                  department: "",
                  starts_at: "",
                  ends_at: "",
                  location: "",
                })
              }
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <section className="panel">
        <h3 className="panel-title">Scheduled events</h3>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Department</th>
                <th>When</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <p className="empty-state">No events yet.</p>
                  </td>
                </tr>
              ) : (
                events.map((event) => {
                  const canEdit = canEditDepartment(
                    auth.profile,
                    event.department,
                    auth.memberships,
                  );
                  return (
                    <tr key={event.id}>
                      <td>
                        <strong>{event.title}</strong>
                      </td>
                      <td>{departmentLabel(event.department)}</td>
                      <td>{new Date(event.starts_at).toLocaleString()}</td>
                      <td className="row end">
                        {canEdit ? (
                          <button
                            className="icon-button"
                            title="Edit"
                            onClick={() =>
                              setForm({
                                ...event,
                                starts_at: toLocalInput(event.starts_at),
                                ends_at: toLocalInput(event.ends_at),
                              })
                            }
                          >
                            ✎
                          </button>
                        ) : (
                          <span className="badge subtle">Read-only</span>
                        )}
                        {canEdit ? (
                          <button
                            className="icon-button"
                            title="Delete"
                            onClick={() => onDelete(event.id)}
                          >
                            🗑
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function NoticeWorkspace({ notices, form, setForm, onSave, onDelete, busy }) {
  const auth = useAuth();
  return (
    <div className="stack">
      <form className="panel form-grid" onSubmit={onSave}>
        <h3 className="panel-title span-2">
          {form.id ? "Edit notice" : "New notice"}
        </h3>
        <label className="field span-2">
          <span>Title</span>
          <input
            className="input"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>
        <DepartmentPicker
          value={form.department}
          onChange={(v) => setForm({ ...form, department: v })}
          auth={auth}
          profile={auth.profile}
        />
        <label className="field">
          <span>Pin to top</span>
          <select
            className="select"
            value={form.pinned ? "yes" : "no"}
            onChange={(e) =>
              setForm({ ...form, pinned: e.target.value === "yes" })
            }
          >
            <option value="no">No</option>
            <option value="yes">Yes — pinned</option>
          </select>
        </label>
        <label className="field span-2">
          <span>Message</span>
          <textarea
            className="textarea"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <div className="row span-2">
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : form.id ? "Update notice" : "Publish notice"}
          </button>
          {form.id ? (
            <button
              type="button"
              className="button ghost"
              onClick={() =>
                setForm({
                  id: "",
                  title: "",
                  description: "",
                  department: "",
                  pinned: false,
                })
              }
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <section className="panel">
        <h3 className="panel-title">Published notices</h3>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Department</th>
                <th>Pinned</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {notices.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <p className="empty-state">No notices yet.</p>
                  </td>
                </tr>
              ) : (
                notices.map((notice) => {
                  const canEdit = canEditDepartment(
                    auth.profile,
                    notice.department,
                    auth.memberships,
                  );
                  return (
                    <tr key={notice.id}>
                      <td>
                        <strong>{notice.title}</strong>
                      </td>
                      <td>{departmentLabel(notice.department)}</td>
                      <td>{notice.pinned ? "Yes" : "—"}</td>
                      <td className="row end">
                        {canEdit ? (
                          <button
                            className="icon-button"
                            title="Edit"
                            onClick={() =>
                              setForm({
                                id: notice.id,
                                title: notice.title,
                                description: notice.description,
                                department: notice.department,
                                pinned: Boolean(notice.pinned),
                              })
                            }
                          >
                            ✎
                          </button>
                        ) : (
                          <span className="badge subtle">Read-only</span>
                        )}
                        {canEdit ? (
                          <button
                            className="icon-button"
                            title="Delete"
                            onClick={() => onDelete(notice.id)}
                          >
                            🗑
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
