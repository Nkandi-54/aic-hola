import React, { useEffect, useMemo, useState } from "react";
import YouTubeEmbed from "../components/YouTubeEmbed";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { useAudio } from "../context/AudioContext";
import "./Sermons.css";

const channelUrl = "https://www.youtube.com/@nkandi242";

const defaultSermons = [
  {
    id: "default-1",
    title: "Walking in Faith",
    series: "Living by Faith",
    preacher: "AIC Hola Pulpit Ministry",
    scripture: "Proverbs 3:5-6; Hebrews 11:1-6",
    service_date: "2026-09-20",
    description: "A message on trusting God in every situation, walking not by sight but by steady confidence in His promises.",
    written_sermon: `Scripture Focus: Proverbs 3:5-6\n\n"Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight."\n\nMain Message Outline:\n1. The Foundation of Trust — Placing unconditional faith in God's unchanging character.\n2. Surrendering Our Own Understanding — Acknowledging human limitations in times of uncertainty.\n3. Stepping Out into Divine Guidance — When we submit our steps to Him, He clears the way ahead.\n\nPractical Devotional Reflection:\nTake a moment today to release whatever anxieties or uncertainties you are carrying into the Father's hands. Walk forward in quiet obedience, knowing that He goes before you.`,
    video_url: channelUrl,
    accent_color: "#e8bd79",
    is_published: true,
    is_featured: true,
  },
  {
    id: "default-2",
    title: "The Power of Prayer",
    series: "Foundations of Worship",
    preacher: "AIC Hola Pulpit Ministry",
    scripture: "Philippians 4:6-7; James 5:16",
    service_date: "2026-09-13",
    description: "Exploring how prayer transforms lives, brings peace in anxiety, and aligns our hearts with God's perfect will.",
    written_sermon: `Scripture Focus: Philippians 4:6-7\n\n"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."\n\nKey Reflections:\n• Prayer is not conquering God's reluctance; it is laying hold of His willingness.\n• Praying with sincere thanksgiving even before the answer is visible.\n• The supernatural peace that guards our hearts and minds in Christ Jesus.`,
    video_url: channelUrl,
    accent_color: "#b9c8e8",
    is_published: true,
    is_featured: false,
  },
  {
    id: "default-3",
    title: "Love and Fellowship",
    series: "The Body of Christ",
    preacher: "AIC Hola Pulpit Ministry",
    scripture: "1 John 4:7-12; Hebrews 10:24-25",
    service_date: "2026-09-06",
    description: "A sermon about genuine Christian community, sacrificial love, and walking together in unity.",
    written_sermon: `Scripture Focus: 1 John 4:11\n\n"Dear friends, since God so loved us, we also ought to love one another."\n\nPractical Applications:\n1. Bearing one another's burdens in love and patience.\n2. Forgiving as Christ has forgiven us.\n3. Consistent fellowship, prayer meetings, and mutual encouragement across our fellowships.`,
    video_url: channelUrl,
    accent_color: "#eeb0a0",
    is_published: true,
    is_featured: false,
  },
  {
    id: "default-4",
    title: "Hope in Hard Times",
    series: "Anchored in Christ",
    preacher: "AIC Hola Pulpit Ministry",
    scripture: "Romans 8:28, 38-39; Psalm 46:1-3",
    service_date: "2026-08-30",
    description: "Finding unshakable strength, solace, and eternal hope through God's enduring Word.",
    written_sermon: `Scripture Focus: Psalm 46:1\n\n"God is our refuge and strength, an ever-present help in trouble."\n\nEven when the earth gives way and mountains fall into the heart of the sea, our anchor holds firmly in Christ.\n\nNo trial or distress is beyond His sovereign grace.`,
    video_url: channelUrl,
    accent_color: "#a9c8af",
    is_published: true,
    is_featured: false,
  },
];

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
  const [sermons, setSermons] = useState(defaultSermons);
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
      {filteredSermons.length === 0 ? (
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
