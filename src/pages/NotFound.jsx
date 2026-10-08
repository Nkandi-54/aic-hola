import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page-shell">
      <section className="panel gate-card not-found-card">
        <span className="badge">404</span>
        <h1 className="panel-title">This page has wandered off.</h1>
        <p className="panel-sub">
          The page you were looking for is not available, but there is always a
          way back to the AIC Hola church.
        </p>
        <Link className="button forest" to="/">Return home</Link>
      </section>
    </div>
  );
}
