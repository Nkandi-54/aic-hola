import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageIntro from "../components/PageIntro";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import "./Calendar.css";

const baselineEvents = [
  {
    id: "base-1",
    title: "Sunday Divine Service 1 (Swahili)",
    description: "Morning worship service, choir ministry, prayer, and expository sermon in Swahili.",
    department: "Sunday Worship",
    time_display: "Every Sunday · 8:30 AM – 10:15 AM",
    location: "Main Sanctuary",
    category: "Sunday Worship",
    badge: "Weekly Gathering",
    accent: "#dfb86a",
    icon: "fa-sun",
  },
  {
    id: "base-2",
    title: "Sunday Divine Service 2 (English)",
    description: "Family worship service, choral praise, and expository sermon in English.",
    department: "Sunday Worship",
    time_display: "Every Sunday · 10:45 AM – 12:30 PM",
    location: "Main Sanctuary",
    category: "Sunday Worship",
    badge: "Weekly Gathering",
    accent: "#143829",
    icon: "fa-church",
  },
  {
    id: "base-3",
    title: "Watoto Sunday School Ministry",
    description: "Age-appropriate Bible lessons, memory verses, and singing for children ages 3–12.",
    department: "Sunday School",
    time_display: "Every Sunday · 8:30 AM & 10:45 AM",
    location: "Sunday School Hall",
    category: "Children & Family",
    badge: "Ages 3–12",
    accent: "#e8bd79",
    icon: "fa-children",
  },
  {
    id: "base-4",
    title: "Youth & Teens Fellowship",
    description: "Dynamic praise, relevant Bible discussions, peer encouragement, and youth mentorship.",
    department: "Youth Ministry",
    time_display: "Every Sunday · 2:00 PM – 4:00 PM",
    location: "Youth Center",
    category: "Youth & Teens",
    badge: "Teens & Young Adults",
    accent: "#62d19b",
    icon: "fa-users-rays",
  },
  {
    id: "base-5",
    title: "Midweek Prayer & Intercession",
    description: "Congregational prayer meeting standing in the gap for families, the town of Hola, and our nation.",
    department: "Pastoral Team",
    time_display: "Wednesdays · 5:00 PM – 6:30 PM",
    location: "Sanctuary Prayer Hall",
    category: "Prayer & Intercession",
    badge: "Congregational Prayer",
    accent: "#9c4125",
    icon: "fa-hands-praying",
  },
  {
    id: "base-6",
    title: "Sanctuary & Youth Choir Rehearsals",
    description: "Weekly voice training, music rehearsal, and devotional preparation for Sunday services.",
    department: "Choir Ministry",
    time_display: "Fridays & Saturdays · 4:30 PM",
    location: "Sanctuary Choir Stall",
    category: "Choir Ministry",
    badge: "Worship Teams",
    accent: "#d4af37",
    icon: "fa-music",
  },
  {
    id: "base-7",
    title: "Monthly Kesha — Night of Prayer & Worship",
    description: "All-night prayer vigil, spiritual breakthrough, and worship for the entire congregation.",
    department: "Pastoral Team",
    time_display: "Last Friday of the Month · 9:00 PM – 5:00 AM",
    location: "Main Sanctuary",
    category: "Prayer & Intercession",
    badge: "Monthly Vigil",
    accent: "#b9c8e8",
    icon: "fa-moon",
  },
];

const categories = [
  "All",
  "Sunday Worship",
  "Children & Family",
  "Youth & Teens",
  "Prayer & Intercession",
  "Choir Ministry",
];

const formatDate = (value) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(value));

const formatTime = (value) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

function MediaVideoPlayer({ url, title }) {
  if (!url) return null;
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/,
  );
  if (ytMatch) {
    return (
      <div className="media-video-wrap">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${ytMatch[1]}`}
          title={title || "Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="media-video-frame"
        />
      </div>
    );
  }
  return (
    <div className="media-video-wrap">
      <video src={url} controls className="media-video-player" preload="metadata" />
    </div>
  );
}

function getGoogleCalendarUrl(event) {
  const title = encodeURIComponent(event.title);
  const details = encodeURIComponent(event.description || "AIC Hola Gathering");
  const location = encodeURIComponent(`${event.location || "Main Sanctuary"}, AIC Hola Church, Tana River County`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
}

export default function Calendar() {
  const [dynamicEvents, setDynamicEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const loadEvents = () =>
      supabase
        .from("events")
        .select(
          "id,title,description,department,starts_at,ends_at,location,image_url,video_url",
        )
        .gte("ends_at", new Date().toISOString())
        .order("starts_at")
        .then(({ data }) => {
          if (data && data.length > 0) {
            setDynamicEvents(
              data.map((item) => ({
                ...item,
                category: item.department.replaceAll("_", " "),
                badge: "Special Event",
                time_display: `${formatDate(item.starts_at)} · ${formatTime(item.starts_at)} – ${formatTime(item.ends_at)}`,
                icon: "fa-calendar-star",
                accent: "#dfb86a",
              })),
            );
          }
        })
        .catch(() => {});

    void loadEvents();
    const channel = supabase
      .channel("public-events-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => void loadEvents(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const allEvents = useMemo(() => {
    return [...dynamicEvents, ...baselineEvents];
  }, [dynamicEvents]);

  const filteredEvents = useMemo(() => {
    if (selectedCategory === "All") return allEvents;
    return allEvents.filter(
      (ev) =>
        ev.category?.toLowerCase() === selectedCategory.toLowerCase() ||
        ev.department?.toLowerCase() === selectedCategory.toLowerCase(),
    );
  }, [allEvents, selectedCategory]);

  return (
    <div className="page-shell calendar-page">
      <Link className="back-link" to="/">
        <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back to Home
      </Link>

      <PageIntro
        eyebrow="Weekly Rhythms &amp; Special Events"
        title="Church Calendar &amp; Gatherings"
        description="Join us for Sunday worship, midweek prayer, choir rehearsals, and special ministry fellowships in Hola."
      />

      {/* Category Filter Pills */}
      <div className="calendar-filter-bar" role="group" aria-label="Filter events by category">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`calendar-filter-btn ${selectedCategory === cat ? "active" : ""}`}
            onClick={() => setSelectedCategory(cat)}
            aria-pressed={selectedCategory === cat}
          >
            {cat}
          </button>
        ))}
      </div>

      <section className="calendar-events-grid" aria-label="Upcoming church events">
        {filteredEvents.map((event) => (
          <article className="calendar-card" key={event.id}>
            <div className="calendar-card-header">
              <span className="calendar-badge" style={{ borderColor: event.accent, color: event.accent }}>
                <i className={`fa-solid ${event.icon || "fa-calendar-days"}`} aria-hidden="true" />
                <span>{event.badge}</span>
              </span>
              <span className="calendar-location-tag">
                <i className="fa-solid fa-location-dot" aria-hidden="true" /> {event.location}
              </span>
            </div>

            {event.image_url ? (
              <div className="event-image-wrap">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="event-image"
                  loading="lazy"
                />
              </div>
            ) : null}

            <h3 className="calendar-card-title">{event.title}</h3>
            <div className="calendar-time-row">
              <i className="fa-regular fa-clock" aria-hidden="true" />
              <span>{event.time_display}</span>
            </div>

            {event.description ? <p className="calendar-card-desc">{event.description}</p> : null}

            {event.video_url ? <MediaVideoPlayer url={event.video_url} title={event.title} /> : null}

            <div className="calendar-card-footer">
              <span className="calendar-dept">
                <i className="fa-solid fa-tag" aria-hidden="true" /> {event.department}
              </span>
              <a
                href={getGoogleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="calendar-add-btn"
                title="Add to Google Calendar"
              >
                <i className="fa-regular fa-calendar-plus" aria-hidden="true" /> Add to Calendar
              </a>
            </div>
          </article>
        ))}
      </section>

      {/* Facility Inquiries / Office Notice */}
      <section className="calendar-inquiry-box">
        <div className="inquiry-box-content">
          <i className="fa-solid fa-church inquiry-icon" aria-hidden="true" />
          <div>
            <h3>Planning a Dedication, Wedding, or Ministry Fellowship?</h3>
            <p>
              AIC Hola church sanctuary and fellowship halls are available for sacred church rites and member gatherings. Contact the church office for scheduling and pastoral arrangements.
            </p>
          </div>
        </div>
        <Link to="/contacts" className="button gold inquiry-btn">
          Inquire at Church Office <i className="fa-solid fa-arrow-right" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
