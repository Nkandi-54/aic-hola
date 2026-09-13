import React, { useState } from "react";
import CardArt from "../components/CardArt";
import MpesaGiving from "../components/MpesaGiving";
import "./Contacts.css";

const contact = { email: "contacts@aichola.org", phone: "+254727175730", maps: "https://goo.gl/maps/R3FJ7ECx7YXhuUu58" };

export default function Contacts() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!formData.name.trim()) nextErrors.name = "Please add your name.";
    if (!formData.email.trim()) nextErrors.email = "Please add your email.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) nextErrors.email = "Please enter a valid email address.";
    if (!formData.message.trim()) nextErrors.message = "Please write a message.";
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);
    const subject = encodeURIComponent(`Website message from ${formData.name}`);
    const body = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`);
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
  };
  return <div className="page-shell contacts-page"><header className="page-heading"><span className="eyebrow">We would love to hear from you</span><h1>Let’s stay connected.</h1><p>Reach out for inquiries, prayer, fellowship, or directions to AIC Hola.</p></header><section className="contact-layout"><aside className="contact-details"><CardArt kind="contact" accent="#efc886" /><div className="contact-details-body"><span className="eyebrow">Contact details</span><h2>Here for you.</h2><a href={`mailto:${contact.email}`}><i className="fa-solid fa-envelope" aria-hidden="true" /><span><strong>Email us</strong><small>{contact.email}</small></span></a><a href={`tel:${contact.phone}`}><i className="fa-solid fa-phone" aria-hidden="true" /><span><strong>Call us</strong><small>{contact.phone}</small></span></a><a href={contact.maps} target="_blank" rel="noopener noreferrer"><i className="fa-solid fa-location-dot" aria-hidden="true" /><span><strong>Find us</strong><small>Hola, Kenya</small></span></a><div className="contact-social"><a href="https://facebook.com/aichola" target="_blank" rel="noopener noreferrer" aria-label="AIC Hola on Facebook"><i className="fa-brands fa-facebook-f" /></a><a href="https://www.youtube.com/@nkandi242" target="_blank" rel="noopener noreferrer" aria-label="AIC Hola on YouTube"><i className="fa-brands fa-youtube" /></a></div><MpesaGiving variant="card" className="contact-mpesa" /></div></aside><section className="contact-form-card"><div><span className="eyebrow">Send a message</span><h2>We’ll reply as soon as we can.</h2><p>Your message will open in your email app, ready to send directly to our team.</p></div><form onSubmit={handleSubmit} noValidate><label>Your name<input name="name" value={formData.name} onChange={handleChange} autoComplete="name" aria-invalid={Boolean(errors.name)} />{errors.name && <small>{errors.name}</small>}</label><label>Email address<input type="email" name="email" value={formData.email} onChange={handleChange} autoComplete="email" aria-invalid={Boolean(errors.email)} />{errors.email && <small>{errors.email}</small>}</label><label>Your message<textarea name="message" value={formData.message} onChange={handleChange} rows="5" aria-invalid={Boolean(errors.message)} />{errors.message && <small>{errors.message}</small>}</label><button className="button" type="submit">Continue to email <span aria-hidden="true">→</span></button></form></section></section></div>;
}
