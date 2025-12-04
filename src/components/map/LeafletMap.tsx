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
  routeHistory?: Array<{ lat: number; lng: number; ts?: string }>;
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
  const routeMarkersRef = useRef<L.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const initialFitDoneRef = useRef(false);

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
      initialFitDoneRef.current = false;
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

      // Create custom icon - solo el punto
      const iconHtml = `
        <div style="
          width: 16px;
          height: 16px;
          background-color: ${color};
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        "></div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: 'vehicle-marker',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
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

    // Fit bounds only on first load (not on updates to preserve user's zoom/position)
    if (!initialFitDoneRef.current && vehicles.length > 0 && currentMarkers.size === vehicles.length) {
      const validVehicles = vehicles.filter(v => v.lat && v.lng);
      if (validVehicles.length > 0) {
        const bounds = L.latLngBounds(validVehicles.map((v) => [v.lat, v.lng]));
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        initialFitDoneRef.current = true;
      }
    }
  }, [vehicles, onVehicleClick]);

  // Update geofences from API
  useEffect(() => {
    if (!mapRef.current || !geofencesLayerRef.current) return;

    // Clear existing geofences
    geofencesLayerRef.current.clearLayers();

    // Parse color with alpha
    const hexToRgba = (hex: string, alpha: number = 0.18) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    };

    // Add geofences from database
    geofences.forEach((geofence: any) => {
      const color = geofence.color || '#3BA2E8';

      // Handle Circle geofences (creation_mode: 'address' with center_lat/center_lng/radius)
      if (geofence.center_lat && geofence.center_lng && geofence.radius) {
        const circle = L.circle([geofence.center_lat, geofence.center_lng], {
          radius: geofence.radius,
          color: color,
          fillColor: hexToRgba(color),
          fillOpacity: 1,
          weight: 2,
        }).addTo(geofencesLayerRef.current!);

        const eventTypeLabels = {
          entry: 'Entrada',
          exit: 'Salida',
          both: 'Entrada y Salida'
        };

        circle.bindPopup(`<div class="p-3">
          <h3 class="font-semibold text-sm text-gray-900">${geofence.name}</h3>
          <p class="text-xs text-gray-600 mt-1">Radio: ${geofence.radius}m</p>
          <p class="text-xs text-gray-600">Alertas: ${eventTypeLabels[geofence.event_type] || 'N/A'}</p>
          ${geofence.notes ? `<p class="text-xs text-gray-500 mt-1">${geofence.notes}</p>` : ''}
        </div>`);
      }
      // Handle Polygon geofences (creation_mode: 'coordinates' with polygon_coordinates)
      else if (geofence.polygon_coordinates) {
        // Soportar tanto formato GeoJSON { type: "Polygon", coordinates: [...] } como array directo [[lng, lat], ...]
        let coords: number[][] = [];

        if (geofence.polygon_coordinates.type === 'Polygon' && geofence.polygon_coordinates.coordinates) {
          // Formato GeoJSON
          coords = geofence.polygon_coordinates.coordinates;
        } else if (Array.isArray(geofence.polygon_coordinates) && geofence.polygon_coordinates.length >= 3) {
          // Formato array directo (legacy)
          coords = geofence.polygon_coordinates;
        }

        if (coords.length >= 3) {
          // polygon_coordinates está en formato [lng, lat], convertir a Leaflet [lat, lng]
          const leafletCoords = coords.map((coord: number[]) =>
            [coord[1], coord[0]] as [number, number]
          );

          const polygon = L.polygon(leafletCoords, {
            color: color,
            fillColor: hexToRgba(color),
            fillOpacity: 1,
            weight: 2,
          }).addTo(geofencesLayerRef.current!);

          const eventTypeLabels = {
            entry: 'Entrada',
            exit: 'Salida',
            both: 'Entrada y Salida'
          };

          polygon.bindPopup(`<div class="p-3">
            <h3 class="font-semibold text-sm text-gray-900">${geofence.name}</h3>
            <p class="text-xs text-gray-600 mt-1">Polígono (${coords.length} puntos)</p>
            <p class="text-xs text-gray-600">Alertas: ${eventTypeLabels[geofence.event_type] || 'N/A'}</p>
            ${geofence.notes ? `<p class="text-xs text-gray-500 mt-1">${geofence.notes}</p>` : ''}
          </div>`);
        }
      }
      // Legacy support: Handle old Circle format
      else if (geofence.geom_type === 'Circle') {
        try {
          const data = typeof geofence.coordinates === 'string'
            ? JSON.parse(geofence.coordinates)
            : geofence.coordinates;

          if (data.center && data.radius) {
            const [lng, lat] = data.center;
            const circle = L.circle([lat, lng], {
              radius: data.radius,
              color: color,
              fillColor: hexToRgba(color),
              fillOpacity: 1,
              weight: 2,
            }).addTo(geofencesLayerRef.current!);

            circle.bindPopup(`<div class="p-3">
              <h3 class="font-semibold text-sm text-gray-900">${geofence.name}</h3>
              <p class="text-xs text-gray-600 mt-1">Radio: ${data.radius}m</p>
            </div>`);
          }
        } catch (error) {
          console.error('Error parsing circle geofence:', error);
        }
      }
      // Legacy support: Handle old Polygon format
      else if (geofence.geom?.type === 'Polygon' && geofence.geom.coordinates) {
        const coordinates = geofence.geom.coordinates[0];

        if (coordinates && coordinates.length > 0) {
          // Auto-detect coordinate format and convert to Leaflet [lat, lng]
          const firstCoord = coordinates[0];
          const isLatLngFormat = Math.abs(firstCoord[0]) <= 90 && Math.abs(firstCoord[1]) <= 180;

          const leafletCoords = isLatLngFormat
            ? coordinates.map((coord: number[]) => [coord[0], coord[1]] as [number, number])
            : coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);

          const polygon = L.polygon(leafletCoords, {
            color: color,
            fillColor: hexToRgba(color),
            fillOpacity: 1,
            weight: 2,
          }).addTo(geofencesLayerRef.current!);

          polygon.bindPopup(`<div class="p-3">
            <h3 class="font-semibold text-sm text-gray-900">${geofence.name}</h3>
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
    if (!geofence) {
      console.log('❌ Geocerca no encontrada:', focusGeofenceId);
      return;
    }

    console.log('🎯 Enfocando geocerca:', geofence.name);
    console.log('📊 Datos de la geocerca:', geofence);

    // Handle Circle geofences (new format)
    if (geofence.center_lat && geofence.center_lng && geofence.radius) {
      const lat = geofence.center_lat;
      const lng = geofence.center_lng;
      const radiusInDegrees = geofence.radius / 111000; // Approximate conversion

      // Create bounds around the circle
      const bounds = L.latLngBounds(
        [lat - radiusInDegrees, lng - radiusInDegrees],
        [lat + radiusInDegrees, lng + radiusInDegrees]
      );

      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      console.log('✅ Mapa centrado en geocerca circular');
      return;
    }

    // Handle Polygon geofences (new format)
    if (geofence.polygon_coordinates) {
      // Soportar tanto formato GeoJSON { type: "Polygon", coordinates: [...] } como array directo [[lng, lat], ...]
      let coords: number[][] = [];

      if (geofence.polygon_coordinates.type === 'Polygon' && geofence.polygon_coordinates.coordinates) {
        // Formato GeoJSON
        coords = geofence.polygon_coordinates.coordinates;
      } else if (Array.isArray(geofence.polygon_coordinates) && geofence.polygon_coordinates.length >= 3) {
        // Formato array directo (legacy)
        coords = geofence.polygon_coordinates;
      }

      if (coords.length >= 3) {
        // polygon_coordinates está en formato [lng, lat], convertir a Leaflet [lat, lng]
        const leafletCoords = coords.map((coord: number[]) =>
          [coord[1], coord[0]] as [number, number]
        );

        console.log('📍 Coordenadas del polígono (primeras 3):', leafletCoords.slice(0, 3));

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
        console.log('✅ Mapa centrado en geocerca poligonal');
        return;
      }
    }

    // Legacy: Handle old Circle format
    if (geofence.geom_type === 'Circle') {
      try {
        const data = typeof geofence.coordinates === 'string'
          ? JSON.parse(geofence.coordinates)
          : geofence.coordinates;

        if (data.center && data.radius) {
          const [lng, lat] = data.center;
          const radiusInDegrees = data.radius / 111000; // Approximate conversion

          // Create bounds around the circle
          const bounds = L.latLngBounds(
            [lat - radiusInDegrees, lng - radiusInDegrees],
            [lat + radiusInDegrees, lng + radiusInDegrees]
          );

          mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
          console.log('✅ Mapa centrado en geocerca circular (legacy)');
        }
      } catch (error) {
        console.error('Error focusing circle geofence:', error);
      }
      return;
    }

    // Legacy: Handle old Polygon format
    if (geofence.geom?.coordinates) {
      const coordinates = geofence.geom.coordinates[0];
      if (coordinates && coordinates.length > 0) {
        // Check if coordinates are in [lat, lng] or [lng, lat] format
        const firstCoord = coordinates[0];
        const isLatLngFormat = Math.abs(firstCoord[0]) <= 90 && Math.abs(firstCoord[1]) <= 180;

        // Convert to Leaflet format [lat, lng]
        const leafletCoords = isLatLngFormat
          ? coordinates.map((coord: number[]) => [coord[0], coord[1]] as [number, number])
          : coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);

        // Calculate bounds of the geofence
        const bounds = L.latLngBounds(leafletCoords);

        // Fit map to geofence bounds with padding
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        console.log('✅ Mapa centrado en geocerca (legacy)');
      }
    }
  }, [focusGeofenceId, geofences]);

  // Draw route history polyline
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing polyline
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    // Remove existing route markers
    routeMarkersRef.current.forEach(marker => marker.remove());
    routeMarkersRef.current = [];

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
        // Helper function to format timestamp
        const formatTime = (ts?: string) => {
          if (!ts) return '';
          const date = new Date(ts);
          return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        };

        // Start marker (green, larger)
        const startIcon = L.divIcon({
          html: '<div style="width: 16px; height: 16px; background-color: #10b981; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>',
          className: 'route-marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        const startTime = routeHistory[0]?.ts ? `<div class="text-xs text-gray-600 mt-1">⏱️ ${formatTime(routeHistory[0].ts)}</div>` : '';
        const startMarker = L.marker(latLngs[0], { icon: startIcon })
          .bindPopup(`<div class="p-2"><div class="text-sm font-semibold">🟢 Inicio del recorrido</div>${startTime}</div>`)
          .addTo(mapRef.current);
        routeMarkersRef.current.push(startMarker);

        // No mostrar puntos intermedios, solo la línea del recorrido

        // End marker (red, larger)
        const endIcon = L.divIcon({
          html: '<div style="width: 16px; height: 16px; background-color: #ef4444; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>',
          className: 'route-marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        const endTime = routeHistory[routeHistory.length - 1]?.ts ? `<div class="text-xs text-gray-600 mt-1">⏱️ ${formatTime(routeHistory[routeHistory.length - 1].ts)}</div>` : '';
        const endMarker = L.marker(latLngs[latLngs.length - 1], { icon: endIcon })
          .bindPopup(`<div class="p-2"><div class="text-sm font-semibold">🔴 Fin del recorrido</div>${endTime}</div>`)
          .addTo(mapRef.current);
        routeMarkersRef.current.push(endMarker);
      }

      routePolylineRef.current = polyline;

      // Fit map to route bounds
      const bounds = polyline.getBounds();
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [routeHistory, showRoute]);

  return <div ref={containerRef} className="w-full h-full rounded-lg" />;
}
