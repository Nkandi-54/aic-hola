import React from "react";
import { Link } from "react-router-dom";
import FlashyCard from "../components/FlashyCard";
import { updates } from "../data/updates";
import "./Home.css";

const featuredSections = [
  {
    title: "Our History",
    description: "Discover the 50-year journey that has shaped our church family in Hola.",
    to: "/history",
    icon: "fa-landmark",
    kind: "history",
    meta: "Since 1975",
    accent: "#e8bd79",
  },
  {
    title: "Worship Teams",
    description: "Meet the voices that lead us in praise and devotion.",
    to: "/choirs",
    icon: "fa-people-group",
    kind: "choir",
    meta: "Choirs",
    accent: "#a9c8af",
  },
  {
    title: "Live & Recent",
    description: "Stay connected to services and recent worship moments.",
    to: "/live",
    icon: "fa-circle-play",
    kind: "live",
    meta: "YouTube",
    accent: "#eeb0a0",
  },
  {
    title: "Sermons",
    description: "Messages of faith, hope, and encouragement for every season.",
    to: "/sermons",
    icon: "fa-book-bible",
    kind: "sermon",
    meta: "Messages",
    accent: "#b9c8e8",
  },
];

export default function Home() {
  return (
    <div className="page-shell home-page">
      {/* Live Broadcast Header Strip */}
      <aside className="home-live-strip" aria-label="Live broadcast announcement">
        <div className="live-strip-inner">
          <span className="live-strip-badge">
            <span className="live-pulse" aria-hidden="true" />
            <span>LIVE BROADCAST</span>
          </span>
          <p className="live-strip-text">
            Sundays from Hola Sanctuary • Join our morning worship services &amp; listen to messages of hope.
          </p>
          <Link to="/live" className="live-strip-link">
            Watch online <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </aside>

      {/* Editorial Magazine Hero */}
      <section className="home-hero-editorial" aria-label="Hero">
        <div className="hero-backdrop-glow" aria-hidden="true" />
        <div className="hero-columns">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-rule" aria-hidden="true" />
              <span>AIC HOLA CHURCH • EST. 1975</span>
            </div>

            <h1 className="hero-title">
              Where the Bible speaks, <br />
              <em className="hero-title-accent">grace abounds.</em>
            </h1>

            <p className="hero-lead">
              Welcome to an enduring sanctuary of faith, vibrant worship, and compassionate service in Tana River County. A 50-year local testimony of God’s steadfast love, rooted in the historic Africa Inland Church heritage.
            </p>

            <div className="hero-actions">
              <Link className="button gold" to="/live">
                <i className="fa-solid fa-circle-play" aria-hidden="true" /> Watch services
              </Link>
              <Link className="button secondary" to="/contacts">
                Plan a visit <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="hero-values-strip" aria-hidden="true">
              <span className="hero-value-item">Faith</span>
              <span className="hero-value-sep">✦</span>
              <span className="hero-value-item">Fellowship</span>
              <span className="hero-value-sep">✦</span>
              <span className="hero-value-item">Service</span>
            </div>
          </div>

          <div className="hero-visual-frame">
            <div className="hero-photo-card">
              <div className="hero-photo-wrap">
                <img
                  src="/gallery/20250817_164248.jpg"
                  alt="AIC Hola sanctuary choir and worship"
                  className="hero-photo-img"
                  loading="eager"
                />
                <div className="hero-photo-gradient" />
                <span className="hero-photo-tag">
                  <i className="fa-solid fa-church" aria-hidden="true" />
                  Sanctuary Praise
                </span>
                <div className="hero-photo-caption">
                  <strong>Joyful Sanctuary Worship &amp; Praise</strong>
                  <span>AIC Hola Sanctuary Choir • Sunday Service</span>
                </div>
              </div>
            </div>

            <div className="hero-stat-pill">
              <div className="stat-number">50+</div>
              <div className="stat-desc">Years proclaiming Scripture in Hola</div>
            </div>

            <div className="hero-stat-pill secondary-pill">
              <div className="stat-number">4</div>
              <div className="stat-desc">Worship choirs &amp; ministries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Exploration Grid */}
      <section className="home-section" aria-labelledby="explore-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Explore</span>
            <h2 id="explore-heading">Find your way in</h2>
          </div>
          <p>Discover sacred music, biblical teaching, church heritage, and real-time broadcasts.</p>
        </div>
        <div className="content-grid">
          {featuredSections.map((section) => (
            <FlashyCard key={section.title} {...section} />
          ))}
        </div>
      </section>

      {/* Editorial Noticeboard Spotlight */}
      <section className="home-updates" aria-labelledby="updates-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Noticeboard</span>
            <h2 id="updates-heading">Latest church updates</h2>
          </div>
          <Link className="text-link" to="/updates">
            View all updates <span aria-hidden="true">→</span>
          </Link>
        </div>
        <article className="home-update-preview">
          <div className="update-preview-header">
            <span className="update-preview-department">{updates[0].department}</span>
            <span className="update-preview-date">Official Bulletin</span>
          </div>
          <h3>{updates[0].title}</h3>
          <p>{updates[0].description}</p>
          <Link className="text-link" to="/updates">
            Read full announcement <span aria-hidden="true">→</span>
          </Link>
        </article>
      </section>

      {/* Cathedral Sanctuary Invitation & Integrated Priestly Benediction */}
      <section className="home-welcome" aria-labelledby="welcome-heading">
        <div className="welcome-layout">
          <div className="welcome-content">
            <span className="eyebrow">Everyone is welcome</span>
            <h2 id="welcome-heading">Come as you are to the Lord's House.</h2>
            <p>
              Whether you are seeking prayer, spiritual nourishment, a home for your family, or fellowship in Christ, our doors and hearts in Hola are open to receive you.
            </p>
            <div className="welcome-actions">
              <Link className="button gold welcome-cta" to="/contacts">
                Get in touch <span aria-hidden="true">→</span>
              </Link>
              <Link className="button secondary welcome-secondary-cta" to="/live">
                <i className="fa-solid fa-circle-play" aria-hidden="true" /> Live broadcast
              </Link>
            </div>
          </div>

          <div className="welcome-benediction-plaque">
            <div className="benediction-plaque-top">
              <span className="benediction-icon-emblem" aria-hidden="true">
                <i className="fa-solid fa-book-bible" />
              </span>
              <span className="benediction-eyebrow">Priestly Benediction</span>
            </div>
            <blockquote className="benediction-quote">
              &ldquo;The Lord bless you and keep you; the Lord make His face shine upon you and be gracious to you; the Lord turn His face toward you and give you peace.&rdquo;
            </blockquote>
            <cite className="benediction-ref">NUMBERS 6:24&ndash;26</cite>
          </div>
        </div>
      </section>
    </div>
  );
}
