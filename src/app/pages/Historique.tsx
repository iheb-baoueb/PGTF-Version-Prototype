import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileDown,
  Search,
  Filter,
  AlertTriangle,
  XCircle,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
} from "lucide-react";
import { useEvents, EventType, PGTFEvent } from "../context/EventsContext";

// ─── config ───────────────────────────────────────────────────────────────────
const EVENT_CFG: Record<EventType, { label: string; icon: typeof AlertTriangle; color: string; bg: string; border: string }> = {
  ARRET_FIN_SHIFT: { label: "Arrêt Fin Shift",    icon: XCircle,       color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/25" },
  ARRET_URGENCE:   { label: "Arrêt d'Urgence",    icon: AlertTriangle, color: "text-rose-300",   bg: "bg-rose-600/15",   border: "border-rose-500/50" },
  BAISSE_VITESSE:  { label: "Baisse de Vitesse",  icon: TrendingDown,  color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/25" },
  RALENTISSEMENT:  { label: "Ralentissement",     icon: TrendingDown,  color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/25" },
};

const PAGE_SIZE = 12;

// ─── CSV export ───────────────────────────────────────────────────────────────
function exportCSV(events: PGTFEvent[]) {
  const sep = ";";
  const headers = ["ID", "Date", "Heure", "Type", "Durée (min)", "Vitesse (Hz)", "Shift", "Détails"];
  const rows = events.map((e) => [
    e.id,
    e.timestamp.toLocaleDateString("fr-FR"),
    e.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    e.event_type,
    e.duration_min !== null ? e.duration_min.toFixed(1) : "En cours",
    e.speed_hz.toFixed(1),
    e.shift,
    `"${e.details.replace(/"/g, "'")}"`,
  ].join(sep));

  const csv = "﻿" + [headers.join(sep), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `historique_pgtf_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── component ────────────────────────────────────────────────────────────────
export function Historique() {
  const { events } = useEvents();

  // Filters
  const [search, setSearch] = useState("");
  const [filterShift, setFilterShift] = useState<string>("");
  const [filterHeure, setFilterHeure] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (filterShift && e.shift !== filterShift) return false;
      if (filterType && e.event_type !== filterType) return false;
      if (filterHeure !== "" && e.timestamp.getHours() !== parseInt(filterHeure)) return false;
      if (filterDate) {
        const d = e.timestamp.toLocaleDateString("fr-CA");
        if (d !== filterDate) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!e.details.toLowerCase().includes(q) && !e.event_type.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [events, filterShift, filterHeure, filterType, filterDate, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasFilters = !!(filterShift || filterHeure || filterType || filterDate || search);

  const clearFilters = () => {
    setFilterShift(""); setFilterHeure(""); setFilterType(""); setFilterDate(""); setSearch(""); setPage(1);
  };

  // Stats
  const stats = useMemo(() => ({
    total: filtered.length,
    arretFinShift: filtered.filter((e) => e.event_type === "ARRET_FIN_SHIFT").length,
    arretUrgence: filtered.filter((e) => e.event_type === "ARRET_URGENCE").length,
    baisseVitesse: filtered.filter((e) => e.event_type === "BAISSE_VITESSE").length,
    ralent: filtered.filter((e) => e.event_type === "RALENTISSEMENT").length,
    dureeTotal: filtered.reduce((acc, e) => acc + (e.duration_min ?? 0), 0),
    enCours: filtered.filter((e) => e.duration_min === null).length,
  }), [filtered]);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const formatHeure = (d: Date) =>
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="p-4 md:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white">Historique des Événements</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {filtered.length} événement(s) {hasFilters ? "filtré(s)" : "enregistré(s)"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl text-xs hover:bg-emerald-500/20 transition-all"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "Total",              value: stats.total,          color: "text-white" },
          { label: "Arrêts Fin Shift",   value: stats.arretFinShift,  color: "text-red-400" },
          { label: "Arrêts Urgence",     value: stats.arretUrgence,   color: "text-rose-300" },
          { label: "Baisses de Vitesse", value: stats.baisseVitesse,  color: "text-amber-400" },
          { label: "Ralentissements",    value: stats.ralent,         color: "text-orange-400" },
          { label: "En cours",           value: stats.enCours,        color: "text-cyan-400" },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0d1526] border border-[#1e3a5f]/50 rounded-xl p-3 text-center"
          >
            <p className={`text-xl font-mono ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500 mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-[#0d1526] border border-[#1e3a5f]/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <p className="text-sm text-white">Filtres</p>
          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
              <X className="w-3 h-3" />
              Effacer
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Rechercher..."
              className="w-full bg-[#0b1120] border border-[#1e3a5f]/40 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500/40 transition-colors"
            />
          </div>

          {/* Shift */}
          <select
            value={filterShift}
            onChange={(e) => { setFilterShift(e.target.value); setPage(1); }}
            className="bg-[#0b1120] border border-[#1e3a5f]/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500/40 transition-colors"
          >
            <option value="">Tous les shifts</option>
            <option value="MATIN">Matin</option>
            <option value="APRES-MIDI">Après-midi</option>
            <option value="NUIT">Nuit</option>
          </select>

          {/* Type */}
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="bg-[#0b1120] border border-[#1e3a5f]/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500/40 transition-colors"
          >
            <option value="">Tous les types</option>
            <option value="ARRET_FIN_SHIFT">Arrêt Fin Shift</option>
            <option value="ARRET_URGENCE">Arrêt d'Urgence</option>
            <option value="BAISSE_VITESSE">Baisse de Vitesse</option>
            <option value="RALENTISSEMENT">Ralentissement</option>
          </select>

          {/* Date */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
            className="bg-[#0b1120] border border-[#1e3a5f]/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500/40 transition-colors"
          />

          {/* Heure */}
          <select
            value={filterHeure}
            onChange={(e) => { setFilterHeure(e.target.value); setPage(1); }}
            className="bg-[#0b1120] border border-[#1e3a5f]/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500/40 transition-colors sm:col-span-2 lg:col-span-1"
          >
            <option value="">Toutes les heures</option>
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={String(h)}>{String(h).padStart(2, "0")}h00</option>
            ))}
          </select>
        </div>
      </div>

      {/* Events table */}
      <div className="bg-[#0d1526] border border-[#1e3a5f]/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e3a5f]/50">
                {["#", "Date", "Heure", "Type d'Événement", "Durée", "Vitesse", "Shift", "Détails"].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-[11px] text-gray-500 font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {paginated.map((event, i) => {
                  const c = EVENT_CFG[event.event_type];
                  const Icon = c.icon;
                  const isOngoing = event.duration_min === null;

                  return (
                    <motion.tr
                      key={event.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-[#1e3a5f]/20 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-3 py-3 text-[10px] text-gray-600 font-mono">{event.id}</td>
                      <td className="px-3 py-3 text-xs text-gray-300 font-mono whitespace-nowrap">
                        {formatDate(event.timestamp)}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-400 font-mono whitespace-nowrap">
                        {formatHeure(event.timestamp)}
                      </td>
                      <td className="px-3 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] ${c.bg} ${c.border} ${c.color}`}>
                          <Icon className="w-3 h-3 shrink-0" />
                          {c.label}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {isOngoing ? (
                          <div className="flex items-center gap-1.5">
                            <motion.div
                              animate={{ scale: [1, 1.4, 1] }}
                              transition={{ repeat: Infinity, duration: 0.8 }}
                              className="w-1.5 h-1.5 bg-red-500 rounded-full"
                            />
                            <span className="text-xs text-red-400">En cours</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-300 font-mono">{event.duration_min?.toFixed(1)} min</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs font-mono text-cyan-400 whitespace-nowrap">
                        {event.speed_hz.toFixed(1)} Hz
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          event.shift === "MATIN" ? "bg-amber-500/10 text-amber-400" :
                          event.shift === "APRES-MIDI" ? "bg-orange-500/10 text-orange-400" :
                          "bg-blue-500/10 text-blue-400"
                        }`}>
                          {event.shift}
                        </span>
                      </td>
                      <td className="px-3 py-3 max-w-[240px]">
                        <p className="text-[10px] text-gray-400 leading-tight line-clamp-2">{event.details}</p>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <p className="text-gray-500 text-sm">Aucun événement trouvé</p>
                    {hasFilters && (
                      <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 mt-2 transition-colors">
                        Effacer les filtres
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1e3a5f]/30">
            <p className="text-xs text-gray-500">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-[#1e3a5f]/40 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs transition-colors ${
                        p === page ? "bg-red-600/20 border border-red-600/40 text-red-400" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-[#1e3a5f]/40 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
