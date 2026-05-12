import React from 'react';
import { AlertCircle, CheckCircle2, Download, ExternalLink, Info } from 'lucide-react';
import { ValidationResult } from '../types';

interface ValidationSummaryProps {
  result: ValidationResult | null;
  onGeneratePDF: () => void;
  isGenerating?: boolean;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({ 
  result, onGeneratePDF, isGenerating 
}) => {
  if (!result) return null;

  return (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
      <div className={`p-6 rounded-3xl glass-panel ${result.isValid ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
        <div className="flex items-center gap-4 mb-6">
          {result.isValid ? (
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
          )}
          <div>
            <h3 className="text-xl font-semibold">Resumo da Validação</h3>
            <p className="text-sm text-white/50">
              {result.isValid ? 'Escala completa e sem infrações CLT.' : 'Verifique os apontamentos abaixo.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {result.totalHours.map((h, i) => (
            <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-[10px] uppercase tracking-tighter text-white/40 mb-1">Farmacêutico {i+1}</div>
              <div className="text-lg font-mono font-bold text-blue-400">
                {Math.floor(h/60)}h{h%60}min
              </div>
            </div>
          ))}
        </div>

        {result.lacunas.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-bold text-red-400 uppercase mb-2 flex items-center gap-2">
              <AlertCircle className="w-3 h-3" /> Lacunas Detectadas
            </h4>
            <ul className="space-y-1">
              {result.lacunas.map((l, i) => <li key={i} className="text-xs text-red-300/80 bg-red-500/10 p-2 rounded-lg">{l}</li>)}
            </ul>
          </div>
        )}

        {result.alertasClt.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-bold text-orange-400 uppercase mb-2 flex items-center gap-2">
              <AlertCircle className="w-3 h-3" /> Alertas CLT
            </h4>
            <ul className="space-y-1">
              {result.alertasClt.map((a, i) => <li key={i} className="text-xs text-orange-300/80 bg-orange-500/10 p-2 rounded-lg">{a}</li>)}
            </ul>
          </div>
        )}

        {result.avisos.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-bold text-yellow-400 uppercase mb-2 flex items-center gap-2">
              <Info className="w-3 h-3" /> Avisos
            </h4>
            <ul className="space-y-1">
              {result.avisos.map((a, i) => <li key={i} className="text-xs text-yellow-300/80 bg-yellow-500/10 p-2 rounded-lg">{a}</li>)}
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onGeneratePDF}
            disabled={!result.isValid || isGenerating}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
          >
            <Download className="w-5 h-5" />
            {isGenerating ? 'Processando...' : 'Gerar PDF Escala'}
          </button>
          
          {result.isValid && (
            <a 
              href="https://www.gov.br/pt-br/servicos/assinatura-eletronica?origem=maisacessado_home"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl text-sm transition-all border border-white/10 active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              Assinatura GOV.BR
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
