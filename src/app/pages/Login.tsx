import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  Eye,
  EyeOff,
  Lock,
  User,
  AlertCircle,
  Cpu,
  Wifi,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const EQUIPMENT = [
  { label: "NORDAC 500E", sub: "Variateur de fréquence", ok: true },
  { label: "SIMATIC S7-1200", sub: "Automate PLC", ok: true },
  { label: "Altivar 71", sub: "Variateur de vitesse", ok: true },
];

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1100));
    const ok = login(username, password);
    setLoading(false);
    if (ok) {
      navigate("/");
    } else {
      setError("Identifiant ou mot de passe incorrect.");
    }
  };

  return (
    <div className="min-h-screen bg-[#060e1c] flex items-stretch">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-[#0a1628] border-r border-[#1e3a5f]/40 p-10 relative overflow-hidden">
        {/* Animated bg orb */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ repeat: Infinity, duration: 6 }}
          className="absolute -bottom-32 -left-32 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ repeat: Infinity, duration: 8, delay: 2 }}
          className="absolute -top-20 -right-20 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/40">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400 leading-none">LEONI Tunisia</p>
              <p className="text-sm text-white leading-none mt-0.5">PGTF Monitor</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-white">Système de Monitoring<br />en Temps Réel</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Surveillance continue du Poste de Guidage et de Transport de Faisceaux — détection automatique des événements, historique horodaté, KPIs de performance.
            </p>
          </div>
        </div>

        {/* Equipment status */}
        <div className="relative z-10 space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Équipements connectés</p>
          {EQUIPMENT.map((eq, i) => (
            <motion.div
              key={eq.label}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.12 }}
              className="flex items-center gap-3 p-3 bg-[#0d1f3a] rounded-xl border border-[#1e3a5f]/40"
            >
              <Cpu className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{eq.label}</p>
                <p className="text-[10px] text-gray-500">{eq.sub}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
                  className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                />
                <span className="text-[10px] text-emerald-400">OK</span>
              </div>
            </motion.div>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-cyan-400">Réseau interne · 192.168.1.x</span>
            <span className="text-[10px] text-gray-500">· Mode simulation</span>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-[10px] text-gray-600">
            Prototype MVP · LEONI Tunisia · 2026
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400">LEONI Tunisia</p>
              <p className="text-sm text-white">PGTF Monitor</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-8">
              <h1 className="text-white">Connexion</h1>
              <p className="text-sm text-gray-400 mt-1">
                Accès opérateur au système de monitoring PGTF
              </p>
            </div>

            {/* Demo hint */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-6">
              <p className="text-[11px] text-blue-300">
                <span className="text-blue-400">Accès démo :</span>{" "}
                <code className="bg-white/10 px-1.5 py-0.5 rounded">admin</code>
                {" "}·{" "}
                <code className="bg-white/10 px-1.5 py-0.5 rounded">pgtf2026</code>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Identifiant</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(""); }}
                    placeholder="Identifiant opérateur"
                    autoComplete="username"
                    className="w-full bg-[#0a1628] border border-[#1e3a5f]/60 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full bg-[#0a1628] border border-[#1e3a5f]/60 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 px-3 py-2.5 rounded-xl border border-red-500/20"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full py-3 rounded-xl text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all relative overflow-hidden mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Authentification...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Accéder au monitoring
                  </span>
                )}
                {loading && (
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 1.1, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  />
                )}
              </button>
            </form>

            <p className="text-center text-[11px] text-gray-600 mt-6">
              Système de monitoring industriel · Réseau interne LEONI
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
