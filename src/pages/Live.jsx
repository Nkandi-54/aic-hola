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

  // Load worship audio: the live broadcast (which auto-plays) and the latest
  // published recordings for on-demand listening.
  const loadAudio = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase
      .from("audio_recordings")
      .select(
        "id,title,description,speaker,storage_path,stream_url,is_live,is_published,recorded_at,created_at",
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return;

    const rows = data || [];
    setLiveTrack(rows.find((row) => row.is_live) || null);
    setRecordings(rows.filter((row) => !row.is_live));
  }, []);

  useEffect(() => {
    void loadAudio();
    // Poll for a broadcast starting or ending while the page is open.
    const interval = window.setInterval(loadAudio, 60_000);
    return () => window.clearInterval(interval);
  }, [loadAudio]);

  const enableAlerts = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setAlertsEnabled(permission === "granted");
  };

  const liveSource = audioSourceFor(liveTrack);

  return (
    <div className="page-shell">
      <header className="page-heading">
        <span className="eyebrow">Worship from wherever you are</span>
        <h1>Watch services and recent recordings.</h1>
        <p>
          Join us online through our YouTube playlist. New services will appear
          there as they are published.
        </p>
      </header>

      <section className="live-player">
        <div className="live-player-header">
          <div>
            <span className="live-status">
              <span aria-hidden="true" /> ON YOUTUBE
            </span>
            <h2>Recent services</h2>
          </div>
          <a
            className="text-link"
            href={PLAYLIST_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open full playlist <span aria-hidden="true">↗</span>
          </a>
        </div>
        <YouTubeEmbed playlistId={PLAYLIST_ID} title="AIC Hola recent services" />
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
