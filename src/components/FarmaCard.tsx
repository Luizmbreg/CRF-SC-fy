import React from 'react';
import { User, Copy, Clock } from 'lucide-react';
import { FarmaData, DAYS, DayKey } from '../types';

interface FarmaCardProps {
  data: FarmaData;
  onChange: (data: FarmaData) => void;
}

export const FarmaCard: React.FC<FarmaCardProps> = ({ data, onChange }) => {
  const updateShift = (day: DayKey, field: 'e' | 'i' | 'r' | 's', value: string) => {
    const newShifts = { ...data.shifts, [day]: { ...data.shifts[day], [field]: value } };
    onChange({ ...data, shifts: newShifts });
  };

  const copyRow = (field: 'e' | 'i' | 'r' | 's') => {
    const value = data.shifts.seg[field];
    const newShifts = { ...data.shifts };
    DAYS.forEach(d => {
      newShifts[d.key] = { ...newShifts[d.key], [field]: value };
    });
    onChange({ ...data, shifts: newShifts });
  };

  return (
    <div className="glass-panel rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
            <User className="w-4 h-4" />
          </div>
          <div>
            <input 
              type="text" 
              value={data.nome}
              onChange={(e) => onChange({ ...data, nome: e.target.value })}
              className="bg-transparent border-none text-sm font-semibold focus:ring-0 p-0 placeholder:text-white/20 outline-none w-48"
              placeholder="Nome do Farmacêutico"
            />
            <div className="flex items-center gap-1 text-[10px] text-white/40">
              CRF: <input 
                type="text" 
                value={data.crf}
                onChange={(e) => onChange({ ...data, crf: e.target.value })}
                className="bg-transparent border-none focus:ring-0 p-0 w-20 text-[10px] outline-none"
                placeholder="123456"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="text-white/30 uppercase tracking-wider border-b border-white/5 bg-white/2">
              <th className="px-4 py-2 font-medium">Turno</th>
              {DAYS.map(d => <th key={d.key} className="px-2 py-2 font-medium text-center">{d.label}</th>)}
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              { id: 'e', label: 'Entrada' },
              { id: 'i', label: 'Intervalo' },
              { id: 'r', label: 'Retorno' },
              { id: 's', label: 'Saída' }
            ].map(type => (
              <tr key={type.id} className="hover:bg-white/2 transition-colors">
                <td className="px-4 py-2 text-white/50 font-medium whitespace-nowrap">{type.label}</td>
                {DAYS.map(d => (
                  <td key={d.key} className="px-1 py-1 text-center">
                    <input 
                      type="time" 
                      value={data.shifts[d.key][type.id as keyof typeof data.shifts[DayKey]]}
                      onChange={(e) => updateShift(d.key, type.id as any, e.target.value)}
                      className="glass-input !p-1 text-[11px] w-full max-w-[70px]"
                    />
                  </td>
                ))}
                <td className="px-2">
                  <button 
                    onClick={() => copyRow(type.id as any)}
                    className="p-1 hover:bg-white/10 rounded transition-colors text-white/20 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
