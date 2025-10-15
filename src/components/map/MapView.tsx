import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Vehicle, Geofence } from '../../lib/types';
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, VEHICLE_STATUS_CONFIG } from '../../lib/constants';

interface MapViewProps {
  vehicles: Vehicle[];
  geofences?: Geofence[];
  onVehicleClick?: (vehicle: Vehicle) => void;
  className?: string;
  showGeofences?: boolean;
  center?: [number, number];
  zoom?: number;
}

interface VehicleMarkerData {
  marker: maplibregl.Marker;
  element: HTMLDivElement;
  currentLng: number;
  currentLat: number;
  targetLng: number;
  targetLat: number;
  currentRotation: number;
  targetRotation: number;
  animationFrame?: number;
}

// Calculate bearing between two points
function calculateBearing(startLng: number, startLat: number, endLng: number, endLat: number): number {
  const startLatRad = startLat * Math.PI / 180;
  const startLngRad = startLng * Math.PI / 180;
  const endLatRad = endLat * Math.PI / 180;
  const endLngRad = endLng * Math.PI / 180;

  const dLng = endLngRad - startLngRad;

  const y = Math.sin(dLng) * Math.cos(endLatRad);
  const x = Math.cos(startLatRad) * Math.sin(endLatRad) -
            Math.sin(startLatRad) * Math.cos(endLatRad) * Math.cos(dLng);

  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

// Smooth interpolation function (easeOutQuad)
function easeOutQuad(t: number): number {
  return t * (2 - t);
}

export function MapView({
  vehicles,
  geofences = [],
  onVehicleClick,
  className = '',
  showGeofences = true,
  center = MAP_DEFAULT_CENTER,
  zoom = MAP_DEFAULT_ZOOM,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<string, VehicleMarkerData>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const initialFitDone = useRef(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: center,
      zoom: zoom,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      markers.current.forEach((markerData) => {
        if (markerData.animationFrame) {
          cancelAnimationFrame(markerData.animationFrame);
        }
        markerData.marker.remove();
      });
      markers.current.clear();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Animate marker to new position
  const animateMarker = (
    vehicleId: string,
    markerData: VehicleMarkerData,
    duration: number = 1000
  ) => {
    const startTime = performance.now();
    const startLng = markerData.currentLng;
    const startLat = markerData.currentLat;
    const startRotation = markerData.currentRotation;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuad(progress);

      // Interpolate position
      const lng = startLng + (markerData.targetLng - startLng) * easedProgress;
      const lat = startLat + (markerData.targetLat - startLat) * easedProgress;

      // Interpolate rotation (shortest path)
      let rotationDiff = markerData.targetRotation - startRotation;
      if (rotationDiff > 180) rotationDiff -= 360;
      if (rotationDiff < -180) rotationDiff += 360;
      const rotation = startRotation + rotationDiff * easedProgress;

      // Update marker position and rotation
      markerData.marker.setLngLat([lng, lat]);
      markerData.element.style.transform = `rotate(${rotation}deg)`;
      markerData.currentLng = lng;
      markerData.currentLat = lat;
      markerData.currentRotation = rotation;

      // Continue animation
      if (progress < 1) {
        markerData.animationFrame = requestAnimationFrame(animate);
      }
    };

    // Cancel any existing animation
    if (markerData.animationFrame) {
      cancelAnimationFrame(markerData.animationFrame);
    }

    markerData.animationFrame = requestAnimationFrame(animate);
  };

  // Update vehicle markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove markers that no longer exist
    const currentVehicleIds = new Set(vehicles.map((v) => v.id));
    markers.current.forEach((markerData, id) => {
      if (!currentVehicleIds.has(id)) {
        if (markerData.animationFrame) {
          cancelAnimationFrame(markerData.animationFrame);
        }
        markerData.marker.remove();
        markers.current.delete(id);
      }
    });

    // Add or update markers
    vehicles.forEach((vehicle) => {
      const existingMarkerData = markers.current.get(vehicle.id);

      if (existingMarkerData) {
        // Calculate bearing if vehicle is moving
        const hasPositionChanged =
          existingMarkerData.targetLng !== vehicle.lng ||
          existingMarkerData.targetLat !== vehicle.lat;

        if (hasPositionChanged) {
          const bearing = calculateBearing(
            existingMarkerData.currentLng,
            existingMarkerData.currentLat,
            vehicle.lng,
            vehicle.lat
          );

          existingMarkerData.targetLng = vehicle.lng;
          existingMarkerData.targetLat = vehicle.lat;
          existingMarkerData.targetRotation = bearing;

          // Animate to new position
          animateMarker(vehicle.id, existingMarkerData, 1000);
        }

        // Update popup content
        const popup = existingMarkerData.marker.getPopup();
        if (popup) {
          popup.setHTML(`
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">${vehicle.plate}</h3>
              <div style="font-size: 12px; color: #666;">
                <div style="margin: 4px 0;"><strong>Conductor:</strong> ${vehicle.driver}</div>
                <div style="margin: 4px 0;"><strong>Velocidad:</strong> ${vehicle.speed} km/h</div>
                <div style="margin: 4px 0;"><strong>Combustible:</strong> ${Math.round(vehicle.fuel)}%</div>
                <div style="margin: 4px 0;"><strong>Estado:</strong> ${VEHICLE_STATUS_CONFIG[vehicle.status].label}</div>
              </div>
            </div>
          `);
        }

        // Update marker color based on status
        const svg = existingMarkerData.element.querySelector('svg');
        if (svg) {
          svg.setAttribute('stroke', VEHICLE_STATUS_CONFIG[vehicle.status].markerColor);
          const circles = svg.querySelectorAll('circle');
          circles.forEach((circle) => {
            circle.setAttribute('fill', VEHICLE_STATUS_CONFIG[vehicle.status].markerColor);
          });
        }
      } else {
        // Create new marker with car icon
        const el = document.createElement('div');
        el.className = 'vehicle-marker';
        el.style.width = '48px';
        el.style.height = '48px';
        el.style.cursor = 'pointer';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.position = 'relative';
        el.style.transition = 'transform 0.1s ease-out';

        // Better car icon SVG (top-down view, pointing up by default)
        el.innerHTML = `
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${VEHICLE_STATUS_CONFIG[vehicle.status].markerColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
            <path d="M9 17v1a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-1" stroke="${VEHICLE_STATUS_CONFIG[vehicle.status].markerColor}" fill="${VEHICLE_STATUS_CONFIG[vehicle.status].markerColor}" fill-opacity="0.2"/>
            <path d="M12 4v3" stroke="${VEHICLE_STATUS_CONFIG[vehicle.status].markerColor}" stroke-width="2"/>
            <rect x="7" y="7" width="10" height="10" rx="2" fill="${VEHICLE_STATUS_CONFIG[vehicle.status].markerColor}" fill-opacity="0.3" stroke="${VEHICLE_STATUS_CONFIG[vehicle.status].markerColor}" stroke-width="2"/>
            <circle cx="9" cy="9" r="1" fill="${VEHICLE_STATUS_CONFIG[vehicle.status].markerColor}"/>
            <circle cx="15" cy="9" r="1" fill="${VEHICLE_STATUS_CONFIG[vehicle.status].markerColor}"/>
            <path d="M7 14h10" stroke="${VEHICLE_STATUS_CONFIG[vehicle.status].markerColor}" stroke-width="2"/>
          </svg>
        `;

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([vehicle.lng, vehicle.lat])
          .addTo(map.current!);

        // Add popup
        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">${vehicle.plate}</h3>
            <div style="font-size: 12px; color: #666;">
              <div style="margin: 4px 0;"><strong>Conductor:</strong> ${vehicle.driver}</div>
              <div style="margin: 4px 0;"><strong>Velocidad:</strong> ${vehicle.speed} km/h</div>
              <div style="margin: 4px 0;"><strong>Combustible:</strong> ${Math.round(vehicle.fuel)}%</div>
              <div style="margin: 4px 0;"><strong>Estado:</strong> ${VEHICLE_STATUS_CONFIG[vehicle.status].label}</div>
            </div>
          </div>
        `);

        marker.setPopup(popup);

        if (onVehicleClick) {
          el.addEventListener('click', () => {
            onVehicleClick(vehicle);
          });
        }

        // Store marker data
        const markerData: VehicleMarkerData = {
          marker,
          element: el,
          currentLng: vehicle.lng,
          currentLat: vehicle.lat,
          targetLng: vehicle.lng,
          targetLat: vehicle.lat,
          currentRotation: 0,
          targetRotation: 0,
        };

        markers.current.set(vehicle.id, markerData);
      }
    });
  }, [vehicles, mapLoaded, onVehicleClick]);

  // Add geofences
  useEffect(() => {
    if (!map.current || !mapLoaded || !showGeofences) return;

    // Remove existing geofence layers
    if (map.current.getLayer('geofences-fill')) {
      map.current.removeLayer('geofences-fill');
    }
    if (map.current.getLayer('geofences-line')) {
      map.current.removeLayer('geofences-line');
    }
    if (map.current.getSource('geofences')) {
      map.current.removeSource('geofences');
    }

    if (geofences.length === 0) return;

    // Add geofences source
    map.current.addSource('geofences', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: geofences.map((gf) => ({
          type: 'Feature',
          properties: {
            id: gf.id,
            name: gf.name,
            policy: gf.policy,
            color: gf.color,
          },
          geometry: gf.geom as any,
        })),
      },
    });

    // Add fill layer
    map.current.addLayer({
      id: 'geofences-fill',
      type: 'fill',
      source: 'geofences',
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': 0.2,
      },
    });

    // Add outline layer
    map.current.addLayer({
      id: 'geofences-line',
      type: 'line',
      source: 'geofences',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2,
      },
    });

    // Add popup on click
    map.current.on('click', 'geofences-fill', (e) => {
      if (!e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const props = feature.properties;

      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="padding: 8px;">
            <h3 style="font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">${props.name}</h3>
            <div style="font-size: 12px; color: #666;">
              <div style="margin: 4px 0;"><strong>Política:</strong> ${props.policy}</div>
            </div>
          </div>
        `)
        .addTo(map.current!);
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'geofences-fill', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'geofences-fill', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });
  }, [geofences, mapLoaded, showGeofences]);

  // Center on all vehicles only once on initial load
  useEffect(() => {
    if (!map.current || !mapLoaded || vehicles.length === 0 || initialFitDone.current) return;

    const bounds = new maplibregl.LngLatBounds();
    vehicles.forEach((vehicle) => {
      bounds.extend([vehicle.lng, vehicle.lat]);
    });

    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 14,
      duration: 1000, // Smooth animation
    });

    initialFitDone.current = true;
  }, [vehicles.length, mapLoaded]);

  return (
    <div
      ref={mapContainer}
      className={`w-full h-full rounded-lg ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
}
