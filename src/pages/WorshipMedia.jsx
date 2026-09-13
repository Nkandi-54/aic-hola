import React, { useCallback, useEffect, useState } from "react";
import ConsoleLayout from "../components/ConsoleLayout";
import AudioPlayer from "../components/AudioPlayer";
import { supabase } from "../lib/supabase";

const isMissingAudioSchema = (failure) =>
  failure?.code === "42P01" ||
  /audio_recordings|schema cache/i.test(failure?.message || "");

const mediaSchemaMessage =
  "Worship media is not connected yet. An administrator must run supabase/schema-04-worship-audio.sql in the Supabase SQL editor, then refresh this page.";

const emptyForm = {
  id: "",
  title: "",
  description: "",
  speaker: "",
  recorded_at: new Date().toISOString().slice(0, 10),
  is_published: true,
  is_live: false,
  stream_url: "",
  storage_path: "",
};

const publicUrl = (path) =>
  supabase.storage.from("worship-audio").getPublicUrl(path).data?.publicUrl ||
  "";

/**
 * Worship media console.
 *
 * Administrators and the pastor publish the church's high-quality audio: service
 * recordings uploaded as files, plus an optional live broadcast feed. Whatever
 * is marked live plays automatically on the public Live page.
 */
export default function WorshipMedia() {
  const [tracks, setTracks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [mediaSetupRequired, setMediaSetupRequired] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error: failure } = await supabase
      .from("audio_recordings")
      .select(
        "id,title,description,speaker,storage_path,stream_url,duration_seconds,kind,is_live,is_published,recorded_at,created_at",
      )
      .order("created_at", { ascending: false });
    if (failure) {
      setMediaSetupRequired(isMissingAudioSchema(failure));
      setError(
        isMissingAudioSchema(failure) ? mediaSchemaMessage : failure.message,
      );
    } else {
      setMediaSetupRequired(false);
    }
    setTracks(data || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reset = () => {
    setForm(emptyForm);
    setFile(null);
    setPreview(null);
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    setError("");

    let storagePath = form.storage_path || "";

    if (file) {
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const upload = await supabase.storage
        .from("worship-audio")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upload.error) {
        setError(`Upload failed: ${upload.error.message}`);
        setBusy(false);
        return;
      }
      storagePath = path;
    }

    if (!storagePath && !form.stream_url) {
      setError("Add an audio file or a live stream URL.");
      setBusy(false);
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      speaker: form.speaker,
      recorded_at: form.recorded_at || null,
      is_published: form.is_published,
      is_live: form.is_live,
      stream_url: form.stream_url,
      kind: form.is_live ? "live" : "audio",
      storage_path: storagePath,
    };

    const result = form.id
      ? await supabase
          .from("audio_recordings")
          .update(payload)
          .eq("id", form.id)
      : await supabase.from("audio_recordings").insert(payload);

    if (result.error) {
      setMediaSetupRequired(isMissingAudioSchema(result.error));
      setError(
        isMissingAudioSchema(result.error)
          ? mediaSchemaMessage
          : `Could not save: ${result.error.message}`,
      );
    } else {
      setStatus(
        form.is_live
          ? "Live broadcast started — it will play automatically on the Live page."
          : "Recording published.",
      );
      reset();
      await load();
    }
    setBusy(false);
  };

  const editTrack = (track) => {
    setForm({
      id: track.id,
      title: track.title,
      description: track.description || "",
      speaker: track.speaker || "",
      recorded_at: track.recorded_at || "",
      is_published: Boolean(track.is_published),
      is_live: Boolean(track.is_live),
      stream_url: track.stream_url || "",
      storage_path: track.storage_path || "",
    });
    setPreview(
      track.stream_url ||
        (track.storage_path ? publicUrl(track.storage_path) : ""),
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleLive = async (track) => {
    const next = !track.is_live;
    setStatus("");
    setError("");
    const { error: failure } = await supabase
      .from("audio_recordings")
      .update({ is_live: next, kind: next ? "live" : "audio" })
      .eq("id", track.id);
    if (failure) {
      setMediaSetupRequired(isMissingAudioSchema(failure));
      setError(
        isMissingAudioSchema(failure) ? mediaSchemaMessage : failure.message,
      );
    }
    else
      setStatus(
        next
          ? "Broadcast is live — it now plays automatically on the Live page."
          : "Broadcast stopped.",
      );
    await load();
  };

  const remove = async (track) => {
    setError("");
    if (track.storage_path) {
      await supabase.storage.from("worship-audio").remove([track.storage_path]);
    }
    const { error: failure } = await supabase
      .from("audio_recordings")
      .delete()
      .eq("id", track.id);
    if (failure) {
      setMediaSetupRequired(isMissingAudioSchema(failure));
      setError(
        isMissingAudioSchema(failure) ? mediaSchemaMessage : failure.message,
      );
    }
    else setStatus("Recording deleted (logged).");
    await load();
  };

  const liveTrack = tracks.find((track) => track.is_live);

  return (
    <ConsoleLayout
      title="Worship media"
      intro="Publish high-quality service audio and start a live broadcast. Only administrators and the pastor may manage this library."
      allow={(_profile, auth) =>
        auth.isAdmin || auth.profile?.role === "pastor"
      }
      denyMessage="Worship media is managed by administrators and the pastor. Ask one of them to publish audio for the church."
    >
      {error ? (
        <section className={`panel ${mediaSetupRequired ? "setup-notice" : ""}`} role="alert">
          <h3 className="panel-title">
            {mediaSetupRequired ? "Media setup needed" : "Media could not load"}
          </h3>
          <p className="panel-sub">{error}</p>
          {mediaSetupRequired ? (
            <p className="panel-sub">
              This does not change passwords, roles, sessions or security
              policies. It only creates the worship media table and storage
              bucket defined by the project migration.
            </p>
          ) : null}
        </section>
      ) : null}
      {status ? (
        <p className="badge subtle" role="status">
          {status}
        </p>
      ) : null}

      {liveTrack ? (
        <section className="panel">
          <h3 className="panel-title">Broadcasting now</h3>
          <p className="panel-sub">
            This plays automatically for everyone on the Live page.
          </p>
          <AudioPlayer
            src={
              liveTrack.stream_url || publicUrl(liveTrack.storage_path) || ""
            }
            title={liveTrack.title}
            subtitle={liveTrack.speaker}
            isLive
          />
        </section>
      ) : null}

      {!mediaSetupRequired ? <form className="panel form-grid" onSubmit={save}>
        <h3 className="panel-title span-2">
          {form.id ? "Edit worship audio" : "Publish worship audio"}
        </h3>

        <label className="field">
          <span>Title</span>
          <input
            className="input"
            required
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
          />
        </label>

        <label className="field">
          <span>Speaker / service</span>
          <input
            className="input"
            value={form.speaker}
            onChange={(event) =>
              setForm({ ...form, speaker: event.target.value })
            }
          />
        </label>

        <label className="field">
          <span>Recorded on</span>
          <input
            className="input"
            type="date"
            value={form.recorded_at}
            onChange={(event) =>
              setForm({ ...form, recorded_at: event.target.value })
            }
          />
        </label>

        <label className="field">
          <span>Live stream URL (optional)</span>
          <input
            className="input"
            placeholder="https://…/stream.mp3"
            value={form.stream_url}
            onChange={(event) =>
              setForm({ ...form, stream_url: event.target.value })
            }
          />
        </label>

        <label className="field span-2">
          <span>Audio file {form.storage_path ? "(replace)" : ""}</span>
          <input
            className="input"
            type="file"
            accept="audio/*"
            onChange={(event) => {
              const next = event.target.files?.[0] || null;
              setFile(next);
              setPreview(next ? URL.createObjectURL(next) : "");
            }}
          />
        </label>

        <label className="field span-2">
          <span>Description</span>
          <textarea
            className="textarea"
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />
        </label>

        <label className="field">
          <span>Published</span>
          <select
            className="select"
            value={form.is_published ? "yes" : "no"}
            onChange={(event) =>
              setForm({ ...form, is_published: event.target.value === "yes" })
            }
          >
            <option value="yes">Yes — visible on Live</option>
            <option value="no">No — draft only</option>
          </select>
        </label>

        <label className="field">
          <span>Broadcast live</span>
          <select
            className="select"
            value={form.is_live ? "yes" : "no"}
            onChange={(event) =>
              setForm({ ...form, is_live: event.target.value === "yes" })
            }
          >
            <option value="no">No — recording</option>
            <option value="yes">Yes — go live now</option>
          </select>
        </label>

        <div className="row span-2">
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : form.id ? "Update" : "Publish"}
          </button>
          {form.id || file ? (
            <button className="button ghost" type="button" onClick={reset}>
              Cancel
            </button>
          ) : null}
        </div>
      </form> : null}

      {!mediaSetupRequired && preview && !form.is_live ? (
        <section className="panel">
          <h3 className="panel-title">Preview</h3>
          <AudioPlayer
            src={preview}
            title={form.title || "Untitled recording"}
            subtitle={form.speaker}
          />
        </section>
      ) : null}

      {!mediaSetupRequired ? <section className="panel">
        <h3 className="panel-title">Audio library</h3>
        <p className="panel-sub">
          {tracks.length === 0
            ? "No worship audio published yet."
            : `${tracks.length} recording${tracks.length === 1 ? "" : "s"} in the library.`}
        </p>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Speaker</th>
                <th>Recorded</th>
                <th>State</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tracks.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <p className="empty-state">
                      Publish your first recording above.
                    </p>
                  </td>
                </tr>
              ) : (
                tracks.map((track) => (
                  <tr key={track.id}>
                    <td>
                      <strong>{track.title}</strong>
                      {track.description ? (
                        <>
                          <br />
                          <small>{track.description.slice(0, 70)}</small>
                        </>
                      ) : null}
                    </td>
                    <td>{track.speaker || "—"}</td>
                    <td>{track.recorded_at || "—"}</td>
                    <td>
                      {track.is_live ? (
                        <span className="badge">Live</span>
                      ) : track.is_published ? (
                        <span className="badge subtle">Published</span>
                      ) : (
                        <span className="badge subtle">Draft</span>
                      )}
                    </td>
                    <td className="row end">
                      <button
                        className="button ghost"
                        onClick={() => toggleLive(track)}
                      >
                        {track.is_live ? "Stop live" : "Go live"}
                      </button>
                      <button
                        className="icon-button"
                        title="Edit"
                        onClick={() => editTrack(track)}
                      >
                        ✎
                      </button>
                      <button
                        className="icon-button"
                        title="Delete"
                        onClick={() => remove(track)}
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
      </section> : null}
    </ConsoleLayout>
  );
}
