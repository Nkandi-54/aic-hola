import React from "react";
import "./History.css";

const milestones = [
  {
    year: "1895",
    era: "NATIONAL HERITAGE",
    title: "Africa Inland Church Kenya Established",
    description:
      "Africa Inland Mission (later AIC Kenya) was founded in 1895, inaugurating over a century of faithful biblical teaching, hospital and school missions across Kenya.",
    scripture: 'Zechariah 4:10 · "Do not despise these small beginnings, for the Lord rejoices to see the work begin."',
  },
  {
    year: "1975",
    era: "LOCAL FOUNDATION",
    title: "A Fellowship of Faith Begins in Hola",
    description:
      "Under the shade of acacia trees along the Tana River, pioneer believers gathered in humble prayer, planting the enduring mustard seed of AIC Hola.",
    scripture: 'Psalm 122:1 · "I rejoiced with those who said to me, Let us go to the house of the Lord."',
  },
  {
    year: "1980",
    era: "CHURCH DEDICATION",
    title: "First Permanent Church Home",
    description:
      "Through sacrificial giving, fellowship, and community labour, the first permanent church building in Hola was consecrated for worship, Sunday School, and biblical instruction.",
    scripture: 'Psalm 84:1 · "How lovely is your dwelling place, Lord Almighty!"',
    image: "/gallery/20260502_134933.jpg",
    imageCaption: "AIC Hola compound gateway bearing church motto",
  },
  {
    year: "1990",
    era: "EXPANDING REACH",
    title: "Community Welfare & Outreach",
    description:
      "AIC Hola established regional mission stations and community initiatives, providing educational assistance, youth discipleship, and emergency support throughout Tana River County.",
    scripture: 'Matthew 25:40 · "Whatever you did for one of the least of these brothers and sisters of mine, you did for me."',
  },
  {
    year: "2005",
    era: "CHORAL MINISTRIES",
    title: "Flourishing Choirs of Praise",
    description:
      "Growth of dedicated choral ministries: Main Choir, Essence Choir, Youth Choir, and Sunday School Choir, ministering weekly in Swahili, Pokomo, and English.",
    scripture: 'Colossians 3:16 · "Singing psalms, hymns, and spiritual songs with gratitude in your hearts to God."',
    image: "/gallery/20251229_110819.jpg",
    imageCaption: "Choir ministries leading vibrant congregational worship",
  },
  {
    year: "2015",
    era: "CHURCH EXPANSION",
    title: "Modern Cathedral Church",
    description:
      "The congregation broke ground and dedicated our high-capacity modern church building, equipped for multi-service worship, conference gatherings, and regional fellowships.",
    scripture: 'Haggai 2:9 · "The glory of this present house will be greater than the glory of the former house, says the Lord Almighty."',
    image: "/gallery/20250608_115335.jpg",
    imageCaption: "Modern cathedral church pulpit and hall",
  },
  {
    year: "2025+",
    era: "GOLDEN JUBILEE & BEYOND",
    title: "50 Years of Grace & Digital Church",
    description:
      "Celebrating a half-century of uncompromised biblical exposition in Hola (1975–2025), launching live broadcasts and digital fellowship to connect worshippers everywhere.",
    scripture: 'Hebrews 13:8 · "Jesus Christ is the same yesterday and today and forever."',
    image: "/gallery/20260423_155619.jpg",
    imageCaption: "Panoramic aerial perspective of AIC Hola cathedral & grounds",
  },
];

export default function History() {
  return (
    <div className="page-shell history-page">
      <header className="page-heading">
        <span className="eyebrow">Church Heritage &amp; Roots</span>
        <h1>Rooted in faith, growing in grace.</h1>
        <p>
          The living testimony of God’s faithfulness in Hola — from pioneer fellowship gatherings in 1975 along the Tana River to a modern cathedral church.
        </p>
      </header>

      {/* 50-Year Golden Jubilee Commemoration Plaque */}
      <section className="history-jubilee-card" aria-label="50-Year Golden Jubilee Plaque">
        <div className="history-jubilee-medallion" aria-hidden="true">
          <span className="jubilee-num">50</span>
          <span className="jubilee-label">Years</span>
        </div>
        <div className="history-jubilee-body">
          <span className="jubilee-badge">
            <i className="fa-solid fa-certificate" aria-hidden="true" /> Golden Jubilee Heritage (1975 – Present)
          </span>
          <h2 className="history-jubilee-title">Half a Century of Ministry in Hola</h2>
          <p className="history-jubilee-desc">
            While our national denomination (Africa Inland Church Kenya) was founded in 1895, the local AIC Hola congregation was established in 1975. For 50 years, our church family has stood as an enduring beacon of Scripture, worship, and community service in Tana River County.
          </p>
        </div>
      </section>

      {/* Authentic Archival Photographic Showcase */}
      <section className="history-photos-strip" aria-label="Historic photos of AIC Hola">
        <div className="history-photo-frame">
          <img
            src="/gallery/20260423_155619.jpg"
            alt="Aerial perspective of AIC Hola Church compound and grounds"
            loading="lazy"
          />
          <span className="history-photo-caption">AIC Hola Church &amp; Compound Grounds</span>
        </div>
        <div className="history-photo-frame">
          <img
            src="/gallery/20260502_134933.jpg"
            alt="Main entrance gate to AIC Hola showing church motto and programme"
            loading="lazy"
          />
          <span className="history-photo-caption">Compound Gateway · Where the Bible Speaks</span>
        </div>
        <div className="history-photo-frame">
          <img
            src="/gallery/20250608_115335.jpg"
            alt="Church pulpit at AIC Hola"
            loading="lazy"
          />
          <span className="history-photo-caption">Church Pulpit · Expository Ministry</span>
        </div>
      </section>

      {/* Vertical Heritage Timeline */}
      <div className="timeline" aria-label="AIC Hola historical milestones">
        {milestones.map((milestone) => (
          <article className="timeline-item" key={milestone.year}>
            <div className="timeline-year">{milestone.year}</div>
            <div className="timeline-dot-wrapper" aria-hidden="true">
              <div className="timeline-dot" />
            </div>
            <div className={`timeline-card ${milestone.image ? "has-media" : ""}`}>
              <div className="timeline-card-inner">
                <div className="timeline-card-content">
                  <span className="timeline-era-tag">{milestone.era}</span>
                  <h2>{milestone.title}</h2>
                  <p>{milestone.description}</p>
                  {milestone.scripture && (
                    <blockquote className="timeline-scripture-seal">
                      <i className="fa-solid fa-quote-left" aria-hidden="true" />
                      <span className="scripture-seal-text">{milestone.scripture}</span>
                    </blockquote>
                  )}
                </div>
                {milestone.image && (
                  <div className="timeline-media-wrap">
                    <img
                      src={milestone.image}
                      alt={milestone.title}
                      className="timeline-media-image"
                      loading="lazy"
                    />
                    {milestone.imageCaption && (
                      <span className="timeline-media-caption">{milestone.imageCaption}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
