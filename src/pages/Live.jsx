import React, { useCallback, useEffect, useRef, useState } from "react";
import YouTubeEmbed from "../components/YouTubeEmbed";
import AudioPlayer from "../components/AudioPlayer";
import MpesaGiving from "../components/MpesaGiving";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import "./Live.css";

const PLAYLIST_ID = "PLxQiFsFVDeJGSPEKPUGPeypbNRHZbfrCC";
const PLAYLIST_URL = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`;
const PLAYLIST_FEED_URL = `https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`;

const publicUrl = (path) =>
  supabase.storage.from("worship-audio").getPublicUrl(path).data?.publicUrl || "";

const audioSourceFor = (track) =>
  track?.stream_url || (track?.storage_path ? publicUrl(track.storage_path) : "");

const orderOfService = [
  { item: "Call to Worship & Opening Praise", scripture: "Psalm 100:1–5", leader: "Worship Leader & Choirs" },
  { item: "Opening Prayer & Thanksgiving", scripture: "1 Thessalonians 5:16–18", leader: "Assisting Minister" },
  { item: "Sacred Choral Anthems & Hymns", scripture: "Colossians 3:16", leader: "Sanctuary / Youth Choir" },
  { item: "Pastoral Scripture Reading", scripture: "Expository Sunday Passage", leader: "Church Elder / Reader" },
  { item: "Congregational Pastoral Prayer", scripture: "Philippians 4:6–7", leader: "Senior Pastor / Minister" },
  { item: "Offertory & Tithes Dedication", scripture: "2 Corinthians 9:7", leader: "Church Treasurer" },
  { item: "The Word of God (Expository Sermon)", scripture: "Scripture of the Day", leader: "Pulpit Preacher" },
  { item: "Closing Hymn & Benediction", scripture: "Numbers 6:24–26", leader: "Presiding Pastor" },
];

function getNextServiceTime() {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 3 is Wednesday
  const target = new Date(now);

  if (day === 0) {
    // Sunday: Check 8:30 AM or 10:45 AM
    const service1 = new Date(now);
    service1.setHours(8, 30, 0, 0);
    const service2 = new Date(now);
    service2.setHours(10, 45, 0, 0);

    if (now < service1) return service1;
    if (now < service2) return service2;
  }

  // Next upcoming: Wednesday 5:00 PM or next Sunday 8:30 AM
  const daysUntilSunday = (7 - day) % 7 || 7;
  target.setDate(now.getDate() + daysUntilSunday);
  target.setHours(8, 30, 0, 0);
  return target;
}

export default function Live() {
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [liveTrack, setLiveTrack] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [broadcast, setBroadcast] = useState(null);
  const [activeTab, setActiveTab] = useState("bulletin");
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [copiedLink, setCopiedLink] = useState(false);
  const latestId = useRef(null);

  // Next service countdown ticker
  useEffect(() => {
    const updateCountdown = () => {
      const nextTime = getNextServiceTime();
      const diff = Math.max(0, nextTime - new Date());
      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setTimeRemaining({ hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

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
        // Fallback silently if RSS is blocked by CORS
      }
    };

    checkForNewService();
    const interval = window.setInterval(checkForNewService, 60_000);
    return () => window.clearInterval(interval);
  }, [alertsEnabled]);

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
    const interval = window.setInterval(loadAudio, 60_000);
    return () => window.clearInterval(interval);
  }, [loadAudio]);

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

  const handleShare = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    }
  };

  const liveSource = audioSourceFor(liveTrack);
  const isLiveVideo = Boolean(broadcast?.is_live && broadcast?.youtube_video_id);

  return (
    <div className="page-shell live-page">
      <header className="page-heading">
        <span className="eyebrow">Digital Sanctuary &bull; Stream Online</span>
        <h1>Worship with Us from Anywhere.</h1>
        <p>
          {isLiveVideo
            ? "We are broadcasting live now! Join our online congregation in reverent praise and Scripture."
            : "Watch real-time live broadcasts during services or explore our complete catalogue of recent worship recordings."}
        </p>
      </header>

      {/* Hero Stream Player Lockup */}
      <section className="live-player">
        <div className="live-player-header">
          <div>
            {isLiveVideo ? (
              <span className="live-status live-now-tag">
                <span className="live-pulse" aria-hidden="true" /> BROADCASTING LIVE NOW
              </span>
            ) : (
              <span className="live-status live-off-tag">
                <span className="live-off-dot" aria-hidden="true" /> SUNDAY RECORDINGS ARCHIVE
              </span>
            )}
            <h2>{isLiveVideo ? broadcast.title || "Sunday Worship Service" : "Recent Sanctuary Gatherings"}</h2>
            {isLiveVideo && broadcast?.announcement ? (
              <p className="live-announcement-lead">
                {broadcast.announcement}
              </p>
            ) : null}
          </div>

          <div className="live-player-actions">
            <button
              type="button"
              className="live-share-btn"
              onClick={handleShare}
              title="Copy stream link to share"
            >
              <i className={`fa-solid ${copiedLink ? "fa-check" : "fa-share-nodes"}`} aria-hidden="true" />
              <span>{copiedLink ? "Link Copied!" : "Share"}</span>
            </button>
            <a
              className="button gold sm"
              href={isLiveVideo ? `https://www.youtube.com/watch?v=${broadcast.youtube_video_id}` : PLAYLIST_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fa-brands fa-youtube" aria-hidden="true" /> Open YouTube
            </a>
          </div>
        </div>

        {isLiveVideo ? (
          <YouTubeEmbed videoId={broadcast.youtube_video_id} title={broadcast.title || "AIC Hola live service"} />
        ) : (
          <YouTubeEmbed playlistId={broadcast?.youtube_playlist_id || PLAYLIST_ID} title="AIC Hola recent services" />
        )}

        {/* Live Audio Sync */}
        {liveSource && (
          <div className="live-inline-audio">
            <div className="live-inline-audio-tag">
              <span className="live-pulse" /> Live Sanctuary Audio Feed
            </div>
            <AudioPlayer src={liveSource} title={liveTrack.title} subtitle={liveTrack.speaker} autoPlay isLive />
          </div>
        )}
      </section>

      {/* Next Service Countdown Banner (When Offline) */}
      {!isLiveVideo && (
        <section className="live-countdown-banner">
          <div className="countdown-info">
            <span className="countdown-eyebrow">NEXT WORSHIP BROADCAST</span>
            <h3>Sunday Divine Service &bull; Hola Sanctuary</h3>
            <p>1st Service (Swahili) 8:30 AM &bull; 2nd Service (English) 10:45 AM</p>
          </div>
          <div className="countdown-timer-display" aria-label="Time until next service">
            <div className="timer-unit">
              <strong>{String(timeRemaining.hours).padStart(2, "0")}</strong>
              <small>Hours</small>
            </div>
            <span className="timer-sep">:</span>
            <div className="timer-unit">
              <strong>{String(timeRemaining.minutes).padStart(2, "0")}</strong>
              <small>Mins</small>
            </div>
            <span className="timer-sep">:</span>
            <div className="timer-unit">
              <strong>{String(timeRemaining.seconds).padStart(2, "0")}</strong>
              <small>Secs</small>
            </div>
          </div>
        </section>
      )}

      {/* Companion Tabs: Digital Bulletin & Service Giving */}
      <section className="live-companion-section">
        <div className="companion-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "bulletin"}
            className={`companion-tab-btn ${activeTab === "bulletin" ? "active" : ""}`}
            onClick={() => setActiveTab("bulletin")}
          >
            <i className="fa-solid fa-book-bible" aria-hidden="true" />
            <span>Order of Service &amp; Bulletin</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "giving"}
            className={`companion-tab-btn ${activeTab === "giving" ? "active" : ""}`}
            onClick={() => setActiveTab("giving")}
          >
            <i className="fa-solid fa-hand-holding-dollar" aria-hidden="true" />
            <span>Lipa na M-PESA Giving</span>
          </button>
        </div>

        <div className="companion-tab-content">
          {activeTab === "bulletin" && (
            <div className="bulletin-view">
              <div className="bulletin-header">
                <div>
                  <h3>Order of Divine Worship</h3>
                  <p>Follow along with our reverent service liturgy and Scripture reflections.</p>
                </div>
                <span className="bulletin-badge">Sunday Liturgy</span>
              </div>

              <div className="bulletin-items-list">
                {orderOfService.map((entry, idx) => (
                  <div key={entry.item} className="bulletin-row">
                    <span className="bulletin-num">0{idx + 1}</span>
                    <div className="bulletin-details">
                      <strong>{entry.item}</strong>
                      <small>{entry.leader}</small>
                    </div>
                    <span className="bulletin-scripture">{entry.scripture}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "giving" && (
            <div className="live-giving-view">
              <MpesaGiving variant="hub" />
            </div>
          )}
        </div>
      </section>

      {/* Audio Sermons & Recordings Archive */}
      {recordings.length > 0 && (
        <section className="live-audio-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Audio Archive</span>
              <h2>Listen to Recent Recorded Messages</h2>
            </div>
            <p>High-quality audio recordings published by our pulpit ministry.</p>
          </div>

          <div className="live-audio-featured-box">
            <AudioPlayer
              src={audioSourceFor(recordings[0])}
              title={recordings[0].title}
              subtitle={recordings[0].speaker}
            />
          </div>

          {recordings.length > 1 && (
            <ol className="live-audio-list">
              {recordings.slice(1, 6).map((track) => (
                <li key={track.id} className="live-audio-list-item">
                  <div className="audio-item-meta">
                    <i className="fa-solid fa-volume-high" aria-hidden="true" />
                    <div>
                      <strong>{track.title}</strong>
                      <small>{[track.speaker, track.recorded_at].filter(Boolean).join(" · ")}</small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="button secondary sm"
                    onClick={() => {
                      setLiveTrack({ ...track, is_live: false });
                    }}
                  >
                    <i className="fa-solid fa-play" /> Play
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* Notification Banner */}
      <section className="live-note">
        <i className="fa-solid fa-bell" aria-hidden="true" />
        <div>
          <h2>Never Miss a Sanctuary Broadcast</h2>
          <p>Enable browser notifications to be alerted whenever AIC Hola goes live, or subscribe on YouTube.</p>
        </div>
        <div className="live-note-actions">
          <button className="button secondary" type="button" onClick={enableAlerts}>
            {alertsEnabled ? "Alerts Enabled" : "Enable Alerts"}
          </button>
          <a
            className="button gold"
            href="https://www.youtube.com/@nkandi242"
            target="_blank"
            rel="noopener noreferrer"
          >
            Subscribe on YouTube
          </a>
        </div>
      </section>
    </div>
  );
}
