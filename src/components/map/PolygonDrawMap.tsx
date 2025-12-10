import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useTheme } from '../../contexts/ThemeContext';

interface PolygonDrawMapProps {
  onPolygonComplete: (coordinates: [number, number][]) => void;
  color?: string;
  initialCoordinates?: [number, number][];
}

export function PolygonDrawMap({
  onPolygonComplete,
  color = '#3BA2E8',
  initialCoordinates = []
}: PolygonDrawMapProps) {
  const { isDark } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [points, setPoints] = useState<[number, number][]>(initialCoordinates);
  // Si hay coordenadas iniciales con 3+ puntos, el polígono ya está completo
  const [isComplete, setIsComplete] = useState(initialCoordinates.length >= 3);
  const isCompleteRef = useRef(initialCoordinates.length >= 3); // Ref para evitar problemas de closure
  const markersRef = useRef<L.CircleMarker[]>([]);
  const linesRef = useRef<L.Polyline[]>([]);
  const polygonRef = useRef<L.Polygon | null>(null);
  const firstMarkerRef = useRef<L.CircleMarker | null>(null);

  // Distancia mínima en píxeles para considerar que se hizo clic en el primer punto
  const CLOSE_THRESHOLD = 20;

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Determinar centro inicial: si hay coordenadas iniciales, calcular el centro del polígono
    let initialCenter: [number, number] = [20.7167, -103.3830]; // Zapopan, Jalisco por defecto
    let initialZoom = 13;

    if (initialCoordinates && initialCoordinates.length > 0) {
      // Calcular el centro del polígono (promedio de todas las coordenadas)
      const centerLat = initialCoordinates.reduce((sum, coord) => sum + coord[0], 0) / initialCoordinates.length;
      const centerLng = initialCoordinates.reduce((sum, coord) => sum + coord[1], 0) / initialCoordinates.length;
      initialCenter = [centerLat, centerLng];
      initialZoom = 15; // Zoom más cercano al editar
    }

    // Inicializar el mapa
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: false,
    });

    // Usar tiles oscuros o claros según el tema
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Si hay coordenadas iniciales y el polígono está completo, ajustar bounds para mostrar todo
    if (initialCoordinates && initialCoordinates.length >= 3) {
      const bounds = L.latLngBounds(initialCoordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Manejar clics en el mapa
    map.on('click', (e: L.LeafletMouseEvent) => {
      // Usar la ref para evitar problemas de closure
      if (isCompleteRef.current) {
        return;
      }

      const { lat, lng } = e.latlng;
      const clickPoint: [number, number] = [lat, lng];

      // Obtener los puntos actuales directamente del estado más reciente
      setPoints(currentPoints => {
        // Si hay puntos previos, verificar si se hizo clic cerca del primer punto
        if (currentPoints.length >= 3 && firstMarkerRef.current) {
          const firstPoint = currentPoints[0];
          const firstMarkerLatLng = L.latLng(firstPoint[0], firstPoint[1]);
          const clickLatLng = L.latLng(lat, lng);

          // Calcular distancia en píxeles
          const firstPointPixel = map.latLngToContainerPoint(firstMarkerLatLng);
          const clickPixel = map.latLngToContainerPoint(clickLatLng);
          const distance = Math.sqrt(
            Math.pow(firstPointPixel.x - clickPixel.x, 2) +
            Math.pow(firstPointPixel.y - clickPixel.y, 2)
          );

          // Si el clic está cerca del primer punto, cerrar el polígono
          if (distance <= CLOSE_THRESHOLD) {
            // Marcar como completo
            isCompleteRef.current = true;
            setIsComplete(true);
            onPolygonComplete(currentPoints);
            // Cambiar cursor del mapa
            if (mapInstanceRef.current) {
              mapInstanceRef.current.getContainer().style.cursor = 'default';
            }
            return currentPoints; // No agregar nuevo punto
          }
        }

        // Agregar nuevo punto
        return [...currentPoints, clickPoint];
      });
    });

    // Limpiar al desmontar
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Actualizar visualización cuando cambian los puntos
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Limpiar marcadores, líneas y polígono anteriores
    markersRef.current.forEach(marker => marker.remove());
    linesRef.current.forEach(line => line.remove());
    if (polygonRef.current) {
      polygonRef.current.remove();
      polygonRef.current = null;
    }
    markersRef.current = [];
    linesRef.current = [];

    if (points.length === 0) return;

    const map = mapInstanceRef.current;

    // Si el polígono está completo, solo dibujar el polígono lleno
    if (isComplete && points.length >= 3) {
      polygonRef.current = L.polygon(points, {
        color: color,
        fillColor: color,
        fillOpacity: 0.3,
        weight: 3,
        opacity: 1,
      }).addTo(map);

      // Dibujar marcadores sobre el polígono
      points.forEach((point, index) => {
        const marker = L.circleMarker([point[0], point[1]], {
          radius: 5,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 1,
        }).addTo(map);
        markersRef.current.push(marker);
      });

      // Ajustar el mapa para mostrar todo el polígono
      map.fitBounds(polygonRef.current.getBounds(), { padding: [50, 50] });
      return;
    }

    // Si no está completo, dibujar marcadores y líneas
    // Dibujar marcadores
    points.forEach((point, index) => {
      const isFirst = index === 0;
      const marker = L.circleMarker([point[0], point[1]], {
        radius: isFirst ? 8 : 6,
        fillColor: isFirst ? '#ff0000' : color,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: isFirst ? 0.9 : 0.7,
      }).addTo(map);

      // Guardar referencia al primer marcador
      if (isFirst) {
        firstMarkerRef.current = marker;

        // Agregar tooltip al primer marcador
        if (points.length >= 3) {
          marker.bindTooltip('Haz clic aquí para cerrar', {
            permanent: false,
            direction: 'top',
          });
        }
      }

      markersRef.current.push(marker);
    });

    // Dibujar líneas conectando los puntos
    if (points.length >= 2) {
      for (let i = 0; i < points.length - 1; i++) {
        const line = L.polyline(
          [
            [points[i][0], points[i][1]],
            [points[i + 1][0], points[i + 1][1]]
          ],
          {
            color: color,
            weight: 2,
            opacity: 0.7,
            dashArray: '5, 5',
          }
        ).addTo(map);
        linesRef.current.push(line);
      }

      // Si hay 3 o más puntos, dibujar línea del último al primero (punteada)
      if (points.length >= 3) {
        const closingLine = L.polyline(
          [
            [points[points.length - 1][0], points[points.length - 1][1]],
            [points[0][0], points[0][1]]
          ],
          {
            color: color,
            weight: 2,
            opacity: 0.4,
            dashArray: '5, 10',
          }
        ).addTo(map);
        linesRef.current.push(closingLine);
      }
    }
  }, [points, color, isComplete]);

  const resetPolygon = () => {
    setPoints([]);
    setIsComplete(false);
    isCompleteRef.current = false; // Resetear la ref también
    firstMarkerRef.current = null;

    if (polygonRef.current) {
      polygonRef.current.remove();
      polygonRef.current = null;
    }

    // Restaurar cursor del mapa
    if (mapInstanceRef.current) {
      mapInstanceRef.current.getContainer().style.cursor = 'crosshair';
    }
  };

  const undoLastPoint = () => {
    if (isComplete) return;
    setPoints(prev => prev.slice(0, -1));
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <div className="text-gray-600 dark:text-gray-400">
          {isComplete ? (
            <span className="text-green-600 dark:text-green-400 font-medium">
              ✓ Polígono completado ({points.length} puntos)
            </span>
          ) : points.length === 0 ? (
            <span>Haz clic en el mapa para comenzar</span>
          ) : points.length < 3 ? (
            <span>Puntos agregados: {points.length} (mínimo 3)</span>
          ) : (
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {points.length} puntos - Haz clic en el punto rojo para cerrar
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {points.length > 0 && !isComplete && (
            <button
              type="button"
              onClick={undoLastPoint}
              className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            >
              Deshacer
            </button>
          )}
          {points.length > 0 && (
            <button
              type="button"
              onClick={resetPolygon}
              className="px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition-colors"
            >
              Reiniciar
            </button>
          )}
        </div>
      </div>

      <div
        ref={mapContainerRef}
        className="w-full h-[400px] rounded-lg border border-gray-300 dark:border-gray-600 cursor-crosshair"
        style={{ cursor: isComplete ? 'default' : 'crosshair' }}
      />

      {isComplete && (
        <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-400">
            <strong>Polígono creado exitosamente</strong>
          </p>
          <p className="text-xs text-green-700 dark:text-green-500 mt-1">
            {points.length} puntos definidos. Puedes continuar con el guardado.
          </p>
        </div>
      )}

      {points.length > 0 && !isComplete && points.length < 3 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-400">
            Necesitas al menos 3 puntos para crear un polígono. Continúa haciendo clic en el mapa.
          </p>
        </div>
      )}
    </div>
  );
}
