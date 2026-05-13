import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sliders,
  Cpu,
  Clock,
  Lock,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
} from "lucide-react";
import { useMachine, DEFAULT_THRESHOLDS, Thresholds, SHIFT_SCHEDULE } from "../context/MachineContext";

interface Section {
  id: string;
  label: string;
  icon: typeof Sliders;
  color: string;
}

const SECTIONS: Section[] = [
  { id: "seuils", label: "Seuils de Détection", icon: Sliders, color: "text-red-400" },
  { id: "plc", label: "Connexion PLC", icon: Cpu, color: "text-blue-400" },
  { id: "shifts", label: "Horaires des Shifts", icon: Clock, color: "text-amber-400" },
  { id: "securite", label: "Sécurité & Accès", icon: Lock, color: "text-violet-400" },
];

function SectionPanel({ section, children, expanded, onToggle }: {
  section: Section;
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-[#0d1526] border border-[#1e3a5f]/50 rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          section.color === "text-red-400" ? "bg-red-500/10 border border-red-500/20" :
          section.color === "text-blue-400" ? "bg-blue-500/10 border border-blue-500/20" :
          section.color === "text-amber-400" ? "bg-amber-500/10 border border-amber-500/20" :
          "bg-violet-500/10 border border-violet-500/20"
        }`}>
          <section.icon className={`w-4 h-4 ${section.color}`} />
        </div>
        <p className="text-sm text-white flex-1 text-left">{section.label}</p>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[#1e3a5f]/30"
          >
            <div className="p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NumberInput({
  label, value, unit, min, max, step = 0.5, hint, onChange,
}: {
  label: string; value: number; unit: string; min: number; max: number; step?: number; hint?: string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-300">{label}</label>
        <span className="text-xs font-mono text-cyan-400">{value} {unit}</span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 accent-red-500"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
          }}
          className="w-20 bg-[#0b1120] border border-[#1e3a5f]/50 rounded-lg px-2 py-1.5 text-xs text-white text-right focus:outline-none focus:border-red-500/40 transition-colors"
        />
      </div>
      {hint && <p className="text-[10px] text-gray-500">{hint}</p>}
    </div>
  );
}

export function Parametres() {
  const { thresholds, setThresholds } = useMachine();
  const [expanded, setExpanded] = useState<string>("seuils");
  const [local, setLocal] = useState<Thresholds>({ ...thresholds });
  const [saved, setSaved] = useState(false);
  const [plcIp, setPlcIp] = useState("192.168.1.10");
  const [plcPort, setPlcPort] = useState(502);
  const [plcAddr, setPlcAddr] = useState(1);
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const toggleSection = (id: string) => setExpanded(expanded === id ? "" : id);

  const handleSave = () => {
    setThresholds(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setLocal({ ...DEFAULT_THRESHOLDS });
  };

  const handlePwdSave = () => {
    if (newPwd.length < 6) { setPwdMsg({ type: "err", text: "Le mot de passe doit contenir au moins 6 caractères." }); return; }
    if (newPwd !== confirmPwd) { setPwdMsg({ type: "err", text: "Les mots de passe ne correspondent pas." }); return; }
    setPwdMsg({ type: "ok", text: "Mot de passe mis à jour avec succès." });
    setNewPwd(""); setConfirmPwd("");
    setTimeout(() => setPwdMsg(null), 3000);
  };

  const isModified = JSON.stringify(local) !== JSON.stringify(thresholds);

  return (
    <div className="p-4 md:p-5 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white">Paramètres Système</h1>
          <p className="text-xs text-gray-400 mt-0.5">Configuration seuils, connexion PLC, horaires et sécurité — MVP</p>
        </div>
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-3 py-2 rounded-xl text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              Paramètres enregistrés
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-300">
          Les paramètres de seuils modifient les conditions de détection automatique des événements. Les modifications sont appliquées immédiatement au moteur de simulation. En production, elles configureront les seuils de détection sur le PLC.
        </p>
      </div>

      {/* Sections */}
      <SectionPanel section={SECTIONS[0]} expanded={expanded === "seuils"} onToggle={() => toggleSection("seuils")}>
        <div className="space-y-5">
          <NumberInput
            label="Vitesse nominale"
            value={local.nominalHz}
            unit="Hz"
            min={20}
            max={50}
            step={0.5}
            hint="Fréquence de fonctionnement normal du variateur (NORDAC 500E)"
            onChange={(v) => setLocal((p) => ({ ...p, nominalHz: v }))}
          />
          <NumberInput
            label="Seuil de ralentissement"
            value={local.speedRalentHz}
            unit="Hz"
            min={10}
            max={local.nominalHz - 1}
            step={0.5}
            hint="En dessous de ce seuil, un événement RALENTISSEMENT est enregistré"
            onChange={(v) => setLocal((p) => ({ ...p, speedRalentHz: v }))}
          />
          <NumberInput
            label="Vitesse minimale critique"
            value={local.speedMinHz}
            unit="Hz"
            min={5}
            max={local.speedRalentHz - 1}
            step={0.5}
            hint="En dessous de ce seuil, une PANNE est déclenchée automatiquement"
            onChange={(v) => setLocal((p) => ({ ...p, speedMinHz: v }))}
          />
          <NumberInput
            label="Durée d'arrêt critique"
            value={local.stopDurationMin}
            unit="min"
            min={1}
            max={30}
            step={1}
            hint="Durée minimale d'arrêt complet avant génération d'alerte critique"
            onChange={(v) => setLocal((p) => ({ ...p, stopDurationMin: v }))}
          />

          {/* Visual threshold preview */}
          <div className="p-4 bg-[#0b1120] rounded-xl border border-[#1e3a5f]/30">
            <p className="text-xs text-gray-400 mb-3">Aperçu des seuils</p>
            <div className="relative h-6 bg-[#060e1c] rounded-full overflow-hidden">
              <div
                style={{ width: `${(local.speedMinHz / 50) * 100}%` }}
                className="absolute inset-y-0 left-0 bg-red-500/40"
              />
              <div
                style={{ left: `${(local.speedMinHz / 50) * 100}%`, width: `${((local.speedRalentHz - local.speedMinHz) / 50) * 100}%` }}
                className="absolute inset-y-0 bg-amber-500/40"
              />
              <div
                style={{ left: `${(local.speedRalentHz / 50) * 100}%`, width: `${((local.nominalHz - local.speedRalentHz) / 50) * 100}%` }}
                className="absolute inset-y-0 bg-blue-500/30"
              />
              <div
                style={{ left: `${(local.nominalHz / 50) * 100}%` }}
                className="absolute inset-y-0 right-0 bg-emerald-500/40"
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[9px] text-gray-500">
              <span className="text-red-400">Arrêt</span>
              <span className="text-amber-400">{local.speedMinHz} Hz — Ralent. {local.speedRalentHz} Hz</span>
              <span className="text-emerald-400">Normal ≥ {local.nominalHz} Hz</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/30 text-red-400 rounded-xl text-xs hover:bg-red-600/30 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              Appliquer les seuils
            </button>
            <button
              onClick={handleReset}
              disabled={!isModified}
              className="flex items-center gap-2 px-4 py-2 bg-[#0b1120] border border-[#1e3a5f]/30 text-gray-400 rounded-xl text-xs hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Réinitialiser
            </button>
          </div>
        </div>
      </SectionPanel>

      {/* PLC section */}
      <SectionPanel section={SECTIONS[1]} expanded={expanded === "plc"} onToggle={() => toggleSection("plc")}>
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-300">
              Prototype MVP : ces paramètres seront utilisés lors de la connexion réelle au PLC S7-1200 via Modbus TCP. Actuellement, le système fonctionne en mode simulation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Adresse IP PLC</label>
              <input
                type="text"
                value={plcIp}
                onChange={(e) => setPlcIp(e.target.value)}
                placeholder="192.168.1.10"
                className="w-full bg-[#0b1120] border border-[#1e3a5f]/50 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 font-mono focus:outline-none focus:border-blue-500/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Port Modbus TCP</label>
              <input
                type="number"
                value={plcPort}
                onChange={(e) => setPlcPort(Number(e.target.value))}
                className="w-full bg-[#0b1120] border border-[#1e3a5f]/50 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Adresse esclave</label>
              <input
                type="number"
                value={plcAddr}
                onChange={(e) => setPlcAddr(Number(e.target.value))}
                className="w-full bg-[#0b1120] border border-[#1e3a5f]/50 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500/40 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { reg: "40001", label: "Vitesse (Hz)", equipment: "NORDAC 500E" },
              { reg: "40010", label: "Output Count", equipment: "S7-1200" },
              { reg: "40020", label: "État Machine", equipment: "S7-1200" },
            ].map((r) => (
              <div key={r.reg} className="p-3 bg-[#0b1120] rounded-xl border border-[#1e3a5f]/20 text-center">
                <p className="text-xs font-mono text-cyan-400">{r.reg}</p>
                <p className="text-[10px] text-gray-300 mt-1">{r.label}</p>
                <p className="text-[9px] text-gray-500">{r.equipment}</p>
              </div>
            ))}
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/25 text-blue-400 rounded-xl text-xs hover:bg-blue-500/20 transition-all">
            <Save className="w-3.5 h-3.5" />
            Enregistrer configuration PLC
          </button>
        </div>
      </SectionPanel>

      {/* Shifts section */}
      <SectionPanel section={SECTIONS[2]} expanded={expanded === "shifts"} onToggle={() => toggleSection("shifts")}>
        <div className="space-y-3">
          {(Object.entries(SHIFT_SCHEDULE) as [string, { start: number; end: number; label: string }][]).map(([key, sh]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-[#0b1120] rounded-xl border border-[#1e3a5f]/20">
              <div>
                <p className="text-sm text-white">{key}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sh.label}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-[10px] text-gray-500">Début</p>
                  <p className="text-sm font-mono text-cyan-400">{String(sh.start).padStart(2, "0")}:00</p>
                </div>
                <span className="text-gray-600">→</span>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500">Fin</p>
                  <p className="text-sm font-mono text-cyan-400">{String(sh.end).padStart(2, "0")}:00</p>
                </div>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-gray-500">
            Note : La modification des horaires de shift sera disponible dans une version ultérieure. Chaque shift dure 8 heures consécutives.
          </p>
        </div>
      </SectionPanel>

      {/* Security section */}
      <SectionPanel section={SECTIONS[3]} expanded={expanded === "securite"} onToggle={() => toggleSection("securite")}>
        <div className="space-y-4">
          <p className="text-xs text-gray-400">
            Prototype mono-utilisateur. Identifiant fixe : <code className="bg-white/10 px-1.5 py-0.5 rounded text-white">admin</code>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Nouveau mot de passe</label>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0b1120] border border-[#1e3a5f]/50 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0b1120] border border-[#1e3a5f]/50 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/40 transition-colors"
              />
            </div>
          </div>
          <AnimatePresence>
            {pwdMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border ${
                  pwdMsg.type === "ok"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                {pwdMsg.type === "ok" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {pwdMsg.text}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={handlePwdSave}
            disabled={!newPwd || !confirmPwd}
            className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/25 text-violet-400 rounded-xl text-xs hover:bg-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Lock className="w-3.5 h-3.5" />
            Mettre à jour le mot de passe
          </button>
        </div>
      </SectionPanel>
    </div>
  );
}
