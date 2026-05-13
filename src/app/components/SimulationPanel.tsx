import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FlaskConical, X, CheckCircle, TrendingDown, XCircle, AlertTriangle,
  Gauge, RotateCcw, ChevronRight, Info,
} from "lucide-react";
import { MachineState, useMachine } from "../context/MachineContext";

interface ScenarioCfg {
  state: MachineState;
  label: string;
  icon: typeof CheckCircle;
  color: string;
  bg: string;
  border: string;
  speedHz: number;
  desc: string;
}

export function SimulationPanel() {
  const [open, setOpen] = useState(false);
  const {
    machineState, setMachineState,
    isManualMode, setManualMode,
    manualSpeedHz, setManualSpeedHz,
    thresholds,
  } = useMachine();

  const SCENARIOS: ScenarioCfg[] = [
    {
      state: "running", label: "Fonctionnement Normal", icon: CheckCircle,
      color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30",
      speedHz: thresholds.nominalHz, desc: `${thresholds.nominalHz} Hz · Production nominale`,
    },
    {
      state: "slow", label: "Ralentissement", icon: TrendingDown,
      color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30",
      speedHz: thresholds.speedRalentHz - 1, desc: `${(thresholds.speedRalentHz - 1).toFixed(1)} Hz · Sous le seuil nominal`,
    },
    {
      state: "stopped", label: "Arrêt Machine", icon: XCircle,
      color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30",
      speedHz: 0, desc: "0 Hz · Panne technique",
    },
    {
      state: "emergency", label: "ARRÊT D'URGENCE", icon: AlertTriangle,
      color: "text-red-300", bg: "bg-red-600/20", border: "border-red-500/60",
      speedHz: 0, desc: "0 Hz · Signal urgence activé",
    },
  ];

  const activate = (s: ScenarioCfg) => {
    setManualMode(true);
    setMachineState(s.state);
    setManualSpeedHz(s.speedHz);
  };

  const resetAuto = () => {
    setManualMode(false);
    setManualSpeedHz(null);
    setMachineState("running");
  };

  const activeScenario = SCENARIOS.find((s) => s.state === machineState);

  return (
    <>
      {/* Trigger button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white rounded-2xl shadow-2xl shadow-violet-900/50 transition-all"
      >
        <motion.div
          animate={{ rotate: [0, 12, -12, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <FlaskConical className="w-4 h-4" />
        </motion.div>
        <span className="text-xs">Simulation</span>
        {isManualMode && (
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 0.9 }}
            className="w-2 h-2 bg-amber-400 rounded-full"
          />
        )}
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[340px] bg-[#0a1628] border-l border-[#1e3a5f]/50 z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1e3a5f]/40 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                  <FlaskConical className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm text-white">Panneau de Simulation</p>
                  <p className="text-[10px] text-gray-400">Contrôle manuel · Prototype PGTF</p>
                </div>
                <button onClick={() => setOpen(false)} className="ml-auto text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Info */}
                <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-blue-300">
                    Simule des états machine pour la démo. Les événements déclenchés sont enregistrés automatiquement dans l'Historique.
                  </p>
                </div>

                {/* Current state */}
                {activeScenario && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">État actuel</p>
                    <motion.div
                      key={activeScenario.state}
                      initial={{ scale: 0.97 }}
                      animate={{ scale: 1 }}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${activeScenario.bg} ${activeScenario.border}`}
                    >
                      <activeScenario.icon className={`w-5 h-5 ${activeScenario.color} shrink-0`} />
                      <div className="flex-1">
                        <p className={`text-sm ${activeScenario.color}`}>{activeScenario.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{activeScenario.desc}</p>
                      </div>
                      {isManualMode && (
                        <span className="text-[9px] bg-amber-500/15 border border-amber-500/25 text-amber-400 px-2 py-0.5 rounded-full shrink-0">
                          Manuel
                        </span>
                      )}
                    </motion.div>
                  </div>
                )}

                {/* Mode toggle */}
                <div className={`flex items-center justify-between p-3 rounded-xl border ${
                  isManualMode
                    ? "bg-amber-500/10 border-amber-500/25"
                    : "bg-emerald-500/10 border-emerald-500/25"
                }`}>
                  <div>
                    <p className={`text-xs ${isManualMode ? "text-amber-400" : "text-emerald-400"}`}>
                      {isManualMode ? "Mode Manuel Actif" : "Mode Automatique"}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {isManualMode ? "État figé par la simulation" : "Variations aléatoires actives"}
                    </p>
                  </div>
                  <button
                    onClick={resetAuto}
                    className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white border border-[#1e3a5f]/40 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Auto
                  </button>
                </div>

                {/* Hz slider */}
                <div>
                  <div className="flex justify-between mb-1.5">
                    <p className="text-xs text-gray-400">Vitesse manuelle</p>
                    <span className="text-xs font-mono text-cyan-400">
                      {isManualMode && manualSpeedHz !== null ? `${manualSpeedHz.toFixed(1)} Hz` : "Auto"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Gauge className="w-4 h-4 text-gray-500 shrink-0" />
                    <input
                      type="range"
                      min={0}
                      max={50}
                      step={0.5}
                      value={isManualMode && manualSpeedHz !== null ? manualSpeedHz : thresholds.nominalHz}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setManualSpeedHz(v);
                        setManualMode(true);
                        if (v === 0) setMachineState("stopped");
                        else if (v < thresholds.speedRalentHz) setMachineState("slow");
                        else setMachineState("running");
                      }}
                      className="flex-1 accent-violet-500"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-600 mt-1 px-7">
                    <span>0 Hz</span>
                    <span className="text-red-500/60">Min {thresholds.speedMinHz}Hz</span>
                    <span className="text-amber-500/60">Ralent. {thresholds.speedRalentHz}Hz</span>
                    <span className="text-emerald-500/60">Nom. {thresholds.nominalHz}Hz</span>
                  </div>
                </div>

                {/* Scenarios */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">Scénarios prédéfinis</p>
                  <div className="space-y-2">
                    {SCENARIOS.map((s) => {
                      const isActive = machineState === s.state && isManualMode;
                      return (
                        <motion.button
                          key={s.state}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => activate(s)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            isActive
                              ? `${s.bg} ${s.border}`
                              : "bg-[#060e1c] border-[#1e3a5f]/25 hover:border-gray-500"
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${s.bg} border ${s.border}`}>
                            <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                          </div>
                          <div className="flex-1">
                            <p className={`text-xs ${isActive ? s.color : "text-white"}`}>{s.label}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{s.desc}</p>
                          </div>
                          {isActive ? (
                            <span className={`text-[9px] px-2 py-0.5 rounded-full ${s.bg} border ${s.border} ${s.color} shrink-0`}>
                              Actif
                            </span>
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-[#1e3a5f]/40 shrink-0">
                <p className="text-[10px] text-gray-600">
                  Les événements déclenchés sont horodatés et enregistrés dans l'Historique pour démonstration des fonctionnalités MVP.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
