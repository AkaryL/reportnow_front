import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { clientsApi } from '../features/clients/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Eye, Mail, Phone, Plus, Building2, Edit, Trash2 } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { ClientFormModal } from '../components/clients/ClientFormModal';
import type { Client } from '../lib/types';

export function ClientsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.CLIENTS,
    queryFn: clientsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
      setIsModalOpen(false);
      setSelectedClient(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => clientsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
      setIsModalOpen(false);
      setSelectedClient(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: clientsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
    },
  });

  const handleCreateClient = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleSubmit = (data: any) => {
    if (selectedClient) {
      // Don't send empty password when editing
      const updateData = { ...data };
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password;
      }
      updateMutation.mutate({ id: selectedClient.id, data: updateData });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDeleteClient = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewClient = (id: string) => {
    navigate(`/clientes/${id}`);
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
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">
            Gestión de clientes y asignaciones • {clients.length} clientes activos
          </p>
        </div>
        <Button variant="primary" onClick={handleCreateClient}>
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de clientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Vehículos</TableHead>
                <TableHead>Última actividad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <button
                          onClick={() => handleViewClient(client.id)}
                          className="font-medium text-gray-900 hover:text-primary-600 transition-colors text-left"
                        >
                          {client.name}
                        </button>
                        <p className="text-sm text-gray-500">ID: {client.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{client.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">{client.vehicles} vehículos</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(client.lastActivity || new Date().toISOString())}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewClient(client.id)}
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClient(client)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClient(client.id)}
                        className="text-crit-600 hover:text-crit-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{clients.length}</p>
              </div>
              <div className="bg-primary-100 p-3 rounded-lg">
                <Building2 className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vehículos asignados</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {clients.reduce((sum, c) => sum + c.vehicles, 0)}
                </p>
              </div>
              <div className="bg-ok-100 p-3 rounded-lg">
                <Badge className="text-ok-700">Activos</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promedio por cliente</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {clients.length > 0 ? (clients.reduce((sum, c) => sum + c.vehicles, 0) / clients.length).toFixed(1) : '0'}
                </p>
              </div>
              <div className="bg-info-100 p-3 rounded-lg">
                <Badge className="text-info-700">Media</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ClientFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedClient(null);
        }}
        onSubmit={handleSubmit}
        client={selectedClient}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
