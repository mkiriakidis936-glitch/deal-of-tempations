// Ένας κοινός κανόνας για όλη την εφαρμογή: από τη διεύθυνση ενός αρχείου βγαίνει αν είναι φωτογραφία, βίντεο ή ήχος.
export const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg'];
export const VIDEO_EXT = ['mp4', 'm4v', 'mov', 'webm'];
export const AUDIO_EXT = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];

const extOf = (url) => (String(url || '').split(/[?#]/)[0].match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();

export function mediaKindOf(url) {
  const ext = extOf(url);
  if (VIDEO_EXT.includes(ext)) return 'video';
  if (AUDIO_EXT.includes(ext)) return 'audio';
  if (IMAGE_EXT.includes(ext)) return 'image';
  return '';
}

export const isVideoUrl = (url) => mediaKindOf(url) === 'video';
export const isAudioUrl = (url) => mediaKindOf(url) === 'audio';

export const VIDEO_ACCEPT = 'video/*,video/mp4,video/quicktime,video/webm,video/x-m4v,.mp4,.m4v,.mov,.webm';
export const IMAGE_ACCEPT = 'image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.heic,.heif,.svg';
export const MEDIA_ACCEPT = `${IMAGE_ACCEPT},${VIDEO_ACCEPT},audio/*,.mp3,.wav,.ogg,.m4a,.aac`;
