import React, { useRef, useState, useEffect, useCallback } from "react";
import { useAudio } from "../context/AudioContext";
import "./GlobalAudioDock.css";

const formatTime = (secs) => {
  if (!Number.isFinite(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export default function GlobalAudioDock() {
  const { activeTrack, stopTrack } = useAudio();
  const audioRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);

  // When track changes, load and autoplay
  useEffect(() => {
    if (!activeTrack) {
      setPlaying(false);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    setLoading(true);
    audio.load();

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setPlaying(true);
          setLoading(false);
        })
        .catch(() => {
          setPlaying(false);
          setLoading(false);
        });
    }
  }, [activeTrack]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [playing]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
      setCurrent(audio.currentTime);
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextTime = Number(e.target.value);
    audio.currentTime = nextTime;
    setCurrent(nextTime);
  };

  const handleSkip = (delta) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration || 9999, audio.currentTime + delta));
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !muted;
    setMuted(!muted);
  };

  if (!activeTrack) return null;

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <aside className="global-audio-dock" aria-label="Audio Playback Bar">
      <audio
        ref={audioRef}
        src={activeTrack.src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          setLoading(false);
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={stopTrack}
      />

      <div className="gad-content">
        {/* Track Metadata */}
        <div className="gad-meta">
          <div className={`gad-icon-box ${playing ? "is-playing" : ""}`}>
            <i className="fa-solid fa-headphones" aria-hidden="true" />
          </div>
          <div className="gad-info">
            <span className="gad-badge">
              <span className="gad-pulse" /> AIC Audio Stream · HD
            </span>
            <strong className="gad-title" title={activeTrack.title}>
              {activeTrack.title}
            </strong>
            <small className="gad-subtitle">{activeTrack.subtitle}</small>
          </div>
        </div>

        {/* Playback Controls & Progress */}
        <div className="gad-controls">
          <div className="gad-buttons">
            <button
              type="button"
              className="gad-btn gad-btn-skip"
              onClick={() => handleSkip(-10)}
              aria-label="Rewind 10 seconds"
              title="Rewind 10s"
            >
              <i className="fa-solid fa-rotate-left" />
            </button>

            <button
              type="button"
              className="gad-btn gad-btn-play"
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
              title={playing ? "Pause" : "Play"}
            >
              {loading ? (
                <i className="fa-solid fa-circle-notch fa-spin" />
              ) : playing ? (
                <i className="fa-solid fa-pause" />
              ) : (
                <i className="fa-solid fa-play" />
              )}
            </button>

            <button
              type="button"
              className="gad-btn gad-btn-skip"
              onClick={() => handleSkip(10)}
              aria-label="Fast forward 10 seconds"
              title="Forward 10s"
            >
              <i className="fa-solid fa-rotate-right" />
            </button>
          </div>

          <div className="gad-timeline">
            <span className="gad-time">{formatTime(current)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.5"
              value={current}
              onChange={handleSeek}
              className="gad-seek"
              style={{ "--progress": `${progress}%` }}
              aria-label="Seek audio"
            />
            <span className="gad-time">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Close */}
        <div className="gad-actions">
          <button
            type="button"
            className="gad-btn-ghost"
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            title={muted ? "Unmute" : "Mute"}
          >
            <i className={`fa-solid ${muted ? "fa-volume-xmark" : "fa-volume-high"}`} />
          </button>

          <button
            type="button"
            className="gad-btn-close"
            onClick={stopTrack}
            aria-label="Close audio player"
            title="Dismiss player"
          >
            ✕
          </button>
        </div>
      </div>
    </aside>
  );
}

