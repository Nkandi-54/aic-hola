// src/components/Navbar.js
import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "./lib/auth";
import "./Navbar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const auth = useAuth();

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Change navbar background on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on link click (mobile)
  const handleLinkClick = () => {
    if (isOpen) setIsOpen(false);
  };

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-container">
          <NavLink to="/" end className="navbar-logo" onClick={handleLinkClick}>
            <span className="logo-emblem-wrap">
              <img src="/aic-hola-watermark.png" alt="" />
            </span>
            <span className="logo-text">
              <span className="logo-brand"><strong>AIC</strong> Hola</span>
              <span className="logo-tagline">Where the Bible Speaks</span>
            </span>
          </NavLink>

          {/* Links */}
          <div id="primary-navigation" className={`nav-links ${isOpen ? "open" : ""}`}>
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} onClick={handleLinkClick}>
              Home
            </NavLink>
            <NavLink to="/history" className="nav-link" onClick={handleLinkClick}>
              History
            </NavLink>
            <NavLink to="/choirs" className="nav-link" onClick={handleLinkClick}>
              Choirs
            </NavLink>
            <NavLink to="/sermons" className="nav-link" onClick={handleLinkClick}>
              Sermons
            </NavLink>
            <NavLink to="/live" className="nav-link nav-link-live" onClick={handleLinkClick}>
              <span className="live-pulse" aria-hidden="true" /> Live
            </NavLink>
            <NavLink to="/calendar" className="nav-link" onClick={handleLinkClick}>
              Events
            </NavLink>
            <NavLink to="/contacts" className="nav-link" onClick={handleLinkClick}>
              Contacts
            </NavLink>
            <NavLink to={auth.isStaff ? "/workspace" : "/account"} className="nav-link nav-cta" onClick={handleLinkClick}>
              <i className="fa-solid fa-shield-halved" aria-hidden="true" />
              {auth.isStaff ? "Workspace" : "Staff Portal"}
            </NavLink>
          </div>

          {/* Hamburger */}
          <button className="hamburger" onClick={toggleMenu}>
            <span className={`bar ${isOpen ? "open" : ""}`}></span>
            <span className={`bar ${isOpen ? "open" : ""}`}></span>
            <span className={`bar ${isOpen ? "open" : ""}`}></span>
          </button>
        </div>
      </nav>

      {/* Overlay for mobile */}
      <div className={`nav-overlay ${isOpen ? "open" : ""}`} onClick={toggleMenu}></div>
    </>
  );
};

export default Navbar;
