import React, { useCallback, useEffect, useMemo, useState } from "react";
import ConsoleLayout from "../components/ConsoleLayout";
import { supabase } from "../lib/supabase";
import { DEPARTMENTS, departmentLabel } from "../lib/auth";
import "./Records.css";

function ReportMediaBlock({ imageUrl, videoUrl, title }) {
  if (!imageUrl && !videoUrl) return null;

  const ytMatch = videoUrl?.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/,
  );

  return (
    <div className="report-card-media">
      {imageUrl ? (
        <div className="report-card-image-frame">
          <a href={imageUrl} target="_blank" rel="noreferrer" title="Click to view full image">
            <img src={imageUrl} alt={title || "Report attachment"} loading="lazy" />
          </a>
        </div>
      ) : null}
      {videoUrl ? (
        <div className="report-card-video-frame">
          {ytMatch ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytMatch[1]}`}
              title={title || "Video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={videoUrl} controls preload="metadata" />
          )}
        </div>
      ) : null}
    </div>
  );
}

const RECORD_CLASSES = [
  "reports",
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
  class: "reports",
  department: "",
  summary: "",
  reference: "",
  is_confidential: false,
  image_url: "",
  video_url: "",
};

async function uploadMediaFile(file, folder = "records-media") {
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folder}/${Date.now()}-${cleanName}`;
  const { error } = await supabase.storage.from("content-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("content-media").getPublicUrl(path);
  return data.publicUrl;
}

function sanitizeMediaUrl(val) {
  if (!val) return "";
  const trimmed = val.trim();
  if (/^http:\/\//i.test(trimmed)) {
    return "https://" + trimmed.slice(7);
  }
  return trimmed;
}

export default function Records() {
  const [folders, setFolders] = useState([]);
  const [records, setRecords] = useState([]);
  const [audit, setAudit] = useState([]);
  const [tab, setTab] = useState("browse");
  const [viewMode, setViewMode] = useState("cards");
  const [previewRecord, setPreviewRecord] = useState(null);
  const [filterClass, setFilterClass] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [recordForm, setRecordForm] = useState(emptyRecord);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
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
          "id,title,class,department,summary,reference,storage_path,image_url,video_url,is_confidential,folder_id,created_at",
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
      image_url: recordForm.image_url || "",
      video_url: recordForm.video_url || "",
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
      title="Digital records & reports"
      intro="A safe, modern archive for church reports, minutes, membership, legal, property and finance records — with a tamper-evident audit trail."
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
                file: "File a record / report",
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
          <div className="row between" style={{ alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <h3 className="panel-title">Archive</h3>
            <div className="row" style={{ alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div className="records-view-toggle">
                <button
                  type="button"
                  className={`records-view-btn ${viewMode === "cards" ? "active" : ""}`}
                  onClick={() => setViewMode("cards")}
                >
                  Cards (Media View)
                </button>
                <button
                  type="button"
                  className={`records-view-btn ${viewMode === "table" ? "active" : ""}`}
                  onClick={() => setViewMode("table")}
                >
                  Table
                </button>
              </div>
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

          {viewMode === "cards" ? (
            <div className="records-cards-grid">
              {visible.length === 0 ? (
                <p className="empty-state">No records match this view.</p>
              ) : (
                visible.map((record) => (
                  <article key={record.id} className="report-card">
                    <div className="report-card-head">
                      <span className="report-class-badge">{record.class}</span>
                      <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                        {new Date(record.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="report-card-title">{record.title}</h4>
                    <div className="report-card-meta">
                      <span>
                        <i className="fa-solid fa-building" aria-hidden="true" />{" "}
                        {record.department ? departmentLabel(record.department) : "Church-wide"}
                      </span>
                      {record.reference && <span>Ref: {record.reference}</span>}
                      {record.is_confidential && <span className="badge subtle">Confidential</span>}
                    </div>

                    <p className="report-card-summary">{record.summary}</p>

                    <ReportMediaBlock
                      imageUrl={record.image_url}
                      videoUrl={record.video_url}
                      title={record.title}
                    />

                    <div className="report-card-footer">
                      <div className="row" style={{ gap: 8 }}>
                        {record.storage_path ? (
                          <button
                            type="button"
                            className="text-link"
                            onClick={() => openFile(record.storage_path)}
                          >
                            <i className="fa-solid fa-file-arrow-down" /> Document
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="text-link"
                          onClick={() => setPreviewRecord(record)}
                        >
                          View Details
                        </button>
                      </div>
                      <div className="row end" style={{ gap: 4 }}>
                        <button
                          className="icon-button"
                          title="Edit / Amend"
                          onClick={() => {
                            setRecordForm({
                              id: record.id,
                              title: record.title,
                              class: record.class,
                              department: record.department || "",
                              summary: record.summary || "",
                              reference: record.reference || "",
                              is_confidential: Boolean(record.is_confidential),
                              image_url: record.image_url || "",
                              video_url: record.video_url || "",
                            });
                            setTab("file");
                          }}
                        >
                          ✎
                        </button>
                        <button
                          className="icon-button"
                          title="Delete"
                          onClick={() => removeRecord(record.id)}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Class</th>
                    <th>Department</th>
                    <th>Filed</th>
                    <th>Media</th>
                    <th>File</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
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
                          <div className="row" style={{ gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                            {record.image_url ? (
                              <a
                                href={record.image_url}
                                target="_blank"
                                rel="noreferrer"
                                title="View attached photo"
                              >
                                <img
                                  src={record.image_url}
                                  alt="Attachment preview"
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 4,
                                    objectFit: "cover",
                                    border: "1px solid var(--line)",
                                  }}
                                />
                              </a>
                            ) : null}
                            {record.video_url ? (
                              <a
                                href={record.video_url}
                                target="_blank"
                                rel="noreferrer"
                                className="badge subtle"
                                title="Watch attached video"
                              >
                                🎬 Video
                              </a>
                            ) : null}
                            {!record.image_url && !record.video_url ? (
                              <span style={{ color: "var(--muted)" }}>—</span>
                            ) : null}
                          </div>
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
                            title="View Report & Media"
                            onClick={() => setPreviewRecord(record)}
                          >
                            👁
                          </button>
                          <button
                            className="icon-button"
                            title="Edit / Amend"
                            onClick={() => {
                              setRecordForm({
                                id: record.id,
                                title: record.title,
                                class: record.class,
                                department: record.department || "",
                                summary: record.summary || "",
                                reference: record.reference || "",
                                is_confidential: Boolean(record.is_confidential),
                                image_url: record.image_url || "",
                                video_url: record.video_url || "",
                              });
                              setTab("file");
                            }}
                          >
                            ✎
                          </button>
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
          )}
        </section>
      ) : null}

      {previewRecord ? (
        <div
          className="report-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewRecord(null);
          }}
        >
          <div className="report-modal-dialog">
            <button
              type="button"
              className="report-modal-close"
              aria-label="Close"
              onClick={() => setPreviewRecord(null)}
            >
              ✕
            </button>
            <div className="report-card-head">
              <span className="report-class-badge">{previewRecord.class}</span>
              <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                Filed: {new Date(previewRecord.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className={`report-modal-split ${previewRecord.image_url || previewRecord.video_url ? "has-media" : ""}`}>
              <div className="report-modal-text">
                <h2>{previewRecord.title}</h2>
                <div className="report-card-meta">
                  <span>
                    <i className="fa-solid fa-building" aria-hidden="true" />{" "}
                    {previewRecord.department ? departmentLabel(previewRecord.department) : "Church-wide"}
                  </span>
                  {previewRecord.reference && <span>Ref: {previewRecord.reference}</span>}
                  {previewRecord.is_confidential && <span className="badge subtle">Confidential</span>}
                </div>
                <div className="report-modal-narrative">{previewRecord.summary}</div>
                {previewRecord.storage_path ? (
                  <div style={{ marginTop: 20 }}>
                    <button
                      type="button"
                      className="button"
                      onClick={() => openFile(previewRecord.storage_path)}
                    >
                      <i className="fa-solid fa-file-arrow-down" /> Download Attached Document
                    </button>
                  </div>
                ) : null}
              </div>

              {(previewRecord.image_url || previewRecord.video_url) ? (
                <div className="report-modal-media-wrap">
                  {previewRecord.image_url ? (
                    <div className="report-modal-media-item">
                      <a href={previewRecord.image_url} target="_blank" rel="noreferrer" title="Click for high-resolution view">
                        <img src={previewRecord.image_url} alt={previewRecord.title} />
                      </a>
                    </div>
                  ) : null}
                  {previewRecord.video_url ? (
                    <div className="report-modal-media-item">
                      {previewRecord.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/) ? (
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${previewRecord.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)[1]}`}
                          title="Report Video"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video src={previewRecord.video_url} controls preload="metadata" />
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "file" ? (
        <form className="panel form-grid" onSubmit={saveRecord}>
          <h3 className="panel-title span-2">
            {recordForm.id ? "Amend record / report" : "File a record or report"}
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
            <span>Attach document / PDF (stored privately)</span>
            <input
              className="input"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          <div className="field span-2">
            <span>Attached Image / Photo</span>
            <div className="row" style={{ alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <input
                className="input"
                placeholder="Paste image URL (https://...) or choose photo"
                value={recordForm.image_url || ""}
                onChange={(e) =>
                  setRecordForm({ ...recordForm, image_url: sanitizeMediaUrl(e.target.value) })
                }
                style={{ flex: 1, minWidth: "220px" }}
              />
              <label className="button ghost" style={{ cursor: "pointer", margin: 0 }}>
                <span>{uploadingImage ? "Uploading…" : "Upload Photo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  disabled={uploadingImage}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setUploadingImage(true);
                      const url = await uploadMediaFile(file, "report-images");
                      setRecordForm((prev) => ({ ...prev, image_url: url }));
                    } catch (err) {
                      alert(`Image upload failed: ${err.message}`);
                    } finally {
                      setUploadingImage(false);
                    }
                  }}
                />
              </label>
              {recordForm.image_url ? (
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setRecordForm({ ...recordForm, image_url: "" })}
                >
                  Clear
                </button>
              ) : null}
            </div>
            {recordForm.image_url ? (
              <div style={{ marginTop: 8 }}>
                <img
                  src={recordForm.image_url}
                  alt="Attached preview"
                  style={{
                    maxWidth: "200px",
                    maxHeight: "140px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                  }}
                />
              </div>
            ) : null}
          </div>

          <div className="field span-2">
            <span>Attached Video</span>
            <div className="row" style={{ alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <input
                className="input"
                placeholder="Paste YouTube link or video URL (https://...)"
                value={recordForm.video_url || ""}
                onChange={(e) =>
                  setRecordForm({ ...recordForm, video_url: sanitizeMediaUrl(e.target.value) })
                }
                style={{ flex: 1, minWidth: "220px" }}
              />
              <label className="button ghost" style={{ cursor: "pointer", margin: 0 }}>
                <span>{uploadingVideo ? "Uploading…" : "Upload Video"}</span>
                <input
                  type="file"
                  accept="video/*"
                  style={{ display: "none" }}
                  disabled={uploadingVideo}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setUploadingVideo(true);
                      const url = await uploadMediaFile(file, "report-videos");
                      setRecordForm((prev) => ({ ...prev, video_url: url }));
                    } catch (err) {
                      alert(`Video upload failed: ${err.message}`);
                    } finally {
                      setUploadingVideo(false);
                    }
                  }}
                />
              </label>
              {recordForm.video_url ? (
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setRecordForm({ ...recordForm, video_url: "" })}
                >
                  Clear
                </button>
              ) : null}
            </div>
            {recordForm.video_url ? (
              <div style={{ marginTop: 8 }}>
                {recordForm.video_url.includes("youtube.com") || recordForm.video_url.includes("youtu.be") ? (
                  <p className="badge subtle">YouTube video linked: {recordForm.video_url}</p>
                ) : (
                  <video
                    src={recordForm.video_url}
                    controls
                    style={{
                      maxWidth: "240px",
                      maxHeight: "140px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                    }}
                  />
                )}
              </div>
            ) : null}
          </div>

          <div className="row span-2">
            <button className="button" disabled={busy}>
              {busy
                ? "Saving…"
                : recordForm.id
                  ? "Update record / report"
                  : "File record / report"}
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
