'use client';

import { useState, useEffect } from 'react';

interface Command {
  id: string;
  name: string;
  description: string;
  action: string;
  icon: string;
}

const COMMANDS: Command[] = [
  {
    id: 'new-student',
    name: 'Nuevo Alumno',
    description: 'Ingresar un alumno nuevo al sistema',
    action: 'ingresar alumno nuevo',
    icon: '📝',
  },
  {
    id: 'generate-receipt',
    name: 'Generar Recibo',
    description: 'Crear un recibo para un pago',
    action: 'generar recibo',
    icon: '💰',
  },
  {
    id: 'insurance-form',
    name: 'Obra Social',
    description: 'Completar formulario de obra social',
    action: 'completar obra social',
    icon: '📋',
  },
  {
    id: 'attendance',
    name: 'Planilla de Asistencia',
    description: 'Crear planilla de asistencia del mes',
    action: 'crear planilla de asistencia',
    icon: '📊',
  },
  {
    id: 'help',
    name: 'Ayuda',
    description: 'Ver todos los comandos disponibles',
    action: 'ayuda',
    icon: '❓',
  },
];

interface CommandPaletteProps {
  open?: boolean;
  onSelect?: (action: string) => void;
  onClose?: () => void;
}

export default function CommandPalette({ open = false, onSelect, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState<Command[]>(COMMANDS);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const results = COMMANDS.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(search.toLowerCase()) ||
        cmd.description.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(results);
    setSelectedIndex(0);
  }, [search]);

  const handleSelect = (command: Command) => {
    if (onSelect) {
      onSelect(command.action);
    }
    if (onClose) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-32">
      <div className="w-full max-w-xl bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden">
        {/* Input */}
        <div className="border-b border-slate-700 p-4">
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar comando..."
            className="w-full bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:border-yarbis-500"
          />
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filtered.map((command, index) => (
            <button
              key={command.id}
              onClick={() => handleSelect(command)}
              className={`w-full text-left px-4 py-3 border-b border-slate-700 hover:bg-slate-700 transition-colors ${
                index === selectedIndex ? 'bg-yarbis-600' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{command.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-white">{command.name}</p>
                  <p className="text-sm text-slate-400">{command.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 px-4 py-2 text-xs text-slate-400">
          <p>Presiona Enter para seleccionar | Esc para cerrar</p>
        </div>
      </div>
    </div>
  );
}
