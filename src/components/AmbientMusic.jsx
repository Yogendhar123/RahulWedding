import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { weddingDetails } from '../config/weddingDetails';

export default function AmbientMusic() {
  const [playing, setPlaying] = useState(false), [message, setMessage] = useState('');
  const audioRef = useRef(null), contextRef = useRef(null), nodesRef = useRef([]);
  const stop = () => { audioRef.current?.pause(); contextRef.current?.suspend(); setPlaying(false); };
  useEffect(() => {
    const hide = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', hide);
    return () => { document.removeEventListener('visibilitychange', hide); nodesRef.current.forEach(n => { try { n.stop(); } catch { /* already stopped */ } }); contextRef.current?.close(); };
  }, []);
  async function toggle() {
    if (playing) return stop();
    try {
      if (weddingDetails.media.music) {
        audioRef.current ??= new Audio(weddingDetails.media.music);
        audioRef.current.loop = true; audioRef.current.volume = 0.25; await audioRef.current.play();
      } else {
        // A quiet, original tanpura-inspired drone. No unlicensed music files.
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) throw new Error('Audio unavailable');
        if (!contextRef.current) {
          const ctx = contextRef.current = new AudioContext();
          const master = ctx.createGain(); master.gain.value = 0.032; master.connect(ctx.destination);
          [130.81, 196, 261.63, 392].forEach((frequency, i) => {
            const oscillator = ctx.createOscillator(), gain = ctx.createGain();
            oscillator.type = 'sine'; oscillator.frequency.value = frequency; oscillator.detune.value = i % 2 ? 3 : -3;
            gain.gain.value = 1 / (i + 2); oscillator.connect(gain); gain.connect(master); oscillator.start(); nodesRef.current.push(oscillator);
          });
        }
        await contextRef.current.resume();
      }
      setPlaying(true); setMessage('');
    } catch { setMessage('Audio is unavailable in this browser.'); }
  }
  return <><button className={`music-button ${playing ? 'playing' : ''}`} onClick={toggle} aria-label={playing ? 'Pause background music' : 'Play background music'} aria-pressed={playing}>{playing ? <Volume2 size={16}/> : <VolumeX size={16}/>}<span>Music {playing ? 'on' : 'off'}</span></button><span className="sr-only" role="status">{message}</span></>;
}