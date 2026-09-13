import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Gallery.css";

const galleryItems = [
  "20250608_115335.jpg",
  "20250817_164248.jpg",
  "20250817_165759.jpg",
  "20251223_173751.jpg",
  "20251229_110819.jpg",
  "20260104_132048.jpg",
  "20260404_121843.jpg",
  "20260404_141513.jpg",
  "20260404_141723.jpg",
  "20260404_142104.jpg",
  "20260404_144828.jpg",
  "20260423_155619.jpg",
  "20260502_134732.jpg",
  "20260502_134823.jpg",
  "20260502_134933.jpg",
];

function formatPhotoName(filename) {
  const name = filename.replace(".jpg", "");
  const year = name.substring(0, 4);
  const month = name.substring(4, 6);
  const day = name.substring(6, 8);

  return new Date(`${year}-${month}-${day}T00:00:00`).toLocaleDateString(
    "en-KE",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

export default function Gallery() {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const selectedPhoto =
    selectedIndex !== null ? galleryItems[selectedIndex] : null;

  const closeViewer = () => setSelectedIndex(null);

  const showPrevious = () => {
    setSelectedIndex((current) =>
      current === 0 ? galleryItems.length - 1 : current - 1
    );
  };

  const showNext = () => {
    setSelectedIndex((current) =>
      current === galleryItems.length - 1 ? 0 : current + 1
    );
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (selectedIndex === null) return;

      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex]);

  useEffect(() => {
    document.body.style.overflow =
      selectedIndex !== null ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedIndex]);

  return (
    <div className="page-shell gallery-page">
      <header className="page-heading gallery-heading">
        <span className="eyebrow">Church life</span>

        <h1>Moments worth sharing.</h1>

        <p>
          A collection of worship, fellowship, service, and memories
          from AIC Hola.
        </p>
      </header>

      <section className="photo-gallery" aria-label="AIC Hola photo gallery">
        {galleryItems.map((photo, index) => (
          <button
            key={photo}
            className="gallery-photo"
            type="button"
            onClick={() => setSelectedIndex(index)}
            aria-label={`Open photo ${index + 1}`}
          >
            <img
              src={`/gallery/${photo}`}
              alt={`AIC Hola church moment from ${formatPhotoName(photo)}`}
              loading={index < 4 ? "eager" : "lazy"}
              decoding="async"
            />

            <span className="photo-overlay">
              <span className="photo-date">
                {formatPhotoName(photo)}
              </span>

              <span className="photo-expand">
                View
              </span>
            </span>
          </button>
        ))}
      </section>

      <section className="gallery-cta">
        <div>
          <span className="eyebrow">Share a memory</span>

          <h2>Have a photo or story from church life?</h2>

          <p>
            We would love to hear from you and help keep our community
            story alive.
          </p>
        </div>

        <Link className="button" to="/contacts">
          Contact the team
        </Link>
      </section>

      {selectedPhoto && (
        <div
          className="gallery-viewer"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={closeViewer}
        >
          <button
            className="viewer-close"
            type="button"
            onClick={closeViewer}
            aria-label="Close photo viewer"
          >
            ×
          </button>

          <button
            className="viewer-arrow viewer-prev"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showPrevious();
            }}
            aria-label="Previous photo"
          >
            ‹
          </button>

          <div
            className="viewer-content"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={`/gallery/${selectedPhoto}`}
              alt={`AIC Hola church moment from ${formatPhotoName(
                selectedPhoto
              )}`}
            />

            <div className="viewer-caption">
              <span>
                {selectedIndex + 1} / {galleryItems.length}
              </span>

              <strong>
                {formatPhotoName(selectedPhoto)}
              </strong>
            </div>
          </div>

          <button
            className="viewer-arrow viewer-next"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showNext();
            }}
            aria-label="Next photo"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}