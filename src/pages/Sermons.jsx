import React, { useEffect, useMemo, useState } from "react";
import YouTubeEmbed from "../components/YouTubeEmbed";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { useAudio } from "../context/AudioContext";
import "./Sermons.css";

const channelUrl = "https://www.youtube.com/@nkandi242";

const extractYouTubeId = (input) => {
  if (!input) return "";
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|shorts\/))([\w-]{11})/,
  );
  return match ? match[1] : "";
};

export default function Sermons() {
  const { playTrack } = useAudio();
  const [sermons, setSermons] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [activeManuscript, setActiveManuscript] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);

  const handlePlayAudio = (sermon) => {
    if (!sermon?.audio_url) return;
    playTrack({
      id: sermon.id,
      title: sermon.title,
      subtitle: `${sermon.preacher}${sermon.service_date ? ` · ${sermon.service_date}` : ""}`,
      src: sermon.audio_url,
    });
  };

  useEffect(() => {
    let channel;
    const fetchSermons = async () => {
      if (!isSupabaseConfigured) return;
      try {
        const { data, error } = await supabase
          .from("sermons")
          .select("*")
          .eq("is_published", true)
          .order("service_date", { ascending: false });

        if (!error && data && data.length > 0) {
          setSermons(data);
        }
      } catch (err) {
        // Fallback to default sermons
      }
    };

    void fetchSermons();

    if (isSupabaseConfigured) {
      try {
        channel = supabase
          .channel("public:sermons_feed")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "sermons" },
            () => {
              void fetchSermons();
            },
          )
          .subscribe();
      } catch {
        channel = null;
      }
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const featuredSermon = useMemo(() => {
    return sermons.find((s) => s.is_featured) || sermons[0];
  }, [sermons]);

  const filteredSermons = useMemo(() => {
    return sermons.filter((s) => {
      if (activeFilter === "video" && !s.video_url) return false;
      if (activeFilter === "audio" && !s.audio_url) return false;
      if (activeFilter === "written" && !s.written_sermon) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.title?.toLowerCase().includes(q) ||
        s.preacher?.toLowerCase().includes(q) ||
        s.scripture?.toLowerCase().includes(q) ||
        s.series?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    });
  }, [sermons, activeFilter, search]);

  const handleOpenVideo = (sermon) => {
    const ytId = extractYouTubeId(sermon.video_url);
    if (ytId) {
      setActiveVideo({ ...sermon, videoId: ytId });
    } else if (sermon.video_url) {
      window.open(sermon.video_url, "_blank", "noopener,noreferrer");
    } else {
      window.open(channelUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="page-shell">
      <header className="page-heading">
        <span className="eyebrow">Messages for every season</span>
        <h1>Listen, reflect, and grow.</h1>
        <p>
          Explore expository sermons, sound biblical doctrine, streaming video messages, and written study manuscripts from the AIC Hola pulpit.
        </p>
      </header>

      {/* Featured Teaching Scripture Spotlight */}
      {featuredSermon ? (
        <section className="sermon-spotlight-card" aria-label="Featured Scripture">
          <div className="sermon-spotlight-top">
            <span className="sermon-scripture-badge">
              <i className="fa-solid fa-book-bible" aria-hidden="true" /> Featured Teaching
            </span>
            <span className="sermon-spotlight-series">
              {featuredSermon.series || "Sermon Series"}
            </span>
          </div>

          <h2 className="sermon-spotlight-title">{featuredSermon.title}</h2>

          {featuredSermon.scripture ? (
            <blockquote className="sermon-spotlight-scripture">
              &ldquo;{featuredSermon.scripture}&rdquo;
            </blockquote>
          ) : null}

          {featuredSermon.description ? (
            <p className="sermon-spotlight-desc">{featuredSermon.description}</p>
          ) : null}

          <div className="sermon-spotlight-meta">
            {featuredSermon.video_url ? (
              <button
                type="button"
                className="button gold"
                onClick={() => handleOpenVideo(featuredSermon)}
              >
                <i className="fa-solid fa-circle-play" aria-hidden="true" /> Watch Message
              </button>
            ) : null}

            {featuredSermon.audio_url ? (
              <button
                type="button"
                className="button ghost"
                style={{ borderColor: "#dfb86a", color: "#fff9f3" }}
                onClick={() => handlePlayAudio(featuredSermon)}
              >
                <i className="fa-solid fa-headphones" aria-hidden="true" /> Listen Audio
              </button>
            ) : null}

            {featuredSermon.written_sermon ? (
              <button
                type="button"
                className="button ghost"
                style={{ borderColor: "rgba(255,255,255,0.4)", color: "#fff9f3" }}
                onClick={() => setActiveManuscript(featuredSermon)}
              >
                <i className="fa-solid fa-book-open" aria-hidden="true" /> Read Manuscript
              </button>
            ) : null}

            <span className="sermon-spotlight-author">
              By {featuredSermon.preacher} · {featuredSermon.service_date}
            </span>
          </div>
        </section>
      ) : null}

      {/* Search and Filters Bar */}
      <div className="sermons-filter-bar">
        <div className="sermons-search-wrap">
          <i className="fa-solid fa-magnifying-glass sermons-search-icon" aria-hidden="true" />
          <input
            type="search"
            className="sermons-search-input"
            placeholder="Search messages by title, preacher, scripture, or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="sermons-chips-row" role="tablist" aria-label="Sermon format filters">
          {[
            ["all", "All Messages"],
            ["video", "Video Sermons"],
            ["audio", "Audio Sermons"],
            ["written", "Written Manuscripts"],
          ].map(([val, label]) => (
            <button
              key={val}
              type="button"
              role="tab"
              aria-selected={activeFilter === val}
              className={`sermon-filter-chip ${activeFilter === val ? "active" : ""}`}
              onClick={() => setActiveFilter(val)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sermons Grid */}
      {sermons.length === 0 ? (
        <div className="sermons-empty-banner" style={{ textAlign: "center", padding: "48px 24px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "18px", margin: "24px 0" }}>
          <i className="fa-solid fa-book-bible" style={{ fontSize: "2.4rem", color: "var(--gold)", marginBottom: "16px", display: "inline-block" }} aria-hidden="true" />
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", color: "var(--forest-deep)", marginBottom: "10px" }}>AIC Hola Pulpit Ministry</h3>
          <p style={{ maxWidth: "540px", margin: "0 auto 20px", color: "var(--ink-soft)", lineHeight: "1.6", fontSize: "0.95rem" }}>
            Expository sermons, audio recordings, and study manuscripts published by the pastor will be catalogued here. You can also explore our worship broadcasts on our official YouTube channel.
          </p>
          <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="button gold">
            <i className="fa-brands fa-youtube" aria-hidden="true" /> Watch Services on YouTube
          </a>
        </div>
      ) : filteredSermons.length === 0 ? (
        <p className="empty-state" style={{ textAlign: "center", padding: "40px" }}>
          No messages found matching your search. Try adjusting the filter or search keywords.
        </p>
      ) : (
        <div className="sermons-grid">
          {filteredSermons.map((sermon) => (
            <article
              key={sermon.id || sermon.title}
              className="sermon-card-item"
              style={{
                borderTop: `4px solid ${sermon.accent_color || "#e8bd79"}`,
              }}
            >
              <div className="sermon-card-top">
                <span className="sermon-card-date">{sermon.service_date}</span>
                <div className="sermon-card-formats">
                  {sermon.video_url ? (
                    <span className="sermon-format-tag" title="Video sermon">
                      <i className="fa-solid fa-video" aria-hidden="true" /> Video
                    </span>
                  ) : null}
                  {sermon.audio_url ? (
                    <span className="sermon-format-tag" title="Audio recording">
                      <i className="fa-solid fa-headphones" aria-hidden="true" /> Audio
                    </span>
                  ) : null}
                  {sermon.written_sermon ? (
                    <span className="sermon-format-tag" title="Written manuscript available">
                      <i className="fa-solid fa-book-open" aria-hidden="true" /> Text
                    </span>
                  ) : null}
                </div>
              </div>

              <h3 className="sermon-card-title">{sermon.title}</h3>

              {sermon.scripture ? (
                <span className="sermon-card-scripture">
                  <i className="fa-solid fa-bookmark" aria-hidden="true" /> {sermon.scripture}
                </span>
              ) : null}

              <p className="sermon-card-desc">
                {sermon.description || "Biblical exposition and spiritual encouragement for our church community."}
              </p>

              <span className="sermon-card-preacher">
                <i className="fa-solid fa-user" aria-hidden="true" style={{ marginRight: "6px" }} />
                {sermon.preacher} {sermon.series ? `· ${sermon.series}` : ""}
              </span>

              <div className="sermon-card-actions">
                {sermon.video_url ? (
                  <button
                    type="button"
                    className="sermon-btn primary"
                    onClick={() => handleOpenVideo(sermon)}
                  >
                    <i className="fa-solid fa-play" aria-hidden="true" /> Watch
                  </button>
                ) : null}

                {sermon.audio_url ? (
                  <button
                    type="button"
                    className="sermon-btn gold"
                    onClick={() => handlePlayAudio(sermon)}
                  >
                    <i className="fa-solid fa-headphones" aria-hidden="true" /> Listen
                  </button>
                ) : null}

                {sermon.written_sermon ? (
                  <button
                    type="button"
                    className="sermon-btn ghost"
                    onClick={() => setActiveManuscript(sermon)}
                  >
                    <i className="fa-solid fa-book-open-reader" aria-hidden="true" /> Read Manuscript
                  </button>
                ) : null}

                {sermon.attachment_url ? (
                  <a
                    href={sermon.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sermon-btn ghost"
                    title="Download Study Guide PDF"
                  >
                    <i className="fa-solid fa-file-pdf" aria-hidden="true" /> PDF Guide
                  </a>
                ) : null}

                {!sermon.video_url && !sermon.audio_url && !sermon.written_sermon ? (
                  <a
                    href={channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sermon-btn ghost"
                  >
                    <i className="fa-brands fa-youtube" aria-hidden="true" /> YouTube Channel
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Daily Scripture Reflection Card */}
      <section className="sermon-devotion-card" aria-label="Daily Scripture Reflection">
        <div className="sermon-devotion-icon" aria-hidden="true">
          <i className="fa-solid fa-book-open-reader" />
        </div>
        <div className="sermon-devotion-body">
          <span className="sermon-devotion-title">Daily Scripture Reflection</span>
          <blockquote className="sermon-devotion-quote">
            &ldquo;Your word is a lamp for my feet, a light on my path.&rdquo; &mdash; Psalm 119:105
          </blockquote>
        </div>
      </section>

      {/* --- Written Manuscript Reader Modal --- */}
      {activeManuscript ? (
        <div
          className="sermon-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="manuscript-title"
          onClick={() => setActiveManuscript(null)}
        >
          <div className="sermon-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="sermon-modal-header">
              <div>
                <span className="badge subtle" style={{ marginBottom: "8px", display: "inline-block" }}>
                  {activeManuscript.series || "Pulpit Teaching"}
                </span>
                <h2 id="manuscript-title" style={{ margin: "4px 0", fontSize: "1.6rem" }}>
                  {activeManuscript.title}
                </h2>
                <p style={{ margin: "4px 0", color: "var(--muted)", fontSize: "0.92rem" }}>
                  Ministered by <strong>{activeManuscript.preacher}</strong> on {activeManuscript.service_date}
                </p>
                {activeManuscript.scripture ? (
                  <p style={{ margin: "4px 0", fontStyle: "italic", color: "var(--clay)" }}>
                    Scripture: {activeManuscript.scripture}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="button ghost"
                style={{ padding: "6px 12px", fontSize: "0.95rem" }}
                onClick={() => setActiveManuscript(null)}
              >
                ✕ Close
              </button>
            </div>

            <div className="sermon-modal-body">
              {activeManuscript.written_sermon}
            </div>

            {activeManuscript.attachment_url ? (
              <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
                <a
                  href={activeManuscript.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button gold"
                >
                  <i className="fa-solid fa-file-pdf" aria-hidden="true" style={{ marginRight: "8px" }} />
                  Download Complete Study Guide / Manuscript (PDF)
                </a>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* --- Video Player Modal --- */}
      {activeVideo ? (
        <div
          className="sermon-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-title"
          onClick={() => setActiveVideo(null)}
        >
          <div className="sermon-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="sermon-modal-header">
              <div>
                <h3 id="video-title" style={{ margin: 0 }}>{activeVideo.title}</h3>
                <small style={{ color: "var(--muted)" }}>Preacher: {activeVideo.preacher}</small>
              </div>
              <button
                type="button"
                className="button ghost"
                onClick={() => setActiveVideo(null)}
              >
                ✕ Close
              </button>
            </div>
            <div style={{ marginTop: "16px" }}>
              <YouTubeEmbed videoId={activeVideo.videoId} title={activeVideo.title} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
