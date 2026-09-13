import React from "react";
import "./PageIntro.css";

/**
 * The green "intro" block used across the app, ported to the web so staff and
 * utility pages share one consistent, centered heading treatment: eyebrow with
 * a gold rule, a serif title, a description, concentric rings and the church
 * watermark.
 *
 * props:
 *   eyebrow, title, description
 *   icon        — optional Font Awesome class (shown top-right when not centered)
 *   centered    — centre the eyebrow, title and description
 */
export default function PageIntro({
  eyebrow,
  title,
  description,
  icon,
  centered = true,
}) {
  return (
    <section className={`page-intro${centered ? " page-intro-centered" : ""}`}>
      <span
        className="page-intro-ring page-intro-ring-large"
        aria-hidden="true"
      />
      <span
        className="page-intro-ring page-intro-ring-small"
        aria-hidden="true"
      />
      <img
        className="page-intro-watermark"
        src="/aic-hola-watermark.png"
        alt=""
        aria-hidden="true"
      />

      <div className="page-intro-topline">
        <span className="page-intro-eyebrow">
          <span className="page-intro-rule" aria-hidden="true" />
          {eyebrow}
        </span>
        {icon && !centered ? (
          <span className="page-intro-icon" aria-hidden="true">
            <i className={icon} />
          </span>
        ) : null}
      </div>

      <h1 className="page-intro-title">{title}</h1>
      <p className="page-intro-description">{description}</p>
    </section>
  );
}
