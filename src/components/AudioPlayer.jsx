import React, { useCallback, useEffect, useRef, useState } from "react";
import "./AudioPlayer.css";

/**
 * High-quality worship audio player.
 *
 * - HD audio: streams the source at full fidelity, no re-encoding.
 * - Play / pause, ±10s skip, draggable seek bar, volume with mute.
 * - Keyboard friendly: space toggles, arrows skip, up/down change volume.
 * - `autoPlay` attempts to start playback as soon as a track is available —
 *   used on the Live page so a live broadcast begins without a tap. Browsers
 *   block un-muted autoplay until the visitor has interacted, so if the first
 *   attempt is rejected we surface a one-tap "Play" affordance rather than
 *   failing silently.
 */
const SKIP_SECONDS = 10;

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  const hrs = Math.floor(mins / 60);

  if (hrs > 0) {
    return `${hrs}:${String(mins % 60).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

export default function AudioPlayer({
  src,
  title = "Worship audio",
  subtitle = "",
  isLive = false,
  autoPlay = false,
  onEnded,
}) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [error, setError] = useState("");

  // Attempt autoplay. A rejected promise means the browser wants a gesture.
  const attemptAutoplay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !autoPlay) return;
    try {
      await audio.play();
      setAutoplayBlocked(false);
    } catch {
      setAutoplayBlocked(true);
    }
  }, [autoPlay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // Reset transport state whenever the source changes, then autoplay if asked.
  useEffect(() => {
    setCurrent(0);
    setDuration(0);
    setReady(false);
    setPlaying(false);
    setError("");
    setAutoplayBlocked(false);
  }, [src]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
        setAutoplayBlocked(false);
      } catch {
        setError("Playback could not start. Please tap play again.");
      }
    } else {
      audio.pause();
    }
  }, []);

  const skip = useCallback(
    (delta) => {
      const audio = audioRef.current;
      if (!audio || !Number.isFinite(audio.duration)) return;
      audio.currentTime = Math.min(
        Math.max(0, audio.currentTime + delta),
        audio.duration,
      );
    },
    [],
  );

  const seek = (event) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(duration) || duration === 0) return;
    const next = Number(event.target.value);
    audio.currentTime = next;
    setCurrent(next);
  };

  const onKeyDown = (event) => {
    if (event.code === "Space" || event.key === "Spacebar") {
      event.preventDefault();
      void togglePlay();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      skip(-SKIP_SECONDS);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      skip(SKIP_SECONDS);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setVolume((v) => Math.min(1, Number((v + 0.05).toFixed(2))));
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setVolume((v) => Math.max(0, Number((v - 0.05).toFixed(2))));
    }
  };

  if (!src) return null;

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <section
      className={`audio-player${isLive ? " is-live" : ""}`}
      aria-label={`${title} audio player`}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        crossOrigin="anonymous"
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration || 0);
          setReady(true);
          void attemptAutoplay();
        }}
        onCanPlay={() => void attemptAutoplay()}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          onEnded?.();
        }}
        onError={() =>
          setError("This recording could not be loaded. Please try again later.")
        }
      />

      <div className="audio-player-head">
        <div className="audio-player-art" aria-hidden="true">
          <i className={`fa-solid ${isLive ? "fa-tower-broadcast" : "fa-music"}`} />
        </div>

        <div className="audio-player-meta">
          <span className="audio-player-eyebrow">
            {isLive ? (
              <>
                <span className="audio-player-live-dot" /> LIVE AUDIO · HD
              </>
            ) : (
              "WORSHIP AUDIO · HD"
            )}
          </span>

          <strong className="audio-player-title">{title}</strong>

          {subtitle ? (
            <small className="audio-player-subtitle">{subtitle}</small>
          ) : null}
        </div>
      </div>

      <div className="audio-player-transport">
        <button
          className="audio-button"
          type="button"
          onClick={() => skip(-SKIP_SECONDS)}
          aria-label={`Rewind ${SKIP_SECONDS} seconds`}
          disabled={!ready}
        >
          <i className="fa-solid fa-rotate-left" aria-hidden="true" />
        </button>

        <button
          className="audio-button audio-button-primary"
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          disabled={!ready}
        >
          <i
            className={`fa-solid ${playing ? "fa-pause" : "fa-play"}`}
            aria-hidden="true"
          />
        </button>

        <button
          className="audio-button"
          type="button"
          onClick={() => skip(SKIP_SECONDS)}
          aria-label={`Forward ${SKIP_SECONDS} seconds`}
          disabled={!ready}
        >
          <i className="fa-solid fa-rotate-right" aria-hidden="true" />
        </button>
      </div>

      <div className="audio-player-timeline">
        <span className="audio-time">{formatTime(current)}</span>

        <input
          className="audio-seek"
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={current}
          onChange={seek}
          disabled={!ready || isLive}
          style={{ "--audio-progress": `${progress}%` }}
          aria-label="Seek"
        />

        <span className="audio-time">
          {isLive ? "LIVE" : formatTime(duration)}
        </span>
      </div>

      <div className="audio-player-volume">
        <button
          className="audio-button audio-button-small"
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          <i
            className={`fa-solid ${
              muted || volume === 0
                ? "fa-volume-xmark"
                : volume < 0.5
                  ? "fa-volume-low"
                  : "fa-volume-high"
            }`}
            aria-hidden="true"
          />
        </button>

        <input
          className="audio-volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={muted ? 0 : volume}
          onChange={(event) => {
            setVolume(Number(event.target.value));
            setMuted(Number(event.target.value) === 0);
          }}
          style={{ "--audio-progress": `${(muted ? 0 : volume) * 100}%` }}
          aria-label="Volume"
        />
      </div>

      {autoplayBlocked && !playing ? (
        <p className="audio-player-note" role="status">
          <button className="text-link" type="button" onClick={togglePlay}>
            Tap to start the live audio
          </button>
        </p>
      ) : null}

      {error ? (
        <p className="audio-player-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
