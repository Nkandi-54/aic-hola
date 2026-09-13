import React from "react";
import { Link } from "react-router-dom";
import CardArt from "./CardArt";
import "./FlashyCard.css";

// Map legacy icon names to illustration kinds, so existing callers get art
// without every page having to declare a `kind`.
const iconToKind = {
  "fa-landmark": "history",
  "fa-clock-rotate-left": "history",
  "fa-book-bible": "sermon",
  "fa-people-group": "choir",
  "fa-microphone-lines": "choir",
  "fa-circle-play": "live",
  "fa-tower-broadcast": "live",
  "fa-envelope": "contact",
  "fa-address-book": "contact",
  "fa-location-dot": "contact",
  "fa-image": "gallery",
  "fa-photo-film": "gallery",
  "fa-hand-holding-heart": "community",
};

const typeIcon = {
  audio: "fa-music",
  video: "fa-circle-play",
  image: "fa-image",
};

const FlashyCard = ({
  title,
  description,
  mediaType,
  to,
  link,
  openInNewTab = true,
  icon,
  meta,
  actionLabel = "Explore",
  accent,
  kind,
  art = true,
}) => {
  const destination = to || link || "";
  const artKind = kind || iconToKind[icon] || "default";
  const hasDestination = Boolean(destination) && destination !== "#";
  const isExternal = /^https?:\/\//i.test(destination);
  const cardStyle = accent ? { "--card-accent": accent } : undefined;
  const content = (
    <article className="content-card" style={cardStyle}>
      <div className="content-card-art">
        {art && <CardArt kind={artKind} accent={accent} />}
        {icon && (
          <span className="content-card-badge" aria-hidden="true">
            <i className={`fa-solid ${icon || typeIcon[mediaType] || "fa-sparkles"}`} />
          </span>
        )}
      </div>
      <div className="content-card-body">
        <div className="content-card-topline">
          {meta && <span className="content-card-meta">{meta}</span>}
        </div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
        {hasDestination && <span className="content-card-action">{actionLabel} <span aria-hidden="true">→</span></span>}
      </div>
    </article>
  );

  if (!hasDestination) return content;

  if (isExternal) {
    return (
      <a href={destination} className="flashy-card-link" target={openInNewTab ? "_blank" : undefined} rel={openInNewTab ? "noopener noreferrer" : undefined}>
        {content}
      </a>
    );
  }

  return <Link to={destination} className="flashy-card-link">{content}</Link>;
};

export default FlashyCard;
