// All invitation copy and media can be edited here without changing components.
import groomVideo from '../../assets/Groom_walking_in_place_dfd0f81e.mp4?url';
import brideVideo from '../../assets/Bride_walking_in_place_671ecc04.mp4?url';
import scrollVideo from '../../assets/WhatsApp Video 2026-11-02 at 1.19.01 PM.mp4?url';
import musicTrack from '../../assets/marriageAudio.mp3?url';
import { mediaAssets } from './mediaAssets';
export const weddingDetails = {
  blessing: 'Shree Lakshmi Venkateshwara Prasanna',
  groom: { name: 'Rahul', fullName: 'Chi. Rahul M.R', qualification: 'B.E' },
  bride: { name: 'Bhavani', fullName: 'Chi. Sou. Bhavani D. Naveen', qualification: 'B.V.A' },
  invitation: 'We request the honour of your presence with family and friends on the wedding occasion.',
  weddingDate: '2026-11-22T09:15:00+05:30',
  dateLabel: '21 & 22 November 2026',
  events: [
    { id: 'vara-pooja', name: 'Vara Pooja', date: '21 November 2026', day: 'Saturday', time: '11:00 AM', number: '01', description: 'A sacred beginning. Blessings, traditions, and the coming together of two families.', icon: 'flower', startsAt: '2026-11-21T11:00:00+05:30' },
    { id: 'reception', name: 'Reception', date: '21 November 2026', day: 'Saturday', time: '6:30 PM', number: '02', description: 'An evening of warm wishes, wonderful company, and memories to cherish.', icon: 'sparkles', startsAt: '2026-11-21T18:30:00+05:30' },
    { id: 'muhurtham', name: 'Muhurtham', date: '22 November 2026', day: 'Sunday', time: '9:15 AM – 10:30 AM', number: '03', description: 'The auspicious moment. Join us as we begin our beautiful journey of forever.', icon: 'sun', startsAt: '2026-11-22T09:15:00+05:30' },
  ],
  venue: { name: 'Satyanarayana Kalyana Mandapam', address: ['Sanjjan Rao Circle, V.V. Puram,', 'Bengaluru – 560004'], mapsUrl: 'https://maps.app.goo.gl/1g19e82yXQN9h5Cr8?g_st=ac' },
  media: {
    // New footage already faces inward; no mirroring of clothing/jewellery.
    groomFlipX: mediaAssets.groom.flipX, brideFlipX: mediaAssets.bride.flipX,
    groomCrop: mediaAssets.groom.crop, brideCrop: mediaAssets.bride.crop, scrollCrop: mediaAssets.scroll.crop,
    groom: groomVideo, bride: brideVideo, scroll: scrollVideo,
    groomPoster: new URL('../../assets/groom-poster.png', import.meta.url).href,
    bridePoster: new URL('../../assets/bride-poster.png', import.meta.url).href,
    scrollPoster: new URL('../../assets/scroll-poster.png', import.meta.url).href,
    // Put your own mandap image/video in public/assets and set its URL here.
    backgroundVideo: '', backgroundPoster: '',
    // Optional licensed audio URL. Without it, the music toggle plays a gentle synthesized ambience.
    music: musicTrack,
  },
  // Optional HTTPS endpoint receiving JSON. Empty = clearly labelled browser-local RSVP only.
  rsvpEndpoint: '',
  footer: 'Your presence is our most cherished gift. We look forward to celebrating this beautiful beginning with you.',
};
