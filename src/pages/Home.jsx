import React, { useState } from "react";
import { Link } from "react-router-dom";
import FlashyCard from "../components/FlashyCard";
import MpesaGiving from "../components/MpesaGiving";
import { updates } from "../data/updates";
import "./Home.css";

const featuredSections = [
  {
    title: "Our 50-Year History",
    description: "Discover the 50-year journey of grace that has shaped our church family in Hola since 1975.",
    to: "/history",
    icon: "fa-landmark",
    kind: "history",
    meta: "Est. 1975",
    accent: "#e8bd79",
  },
  {
    title: "Worship & Choirs",
    description: "Meet the voices that lead us in sacred choral praise, traditional hymns, and heartfelt worship.",
    to: "/choirs",
    icon: "fa-people-group",
    kind: "choir",
    meta: "Choir Ministry",
    accent: "#a9c8af",
  },
  {
    title: "Live Broadcasts",
    description: "Join our Sunday worship services in real-time or catch up on recent sacred moments.",
    to: "/live",
    icon: "fa-circle-play",
    kind: "live",
    meta: "Live Sanctuary",
    accent: "#eeb0a0",
  },
  {
    title: "Pulpit Sermons",
    description: "Expository messages of faith, sound doctrine, and practical encouragement for every season.",
    to: "/sermons",
    icon: "fa-book-bible",
    kind: "sermon",
    meta: "Scripture & Truth",
    accent: "#b9c8e8",
  },
];

const serviceSchedules = [
  {
    badge: "1st Service",
    time: "8:30 AM – 10:15 AM",
    title: "Swahili Worship Service",
    desc: "Ibada ya asubuhi, neno la Mungu kwa lugha ya Kiswahili, sifa za kwaya, na maombi ya pamoja.",
    location: "Main Sanctuary",
    icon: "fa-sun",
    audience: "Entire Congregation",
  },
  {
    badge: "2nd Service",
    time: "10:45 AM – 12:30 PM",
    title: "English Worship Service",
    desc: "Expository preaching, contemporary and choral praise, scripture reflections, and fellowship.",
    location: "Main Sanctuary",
    icon: "fa-church",
    audience: "Entire Congregation",
  },
  {
    badge: "Watoto Church",
    time: "8:30 AM & 10:45 AM",
    title: "Sunday School Ministry",
    desc: "Dedicated Bible lessons, memory verses, songs of praise, and joyful activities tailored for children.",
    location: "Sunday School Hall",
    icon: "fa-children",
    audience: "Ages 3 – 12 Years",
  },
  {
    badge: "Teens & Youth",
    time: "2:00 PM – 4:00 PM",
    title: "Youth Fellowship",
    desc: "Dynamic worship, open Bible discussion, peer encouragement, and mentorship for youth and young adults.",
    location: "Youth Center",
    icon: "fa-users-rays",
    audience: "Teens & Young Adults",
  },
  {
    badge: "Midweek Gathering",
    time: "Wednesdays 5:00 PM – 6:30 PM",
    title: "Prayer & Intercession",
    desc: "Standing in the gap for our families, the town of Hola, Tana River County, the nation, and the global church.",
    location: "Sanctuary Prayer Room",
    icon: "fa-hands-praying",
    audience: "All Believers",
  },
  {
    badge: "Choir Rehearsals",
    time: "Fridays & Saturdays 4:30 PM",
    title: "Praise & Music Ministry",
    desc: "Spiritual devotion, musical preparation, and voice rehearsals for upcoming Sunday sanctuary worship.",
    location: "Sanctuary Choir Stall",
    icon: "fa-music",
    audience: "Worship Teams & Choirs",
  },
];

const churchPillars = [
  {
    number: "01",
    title: "Expository Preaching",
    verse: "2 Timothy 4:2",
    verseText: "Preach the word; be prepared in season and out of season; correct, rebuke and encourage with great patience.",
    desc: "We stand unreservedly on the inspired, inerrant Word of God, teaching verse-by-verse to nourish faith and establish believers in truth.",
    icon: "fa-book-open-reader",
  },
  {
    number: "02",
    title: "Sacred Choral Praise",
    verse: "Psalm 95:1–2",
    verseText: "Come, let us sing for joy to the Lord; let us shout aloud to the Rock of our salvation.",
    desc: "Cultivating reverent, heartfelt worship through sacred choral anthems, time-tested hymns, and vibrant contemporary African praises.",
    icon: "fa-music",
  },
  {
    number: "03",
    title: "Christ-Centered Fellowship",
    verse: "Acts 2:42",
    verseText: "They devoted themselves to the apostles' teaching and to fellowship, to the breaking of bread and to prayer.",
    desc: "Nurturing genuine Christian love, mutual care, family support, and multi-generational community rooted in Jesus Christ.",
    icon: "fa-handshake-angle",
  },
  {
    number: "04",
    title: "Missions & Evangelism",
    verse: "Matthew 28:19",
    verseText: "Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit.",
    desc: "Active outreach across Hola, Tana River communities, and unreached regions, sharing the transforming message of redemption.",
    icon: "fa-earth-africa",
  },
  {
    number: "05",
    title: "Faithful Stewardship",
    verse: "2 Corinthians 9:7",
    verseText: "Each of you should give what you have decided in your heart to give... for God loves a cheerful giver.",
    desc: "Honoring God with our resources, supporting benevolent needs, developing our church home, and building the Kingdom with integrity.",
    icon: "fa-hand-holding-heart",
  },
];

const spotlightSermons = [
  {
    title: "Rooted in Faith, Established in Grace",
    speaker: "AIC Hola Pulpit Ministry",
    scripture: "Colossians 2:6–7",
    desc: "Understanding the firm anchor of our faith as we walk in Christ Jesus with hearts overflowing with thanksgiving.",
    type: "Featured Sunday Message",
    accent: "#dfb86a",
  },
  {
    title: "Walking in Faith Through Every Season",
    speaker: "AIC Hola Pulpit Ministry",
    scripture: "Hebrews 11:1–6",
    desc: "Trusting in God's steadfast promises when navigating life's challenges in the heat and trials of our days.",
    type: "Expository Sermon",
    accent: "#a9c8af",
  },
  {
    title: "The Transforming Power of Intercessory Prayer",
    speaker: "AIC Hola Pastoral Team",
    scripture: "James 5:16–18",
    desc: "How united prayer within the body of Christ brings spiritual renewal, healing, and divine breakthrough.",
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

  const handlePrayerSubmit = (e) => {
    e.preventDefault();
    if (!prayerFormData.name.trim() || !prayerFormData.message.trim()) return;
    setSubmittedPrayer(true);
    setTimeout(() => {
      // Clear after submission confirmation
      setPrayerFormData({ name: "", phone: "", category: "Prayer Request", message: "" });
    }, 4000);
  };

  const closePrayerModal = () => {
    setPrayerModalOpen(false);
    setSubmittedPrayer(false);
  };

  return (
    <div className="page-shell home-page">
      {/* Top Utility Announcement & Gathering Strip */}
      <aside className="home-live-strip" aria-label="Church gathering announcement">
        <div className="live-strip-inner">
          <span className="live-strip-badge">
            <span className="live-pulse" aria-hidden="true" />
            <span>WORSHIP GATHERINGS</span>
          </span>
          <p className="live-strip-text">
            <strong>Sundays in Hola Sanctuary:</strong> 1st Service (Swahili) 8:30 AM &bull; 2nd Service (English) 10:45 AM &bull; Watoto Church 8:30 &amp; 10:45 AM
          </p>
          <div className="live-strip-actions">
            <Link to="/live" className="live-strip-link">
              <i className="fa-solid fa-circle-play" aria-hidden="true" />
              <span>Watch Live</span>
            </Link>
            <span className="live-strip-divider" aria-hidden="true">|</span>
            <Link to="/contacts" className="live-strip-link secondary">
              <i className="fa-solid fa-location-dot" aria-hidden="true" />
              <span>Sanctuary Map</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Majestic Editorial Hero */}
      <section className="home-hero-editorial" aria-label="Hero Section">
        <div className="hero-backdrop-glow" aria-hidden="true" />
        <div className="hero-columns">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-rule" aria-hidden="true" />
              <span>AFRICA INLAND CHURCH HOLA &bull; EST. 1975 &bull; 50 YEARS OF FAITH</span>
            </div>

            <h1 className="hero-title">
              Where the Bible speaks, <br />
              <em className="hero-title-accent">grace abounds.</em>
            </h1>

            <p className="hero-lead">
              Welcome to an enduring sanctuary of faith, vibrant choral worship, and compassionate fellowship in Tana River County. Celebrating 50 years of God’s steadfast grace, firmly rooted in Scripture and the historic heritage of the Africa Inland Church.
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
              <span className="hero-value-item">Sound Doctrine</span>
              <span className="hero-value-sep">✦</span>
              <span className="hero-value-item">Choral Praise</span>
              <span className="hero-value-sep">✦</span>
              <span className="hero-value-item">Christ-Centered Fellowship</span>
              <span className="hero-value-sep">✦</span>
              <span className="hero-value-item">Missions</span>
            </div>
          </div>

          <div className="hero-visual-frame">
            <div className="hero-photo-card">
              <div className="hero-photo-wrap">
                <img
                  src="/gallery/20250817_164248.jpg"
                  alt="AIC Hola sanctuary choir and congregation in worship"
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
                  <span>AIC Hola Sanctuary Choir &bull; Sunday Divine Service</span>
                </div>
              </div>
            </div>

            <div className="hero-stat-pill">
              <div className="stat-number">50+</div>
              <div className="stat-desc">Years Proclaiming Scripture in Hola</div>
            </div>

            <div className="hero-stat-pill secondary-pill">
              <div className="stat-number">4</div>
              <div className="stat-desc">Worship Choirs &amp; Praise Teams</div>
            </div>

            <div className="hero-stat-pill bottom-pill">
              <div className="stat-number">2</div>
              <div className="stat-desc">Sunday Morning Gatherings</div>
            </div>
          </div>
        </div>
      </section>

      {/* Visitor Experience & Warm Pastoral Welcome ("Karibu Sana") */}
      <section className="home-visitor-welcome" aria-labelledby="welcome-visitor-heading">
        <div className="visitor-welcome-card">
          <div className="visitor-welcome-intro">
            <span className="eyebrow">Karibu Sana &bull; New to AIC Hola?</span>
            <h2 id="welcome-visitor-heading">A Warm Christian Family Awaiting You</h2>
            <p>
              Whether you are visiting Tana River, moving to Hola, or seeking a vibrant spiritual home for you and your family, our sanctuary doors and hearts are wide open. Here is what you can look forward to every Lord&rsquo;s Day:
            </p>
          </div>

          <div className="visitor-features-grid">
            <div className="visitor-feature-box">
              <div className="visitor-feature-icon" aria-hidden="true">
                <i className="fa-solid fa-handshake" />
              </div>
              <h3>Warm Greeters &amp; Ushers</h3>
              <p>Our hospitality ministry will welcome you at the gates, assist you with seating, and answer any questions.</p>
            </div>

            <div className="visitor-feature-box">
              <div className="visitor-feature-icon" aria-hidden="true">
                <i className="fa-solid fa-music" />
              </div>
              <h3>Reverent Choral Worship</h3>
              <p>Experience uplifting choir anthems, timeless hymns, and spirited African praises that draw our hearts near to God.</p>
            </div>

            <div className="visitor-feature-box">
              <div className="visitor-feature-icon" aria-hidden="true">
                <i className="fa-solid fa-book-bible" />
              </div>
              <h3>Sound Biblical Teaching</h3>
              <p>Hear Christ-centered, expository sermons rooted in Scripture that bring clarity, conviction, and practical hope.</p>
            </div>

            <div className="visitor-feature-box">
              <div className="visitor-feature-icon" aria-hidden="true">
                <i className="fa-solid fa-children" />
              </div>
              <h3>Nurturing Children&rsquo;s Church</h3>
              <p>Safe, joyful Sunday School classrooms where dedicated teachers guide children into the love and knowledge of Jesus.</p>
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
                <i className="fa-solid fa-envelope" aria-hidden="true" /> Connect with Pastors
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services & Gatherings Schedule (Milimani Benchmark Grid) */}
      <section id="services-schedule" className="home-schedule-section" aria-labelledby="schedule-heading">
        <div className="section-heading text-center">
          <span className="eyebrow">Weekly Rhythm of Worship</span>
          <h2 id="schedule-heading">Our Worship Gatherings &amp; Service Times</h2>
          <p>
            Join us throughout the week as we gather in the Lord's presence for worship, biblical nourishment, prayer, and fellowship.
          </p>
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
                <Link to="/contacts" className="schedule-card-link" title="Directions to sanctuary">
                  Directions <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="schedule-bottom-strip">
          <div className="schedule-bottom-note">
            <i className="fa-solid fa-circle-info" aria-hidden="true" />
            <span>Need special pastoral arrangements, infant dedication, holy matrimony, or water baptism?</span>
          </div>
          <Link to="/contacts" className="button gold schedule-bottom-btn">
            Inquire at Church Office <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Our 5 Core Pillars (Anchored on Christ) */}
      <section className="home-pillars-section" aria-labelledby="pillars-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Our Foundational Convictions</span>
            <h2 id="pillars-heading">Our 5 Pillars Anchored on Christ</h2>
          </div>
          <p>
            Just as the early church devoted itself in faith, AIC Hola stands firmly upon five Christ-centered pillars that shape our ministry, mission, and worship.
          </p>
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
                <blockquote className="pillar-verse-quote">&ldquo;{pillar.verseText}&rdquo;</blockquote>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 50-Year Jubilee Milestone Commemoration Plaque */}
      <section className="home-jubilee-section" aria-label="50-Year Jubilee Milestone">
        <div className="jubilee-plaque-container">
          <div className="jubilee-plaque-inner">
            <div className="jubilee-ornament-top" aria-hidden="true">
              <span className="ornament-line" />
              <i className="fa-solid fa-cross" />
              <span className="ornament-line" />
            </div>

            <span className="jubilee-badge">GOLDEN JUBILEE &bull; 1975 &ndash; 2025/2026</span>
            <h2 className="jubilee-title">50 Years of God’s Faithfulness in Hola</h2>
            <div className="jubilee-scripture-box">
              <span className="jubilee-scripture-ref">COLOSSIANS 2:6&ndash;7</span>
              <blockquote className="jubilee-scripture-text">
                &ldquo;So then, just as you received Christ Jesus as Lord, continue to live your lives in him, rooted and built up in him, strengthened in the faith as you were taught, and overflowing with thankfulness.&rdquo;
              </blockquote>
            </div>

            <p className="jubilee-summary">
              From humble beginnings under the acacia trees in 1975 to a thriving sanctuary that touches Tana River County and beyond, God has proven faithful through every generation. We celebrate half a century of sacred songs, transformed lives, and faithful Bible proclamation.
            </p>

            <div className="jubilee-actions">
              <Link to="/history" className="button gold jubilee-btn">
                <i className="fa-solid fa-landmark" aria-hidden="true" /> Explore Our 50-Year Journey
              </Link>
              <Link to="/gallery" className="button secondary jubilee-secondary-btn">
                <i className="fa-solid fa-images" aria-hidden="true" /> View Historical Photo Archive
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Voices of Praise — Choirs Showcase */}
      <section className="home-choirs-spotlight" aria-labelledby="choirs-spotlight-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Ministry in Song</span>
            <h2 id="choirs-spotlight-heading">Voices of Sacred Choral Praise</h2>
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
                alt="Sanctuary Choir leading hymns and sacred music"
                loading="lazy"
              />
              <span className="choir-media-tag">Flagship Sanctuary Choir</span>
            </div>
            <div className="choir-preview-body">
              <span className="choir-subhead">Traditional Hymns &amp; Choral Praise</span>
              <h3>Sanctuary Choir</h3>
              <p>Leading the Hola congregation into holy awe with time-honored Christian choral arrangements, sacred anthems, and multi-part harmonies.</p>
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
                alt="Youth Choir praising the Lord"
                loading="lazy"
              />
              <span className="choir-media-tag">Youth Ministry</span>
            </div>
            <div className="choir-preview-body">
              <span className="choir-subhead">Dynamic &amp; Spirited Praise</span>
              <h3>Youth &amp; Essence Choirs</h3>
              <p>A passionate generation of young vocalists and musicians honoring the Lord through joyful African gospel rhythms and fervent worship.</p>
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

      {/* Bento Exploration Grid */}
      <section className="home-section" aria-labelledby="explore-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Explore AIC Hola</span>
            <h2 id="explore-heading">Discover Our Life &amp; Ministries</h2>
          </div>
          <p>Delve into sacred music, expository teachings, 50 years of heritage, and live broadcasts.</p>
        </div>
        <div className="content-grid">
          {featuredSections.map((section) => (
            <FlashyCard key={section.title} {...section} />
          ))}
        </div>
      </section>

      {/* Pulpit Ministry & Recent Sermons */}
      <section className="home-sermons-spotlight" aria-labelledby="sermons-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">The Pulpit Ministry</span>
            <h2 id="sermons-heading">Recent Expository Messages</h2>
          </div>
          <Link className="text-link" to="/sermons">
            Visit Sermon Library <span aria-hidden="true">&rarr;</span>
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

      {/* Stewardship & Lipa na M-PESA Giving Hub (Milimani Standard) */}
      <section className="home-giving-section" aria-labelledby="giving-heading">
        <div className="giving-container-layout">
          <div className="giving-editorial-copy">
            <span className="eyebrow">Christian Stewardship</span>
            <h2 id="giving-heading">Honoring God Through Cheerful Giving</h2>
            <p>
              Your generous tithes, offerings, and development gifts directly sustain our pastoral ministry, advance community evangelism across Tana River, support the needy, and care for our church home in Hola.
            </p>
            <div className="giving-scripture-plaque">
              <i className="fa-solid fa-quote-left" aria-hidden="true" />
              <blockquote>
                &ldquo;Bring the whole tithe into the storehouse, that there may be food in my house. Test me in this,&rdquo; says the LORD Almighty.
              </blockquote>
              <cite>&mdash; MALACHI 3:10</cite>
            </div>
            <div className="giving-copy-features">
              <div className="giving-feature-item">
                <i className="fa-solid fa-circle-check" aria-hidden="true" />
                <span>Transparent financial accounting overseen by Church Treasurer</span>
              </div>
              <div className="giving-feature-item">
                <i className="fa-solid fa-circle-check" aria-hidden="true" />
                <span>Dedicated support for the needy, widows, and local missions</span>
              </div>
              <div className="giving-feature-item">
                <i className="fa-solid fa-circle-check" aria-hidden="true" />
                <span>Official M-PESA Paybill with direct bank receipting</span>
              </div>
            </div>
          </div>

          <div className="giving-hub-wrapper">
            <MpesaGiving variant="hub" />
          </div>
        </div>
      </section>

      {/* Noticeboard Spotlight */}
      <section className="home-updates" aria-labelledby="updates-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Official Church Noticeboard</span>
            <h2 id="updates-heading">Latest Bulletins &amp; Announcements</h2>
          </div>
          <Link className="text-link" to="/updates">
            View all bulletins <span aria-hidden="true">&rarr;</span>
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

      {/* Cathedral Sanctuary Invitation & Priestly Benediction */}
      <section className="home-welcome" aria-labelledby="welcome-heading">
        <div className="welcome-layout">
          <div className="welcome-content">
            <span className="eyebrow">The Lord Welcomes You</span>
            <h2 id="welcome-heading">Come as you are to the Lord's House.</h2>
            <p>
              Whether you are seeking personal prayer, biblical counsel, a safe haven for spiritual renewal, or a loving church family in Hola, our doors and hearts are open to welcome you in Jesus' name.
            </p>
            <div className="welcome-actions">
              <button
                type="button"
                className="button gold welcome-cta"
                onClick={() => setPrayerModalOpen(true)}
              >
                <i className="fa-solid fa-hands-praying" aria-hidden="true" /> Request Pastoral Prayer
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
              <span className="benediction-eyebrow">The Priestly Benediction</span>
            </div>
            <blockquote className="benediction-quote">
              &ldquo;The Lord bless you and keep you; the Lord make His face shine upon you and be gracious to you; the Lord turn His face toward you and give you peace.&rdquo;
            </blockquote>
            <cite className="benediction-ref">NUMBERS 6:24&ndash;26</cite>
          </div>
        </div>
      </section>

      {/* Interactive Prayer Request & Pastoral Contact Modal */}
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
                  Thank you, <strong>{prayerFormData.name || "Friend"}</strong>. Your request has been shared with the pastoral intercession team at AIC Hola. We stand with you in agreement and faith.
                </p>
                <blockquote className="prayer-success-verse">
                  &ldquo;Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.&rdquo; &mdash; Philippians 4:6
                </blockquote>
                <button type="button" className="button gold" onClick={closePrayerModal}>
                  Amen &bull; Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handlePrayerSubmit} className="prayer-modal-form">
                <div className="prayer-modal-header">
                  <span className="eyebrow">Pastoral Intercession &bull; AIC Hola</span>
                  <h3 id="prayer-modal-title">Share Your Prayer Request</h3>
                  <p>Our pastors and intercessory prayer team meet weekly to pray over every need submitted by our church family and guests.</p>
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
                  <label htmlFor="prayer-phone">Phone Number or Email (Optional)</label>
                  <input
                    id="prayer-phone"
                    type="text"
                    placeholder="e.g. 0712 345 678"
                    value={prayerFormData.phone}
                    onChange={(e) => setPrayerFormData({ ...prayerFormData, phone: e.target.value })}
                  />
                </div>

                <div className="prayer-form-field">
                  <label htmlFor="prayer-category">Request Category</label>
                  <select
                    id="prayer-category"
                    value={prayerFormData.category}
                    onChange={(e) => setPrayerFormData({ ...prayerFormData, category: e.target.value })}
                  >
                    <option value="Prayer Request">General Prayer Request</option>
                    <option value="Healing & Health">Healing &amp; Restoration</option>
                    <option value="Family & Marriage">Family &amp; Children</option>
                    <option value="Thanksgiving">Thanksgiving &amp; Testimony</option>
                    <option value="Spiritual Growth">Spiritual Guidance / Salvation</option>
                    <option value="Planning a Visit">Planning a First-Time Visit</option>
                  </select>
                </div>

                <div className="prayer-form-field">
                  <label htmlFor="prayer-message">How may we pray for you? *</label>
                  <textarea
                    id="prayer-message"
                    required
                    rows={4}
                    placeholder="Write your prayer request or message here..."
                    value={prayerFormData.message}
                    onChange={(e) => setPrayerFormData({ ...prayerFormData, message: e.target.value })}
                  />
                </div>

                <div className="prayer-modal-actions">
                  <button type="submit" className="button gold">
                    <i className="fa-solid fa-paper-plane" aria-hidden="true" /> Send to Pastoral Team
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
