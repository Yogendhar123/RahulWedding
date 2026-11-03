import { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { weddingDetails } from '../config/weddingDetails';

export default function AmbientMusic() {
  const [playing, setPlaying] = useState(false), [message, setMessage] = useState('');
  const audioRef = useRef(null), contextRef = useRef(null), nodesRef = useRef([]);
  const desiredRef = useRef(true), mountedRef = useRef(false);
  const stop = useCallback(() => {
    audioRef.current?.pause();
    if (contextRef.current?.state === 'running') contextRef.current.suspend().catch(() => {});
    setPlaying(false);
  }, []);
  const start = useCallback(async () => {
    if (!desiredRef.current || document.hidden) return;
    if (weddingDetails.media.music ? audioRef.current && !audioRef.current.paused : contextRef.current?.state === 'running') return;
    setMessage('If autoplay is blocked, music will start when you interact with the invitation.');
    try {
      if (weddingDetails.media.music) {
        audioRef.current ??= new Audio(weddingDetails.media.music);
        const audio = audioRef.current;
        audio.loop = true; audio.volume = 0.25;
        await audio.play();
        if (!mountedRef.current || audio !== audioRef.current) return;
        if (!desiredRef.current || document.hidden) { audio.pause(); return; }
        setPlaying(true); setMessage('');
      } else {
        // A quiet, original tanpura-inspired drone. No unlicensed music files.
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) throw new Error('Audio unavailable');
        if (!contextRef.current) {
          const ctx = contextRef.current = new AudioContext();
          // A suspended context is not playing. Autoplay may leave resume()
          // pending until a gesture; statechange keeps the toggle truthful.
          ctx.onstatechange = () => {
            if (!mountedRef.current || contextRef.current !== ctx) return;
            const active = ctx.state === 'running' && desiredRef.current && !document.hidden;
            setPlaying(active);
            if (active) setMessage('');
          };
          const master = ctx.createGain(); master.gain.value = 0.032; master.connect(ctx.destination);
          [130.81, 196, 261.63, 392].forEach((frequency, i) => {
            const oscillator = ctx.createOscillator(), gain = ctx.createGain();
            oscillator.type = 'sine'; oscillator.frequency.value = frequency; oscillator.detune.value = i % 2 ? 3 : -3;
            gain.gain.value = 1 / (i + 2); oscillator.connect(gain); gain.connect(master); oscillator.start(); nodesRef.current.push(oscillator);
          });
        }
        const ctx = contextRef.current;
        await ctx.resume();
        if (!mountedRef.current || ctx !== contextRef.current) return;
        if (!desiredRef.current || document.hidden) { ctx.suspend().catch(() => {}); return; }
        setPlaying(ctx.state === 'running');
        if (ctx.state === 'running') setMessage('');
      }
    } catch (error) {
      if (!mountedRef.current) return;
      setPlaying(false);
      setMessage(error.name === 'NotAllowedError' ? 'Music will start when you interact with the invitation.' : 'Audio is unavailable in this browser.');
    }
  }, []);
  useEffect(() => {
    mountedRef.current = true;
    start();
    const interact = (event) => {
      // Let the music button handle its own intent, including explicit mute.
      if (event.target instanceof Element && event.target.closest('.music-button')) return;
      if (desiredRef.current) start();
    };
    const visibility = () => { if (document.hidden) stop(); else if (desiredRef.current) start(); };
    document.addEventListener('pointerdown', interact);
    document.addEventListener('keydown', interact);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      mountedRef.current = false;
      document.removeEventListener('pointerdown', interact);
      document.removeEventListener('keydown', interact);
      document.removeEventListener('visibilitychange', visibility);
      audioRef.current?.pause(); audioRef.current = null;
      nodesRef.current.forEach(n => { try { n.stop(); } catch { /* already stopped */ } }); nodesRef.current = [];
      if (contextRef.current) { contextRef.current.onstatechange = null; contextRef.current.close().catch(() => {}); contextRef.current = null; }
    };
  }, [start, stop]);
  function toggle() {
    if (playing) { desiredRef.current = false; stop(); setMessage('Music muted.'); }
    else { desiredRef.current = true; start(); }
  }
  return <><button className={`music-button ${playing ? 'playing' : ''}`} onClick={toggle} aria-label={playing ? 'Pause background music' : 'Play background music'} aria-pressed={playing}>{playing ? <Volume2 size={16}/> : <VolumeX size={16}/>}<span>Music {playing ? 'on' : 'off'}</span></button><span className="sr-only" role="status">{message}</span></>;
}