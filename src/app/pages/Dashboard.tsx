import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Gauge,
  Clock,
  Timer,
  Activity,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  FlaskConical,
  Radio,
} from "lucide-react";
import {
  useMachine,
  MachineState,
  SHIFT_SCHEDULE,
  getShiftBounds,
} from "../context/MachineContext";
import { useEvents } from "../context/EventsContext";

// ─── types & configs ─────────────────────────────────────────────────────────
type StateCfg = { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle };
const STATE_CFG: Record<MachineState, StateCfg> = {
  running:   { label: "En Marche",      color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle },
  slow:      { label: "Ralentissement", color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   icon: TrendingDown },
  stopped:   { label: "Arrêt Machine",  color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30",     icon: XCircle },
  emergency: { label: "ARRÊT URGENCE",  color: "text-red-300",     bg: "bg-red-600/20",     border: "border-red-500/60",     icon: AlertTriangle },
};

const EVENT_DETAILS: Record<MachineState, string> = {
  running:   "Reprise normale",
  slow:      "Vitesse en dessous du seuil nominal — ralentissement détecté automatiquement",
  stopped:   "Arrêt planifié fin de shift — arrêt normal cycle de production",
  emergency: "Signal arrêt d'urgence activé — intervention sécurité requise",
};

// ─── shift timeline component ────────────────────────────────────────────────
interface TimelineEvent { start: Date; end: Date | null; state: MachineState }

function ShiftTimeline({
  segments, shiftStart, shiftEnd,
}: { segments: TimelineEvent[]; shiftStart: Date; shiftEnd: Date }) {
  const now = new Date();
  const total = shiftEnd.getTime() - shiftStart.getTime();
  const elapsed = Math.min(now.getTime() - shiftStart.getTime(), total);
  const elapsedPct = Math.max(0, Math.min(100, (elapsed / total) * 100));

  const stateColor: Record<MachineState, string> = {
    running: "bg-emerald-500",
    slow: "bg-amber-500",
    stopped: "bg-red-500",
    emergency: "bg-red-700",
  };

  const ticks: { pct: number; label: string }[] = [];
  for (let h = 0; h <= 8; h++) {
    ticks.push({ pct: (h / 8) * 100, label: `+${h}h` });
  }

  return (
    <div className="space-y-2">
      <div className="relative h-7 bg-[#0b1120] rounded-full overflow-hidden border border-[#1e3a5f]/30">
        <div style={{ width: `${elapsedPct}%` }} className="absolute inset-y-0 left-0 bg-[#1e3a5f]/30" />
        <div style={{ width: `${elapsedPct}%` }} className="absolute inset-y-0 left-0 bg-emerald-500/20" />

        {segments.map((seg, i) => {
          const segStart = Math.max(0, (seg.start.getTime() - shiftStart.getTime()) / total * 100);
          const segEnd = seg.end
            ? (seg.end.getTime() - shiftStart.getTime()) / total * 100
            : elapsedPct;
          const width = Math.max(0.4, segEnd - segStart);

          if (seg.state === "running") return null;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              title={`${STATE_CFG[seg.state].label}`}
              style={{ left: `${segStart}%`, width: `${width}%` }}
              className={`absolute inset-y-0 ${stateColor[seg.state]} opacity-90`}
            />
          );
        })}

        <motion.div
          style={{ left: `${elapsedPct}%` }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute inset-y-0 w-0.5 bg-white/80"
        />
      </div>
      <div className="relative h-3">
        {ticks.map((t) => (
          <span
            key={t.pct}
            style={{ left: `${t.pct}%` }}
            className="absolute text-[9px] text-gray-600 -translate-x-1/2"
          >
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── selector ────────────────────────────────────────────────────────────────
function Selector<T extends string>({
  label, value, options, onChange,
}: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-[#0d1526] border border-[#1e3a5f]/50 rounded-lg px-3 py-2 text-xs text-white hover:border-gray-500 transition-colors min-w-[160px]"
      >
        <span className="text-gray-400">{label} :</span>
        <span className="flex-1 text-left">{current?.label}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute top-full mt-1 left-0 bg-[#0d1526] border border-[#1e3a5f]/60 rounded-xl shadow-2xl z-20 min-w-[200px] overflow-hidden"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${
                  opt.value === value
                    ? "bg-red-500/10 text-red-400"
                    : "text-gray-300 hover:bg-white/5"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── main dashboard ───────────────────────────────────────────────────────────
export function Dashboard() {
  const {
    machineState, setMachineState, isManualMode, manualSpeedHz,
    activeShift, setActiveShift, thresholds,
  } = useMachine();
  const { addEvent, closeLastEvent } = useEvents();

  // KPI state
  const [speedHz, setSpeedHz] = useState(thresholds.nominalHz);
  const [downtimeMin, setDowntimeMin] = useState(0);
  const [netTimeMin, setNetTimeMin] = useState(0);
  const [availability, setAvailability] = useState(100);

  // Charts
  const [speedData, setSpeedData] = useState<{ t: string; hz: number; target: number; min: number }[]>(() => {
    const d = [];
    let s = thresholds.nominalHz;
    for (let i = 0; i < 40; i++) {
      s = Math.max(38, Math.min(48, s + (Math.random() - 0.45) * 1.5));
      d.push({ t: `${i}`, hz: parseFloat(s.toFixed(1)), target: thresholds.nominalHz, min: thresholds.speedMinHz });
    }
    return d;
  });

  // Timeline segments
  const [timeline, setTimeline] = useState<{ start: Date; end: Date | null; state: MachineState }[]>([
    { start: getShiftBounds(activeShift).start, end: null, state: "running" },
  ]);

  // Refs
  const tickRef = useRef(40);
  const prevStateRef = useRef<MachineState>(machineState);

  // Reset on shift change
  useEffect(() => {
    const bounds = getShiftBounds(activeShift);
    setTimeline([{ start: bounds.start, end: null, state: "running" }]);
    setDowntimeMin(0); setNetTimeMin(0);
  }, [activeShift]);

  // Event recording on state change
  useEffect(() => {
    const prev = prevStateRef.current;
    if (prev === machineState) return;
    prevStateRef.current = machineState;

    if (machineState !== "running") {
      addEvent({
        event_type:
          machineState === "emergency" ? "ARRET_URGENCE"
          : machineState === "stopped" ? "ARRET_FIN_SHIFT"
          : "RALENTISSEMENT",
        speed_hz: speedHz,
        shift: activeShift,
        details: EVENT_DETAILS[machineState],
      });
      setTimeline((prev) => {
        const closed = prev.map((s, i) => i === prev.length - 1 ? { ...s, end: new Date() } : s);
        return [...closed, { start: new Date(), end: null, state: machineState }];
      });
    } else {
      closeLastEvent();
      setTimeline((prev) => {
        const closed = prev.map((s, i) => i === prev.length - 1 ? { ...s, end: new Date() } : s);
        return [...closed, { start: new Date(), end: null, state: "running" }];
      });
    }
  }, [machineState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-simulation (if not manual)
  useEffect(() => {
    if (isManualMode) return;
    const interval = setInterval(() => {
      const r = Math.random();
      if (r < 0.03) setMachineState("emergency");
      else if (r < 0.09) setMachineState("stopped");
      else if (r < 0.18) setMachineState("slow");
      else setMachineState("running");
    }, 4000);
    return () => clearInterval(interval);
  }, [isManualMode, setMachineState]);

  // KPI simulation tick
  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current += 1;
      const t = tickRef.current;

      const targetHz =
        isManualMode && manualSpeedHz !== null ? manualSpeedHz
        : machineState === "running" ? thresholds.nominalHz
        : machineState === "slow" ? thresholds.speedRalentHz - 1
        : 0;

      const noise = machineState === "running" ? (Math.random() - 0.45) * 1.2 : (Math.random() - 0.5) * 0.5;
      const newHz = Math.max(0, Math.min(50, speedHz + (targetHz - speedHz) * 0.3 + noise));
      setSpeedHz(parseFloat(newHz.toFixed(1)));

      if (machineState === "running") {
        setNetTimeMin((n) => n + 1.5 / 60);
      } else {
        setDowntimeMin((d) => d + 1.5 / 60);
      }

      setAvailability(() => {
        const total = netTimeMin + downtimeMin + 0.001;
        return parseFloat(((netTimeMin / total) * 100).toFixed(1));
      });

      setSpeedData((prev) => {
        const last = prev[prev.length - 1]?.hz ?? thresholds.nominalHz;
        const next = Math.max(0, Math.min(50, last + (targetHz - last) * 0.35 + noise));
        return [
          ...prev.slice(-39),
          { t: `${t}`, hz: parseFloat(next.toFixed(1)), target: thresholds.nominalHz, min: thresholds.speedMinHz },
        ];
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [machineState, isManualMode, manualSpeedHz, speedHz, netTimeMin, downtimeMin, thresholds]);

  const cfg = STATE_CFG[machineState];
  const StateIcon = cfg.icon;
  const shiftBounds = getShiftBounds(activeShift);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="p-4 md:p-5 space-y-4 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white">Dashboard Temps Réel</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Shift {SHIFT_SCHEDULE[activeShift].label} · Poste démarré à {formatTime(shiftBounds.start)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isManualMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/30 px-3 py-1.5 rounded-lg"
            >
              <FlaskConical className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs text-violet-400">Mode Simulation</span>
            </motion.div>
          )}
          <Selector
            label="Shift"
            value={activeShift}
            options={[
              { value: "MATIN", label: "Matin · 06:00–14:00" },
              { value: "APRES-MIDI", label: "Après-midi · 14:00–22:00" },
              { value: "NUIT", label: "Nuit · 22:00–06:00" },
            ]}
            onChange={setActiveShift}
          />
          <div className="flex items-center gap-1.5 ml-1">
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="w-2 h-2 bg-red-500 rounded-full"
            />
            <span className="text-xs text-red-400">LIVE</span>
          </div>
        </div>
      </div>

      {/* Machine state banner */}
      <motion.div
        key={machineState}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className={`rounded-2xl border p-4 flex items-center gap-4 ${cfg.bg} ${cfg.border}`}
      >
        <motion.div
          animate={
            machineState === "emergency"
              ? { rotate: [0, -8, 8, -8, 0], scale: [1, 1.15, 1] }
              : machineState === "running"
              ? { scale: [1, 1.05, 1] }
              : {}
          }
          transition={{
            repeat: Infinity,
            duration: machineState === "emergency" ? 0.6 : 2.5,
          }}
        >
          <StateIcon className={`w-8 h-8 ${cfg.color}`} />
        </motion.div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-base ${cfg.color}`}>{cfg.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} border ${cfg.border} ${cfg.color}`}>
              {machineState === "running" ? "Production normale" : machineState === "slow" ? "Performance réduite" : "Intervention requise"}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {machineState === "running" && "Tous les systèmes nominaux — NORDAC 500E & Altivar 71 opérationnels"}
            {machineState === "slow" && `Vitesse actuelle ${speedHz.toFixed(1)} Hz — seuil nominal : ${thresholds.nominalHz} Hz`}
            {machineState === "stopped" && "NORDAC 500E — code erreur E-01 · Vitesse = 0 Hz"}
            {machineState === "emergency" && "⚠ Bouton d'arrêt d'urgence activé — sécurité prioritaire"}
          </p>
        </div>
        {machineState === "running" && (
          <div className="flex items-center gap-1.5 shrink-0 hidden sm:flex">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400">Normal</span>
          </div>
        )}
        <div className="shrink-0 text-right hidden md:block">
          <p className="text-xs text-gray-500">Fin de poste</p>
          <p className="text-sm font-mono text-white">{formatTime(shiftBounds.end)}</p>
        </div>
      </motion.div>

      {/* KPI cards — 4 indicateurs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Vitesse Actuelle",
            value: speedHz.toFixed(1),
            unit: "Hz",
            icon: Gauge,
            color: speedHz >= thresholds.speedRalentHz ? "text-cyan-400" : speedHz >= thresholds.speedMinHz ? "text-amber-400" : "text-red-400",
            sub: `/ ${thresholds.nominalHz} Hz nominal`,
            trend: speedHz >= thresholds.speedRalentHz,
          },
          {
            label: "Temps d'Arrêt",
            value: Math.floor(downtimeMin),
            unit: "min",
            icon: Clock,
            color: downtimeMin > 30 ? "text-red-400" : "text-amber-400",
            sub: `${((downtimeMin / Math.max(1, downtimeMin + netTimeMin)) * 100).toFixed(1)}% du shift`,
            trend: false,
          },
          {
            label: "Disponibilité",
            value: availability.toFixed(1),
            unit: "%",
            icon: Activity,
            color: availability >= 90 ? "text-emerald-400" : availability >= 80 ? "text-amber-400" : "text-red-400",
            sub: "Taux = Tps net / Total",
            trend: availability >= 85,
          },
          {
            label: "Temps Net Prod.",
            value: Math.floor(netTimeMin),
            unit: "min",
            icon: Timer,
            color: "text-violet-400",
            sub: `${Math.floor(netTimeMin / 60)}h ${Math.floor(netTimeMin % 60)}min effectifs`,
            trend: true,
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#0d1526] border border-[#1e3a5f]/50 rounded-xl p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              {kpi.trend ? (
                <TrendingUp className="w-3 h-3 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
            </div>
            <motion.p
              key={String(kpi.value)}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className={`text-2xl font-mono ${kpi.color}`}
            >
              {kpi.value}
            </motion.p>
            <p className="text-[10px] text-gray-500">{kpi.unit}</p>
            <p className="text-[10px] text-gray-400 mt-1.5 leading-tight">{kpi.label}</p>
            <p className="text-[9px] text-gray-600 mt-0.5">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts — Vitesse & Timeline côte à côte */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Speed Chart */}
        <div className="bg-[#0d1526] border border-[#1e3a5f]/50 rounded-2xl p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-white text-sm">Variation de Vitesse</h3>
              <p className="text-xs text-gray-400">Temps réel · NORDAC 500E / Altivar 71 (Hz)</p>
            </div>
            <span className={`text-sm font-mono px-2 py-1 rounded-lg ${
              speedHz >= thresholds.speedRalentHz ? "text-cyan-400 bg-cyan-400/10" : "text-amber-400 bg-amber-400/10"
            }`}>
              {speedHz.toFixed(1)} Hz
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={speedData}>
              <defs>
                <linearGradient id="hzGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f25" />
              <XAxis dataKey="t" hide />
              <YAxis
                tick={{ fill: "#4b5563", fontSize: 9 }}
                domain={[0, 52]}
                tickCount={6}
                tickFormatter={(v) => `${v}Hz`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#0d1526", border: "1px solid #1e3a5f", borderRadius: 10, fontSize: 11 }}
                labelStyle={{ color: "#9ca3af" }}
                itemStyle={{ color: "#06b6d4" }}
                formatter={(v: number) => [`${v} Hz`, "Vitesse"]}
              />
              <ReferenceLine y={thresholds.nominalHz} stroke="#10b981" strokeDasharray="4 4" label={{ value: `Nom. ${thresholds.nominalHz}Hz`, fill: "#10b981", fontSize: 9, position: "right" }} />
              <ReferenceLine y={thresholds.speedRalentHz} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Ralent. ${thresholds.speedRalentHz}Hz`, fill: "#f59e0b", fontSize: 9, position: "right" }} />
              <ReferenceLine y={thresholds.speedMinHz} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `Min ${thresholds.speedMinHz}Hz`, fill: "#ef4444", fontSize: 9, position: "right" }} />
              <Area
                type="monotone"
                dataKey="hz"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#hzGrad)"
                isAnimationActive={false}
                name="Vitesse (Hz)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Arrêts timeline */}
        <div className="bg-[#0d1526] border border-[#1e3a5f]/50 rounded-2xl p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-white text-sm">Timeline des Arrêts</h3>
              <p className="text-xs text-gray-400">
                Shift en cours · {formatTime(shiftBounds.start)} → {formatTime(shiftBounds.end)}
              </p>
            </div>
            <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded-lg">
              {Math.floor(downtimeMin)} min d'arrêt
            </span>
          </div>
          <ShiftTimeline
            segments={timeline}
            shiftStart={shiftBounds.start}
            shiftEnd={shiftBounds.end}
          />

          {/* Legend */}
          <div className="flex gap-4 mt-4 flex-wrap">
            {[
              { color: "bg-emerald-500", label: "En marche" },
              { color: "bg-amber-500", label: "Ralentissement" },
              { color: "bg-red-500", label: "Arrêt fin shift" },
              { color: "bg-red-700", label: "Urgence" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                <span className="text-[10px] text-gray-400">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Equipment micro-status */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#1e3a5f]/30">
            {[
              { name: "NORDAC 500E", ok: machineState !== "stopped" && machineState !== "emergency", val: machineState === "running" ? `${speedHz.toFixed(1)} Hz` : "ERREUR" },
              { name: "S7-1200", ok: true, val: "Connecté" },
              { name: "Altivar 71", ok: machineState !== "emergency", val: machineState === "emergency" ? "URGENCE" : "Normal" },
            ].map((eq) => (
              <div key={eq.name} className="text-center">
                <motion.div
                  animate={!eq.ok ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className={`w-2 h-2 rounded-full mx-auto mb-1 ${eq.ok ? "bg-emerald-500" : "bg-red-500"}`}
                />
                <p className="text-[9px] text-gray-400">{eq.name}</p>
                <p className={`text-[9px] font-mono ${eq.ok ? "text-emerald-400" : "text-red-400"}`}>{eq.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
