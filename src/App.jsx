import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CalendarDays, Check, Clock3, Flower2, Heart, MapPin, Menu, Share2, Sparkles, Sun, X } from 'lucide-react';
import { weddingDetails as details } from './config/weddingDetails';
import { getCountdown } from './lib/countdown';
import CinematicIntro, { Ornament } from './components/CinematicIntro';
import AmbientMusic from './components/AmbientMusic';

function Reveal({ children, className = '', delay = 0 }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.7, delay }}>{children}</motion.div>;
}

function Countdown() {
  const [time, setTime] = useState(() => getCountdown(details.weddingDate));
  useEffect(() => {
    const update = () => { if (!document.hidden) setTime(getCountdown(details.weddingDate)); };
    const interval = setInterval(update, 1000); document.addEventListener('visibilitychange', update);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', update); };
  }, []);
  return <div className="countdown-wrap"><p className="eyebrow">{time.complete ? 'OUR FOREVER HAS BEGUN' : 'EVERY MOMENT BRINGS US CLOSER'}</p><div className="countdown" aria-label="Countdown to the muhurtham">{['days', 'hours', 'minutes', 'seconds'].map((unit, index) => <div key={unit} className="count-unit"><span className="count-number">{String(time[unit]).padStart(2, '0')}</span><span className="count-label">{unit}</span>{index < 3 && <i className="count-colon">:</i>}</div>)}</div></div>;
}

function RSVP() {
  const [status, setStatus] = useState('idle'), [error, setError] = useState(''), [reply, setReply] = useState(null);
  const isLocal = !details.rsvpEndpoint;
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem('rahul-bhavani-rsvp')); if (saved && saved.name) setReply(saved); } catch { /* private browsing or invalid saved data */ }
  }, []);
  async function submit(event) {
    event.preventDefault(); setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    data.name = data.name.trim(); data.email = data.email.trim(); data.message = data.message.trim(); data.guests = Number(data.guests);
    if (!data.name || data.name.length > 100 || data.guests < 1 || data.guests > 10) { setError('Please enter your name and a party size from 1 to 10.'); return; }
    setStatus('sending');
    try {
      if (isLocal) localStorage.setItem('rahul-bhavani-rsvp', JSON.stringify({ ...data, savedAt: new Date().toISOString() }));
      else {
        const response = await fetch(details.rsvpEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error('Unable to send');
      }
      setReply(data); setStatus('success');
    } catch { setStatus('idle'); setError(isLocal ? 'Your browser could not save this response. Please contact the family directly.' : 'Your response could not be sent. Please try again.'); }
  }
  return <section className="rsvp-section section-pad" id="rsvp"><div className="rsvp-layout container"><Reveal className="rsvp-intro"><span className="section-label">A SEAT AT OUR CELEBRATION</span><h2>Come for the wedding.<br/><em>Stay for the memories.</em></h2><Ornament/><p>It would mean the world to have you by our side as we begin this new chapter.</p><div className="rsvp-date"><CalendarDays size={18}/><span>{details.dateLabel}<br/><small>Bengaluru, India</small></span></div><span className="rsvp-flower" aria-hidden="true">❋</span></Reveal><Reveal className="rsvp-card" delay={0.15}>
      <div className="rsvp-card-heading"><span className="section-label">KINDLY RESPOND</span><Heart size={19}/></div><h3>Will you be joining us?</h3>
      {isLocal && <p className="local-notice">This response is saved on this device only and is not sent to the couple. Please confirm directly with the family.</p>}
      {status === 'success' ? <div className="rsvp-success" role="status"><div className="success-check"><Check size={25}/></div><h4>Thank you, {reply.name}.</h4><p>{isLocal ? 'Your response has been saved on this device. Remember to let the family know.' : 'Your response has been sent. Thank you for being part of our celebration.'}</p><button className="text-button" onClick={() => setStatus('idle')}>Edit response <ArrowUpRight size={14}/></button></div> : <form onSubmit={submit}>
        <label>Your name <span>*</span><input name="name" placeholder="Full name" autoComplete="name" maxLength={100} required defaultValue={reply?.name}/></label>
        <div className="form-row"><label>Email address<input name="email" type="email" placeholder="you@example.com" autoComplete="email" maxLength={200} defaultValue={reply?.email}/></label><label>Number of guests<select name="guests" defaultValue={reply?.guests || '1'}>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>{i + 1} {i === 0 ? 'guest' : 'guests'}</option>)}</select></label></div>
        <fieldset><legend>Attendance <span>*</span></legend><div className="attendance-options"><label><input type="radio" name="attendance" value="attending" defaultChecked={!reply || reply.attendance === 'attending'} required/> Joyfully accepts</label><label><input type="radio" name="attendance" value="not-attending" defaultChecked={reply?.attendance === 'not-attending'}/> Regretfully declines</label></div></fieldset>
        <label>A note for the couple <span className="optional">(optional)</span><textarea name="message" rows={2} placeholder="Send a little love…" maxLength={1000} defaultValue={reply?.message}/></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button rsvp-submit" disabled={status === 'sending'} type="submit">{status === 'sending' ? 'Saving…' : isLocal ? 'Save my response' : 'Send my RSVP'}<ArrowUpRight size={17}/></button>
      </form>}
    </Reveal></div></section>;
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false), [shareStatus, setShareStatus] = useState('');
  async function share() {
    const url = window.location.href.split('#')[0];
    const data = { title: 'Rahul & Bhavani · Wedding invitation', text: `Join us for the wedding of Rahul & Bhavani. ${details.dateLabel}, Bengaluru.`, url };
    try {
      if (navigator.share) await navigator.share(data);
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); setShareStatus('Invitation link copied'); }
      else { setShareStatus('Copy the invitation link from your browser address bar.'); }
    } catch (error) { if (error.name !== 'AbortError') setShareStatus('Unable to share. Copy the link from your address bar.'); }
  }
  const icons = { flower: Flower2, sparkles: Sparkles, sun: Sun };
  return <>
    <a href="#celebration" className="skip-link">Skip to wedding details</a>
    <header className="site-header"><a className="brand" href="#home" aria-label="Rahul and Bhavani home">R<span>&</span>B<i>22.11.26</i></a><nav className={menuOpen ? 'nav-open' : ''} aria-label="Main navigation"><a href="#celebration" onClick={() => setMenuOpen(false)}>The celebration</a><a href="#events" onClick={() => setMenuOpen(false)}>Wedding events</a><a href="#venue" onClick={() => setMenuOpen(false)}>The venue</a><a className="nav-rsvp" href="#rsvp" onClick={() => setMenuOpen(false)}>RSVP <ArrowUpRight size={13}/></a></nav><div className="header-actions"><AmbientMusic/><button className="menu-toggle" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21}/> : <Menu size={21}/>}</button></div></header>
    <main><CinematicIntro/>
      <section id="celebration" className="celebration-section section-pad"><Reveal className="container celebration-inner"><span className="section-label">TWO FAMILIES. ONE BEAUTIFUL JOURNEY.</span><h2>Some moments are meant<br/>to be <em>shared.</em></h2><Ornament/><p className="invitation-message">{details.invitation}</p><div className="couple-formal"><span>{details.groom.fullName} <small>({details.groom.qualification})</small></span><Heart size={17}/><span>{details.bride.fullName} <small>({details.bride.qualification})</small></span></div><Countdown/></Reveal></section>
      <section id="events" className="events-section section-pad"><div className="container"><Reveal className="section-heading"><div><span className="section-label">THE WEDDING FESTIVITIES</span><h2>A celebration in <em>three chapters.</em></h2></div><p>Traditions that bring us together.<br/>Moments that stay with us forever.</p></Reveal><div className="events-grid">{details.events.map((event, i) => { const Icon = icons[event.icon]; return <Reveal className={`event-card ${i === 2 ? 'auspicious' : ''}`} key={event.id} delay={i * 0.1}><div className="event-card-top"><span className="event-number">{event.number}</span><Icon size={26} strokeWidth={1}/></div><span className="event-chapter">{i === 0 ? 'THE BLESSINGS' : i === 1 ? 'THE CELEBRATION' : 'THE SACRED VOWS'}</span><h3>{event.name}</h3><p className="event-description">{event.description}</p><div className="event-details"><p><CalendarDays size={15}/><span>{event.date}<small>{event.day}</small></span></p><p><Clock3 size={15}/><span>{event.time}</span></p></div>{i === 2 && <span className="auspicious-badge">THE AUSPICIOUS HOUR</span>}</Reveal>; })}</div><Reveal className="events-note"><Flower2 size={16}/><p>All ceremonies will be held at Satyanarayana Kalyana Mandapam, Bengaluru.</p></Reveal></div></section>
      <section id="venue" className="venue-section section-pad"><div className="container venue-layout"><Reveal className="venue-art"><div className="venue-art-border"><span className="venue-coordinate">12.95° N &nbsp; 77.58° E</span><div className="venue-arch"><MapPin size={32} strokeWidth={1}/><span>Bengaluru</span><p>WHERE OUR FOREVER BEGINS</p></div><div className="venue-art-bottom"><span>V.V. PURAM</span><span>KARNATAKA, INDIA</span></div></div></Reveal><Reveal className="venue-copy" delay={0.15}><span className="section-label">A PLACE TO MAKE MEMORIES</span><h2>We’ll meet you<br/><em>here.</em></h2><Ornament/><h3>{details.venue.name}</h3><p>{details.venue.address.map(line => <span key={line}>{line}<br/></span>)}</p><a className="primary-button" href={details.venue.mapsUrl} target="_blank" rel="noopener noreferrer"><MapPin size={16}/>Get directions<ArrowUpRight size={16}/></a><p className="venue-note">Opens Google Maps · Search for the exact venue before travel.</p></Reveal></div></section>
      <section className="quote-section"><Reveal><Ornament light/><p>“Together is a beautiful<br/><em>place to be.”</em></p><span>RAHUL & BHAVANI · 2026</span></Reveal></section>
      {/* <RSVP/> */}
    </main>
    <footer className="site-footer"><div className="footer-monogram">R<span>&</span>B</div><Ornament/><p>{details.footer}</p><button className="share-button" onClick={share}><Share2 size={16}/>Share the invitation<ArrowUpRight size={15}/></button><div className="share-status" role="status">{shareStatus}</div><div className="footer-bottom"><span>WITH LOVE, THE TWO FAMILIES</span><span>{details.dateLabel.toUpperCase()} · BENGALURU</span><span>MADE FOR OUR FOREVER <Heart size={10}/></span></div></footer>
  </>;
}