import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  History,
  Settings,
  LogOut,
  Activity,
  Wifi,
  WifiOff,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMachine } from "../context/MachineContext";
import { SimulationPanel } from "./SimulationPanel";

const NAV_ITEMS = [
  { to: "/",            label: "Dashboard",   icon: LayoutDashboard, exact: true  },
  { to: "/historique",  label: "Historique",  icon: History,         exact: false },
  { to: "/parametres",  label: "Paramètres",  icon: Settings,        exact: false },
];

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [connected, setConnected] = useState(true);
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();
  const { machineState } = useMachine();
  const [emergencyFlash, setEmergencyFlash] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStateRef = useRef(machineState);

  useEffect(() => {
    if (!isLoggedIn) navigate("/login");
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date());
      setConnected(Math.random() > 0.02);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Trigger red flash for 4s when emergency starts
  useEffect(() => {
    if (machineState === "emergency" && prevStateRef.current !== "emergency") {
      setEmergencyFlash(true);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setEmergencyFlash(false), 4000);
    }
    prevStateRef.current = machineState;
  }, [machineState]);

  // Clear timer on unmount
  useEffect(() => {
    return () => { if (flashTimerRef.current) clearTimeout(flashTimerRef.current); };
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };
  const fmt = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const fmtDate = (d: Date) => d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  if (!isLoggedIn) return null;

  const SidebarContent = ({ mini }: { mini: boolean }) => (
    <>
      {/* Logo */}
      <div className="flex items-center px-4 py-5 border-b border-[#1e3a5f]/50 min-h-[66px]">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shrink-0">
          <Activity className="w-5 h-5 text-white" />
        </div>
        {!mini && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ml-3 overflow-hidden"
          >
            <p className="text-[10px] text-gray-400 leading-none">LEONI Tunisia</p>
            <p className="text-sm text-white leading-none mt-0.5">PGTF Monitor</p>
          </motion.div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive
                  ? "bg-red-600/15 text-red-400 border border-red-600/25"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-red-400" : ""}`} />
                {!mini && <span className="text-sm">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-[#1e3a5f]/50 space-y-1">
        {/* Version tag */}
        {!mini && (
          <div className="px-3 py-2 mb-1">
            <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
              Prototype MVP v1.0
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-gray-400 hover:bg-white/5 hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!mini && <span className="text-sm">Déconnexion</span>}
        </button>

        {!mini ? (
          <button
            onClick={() => setCollapsed(true)}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-gray-500 hover:bg-white/5 hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            <span className="text-sm">Réduire</span>
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className="flex items-center justify-center p-2 w-full rounded-xl text-gray-500 hover:bg-white/5 hover:text-white transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#060e1c] text-white overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 220 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="hidden md:flex flex-col bg-[#0a1628] border-r border-[#1e3a5f]/40 z-10 shrink-0 overflow-hidden"
      >
        <SidebarContent mini={collapsed} />
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ duration: 0.25, type: "spring", damping: 25 }}
            className="fixed left-0 top-0 bottom-0 w-56 bg-[#0a1628] border-r border-[#1e3a5f]/40 z-50 flex flex-col md:hidden"
          >
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
            <SidebarContent mini={false} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center justify-between px-4 md:px-5 py-3 bg-[#0a1628] border-b border-[#1e3a5f]/40 shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <p className="text-xs text-gray-500 hidden sm:block capitalize">{fmtDate(time)}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Connection status */}
            <div className="flex items-center gap-1.5">
              {connected ? (
                <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <Wifi className="w-4 h-4 text-emerald-400" />
                </motion.div>
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-xs hidden lg:block ${connected ? "text-emerald-400" : "text-red-400"}`}>
                {connected ? "Simulateur actif" : "Déconnecté"}
              </span>
            </div>

            {/* Clock */}
            <div className="bg-[#060e1c] px-3 py-1.5 rounded-lg border border-[#1e3a5f]/40">
              <span className="text-sm font-mono text-cyan-400">{fmt(time)}</span>
            </div>

            {/* Live */}
            <div className="flex items-center gap-1.5">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="w-2 h-2 bg-red-500 rounded-full"
              />
              <span className="text-xs text-red-400 hidden sm:block">LIVE</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Simulation panel */}
      <SimulationPanel />

      {/* Emergency flash overlay — appears only on ARRET_URGENCE trigger, fades after 4s */}
      <AnimatePresence>
        {emergencyFlash && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.25, 0, 0.28, 0, 0.2, 0, 0.15, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3.5, ease: "easeOut" }}
              className="fixed inset-0 bg-red-600 pointer-events-none z-50"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1, 0.3, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3.5, ease: "easeOut" }}
              className="fixed inset-0 pointer-events-none z-50"
              style={{ boxShadow: "inset 0 0 80px 30px rgba(220,38,38,0.6)" }}
            />
            <motion.div
              initial={{ opacity: 0, y: -60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -60 }}
              transition={{ type: "spring", damping: 16, duration: 0.4 }}
              className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: 5, duration: 0.5 }}
                className="flex items-center gap-3 bg-red-700 border-2 border-red-400 px-6 py-3 rounded-2xl shadow-2xl shadow-red-900/70"
              >
                <AlertTriangle className="w-5 h-5 text-white shrink-0" />
                <span className="text-white text-sm tracking-widest uppercase">⚠ ARRÊT D'URGENCE ACTIVÉ</span>
                <AlertTriangle className="w-5 h-5 text-white shrink-0" />
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
