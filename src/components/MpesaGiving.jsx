import React, { useState } from "react";
import { GIVING_CATEGORIES, useChurchSettings } from "../lib/church";
import "./MpesaGiving.css";

/**
 * "Lipa na M-PESA" giving details for offerings made via mobile money.
 *
 * The paybill and account number come from the church's real settings
 * (src/lib/church.js → public.church_settings), so the website, the mobile app
 * and the church books always quote the same official details.
 *
 * `variant`:
 *   "footer" — a single compact block sized to sit beside the church brand in
 *              the lower taskbar (no heavy banner; matches the footer scale).
 *   "card"   — a tidy card for the contacts page.
 *   "hub"    — a rich interactive stewardship hub with one-tap copy and giving categories.
 */
export default function MpesaGiving({ variant = "card", className = "" }) {
  const [copiedField, setCopiedField] = useState(null);
  const [activeCategory, setActiveCategory] = useState("tithe");
  const settings = useChurchSettings();

  const paybill = settings.paybill;
  const account = settings.paybill_account;

  const copyToClipboard = (text, field) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2500);
      });
    }
  };

  const wordmark = (
    <span className="mpesa-logo" aria-label="M-PESA">
      <span className="mpesa-logo-m">M</span>
      <span className="mpesa-logo-pesa">PESA</span>
    </span>
  );

  const copyButton = (value, field, title) => (
    <button
      type="button"
      className="mpesa-copy-btn"
      title={title}
      onClick={() => copyToClipboard(value, field)}
    >
      <i
        className={`fa-solid ${copiedField === field ? "fa-check" : "fa-copy"}`}
        aria-hidden="true"
      />
      <span>{copiedField === field ? "Copied" : "Copy"}</span>
    </button>
  );

  if (variant === "footer") {
    return (
      <div className={`mpesa-footer ${className}`.trim()}>
        <span className="mpesa-footer-head">
          {wordmark}
          <span className="mpesa-footer-tag">Lipa na M-PESA</span>
        </span>
        <span className="mpesa-footer-details">
          <span>
            Paybill <strong>{paybill}</strong>
          </span>
          <span className="mpesa-sep" aria-hidden="true">·</span>
          <span>
            Account <strong>{account}</strong>
          </span>
        </span>
      </div>
    );
  }

  if (variant === "hub") {
    const current =
      GIVING_CATEGORIES.find((c) => c.key === activeCategory) ||
      GIVING_CATEGORIES[0];

    return (
      <div className={`mpesa-hub ${className}`.trim()} aria-label="Church Giving Hub">
        <div className="mpesa-hub-header">
          <div className="mpesa-hub-brand">
            {wordmark}
            <span className="mpesa-hub-badge">LIPA NA M-PESA</span>
          </div>
          <span className="mpesa-hub-subtitle">
            Official Church Paybill
            {settings.bank_name ? ` • ${settings.bank_name}` : ""}
          </span>
        </div>

        {/* Giving Category Selector */}
        <div className="mpesa-hub-tabs" role="tablist">
          {GIVING_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat.key}
              className={`mpesa-hub-tab ${activeCategory === cat.key ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Direct Payment Lockup */}
        <div className="mpesa-hub-lockup">
          <div className="mpesa-hub-box">
            <span className="mpesa-hub-label">PAYBILL</span>
            <div className="mpesa-hub-value-row">
              <strong className="mpesa-hub-value">{paybill}</strong>
              {copyButton(paybill, "paybill", "Copy Paybill Number")}
            </div>
          </div>

          <div className="mpesa-hub-box">
            <span className="mpesa-hub-label">ACCOUNT</span>
            <div className="mpesa-hub-value-row">
              <strong className="mpesa-hub-value">{account}</strong>
              {copyButton(account, "account", "Copy Account Number")}
            </div>
          </div>
        </div>

        <div className="mpesa-scripture-ribbon">
          <i className="fa-solid fa-quote-left" aria-hidden="true" />
          <span>&ldquo;Honor the Lord with your wealth, with the firstfruits of all your increase.&rdquo; &mdash; Prov. 3:9</span>
        </div>

        <p className="mpesa-card-note">
          On your phone: <strong>M-PESA &rarr; Lipa na M-PESA &rarr; Pay Bill</strong>.
          Enter Paybill <strong>{paybill}</strong>, Account <strong>{account}</strong>,
          then the amount for your <strong>{current.label.toLowerCase()}</strong> (
          {current.purpose}). Every category is paid to the same official church
          account.
        </p>
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
          <dd>
            <span>{paybill}</span>
            <button
              type="button"
              className="mpesa-copy-mini"
              title="Copy Paybill"
              onClick={() => copyToClipboard(paybill, "card-paybill")}
            >
              <i className={`fa-solid ${copiedField === "card-paybill" ? "fa-check" : "fa-copy"}`} />
            </button>
          </dd>
        </div>
        <div>
          <dt>Account</dt>
          <dd className="mpesa-card-account-dd">
            <span className="mpesa-account-code">{account}</span>
            <button
              type="button"
              className="mpesa-copy-mini"
              title="Copy Account Number"
              onClick={() => copyToClipboard(account, "card-account")}
            >
              <i className={`fa-solid ${copiedField === "card-account" ? "fa-check" : "fa-copy"}`} />
            </button>
          </dd>
        </div>
      </dl>
      <div className="mpesa-scripture-ribbon">
        <i className="fa-solid fa-quote-left" aria-hidden="true" />
        <span>&ldquo;Honor the Lord with your wealth, with the firstfruits of all your increase.&rdquo; &mdash; Prov. 3:9</span>
      </div>
      <p className="mpesa-card-note">
        Enter Paybill <strong>{paybill}</strong> and Account{" "}
        <strong>{account}</strong> for tithes, offerings, building, missions and
        benevolence. State the purpose of your gift in the M-PESA confirmation.
      </p>
    </section>
  );
}
