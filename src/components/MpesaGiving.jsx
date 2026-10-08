import React, { useState } from "react";
import "./MpesaGiving.css";

/**
 * "Lipa na M-PESA" giving details for offerings made via mobile money.
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
          <span>Account <strong>802200#TITHE / #OFFERING</strong></span>
        </span>
      </div>
    );
  }

  if (variant === "hub") {
    const categories = [
      {
        key: "tithe",
        label: "Tithe",
        account: "802200#TITHE",
        purpose: "Tithe (10% Firstfruits)",
        note: "Enter '802200#TITHE' in Account Number (or '802200#TITHE#YourName')",
      },
      {
        key: "offering",
        label: "General Offering",
        account: "802200#OFFERING",
        purpose: "Sunday & Midweek Offertory",
        note: "Enter '802200#OFFERING' in Account Number",
      },
      {
        key: "building",
        label: "Church Building",
        account: "802200#BUILDING",
        purpose: "Cathedral Development & Maintenance",
        note: "Enter '802200#BUILDING' in Account Number",
      },
      {
        key: "missions",
        label: "Missions & Outreach",
        account: "802200#MISSIONS",
        purpose: "Evangelism & Regional Mission Fields",
        note: "Enter '802200#MISSIONS' in Account Number",
      },
      {
        key: "benevolence",
        label: "Needy & Benevolence",
        account: "802200#NEEDY",
        purpose: "Compassion Ministry & Vulnerable Families",
        note: "Enter '802200#NEEDY' in Account Number",
      },
      {
        key: "thanksgiving",
        label: "Thanksgiving",
        account: "802200#THANKSGIVING",
        purpose: "Special Praise & Thanksgiving Giving",
        note: "Enter '802200#THANKSGIVING' in Account Number",
      },
    ];

    const current = categories.find((c) => c.key === activeCategory) || categories[0];

    return (
      <div className={`mpesa-hub ${className}`.trim()} aria-label="Church Giving Hub">
        <div className="mpesa-hub-header">
          <div className="mpesa-hub-brand">
            {wordmark}
            <span className="mpesa-hub-badge">LIPA NA M-PESA</span>
          </div>
          <span className="mpesa-hub-subtitle">Official Church Paybill &bull; Equity Bank</span>
        </div>

        {/* Giving Category Selector */}
        <div className="mpesa-hub-tabs" role="tablist">
          {categories.map((cat) => (
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
            <span className="mpesa-hub-label">BUSINESS NO. (PAYBILL)</span>
            <div className="mpesa-hub-value-row">
              <strong className="mpesa-hub-value">247247</strong>
              <button
                type="button"
                className="mpesa-copy-btn"
                title="Copy Paybill Number"
                onClick={() => copyToClipboard("247247", "paybill")}
              >
                <i className={`fa-solid ${copiedField === "paybill" ? "fa-check" : "fa-copy"}`} aria-hidden="true" />
                <span>{copiedField === "paybill" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <span className="mpesa-hub-sub">Equity Bank</span>
          </div>

          <div className="mpesa-hub-box">
            <span className="mpesa-hub-label">ACCOUNT ({current.label.toUpperCase()})</span>
            <div className="mpesa-hub-value-row">
              <strong className="mpesa-hub-value">{current.account}</strong>
              <button
                type="button"
                className="mpesa-copy-btn"
                title="Copy Account Number"
                onClick={() => copyToClipboard(current.account, "account")}
              >
                <i className={`fa-solid ${copiedField === "account" ? "fa-check" : "fa-copy"}`} aria-hidden="true" />
                <span>{copiedField === "account" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <span className="mpesa-hub-sub">{current.note}</span>
          </div>
        </div>

        <div className="mpesa-ledger-guide">
          <i className="fa-solid fa-circle-info" aria-hidden="true" />
          <span>
            Reconciles directly to church <strong>{current.purpose}</strong> ledger. Optional: append your name (e.g. <code>{current.account}#YourName</code>).
          </span>
        </div>
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
            247247
            <button
              type="button"
              className="mpesa-copy-mini"
              title="Copy Paybill"
              onClick={() => copyToClipboard("247247", "card-paybill")}
            >
              <i className={`fa-solid ${copiedField === "card-paybill" ? "fa-check" : "fa-copy"}`} />
            </button>
          </dd>
        </div>
        <div>
          <dt>Account</dt>
          <dd className="mpesa-card-account-dd">
            802200#TITHE
            <button
              type="button"
              className="mpesa-copy-mini"
              title="Copy Tithe Account"
              onClick={() => copyToClipboard("802200#TITHE", "card-account")}
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
        Enter <strong>802200#TITHE</strong> for tithes, or <strong>802200#OFFERING</strong> for general offerings.
      </p>
    </section>
  );
}
