import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../features/auth/hooks';
import { settingsApi, AlertType, NotificationSetting, NotificationSettingCreate } from '../features/settings/api';
import { Card } from '../components/ui/Card';
import { ClientCard } from '../components/ui/ClientCard';
import { Button } from '../components/ui/Button';
import { Bell, Mail, MessageSquare, Smartphone, Save, Check } from 'lucide-react';
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

  const isClient = user?.role === 'operator_admin' || user?.role === 'admin';
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

  // Mutación para guardar
  const saveMutation = useMutation({
    mutationFn: settingsApi.saveNotificationSettingsBulk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast.success('Configuración guardada exitosamente');
      setHasChanges(false);
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

  const isLoading = isLoadingAlertTypes || isLoadingSettings;

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
            Configuración de Notificaciones
          </h1>
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
          Guardar Cambios
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
