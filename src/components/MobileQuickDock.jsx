import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getNextServiceInfo } from "../lib/services";
import { GIVING_CATEGORIES, useChurchSettings } from "../lib/church";
import "./MobileQuickDock.css";

export default function MobileQuickDock() {
  const location = useLocation();
  const [giveSheetOpen, setGiveSheetOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [serviceInfo, setServiceInfo] = useState(() => getNextServiceInfo());
  const settings = useChurchSettings();

  const paybill = settings.paybill;
  const account = settings.paybill_account;

  useEffect(() => {
    const timer = setInterval(() => {
      setServiceInfo(getNextServiceInfo());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Exclude from admin and management consoles
  const isPortal = /^\/(workspace|admin|pastor-desk|manage|treasury|records|account|reset-password)/i.test(
    location.pathname
  );

  if (isPortal) return null;

  const copyToClipboard = (text, field) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2500);
      });
    }
  };

  return (
    <>
      <nav className="mobile-quick-dock" aria-label="Mobile Church Quick Actions">
        <Link
          to="/live"
          className={`mqd-item ${location.pathname === "/live" ? "active" : ""}`}
        >
          <div className="mqd-icon-wrap">
            <i className="fa-solid fa-tower-broadcast" />
            {serviceInfo.isLiveNow && <span className="mqd-live-dot" />}
          </div>
          <span>Watch Live</span>
        </Link>

        <button
          type="button"
          className="mqd-item mqd-give-btn"
          onClick={() => setGiveSheetOpen(true)}
          aria-label="Give via M-PESA"
        >
          <div className="mqd-icon-wrap mqd-icon-give">
            <i className="fa-solid fa-hand-holding-heart" />
          </div>
          <span>Give</span>
        </button>

        <Link
          to="/#services"
          className="mqd-item"
          onClick={(e) => {
            if (location.pathname === "/") {
              e.preventDefault();
              const el = document.getElementById("services-section") || document.querySelector(".worship-rhythm");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          <div className="mqd-icon-wrap">
            <i className="fa-regular fa-clock" />
          </div>
          <span>Services</span>
        </Link>

        <a
          href="https://www.google.com/maps/dir/?api=1&destination=AIC+Hola+Church+Hola+Kenya"
          target="_blank"
          rel="noopener noreferrer"
          className="mqd-item"
        >
          <div className="mqd-icon-wrap">
            <i className="fa-solid fa-diamond-turn-right" />
          </div>
          <span>Directions</span>
        </a>
      </nav>

      {/* Slide-Up M-PESA Giving Sheet for Mobile */}
      {giveSheetOpen && (
        <div
          className="mqd-sheet-backdrop"
          onClick={() => setGiveSheetOpen(false)}
          role="presentation"
        >
          <div
            className="mqd-sheet-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mqd-sheet-title"
          >
            <div className="mqd-sheet-handle" />

            <div className="mqd-sheet-header">
              <div>
                <span className="mqd-sheet-kicker">Lipa na M-PESA</span>
                <h3 id="mqd-sheet-title">Tithe & Offering Giving</h3>
              </div>
              <button
                type="button"
                className="mqd-sheet-close"
                onClick={() => setGiveSheetOpen(false)}
                aria-label="Close giving sheet"
              >
                ✕
              </button>
            </div>

            <div className="mqd-sheet-cards">
              <div className="mqd-give-card">
                <div className="mqd-card-meta">
                  <span className="mqd-card-label">Paybill Number</span>
                  <strong className="mqd-card-val">{paybill}</strong>
                  <small>Official AIC Hola Paybill</small>
                </div>
                <button
                  type="button"
                  className="mqd-copy-btn"
                  onClick={() => copyToClipboard(paybill, "paybill")}
                >
                  <i className={`fa-solid ${copiedField === "paybill" ? "fa-check" : "fa-copy"}`} />
                  {copiedField === "paybill" ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="mqd-give-card">
                <div className="mqd-card-meta">
                  <span className="mqd-card-label">Account Number</span>
                  <strong className="mqd-card-val">{account}</strong>
                  <small>Use for every tithe, offering and gift</small>
                </div>
                <button
                  type="button"
                  className="mqd-copy-btn"
                  onClick={() => copyToClipboard(account, "account")}
                >
                  <i className={`fa-solid ${copiedField === "account" ? "fa-check" : "fa-copy"}`} />
                  {copiedField === "account" ? "Copied" : "Copy"}
                </button>
              </div>

              {GIVING_CATEGORIES.slice(0, 4).map((cat) => (
                <div className="mqd-give-card" key={cat.key}>
                  <div className="mqd-card-meta">
                    <span className="mqd-card-label">{cat.label}</span>
                    <strong className="mqd-card-val">{cat.purpose}</strong>
                    <small>State this as the purpose of your gift</small>
                  </div>
                </div>
              ))}
            </div>

            <div className="mqd-sheet-footer">
              <Link
                to="/contacts#giving"
                className="button secondary sm full-width"
                onClick={() => setGiveSheetOpen(false)}
              >
                View Full Stewardship & Ministry Giving Hub
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

