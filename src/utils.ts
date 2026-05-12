import { DayKey, DAYS, FarmaData, StoreHours, ValidationResult } from './types';

export function timeToMinutes(time: string): number | null {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(min: number): string {
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function validateSchedule(
  qtd: number,
  storeHours: StoreHours,
  farmas: FarmaData[]
): ValidationResult {
  const totalHours = Array(qtd).fill(0);
  const alertasClt: string[] = [];
  const avisos: string[] = [];
  const lacunas: string[] = [];

  DAYS.forEach(({ key }) => {
    let abertura = timeToMinutes(storeHours.abertura[key]);
    let fechamento = timeToMinutes(storeHours.fechamento[key]);

    if (abertura !== null && fechamento !== null) {
      if (fechamento === 0) fechamento = 1440;
      const rangeFechamento = fechamento < abertura ? fechamento + 1440 : fechamento;
      const minutosCobertos = new Array(rangeFechamento - abertura).fill(0);

      const storeI = timeToMinutes(storeHours.intervalo[key]);
      const storeR = timeToMinutes(storeHours.retorno[key]);

      // Mark store's own interval as 'not requiring coverage'
      if (storeI !== null && storeR !== null) {
        for (let m = abertura; m < rangeFechamento; m++) {
          const mNormal = m % 1440;
          const storeEmIntervalo = storeR < storeI 
            ? (mNormal >= storeI || mNormal < storeR) 
            : (mNormal >= storeI && mNormal < storeR);
          
          if (storeEmIntervalo) {
            minutosCobertos[m - abertura] = 999; // Using 999 as a flag for 'store closed'
          }
        }
      }

      farmas.slice(0, qtd).forEach((farma, idx) => {
        const shift = farma.shifts[key];
        const e = timeToMinutes(shift.e);
        const i = timeToMinutes(shift.i);
        const r = timeToMinutes(shift.r);
        const s = timeToMinutes(shift.s);

        if (e !== null && s !== null) {
          const sEfetiva = s < e ? s + 1440 : s;
          const jornadaBruta = sEfetiva - e;

          // CLT & Break Validation
          if (i !== null && r !== null) {
            const duracaoPausa = r < i ? r + 1440 - i : r - i;
            const tempoAteIntervalo = i < e ? i + 1440 - e : i - e;

            if (tempoAteIntervalo < 120) {
              avisos.push(`F${idx + 1} ${key.toUpperCase()}: Intervalo muito cedo (${minutesToTime(tempoAteIntervalo)} de trab).`);
            }

            if (jornadaBruta > 360) {
              if (duracaoPausa < 60 || duracaoPausa > 120) {
                alertasClt.push(`F${idx + 1} ${key.toUpperCase()}: Intervalo irregular (${duracaoPausa}min) p/ jornada > 6h.`);
              }
              if (tempoAteIntervalo > 360) {
                alertasClt.push(`F${idx + 1} ${key.toUpperCase()}: Intervalo após 6h de trab.`);
              }
            } else {
              if (duracaoPausa > 15) {
                alertasClt.push(`F${idx + 1} ${key.toUpperCase()}: Intervalo (${duracaoPausa}min) excede 15min p/ jornada < 6h.`);
              }
            }
            totalHours[idx] += jornadaBruta - duracaoPausa;
          } else {
            totalHours[idx] += jornadaBruta;
          }

          // Coverage check
          for (let m = abertura; m < rangeFechamento; m++) {
            const mNormal = m % 1440;
            const dentroJornada = s < e ? (mNormal >= e || mNormal < s) : (mNormal >= e && mNormal < s);
            let dentroIntervalo = false;
            if (i !== null && r !== null) {
              dentroIntervalo = r < i ? (mNormal >= i || mNormal < r) : (mNormal >= i && mNormal < r);
            }
            if (dentroJornada && !dentroIntervalo) {
              minutosCobertos[m - abertura]++;
            }
          }
        }
      });

      // Find Gaps
      let inicioLacuna = -1;
      for (let m = 0; m < minutosCobertos.length; m++) {
        if (minutosCobertos[m] === 0 && inicioLacuna === -1) inicioLacuna = m + abertura;
        if (minutosCobertos[m] > 0 && inicioLacuna !== -1) {
          lacunas.push(`${key.toUpperCase()}: Lacuna das ${minutesToTime(inicioLacuna)} às ${minutesToTime(m + abertura)}`);
          inicioLacuna = -1;
        }
      }
      if (inicioLacuna !== -1) {
        lacunas.push(`${key.toUpperCase()}: Lacuna das ${minutesToTime(inicioLacuna)} às ${minutesToTime(rangeFechamento)}`);
      }
    }
  });

  return {
    totalHours,
    lacunas,
    alertasClt,
    avisos,
    isValid: lacunas.length === 0 && alertasClt.length === 0
  };
}
