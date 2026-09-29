/**
 * Inline, render-blocking head script (it runs before the first paint, so an overlay can be up from the very first
 * frame). It only sets data attributes on <html>; without JavaScript nothing happens and every overlay stays hidden.
 *
 * - `data-cover="arrive"`: the previous document was left under the route curtain (language switch).
 * - `data-intro="play"`: first page load of this browser session → the intro loader plays. Skipped for reduced
 *   motion and for crawlers/link previews (the content underneath is complete either way).
 *
 * Keep the storage keys in sync with ARRIVE_KEY (src/lib/motion/pageCover.ts).
 */
export const MOTION_BOOT_SCRIPT = `(function(){try{var d=document.documentElement,s=sessionStorage;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;if(s.getItem('jd-arrive')){s.removeItem('jd-arrive');d.setAttribute('data-cover','arrive');return}if(s.getItem('jd-intro')||/bot|crawl|spider|slurp|preview|facebookexternalhit|embedly/i.test(navigator.userAgent))return;s.setItem('jd-intro','1');d.setAttribute('data-intro','play')}catch(e){}})()`
