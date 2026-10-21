import React from "react";
import { Link } from "react-router-dom";
import "./Privacy.css";

function Privacy() {
  return (
    <div className="privacy-page">
      <div className="privacy-hero">
        <div className="privacy-hero-content">
          <span className="privacy-badge">
            <i className="fa-solid fa-shield-halved" aria-hidden="true" />
            CHURCH DATA GOVERNANCE
          </span>
          <h1 className="privacy-title">Privacy Policy & Member Data Rights</h1>
          <p className="privacy-lead">
            Africa Inland Church (AIC) Hola is dedicated to honoring your trust, maintaining biblical confidentiality, and protecting your statutory privacy rights under the Kenya Data Protection Act 2019, Google Play Developer Policies, and Apple App Store Review Guidelines.
          </p>
          <div className="privacy-meta">
            <span>Effective Date: September 2026</span>
            <span>·</span>
            <span>Version 1.0 (Store Compliant)</span>
          </div>
        </div>
      </div>

      <div className="privacy-container">
        <section className="privacy-section">
          <h2>
            <span className="section-num">01</span> Information We Collect
          </h2>
          <p>We collect only the minimum personal information required to facilitate church fellowship and administrative communication:</p>
          <ul>
            <li><strong>Account Credentials:</strong> Full name and email address when you register an account. Passwords are salted, hashed, and managed through Supabase Auth.</li>
            <li><strong>Fellowship Communications:</strong> Private direct messages exchanged between verified members to support pastoral dialogue and departmental meetings.</li>
            <li><strong>Device Tokens & Preferences:</strong> Anonymous push notification tokens and preferences (notices, live broadcasts, messages) to deliver alerts you explicitly opt in to receive.</li>
            <li><strong>No Financial Credentials Stored:</strong> M-PESA paybill numbers (Paybill 247247, Account 802200) are displayed for voluntary religious tithes and offerings. We never request, process, or store your M-Pesa PIN, bank account numbers, or card details.</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>
            <span className="section-num">02</span> Purpose of Data Processing
          </h2>
          <p>All data collected is used strictly for church ministry operations:</p>
          <ul>
            <li>Delivering weekly bulletins, departmental plans, and pastoral communiqués.</li>
            <li>Alerting members to live-streamed Sunday church worship services when requested.</li>
            <li>Enabling verified members to message each other in a safe, moderated community environment.</li>
            <li>We do not sell, rent, monetize, or disclose your personal data to third-party advertisers or data brokers.</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>
            <span className="section-num">03</span> In-App & Web Account Deletion
          </h2>
          <p>
            In compliance with Apple App Store Guideline 5.1.1(v) and Google Play User Data policies, users have the absolute right to delete their account and all associated personal records at any time:
          </p>
          <div className="privacy-highlight-box">
            <h3>How to Delete Your Account:</h3>
            <ol>
              <li>
                <strong>In the Mobile App:</strong> Open the app, navigate to <em>More → Member Profile & Account</em>, and tap <strong>"Delete Account Permanently"</strong>.
              </li>
              <li>
                <strong>On the Web / Manual Request:</strong> Email our administrative office at <a href="mailto:support@aic-hola.org">support@aic-hola.org</a> with the subject line <em>"Account Deletion Request"</em> using your registered email address.
              </li>
            </ol>
            <p className="deletion-note">
              Upon account deletion, all active authentication sessions, display profiles, and associated direct messages are permanently purged from our active databases.
            </p>
          </div>
        </section>

        <section className="privacy-section">
          <h2>
            <span className="section-num">04</span> Security & Infrastructure
          </h2>
          <p>We employ high security standards to safeguard your data:</p>
          <ul>
            <li><strong>Encryption in Transit:</strong> All web and mobile app communications are transmitted exclusively over Transport Layer Security (TLS/HTTPS).</li>
            <li><strong>Row-Level Security (RLS):</strong> PostgreSQL database policies enforce access boundaries, ensuring member records are only readable by authorized accounts.</li>
            <li><strong>Third-Party Processors:</strong> We partner with trusted infrastructure providers (Supabase for encrypted database hosting, Google YouTube for video streaming, Apple APNs and Firebase Cloud Messaging for notifications).</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>
            <span className="section-num">05</span> Voluntary Tithes & Apple Guideline 3.2.2(iv) Disclosure
          </h2>
          <p>
            Voluntary religious tithes, offerings, and donations given through Lipa na M-PESA directly support the ministry, local community charity, and maintenance of the AIC Hola church. Contributions are entirely voluntary and do not unlock digital content, digital goods, or software features.
          </p>
        </section>

        <section className="privacy-section">
          <h2>
            <span className="section-num">06</span> Data Controller & Contact
          </h2>
          <p>For questions regarding this policy or to exercise your data protection rights under Kenyan law:</p>
          <div className="privacy-contact-card">
            <strong>Africa Inland Church (AIC) Hola</strong>
            <p>Church Office, P.O. Box 24-70101, Hola, Tana River County, Kenya</p>
            <p>Email: <a href="mailto:support@aic-hola.org">support@aic-hola.org</a> · <a href="mailto:contacts@aichola.org">contacts@aichola.org</a></p>
            <p>Phone: <a href="tel:+254727175730">+254 727 175 730</a></p>
          </div>
        </section>

        <div className="privacy-footer-action">
          <Link to="/" className="btn-primary">
            Return to Church Home
          </Link>
          <Link to="/contacts" className="btn-secondary">
            Contact Church Office
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Privacy;
