import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '../features/vehicles/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Download, FileText, TrendingUp, MapPin, Gauge } from 'lucide-react';
import { exportToCSV } from '../lib/utils';

export function ReportsPage() {
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.VEHICLES,
    queryFn: vehiclesApi.getAll,
  });

  const reports = [
    {
      id: '1',
      title: 'Reporte de Actividad Diaria',
      description: 'Resumen de actividad de todos los vehículos en el día',
      icon: TrendingUp,
      color: 'bg-ok-100 text-ok-600',
    },
    {
      id: '3',
      title: 'Reporte de Rutas',
      description: 'Historial de rutas y geocercas visitadas',
      icon: MapPin,
      color: 'bg-info-100 text-info-600',
    },
    {
      id: '4',
      title: 'Reporte General',
      description: 'Reporte completo de todos los vehículos',
      icon: FileText,
      color: 'bg-primary-100 text-primary-600',
    },
  ];

  const handleExportVehicles = () => {
    const data = vehicles.map((v) => ({
      Placa: v.plate,
      Conductor: v.driver,
      Estado: v.status,
      Velocidad: `${v.speed} km/h`,
      Latitud: v.lat,
      Longitud: v.lng,
    }));

    exportToCSV(data, `Reporte_Vehiculos_${new Date().toISOString().split('T')[0]}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600 mt-1">
            Generación y exportación de reportes en formato CSV
          </p>
        </div>
        <Button variant="primary" onClick={handleExportVehicles}>
          <Download className="w-4 h-4" />
          Exportar Todo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="hover:shadow-medium transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-4 rounded-lg ${report.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                    <Button variant="outline" size="sm" onClick={handleExportVehicles}>
                      <Download className="w-4 h-4" />
                      Descargar CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vista previa de datos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Placa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Conductor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Velocidad
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.slice(0, 5).map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {vehicle.plate}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{vehicle.driver}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{vehicle.status}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{vehicle.speed} km/h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">
            Mostrando 5 de {vehicles.length} vehículos
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
