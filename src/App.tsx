import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { StoreHoursTable } from './components/StoreHoursTable';
import { FarmaCard } from './components/FarmaCard';
import { ValidationSummary } from './components/ValidationSummary';
import { FarmaData, StoreHours, ValidationResult, DAYS, DayKey } from './types';
import { validateSchedule } from './utils';
import { PDFDocument } from 'pdf-lib';

const INITIAL_SHIFT = { e: '', i: '', r: '', s: '' };

const createEmptyFarma = (id: number): FarmaData => ({
  id,
  nome: '',
  crf: '',
  shifts: {
    seg: { ...INITIAL_SHIFT },
    ter: { ...INITIAL_SHIFT },
    qua: { ...INITIAL_SHIFT },
    qui: { ...INITIAL_SHIFT },
    sex: { ...INITIAL_SHIFT },
    sab: { ...INITIAL_SHIFT },
    dom: { ...INITIAL_SHIFT },
  }
});

const createEmptyStoreHours = (): StoreHours => {
  const empty: Partial<Record<DayKey, string>> = {};
  DAYS.forEach(d => empty[d.key] = '');
  return {
    abertura: { ...empty } as Record<DayKey, string>,
    intervalo: { ...empty } as Record<DayKey, string>,
    retorno: { ...empty } as Record<DayKey, string>,
    fechamento: { ...empty } as Record<DayKey, string>
  };
};

export default function App() {
  const [qtd, setQtd] = useState(1);
  const [storeHours, setStoreHours] = useState<StoreHours>(createEmptyStoreHours());
  const [farmas, setFarmas] = useState<FarmaData[]>(Array.from({ length: 6 }, (_, i) => createEmptyFarma(i + 1)));
  const [storeInfo, setStoreInfo] = useState({ filial: '', rl: '', cpf: '', cnpj: '' });
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleValidate = useCallback(() => {
    const res = validateSchedule(qtd, storeHours, farmas);
    setResult(res);
  }, [qtd, storeHours, farmas]);

  const handleClear = () => {
    setStoreHours(createEmptyStoreHours());
    setFarmas(Array.from({ length: 6 }, (_, i) => createEmptyFarma(i + 1)));
    setResult(null);
  };

  const updateFarma = (index: number, data: FarmaData) => {
    const newFarmas = [...farmas];
    newFarmas[index] = data;
    setFarmas(newFarmas);
    if (result) setResult(null); // Reset validation on change
  };

  const generatePDF = async () => {
    if (!result || !result.isValid) return;
    setLoading(true);
    try {
      let pdfBytes: Uint8Array | null = null;
      
      try {
        const response = await fetch('/modelo.pdf');
        if (!response.ok) throw new Error("Arquivo 'modelo.pdf' não encontrado na pasta 'public'.");
        const arrayBuffer = await response.arrayBuffer();
        pdfBytes = new Uint8Array(arrayBuffer);
        console.log("Sucesso ao carregar PDF de: /modelo.pdf");
      } catch (e) {
        throw new Error("Certifique-se de que o arquivo 'public/modelo.pdf' existe.");
      }
      
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();
      const allFields = form.getFields();
      
      // LOG DE DEPURAÇÃO: Mostra todos os campos do PDF no console do navegador (F12)
      console.log("Campos disponíveis no PDF:", allFields.map(f => f.getName()));

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      const setField = (name: string, value: string) => {
        try {
          const field = form.getTextField(name);
          field.setText(value || "");
          console.log(`Campo preenchido: ${name}`);
        } catch (e) {
          // Busca insensível e por variações se o nome exato falhar
          const search = name.toUpperCase().replace(/[\/_-\s]/g, '');
          const target = allFields.find(f => {
            const fName = f.getName().toUpperCase().replace(/[\/_-\s]/g, '');
            // Verifica se é um campo de texto e se o nome bate
            return (f.constructor.name === 'PDFTextField' || (f as any).setText) && 
                   (fName === search || fName.includes(search));
          });

          if (target) {
            try {
              (target as any).setText(value || "");
              console.log(`Campo preenchido (busca): ${target.getName()} para ${name}`);
              return;
            } catch (err) {
              console.error(`Erro ao definir texto no campo ${target.getName()}:`, err);
            }
          }
          console.warn(`Campo ${name} (ou similar) não encontrado no PDF.`);
        }
      };

      // Set Date
      const hoje = new Date();
      const dia = String(hoje.getDate()).padStart(2, '0');
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const ano = String(hoje.getFullYear());
      
      try {
        // Tentativa de desenhar a data por cima (ajustado para o padrão CRF-SC)
        firstPage.drawText(dia, { x: 432, y: 195, size: 10 });
        firstPage.drawText(mes, { x: 450, y: 195, size: 10 });
        firstPage.drawText(ano, { x: 469, y: 195, size: 10 });
      } catch (e) {
        console.warn("Não foi possível desenhar a data na página.", e);
      }

      // Preenchimento de informações da Empresa
      setField("CNPJ", storeInfo.cnpj);
      setField("REG_FL", storeInfo.filial); // Registro da Filial no CRF-SC
      setField("RL", storeInfo.rl);
      setField("CPF_RL", storeInfo.cpf);

      // Formatação e preenchimento dos horários da filial no PDF
      const formatStoreRow = (day: DayKey) => {
        const a = storeHours.abertura[day];
        const i = storeHours.intervalo[day];
        const r = storeHours.retorno[day];
        const f = storeHours.fechamento[day];
        if (!a || !f) return "";
        return (i && r) ? `${a}-${i} / ${r}-${f}` : `${a}-${f}`;
      };

      // Horários da Filial - Nomes exatos do PDF
      setField("seg_FL", formatStoreRow('seg'));
      setField("sab_FL", formatStoreRow('sab'));
      setField("dom_FL", formatStoreRow('dom'));

      for (let i = 1; i <= 6; i++) {
        const farma = farmas[i - 1];
        if (farma && farma.nome && i <= qtd) {
          let nomeExibicao = farma.nome;
          if (result.totalHours[i - 1] > 2640) nomeExibicao += " - Folga conforme escala";
          
          setField(`F${i}`, nomeExibicao);
          setField(`reg_f${i}`, farma.crf);
          
          const hSemana = ['seg', 'ter', 'qua', 'qui', 'sex'].map(d => {
            const shift = farma.shifts[d as DayKey];
            if (!shift.e || !shift.s) return "";
            return (shift.i && shift.r) ? `${shift.e}-${shift.i} / ${shift.r}-${shift.s}` : `${shift.e}-${shift.s}`;
          }).filter(x => x).join(" | ");
          setField(`seg_f${i}`, hSemana);

          const formatWeekend = (dia: DayKey) => {
            const shift = farma.shifts[dia];
            if (!shift.e || !shift.s) return "";
            return (shift.i && shift.r) ? `${shift.e}-${shift.i} / ${shift.r}-${shift.s}` : `${shift.e}-${shift.s}`;
          };

          setField(`sab_f${i}`, formatWeekend('sab'));
          setField(`dom_f${i}`, formatWeekend('dom'));
        }
      }

      const finalPdfBytes = await pdfDoc.save();
      const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = "Escala_Preenchida.pdf";
      link.click();
      
      if (confirm("Download concluído. Deseja ser direcionado ao site GOV.BR para assinatura eletrônica?")) {
        window.open("https://www.gov.br/pt-br/servicos/assinatura-eletronica?origem=maisacessado_home", "_blank");
      }
    } catch (e) {
      console.error("Erro detalhado do PDF:", e);
      let msg = "Erro desconhecido ao processar o PDF.";
      if (e instanceof Error) msg = e.message;
      alert(`Falha na geração do PDF: ${msg}\n\nDica: Verifique se o arquivo 'public/modelo.pdf' existe e está com o nome correto.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen p-4 md:p-8 lg:p-12">
      <div className="bg-atmosphere" />
      
      <div className="max-w-6xl mx-auto space-y-8">
        <Header 
          qtd={qtd} 
          setQtd={setQtd} 
          onValidate={handleValidate} 
          onClear={handleClear}
          storeInfo={storeInfo}
          setStoreInfo={setStoreInfo}
        />

        <StoreHoursTable data={storeHours} onChange={setStoreHours} />

        <div className="grid grid-cols-1 gap-6">
          {farmas.slice(0, qtd).map((farma, index) => (
            <FarmaCard 
              key={farma.id} 
              data={farma} 
              onChange={(data) => updateFarma(index, data)} 
            />
          ))}
        </div>

        <ValidationSummary 
          result={result} 
          onGeneratePDF={generatePDF} 
          isGenerating={loading} 
        />
      </div>

      <footer className="mt-12 text-center text-white/20 text-[10px] uppercase tracking-[0.2em] pb-8">
        © 2026 Glass Escala Pro • iOS Aesthetics Engine
      </footer>
    </main>
  );
}
