import React from "react";
import "./CardArt.css";

/**
 * Hand-drawn, layered SVG illustrations that sit behind a card's content so
 * each topic reads as a scene rather than a lone icon.
 *
 * `kind` picks the illustration. Everything is drawn with the card accent and
 * the shared luxury palette, so a single component covers the whole site.
 */
export default function CardArt({ kind = "default", accent = "#dFb86a" }) {
  const common = {
    className: "card-art",
    viewBox: "0 0 220 150",
    "aria-hidden": "true",
    role: "presentation",
  };

  switch (kind) {
    // History: a tilted vintage newspaper with a clock and hands.
    case "history":
      return (
        <svg {...common}>
          <g className="art-float">
            <g transform="rotate(-8 110 78)">
              <rect
                x="34"
                y="34"
                width="150"
                height="92"
                rx="6"
                fill="#f4ead6"
                stroke="#c9b48c"
                strokeWidth="2"
              />
              <rect
                x="34"
                y="34"
                width="150"
                height="20"
                rx="6"
                fill={accent}
                opacity="0.85"
              />
              <text
                x="110"
                y="49"
                textAnchor="middle"
                fontFamily="Georgia, serif"
                fontSize="12"
                fontWeight="700"
                fill="#3a2a17"
              >
                THE HOLA HERALD
              </text>
              <rect x="46" y="64" width="90" height="6" rx="3" fill="#8a7a5c" />
              <rect
                x="46"
                y="76"
                width="120"
                height="4"
                rx="2"
                fill="#b7a883"
              />
              <rect
                x="46"
                y="85"
                width="120"
                height="4"
                rx="2"
                fill="#b7a883"
              />
              <rect x="46" y="94" width="74" height="4" rx="2" fill="#b7a883" />
              <rect
                x="46"
                y="104"
                width="96"
                height="4"
                rx="2"
                fill="#b7a883"
              />
              <rect
                x="46"
                y="114"
                width="58"
                height="4"
                rx="2"
                fill="#b7a883"
              />
              <g transform="translate(150 96)">
                <circle r="22" fill="#fffdf8" stroke={accent} strokeWidth="3" />
                <circle
                  r="22"
                  fill="none"
                  stroke="#3a2a17"
                  strokeWidth="1"
                  opacity="0.35"
                />
                <line
                  className="clock-hand-hour"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="-11"
                  stroke="#3a2a17"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <line
                  className="clock-hand-minute"
                  x1="0"
                  y1="0"
                  x2="12"
                  y2="4"
                  stroke={accent}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle r="2.5" fill="#3a2a17" />
              </g>
            </g>
          </g>
        </svg>
      );

    // Choirs: layered music staff, notes, and raised singing voices.
    case "choir":
      return (
        <svg {...common}>
          <g className="art-float">
            {[58, 66, 74, 82, 90].map((y) => (
              <rect
                key={y}
                x="26"
                y={y}
                width="168"
                height="2"
                rx="1"
                fill={accent}
                opacity="0.5"
              />
            ))}
            <g fill={accent}>
              <circle cx="70" cy="80" r="7" />
              <rect x="75" y="52" width="3" height="30" rx="1.5" />
              <path d="M78 52 q16 4 22 12 l0 8 q-8 -8 -22 -6 z" />
              <circle cx="126" cy="72" r="6" />
              <rect x="130" y="48" width="3" height="26" rx="1.5" />
              <path d="M133 48 q14 4 19 11 l0 7 q-7 -7 -19 -5 z" />
            </g>
            <g fill="#6b5b3e" opacity="0.75">
              <circle cx="54" cy="118" r="6" />
              <path d="M46 132 q8 -12 16 0 z" />
              <circle cx="110" cy="122" r="7" />
              <path d="M101 138 q9 -14 18 0 z" />
              <circle cx="164" cy="118" r="6" />
              <path d="M156 132 q8 -12 16 0 z" />
            </g>
          </g>
        </svg>
      );

    // Sermons: an open Bible with light rays and a bookmark.
    case "sermon":
      return (
        <svg {...common}>
          <g className="art-rays" transform="translate(110 60)">
            {[-38, -20, 0, 20, 38].map((a) => (
              <rect
                key={a}
                x="-2"
                y="-58"
                width="4"
                height="30"
                rx="2"
                fill={accent}
                opacity="0.6"
                transform={`rotate(${a})`}
              />
            ))}
          </g>
          <g className="art-float">
            <path
              d="M40 62 q34 -14 68 0 l0 62 q-34 -14 -68 0 z"
              fill="#fffdf8"
              stroke="#c9b48c"
              strokeWidth="2"
            />
            <path
              d="M176 62 q-34 -14 -68 0 l0 62 q34 -14 68 0 z"
              fill="#fffdf8"
              stroke="#c9b48c"
              strokeWidth="2"
            />
            <path d="M108 62 l0 62" stroke="#c9b48c" strokeWidth="2" />
            <g stroke="#b7a883" strokeWidth="3" strokeLinecap="round">
              <line x1="58" y1="80" x2="94" y2="74" />
              <line x1="58" y1="92" x2="94" y2="86" />
              <line x1="58" y1="104" x2="86" y2="99" />
              <line x1="122" y1="74" x2="158" y2="80" />
              <line x1="122" y1="86" x2="158" y2="92" />
              <line x1="122" y1="99" x2="150" y2="104" />
            </g>
            <path d="M98 60 l8 0 l0 26 l-4 -6 l-4 6 z" fill={accent} />
          </g>
        </svg>
      );

    // Live: a broadcast tower sending signal arcs over a play badge.
    case "live":
      return (
        <svg {...common}>
          <g className="art-float">
            <g
              stroke={accent}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              className="art-signal"
            >
              <path d="M150 40 q18 26 0 52" />
              <path d="M164 28 q30 40 0 76" opacity="0.6" />
            </g>
            <line
              x1="96"
              y1="44"
              x2="96"
              y2="120"
              stroke="#3a2a17"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <line
              x1="96"
              y1="52"
              x2="78"
              y2="112"
              stroke="#3a2a17"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="96"
              y1="52"
              x2="114"
              y2="112"
              stroke="#3a2a17"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="96" cy="40" r="6" fill={accent} className="art-pulse" />
            <circle
              cx="46"
              cy="96"
              r="24"
              fill="#fffdf8"
              stroke={accent}
              strokeWidth="3"
            />
            <path d="M40 85 l16 11 l-16 11 z" fill="#3a2a17" />
            <rect
              x="30"
              y="128"
              width="132"
              height="4"
              rx="2"
              fill="#b7a883"
              opacity="0.5"
            />
          </g>
        </svg>
      );

    // Contacts: an envelope with a location pin and heartbeat pulse.
    case "contact":
      return (
        <svg {...common}>
          <g className="art-float">
            <rect
              x="34"
              y="52"
              width="132"
              height="84"
              rx="10"
              fill="#fffdf8"
              stroke="#c9b48c"
              strokeWidth="2"
            />
            <path
              d="M34 62 l66 40 l66 -40"
              fill="none"
              stroke={accent}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="M34 134 l46 -38 M166 134 l-46 -38"
              fill="none"
              stroke="#c9b48c"
              strokeWidth="2"
              opacity="0.7"
            />
            <g transform="translate(158 44)">
              <path
                d="M0 -26 C16 -26 22 -14 22 -4 C22 12 0 30 0 30 C0 30 -22 12 -22 -4 C-22 -14 -16 -26 0 -26 Z"
                fill={accent}
              />
              <circle cx="0" cy="-4" r="8" fill="#fffdf8" />
            </g>
            <path
              className="art-pulse-line"
              d="M58 42 h18 l6 -10 l7 20 l6 -12 h30"
              fill="none"
              stroke="#b7532f"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      );

    // Gallery: stacked polaroid photos.
    case "gallery":
      return (
        <svg {...common}>
          <g className="art-float">
            <g transform="rotate(-9 96 86)">
              <rect
                x="52"
                y="42"
                width="78"
                height="86"
                rx="6"
                fill="#fffdf8"
                stroke="#c9b48c"
                strokeWidth="2"
              />
              <rect
                x="60"
                y="50"
                width="62"
                height="52"
                rx="3"
                fill={accent}
                opacity="0.75"
              />
              <path
                d="M60 102 l20 -22 l14 15 l10 -10 l18 17 z"
                fill="#3a2a17"
                opacity="0.55"
              />
            </g>
            <g transform="rotate(10 130 92)">
              <rect
                x="98"
                y="52"
                width="76"
                height="84"
                rx="6"
                fill="#fffdf8"
                stroke="#c9b48c"
                strokeWidth="2"
              />
              <rect
                x="106"
                y="60"
                width="60"
                height="50"
                rx="3"
                fill={accent}
                opacity="0.5"
              />
              <circle cx="136" cy="80" r="10" fill="#f4ead6" />
            </g>
          </g>
        </svg>
      );

    // Community / welcome: two figures with hands joined under an arch.
    case "community":
      return (
        <svg {...common}>
          <g className="art-float">
            <path
              d="M40 120 a70 70 0 0 1 140 0"
              fill="none"
              stroke={accent}
              strokeWidth="4"
              opacity="0.6"
            />
            <g fill="#3a2a17" opacity="0.85">
              <circle cx="92" cy="70" r="13" />
              <path d="M72 120 q0 -28 20 -28 q20 0 20 28 z" />
            </g>
            <g fill={accent}>
              <circle cx="128" cy="70" r="13" />
              <path d="M108 120 q0 -28 20 -28 q20 0 20 28 z" />
            </g>
            <path
              d="M110 112 q0 -18 0 -18"
              stroke="#3a2a17"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <g className="art-float">
            <circle
              cx="110"
              cy="74"
              r="42"
              fill="none"
              stroke={accent}
              strokeWidth="3"
              opacity="0.7"
            />
            <circle cx="110" cy="74" r="24" fill={accent} opacity="0.35" />
          </g>
        </svg>
      );
  }
}
