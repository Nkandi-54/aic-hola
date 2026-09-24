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

const emptySermonForm = {
  id: "",
  title: "",
  series: "Sunday Main Service",
  preacher: "AIC Hola Pulpit Ministry",
  scripture: "",
  service_date: new Date().toISOString().slice(0, 10),
  description: "",
  written_sermon: "",
  audio_url: "",
  video_url: "",
  attachment_url: "",
  accent_color: "#e8bd79",
  is_published: true,
  is_featured: false,
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

const ACCENT_COLORS = [
  { label: "Gold", value: "#e8bd79" },
  { label: "Soft Blue", value: "#b9c8e8" },
  { label: "Warm Coral", value: "#eeb0a0" },
  { label: "Sage Green", value: "#a9c8af" },
  { label: "Amber", value: "#d4af37" },
  { label: "Emerald", value: "#62d19b" },
];

export default function PastorDesk() {
  const [tab, setTab] = useState("sermons");
  const [schedules, setSchedules] = useState([]);
  const [careRecords, setCareRecords] = useState([]);
  const [sermons, setSermons] = useState([]);

  const [pulpitForm, setPulpitForm] = useState(emptyPulpitForm);
  const [careForm, setCareForm] = useState(emptyCareForm);
  const [sermonForm, setSermonForm] = useState(emptySermonForm);

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCareType, setFilterCareType] = useState("all");
  const [filterSermonFormat, setFilterSermonFormat] = useState("all");
  const [previewManuscript, setPreviewManuscript] = useState(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setError("");

    const [schedulesResult, careResult, sermonsResult] = await Promise.all([
      supabase
        .from("pulpit_schedule")
        .select("id,service_date,service_type,preacher,sermon_theme,scripture_reading,liturgist,notes,status,created_at")
        .order("service_date", { ascending: false }),
      supabase
        .from("pastoral_care_records")
        .select("id,member_name,phone_contact,care_type,visit_date,pastoral_notes,prayer_items,follow_up_date,status,confidentiality_level,created_at")
        .order("visit_date", { ascending: false }),
      supabase
        .from("sermons")
        .select("id,title,series,preacher,scripture,service_date,description,written_sermon,audio_url,video_url,attachment_url,accent_color,is_published,is_featured,views_count,created_at")
        .order("service_date", { ascending: false }),
    ]);

    if (schedulesResult.error) {
      setError(`Pulpit schedule: ${schedulesResult.error.message}`);
    } else {
      setSchedules(schedulesResult.data || []);
    }

    if (careResult.error) {
      if (!schedulesResult.error) {
        setError(`Pastoral records: ${careResult.error.message}`);
      }
    } else {
      setCareRecords(careResult.data || []);
    }

    if (sermonsResult.error) {
      if (!schedulesResult.error && !careResult.error) {
        setError(`Sermons library: ${sermonsResult.error.message}`);
      }
    } else {
      setSermons(sermonsResult.data || []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetPulpit = () => setPulpitForm(emptyPulpitForm);
  const resetCare = () => setCareForm(emptyCareForm);
  const resetSermon = () => setSermonForm(emptySermonForm);

  /* --- Pulpit Schedule Handlers --- */
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

  const publishFromSchedule = (scheduleItem) => {
    setTab("sermons");
    setSermonForm({
      id: "",
      title: scheduleItem.sermon_theme || "",
      series: scheduleItem.service_type || "Sunday Main Service",
      preacher: scheduleItem.preacher || "AIC Hola Pulpit Ministry",
      scripture: scheduleItem.scripture_reading || "",
      service_date: scheduleItem.service_date || new Date().toISOString().slice(0, 10),
      description: scheduleItem.notes || "",
      written_sermon: scheduleItem.notes ? `Exposition Outline:\n\n${scheduleItem.notes}` : "",
      audio_url: "",
      video_url: "",
      attachment_url: "",
      accent_color: "#e8bd79",
      is_published: true,
      is_featured: false,
    });
    setStatus(`Preaching schedule details loaded into sermon editor: "${scheduleItem.sermon_theme}". Add your manuscript, audio, or video link and save.`);
  };

  /* --- Pastoral Care Handlers --- */
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

  /* --- Sermon Library & Publishing Handlers --- */
  const uploadSermonFile = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setStatus("");
    if (type === "audio") setUploadingAudio(true);
    if (type === "attachment") setUploadingAttachment(true);

    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const path = `sermons/${Date.now()}-${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("content-media")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("content-media").getPublicUrl(path);
      const publicUrl = data?.publicUrl || "";

      if (type === "audio") {
        setSermonForm((prev) => ({ ...prev, audio_url: publicUrl }));
        setStatus("Sermon audio uploaded successfully!");
      } else if (type === "attachment") {
        setSermonForm((prev) => ({ ...prev, attachment_url: publicUrl }));
        setStatus("Study manuscript / PDF guide attached!");
      }
    } catch (err) {
      setError(err.message || "Failed to upload media file.");
    } finally {
      if (type === "audio") setUploadingAudio(false);
      if (type === "attachment") setUploadingAttachment(false);
      e.target.value = "";
    }
  };

  const saveSermon = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");

    try {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        title: sermonForm.title.trim(),
        series: sermonForm.series.trim(),
        preacher: sermonForm.preacher.trim(),
        scripture: sermonForm.scripture.trim(),
        service_date: sermonForm.service_date,
        description: sermonForm.description.trim(),
        written_sermon: sermonForm.written_sermon.trim(),
        audio_url: sermonForm.audio_url.trim(),
        video_url: sermonForm.video_url.trim(),
        attachment_url: sermonForm.attachment_url.trim(),
        accent_color: sermonForm.accent_color,
        is_published: Boolean(sermonForm.is_published),
        is_featured: Boolean(sermonForm.is_featured),
      };

      if (!payload.title || !payload.preacher) {
        setError("Please enter both the sermon title and preacher name.");
        setBusy(false);
        return;
      }

      if (sermonForm.id) {
        const { error: updateError } = await supabase
          .from("sermons")
          .update(payload)
          .eq("id", sermonForm.id);
        if (updateError) throw updateError;
        setStatus("Sermon updated successfully in pulpit library.");
      } else {
        payload.created_by = userData?.user?.id;
        const { error: insertError } = await supabase
          .from("sermons")
          .insert([payload]);
        if (insertError) throw insertError;
        setStatus("New sermon published to church library!");
      }

      resetSermon();
      await load();
    } catch (err) {
      setError(err.message || "Failed to save sermon.");
    } finally {
      setBusy(false);
    }
  };

  const deleteSermon = async (item) => {
    if (!window.confirm(`Delete sermon "${item.title}" from the pulpit library?`)) return;
    setBusy(true);
    try {
      const { error: delError } = await supabase
        .from("sermons")
        .delete()
        .eq("id", item.id);
      if (delError) throw delError;
      setStatus("Sermon removed from pulpit library.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleSermonPublish = async (item) => {
    try {
      const next = !item.is_published;
      const { error: patchError } = await supabase
        .from("sermons")
        .update({ is_published: next })
        .eq("id", item.id);
      if (patchError) throw patchError;
      setStatus(`Sermon ${next ? "published to congregation" : "moved to draft"}.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleSermonFeatured = async (item) => {
    try {
      const next = !item.is_featured;
      const { error: patchError } = await supabase
        .from("sermons")
        .update({ is_featured: next })
        .eq("id", item.id);
      if (patchError) throw patchError;
      setStatus(`Sermon ${next ? "marked as Featured Spotlight" : "removed from Spotlight"}.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  /* --- Filtered Lists --- */
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

  const filteredSermons = useMemo(() => {
    return sermons.filter((s) => {
      if (filterSermonFormat === "video" && !s.video_url) return false;
      if (filterSermonFormat === "audio" && !s.audio_url) return false;
      if (filterSermonFormat === "written" && !s.written_sermon) return false;
      if (filterSermonFormat === "drafts" && s.is_published) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.title?.toLowerCase().includes(q) ||
        s.preacher?.toLowerCase().includes(q) ||
        s.scripture?.toLowerCase().includes(q) ||
        s.series?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    });
  }, [sermons, filterSermonFormat, searchQuery]);

  return (
    <ConsoleLayout
      title="Pastor's Study & Pulpit Desk"
      intro="Spiritual shepherd desk: publish sermons with audio, video and manuscripts, plan the preaching rota, and shepherd the flock with confidential care records."
      allow={(_profile, auth) => auth.isPastor}
      denyMessage="The Pastor's Study is reserved for the pastor and church overseers."
    >
      <div className="tab-row" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "sermons"}
          className={`tab-button ${tab === "sermons" ? "active" : ""}`}
          onClick={() => {
            setTab("sermons");
            setSearchQuery("");
          }}
        >
          Sermons &amp; Pulpit Library ({sermons.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "pulpit"}
          className={`tab-button ${tab === "pulpit" ? "active" : ""}`}
          onClick={() => {
            setTab("pulpit");
            setSearchQuery("");
          }}
        >
          Pulpit &amp; Preaching Schedule ({schedules.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "care"}
          className={`tab-button ${tab === "care" ? "active" : ""}`}
          onClick={() => {
            setTab("care");
            setSearchQuery("");
          }}
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

      {/* ====================================================================
          TAB 1: SERMONS & PULPIT LIBRARY
          ==================================================================== */}
      {tab === "sermons" ? (
        <div className="console-split">
          {/* Left Column: Form */}
          <section className="panel" aria-labelledby="sermon-form-heading">
            <h3 id="sermon-form-heading" className="panel-title">
              {sermonForm.id ? "Edit Sermon Library Message" : "Publish Church Sermon"}
            </h3>
            <p className="panel-sub">
              Compose expository sermon manuscripts, attach live video streams or audio recordings, and share the Living Word with the congregation.
            </p>

            <form onSubmit={saveSermon} className="stack">
              <label>
                <span>Sermon Title *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Walking in Faith: Overcoming Anxiety"
                  value={sermonForm.title}
                  onChange={(e) =>
                    setSermonForm({ ...sermonForm, title: e.target.value })
                  }
                />
              </label>

              <div className="grid two">
                <label>
                  <span>Preacher / Speaker *</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rev. Senior Pastor"
                    value={sermonForm.preacher}
                    onChange={(e) =>
                      setSermonForm({ ...sermonForm, preacher: e.target.value })
                    }
                  />
                </label>
                <label>
                  <span>Scripture Reading</span>
                  <input
                    type="text"
                    placeholder="e.g. Proverbs 3:5-6; Hebrews 11:1"
                    value={sermonForm.scripture}
                    onChange={(e) =>
                      setSermonForm({ ...sermonForm, scripture: e.target.value })
                    }
                  />
                </label>
              </div>

              <div className="grid two">
                <label>
                  <span>Service Date</span>
                  <input
                    type="date"
                    required
                    value={sermonForm.service_date}
                    onChange={(e) =>
                      setSermonForm({ ...sermonForm, service_date: e.target.value })
                    }
                  />
                </label>
                <label>
                  <span>Sermon Series / Service</span>
                  <input
                    type="text"
                    placeholder="e.g. Faith in the Wilderness, Sunday Main"
                    value={sermonForm.series}
                    onChange={(e) =>
                      setSermonForm({ ...sermonForm, series: e.target.value })
                    }
                  />
                </label>
              </div>

              <label>
                <span>Brief Summary / Synopsis</span>
                <textarea
                  rows={2}
                  placeholder="Summary of the main theological message and congregation takeaway..."
                  value={sermonForm.description}
                  onChange={(e) =>
                    setSermonForm({ ...sermonForm, description: e.target.value })
                  }
                />
              </label>

              {/* Media Section: Video & Audio */}
              <div style={{ borderTop: "1px solid var(--border, #e5d8c5)", paddingTop: "1rem" }}>
                <span style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem", color: "var(--foreground)" }}>
                  Media Links &amp; Recordings
                </span>

                <label>
                  <span>Video Sermon Link (YouTube or Live stream URL)</span>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... or @nkandi242"
                    value={sermonForm.video_url}
                    onChange={(e) =>
                      setSermonForm({ ...sermonForm, video_url: e.target.value })
                    }
                  />
                </label>

                <div style={{ marginTop: "0.75rem" }}>
                  <label>
                    <span>Audio Sermon (Direct URL or Upload File)</span>
                    <input
                      type="text"
                      placeholder="https://... audio file URL"
                      value={sermonForm.audio_url}
                      onChange={(e) =>
                        setSermonForm({ ...sermonForm, audio_url: e.target.value })
                      }
                    />
                  </label>
                  <div style={{ marginTop: "0.4rem" }}>
                    <label className="button ghost" style={{ cursor: "pointer", display: "inline-block", fontSize: "0.82rem", padding: "4px 10px" }}>
                      <span>{uploadingAudio ? "Uploading Audio..." : "📁 Upload MP3/Audio File"}</span>
                      <input
                        type="file"
                        accept="audio/*"
                        style={{ display: "none" }}
                        disabled={uploadingAudio}
                        onChange={(e) => uploadSermonFile(e, "audio")}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Written Sermon Manuscript & Study Guide */}
              <div style={{ borderTop: "1px solid var(--border, #e5d8c5)", paddingTop: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontWeight: 600, color: "var(--foreground)" }}>
                    Written Sermon Manuscript / Exposition Notes
                  </span>
                  {sermonForm.written_sermon ? (
                    <button
                      type="button"
                      className="button ghost"
                      style={{ fontSize: "0.78rem", padding: "2px 8px" }}
                      onClick={() => setPreviewManuscript(sermonForm)}
                    >
                      👁 Preview Manuscript
                    </button>
                  ) : null}
                </div>

                <label>
                  <textarea
                    rows={8}
                    placeholder="Type or paste the full written sermon, sermon outline, key biblical references, and reflection points for church members to study..."
                    value={sermonForm.written_sermon}
                    onChange={(e) =>
                      setSermonForm({ ...sermonForm, written_sermon: e.target.value })
                    }
                    style={{ fontFamily: "inherit", lineHeight: 1.6 }}
                  />
                </label>

                <div style={{ marginTop: "0.75rem" }}>
                  <label>
                    <span>Study Guide / Manuscript PDF Attachment URL</span>
                    <input
                      type="text"
                      placeholder="https://... manuscript PDF link"
                      value={sermonForm.attachment_url}
                      onChange={(e) =>
                        setSermonForm({ ...sermonForm, attachment_url: e.target.value })
                      }
                    />
                  </label>
                  <div style={{ marginTop: "0.4rem" }}>
                    <label className="button ghost" style={{ cursor: "pointer", display: "inline-block", fontSize: "0.82rem", padding: "4px 10px" }}>
                      <span>{uploadingAttachment ? "Uploading Guide..." : "📄 Upload PDF Study Guide"}</span>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        style={{ display: "none" }}
                        disabled={uploadingAttachment}
                        onChange={(e) => uploadSermonFile(e, "attachment")}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Theme & Display Options */}
              <div style={{ borderTop: "1px solid var(--border, #e5d8c5)", paddingTop: "1rem" }}>
                <span style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem", color: "var(--foreground)" }}>
                  Card Accent Color
                </span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "1rem" }}>
                  {ACCENT_COLORS.map((col) => (
                    <button
                      key={col.value}
                      type="button"
                      style={{
                        background: col.value,
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        border: sermonForm.accent_color === col.value ? "3px solid var(--foreground, #173429)" : "1px solid rgba(0,0,0,0.2)",
                        cursor: "pointer",
                        outline: "none",
                      }}
                      title={col.label}
                      onClick={() => setSermonForm({ ...sermonForm, accent_color: col.value })}
                    />
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={sermonForm.is_published}
                      onChange={(e) =>
                        setSermonForm({ ...sermonForm, is_published: e.target.checked })
                      }
                    />
                    <span><strong>Published</strong> (Visible on church website &amp; mobile app)</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={sermonForm.is_featured}
                      onChange={(e) =>
                        setSermonForm({ ...sermonForm, is_featured: e.target.checked })
                      }
                    />
                    <span><strong>Featured Spotlight</strong> (Highlight in top hero section)</span>
                  </label>
                </div>
              </div>

              <div className="row end">
                {sermonForm.id ? (
                  <button
                    type="button"
                    className="button ghost"
                    onClick={resetSermon}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                ) : null}
                <button type="submit" className="button primary" disabled={busy}>
                  {busy ? "Saving…" : sermonForm.id ? "Update Sermon" : "Publish Sermon"}
                </button>
              </div>
            </form>
          </section>

          {/* Right Column: Library List */}
          <section className="panel" aria-labelledby="sermon-list-heading">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "1rem" }}>
              <div>
                <h3 id="sermon-list-heading" className="panel-title" style={{ margin: 0 }}>
                  Pulpit Sermon Library
                </h3>
                <p className="panel-sub" style={{ margin: "4px 0 0" }}>
                  {sermons.length} total messages in spiritual repository
                </p>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="stack" style={{ marginBottom: "1rem" }}>
              <input
                type="search"
                placeholder="Search sermons by title, preacher, or scripture..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%" }}
              />

              <div className="row" style={{ gap: "6px", flexWrap: "wrap" }}>
                {[
                  ["all", "All Messages"],
                  ["video", "Video Sermons"],
                  ["audio", "Audio Sermons"],
                  ["written", "Written Manuscripts"],
                  ["drafts", "Drafts"],
                ].map(([val, lbl]) => (
                  <button
                    key={val}
                    type="button"
                    className={`button ${filterSermonFormat === val ? "" : "ghost"}`}
                    style={{ fontSize: "0.8rem", padding: "4px 10px" }}
                    onClick={() => setFilterSermonFormat(val)}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {filteredSermons.length === 0 ? (
              <p className="empty-state">No sermons found matching your criteria.</p>
            ) : (
              <div className="table-wrap">
                <table className="console-table">
                  <thead>
                    <tr>
                      <th>Service &amp; Date</th>
                      <th>Title &amp; Preacher</th>
                      <th>Scripture</th>
                      <th>Formats</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSermons.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.service_date}</strong>
                          <br />
                          <small>{item.series || "Main Service"}</small>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {item.is_featured ? (
                              <span title="Featured Spotlight" style={{ color: "#dfb86a" }}>★</span>
                            ) : null}
                            <strong>{item.title}</strong>
                          </div>
                          <small style={{ color: "var(--muted, #655d55)" }}>By {item.preacher}</small>
                        </td>
                        <td>
                          <small>{item.scripture || "—"}</small>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                            {item.video_url ? (
                              <span className="badge subtle" title="Video available">🎥 Video</span>
                            ) : null}
                            {item.audio_url ? (
                              <span className="badge subtle" title="Audio recording available">🎧 Audio</span>
                            ) : null}
                            {item.written_sermon ? (
                              <span className="badge subtle" title="Written manuscript available">📖 Text</span>
                            ) : null}
                            {item.attachment_url ? (
                              <span className="badge subtle" title="PDF study guide attached">📄 PDF</span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`badge ${item.is_published ? "positive" : "subtle"}`}
                            style={{ cursor: "pointer", border: "none" }}
                            title="Click to toggle publish status"
                            onClick={() => toggleSermonPublish(item)}
                          >
                            {item.is_published ? "Published" : "Draft"}
                          </button>
                        </td>
                        <td>
                          <div className="row end" style={{ gap: "4px" }}>
                            {item.written_sermon ? (
                              <button
                                type="button"
                                className="icon-button"
                                title="Read Written Manuscript"
                                onClick={() => setPreviewManuscript(item)}
                              >
                                📖
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="icon-button"
                              title={item.is_featured ? "Remove from Spotlight" : "Set as Featured Spotlight"}
                              style={{ color: item.is_featured ? "#dfb86a" : "inherit" }}
                              onClick={() => toggleSermonFeatured(item)}
                            >
                              ★
                            </button>
                            <button
                              type="button"
                              className="icon-button"
                              title="Edit Sermon"
                              onClick={() => {
                                setSermonForm(item);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              className="icon-button"
                              title="Delete Sermon"
                              onClick={() => deleteSermon(item)}
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
      ) : null}

      {/* ====================================================================
          TAB 2: PULPIT & PREACHING SCHEDULE
          ==================================================================== */}
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
                          <div className="row end" style={{ gap: "4px" }}>
                            <button
                              type="button"
                              className="button ghost"
                              style={{ fontSize: "0.76rem", padding: "4px 8px" }}
                              title="Publish this preaching schedule entry into the Sermon Library"
                              onClick={() => publishFromSchedule(item)}
                            >
                              📚 Publish
                            </button>
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
      ) : null}

      {/* ====================================================================
          TAB 3: CONFIDENTIAL PASTORAL CARE
          ==================================================================== */}
      {tab === "care" ? (
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
                  <span>Visit / Care Date</span>
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
                <span>Pastoral Notes &amp; Shepherding Observations</span>
                <textarea
                  rows={4}
                  required
                  placeholder="Notes on conversation, spiritual state, physical condition, and pastoral counsel given..."
                  value={careForm.pastoral_notes}
                  onChange={(e) =>
                    setCareForm({ ...careForm, pastoral_notes: e.target.value })
                  }
                />
              </label>

              <label>
                <span>Special Prayer Requests &amp; Intercessions</span>
                <textarea
                  rows={2}
                  placeholder="Specific items to uphold in private pastoral prayer..."
                  value={careForm.prayer_items}
                  onChange={(e) =>
                    setCareForm({ ...careForm, prayer_items: e.target.value })
                  }
                />
              </label>

              <div className="grid two">
                <label>
                  <span>Follow-up Date (Optional)</span>
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
                    <option value="in_progress">Ongoing Pastoral Care</option>
                    <option value="completed">Concluded / Comfort Given</option>
                    <option value="followup_needed">Follow-up Required</option>
                  </select>
                </label>
              </div>

              <label>
                <span>Confidentiality Level</span>
                <select
                  value={careForm.confidentiality_level}
                  onChange={(e) =>
                    setCareForm({
                      ...careForm,
                      confidentiality_level: e.target.value,
                    })
                  }
                >
                  <option value="pastor_only">Strictly Pastor Only (Highest Secrecy)</option>
                  <option value="elders_shared">Pastoral Staff &amp; Elders</option>
                </select>
              </label>

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
                  {busy ? "Saving…" : careForm.id ? "Update Record" : "Save Care Record"}
                </button>
              </div>
            </form>
          </section>

          <section className="panel" aria-labelledby="care-list-heading">
            <h3 id="care-list-heading" className="panel-title">
              Pastoral Care &amp; Shepherding Records
            </h3>
            <p className="panel-sub">
              Confidential log of flock pastoral support, sick visitations, and counseling records.
            </p>

            <div className="stack" style={{ marginBottom: "1rem" }}>
              <input
                type="search"
                placeholder="Search member name or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <div className="row" style={{ gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className={`button ${filterCareType === "all" ? "" : "ghost"}`}
                  style={{ fontSize: "0.8rem", padding: "4px 10px" }}
                  onClick={() => setFilterCareType("all")}
                >
                  All
                </button>
                {CARE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className={`button ${filterCareType === type.value ? "" : "ghost"}`}
                    style={{ fontSize: "0.8rem", padding: "4px 10px" }}
                    onClick={() => setFilterCareType(type.value)}
                  >
                    {type.label.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {filteredCareRecords.length === 0 ? (
              <p className="empty-state">No pastoral care records matching filter.</p>
            ) : (
              <div className="table-wrap">
                <table className="console-table">
                  <thead>
                    <tr>
                      <th>Date &amp; Type</th>
                      <th>Member</th>
                      <th>Notes &amp; Prayer</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCareRecords.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.visit_date}</strong>
                          <br />
                          <small>
                            {CARE_TYPES.find((c) => c.value === item.care_type)?.label || item.care_type}
                          </small>
                        </td>
                        <td>
                          <strong>{item.member_name}</strong>
                          {item.phone_contact ? (
                            <>
                              <br />
                              <small>{item.phone_contact}</small>
                            </>
                          ) : null}
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
      ) : null}

      {/* --- Written Manuscript Reader Modal --- */}
      {previewManuscript ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="manuscript-preview-title"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setPreviewManuscript(null)}
        >
          <div
            style={{
              backgroundColor: "var(--background, #fffdf9)",
              color: "var(--foreground, #173429)",
              borderRadius: "16px",
              maxWidth: "720px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
              border: "1px solid var(--border, #e5d8c5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <span className="badge subtle" style={{ marginBottom: "6px", display: "inline-block" }}>
                  {previewManuscript.series || "Sermon Series"}
                </span>
                <h2 id="manuscript-preview-title" style={{ margin: "4px 0", fontSize: "1.5rem" }}>
                  {previewManuscript.title}
                </h2>
                <p style={{ margin: "4px 0", color: "var(--muted, #655d55)", fontSize: "0.9rem" }}>
                  Preached by <strong>{previewManuscript.preacher}</strong> on {previewManuscript.service_date}
                </p>
                {previewManuscript.scripture ? (
                  <p style={{ margin: "4px 0", fontStyle: "italic", color: "var(--clay, #9c4323)" }}>
                    Scripture: {previewManuscript.scripture}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="button ghost"
                style={{ fontSize: "1rem", padding: "6px 12px" }}
                onClick={() => setPreviewManuscript(null)}
              >
                ✕ Close
              </button>
            </div>

            <div
              style={{
                borderTop: "1px solid var(--border, #e5d8c5)",
                paddingTop: "1.25rem",
                whiteSpace: "pre-wrap",
                lineHeight: 1.7,
                fontSize: "1rem",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              {previewManuscript.written_sermon || "No written manuscript recorded."}
            </div>

            {previewManuscript.attachment_url ? (
              <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border, #e5d8c5)", paddingTop: "1rem" }}>
                <a
                  href={previewManuscript.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button gold"
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <span>📄 Download Study Manuscript / PDF</span>
                </a>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </ConsoleLayout>
  );
}
