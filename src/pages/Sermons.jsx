import React from "react";
import FlashyCard from "../components/FlashyCard";
import "./Sermons.css";

const channelUrl = "https://www.youtube.com/@nkandi242";
const sermons = [
  { title: "Walking in Faith", description: "A message on trusting God in every situation.", type: "Video sermon", kind: "sermon", accent: "#e8bd79" },
  { title: "The Power of Prayer", description: "Exploring how prayer transforms lives.", type: "Video sermon", kind: "sermon", accent: "#b9c8e8" },
  { title: "Love and Fellowship", description: "A sermon about community and love in Christ.", type: "Message", kind: "community", accent: "#eeb0a0" },
  { title: "Hope in Hard Times", description: "Finding strength and hope through God's word.", type: "Video sermon", kind: "sermon", accent: "#a9c8af" },
];

export default function Sermons() {
  return (
    <div className="page-shell">
      <header className="page-heading">
        <span className="eyebrow">Messages for every season</span>
        <h1>Listen, reflect, and grow.</h1>
        <p>Explore messages that bring Scripture into everyday life, then continue watching on our YouTube channel.</p>
      </header>

      {/* Featured Teaching Scripture Spotlight */}
      <section className="sermon-spotlight-card" aria-label="Featured Scripture">
        <div className="sermon-spotlight-top">
          <span className="sermon-scripture-badge">
            <i className="fa-solid fa-book-bible" aria-hidden="true" /> Featured Teaching
          </span>
          <span className="sermon-spotlight-series">Sermon Series</span>
        </div>
        <blockquote className="sermon-spotlight-scripture">
          &ldquo;Trust in the LORD with all your heart and lean not on your own understanding.&rdquo; &mdash; Proverbs 3:5
        </blockquote>
        <div className="sermon-spotlight-meta">
          <a
            className="button gold"
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fa-solid fa-circle-play" aria-hidden="true" /> Listen to message
          </a>
          <span className="sermon-spotlight-author">AIC Hola Pulpit Ministry</span>
        </div>
      </section>

      <div className="content-grid">
        {sermons.map((sermon) => (
          <FlashyCard
            key={sermon.title}
            title={sermon.title}
            description={sermon.description}
            to={channelUrl}
            icon="fa-book-bible"
            kind={sermon.kind}
            meta={sermon.type}
            actionLabel="Open channel"
            accent={sermon.accent}
          />
        ))}
      </div>

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
    </div>
  );
}
