import type { BossClassId } from './bossEngine';

export interface BossClassStyleSpec {
  borderClass: string;
  glowShadow: string;
  badgeBg: string;
  badgeText: string;
  bannerGradient: string;
}

export function getBossClassStyles(
  bossClass: BossClassId,
  phase: number = 1,
  isStaggered: boolean = false
): BossClassStyleSpec {
  if (isStaggered) {
    return {
      borderClass: 'border-cyan-400 ring-4 ring-cyan-400/50',
      glowShadow: 'shadow-[0_0_25px_rgba(34,211,238,0.7)]',
      badgeBg: 'bg-cyan-500/30',
      badgeText: 'text-cyan-200 border-cyan-400',
      bannerGradient: 'from-cyan-950 via-slate-900 to-slate-950',
    };
  }

  if (phase === 3) {
    return {
      borderClass: 'border-red-500 ring-4 ring-red-500/60 animate-pulse',
      glowShadow: 'shadow-[0_0_30px_rgba(239,68,68,0.8)]',
      badgeBg: 'bg-red-500/30',
      badgeText: 'text-red-200 border-red-500/60',
      bannerGradient: 'from-red-950 via-rose-950 to-slate-950',
    };
  }

  switch (bossClass) {
    case 'illusionist':
      return {
        borderClass: 'border-rose-500/60 hover:border-rose-400 ring-2 ring-rose-500/30',
        glowShadow: 'shadow-[0_0_20px_rgba(244,63,94,0.5)]',
        badgeBg: 'bg-rose-500/20',
        badgeText: 'text-rose-300 border-rose-500/40',
        bannerGradient: 'from-rose-950 via-slate-950 to-slate-900',
      };
    case 'parity_lord':
      return {
        borderClass: 'border-amber-400/60 hover:border-amber-300 ring-2 ring-amber-400/30',
        glowShadow: 'shadow-[0_0_20px_rgba(251,191,36,0.5)]',
        badgeBg: 'bg-amber-500/20',
        badgeText: 'text-amber-300 border-amber-500/40',
        bannerGradient: 'from-amber-950/70 via-indigo-950/70 to-slate-950',
      };
    case 'speed_executioner':
      return {
        borderClass: 'border-yellow-400/70 hover:border-yellow-300 ring-2 ring-yellow-400/40',
        glowShadow: 'shadow-[0_0_22px_rgba(250,204,21,0.6)]',
        badgeBg: 'bg-yellow-500/20',
        badgeText: 'text-yellow-300 border-yellow-500/40',
        bannerGradient: 'from-amber-950 via-orange-950/80 to-slate-950',
      };
    case 'glass_colossus':
      return {
        borderClass: 'border-cyan-300/70 hover:border-cyan-200 ring-2 ring-cyan-300/40',
        glowShadow: 'shadow-[0_0_22px_rgba(103,232,249,0.6)]',
        badgeBg: 'bg-cyan-500/20',
        badgeText: 'text-cyan-200 border-cyan-400/40',
        bannerGradient: 'from-cyan-950/80 via-sky-950 to-slate-950',
      };
    case 'core_engineer':
      return {
        borderClass: 'border-orange-500/70 hover:border-orange-400 ring-2 ring-orange-500/40',
        glowShadow: 'shadow-[0_0_22px_rgba(249,115,22,0.6)]',
        badgeBg: 'bg-orange-500/20',
        badgeText: 'text-orange-300 border-orange-500/40',
        bannerGradient: 'from-orange-950/80 via-stone-900 to-slate-950',
      };
    case 'operator_architect':
      return {
        borderClass: 'border-emerald-400/70 hover:border-emerald-300 ring-2 ring-emerald-400/40',
        glowShadow: 'shadow-[0_0_22px_rgba(52,211,153,0.6)]',
        badgeBg: 'bg-emerald-500/20',
        badgeText: 'text-emerald-300 border-emerald-500/40',
        bannerGradient: 'from-emerald-950/80 via-teal-950 to-slate-950',
      };
    case 'fraction_hydra':
      return {
        borderClass: 'border-lime-400/70 hover:border-lime-300 ring-2 ring-lime-400/40',
        glowShadow: 'shadow-[0_0_22px_rgba(163,230,53,0.6)]',
        badgeBg: 'bg-lime-500/20',
        badgeText: 'text-lime-300 border-lime-500/40',
        bannerGradient: 'from-lime-950/80 via-emerald-950 to-slate-950',
      };
    case 'cipher_sphinx':
      return {
        borderClass: 'border-amber-400/70 hover:border-yellow-300 ring-2 ring-amber-400/40',
        glowShadow: 'shadow-[0_0_22px_rgba(250,204,21,0.6)]',
        badgeBg: 'bg-amber-500/20',
        badgeText: 'text-yellow-200 border-amber-500/40',
        bannerGradient: 'from-yellow-950/70 via-blue-950/80 to-slate-950',
      };
    case 'negative_wraith':
      return {
        borderClass: 'border-purple-400/70 hover:border-purple-300 ring-2 ring-purple-400/40',
        glowShadow: 'shadow-[0_0_22px_rgba(192,132,252,0.6)]',
        badgeBg: 'bg-purple-500/20',
        badgeText: 'text-purple-300 border-purple-500/40',
        bannerGradient: 'from-purple-950/80 via-indigo-950 to-slate-950',
      };
    case 'time_weaver':
      return {
        borderClass: 'border-sky-300/70 hover:border-sky-200 ring-2 ring-sky-300/40',
        glowShadow: 'shadow-[0_0_22px_rgba(56,189,248,0.6)]',
        badgeBg: 'bg-sky-500/20',
        badgeText: 'text-sky-300 border-sky-500/40',
        bannerGradient: 'from-sky-950/80 via-blue-950 to-slate-950',
      };
    default:
      return {
        borderClass: 'border-purple-500/40 ring-1 ring-purple-500/20',
        glowShadow: 'shadow-purple-900/50',
        badgeBg: 'bg-purple-500/20',
        badgeText: 'text-purple-300 border-purple-500/30',
        bannerGradient: 'from-purple-950/80 via-slate-900 to-slate-950',
      };
  }
}
