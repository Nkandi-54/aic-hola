import React from "react";
import { useParams, Link } from "react-router-dom";
import choirs from "../data/choirs";
import FlashyCard from "../components/FlashyCard";
import "./Choirs.css";

export default function ChoirDetail() {
  const { slug } = useParams();
  const choir = choirs.find((item) => item.slug === slug);

  if (!choir) {
    return (
      <div className="page-shell page-heading">
        <h1>Choir Not Found</h1>
        <p>The choir ministry you are looking for is unavailable.</p>
        <Link className="button gold" to="/choirs">
          Back to Choirs
        </Link>
      </div>
    );
  }

  return (
    <div className="page-shell choir-detail-page">
      <Link className="back-link" to="/choirs">
        <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back to All Choirs
      </Link>

      <header className="page-heading choir-detail-heading">
        <span className="eyebrow">{choir.focus}</span>
        <h1>{choir.name}</h1>
        <p>{choir.description}</p>
      </header>

      {choir.image && (
        <div className="choir-hero-frame">
          <img
            src={choir.image}
            alt={`${choir.name} ministering in praise`}
            className="choir-hero-img"
          />
          <div className="choir-hero-gradient" />
          <div className="choir-hero-badge">
            <i className="fa-solid fa-microphone-lines" aria-hidden="true" />
            <span>{choir.name} &bull; Hola Church</span>
          </div>
        </div>
      )}

      <div className="section-heading">
        <div>
          <span className="eyebrow">Worship Recordings</span>
          <h2>Media &amp; Anthems</h2>
        </div>
        <p>Listen and watch special praise sessions ministered by {choir.name}.</p>
      </div>

      <div className="content-grid two">
        {(choir.media || []).map((item) => (
          <FlashyCard
            key={item.title}
            title={item.title}
            description={item.description}
            mediaType={item.type}
            to={item.url || "https://www.youtube.com/@nkandi242"}
            icon={item.type === "audio" ? "fa-music" : "fa-circle-play"}
            meta={item.type === "audio" ? "Audio Track" : "Video Recording"}
            actionLabel={item.type === "audio" ? "Listen on YouTube" : "Watch on YouTube"}
            accent={item.type === "audio" ? "#b9c8e8" : "#dfb86a"}
          />
        ))}
      </div>
    </div>
  );
}
