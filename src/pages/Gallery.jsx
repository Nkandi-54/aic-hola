import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Gallery.css";

const galleryCatalog = [
  {
    file: "20250817_164248.jpg",
    title: "Sanctuary Choir in Reverent Worship",
    category: "Worship Choirs",
    date: "August 2025",
    desc: "AIC Hola Sanctuary Choir ministering sacred hymns during Sunday divine service.",
  },
  {
    file: "20250817_165759.jpg",
    title: "Choral Anthems & Harmonies",
    category: "Worship Choirs",
    date: "August 2025",
    desc: "Worship leaders and choir members lifting voices in multi-part harmony.",
  },
  {
    file: "20250608_115335.jpg",
    title: "Sanctuary Pulpit Ministry",
    category: "Sanctuary Praise",
    date: "June 2025",
    desc: "The sacred pulpit of AIC Hola where the Bible speaks and grace abounds.",
  },
  {
    file: "20251229_110819.jpg",
    title: "Youth Praise & Devotion",
    category: "Worship Choirs",
    date: "December 2025",
    desc: "Youth and teens celebrating God's goodness during end-of-year thanksgiving service.",
  },
  {
    file: "20251223_173751.jpg",
    title: "Christmas Sanctuary Fellowship",
    category: "Fellowships",
    date: "December 2025",
    desc: "Congregation gathering for sacred Christmas carols and praise.",
  },
  {
    file: "20260104_132048.jpg",
    title: "New Year Dedication Service",
    category: "Sanctuary Praise",
    date: "January 2026",
    desc: "Starting the new year rooted in prayer and dedication at Hola sanctuary.",
  },
  {
    file: "20260404_121843.jpg",
    title: "Easter Praise Gathering",
    category: "Fellowships",
    date: "April 2026",
    desc: "Commemorating the resurrection of our Lord Jesus Christ in song.",
  },
  {
    file: "20260404_141513.jpg",
    title: "Worship Team Ministration",
    category: "Worship Choirs",
    date: "April 2026",
    desc: "Vibrant worship ministering to families and guests.",
  },
  {
    file: "20260404_141723.jpg",
    title: "Congregational Praise",
    category: "Sanctuary Praise",
    date: "April 2026",
    desc: "Hands lifted in sincere thanksgiving to the Almighty.",
  },
  {
    file: "20260404_142104.jpg",
    title: "Fellowship in the Courtyard",
    category: "Fellowships",
    date: "April 2026",
    desc: "Warm Christian fellowship after Sunday divine service.",
  },
  {
    file: "20260404_144828.jpg",
    title: "Ministry Leaders Gathering",
    category: "Fellowships",
    date: "April 2026",
    desc: "Pastoral and elder team fellowship at the church grounds.",
  },
  {
    file: "20260423_155619.jpg",
    title: "Sanctuary Compound & Grounds",
    category: "Grounds & Gateway",
    date: "April 2026",
    desc: "Aerial view of AIC Hola church compound and peaceful sanctuary grounds.",
  },
  {
    file: "20260502_134732.jpg",
    title: "Main Church Compound Avenue",
    category: "Grounds & Gateway",
    date: "May 2026",
    desc: "Welcoming driveway leading worshippers to the main sanctuary.",
  },
  {
    file: "20260502_134823.jpg",
    title: "Sanctuary Building Exterior",
    category: "Grounds & Gateway",
    date: "May 2026",
    desc: "The cathedral building standing as a beacon in Hola, Tana River.",
  },
  {
    file: "20260502_134933.jpg",
    title: "Main Entrance Gateway · Motto",
    category: "Grounds & Gateway",
    date: "May 2026",
    desc: "Church entrance gates bearing our banner: Where the Bible Speaks.",
  },
];

const galleryCategories = [
  "All Photos",
  "Sanctuary Praise",
  "Worship Choirs",
  "Grounds & Gateway",
  "Fellowships",
];

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState("All Photos");
  const [selectedIndex, setSelectedIndex] = useState(null);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "All Photos") return galleryCatalog;
    return galleryCatalog.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  const selectedPhoto =
    selectedIndex !== null ? filteredItems[selectedIndex] : null;

  const closeViewer = useCallback(() => setSelectedIndex(null), []);

  const showPrevious = useCallback(() => {
    setSelectedIndex((current) =>
      current === 0 ? filteredItems.length - 1 : current - 1
    );
  }, [filteredItems.length]);

  const showNext = useCallback(() => {
    setSelectedIndex((current) =>
      current === filteredItems.length - 1 ? 0 : current + 1
    );
  }, [filteredItems.length]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (selectedIndex === null) return;
      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, closeViewer, showPrevious, showNext]);

  useEffect(() => {
    document.body.style.overflow = selectedIndex !== null ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedIndex]);

  return (
    <div className="page-shell gallery-page">
      <Link className="back-link" to="/">
        <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back to Home
      </Link>

      <header className="page-heading gallery-heading">
        <span className="eyebrow">Visual Heritage &bull; Church Life</span>
        <h1>Moments of Grace &amp; Fellowship.</h1>
        <p>
          Photographic memories of sanctuary worship, sacred choral music, and fellowship at AIC Hola.
        </p>
      </header>

      {/* Category Filter Pills */}
      <div className="gallery-filter-bar" role="group" aria-label="Filter photos by category">
        {galleryCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`gallery-filter-btn ${selectedCategory === cat ? "active" : ""}`}
            onClick={() => {
              setSelectedCategory(cat);
              setSelectedIndex(null);
            }}
            aria-pressed={selectedCategory === cat}
          >
            {cat}
          </button>
        ))}
      </div>

      <section className="photo-gallery" aria-label="AIC Hola photo gallery">
        {filteredItems.map((photo, index) => (
          <button
            key={photo.file}
            className="gallery-photo"
            type="button"
            onClick={() => setSelectedIndex(index)}
            aria-label={`View photo: ${photo.title}`}
          >
            <img
              src={`/gallery/${photo.file}`}
              alt={photo.title}
              loading="lazy"
            />
            <div className="photo-overlay">
              <div>
                <span className="photo-category-pill">{photo.category}</span>
                <span className="photo-title">{photo.title}</span>
                <small className="photo-date">{photo.date}</small>
              </div>
              <span className="photo-action" aria-hidden="true">
                <i className="fa-solid fa-expand" />
              </span>
            </div>
          </button>
        ))}
      </section>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="viewer-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={closeViewer}
        >
          <div
            className="viewer-content"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="viewer-close"
              type="button"
              onClick={closeViewer}
              aria-label="Close image viewer"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>

            <button
              className="viewer-nav viewer-prev"
              type="button"
              onClick={showPrevious}
              aria-label="View previous image"
            >
              <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            </button>

            <div className="viewer-image-wrap">
              <img
                src={`/gallery/${selectedPhoto.file}`}
                alt={selectedPhoto.title}
                className="viewer-image"
              />
            </div>

            <button
              className="viewer-nav viewer-next"
              type="button"
              onClick={showNext}
              aria-label="View next image"
            >
              <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            </button>

            <div className="viewer-caption">
              <div className="viewer-caption-main">
                <span className="viewer-category">{selectedPhoto.category}</span>
                <h3>{selectedPhoto.title}</h3>
                <p>{selectedPhoto.desc}</p>
              </div>
              <div className="viewer-caption-meta">
                <span>{selectedPhoto.date}</span>
                <span className="viewer-counter">
                  {selectedIndex + 1} of {filteredItems.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}