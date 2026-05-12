import React from 'react';
import { Users, Building2, UserCircle2, FileText, Eraser } from 'lucide-react';

interface HeaderProps {
  qtd: number;
  setQtd: (val: number) => void;
  onValidate: () => void;
  onClear: () => void;
  storeInfo: {
    filial: string;
    rl: string;
    cpf: string;
    cnpj: string;
  };
  setStoreInfo: (info: any) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  qtd, setQtd, onValidate, onClear, storeInfo, setStoreInfo 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-light tracking-tight text-white/90">
          Validador <span className="font-semibold text-blue-400 text-glow">CRF/SC</span> 
        </h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={onValidate}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-full transition-all font-medium shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <FileText className="w-4 h-4" />
            Validar Escala
          </button>
          <button 
            onClick={onClear}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 active:scale-95"
            title="Limpar Tudo"
          >
            <Eraser className="w-5 h-5 text-white/70" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-5 glass-panel rounded-3xl">
        <div className="space-y-1.5 col-span-1 lg:col-span-1">
          <label className="flex items-center gap-2 text-xs font-medium text-white/50 px-1">
            <Users className="w-3.5 h-3.5" /> FARMACÊUTICOS
          </label>
          <select 
            value={qtd} 
            onChange={(e) => setQtd(Number(e.target.value))}
            className="w-full glass-input h-10 appearance-none bg-black/20"
          >
            {[1,2,3,4,5,6].map(n => <option key={n} value={n} className="bg-[#1a1a1a] text-white">{n}</option>)}
          </select>
        </div>

        <div className="space-y-1.5 lg:col-span-1">
          <label className="flex items-center gap-2 text-xs font-medium text-white/50 px-1">
            <Building2 className="w-3.5 h-3.5" /> CRF FILIAL
          </label>
          <input 
            type="text" 
            value={storeInfo.filial}
            onChange={(e) => setStoreInfo({...storeInfo, filial: e.target.value})}
            className="w-full glass-input h-10" 
            placeholder="Ex: 1234"
          />
        </div>

        <div className="space-y-1.5 lg:col-span-1">
          <label className="flex items-center gap-2 text-xs font-medium text-white/50 px-1">
            <UserCircle2 className="w-3.5 h-3.5" /> RL
          </label>
          <input 
            type="text" 
            value={storeInfo.rl}
            onChange={(e) => setStoreInfo({...storeInfo, rl: e.target.value})}
            className="w-full glass-input h-10" 
            placeholder="Nome RL"
          />
        </div>

        <div className="space-y-1.5 lg:col-span-1">
          <label className="text-xs font-medium text-white/50 px-1">CPF RL</label>
          <input 
            type="text" 
            value={storeInfo.cpf}
            onChange={(e) => setStoreInfo({...storeInfo, cpf: e.target.value})}
            className="w-full glass-input h-10" 
            placeholder="000.000..."
          />
        </div>

        <div className="space-y-1.5 lg:col-span-1">
          <label className="text-xs font-medium text-white/50 px-1">CNPJ</label>
          <input 
            type="text" 
            value={storeInfo.cnpj}
            onChange={(e) => setStoreInfo({...storeInfo, cnpj: e.target.value})}
            className="w-full glass-input h-10" 
            placeholder="00.000..."
          />
        </div>
      </div>
    </div>
  );
};
