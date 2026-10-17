import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { updateDepartments, updates } from "../data/updates";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import "./Updates.css";

function MediaVideoPlayer({ url, title }) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (ytMatch) {
    return (
      <div className="update-video-wrap">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${ytMatch[1]}`}
          title={title || "Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="update-video-frame"
        />
      </div>
    );
  }
  return (
    <div className="update-video-wrap">
      <video src={url} controls className="update-video-player" preload="metadata" />
    </div>
  );
}

export default function Updates() {
  const [department, setDepartment] = useState("All");
  const [noticeList, setNoticeList] = useState(updates);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const loadNotices = () => supabase
      .from("notices")
      .select("id,department,title,description,published_at,pinned,image_url,video_url")
      .order("pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        if (!data || data.length === 0) {
          setNoticeList([]);
          return;
        }
        setNoticeList(data.map((item) => ({
          ...item,
          department: item.department.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
          date: new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(item.published_at)),
          icon: "fa-bullhorn",
          accent: "#e7b98d",
          image_url: item.image_url || "",
          video_url: item.video_url || "",
        })));
      })
      .catch(() => {
        setNoticeList([]);
      });

    void loadNotices();
    const channel = supabase.channel("public-notices-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "notices" }, () => void loadNotices())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const visibleUpdates = useMemo(
    () => department === "All" ? noticeList : noticeList.filter((item) => item.department === department),
    [department, noticeList]
  );

  return (
    <div className="page-shell updates-page">
      <Link className="back-link" to="/">← Back to home</Link>
      <header className="page-heading updates-heading">
        <span className="eyebrow">Church noticeboard</span>
        <h1>Stay in the know.</h1>
        <p>Events, plans, and messages from every department at AIC Hola.</p>
      </header>
      <section aria-labelledby="updates-title">
        <div className="section-heading"><div><span className="eyebrow">Updates</span><h2 id="updates-title">Latest from church life</h2></div><p>The church family, in one place.</p></div>
        <div className="update-filters" role="group" aria-label="Filter updates by department">
          {updateDepartments.map((item) => <button key={item} className={department === item ? "active" : ""} type="button" aria-pressed={department === item} onClick={() => setDepartment(item)}>{item}</button>)}
        </div>
        <div className="updates-list">
          {visibleUpdates.length === 0 ? (
            <div className="updates-empty-state" style={{ textAlign: "center", padding: "48px 20px", gridColumn: "1 / -1", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "16px" }}>
              <i className="fa-solid fa-bullhorn" style={{ fontSize: "2rem", color: "var(--gold)", marginBottom: "12px", display: "inline-block" }} aria-hidden="true" />
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", color: "var(--forest-deep)", marginBottom: "8px" }}>No Bulletins at this Time</h3>
              <p style={{ color: "var(--ink-soft)", maxWidth: "460px", margin: "0 auto", fontSize: "0.92rem", lineHeight: "1.5" }}>
                {department === "All"
                  ? "Official church notices, department updates, and event announcements will be posted here as they are published."
                  : `No bulletins currently posted for ${department}. Check back soon or select "All" for church-wide updates.`}
              </p>
            </div>
          ) : (
            visibleUpdates.map((item) => <article className={`update-card ${item.image_url || item.video_url ? "has-media" : ""}`} key={item.id}>
              <div className="update-card-topline">
                <span className="update-icon" style={{ backgroundColor: item.accent }}><i className={`fa-solid ${item.icon}`} aria-hidden="true" /></span>
                <span className="update-department">{item.department}</span>
                {item.pinned && <span className="update-pinned">Pinned</span>}
              </div>
              {item.image_url ? (
                <div className="update-image-wrap">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="update-image"
                    loading="lazy"
                  />
                </div>
              ) : null}
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {item.video_url ? (
                <MediaVideoPlayer url={item.video_url} title={item.title} />
              ) : null}
              <small>{item.date}</small>
            </article>)
          )}
        </div>
      </section>
    </div>
  );
}
