// Aproximación suficiente para mock (suelo urbano)
const R = 6371000; // m

interface Point {
  ts: string;
  lat: number;
  lng: number;
  speedKmh: number;
}

interface Track {
  vehicleId: string;
  date: string;
  points: Point[];
}

function metersToLatLngDelta(distanceM: number, bearingDeg: number, lat0: number) {
  const brng = bearingDeg * Math.PI / 180;
  const dByR = distanceM / R;
  const lat0Rad = lat0 * Math.PI / 180;

  const lat1Rad = Math.asin(
    Math.sin(lat0Rad) * Math.cos(dByR) +
    Math.cos(lat0Rad) * Math.sin(dByR) * Math.cos(brng)
  );

  const lon1Rad =
    Math.atan2(
      Math.sin(brng) * Math.sin(dByR) * Math.cos(lat0Rad),
      Math.cos(dByR) - Math.sin(lat0Rad) * Math.sin(lat1Rad)
    );

  return {
    dLat: (lat1Rad - lat0Rad) * 180 / Math.PI,
    dLng: lon1Rad * 180 / Math.PI
  };
}

export interface SimulateTrackParams {
  vehicleId: string;
  dateISO?: string;
  count?: number;
  start?: { lat: number; lng: number };
  bearing?: number;
  avgSpeedKmh?: number;
}

export function simulateTrack({
  vehicleId,
  dateISO = new Date().toISOString().split('T')[0],
  count = 40,
  start = { lat: 20.6736, lng: -103.344 },
  bearing = Math.random() * 360,
  avgSpeedKmh = 35
}: SimulateTrackParams): Track {
  const points: Point[] = [];
  const startTs = new Date(`${dateISO}T10:00:00Z`).getTime(); // ventana de 10:00 AM
  let lat = start.lat;
  let lng = start.lng;
  let speedKmh = avgSpeedKmh;
  let currentBearing = bearing;

  for (let i = 0; i < count; i++) {
    const ts = new Date(startTs + i * 10000).toISOString(); // +10s

    // ruido suave en velocidad
    speedKmh = Math.max(15, Math.min(55, speedKmh + (Math.random() - 0.5) * 6));

    // giro suave + giro marcado ocasional
    currentBearing += (Math.random() - 0.5) * 10;
    if (i % 10 === 0 && i !== 0) {
      currentBearing += (Math.random() - 0.5) * 40;
    }

    const speedMs = speedKmh / 3.6;
    const dist = speedMs * 10; // 10s
    const { dLat, dLng } = metersToLatLngDelta(dist, currentBearing, lat);

    // pequeña deriva aleatoria (3–8 m)
    const jitterLat = (Math.random() - 0.5) * 0.00005;
    const jitterLng = (Math.random() - 0.5) * 0.00005;

    lat += dLat + jitterLat;
    lng += dLng + jitterLng;

    points.push({
      ts,
      lat: +lat.toFixed(6),
      lng: +lng.toFixed(6),
      speedKmh: Math.round(speedKmh)
    });
  }

  return { vehicleId, date: dateISO, points };
}
