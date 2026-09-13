// src/components/Navbar.js
import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";
import "./Navbar.css";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const auth = useAuth();

  // Change navbar background on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking a link
  const handleLinkClick = () => setMenuOpen(false);

  // Helper for NavLink active class
  const getLinkClass = ({ isActive }) =>
    `nav-link${isActive ? " active" : ""}`;

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-container">
          <NavLink to="/" end className="navbar-logo" onClick={handleLinkClick} aria-label="AIC Hola home">
            <span className="logo-emblem-wrap">
              <img src="/aic-hola-watermark.png" alt="" />
            </span>
            <div className="logo-text">
              <span className="logo-brand"><strong>AIC</strong> Hola</span>
              <span className="logo-tagline">Where the Bible Speaks</span>
            </div>
          </NavLink>

          <button
            className="hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
          >
            <span className={`bar ${menuOpen ? "open" : ""}`}></span>
            <span className={`bar ${menuOpen ? "open" : ""}`}></span>
            <span className={`bar ${menuOpen ? "open" : ""}`}></span>
          </button>

          <div id="primary-navigation" className={`nav-links ${menuOpen ? "open" : ""}`}>
            <NavLink to="/" end className={getLinkClass} onClick={handleLinkClick}>
              Home
            </NavLink>
            <NavLink to="/history" className={getLinkClass} onClick={handleLinkClick}>
              History
            </NavLink>
            <NavLink to="/choirs" className={getLinkClass} onClick={handleLinkClick}>
              Choirs
            </NavLink>
            <NavLink to="/sermons" className={getLinkClass} onClick={handleLinkClick}>
              Sermons
            </NavLink>
            <NavLink to="/live" className={({ isActive }) => `nav-link nav-link-live${isActive ? " active" : ""}`} onClick={handleLinkClick}>
              <span className="live-pulse" aria-hidden="true" />
              Live
            </NavLink>
            <NavLink to="/gallery" className={getLinkClass} onClick={handleLinkClick}>
              Gallery
            </NavLink>
            <NavLink to="/calendar" className={getLinkClass} onClick={handleLinkClick}>
              Events
            </NavLink>
            <NavLink to="/contacts" className={getLinkClass} onClick={handleLinkClick}>
              Contacts
            </NavLink>
            <NavLink to={auth.isStaff ? "/workspace" : "/account"} className="nav-link nav-cta" onClick={handleLinkClick}>
              <i className="fa-solid fa-shield-halved" aria-hidden="true" />
              {auth.isStaff ? "Workspace" : "Staff Portal"}
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Overlay for mobile menu */}
      <div
        className={`nav-overlay ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
    </>
  );
};

export default Navbar;
