import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import type { Vehicle } from '../../lib/types';

interface LeafletMapProps {
  vehicles: Vehicle[];
  geofences?: any[];
  onVehicleClick: (vehicle: Vehicle) => void;
  center?: [number, number];
  zoom?: number;
  showGeofences?: boolean;
  focusGeofenceId?: string | null;
  routeHistory?: Array<{ lat: number; lng: number }>;
  showRoute?: boolean;
}

export function LeafletMap({
  vehicles,
  geofences = [],
  onVehicleClick,
  center = [20.7167, -103.3830], // Zapopan, Jalisco
  zoom = 13,
  showGeofences = true,
  focusGeofenceId = null,
  routeHistory = [],
  showRoute = false
}: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const geofencesLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: false,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Create geofences layer
    geofencesLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;
    initializedRef.current = true;

    return () => {
      map.remove();
      mapRef.current = null;
      initializedRef.current = false;
      markersRef.current.clear();
    };
  }, []);

  // Update vehicle markers efficiently
  useEffect(() => {
    if (!mapRef.current) return;

    const currentMarkers = markersRef.current;
    const vehicleIds = new Set(vehicles.map(v => v.id));

    // Remove markers for vehicles that are no longer in the list
    currentMarkers.forEach((marker, id) => {
      if (!vehicleIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    });

    // Update or add markers for current vehicles
    vehicles.forEach((vehicle) => {
      const existingMarker = currentMarkers.get(vehicle.id);

      const statusColors = {
        moving: '#10b981',
        stopped: '#3b82f6',
        offline: '#9ca3af',
        critical: '#ef4444',
      };

      const color = statusColors[vehicle.status];

      // Create custom icon
      const iconHtml = `
        <div style="position: relative; display: flex; align-items: center; gap: 6px;">
          <div style="
            width: 12px;
            height: 12px;
            background-color: ${color};
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>
          <div style="
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 2px 8px;
            font-size: 12px;
            font-weight: 500;
            color: #374151;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            white-space: nowrap;
          ">${vehicle.plate}</div>
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: 'vehicle-marker',
        iconSize: [100, 30],
        iconAnchor: [6, 6],
      });

      const statusLabels = {
        moving: 'En movimiento',
        stopped: 'Detenido',
        offline: 'Sin señal',
        critical: 'Crítico',
      };

      const popupContent = `
        <div class="p-4">
          <h3 class="font-bold text-sm text-gray-900 mb-2">${vehicle.plate}</h3>
          <div class="space-y-1 text-xs text-gray-600">
            <div><strong>Conductor:</strong> ${vehicle.driver}</div>
            <div><strong>Estado:</strong> ${statusLabels[vehicle.status]}</div>
            <div><strong>Combustible:</strong> ${vehicle.fuel}%</div>
            <div><strong>Velocidad:</strong> ${vehicle.speed} km/h</div>
          </div>
        </div>
      `;

      if (existingMarker) {
        // Update existing marker
        existingMarker.setLatLng([vehicle.lat, vehicle.lng]);
        existingMarker.setIcon(icon);
        existingMarker.setPopupContent(popupContent);
      } else {
        // Create new marker
        const marker = L.marker([vehicle.lat, vehicle.lng], { icon })
          .addTo(mapRef.current!);

        marker.bindPopup(popupContent);
        marker.on('click', () => onVehicleClick(vehicle));

        currentMarkers.set(vehicle.id, marker);
      }
    });

    // Fit bounds only on first load or when vehicle count changes significantly
    if (vehicles.length > 0 && currentMarkers.size === vehicles.length) {
      const bounds = L.latLngBounds(vehicles.map((v) => [v.lat, v.lng]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [vehicles, onVehicleClick]);

  // Update geofences from API
  useEffect(() => {
    if (!mapRef.current || !geofencesLayerRef.current) return;

    // Clear existing geofences
    geofencesLayerRef.current.clearLayers();

    // Add geofences from database
    geofences.forEach((geofence: any) => {
      if (geofence.geom?.type === 'Polygon' && geofence.geom.coordinates) {
        // Extract coordinates from GeoJSON format
        const coordinates = geofence.geom.coordinates[0];

        if (coordinates && coordinates.length > 0) {
          // Auto-detect coordinate format and convert to Leaflet [lat, lng]
          const firstCoord = coordinates[0];
          const isLatLngFormat = Math.abs(firstCoord[0]) <= 90 && Math.abs(firstCoord[1]) <= 180;

          const leafletCoords = isLatLngFormat
            ? coordinates.map((coord: number[]) => [coord[0], coord[1]] as [number, number])
            : coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);

          // Parse color with alpha
          const hexToRgba = (hex: string, alpha: number = 0.18) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r},${g},${b},${alpha})`;
          };

          const color = geofence.color || '#3BA2E8';

          const polygon = L.polygon(leafletCoords, {
            color: color,
            fillColor: hexToRgba(color),
            fillOpacity: 1,
            weight: 2,
          }).addTo(geofencesLayerRef.current!);

          polygon.bindPopup(`<div class="p-3">
            <h3 class="font-semibold text-sm text-gray-900">${geofence.name}</h3>
            <p class="text-xs text-gray-600 mt-1">Tipo: ${geofence.type}</p>
          </div>`);
        }
      }
    });
  }, [geofences]);

  // Toggle geofences visibility
  useEffect(() => {
    if (!mapRef.current || !geofencesLayerRef.current) return;

    if (showGeofences) {
      geofencesLayerRef.current.addTo(mapRef.current);
    } else {
      geofencesLayerRef.current.remove();
    }
  }, [showGeofences]);

  // Focus on specific geofence
  useEffect(() => {
    if (!mapRef.current || !focusGeofenceId) return;

    const geofence = geofences.find((g: any) => g.id === focusGeofenceId);
    if (!geofence || !geofence.geom?.coordinates) {
      console.log('❌ Geocerca no encontrada o sin coordenadas:', focusGeofenceId);
      return;
    }

    console.log('🎯 Enfocando geocerca:', geofence.name);
    console.log('📊 Datos de la geocerca:', geofence);

    const coordinates = geofence.geom.coordinates[0];
    if (!coordinates || coordinates.length === 0) {
      console.log('❌ Sin coordenadas válidas');
      return;
    }

    console.log('📍 Coordenadas originales (primeras 3):', coordinates.slice(0, 3));
    console.log('📍 Primera coordenada completa:', coordinates[0]);

    // Check if coordinates are in [lat, lng] or [lng, lat] format
    // Latitude is always between -90 and 90, longitude between -180 and 180
    const firstCoord = coordinates[0];
    const isLatLngFormat = Math.abs(firstCoord[0]) <= 90 && Math.abs(firstCoord[1]) <= 180;

    console.log('🔍 Detectando formato:', isLatLngFormat ? '[lat, lng]' : '[lng, lat]');

    // Convert to Leaflet format [lat, lng]
    const leafletCoords = isLatLngFormat
      ? coordinates.map((coord: number[]) => [coord[0], coord[1]] as [number, number]) // Already [lat, lng]
      : coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]); // Convert from [lng, lat]

    console.log('🗺️  Primera coordenada para Leaflet [lat, lng]:', leafletCoords[0]);
    console.log('🗺️  Coordenadas convertidas (primeras 3):', leafletCoords.slice(0, 3));

    // Calculate bounds of the geofence
    const bounds = L.latLngBounds(leafletCoords);

    console.log('📏 Bounds calculados:', {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });

    // Fit map to geofence bounds with padding
    mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    console.log('✅ Mapa centrado en geocerca');
  }, [focusGeofenceId, geofences]);

  // Draw route history polyline
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing polyline
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    // Draw new polyline if route history is provided and showRoute is true
    if (showRoute && routeHistory.length > 1) {
      const latLngs: [number, number][] = routeHistory.map(point => [point.lat, point.lng]);

      const polyline = L.polyline(latLngs, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7,
        smoothFactor: 1,
      }).addTo(mapRef.current);

      // Add markers for all points in the route
      if (latLngs.length > 0) {
        // Start marker (green, larger)
        const startIcon = L.divIcon({
          html: '<div style="width: 16px; height: 16px; background-color: #10b981; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>',
          className: 'route-marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker(latLngs[0], { icon: startIcon })
          .bindPopup('<div class="text-sm font-semibold">Inicio del recorrido</div>')
          .addTo(mapRef.current);

        // Intermediate points (blue, small)
        const pointIcon = L.divIcon({
          html: '<div style="width: 8px; height: 8px; background-color: #3b82f6; border: 2px solid white; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>',
          className: 'route-point',
          iconSize: [8, 8],
          iconAnchor: [4, 4],
        });

        for (let i = 1; i < latLngs.length - 1; i++) {
          L.marker(latLngs[i], { icon: pointIcon })
            .bindPopup(`<div class="text-xs">Punto ${i} de ${latLngs.length}</div>`)
            .addTo(mapRef.current);
        }

        // End marker (red, larger)
        const endIcon = L.divIcon({
          html: '<div style="width: 16px; height: 16px; background-color: #ef4444; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>',
          className: 'route-marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker(latLngs[latLngs.length - 1], { icon: endIcon })
          .bindPopup('<div class="text-sm font-semibold">Fin del recorrido</div>')
          .addTo(mapRef.current);
      }

      routePolylineRef.current = polyline;

      // Fit map to route bounds
      const bounds = polyline.getBounds();
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [routeHistory, showRoute]);

  return <div ref={containerRef} className="w-full h-full rounded-lg" />;
}
