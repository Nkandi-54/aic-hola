import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MpesaGiving from "../components/MpesaGiving";
import { updates } from "../data/updates";
import "./Home.css";

const serviceSchedules = [
  {
    badge: "1st Service",
    time: "8:30 AM – 10:15 AM",
    title: "Swahili Service",
    desc: "Ibada, neno, sifa za kwaya, na maombi.",
    location: "Main Sanctuary",
    icon: "fa-sun",
    audience: "Entire Congregation",
  },
  {
    badge: "2nd Service",
    time: "10:45 AM – 12:30 PM",
    title: "English Service",
    desc: "Preaching, choral praise, and fellowship.",
    location: "Main Sanctuary",
    icon: "fa-church",
    audience: "Entire Congregation",
  },
  {
    badge: "Watoto Church",
    time: "8:30 AM & 10:45 AM",
    title: "Sunday School",
    desc: "Bible lessons and praise for children.",
    location: "Sunday School Hall",
    icon: "fa-children",
    audience: "Ages 3 – 12",
  },
  {
    badge: "Youth & Teens",
    time: "2:00 PM – 4:00 PM",
    title: "Youth Fellowship",
    desc: "Worship, Bible discussion, and mentorship.",
    location: "Youth Center",
    icon: "fa-users-rays",
    audience: "Youth & Teens",
  },
  {
    badge: "Midweek",
    time: "Wednesdays 5:00 PM – 6:30 PM",
    title: "Prayer Meeting",
    desc: "Congregational prayer and intercession.",
    location: "Sanctuary",
    icon: "fa-hands-praying",
    audience: "All Believers",
  },
  {
    badge: "Rehearsals",
    time: "Fridays & Saturdays 4:30 PM",
    title: "Choir Rehearsals",
    desc: "Praise preparation and music rehearsals.",
    location: "Choir Stall",
    icon: "fa-music",
    audience: "Choirs & Teams",
  },
];

const churchPillars = [
  {
    number: "01",
    title: "Biblical Preaching",
    verse: "2 Timothy 4:2",
    desc: "Committed to sound, verse-by-verse exposition of Scripture.",
    icon: "fa-book-open-reader",
  },
  {
    number: "02",
    title: "Choral Praise",
    verse: "Psalm 95:1",
    desc: "Reverent worship through choral anthems, hymns, and praise.",
    icon: "fa-music",
  },
  {
    number: "03",
    title: "Christian Fellowship",
    verse: "Acts 2:42",
    desc: "Growing together in Christ through mutual love and care.",
    icon: "fa-handshake-angle",
  },
  {
    number: "04",
    title: "Missions & Outreach",
    verse: "Matthew 28:19",
    desc: "Sharing the Gospel across Hola, Tana River, and beyond.",
    icon: "fa-earth-africa",
  },
  {
    number: "05",
    title: "Faithful Stewardship",
    verse: "2 Corinthians 9:7",
    desc: "Serving the Lord and His house with generous, cheerful hearts.",
    icon: "fa-hand-holding-heart",
  },
];

const spotlightSermons = [
  {
    title: "Rooted in Faith, Established in Grace",
    speaker: "AIC Hola Pulpit Ministry",
    scripture: "Colossians 2:6–7",
    desc: "Walking steadfastly in Christ with thanksgiving.",
    type: "Sunday Message",
    accent: "#dfb86a",
  },
  {
    title: "Walking in Faith Through Every Season",
    speaker: "AIC Hola Pulpit Ministry",
    scripture: "Hebrews 11:1–6",
    desc: "Trusting God's promises through life's trials.",
    type: "Expository Sermon",
    accent: "#a9c8af",
  },
  {
    title: "The Power of Intercessory Prayer",
    speaker: "AIC Hola Pastoral Team",
    scripture: "James 5:16–18",
    desc: "United prayer within the body of Christ.",
    type: "Midweek Teaching",
    accent: "#b9c8e8",
  },
];

export default function Home() {
  const [prayerModalOpen, setPrayerModalOpen] = useState(false);
  const [prayerFormData, setPrayerFormData] = useState({
    name: "",
    phone: "",
    category: "Prayer Request",
    message: "",
  });
  const [submittedPrayer, setSubmittedPrayer] = useState(false);

  useEffect(() => {
    if (prayerModalOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [prayerModalOpen]);

  const handlePrayerSubmit = (e) => {
    e.preventDefault();
    if (!prayerFormData.name.trim() || !prayerFormData.message.trim()) return;
    setSubmittedPrayer(true);
    setTimeout(() => {
      setPrayerFormData({ name: "", phone: "", category: "Prayer Request", message: "" });
    }, 3500);
  };

  const closePrayerModal = () => {
    setPrayerModalOpen(false);
    setSubmittedPrayer(false);
  };

  return (
    <div className="page-shell home-page">
      {/* Top Utility Announcement & Schedule Strip */}
      <aside className="home-live-strip" aria-label="Worship times">
        <div className="live-strip-inner">
          <span className="live-strip-badge">
            <span className="live-pulse" aria-hidden="true" />
            <span>WORSHIP GATHERINGS</span>
          </span>
          <p className="live-strip-text">
            <strong>Sundays:</strong> Swahili 8:30 AM &bull; English 10:45 AM &bull; Watoto Church 8:30 &amp; 10:45 AM
          </p>
          <div className="live-strip-actions">
            <Link to="/live" className="live-strip-link">
              <i className="fa-solid fa-circle-play" aria-hidden="true" />
              <span>Watch Live</span>
            </Link>
            <span className="live-strip-divider" aria-hidden="true">|</span>
            <Link to="/contacts" className="live-strip-link secondary">
              <i className="fa-solid fa-location-dot" aria-hidden="true" />
              <span>Directions</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Hero */}
      <section className="home-hero-editorial" aria-label="Hero">
        <div className="hero-backdrop-glow" aria-hidden="true" />
        <div className="hero-columns">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-rule" aria-hidden="true" />
              <span>AIC HOLA &bull; EST. 1975 &bull; 50 YEARS OF FAITH</span>
            </div>

            <h1 className="hero-title">
              Where the Bible speaks, <br />
              <em className="hero-title-accent">grace abounds.</em>
            </h1>

            <p className="hero-lead">
              A sanctuary of biblical preaching, choral praise, and Christian fellowship in Tana River County. Celebrating 50 years of God’s grace in Hola.
            </p>

            <div className="hero-actions">
              <Link className="button gold" to="/live">
                <i className="fa-solid fa-circle-play" aria-hidden="true" /> Watch services
              </Link>
              <a className="button secondary hero-scroll-btn" href="#services-schedule">
                <i className="fa-solid fa-calendar-check" aria-hidden="true" /> Service times
              </a>
              <button
                type="button"
                className="button outline-gold hero-prayer-btn"
                onClick={() => setPrayerModalOpen(true)}
              >
                <i className="fa-solid fa-hands-praying" aria-hidden="true" /> Request prayer
              </button>
            </div>

            <div className="hero-values-strip" aria-hidden="true">
              <span className="hero-value-item">Scripture</span>
              <span className="hero-value-sep">✦</span>
              <span className="hero-value-item">Choral Praise</span>
              <span className="hero-value-sep">✦</span>
              <span className="hero-value-item">Fellowship</span>
              <span className="hero-value-sep">✦</span>
              <span className="hero-value-item">Missions</span>
            </div>
          </div>

          <div className="hero-visual-frame">
            <div className="hero-photo-card">
              <div className="hero-photo-wrap">
                <img
                  src="/gallery/20250817_164248.jpg"
                  alt="AIC Hola sanctuary choir"
                  className="hero-photo-img"
                  loading="eager"
                />
                <div className="hero-photo-gradient" />
                <span className="hero-photo-tag">
                  <i className="fa-solid fa-church" aria-hidden="true" />
                  Sanctuary Praise
                </span>
                <div className="hero-photo-caption">
                  <strong>AIC Hola Sanctuary Choir</strong>
                  <span>Sunday Worship &bull; Hola Sanctuary</span>
                </div>
              </div>
            </div>

            <div className="hero-stat-pill">
              <div className="stat-number">50+</div>
              <div className="stat-desc">Years in Hola (Est. 1975)</div>
            </div>

            <div className="hero-stat-pill secondary-pill">
              <div className="stat-number">4</div>
              <div className="stat-desc">Worship Choirs</div>
            </div>

            <div className="hero-stat-pill bottom-pill">
              <div className="stat-number">2</div>
              <div className="stat-desc">Sunday Services</div>
            </div>
          </div>
        </div>
      </section>

      {/* Visitor Welcome */}
      <section className="home-visitor-welcome" aria-labelledby="welcome-visitor-heading">
        <div className="visitor-welcome-card">
          <div className="visitor-welcome-intro">
            <span className="eyebrow">Karibu &bull; New Here?</span>
            <h2 id="welcome-visitor-heading">What to Expect on Sunday</h2>
            <p>Whether visiting Hola or looking for a spiritual home, you are welcome here.</p>
          </div>

          <div className="visitor-features-grid">
            <div className="visitor-feature-box">
              <div className="visitor-feature-icon" aria-hidden="true">
                <i className="fa-solid fa-handshake" />
              </div>
              <h3>Warm Ushers</h3>
              <p>Friendly greeters ready to assist and welcome you.</p>
            </div>

            <div className="visitor-feature-box">
              <div className="visitor-feature-icon" aria-hidden="true">
                <i className="fa-solid fa-music" />
              </div>
              <h3>Choral Worship</h3>
              <p>Sacred anthems, traditional hymns, and spirited praise.</p>
            </div>

            <div className="visitor-feature-box">
              <div className="visitor-feature-icon" aria-hidden="true">
                <i className="fa-solid fa-book-bible" />
              </div>
              <h3>Biblical Teaching</h3>
              <p>Expository preaching rooted firmly in Scripture.</p>
            </div>

            <div className="visitor-feature-box">
              <div className="visitor-feature-icon" aria-hidden="true">
                <i className="fa-solid fa-children" />
              </div>
              <h3>Children's Church</h3>
              <p>Safe, joyful Bible classes for children during service.</p>
            </div>
          </div>

          <div className="visitor-welcome-footer">
            <div className="visitor-welcome-quote">
              <i className="fa-solid fa-quote-left" aria-hidden="true" />
              <span>&ldquo;I was glad when they said unto me, Let us go into the house of the LORD.&rdquo; &mdash; Psalm 122:1</span>
            </div>
            <div className="visitor-welcome-actions">
              <Link to="/contacts" className="button gold">
                <i className="fa-solid fa-compass" aria-hidden="true" /> Plan Your Visit
              </Link>
              <button
                type="button"
                className="button secondary"
                onClick={() => setPrayerModalOpen(true)}
              >
                <i className="fa-solid fa-envelope" aria-hidden="true" /> Connect With Pastors
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Schedule */}
      <section id="services-schedule" className="home-schedule-section" aria-labelledby="schedule-heading">
        <div className="section-heading text-center">
          <span className="eyebrow">Weekly Schedule</span>
          <h2 id="schedule-heading">Our Worship Gatherings</h2>
          <p>Join us throughout the week for worship, teaching, and prayer.</p>
        </div>

        <div className="schedule-cards-grid">
          {serviceSchedules.map((svc) => (
            <article key={svc.title} className="schedule-card">
              <div className="schedule-card-top">
                <span className="schedule-badge">{svc.badge}</span>
                <span className="schedule-audience">
                  <i className="fa-solid fa-users" aria-hidden="true" /> {svc.audience}
                </span>
              </div>
              <div className="schedule-time-row">
                <i className={`fa-solid ${svc.icon} schedule-icon`} aria-hidden="true" />
                <span className="schedule-time">{svc.time}</span>
              </div>
              <h3 className="schedule-title">{svc.title}</h3>
              <p className="schedule-desc">{svc.desc}</p>
              <div className="schedule-card-footer">
                <span className="schedule-location">
                  <i className="fa-solid fa-location-dot" aria-hidden="true" /> {svc.location}
                </span>
                <Link to="/contacts" className="schedule-card-link" title="Directions">
                  Directions <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="schedule-bottom-strip">
          <div className="schedule-bottom-note">
            <i className="fa-solid fa-circle-info" aria-hidden="true" />
            <span>Need pastoral inquiries for baby dedication, weddings, or baptism?</span>
          </div>
          <Link to="/contacts" className="button gold schedule-bottom-btn">
            Contact Church Office <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Our 5 Pillars */}
      <section className="home-pillars-section" aria-labelledby="pillars-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Foundations</span>
            <h2 id="pillars-heading">Our 5 Pillars</h2>
          </div>
          <p>Core convictions guiding our worship, discipleship, and ministry.</p>
        </div>

        <div className="pillars-grid">
          {churchPillars.map((pillar) => (
            <div key={pillar.number} className="pillar-card">
              <div className="pillar-header">
                <span className="pillar-number">{pillar.number}</span>
                <div className="pillar-icon-box" aria-hidden="true">
                  <i className={`fa-solid ${pillar.icon}`} />
                </div>
              </div>
              <h3 className="pillar-title">{pillar.title}</h3>
              <p className="pillar-desc">{pillar.desc}</p>
              <div className="pillar-verse-plaque">
                <span className="pillar-verse-ref">
                  <i className="fa-solid fa-book-bible" aria-hidden="true" /> {pillar.verse}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 50-Year Jubilee Plaque */}
      <section className="home-jubilee-section" aria-label="50-Year Jubilee">
        <div className="jubilee-plaque-container">
          <div className="jubilee-plaque-inner">
            <div className="jubilee-ornament-top" aria-hidden="true">
              <span className="ornament-line" />
              <i className="fa-solid fa-cross" />
              <span className="ornament-line" />
            </div>

            <span className="jubilee-badge">GOLDEN JUBILEE &bull; 1975 &ndash; 2025/2026</span>
            <h2 className="jubilee-title">50 Years of God’s Faithfulness</h2>
            <div className="jubilee-scripture-box">
              <span className="jubilee-scripture-ref">COLOSSIANS 2:6&ndash;7</span>
              <blockquote className="jubilee-scripture-text">
                &ldquo;Just as you received Christ Jesus as Lord, continue to live in Him, rooted and built up in Him, strengthened in the faith.&rdquo;
              </blockquote>
            </div>

            <p className="jubilee-summary">
              Celebrating 50 years of faithful Bible proclamation, sacred song, and transformed lives in Hola, Tana River County.
            </p>

            <div className="jubilee-actions">
              <Link to="/history" className="button gold jubilee-btn">
                <i className="fa-solid fa-landmark" aria-hidden="true" /> Explore Our History
              </Link>
              <Link to="/gallery" className="button secondary jubilee-secondary-btn">
                <i className="fa-solid fa-images" aria-hidden="true" /> Photo Archive
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Choirs Showcase */}
      <section className="home-choirs-spotlight" aria-labelledby="choirs-spotlight-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Music Ministry</span>
            <h2 id="choirs-spotlight-heading">Voices of Praise</h2>
          </div>
          <Link className="text-link" to="/choirs">
            View all 4 choirs <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div className="choir-spotlight-grid">
          <article className="choir-preview-card sanctuary-choir-card">
            <div className="choir-preview-media">
              <img
                src="/gallery/20250817_165759.jpg"
                alt="Sanctuary Choir"
                loading="lazy"
              />
              <span className="choir-media-tag">Sanctuary Choir</span>
            </div>
            <div className="choir-preview-body">
              <span className="choir-subhead">Hymns &amp; Anthems</span>
              <h3>Sanctuary Choir</h3>
              <p>Leading the congregation with classic choral hymns and sacred multi-part harmonies.</p>
              <div className="choir-preview-actions">
                <Link to="/choirs" className="button secondary sm">
                  Explore Ministry <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </Link>
                <a
                  href="https://www.youtube.com/@nkandi242"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="choir-watch-link"
                >
                  <i className="fa-brands fa-youtube" aria-hidden="true" /> Watch Anthems
                </a>
              </div>
            </div>
          </article>

          <article className="choir-preview-card youth-choir-card">
            <div className="choir-preview-media">
              <img
                src="/gallery/20251229_110819.jpg"
                alt="Youth Choir"
                loading="lazy"
              />
              <span className="choir-media-tag">Youth Ministry</span>
            </div>
            <div className="choir-preview-body">
              <span className="choir-subhead">Dynamic Praise</span>
              <h3>Youth &amp; Essence Choirs</h3>
              <p>Passionate praise and African gospel rhythms honoring the Lord.</p>
              <div className="choir-preview-actions">
                <Link to="/choirs" className="button secondary sm">
                  Explore Ministry <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </Link>
                <a
                  href="https://www.youtube.com/@nkandi242"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="choir-watch-link"
                >
                  <i className="fa-brands fa-youtube" aria-hidden="true" /> Watch Sessions
                </a>
              </div>
            </div>
          </article>
        </div>
      </section>


      {/* Recent Sermons */}
      <section className="home-sermons-spotlight" aria-labelledby="sermons-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Pulpit</span>
            <h2 id="sermons-heading">Recent Sermons</h2>
          </div>
          <Link className="text-link" to="/sermons">
            View All Sermons <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div className="sermons-spotlight-grid">
          {spotlightSermons.map((sermon) => (
            <article key={sermon.title} className="sermon-card-flagship">
              <div className="sermon-card-header">
                <span className="sermon-type-tag" style={{ color: sermon.accent }}>
                  <i className="fa-solid fa-book-bible" aria-hidden="true" /> {sermon.type}
                </span>
                <span className="sermon-scripture-ref">{sermon.scripture}</span>
              </div>
              <h3 className="sermon-card-title">{sermon.title}</h3>
              <p className="sermon-card-desc">{sermon.desc}</p>
              <div className="sermon-card-footer">
                <span className="sermon-speaker">
                  <i className="fa-solid fa-user-tie" aria-hidden="true" /> {sermon.speaker}
                </span>
                <Link to="/sermons" className="sermon-card-action">
                  Listen / Watch <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Stewardship & Lipa na M-PESA Hub */}
      <section className="home-giving-section" aria-labelledby="giving-heading">
        <div className="giving-container-layout">
          <div className="giving-editorial-copy">
            <span className="eyebrow">Giving</span>
            <h2 id="giving-heading">Lipa na M-PESA Stewardship</h2>
            <p>
              Support gospel ministry, community outreach, and church development in Hola.
            </p>
            <div className="giving-scripture-plaque">
              <blockquote>
                &ldquo;Each of you should give what you have decided in your heart to give... for God loves a cheerful giver.&rdquo;
              </blockquote>
              <cite>&mdash; 2 CORINTHIANS 9:7</cite>
            </div>
            <div className="giving-copy-features">
              <div className="giving-feature-item">
                <i className="fa-solid fa-circle-check" aria-hidden="true" />
                <span>Tithes, offerings, building, and benevolence</span>
              </div>
              <div className="giving-feature-item">
                <i className="fa-solid fa-circle-check" aria-hidden="true" />
                <span>Official Paybill with direct receipting</span>
              </div>
            </div>
          </div>

          <div className="giving-hub-wrapper">
            <MpesaGiving variant="hub" />
          </div>
        </div>
      </section>

      {/* Noticeboard */}
      <section className="home-updates" aria-labelledby="updates-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Noticeboard</span>
            <h2 id="updates-heading">Latest Bulletins</h2>
          </div>
          <Link className="text-link" to="/updates">
            View all updates <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
        <div className="updates-grid-preview">
          {updates.slice(0, 2).map((item) => (
            <article key={item.id} className="home-update-preview">
              <div className="update-preview-header">
                <span className="update-preview-department">{item.department}</span>
                <span className="update-preview-date">{item.date}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <Link className="text-link" to="/updates">
                Read full announcement <span aria-hidden="true">&rarr;</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Welcome & Benediction */}
      <section className="home-welcome" aria-labelledby="welcome-heading">
        <div className="welcome-layout">
          <div className="welcome-content">
            <span className="eyebrow">Karibu</span>
            <h2 id="welcome-heading">Come as you are to the Lord's House.</h2>
            <p>
              Whether seeking prayer, spiritual nourishment, or fellowship, our doors are open to receive you.
            </p>
            <div className="welcome-actions">
              <button
                type="button"
                className="button gold welcome-cta"
                onClick={() => setPrayerModalOpen(true)}
              >
                <i className="fa-solid fa-hands-praying" aria-hidden="true" /> Request Prayer
              </button>
              <Link className="button secondary welcome-secondary-cta" to="/contacts">
                <i className="fa-solid fa-location-dot" aria-hidden="true" /> Find the Sanctuary
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

      {/* Interactive Prayer Request Modal */}
      {prayerModalOpen && (
        <div
          className="prayer-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="prayer-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closePrayerModal();
          }}
        >
          <div className="prayer-modal-dialog">
            <button
              type="button"
              className="prayer-modal-close"
              aria-label="Close modal"
              onClick={closePrayerModal}
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>

            {submittedPrayer ? (
              <div className="prayer-modal-success">
                <div className="prayer-success-icon" aria-hidden="true">
                  <i className="fa-solid fa-circle-check" />
                </div>
                <h3>Prayer Request Received</h3>
                <p>
                  Thank you, <strong>{prayerFormData.name || "Friend"}</strong>. Your request has been shared with our pastoral team.
                </p>
                <button type="button" className="button gold" onClick={closePrayerModal}>
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handlePrayerSubmit} className="prayer-modal-form">
                <div className="prayer-modal-header">
                  <span className="eyebrow">Pastoral Prayer</span>
                  <h3 id="prayer-modal-title">Share Your Prayer Request</h3>
                  <p>Our pastors pray over every request submitted by our church family and guests.</p>
                </div>

                <div className="prayer-form-field">
                  <label htmlFor="prayer-name">Your Full Name *</label>
                  <input
                    id="prayer-name"
                    type="text"
                    required
                    placeholder="e.g. Grace Mwende"
                    value={prayerFormData.name}
                    onChange={(e) => setPrayerFormData({ ...prayerFormData, name: e.target.value })}
                  />
                </div>

                <div className="prayer-form-field">
                  <label htmlFor="prayer-phone">Phone or Email (Optional)</label>
                  <input
                    id="prayer-phone"
                    type="text"
                    placeholder="e.g. 0712 345 678"
                    value={prayerFormData.phone}
                    onChange={(e) => setPrayerFormData({ ...prayerFormData, phone: e.target.value })}
                  />
                </div>

                <div className="prayer-form-field">
                  <label htmlFor="prayer-category">Category</label>
                  <select
                    id="prayer-category"
                    value={prayerFormData.category}
                    onChange={(e) => setPrayerFormData({ ...prayerFormData, category: e.target.value })}
                  >
                    <option value="Prayer Request">Prayer Request</option>
                    <option value="Healing & Health">Healing &amp; Health</option>
                    <option value="Family & Marriage">Family &amp; Marriage</option>
                    <option value="Thanksgiving">Thanksgiving</option>
                    <option value="Spiritual Growth">Spiritual Guidance</option>
                    <option value="Planning a Visit">Planning a Visit</option>
                  </select>
                </div>

                <div className="prayer-form-field">
                  <label htmlFor="prayer-message">Prayer Request *</label>
                  <textarea
                    id="prayer-message"
                    required
                    rows={3}
                    placeholder="Write your request here..."
                    value={prayerFormData.message}
                    onChange={(e) => setPrayerFormData({ ...prayerFormData, message: e.target.value })}
                  />
                </div>

                <div className="prayer-modal-actions">
                  <button type="submit" className="button gold">
                    <i className="fa-solid fa-paper-plane" aria-hidden="true" /> Submit
                  </button>
                  <button type="button" className="button secondary" onClick={closePrayerModal}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
