import React from "react";
import "./LiveBadge.css";

export default function LiveBadge({ isLive }) {
  if (!isLive) return null;

  return (
    <span className="live-badge" title="Live now">
      <span className="live-dot" />
      LIVE
    </span>
  );
}
