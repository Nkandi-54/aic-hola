import React, { createContext, useContext, useState, useCallback } from "react";

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const [activeTrack, setActiveTrack] = useState(null);

  const playTrack = useCallback((track) => {
    if (!track || !track.src) return;
    setActiveTrack({
      id: track.id || track.src,
      title: track.title || "Worship Audio",
      subtitle: track.subtitle || track.preacher || "AIC Hola Pulpit",
      src: track.src,
      isLive: Boolean(track.isLive),
    });
  }, []);

  const stopTrack = useCallback(() => {
    setActiveTrack(null);
  }, []);

  return (
    <AudioContext.Provider value={{ activeTrack, playTrack, stopTrack }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    return {
      activeTrack: null,
      playTrack: () => {},
      stopTrack: () => {},
    };
  }
  return context;
}

