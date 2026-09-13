import React, { useCallback, useEffect, useMemo, useState } from "react";
import ConsoleLayout from "../components/ConsoleLayout";
import { supabase } from "../lib/supabase";
import { DEPARTMENTS, departmentLabel } from "../lib/auth";

const RECORD_CLASSES = [
  "minutes",
  "membership",
  "legal",
  "property",
  "correspondence",
  "finance",
  "events",
  "personnel",
  "other",
];

const emptyRecord = {
  id: "",
  title: "",
  class: "other",
  department: "",
  summary: "",
  reference: "",
  is_confidential: false,
};

export default function Records() {
  const [folders, setFolders] = useState([]);
  const [records, setRecords] = useState([]);
  const [audit, setAudit] = useState([]);
  const [tab, setTab] = useState("browse");
  const [filterClass, setFilterClass] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [recordForm, setRecordForm] = useState(emptyRecord);
  const [folderForm, setFolderForm] = useState({
    id: "",
    name: "",
    class: "other",
    department: "",
    description: "",
  });
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [folderResult, recordResult, auditResult] = await Promise.all([
      supabase
        .from("record_folders")
        .select("id,name,class,department,description")
        .order("name"),
      supabase
        .from("records")
        .select(
          "id,title,class,department,summary,reference,storage_path,is_confidential,folder_id,created_at",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("audit_log")
        .select("id,action,entity,actor_email,created_at")
        .order("created_at", { ascending: false })
        .limit(60),
    ]);
    setFolders(folderResult.data || []);
    setRecords(recordResult.data || []);
    setAudit(auditResult.data || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () =>
      records.filter(
        (record) =>
          (filterClass === "all" || record.class === filterClass) &&
          (filterDept === "all" || record.department === filterDept),
      ),
    [records, filterClass, filterDept],
  );

  const saveRecord = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    let storagePath = "";
    if (file) {
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const upload = await supabase.storage.from("records").upload(path, file);
      if (upload.error) {
        setStatus(`Upload failed: ${upload.error.message}`);
        setBusy(false);
        return;
      }
      storagePath = path;
    }
    const payload = {
      title: recordForm.title,
      class: recordForm.class,
      department: recordForm.department || null,
      summary: recordForm.summary,
      reference: recordForm.reference,
      is_confidential: recordForm.is_confidential,
      ...(storagePath ? { storage_path: storagePath } : {}),
    };
    const result = recordForm.id
      ? await supabase.from("records").update(payload).eq("id", recordForm.id)
      : await supabase.from("records").insert(payload);
    setStatus(
      result.error
        ? `Could not save record: ${result.error.message}`
        : "Record filed and logged.",
    );
    if (!result.error) {
      setRecordForm(emptyRecord);
      setFile(null);
      await load();
    }
    setBusy(false);
  };

  const saveFolder = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const payload = {
      name: folderForm.name,
      class: folderForm.class,
      department: folderForm.department || null,
      description: folderForm.description,
    };
    const result = folderForm.id
      ? await supabase
          .from("record_folders")
          .update(payload)
          .eq("id", folderForm.id)
      : await supabase.from("record_folders").insert(payload);
    setStatus(
      result.error
        ? `Could not save folder: ${result.error.message}`
        : "Folder saved.",
    );
    if (!result.error) {
      setFolderForm({
        id: "",
        name: "",
        class: "other",
        department: "",
        description: "",
      });
      await load();
    }
    setBusy(false);
  };

  const openFile = async (path) => {
    const { data, error } = await supabase.storage
      .from("records")
      .createSignedUrl(path, 60);
    if (error) {
      setStatus(`Could not open file: ${error.message}`);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const removeRecord = async (id) => {
    const { error } = await supabase.from("records").delete().eq("id", id);
    setStatus(
      error ? `Could not delete: ${error.message}` : "Record deleted (logged).",
    );
    await load();
  };

  return (
    <ConsoleLayout
      title="Digital records"
      intro="A safe, modern archive for minutes, membership, legal, property and finance records — with a tamper-evident audit trail."
      allow={(_profile, auth) => auth.isStaff}
      denyMessage="Records are available to staff, department heads, treasurers, administrators and the pastor."
    >
      <div className="row">
        {["browse", "file", "folders", "audit"].map((key) => (
          <button
            key={key}
            className={`button ${tab === key ? "" : "ghost"}`}
            onClick={() => setTab(key)}
          >
            {
              {
                browse: "Browse",
                file: "File a record",
                folders: "Folders",
                audit: "Audit trail",
              }[key]
            }
          </button>
        ))}
      </div>
      {status ? (
        <p className="badge subtle" role="status">
          {status}
        </p>
      ) : null}

      {tab === "browse" ? (
        <section className="panel">
          <div className="row between">
            <h3 className="panel-title">Archive</h3>
            <div className="row">
              <select
                className="select"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <option value="all">All classes</option>
                {RECORD_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                className="select"
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
              >
                <option value="all">All departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Class</th>
                  <th>Department</th>
                  <th>Filed</th>
                  <th>File</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <p className="empty-state">No records match this view.</p>
                    </td>
                  </tr>
                ) : (
                  visible.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <strong>{record.title}</strong>
                        {record.is_confidential ? (
                          <span
                            className="badge subtle"
                            style={{ marginLeft: 8 }}
                          >
                            Confidential
                          </span>
                        ) : null}
                        <br />
                        <small>{record.summary}</small>
                      </td>
                      <td>{record.class}</td>
                      <td>
                        {record.department
                          ? departmentLabel(record.department)
                          : "Church-wide"}
                      </td>
                      <td>
                        {new Date(record.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        {record.storage_path ? (
                          <button
                            className="text-link"
                            onClick={() => openFile(record.storage_path)}
                          >
                            Open
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="row end">
                        <button
                          className="icon-button"
                          title="Delete"
                          onClick={() => removeRecord(record.id)}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "file" ? (
        <form className="panel form-grid" onSubmit={saveRecord}>
          <h3 className="panel-title span-2">
            {recordForm.id ? "Amend record" : "File a new record"}
          </h3>
          <label className="field span-2">
            <span>Title</span>
            <input
              className="input"
              required
              value={recordForm.title}
              onChange={(e) =>
                setRecordForm({ ...recordForm, title: e.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Class</span>
            <select
              className="select"
              value={recordForm.class}
              onChange={(e) =>
                setRecordForm({ ...recordForm, class: e.target.value })
              }
            >
              {RECORD_CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Department</span>
            <select
              className="select"
              value={recordForm.department}
              onChange={(e) =>
                setRecordForm({ ...recordForm, department: e.target.value })
              }
            >
              <option value="">Church-wide</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Reference</span>
            <input
              className="input"
              value={recordForm.reference}
              onChange={(e) =>
                setRecordForm({ ...recordForm, reference: e.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Confidential</span>
            <select
              className="select"
              value={recordForm.is_confidential ? "yes" : "no"}
              onChange={(e) =>
                setRecordForm({
                  ...recordForm,
                  is_confidential: e.target.value === "yes",
                })
              }
            >
              <option value="no">No</option>
              <option value="yes">Yes — restricted</option>
            </select>
          </label>
          <label className="field span-2">
            <span>Summary</span>
            <textarea
              className="textarea"
              value={recordForm.summary}
              onChange={(e) =>
                setRecordForm({ ...recordForm, summary: e.target.value })
              }
            />
          </label>
          <label className="field span-2">
            <span>Attach file (stored privately)</span>
            <input
              className="input"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <div className="row span-2">
            <button className="button" disabled={busy}>
              {busy ? "Filing…" : "File record"}
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={() => {
                setRecordForm(emptyRecord);
                setFile(null);
              }}
            >
              Clear
            </button>
          </div>
        </form>
      ) : null}

      {tab === "folders" ? (
        <div className="stack">
          <form className="panel form-grid" onSubmit={saveFolder}>
            <h3 className="panel-title span-2">
              {folderForm.id ? "Edit folder" : "New folder"}
            </h3>
            <label className="field">
              <span>Name</span>
              <input
                className="input"
                required
                value={folderForm.name}
                onChange={(e) =>
                  setFolderForm({ ...folderForm, name: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Class</span>
              <select
                className="select"
                value={folderForm.class}
                onChange={(e) =>
                  setFolderForm({ ...folderForm, class: e.target.value })
                }
              >
                {RECORD_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Department</span>
              <select
                className="select"
                value={folderForm.department}
                onChange={(e) =>
                  setFolderForm({ ...folderForm, department: e.target.value })
                }
              >
                <option value="">Church-wide</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Description</span>
              <input
                className="input"
                value={folderForm.description}
                onChange={(e) =>
                  setFolderForm({ ...folderForm, description: e.target.value })
                }
              />
            </label>
            <div className="row span-2">
              <button className="button" disabled={busy}>
                {busy ? "Saving…" : "Save folder"}
              </button>
            </div>
          </form>
          <section className="panel">
            <h3 className="panel-title">Folders</h3>
            <div className="mini-list">
              {folders.length === 0 ? (
                <p className="empty-state">No folders yet.</p>
              ) : (
                folders.map((folder) => (
                  <div className="mini-item" key={folder.id}>
                    <div>
                      <strong>{folder.name}</strong>
                      <br />
                      <small>
                        {folder.class} ·{" "}
                        {folder.department
                          ? departmentLabel(folder.department)
                          : "Church-wide"}
                      </small>
                    </div>
                    <button
                      className="icon-button"
                      title="Edit"
                      onClick={() =>
                        setFolderForm({
                          id: folder.id,
                          name: folder.name,
                          class: folder.class,
                          department: folder.department || "",
                          description: folder.description || "",
                        })
                      }
                    >
                      ✎
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "audit" ? (
        <section className="panel">
          <h3 className="panel-title">Audit trail</h3>
          <p className="panel-sub">
            Every change to a record or transaction is captured automatically
            and cannot be edited here.
          </p>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Actor</th>
                </tr>
              </thead>
              <tbody>
                {audit.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <p className="empty-state">No activity recorded yet.</p>
                    </td>
                  </tr>
                ) : (
                  audit.map((entry) => (
                    <tr key={entry.id}>
                      <td>{new Date(entry.created_at).toLocaleString()}</td>
                      <td>
                        <span className="badge subtle">{entry.action}</span>
                      </td>
                      <td>{entry.entity}</td>
                      <td>{entry.actor_email || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </ConsoleLayout>
  );
}
