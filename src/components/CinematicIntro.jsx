import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { ArrowDown, ArrowUpRight, LoaderCircle, RotateCcw } from 'lucide-react';
import { weddingDetails as details } from '../config/weddingDetails';
import { KeyedVideo } from './KeyedVideo';

// How long the couple takes to walk in (seconds). Lower = faster; the walking footage speeds up to match.
const ENTRANCE_SECONDS = 7;
// Play the complete 12-second portrait scroll reveal before switching to the crisp final poster.
const SCROLL_SETTLED_SECONDS = 11.85;

export function Ornament({ light = false }) { return <div className={`ornament ${light ? 'light' : ''}`} aria-hidden="true"><span/><i>✦</i><b>❋</b><i>✦</i><span/></div>; }
export function Petals({ paused, enabled = true }) {
  if (!enabled) return null;
  return <div className={`atmosphere ${paused ? 'paused' : ''}`} aria-hidden="true">{Array.from({ length: 28 }, (_, i) => <span key={i} className={i % 2 === 0 ? 'petal' : 'particle'} style={{ '--left': `${(i * 37 + 11) % 100}%`, '--delay': `${-(i * 1.7)}s`, '--duration': `${14 + i % 8}s`, '--drift': `${i % 2 ? 90 : -70}px` }}/>)}</div>;
}

export default function CinematicIntro() {
  const systemReduced = useReducedMotion();
  const [forceAnimation, setForceAnimation] = useState(false);
  const reduced = systemReduced && !forceAnimation;
  const heroRef = useRef(null), inView = useInView(heroRef, { amount: 0.12 });
  const groomRef = useRef(null), brideRef = useRef(null), scrollRef = useRef(null), backgroundRef = useRef(null);
  const [phase, setPhase] = useState('closed'), [textVisible, setTextVisible] = useState(false), [hidden, setHidden] = useState(document.hidden), [notice, setNotice] = useState('');
  const phaseRef = useRef(phase), clock = useRef(0), scrollStarted = useRef(false), generation = useRef(0), started = useRef(false), controls = useRef(null), scrollPreload = useRef(null), settled = useRef(false);
  const progress = useMotionValue(0);
  // Begin just beyond the edge so the full entrance, not only its end, is visible.
  const groomX = useTransform(progress, value => `calc(${-(1 - value) * 50}vw + ${1 - value} * var(--character-gap))`);
  const brideX = useTransform(progress, value => `calc(${(1 - value) * 50}vw - ${1 - value} * var(--character-gap))`);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => {
    const listener = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', listener);
    return () => { document.removeEventListener('visibilitychange', listener); generation.current++; controls.current?.stop(); };
  }, []);
  const safePlay = async (video) => { if (!video || video.readyState < 2 || video.ended) return; try { await video.play(); } catch { setNotice('Playback was paused by your browser. You can still read the complete invitation below.'); } };

  async function open(force = false) {
    if (started.current) return;
    if (force) setForceAnimation(true);
    started.current = true; setNotice(''); setPhase('loading');
    const token = ++generation.current;
    if (reduced && !force) { progress.set(1); scrollRef.current?.hold(); setTextVisible(true); setPhase('complete'); return; }
    // Load sequentially, never download all three videos together. The scroll waits until arrival.
    const groomReady = await groomRef.current.load();
    const brideReady = await brideRef.current.load();
    if (token !== generation.current) return;
    if (!groomReady || !brideReady) setNotice('Some footage could not load. Matching final-pose images are displayed instead.');
    [groomRef.current.video, brideRef.current.video].forEach(video => { if (Number.isFinite(video.duration)) video.playbackRate = video.duration / ENTRANCE_SECONDS; });
    // Fetch the scroll footage while the couple walks in (after the two character videos, never alongside them),
    // so it is ready the moment they arrive and the invitation never has to wait on screen.
    scrollPreload.current = scrollRef.current.load();
    clock.current = 0; setPhase('entrance');
  }

  useEffect(() => {
    const active = inView && !hidden;
    const videos = [groomRef.current?.video, brideRef.current?.video, scrollRef.current?.video];
    if (!active) { videos.forEach(v => v?.pause()); backgroundRef.current?.pause(); controls.current?.pause(); return; }
    if (details.media.backgroundVideo && phase !== 'closed') safePlay(backgroundRef.current);
    if (phase === 'entrance') {
      safePlay(groomRef.current?.video); safePlay(brideRef.current?.video);
      if (!controls.current) controls.current = animate(progress, 1, { duration: ENTRANCE_SECONDS, ease: 'linear' });
      else controls.current.play();
    } else if (phase === 'scroll') safePlay(scrollRef.current?.video);
    let previous = performance.now(), raf;
    const tick = (now) => {
      const delta = Math.min((now - previous) / 1000, 0.1); previous = now;
      if (phaseRef.current === 'entrance' || phaseRef.current === 'scroll') clock.current += delta;
      if (phaseRef.current === 'entrance' && clock.current >= ENTRANCE_SECONDS && !scrollStarted.current) {
        scrollStarted.current = true; setPhase('scroll-loading');
        const token = generation.current;
        (scrollPreload.current || scrollRef.current.load()).then(ready => {
          if (token !== generation.current) return;
          clock.current = 0;
          if (ready) setPhase('scroll');
          else { scrollRef.current?.hold(); setTextVisible(true); setPhase('complete'); }
        });
      }
      if (phaseRef.current === 'scroll' && !settled.current && (scrollRef.current?.video?.currentTime >= SCROLL_SETTLED_SECONDS || clock.current > SCROLL_SETTLED_SECONDS + 2)) {
        settled.current = true; scrollRef.current?.hold(); setTextVisible(true); setPhase('complete');
      }
      raf = requestAnimationFrame(tick);
    };
    if (phase === 'entrance' || phase === 'scroll') raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); };
  }, [phase, inView, hidden, progress]);

  function skip() {
    generation.current++; controls.current?.stop(); progress.set(1);
    [groomRef, brideRef, scrollRef].forEach(ref => ref.current?.hold());
    setTextVisible(true); setPhase('complete');
  }
  function playFullAnimation() {
    // The reduced-motion branch never downloaded or played media. Start that
    // same intro only after an explicit user opt-in, preserving the OS default.
    started.current = false; clock.current = 0; scrollStarted.current = false; scrollPreload.current = null; settled.current = false;
    controls.current?.stop(); controls.current = null;
    [groomRef, brideRef, scrollRef].forEach(ref => ref.current?.reset());
    progress.set(0); setTextVisible(false);
    open(true);
  }
  const opened = phase !== 'closed' && phase !== 'loading';
  return <section className={`cinematic-hero ${opened ? 'is-open' : ''}`} id="home" ref={heroRef}>
    {details.media.backgroundPoster && <img className="mandap-background" src={details.media.backgroundPoster} alt="Wedding mandap"/>}
    {opened && details.media.backgroundVideo && <video className="mandap-background" ref={backgroundRef} src={details.media.backgroundVideo} poster={details.media.backgroundPoster || undefined} muted playsInline loop preload="metadata"/>}
    <div className="architectural-frame" aria-hidden="true"><div className="arch arch-left"/><div className="arch arch-right"/><div className="hero-halo"/><div className="hanging-ornament left">❋</div><div className="hanging-ornament right">❋</div></div>
    <Petals paused={!inView || hidden} enabled={!reduced}/>
    <div className="hero-topline"><span>A WEDDING CELEBRATION</span><span>BENGALURU, INDIA</span></div>
    {!opened && <motion.div className="invitation-cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : 1 }}>
      <div className="cover-blessing">{details.blessing}</div><Ornament light/>
      <p className="eyebrow">WITH BLESSINGS, WITH LOVE, WITH YOU</p>
      <h1>{details.groom.name}<span className="name-ampersand">&</span>{details.bride.name}</h1>
      <p className="cover-subtitle">Two hearts. One beautiful beginning.</p>
      <div className="cover-date"><span>21 & 22</span><i/><span>NOVEMBER 2026</span></div>
      <button className="open-invitation" onClick={() => open()} disabled={phase === 'loading'}>{phase === 'loading' ? <LoaderCircle className="loading-icon" size={17}/> : <span className="seal-mini">R<span>&</span>B</span>}<span>{phase === 'loading' ? 'Preparing your invitation…' : 'Open the invitation'}</span><ArrowUpRight size={17}/></button>
      {reduced && phase !== 'loading' && <div className="motion-preference"><p>Your device prefers reduced motion. The invitation will open without animation.</p><button onClick={playFullAnimation}>Play full animation instead <ArrowUpRight size={13}/></button></div>}
      <p className="cover-note">A little tradition. A lifetime of togetherness.</p>
    </motion.div>}
    <div className={`cinematic-stage ${opened ? 'stage-visible' : ''}`} aria-hidden={!opened}>
      <motion.div className="character character-groom" style={{ x: reduced ? 0 : groomX }}><KeyedVideo ref={groomRef} src={details.media.groom} poster={details.media.groomPoster} role="groom" flipX={details.media.groomFlipX} crop={details.media.groomCrop}/></motion.div>
      <div className={`scroll-scene ${phase === 'entrance' || phase === 'scroll-loading' ? 'scroll-waiting' : ''}`}>
        <KeyedVideo ref={scrollRef} src={details.media.scroll} poster={details.media.scrollPoster} role="scroll" crop={details.media.scrollCrop} onEnded={() => { setTextVisible(true); setPhase('complete'); }}/>
        <motion.div className="parchment-copy" initial={false} animate={{ opacity: textVisible ? 1 : 0 }} transition={{ duration: reduced ? 0 : 1.2 }}>
          <p className="parchment-blessing">{details.blessing}</p><p className="parchment-kicker">TOGETHER WITH OUR FAMILIES</p>
          <h2>{details.groom.fullName} <small>({details.groom.qualification})</small></h2><span className="parchment-with">with</span><h2>{details.bride.fullName} <small>({details.bride.qualification})</small></h2>
          <div className="parchment-divider">✦</div><p className="parchment-message">{details.invitation}</p><p className="parchment-date">{details.dateLabel}</p><p className="parchment-city">BENGALURU</p>
        </motion.div>
      </div>
      <motion.div className="character character-bride" style={{ x: reduced ? 0 : brideX }}><KeyedVideo ref={brideRef} src={details.media.bride} poster={details.media.bridePoster} role="bride" flipX={details.media.brideFlipX} crop={details.media.brideCrop}/></motion.div>
    </div>
    {opened && phase !== 'complete' && <button className="skip-intro" onClick={skip}>Skip to invitation <ArrowUpRight size={13}/></button>}
    {phase === 'complete' && <div className="intro-complete"><span>THE BEGINNING OF OUR FOREVER</span><button onClick={() => window.location.reload()} aria-label="Replay the invitation"><RotateCcw size={14}/> Replay</button></div>}
    {phase === 'complete' && reduced && <div className="motion-preference motion-preference-open"><p>Animation skipped: your device prefers reduced motion.</p><button onClick={playFullAnimation}>Play full animation <ArrowUpRight size={13}/></button></div>}
    <p className={`playback-notice ${notice ? '' : 'sr-only'}`} role="status">{notice}</p>
    <a className="hero-scroll-link" href="#celebration"><span>DISCOVER THE CELEBRATION</span><ArrowDown size={14}/></a>
    <div className="hero-bottomline"><span>AN INVITATION FROM OUR HEARTS</span><span>SCROLL TO EXPLORE</span></div>
  </section>;
}