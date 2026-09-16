const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const STATIC_MAP_BASE_URL = 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static';
const PIN_COLOR = '0061ed';

export type StaticMapOptions = {
  lat: number;
  lng: number;
  zoom?: number;
  width?: number;
  height?: number;
};

export function hasStaticMapToken() {
  return Boolean(MAPBOX_TOKEN);
}

/** Mapbox static image with a pin at the coordinates, or null when there is no token to sign it. */
export function buildStaticMapUrl({
  lat,
  lng,
  zoom = 13,
  width = 600,
  height = 320,
}: StaticMapOptions) {
  if (!MAPBOX_TOKEN || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  const clampedZoom = Math.min(Math.max(zoom, 3), 18);
  const size = `${Math.min(Math.round(width), 1280)}x${Math.min(Math.round(height), 1280)}`;
  return `${STATIC_MAP_BASE_URL}/pin-s+${PIN_COLOR}(${lng},${lat})/${lng},${lat},${clampedZoom}/${size}@2x?access_token=${MAPBOX_TOKEN}`;
}
