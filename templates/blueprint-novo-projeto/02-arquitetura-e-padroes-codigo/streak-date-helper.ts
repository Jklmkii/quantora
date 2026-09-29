/**
 * Retorna a data no calendário local do dispositivo no formato YYYY-MM-DD.
 * ⚠️ NUNCA use `new Date().toISOString().split('T')[0]`, pois fusos UTC-negativos (ex: Brasil UTC-3)
 * viram o dia às 21:00, quebrando streaks e desafios diários.
 */
export function getDeviceLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retorna a diferença de dias entre duas datas YYYY-MM-DD em tempo local.
 */
export function getDaysDifference(dateStr1: string, dateStr2: string): number {
  if (!dateStr1 || !dateStr2) return 999;
  const d1 = new Date(dateStr1 + 'T00:00:00');
  const d2 = new Date(dateStr2 + 'T00:00:00');
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export interface StreakState {
  currentStreak: number;
  lastActiveDate: string;
}

/**
 * Manutenção passiva do Streak ao abrir o aplicativo:
 * - Se o usuário jogou hoje ou ontem, o streak permanece intacto.
 * - Se ficou mais de 1 dia sem atividade, o streak é expirado para 0.
 * ⚠️ Abertura passiva do app NUNCA deve incrementar o streak!
 */
export function checkStreakMaintenance(lastActiveDate: string, currentStreak: number): number {
  if (!lastActiveDate || currentStreak === 0) return 0;
  const today = getDeviceLocalDateString();
  const diff = getDaysDifference(lastActiveDate, today);

  if (diff > 1) {
    return 0; // Expirou
  }
  return currentStreak; // Mantém
}

/**
 * Incremento ativo do Streak após a conclusão de uma atividade válida:
 * - Se já concluiu hoje: mantém o valor atual sem duplicar.
 * - Se concluiu ontem (ou primeiro dia): incrementa +1.
 * - Se perdeu o dia: reinicia em 1.
 */
export function calculateStreakUpdate(
  lastActiveDate: string,
  currentStreak: number
): { newStreak: number; newDate: string } {
  const today = getDeviceLocalDateString();

  if (lastActiveDate === today) {
    return { newStreak: currentStreak, newDate: today };
  }

  const diff = getDaysDifference(lastActiveDate, today);

  if (diff === 1 || !lastActiveDate) {
    return { newStreak: currentStreak + 1, newDate: today };
  }

  return { newStreak: 1, newDate: today };
}
