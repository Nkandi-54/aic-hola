import React from "react";
import "./MpesaGiving.css";

/**
 * "Lipa na M-PESA" giving details for offerings made via mobile money.
 *
 * `variant`:
 *   "footer" — a single compact block sized to sit beside the church brand in
 *              the lower taskbar (no heavy banner; matches the footer scale).
 *   "card"   — a tidy card for the contacts page.
 *
 * The M-PESA wordmark is drawn as the green Safaricom lockup; it recolours to
 * the surrounding surface via CSS.
 */
export default function MpesaGiving({ variant = "card", className = "" }) {
  const wordmark = (
    <span className="mpesa-logo" aria-label="M-PESA">
      <span className="mpesa-logo-m">M</span>
      <span className="mpesa-logo-pesa">PESA</span>
    </span>
  );

  if (variant === "footer") {
    return (
      <div className={`mpesa-footer ${className}`.trim()}>
        <span className="mpesa-footer-head">
          {wordmark}
          <span className="mpesa-footer-tag">Lipa na M-PESA</span>
        </span>
        <span className="mpesa-footer-details">
          <span>Paybill <strong>247247</strong></span>
          <span className="mpesa-sep" aria-hidden="true">·</span>
          <span>Account <strong>802200</strong></span>
        </span>
      </div>
    );
  }

  return (
    <section className={`mpesa-card ${className}`.trim()} aria-label="Give by M-PESA">
      <div className="mpesa-card-head">
        {wordmark}
        <span className="mpesa-badge">LIPA NA M-PESA</span>
      </div>
      <dl className="mpesa-card-details">
        <div>
          <dt>Paybill</dt>
          <dd>247247</dd>
        </div>
        <div>
          <dt>Account</dt>
          <dd>802200</dd>
        </div>
      </dl>
      <div className="mpesa-scripture-ribbon">
        <i className="fa-solid fa-quote-left" aria-hidden="true" />
        <span>&ldquo;Honor the Lord with your wealth, with the firstfruits of all your increase.&rdquo; &mdash; Prov. 3:9</span>
      </div>
      <p className="mpesa-card-note">Offerings &amp; tithes via mobile money.</p>
    </section>
  );
}
