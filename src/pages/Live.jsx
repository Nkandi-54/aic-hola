import React, { useCallback, useEffect, useRef, useState } from "react";
import YouTubeEmbed from "../components/YouTubeEmbed";
import AudioPlayer from "../components/AudioPlayer";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import "./Live.css";

const PLAYLIST_ID = "PLxQiFsFVDeJGSPEKPUGPeypbNRHZbfrCC";
const PLAYLIST_URL = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`;
const PLAYLIST_FEED_URL = `https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`;

const publicUrl = (path) =>
  supabase.storage.from("worship-audio").getPublicUrl(path).data?.publicUrl || "";

const audioSourceFor = (track) =>
  track?.stream_url || (track?.storage_path ? publicUrl(track.storage_path) : "");

export default function Live() {
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [liveTrack, setLiveTrack] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [broadcast, setBroadcast] = useState(null);
  const latestId = useRef(null);

  useEffect(() => {
    const checkForNewService = async () => {
      try {
        const response = await fetch(PLAYLIST_FEED_URL);
        const xml = await response.text();
        const id = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
        if (id && latestId.current && id !== latestId.current && alertsEnabled && Notification.permission === "granted") {
          new Notification("AIC Hola is live", { body: "A new church service is ready to watch." });
        }
        if (id) latestId.current = id;
      } catch {
        // The embedded playlist remains available if the optional alert feed is unavailable.
      }
    };

    checkForNewService();
    const interval = window.setInterval(checkForNewService, 60_000);
    return () => window.clearInterval(interval);
  }, [alertsEnabled]);

  // Load worship audio and live broadcast switchboard settings
  const loadAudio = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const [audioRes, broadcastRes] = await Promise.all([
      supabase
        .from("audio_recordings")
        .select(
          "id,title,description,speaker,storage_path,stream_url,is_live,is_published,recorded_at,created_at",
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("broadcast_settings")
        .select("*")
        .eq("id", "primary")
        .maybeSingle(),
    ]);

    if (!audioRes.error && audioRes.data) {
      const rows = audioRes.data;
      setLiveTrack(rows.find((row) => row.is_live) || null);
      setRecordings(rows.filter((row) => !row.is_live));
    }

    if (!broadcastRes.error && broadcastRes.data) {
      setBroadcast(broadcastRes.data);
    }
  }, []);

  useEffect(() => {
    void loadAudio();
    // Poll for a broadcast starting or ending while the page is open.
    const interval = window.setInterval(loadAudio, 60_000);
    return () => window.clearInterval(interval);
  }, [loadAudio]);

  // Real-time synchronization for instant go-live broadcasts
  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    const channel = supabase
      .channel("live-page-broadcast-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "broadcast_settings" },
        () => void loadAudio(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadAudio]);

  const enableAlerts = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setAlertsEnabled(permission === "granted");
  };

  const liveSource = audioSourceFor(liveTrack);
  const isLiveVideo = Boolean(broadcast?.is_live && broadcast?.youtube_video_id);

  return (
    <div className="page-shell">
      <header className="page-heading">
        <span className="eyebrow">Worship from wherever you are</span>
        <h1>Watch services and recent recordings.</h1>
        <p>
          {isLiveVideo
            ? "We are broadcasting live now! Join our online sanctuary service in worship."
            : "Join us online through our YouTube playlist. New services appear here as they are published."}
        </p>
      </header>

      <section className="live-player">
        <div className="live-player-header">
          <div>
            {isLiveVideo ? (
              <span className="live-status" style={{ background: "#d63031", color: "#fff", borderColor: "#ff7675" }}>
                <span className="live-pulse" aria-hidden="true" /> BROADCASTING LIVE NOW
              </span>
            ) : (
              <span className="live-status">
                <span aria-hidden="true" /> ON YOUTUBE
              </span>
            )}
            <h2>{isLiveVideo ? broadcast.title || "Sunday Worship Service" : "Recent services"}</h2>
            {isLiveVideo && broadcast?.announcement ? (
              <p style={{ margin: "6px 0 0", color: "var(--clay)", fontWeight: "600", fontSize: "0.95rem" }}>
                {broadcast.announcement}
              </p>
            ) : null}
          </div>
          {isLiveVideo ? (
            <a
              className="text-link"
              href={`https://www.youtube.com/watch?v=${broadcast.youtube_video_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch on YouTube <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <a
              className="text-link"
              href={PLAYLIST_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open full playlist <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
        {isLiveVideo ? (
          <YouTubeEmbed videoId={broadcast.youtube_video_id} title={broadcast.title || "AIC Hola live service"} />
        ) : (
          <YouTubeEmbed playlistId={broadcast?.youtube_playlist_id || PLAYLIST_ID} title="AIC Hola recent services" />
        )}
      </section>

      {liveSource ? (
        <section className="live-audio-section">
          <div className="live-audio-heading">
            <span className="live-status live-status-audio">
              <span aria-hidden="true" /> LIVE AUDIO
            </span>
            <h2>Playing now</h2>
            <p>
              High-quality audio of the service, playing automatically with the
              broadcast.
            </p>
          </div>
          <AudioPlayer
            src={liveSource}
            title={liveTrack.title}
            subtitle={liveTrack.speaker}
            autoPlay
            isLive
          />
        </section>
      ) : null}

      {recordings.length > 0 ? (
        <section className="live-audio-section">
          <div className="live-audio-heading">
            <span className="eyebrow">Worship audio</span>
            <h2>Listen to recent services</h2>
            <p>
              HD recordings published by the church — pause, rewind and forward
              at any time.
            </p>
          </div>
          <AudioPlayer
            src={audioSourceFor(recordings[0])}
            title={recordings[0].title}
            subtitle={recordings[0].speaker}
          />
          {recordings.length > 1 ? (
            <ol className="live-audio-list">
              {recordings.slice(1).map((track) => (
                <li key={track.id}>
                  <div>
                    <strong>{track.title}</strong>
                    <small>
                      {[track.speaker, track.recorded_at]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
        </section>
      ) : null}

      <section className="live-note">
        <i className="fa-solid fa-bell" aria-hidden="true" />
        <div>
          <h2>Never miss a service</h2>
          <p>
            Enable browser alerts here, or subscribe on YouTube for alerts when
            you are away.
          </p>
        </div>
        <button className="button secondary" type="button" onClick={enableAlerts}>
          {alertsEnabled ? "Alerts enabled" : "Enable live alerts"}
        </button>
        <a
          className="button secondary"
          href="https://www.youtube.com/@nkandi242"
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit channel
        </a>
      </section>
    </div>
  );
}
