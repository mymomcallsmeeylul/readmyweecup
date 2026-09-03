/**
 * Client-side image preparation.
 *
 * Phone cameras hand us 4000px, 6MB JPEGs. The vision model does not need any
 * of that, and the user is probably on cellular data, so we resize and
 * recompress before anything leaves the device. A 1280px long edge is well
 * past what is useful for reading coffee grounds.
 */

const MAX_EDGE = 1280;
const START_QUALITY = 0.82;
const MIN_QUALITY = 0.55;
const TARGET_BYTES = 900 * 1024;
const BACKDROP = '#140d09';

export async function prepareImage(file) {
  if (!file) throw new Error('no_file');
  if (file.type && !file.type.startsWith('image/')) throw new Error('not_an_image');

  const source = await decode(file);
  const { width, height } = fit(source.width, source.height, MAX_EDGE);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  // PNGs and HEIC conversions can carry transparency; a cup is never transparent.
  ctx.fillStyle = BACKDROP;
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);

  if (typeof source.close === 'function') source.close();

  let quality = START_QUALITY;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (approxBytes(dataUrl) > TARGET_BYTES && quality > MIN_QUALITY) {
    quality -= 0.09;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  return { dataUrl, width, height, bytes: approxBytes(dataUrl) };
}

async function decode(file) {
  if ('createImageBitmap' in window) {
    try {
      // from-image applies the EXIF rotation, so cups shot in portrait stay upright.
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* Older Safari rejects the options bag. Fall through. */
    }
    try {
      return await createImageBitmap(file);
    } catch {
      /* Fall through to the <img> path. */
    }
  }
  return loadViaImg(file);
}

function loadViaImg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('decode_failed'));
    };
    img.src = url;
  });
}

function fit(w, h, max) {
  if (w <= max && h <= max) return { width: w, height: h };
  const scale = max / Math.max(w, h);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

function approxBytes(dataUrl) {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return Math.floor(base64.length * 0.75);
}

/**
 * Prepares a whole selection. One bad file out of four should not cost the
 * other three, so failures are dropped and only an empty result throws.
 */
export async function prepareImages(files, limit = 4) {
  const chosen = Array.from(files || []).slice(0, limit);
  const settled = await Promise.allSettled(chosen.map(prepareImage));
  const ready = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  if (ready.length === 0) throw new Error('no_readable_images');
  return ready;
}
