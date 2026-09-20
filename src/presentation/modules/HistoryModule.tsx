import React, { useState, useMemo } from 'react';
import {
  History as HistoryIcon,
  Search,
  Star,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Sigma,
  Scale,
  Atom,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import type { CalculationType, HistoryItem } from '../../types';

export const HistoryModule: React.FC = () => {
  const { history, removeHistoryItem, togglePinHistoryItem } = useAppStore(
    useShallow((s) => ({
      history: s.history,
      removeHistoryItem: s.removeHistoryItem,
      togglePinHistoryItem: s.togglePinHistoryItem,
    }))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | CalculationType | 'pinned'>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered and sorted history items
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // Type Filter
      if (typeFilter === 'pinned' && !item.isPinned) return false;
      if (typeFilter !== 'all' && typeFilter !== 'pinned' && item.type !== typeFilter) return false;

      // Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesSummary = item.summary.toLowerCase().includes(query);
        const matchesDetails = item.details.toLowerCase().includes(query);
        return matchesTitle || matchesSummary || matchesDetails;
      }

      return true;
    });
  }, [history, typeFilter, searchQuery]);

  const handleCopy = (item: HistoryItem) => {
    const text = `${item.title}\n${item.summary}\n\nPasso a passo:\n${item.details}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-24 md:pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-5 rounded-3xl bg-gradient-to-r from-slate-900/10 via-indigo-900/10 to-slate-900/10 dark:from-slate-800/40 dark:to-indigo-950/40 border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <HistoryIcon className="text-indigo-600 dark:text-indigo-400" /> Histórico Local de Cálculos
          </h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Seus últimos cálculos salvos no dispositivo, com busca e favoritos.
          </p>
        </div>

        <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 self-start md:self-auto">
          {history.length} cálculo{history.length === 1 ? '' : 's'} armazenado{history.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 md:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1 flex items-center">
          <Search size={18} className="absolute left-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por fórmula, equação ou data..."
            aria-label="Pesquisar por fórmula, equação ou data"
            className="w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 touch-manipulation"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { id: 'all', label: 'Todos' },
              { id: 'pinned', label: 'Favoritos', icon: <Star size={12} className="fill-amber-400 text-amber-500" /> },
              { id: 'bhaskara', label: 'Bhaskara', icon: <Sigma size={12} /> },
              { id: 'regra_simples', label: 'Regra de 3', icon: <Scale size={12} /> },
              { id: 'physics', label: 'Física', icon: <Atom size={12} /> },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setTypeFilter(filter.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all touch-target ${
                typeFilter === filter.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {'icon' in filter && filter.icon}
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      <div className="flex flex-col gap-3">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 flex flex-col items-center justify-center">
            <Clock size={40} className="text-slate-300 dark:text-slate-700 mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              Nenhum cálculo encontrado
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Faça um cálculo na calculadora de Bhaskara ou Regra de Três e toque em "Salvar no Histórico".
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isExpanded = expandedItemId === item.id;
            const dateStr = new Date(item.timestamp).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  item.isPinned
                    ? 'border-amber-300/80 dark:border-amber-700/60 bg-amber-50/20 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'
                }`}
              >
                {/* Item Summary Bar */}
                <div className="p-4 flex items-start justify-between gap-3">
                  <div
                    className="flex-1 cursor-pointer select-none"
                    onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        {item.type === 'bhaskara' ? 'Bhaskara' : item.type === 'physics' ? 'Física' : 'Regra de Três'}
                      </span>
                      <span className="text-[11px] text-slate-400">{dateStr}</span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                      {item.title}
                    </h4>
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
                      {item.summary}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {/* Pin button */}
                    <button
                      type="button"
                      onClick={() => togglePinHistoryItem(item.id)}
                      className={`p-2 rounded-xl transition-colors touch-target flex items-center justify-center ${
                        item.isPinned
                          ? 'text-amber-500 bg-amber-100/60 dark:bg-amber-950/60'
                          : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={item.isPinned ? 'Desafixar dos favoritos' : 'Fixar nos favoritos'}
                      aria-label="Favoritar"
                    >
                      <Star size={16} className={item.isPinned ? 'fill-amber-400' : ''} />
                    </button>

                    {/* Copy button */}
                    <button
                      type="button"
                      onClick={() => handleCopy(item)}
                      className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors touch-target flex items-center justify-center"
                      title="Copiar cálculo"
                      aria-label="Copiar"
                    >
                      {copiedId === item.id ? (
                        <Check size={16} className="text-emerald-500" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>

                    {/* Expand Details button */}
                    <button
                      type="button"
                      onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                      className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors touch-target flex items-center justify-center"
                      aria-label="Ver detalhes"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => removeHistoryItem(item.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors touch-target flex items-center justify-center"
                      title="Excluir do histórico"
                      aria-label="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
                    <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                      {item.details}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
