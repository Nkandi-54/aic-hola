import React, { useState } from "react";
import CardArt from "../components/CardArt";
import MpesaGiving from "../components/MpesaGiving";
import "./Contacts.css";

const contactInfo = {
  email: "contacts@aichola.org",
  phone: "+254 727 175 730",
  altPhone: "+254 700 000 000",
  postal: "P.O. Box 24 – 70101, Hola, Kenya",
  location: "AIC Hola Church, Hola Town, Tana River County, Kenya",
  maps: "https://maps.google.com/?q=AIC+Hola+Church",
  landmarks: "Centrally located in Hola Town, adjacent to Hola Primary & near County Administrative Offices.",
};

const officeHours = [
  { days: "Monday – Friday", hours: "8:00 AM – 5:00 PM", note: "Pastoral & Church Office" },
  { days: "Saturdays", hours: "9:00 AM – 4:00 PM", note: "Ministry Counseling & Rehearsals" },
  { days: "Sundays", hours: "7:30 AM – 1:30 PM", note: "Church Gatherings" },
];

export default function Contacts() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "General Inquiry",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!formData.name.trim()) nextErrors.name = "Please enter your name.";
    if (!formData.email.trim() && !formData.phone.trim()) {
      nextErrors.email = "Please provide an email or phone number.";
    } else if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (!formData.message.trim()) nextErrors.message = "Please write your message.";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSubmitted(true);
  };

  const sendViaEmailClient = () => {
    const subject = encodeURIComponent(`[${formData.department}] Message from ${formData.name}`);
    const body = encodeURIComponent(
      `From: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nCategory: ${formData.department}\n\nMessage:\n${formData.message}`
    );
    window.location.href = `mailto:${contactInfo.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="page-shell contacts-page">
      <header className="page-heading">
        <span className="eyebrow">Pastoral Care &amp; Office Inquiries</span>
        <h1>We are here for you.</h1>
        <p>Reach out for prayer, pastoral counseling, directions to our church, or church office inquiries.</p>
      </header>

      {/* Main Grid: Details Aside + Interactive Contact Card */}
      <section className="contact-layout">
        <aside className="contact-details">
          <CardArt kind="contact" accent="#efc886" />
          <div className="contact-details-body">
            <span className="eyebrow">Direct Contact</span>
            <h2>Church Office</h2>

            <a href={`tel:${contactInfo.phone}`}>
              <i className="fa-solid fa-phone" aria-hidden="true" />
              <span>
                <strong>Call Us</strong>
                <small>{contactInfo.phone}</small>
              </span>
            </a>

            <a href={`mailto:${contactInfo.email}`}>
              <i className="fa-solid fa-envelope" aria-hidden="true" />
              <span>
                <strong>Email Us</strong>
                <small>{contactInfo.email}</small>
              </span>
            </a>

            <a href={contactInfo.maps} target="_blank" rel="noopener noreferrer">
              <i className="fa-solid fa-location-dot" aria-hidden="true" />
              <span>
                <strong>Church Location</strong>
                <small>Hola, Tana River County</small>
              </span>
            </a>

            <div className="contact-postal-badge">
              <i className="fa-solid fa-mailbox" aria-hidden="true" />
              <span>{contactInfo.postal}</span>
            </div>

            <div className="contact-social">
              <a href="https://facebook.com/aichola" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i className="fa-brands fa-facebook-f" />
              </a>
              <a href="https://www.youtube.com/@nkandi242" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <i className="fa-brands fa-youtube" />
              </a>
            </div>

            <MpesaGiving variant="card" className="contact-mpesa" />
          </div>
        </aside>

        {/* Message Form / Submitted Confirmation Card */}
        <section className="contact-form-card">
          {submitted ? (
            <div className="contact-submitted-state">
              <div className="contact-submitted-icon" aria-hidden="true">
                <i className="fa-solid fa-circle-check" />
              </div>
              <h2>Message Received</h2>
              <p>
                Thank you, <strong>{formData.name}</strong>. Your message regarding <strong>{formData.department}</strong> has been logged. Our pastoral or administrative team will get in touch with you shortly.
              </p>
              <div className="contact-submitted-actions">
                <button
                  type="button"
                  className="button gold"
                  onClick={sendViaEmailClient}
                >
                  <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" /> Also Open in Email App
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: "", email: "", phone: "", department: "General Inquiry", message: "" });
                  }}
                >
                  Send Another Message
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div>
                <span className="eyebrow">Send a Note</span>
                <h2>How can we assist you?</h2>
                <p>Send a note directly to our church leadership, pastoral team, or secretary.</p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="contact-form-row">
                  <label>
                    Your Name *
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. John Baraka"
                      aria-invalid={Boolean(errors.name)}
                    />
                    {errors.name && <small className="form-error">{errors.name}</small>}
                  </label>

                  <label>
                    Department / Topic
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                    >
                      <option value="General Inquiry">General Church Inquiry</option>
                      <option value="Pastoral Care">Pastoral Care &amp; Prayer</option>
                      <option value="Church Secretary">Church Secretary / Membership</option>
                      <option value="Church Treasurer">Treasury &amp; Giving Support</option>
                      <option value="Choir Ministry">Choir &amp; Worship Ministry</option>
                      <option value="Youth Ministry">Youth &amp; Sunday School</option>
                    </select>
                  </label>
                </div>

                <div className="contact-form-row">
                  <label>
                    Email Address
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. baraka@example.com"
                      aria-invalid={Boolean(errors.email)}
                    />
                    {errors.email && <small className="form-error">{errors.email}</small>}
                  </label>

                  <label>
                    Phone Number
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. 0712 345 678"
                    />
                  </label>
                </div>

                <label>
                  Your Message *
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    placeholder="Write your message, prayer need, or inquiry here..."
                    aria-invalid={Boolean(errors.message)}
                  />
                  {errors.message && <small className="form-error">{errors.message}</small>}
                </label>

                <div className="contact-form-submit-row">
                  <button className="button gold" type="submit">
                    <i className="fa-solid fa-paper-plane" aria-hidden="true" /> Send Message
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={sendViaEmailClient}
                  >
                    Open in Mail App <span aria-hidden="true">&rarr;</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      </section>

      {/* Office Hours & Physical Landmark Guidance Section */}
      <section className="contact-info-grid">
        <div className="contact-info-card">
          <div className="info-card-icon" aria-hidden="true">
            <i className="fa-regular fa-clock" />
          </div>
          <h3>Church Office Hours</h3>
          <ul className="office-hours-list">
            {officeHours.map((oh) => (
              <li key={oh.days}>
                <strong>{oh.days}</strong>
                <span>{oh.hours}</span>
                <small>{oh.note}</small>
              </li>
            ))}
          </ul>
        </div>

        <div className="contact-info-card">
          <div className="info-card-icon" aria-hidden="true">
            <i className="fa-solid fa-compass" />
          </div>
          <h3>Church Directions</h3>
          <p className="landmark-text">{contactInfo.landmarks}</p>
          <div className="landmark-address-pill">
            <i className="fa-solid fa-location-pin" aria-hidden="true" />
            <span>{contactInfo.location}</span>
          </div>
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=AIC+Hola+Church+Hola+Kenya"
            target="_blank"
            rel="noopener noreferrer"
            className="button secondary sm map-external-btn"
          >
            <i className="fa-solid fa-diamond-turn-right" aria-hidden="true" /> Get Driving & Walking Route
          </a>
        </div>
      </section>

      {/* Interactive Church Compound Map & GPS Guide */}
      <section className="contact-map-section" aria-label="Interactive Church Map">
        <div className="contact-map-card">
          <div className="contact-map-header">
            <div>
              <span className="contact-map-kicker">Interactive Compound Guide</span>
              <h3 className="contact-map-title">Church Location & Campus Map</h3>
              <p className="contact-map-desc">
                Centrally located in Hola Town, Tana River County. Secure perimeter parking and barrier-free access available for all worshippers.
              </p>
            </div>
            <div className="contact-map-quick-actions">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=AIC+Hola+Church+Hola+Kenya"
                target="_blank"
                rel="noopener noreferrer"
                className="button primary sm"
              >
                <i className="fa-solid fa-diamond-turn-right" aria-hidden="true" /> Open GPS Navigation
              </a>
            </div>
          </div>

          <div className="contact-map-frame-wrapper">
            <iframe
              title="AIC Hola Church Compound Map"
              src="https://maps.google.com/maps?q=AIC+Hola+Church,+Hola+Town,+Kenya&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className="contact-map-iframe"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="contact-map-badge">
              <i className="fa-solid fa-church" aria-hidden="true" />
              <div>
                <strong>AIC Hola Main Church</strong>
                <span>Hola Town Centre · Tana River County</span>
              </div>
            </div>
          </div>

          <div className="contact-map-features-grid">
            <div className="map-feature-item">
              <div className="map-feature-icon">
                <i className="fa-solid fa-square-parking" aria-hidden="true" />
              </div>
              <div>
                <strong>Secure Compound Parking</strong>
                <p>Dedicated on-site parking for vehicles, vans, and motorbikes with church wardens.</p>
              </div>
            </div>
            <div className="map-feature-item">
              <div className="map-feature-icon">
                <i className="fa-solid fa-wheelchair" aria-hidden="true" />
              </div>
              <div>
                <strong>Accessibility & Ramps</strong>
                <p>Step-free church doors, paved rampways, and reserved front seating for seniors.</p>
              </div>
            </div>
            <div className="map-feature-item">
              <div className="map-feature-icon">
                <i className="fa-solid fa-bus-simple" aria-hidden="true" />
              </div>
              <div>
                <strong>Public Transit Access</strong>
                <p>3-minute walk from the main Hola Matatu Stage & County Commissioner roundabout.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
