import { Search, MapPin, Shield, Plus } from 'lucide-react';
import { Button } from './ui/Button';

interface TopbarProps {
  title: string;
  subtitle: string;
  onSearch?: (query: string) => void;
}

export function Topbar({ title, subtitle, onSearch }: TopbarProps) {
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    onSearch?.(query);
  };

  return (
    <div className="bg-white border-b border-app-border px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Breadcrumb/Título lateral izquierdo */}
        <div className="flex-shrink-0">
          <h1 className="text-[22px] font-semibold text-gray-900">{title}</h1>
          <p className="text-[12.5px] text-slate-500">{subtitle}</p>
        </div>

        {/* Acciones derecha */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="rounded-full h-9 px-4 text-[13px] bg-[#3BA2E8] text-white hover:bg-[#2386CF] transition-colors flex items-center gap-2 font-medium">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Alerta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
