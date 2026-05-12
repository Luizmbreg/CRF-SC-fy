import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { StoreHoursTable } from './components/StoreHoursTable';
import { FarmaCard } from './components/FarmaCard';
import { ValidationSummary } from './components/ValidationSummary';
import { FarmaData, StoreHours, ValidationResult, DAYS, DayKey } from './types';
import { validateSchedule } from './utils';
import { PDF_MODEL_BASE64 } from './constants';
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
      
      // Lista de possíveis locais para o arquivo PDF
      const possiblePaths = ['/modelo.pdf', '/modelo.pdf.pdf', 'modelo.pdf'];
      
      for (const path of possiblePaths) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            pdfBytes = new Uint8Array(arrayBuffer);
            console.log(`Sucesso ao carregar PDF de: ${path}`);
            break;
          }
        } catch (e) {
          console.warn(`Tentativa falhou para ${path}:`, e);
        }
      }

      if (!pdfBytes) {
        console.warn("Nenhum arquivo PDF encontrado na pasta public, tentando Base64...");
        // Fallback para Base64 se o arquivo não existir
        if (!PDF_MODEL_BASE64 || PDF_MODEL_BASE64.length < 100) {
          throw new Error("O modelo Base64 em 'constants.ts' está vazio ou é muito curto. Carregue o arquivo 'modelo.pdf' na pasta 'public'.");
        }
        
        try {
          let cleanBase64 = PDF_MODEL_BASE64.trim().replace(/\s/g, '');
          while (cleanBase64.length % 4 !== 0) {
            cleanBase64 += '=';
          }
          const binaryString = atob(cleanBase64);
          pdfBytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            pdfBytes[i] = binaryString.charCodeAt(i);
          }
        } catch (atobError) {
          throw new Error("O código Base64 em 'constants.ts' é inválido. Certifique-se de que o arquivo 'public/modelo.pdf' existe e está com o nome correto.");
        }
      }
      
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      const setField = (name: string, value: string) => {
        try {
          const field = form.getTextField(name);
          field.setText(value || "");
        } catch (e) {
          console.warn(`Field ${name} not found in PDF`);
        }
      };

      // Set Date
      const hoje = new Date();
      const dia = String(hoje.getDate()).padStart(2, '0');
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const ano = String(hoje.getFullYear());
      
      try {
        firstPage.drawText(dia, { x: 432, y: 195, size: 10 });
        firstPage.drawText(mes, { x: 450, y: 195, size: 10 });
        firstPage.drawText(ano, { x: 469, y: 195, size: 10 });
      } catch (e) {
        console.warn("Could not draw date on first page", e);
      }

      setField("REG_FL", storeInfo.filial);
      setField("RL", storeInfo.rl);
      setField("CPF_RL", storeInfo.cpf);
      setField("CNPJ", storeInfo.cnpj);

      // Formatação e preenchimento dos horários da filial no PDF
      const formatStoreRow = (day: DayKey) => {
        const a = storeHours.abertura[day];
        const i = storeHours.intervalo[day];
        const r = storeHours.retorno[day];
        const f = storeHours.fechamento[day];
        if (!a || !f) return "";
        return (i && r) ? `${a}-${i} / ${r}-${f}` : `${a}-${f}`;
      };

      // Tenta nomes com barra primeiro (comum no CRF-SC), depois sem
      const setMultiField = (names: string[], value: string) => {
        for (const name of names) {
          try {
            const field = form.getTextField(name);
            field.setText(value || "");
            return;
          } catch (e) {
            // tenta o próximo nome
          }
        }
        console.warn(`Campo ${names[0]} não encontrado.`);
      };

      setMultiField(["SEG/SEX", "SEG_SEX", "Seg/Sex", "seg/sex"], formatStoreRow('seg'));
      setMultiField(["SAB", "sab", "Sab"], formatStoreRow('sab'));
      setMultiField(["DOM/FER", "DOM_FER", "Dom/Fer", "dom/fer"], formatStoreRow('dom'));

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
      alert(`Falha na geração do PDF: ${msg}\n\nDica: Verifique se o arquivo 'public/modelo.pdf' existe ou se o Base64 em constants.ts está correto.`);
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
