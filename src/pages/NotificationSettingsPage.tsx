import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../features/auth/hooks';
import { settingsApi, AlertType, NotificationSetting, NotificationSettingCreate, ClientConfig } from '../features/settings/api';
import { Card } from '../components/ui/Card';
import { ClientCard } from '../components/ui/ClientCard';
import { Button } from '../components/ui/Button';
import { Bell, Mail, MessageSquare, Smartphone, Save, Check, Gauge, Clock, Settings } from 'lucide-react';
import { useToast } from '../hooks/useToast';

type Channel = 'sms' | 'email' | 'whatsapp';

interface SettingsState {
  [alertTypeId: string]: {
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
  };
}

export function NotificationSettingsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<SettingsState>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [speedLimit, setSpeedLimit] = useState<number>(80);
  const [routeInterval, setRouteInterval] = useState<number>(600);
  const [hasConfigChanges, setHasConfigChanges] = useState(false);

  const isClient = user?.role === 'operator_admin' || user?.role === 'admin';
  const isOperatorAdmin = user?.role === 'operator_admin';
  const CardComponent = isClient ? ClientCard : Card;

  // Obtener tipos de alerta
  const { data: alertTypes = [], isLoading: isLoadingAlertTypes } = useQuery({
    queryKey: ['alert-types'],
    queryFn: settingsApi.getAlertTypes,
  });

  // Obtener configuración actual
  const { data: currentSettings = [], isLoading: isLoadingSettings } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: settingsApi.getNotificationSettings,
  });

  // Obtener configuración del cliente
  const { data: clientConfig, isLoading: isLoadingClientConfig } = useQuery({
    queryKey: ['client-config'],
    queryFn: settingsApi.getClientConfig,
    enabled: !!user?.client_id,
  });

  // Inicializar configuración del cliente
  useEffect(() => {
    if (clientConfig) {
      setSpeedLimit(clientConfig.speed_limit);
      setRouteInterval(clientConfig.route_interval);
      setHasConfigChanges(false);
    }
  }, [clientConfig]);

  // Inicializar estado cuando se cargan los datos
  useEffect(() => {
    if (alertTypes.length > 0) {
      const initialState: SettingsState = {};

      // Inicializar todos los tipos de alerta con valores false
      alertTypes.forEach((alertType) => {
        initialState[alertType.id] = {
          sms: false,
          email: false,
          whatsapp: false,
        };
      });

      // Aplicar configuración existente
      currentSettings.forEach((setting) => {
        if (initialState[setting.alert_type_id]) {
          initialState[setting.alert_type_id][setting.channel] = setting.enabled;
        }
      });

      setSettings(initialState);
      setHasChanges(false);
    }
  }, [alertTypes, currentSettings]);

  // Mutación para guardar notificaciones
  const saveMutation = useMutation({
    mutationFn: settingsApi.saveNotificationSettingsBulk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast.success('Configuración de notificaciones guardada');
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar la configuración');
    },
  });

  // Mutación para guardar configuración del cliente
  const saveConfigMutation = useMutation({
    mutationFn: settingsApi.updateClientConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-config'] });
      toast.success('Configuración guardada exitosamente');
      setHasConfigChanges(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar la configuración');
    },
  });

  const handleToggle = (alertTypeId: string, channel: Channel) => {
    setSettings((prev) => ({
      ...prev,
      [alertTypeId]: {
        ...prev[alertTypeId],
        [channel]: !prev[alertTypeId][channel],
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const settingsToSave: NotificationSettingCreate[] = [];

    Object.entries(settings).forEach(([alertTypeId, channels]) => {
      (['sms', 'email', 'whatsapp'] as Channel[]).forEach((channel) => {
        settingsToSave.push({
          alert_type_id: alertTypeId,
          channel,
          enabled: channels[channel],
        });
      });
    });

    saveMutation.mutate(settingsToSave);
  };

  const handleSelectAll = (channel: Channel) => {
    setSettings((prev) => {
      const newSettings = { ...prev };
      Object.keys(newSettings).forEach((alertTypeId) => {
        newSettings[alertTypeId] = {
          ...newSettings[alertTypeId],
          [channel]: true,
        };
      });
      return newSettings;
    });
    setHasChanges(true);
  };

  const handleDeselectAll = (channel: Channel) => {
    setSettings((prev) => {
      const newSettings = { ...prev };
      Object.keys(newSettings).forEach((alertTypeId) => {
        newSettings[alertTypeId] = {
          ...newSettings[alertTypeId],
          [channel]: false,
        };
      });
      return newSettings;
    });
    setHasChanges(true);
  };

  const handleSaveConfig = () => {
    saveConfigMutation.mutate({
      speed_limit: speedLimit,
      route_interval: routeInterval,
    });
  };

  const handleSpeedLimitChange = (value: number) => {
    setSpeedLimit(value);
    setHasConfigChanges(true);
  };

  const handleRouteIntervalChange = (value: number) => {
    setRouteInterval(value);
    setHasConfigChanges(true);
  };

  const isLoading = isLoadingAlertTypes || isLoadingSettings || isLoadingClientConfig;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const channelConfig = [
    { key: 'sms' as Channel, label: 'SMS', icon: Smartphone, color: 'text-green-500' },
    { key: 'email' as Channel, label: 'Email', icon: Mail, color: 'text-blue-500' },
    { key: 'whatsapp' as Channel, label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isClient ? 'client-heading' : 'text-gray-900 dark:text-white'}`}>
            Configuración
          </h1>
          <p className={`mt-1 ${isClient ? 'client-text-secondary' : 'text-gray-600 dark:text-gray-400'}`}>
            Administra la configuración de tu organización
          </p>
        </div>
      </div>

      {/* Configuración del Cliente - Solo para operator_admin */}
      {isOperatorAdmin && (
        <CardComponent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${isClient ? 'bg-cyan-500/20' : 'bg-primary/10'}`}>
              <Settings className={`w-5 h-5 ${isClient ? 'text-cyan-400' : 'text-primary'}`} />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${isClient ? 'client-text-primary' : 'text-gray-900 dark:text-white'}`}>
                Configuración General
              </h2>
              <p className={`text-sm ${isClient ? 'client-text-secondary' : 'text-gray-600 dark:text-gray-400'}`}>
                Parámetros generales de tu organización
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Límite de velocidad */}
            <div className={`p-4 rounded-lg ${isClient ? 'bg-white/5' : 'bg-gray-50 dark:bg-gray-800'}`}>
              <div className="flex items-center gap-3 mb-3">
                <Gauge className={`w-5 h-5 ${isClient ? 'text-orange-400' : 'text-orange-500'}`} />
                <label className={`font-medium ${isClient ? 'client-text-primary' : 'text-gray-900 dark:text-white'}`}>
                  Límite de Velocidad
                </label>
              </div>
              <p className={`text-sm mb-3 ${isClient ? 'client-text-tertiary' : 'text-gray-500 dark:text-gray-400'}`}>
                Velocidad máxima permitida para generar alertas (km/h)
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={speedLimit}
                  onChange={(e) => handleSpeedLimitChange(Number(e.target.value))}
                  min={1}
                  max={200}
                  className={`w-24 px-3 py-2 rounded-lg border ${
                    isClient
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                  }`}
                />
                <span className={isClient ? 'client-text-secondary' : 'text-gray-600 dark:text-gray-400'}>km/h</span>
              </div>
            </div>

            {/* Tiempo para cortar rutas */}
            <div className={`p-4 rounded-lg ${isClient ? 'bg-white/5' : 'bg-gray-50 dark:bg-gray-800'}`}>
              <div className="flex items-center gap-3 mb-3">
                <Clock className={`w-5 h-5 ${isClient ? 'text-blue-400' : 'text-blue-500'}`} />
                <label className={`font-medium ${isClient ? 'client-text-primary' : 'text-gray-900 dark:text-white'}`}>
                  Tiempo para Cortar Rutas
                </label>
              </div>
              <p className={`text-sm mb-3 ${isClient ? 'client-text-tertiary' : 'text-gray-500 dark:text-gray-400'}`}>
                Intervalo de inactividad para separar rutas (segundos)
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={routeInterval}
                  onChange={(e) => handleRouteIntervalChange(Number(e.target.value))}
                  min={60}
                  max={3600}
                  className={`w-24 px-3 py-2 rounded-lg border ${
                    isClient
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                  }`}
                />
                <span className={isClient ? 'client-text-secondary' : 'text-gray-600 dark:text-gray-400'}>
                  segundos ({Math.floor(routeInterval / 60)} min)
                </span>
              </div>
            </div>
          </div>

          {/* Botón guardar configuración */}
          <div className="mt-6 flex justify-end">
            <Button
              variant="primary"
              onClick={handleSaveConfig}
              disabled={!hasConfigChanges || saveConfigMutation.isPending}
              className="flex items-center gap-2"
            >
              {saveConfigMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar Configuración
            </Button>
          </div>
        </CardComponent>
      )}

      {/* Sección de Notificaciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-xl font-semibold ${isClient ? 'client-heading' : 'text-gray-900 dark:text-white'}`}>
            Notificaciones
          </h2>
          <p className={`mt-1 ${isClient ? 'client-text-secondary' : 'text-gray-600 dark:text-gray-400'}`}>
            Selecciona qué tipos de alertas deseas recibir y por qué canales
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!hasChanges || saveMutation.isPending}
          className="flex items-center gap-2"
        >
          {saveMutation.isPending ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          Guardar Notificaciones
        </Button>
      </div>

      {/* Info Card */}
      <CardComponent className="p-4">
        <div className={`flex items-start gap-3 ${isClient ? '' : ''}`}>
          <div className={`p-2 rounded-lg ${isClient ? 'bg-cyan-500/20' : 'bg-primary/10'}`}>
            <Bell className={`w-5 h-5 ${isClient ? 'text-cyan-400' : 'text-primary'}`} />
          </div>
          <div>
            <h3 className={`font-medium ${isClient ? 'client-text-primary' : 'text-gray-900 dark:text-white'}`}>
              Canales de notificación
            </h3>
            <p className={`text-sm mt-1 ${isClient ? 'client-text-secondary' : 'text-gray-600 dark:text-gray-400'}`}>
              Puedes recibir notificaciones por SMS, Email o WhatsApp. Selecciona los canales que prefieras para cada tipo de alerta.
            </p>
          </div>
        </div>
      </CardComponent>

      {/* Settings Table */}
      <CardComponent className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isClient ? 'border-white/10' : 'border-gray-200 dark:border-gray-700'}`}>
                <th className={`text-left px-6 py-4 font-semibold ${isClient ? 'client-text-primary' : 'text-gray-900 dark:text-white'}`}>
                  Tipo de Alerta
                </th>
                {channelConfig.map((channel) => (
                  <th key={channel.key} className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2">
                        <channel.icon className={`w-4 h-4 ${channel.color}`} />
                        <span className={`font-semibold ${isClient ? 'client-text-primary' : 'text-gray-900 dark:text-white'}`}>
                          {channel.label}
                        </span>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <button
                          onClick={() => handleSelectAll(channel.key)}
                          className={`hover:underline ${isClient ? 'text-cyan-400' : 'text-primary'}`}
                        >
                          Todos
                        </button>
                        <span className={isClient ? 'client-text-tertiary' : 'text-gray-400'}>|</span>
                        <button
                          onClick={() => handleDeselectAll(channel.key)}
                          className={`hover:underline ${isClient ? 'client-text-secondary' : 'text-gray-500'}`}
                        >
                          Ninguno
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alertTypes.map((alertType, index) => (
                <tr
                  key={alertType.id}
                  className={`border-b ${
                    isClient ? 'border-white/5' : 'border-gray-100 dark:border-gray-700'
                  } ${index % 2 === 0 ? (isClient ? 'bg-white/2' : 'bg-gray-50/50 dark:bg-gray-800/50') : ''}`}
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className={`font-medium ${isClient ? 'client-text-primary' : 'text-gray-900 dark:text-white'}`}>
                        {alertType.name}
                      </p>
                      {alertType.description && (
                        <p className={`text-sm mt-0.5 ${isClient ? 'client-text-tertiary' : 'text-gray-500 dark:text-gray-400'}`}>
                          {alertType.description}
                        </p>
                      )}
                    </div>
                  </td>
                  {channelConfig.map((channel) => (
                    <td key={channel.key} className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggle(alertType.id, channel.key)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          settings[alertType.id]?.[channel.key]
                            ? isClient
                              ? 'bg-cyan-500 text-white'
                              : 'bg-primary text-white'
                            : isClient
                            ? 'bg-white/5 border border-white/20 hover:border-white/40'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {settings[alertType.id]?.[channel.key] && <Check className="w-5 h-5" />}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {alertTypes.length === 0 && (
          <div className={`text-center py-12 ${isClient ? 'client-text-secondary' : 'text-gray-500'}`}>
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay tipos de alerta configurados</p>
          </div>
        )}
      </CardComponent>

      {/* Footer with save button (mobile) */}
      {hasChanges && (
        <div className="fixed bottom-4 left-4 right-4 sm:hidden">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="w-full flex items-center justify-center gap-2"
          >
            {saveMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar Cambios
          </Button>
        </div>
      )}
    </div>
  );
}
