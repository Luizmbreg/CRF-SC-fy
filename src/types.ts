export type DayKey = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

export const DAYS: { key: DayKey; label: string }[] = [
  { key: 'seg', label: 'SEG' },
  { key: 'ter', label: 'TER' },
  { key: 'qua', label: 'QUA' },
  { key: 'qui', label: 'QUI' },
  { key: 'sex', label: 'SEX' },
  { key: 'sab', label: 'SÁB' },
  { key: 'dom', label: 'DOM' },
];

export interface FarmaShift {
  e: string; // Entrada
  i: string; // Intervalo
  r: string; // Retorno
  s: string; // Saída
}

export interface FarmaData {
  id: number;
  nome: string;
  crf: string;
  shifts: Record<DayKey, FarmaShift>;
}

export interface StoreHours {
  abertura: Record<DayKey, string>;
  intervalo: Record<DayKey, string>;
  retorno: Record<DayKey, string>;
  fechamento: Record<DayKey, string>;
}

export interface ValidationResult {
  totalHours: number[];
  lacunas: string[];
  alertasClt: string[];
  avisos: string[];
  isValid: boolean;
}
