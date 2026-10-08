import React from "react";
import { Link } from "react-router-dom";
import MpesaGiving from "./MpesaGiving";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-cathedral-glow" aria-hidden="true" />
      <div className="footer-content">
        <div className="footer-column footer-brand-col">
          <div className="footer-brand">
            <div className="footer-crest">
              <img src="/aic-hola-watermark.png" alt="" />
            </div>
            <div className="footer-brand-text">
              <strong>AIC Hola Church</strong>
              <span className="footer-motto">Where the Bible Speaks</span>
            </div>
          </div>
          <p className="footer-vision">
            A church rooted in Christ, proclaiming truth, nurturing fellowship, and serving Tana River County and beyond.
          </p>
          <a
            href="https://maps.google.com/?q=AIC+Hola+Church"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-location"
          >
            <i className="fa-solid fa-location-dot" aria-hidden="true" />
            <span>Hola, Tana River County, Kenya</span>
          </a>
        </div>

        <div className="footer-column footer-schedule-col">
          <h3 className="footer-heading">
            <span className="footer-gold-dot" /> Church Services
          </h3>
          <ul className="footer-services-list">
            <li>
              <span className="service-day">Sunday Service 1</span>
              <span className="service-time">08:30 AM – 10:15 AM (Swahili)</span>
            </li>
            <li>
              <span className="service-day">Sunday Service 2</span>
              <span className="service-time">10:45 AM – 12:30 PM (English)</span>
            </li>
            <li>
              <span className="service-day">Wednesday Midweek</span>
              <span className="service-time">05:00 PM – 06:30 PM (Prayer)</span>
            </li>
            <li>
              <span className="service-day">Friday Rehearsals</span>
              <span className="service-time">04:30 PM (Choir Ministries)</span>
            </li>
          </ul>
        </div>

        <div className="footer-column footer-giving-col">
          <h3 className="footer-heading">
            <span className="footer-gold-dot" /> Tithes &amp; Offerings
          </h3>
          <MpesaGiving variant="footer" className="footer-mpesa" />

          <div className="footer-socials-wrap">
            <span className="socials-label">Connect with our family:</span>
            <div className="footer-socials">
              <a href="https://facebook.com/aichola" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://www.youtube.com/@nkandi242" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <i className="fab fa-youtube"></i>
              </a>
              <a href="mailto:contacts@aichola.org" aria-label="Email church administration">
                <i className="fas fa-envelope"></i>
              </a>
              <a href="tel:+254727175730" aria-label="Call church office">
                <i className="fas fa-phone"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} AIC Hola Church. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/history" className="footer-legal-link">History</Link>
            <Link to="/calendar" className="footer-legal-link">Events</Link>
            <Link to="/sermons" className="footer-legal-link">Sermons</Link>
            <Link to="/choirs" className="footer-legal-link">Choirs</Link>
            <Link to="/live" className="footer-legal-link">Live</Link>
            <Link to="/privacy" className="footer-legal-link">Privacy</Link>
            <Link to="/account" className="footer-legal-link">Church Portal</Link>
          </div>
          <div className="footer-values-badge">
            <span>Faith</span>
            <span className="value-separator">✦</span>
            <span>Fellowship</span>
            <span className="value-separator">✦</span>
            <span>Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
