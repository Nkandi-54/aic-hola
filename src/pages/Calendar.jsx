import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageIntro from "../components/PageIntro";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import "./Calendar.css";

const formatDate = (value) => new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date(value));
const formatTime = (value) => new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!isSupabaseConfigured) { setError(true); return; }
    const loadEvents = () => supabase.from("events").select("id,title,description,department,starts_at,ends_at,location").gte("ends_at", new Date().toISOString()).order("starts_at").then(({ data, error: requestError }) => { setEvents(data || []); setError(Boolean(requestError)); }).catch(() => setError(true));
    void loadEvents();
    const channel = supabase.channel("public-events-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => void loadEvents())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);
  return <div className="page-shell calendar-page"><Link className="back-link" to="/">← Back to home</Link><PageIntro eyebrow="Church calendar" title="Make room for what matters." description="Upcoming events and plans shared by every department." /><section className="calendar-list"><div className="section-heading"><div><span className="eyebrow">Upcoming</span><h2>Church events</h2></div><p>Updated as departments add plans.</p></div>{error ? <p className="calendar-empty">The calendar is temporarily unavailable. Please try again later.</p> : events.length === 0 ? <p className="calendar-empty">No upcoming events have been added yet.</p> : events.map((event) => <article className="event-card" key={event.id}><small>{formatDate(event.starts_at)} · {formatTime(event.starts_at)}–{formatTime(event.ends_at)}</small><h3>{event.title}</h3><p>{event.description}</p><span>{event.department.replaceAll("_", " ")}{event.location ? ` · ${event.location}` : ""}</span></article>)}</section></div>;
}
