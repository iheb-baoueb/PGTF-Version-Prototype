import { createContext, useContext, useState, ReactNode } from "react";

export type MachineState = "running" | "slow" | "stopped" | "emergency";
export type ShiftType = "MATIN" | "APRES-MIDI" | "NUIT";

export interface Thresholds {
  speedMinHz: number;       // Hz — seuil d'alerte critique
  speedRalentHz: number;    // Hz — seuil ralentissement
  stopDurationMin: number;  // min — durée avant panne critique
  nominalHz: number;        // Hz — vitesse nominale
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  nominalHz: 42,
  speedRalentHz: 38,
  speedMinHz: 35,
  stopDurationMin: 5,
};

export const SHIFT_SCHEDULE: Record<ShiftType, { start: number; end: number; label: string }> = {
  MATIN: { start: 6, end: 14, label: "Matin · 06:00 – 14:00" },
  "APRES-MIDI": { start: 14, end: 22, label: "Après-midi · 14:00 – 22:00" },
  NUIT: { start: 22, end: 6, label: "Nuit · 22:00 – 06:00" },
};

export function detectShift(): ShiftType {
  const h = new Date().getHours();
  if (h >= 6 && h < 14) return "MATIN";
  if (h >= 14 && h < 22) return "APRES-MIDI";
  return "NUIT";
}

export function getShiftBounds(shift: ShiftType): { start: Date; end: Date } {
  const now = new Date();
  const s = SHIFT_SCHEDULE[shift];
  const start = new Date(now);
  const end = new Date(now);

  start.setHours(s.start, 0, 0, 0);
  end.setHours(s.end, 0, 0, 0);

  if (shift === "NUIT" && now.getHours() < 6) {
    start.setDate(start.getDate() - 1);
  }
  if (shift === "NUIT") {
    end.setDate(end.getDate() + (s.end < s.start ? 1 : 0));
  }

  return { start, end };
}

interface MachineContextValue {
  machineState: MachineState;
  setMachineState: (s: MachineState) => void;
  isManualMode: boolean;
  setManualMode: (v: boolean) => void;
  manualSpeedHz: number | null;
  setManualSpeedHz: (v: number | null) => void;
  activeShift: ShiftType;
  setActiveShift: (s: ShiftType) => void;
  thresholds: Thresholds;
  setThresholds: (t: Thresholds) => void;
}

const MachineContext = createContext<MachineContextValue | null>(null);

export function MachineProvider({ children }: { children: ReactNode }) {
  const [machineState, setMachineState] = useState<MachineState>("running");
  const [isManualMode, setManualMode] = useState(false);
  const [manualSpeedHz, setManualSpeedHz] = useState<number | null>(null);
  const [activeShift, setActiveShift] = useState<ShiftType>(detectShift());
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);

  return (
    <MachineContext.Provider
      value={{
        machineState, setMachineState,
        isManualMode, setManualMode,
        manualSpeedHz, setManualSpeedHz,
        activeShift, setActiveShift,
        thresholds, setThresholds,
      }}
    >
      {children}
    </MachineContext.Provider>
  );
}

export function useMachine() {
  const ctx = useContext(MachineContext);
  if (!ctx) throw new Error("useMachine must be inside MachineProvider");
  return ctx;
}
