"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MusicTrack = { src: string; title: string; startAtSec: number } | null;

export type MusicController = {
  available: boolean;
  playing: boolean;
  title: string | null;
  /** Must be called from a user gesture the first time (browser autoplay policy). */
  play: () => void;
  pause: () => void;
  toggle: () => void;
};

const PREF_KEY = "vs:music-off";
const FADE_MS = 1500;

function readPref(): boolean {
  try {
    return sessionStorage.getItem(PREF_KEY) === "1";
  } catch {
    return false;
  }
}
function writePref(off: boolean) {
  try {
    if (off) sessionStorage.setItem(PREF_KEY, "1");
    else sessionStorage.removeItem(PREF_KEY);
  } catch {
    /* storage unavailable */
  }
}

/**
 * Background music: lazily creates the <audio> element on first play (so nothing downloads
 * before the guest opens the invitation), fades in, loops, pauses when the tab is hidden.
 */
export function useMusicController(track: MusicTrack): MusicController {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<number | null>(null);
  const resumeOnVisible = useRef(false);
  const [playing, setPlaying] = useState(false);

  const fadeTo = useCallback((target: number, ms: number, done?: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fadeRef.current) cancelAnimationFrame(fadeRef.current);
    const from = audio.volume;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      audio.volume = Math.max(0, Math.min(1, from + (target - from) * t));
      if (t < 1) fadeRef.current = requestAnimationFrame(tick);
      else done?.();
    };
    fadeRef.current = requestAnimationFrame(tick);
  }, []);

  const play = useCallback(() => {
    if (!track) return;
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio(track.src);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0;
      if (track.startAtSec) audio.currentTime = track.startAtSec;
      audioRef.current = audio;
    }
    writePref(false);
    const p = audio.play();
    const onPlaying = () => {
      setPlaying(true);
      fadeTo(0.85, FADE_MS);
    };
    if (p && typeof p.then === "function") p.then(onPlaying).catch(() => setPlaying(false));
    else onPlaying();
  }, [track, fadeTo]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    setPlaying(false);
    writePref(true);
    if (!audio) return;
    fadeTo(0, 250, () => audio.pause());
  }, [fadeTo]);

  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play]);

  useEffect(() => {
    const onVisibility = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden && !audio.paused) {
        resumeOnVisible.current = true;
        audio.pause();
      } else if (!document.hidden && resumeOnVisible.current) {
        resumeOnVisible.current = false;
        audio.play().catch(() => setPlaying(false));
      }
    };
    const onFilm = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        audio.pause();
        setPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("vs:media-play", onFilm);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("vs:media-play", onFilm);
      if (fadeRef.current) cancelAnimationFrame(fadeRef.current);
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return { available: Boolean(track), playing, title: track?.title ?? null, play, pause, toggle };
}

/** Whether the guest switched music off earlier in this session. */
export function musicPreferenceOff(): boolean {
  return readPref();
}
