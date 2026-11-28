import React, { createContext, useContext } from 'react';

// 10.5.0 · Πότε παίζουν τα βίντεο στην TV.
// state.videoMode: 'manual' (προεπιλογή) = κανένα βίντεο δεν ξεκινά μόνο του, παίζει μόνο με ▶ από το Tablet/Στούντιο.
//                  'auto' = όπως πριν (welcome, countdown, stingers, φόντα που κινούνται).
export const isManualVideo = (state) => (state?.videoMode || 'manual') !== 'auto';

const VideoPolicy = createContext({ manual: false });
export const VideoPolicyProvider = ({ manual, children }) => <VideoPolicy.Provider value={{ manual: !!manual }}>{children}</VideoPolicy.Provider>;
export const useVideoManual = () => useContext(VideoPolicy).manual;

// Βίντεο φόντου: σε «Μόνο με Play» μένει ακίνητο στο πρώτο καρέ (σαν φωτογραφία), αλλιώς παίζει σιωπηλό σε loop.
export function BgVideo({ src, className = '', style, loop = true }) {
  const manual = useVideoManual();
  return (
    <video key={`${src}-${manual}`} src={src} className={className} style={style} muted loop={loop} playsInline preload="auto"
      autoPlay={!manual}
      onLoadedData={(e) => { if (manual) { try { e.currentTarget.pause(); e.currentTarget.currentTime = 0.05; } catch { /* χωρίς seek */ } } }} />
  );
}
