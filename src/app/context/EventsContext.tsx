import { createContext, useContext, useState, useRef, ReactNode } from "react";
import { ShiftType } from "./MachineContext";

export type EventType = "ARRET_FIN_SHIFT" | "ARRET_URGENCE" | "RALENTISSEMENT";

export interface PGTFEvent {
  id: number;
  timestamp: Date;
  event_type: EventType;
  duration_min: number | null; // null = en cours
  speed_hz: number;
  shift: ShiftType;
  details: string;
}

interface EventsContextValue {
  events: PGTFEvent[];
  addEvent: (data: Omit<PGTFEvent, "id" | "timestamp" | "duration_min">) => void;
  closeLastEvent: () => void;
  clearSession: () => void;
}

// ─────────────────────────── historical seed data ───────────────────────────
const TEMPLATES: { type: EventType; details: string; speedHz: number; durations: number[] }[] = [
  { type: "ARRET_FIN_SHIFT", speedHz: 0,    details: "Arrêt planifié fin de shift — arrêt normal cycle de production", durations: [8, 12, 15, 22, 35] },
  { type: "ARRET_URGENCE",   speedHz: 0,    details: "Signal arrêt d'urgence activé — intervention sécurité requise", durations: [5, 8, 12] },
  { type: "RALENTISSEMENT",  speedHz: 38.5, details: "Vitesse en dessous du seuil nominal — ralentissement détecté automatiquement", durations: [3, 5, 8, 12] },
  { type: "ARRET_FIN_SHIFT", speedHz: 0,    details: "Défaut PLC S7-1200 — perte communication Modbus TCP, arrêt séquence", durations: [10, 18, 25] },
  { type: "RALENTISSEMENT",  speedHz: 36.2, details: "Baisse de fréquence NORDAC 500E — oscillation détectée sur retour tachymètre", durations: [4, 7, 11] },
  { type: "RALENTISSEMENT",  speedHz: 39.1, details: "Ralentissement léger Altivar 71 — charge moteur en hausse, surveillance activée", durations: [2, 4, 6] },
];

const SHIFTS: ShiftType[] = ["MATIN", "APRES-MIDI", "NUIT"];

function rnd(arr: number[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function rndItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function generateHistory(): PGTFEvent[] {
  const now = new Date();
  const events: PGTFEvent[] = [];
  let id = 1;

  for (let day = 7; day >= 1; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);

    for (const shift of SHIFTS) {
      const count = Math.floor(Math.random() * 4) + 2;
      const shiftStart = shift === "MATIN" ? 6 : shift === "APRES-MIDI" ? 14 : 22;

      for (let i = 0; i < count; i++) {
        const tpl = rndItem(TEMPLATES);
        const h = shiftStart + Math.floor(Math.random() * 8);
        const m = Math.floor(Math.random() * 60);
        const s = Math.floor(Math.random() * 60);
        const ts = new Date(date);
        ts.setHours(h % 24, m, s, 0);
        if (ts >= now) continue;

        events.push({
          id: id++,
          timestamp: ts,
          event_type: tpl.type,
          duration_min: rnd(tpl.durations),
          speed_hz: tpl.speedHz + (Math.random() - 0.5) * 1.5,
          shift,
          details: tpl.details,
        });
      }
    }
  }

  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// ─────────────────────────── context ────────────────────────────────────────
const EventsContext = createContext<EventsContextValue | null>(null);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<PGTFEvent[]>(() => generateHistory());
  const nextId = useRef(1000);

  const addEvent = (data: Omit<PGTFEvent, "id" | "timestamp" | "duration_min">) => {
    setEvents((prev) => {
      const closed = prev.map((e) =>
        e.duration_min === null
          ? { ...e, duration_min: parseFloat(((Date.now() - e.timestamp.getTime()) / 60000).toFixed(1)) }
          : e
      );
      const newEvent: PGTFEvent = {
        ...data,
        id: nextId.current++,
        timestamp: new Date(),
        duration_min: null,
      };
      return [newEvent, ...closed];
    });
  };

  const closeLastEvent = () => {
    setEvents((prev) =>
      prev.map((e, i) =>
        i === 0 && e.duration_min === null
          ? { ...e, duration_min: parseFloat(((Date.now() - e.timestamp.getTime()) / 60000).toFixed(1)) }
          : e
      )
    );
  };

  const clearSession = () => {
    setEvents(generateHistory());
  };

  return (
    <EventsContext.Provider value={{ events, addEvent, closeLastEvent, clearSession }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error("useEvents must be inside EventsProvider");
  return ctx;
}
