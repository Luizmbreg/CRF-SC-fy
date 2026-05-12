import React from 'react';
import { StoreHours, DAYS, DayKey } from '../types';
import { Copy } from 'lucide-react';

interface StoreHoursTableProps {
  data: StoreHours;
  onChange: (data: StoreHours) => void;
}

export const StoreHoursTable: React.FC<StoreHoursTableProps> = ({ data, onChange }) => {
  const update = (type: keyof StoreHours, day: DayKey, value: string) => {
    onChange({
      ...data,
      [type]: { ...data[type], [day]: value }
    });
  };

  const copyRow = (type: keyof StoreHours) => {
    const value = data[type].seg;
    const newData = { ...data[type] };
    DAYS.forEach(d => {
      newData[d.key] = value;
    });
    onChange({
      ...data,
      [type]: newData
    });
  };

  return (
    <div className="glass-panel rounded-3xl overflow-hidden mb-6">
      <div className="p-4 bg-white/5 border-b border-white/10">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/60">Horário da Filial</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-white/2 text-white/30 border-b border-white/5">
              <th className="px-4 py-2 font-medium">CAMPO</th>
              {DAYS.map(d => <th key={d.key} className="px-2 py-2 font-medium text-center">{d.label}</th>)}
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {(['abertura', 'intervalo', 'retorno', 'fechamento'] as const).map(type => (
              <tr key={type} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="px-4 py-3 capitalize font-semibold text-white/70">{type}</td>
                {DAYS.map(d => (
                  <td key={d.key} className="px-1 py-2 text-center">
                    <input 
                      type="time" 
                      value={data[type][d.key]}
                      onChange={(e) => update(type, d.key, e.target.value)}
                      className="glass-input !bg-white/5 !border-white/5 w-full max-w-[80px] text-center"
                    />
                  </td>
                ))}
                <td className="px-2">
                  <button 
                    onClick={() => copyRow(type)}
                    className="p-1 hover:bg-white/10 rounded transition-colors text-white/20 hover:text-white"
                    title={`Copiar ${type} de Segunda para todos os dias`}
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
