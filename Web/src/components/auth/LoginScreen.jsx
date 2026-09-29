// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import { useState } from "react";
import { Mail, Lock, AlertCircle, LogIn, UserPlus, Sun, Moon, Loader2, User, Building2, CheckCircle2 } from "lucide-react";
import { api, setToken } from "../../lib/api";
import { useDarkMode } from "../../hooks/useDarkMode";
import { getInitials } from "../../utils/ticketUtils";
import { Brand } from "../ui/Brand";
import { MichiBuddy } from "../ui/MichiBuddy";
import { Credits } from "../ui/Credits";

const inputCls = "w-full border border-line-strong rounded-lg pl-9 pr-3 h-10 text-sm text-ink bg-field outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand placeholder:text-faint disabled:opacity-60";

function Input({ label, Icon, ...props }) {
  return (
    <div>
      <label className="text-xs font-semibold text-ink-2 block mb-1.5">{label}</label>
      <div className="relative">
        <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input {...props} className={inputCls} />
      </div>
    </div>
  );
}

function toSessionUser(user) {
  const rawRole = user.Rol?.toLowerCase();
  const role = rawRole === "administrador" ? "admin" : (rawRole || "usuario");
  return {
    id:           user.id,
    role,
    name:         user.Usuario,
    initials:     getInitials(user.Usuario),
    email:        user.Correo,
    agentName:    user.Usuario,
    departamento: user.Departmento ?? "",
  };
}

export function LoginScreen({ onLogin }) {
  const [mode,     setMode]     = useState("login"); // login | register
  const [login,    setLogin]    = useState("");      // correo o nombre de usuario
  const [password, setPassword] = useState("");
  const [reg,      setReg]      = useState({ usuario: "", correo: "", departamento: "", contrasena: "" });
  const [error,    setError]    = useState("");
  const [info,     setInfo]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [dark, setDark] = useDarkMode();

  const doLogin = async (identifier, pass) => {
    const id = identifier.trim();
    const body = id.includes("@") ? { correo: id.toLowerCase(), password: pass } : { usuario: id, password: pass };
    const { token, user } = await api.post("/auth/login", body);
    setToken(token);
    onLogin(toSessionUser(user));
  };

  const handleLogin = async e => {
    e.preventDefault();
    setError(""); setInfo("");
    if (!login.trim()) { setError("Ingresa tu correo o usuario."); return; }
    if (!password)     { setError("Ingresa tu contraseña."); return; }
    setLoading(true);
    try {
      await doLogin(login, password);
    } catch (err) {
      setError(err.message ?? "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async e => {
    e.preventDefault();
    setError(""); setInfo("");
    const { usuario, correo, departamento, contrasena } = reg;
    if (!usuario.trim() || !correo.trim() || !departamento.trim() || !contrasena) { setError("Completa todos los campos."); return; }
    if (usuario.trim().length < 3)  { setError("El usuario debe tener al menos 3 caracteres."); return; }
    if (contrasena.length < 4)      { setError("La contraseña debe tener al menos 4 caracteres."); return; }
    if (!correo.trim().toLowerCase().endsWith("@empresa.com")) { setError("Usa tu correo de la empresa (@empresa.com)."); return; }

    setLoading(true);
    try {
      await api.post("/auth/register", reg);
      await doLogin(usuario, contrasena);
    } catch (err) {
      setError(err.message ?? "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = m => { setMode(m); setError(""); setInfo(""); };
  const setR = (k, v) => setReg(r => ({ ...r, [k]: v }));

  return (
    <div className="min-h-screen bg-navy paw-pattern flex flex-col items-center justify-center px-4 py-10">
      {/* Logo a la izquierda y Michi asomándose por la derecha, sin huecos */}
      <div className="w-full max-w-[400px] mb-4 px-1">
        <Brand size="md" tagline />
      </div>

      <div className="relative w-full max-w-[400px] bg-surface rounded-2xl border border-line shadow-2xl">
        <MichiBuddy pose="peek" size={112} className="absolute -top-[91px] right-5" title="Michi se asoma" />
        <div className="px-8 pt-7 pb-5 border-b border-line">
          <h1 className="text-lg font-semibold text-ink tracking-tight">
            {mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}
          </h1>
          <p className="text-sm text-muted mt-1">
            {mode === "login" ? "Michi te estaba esperando. Reporta problemas y sigue tus tickets." : "Solo necesitas tu correo de la empresa. Michi hará el resto."}
          </p>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="px-8 py-6 flex flex-col gap-4">
            <Input label="Correo o usuario" Icon={Mail} type="text" value={login} onChange={e => setLogin(e.target.value)}
              placeholder="correo@empresa.com" autoComplete="username" disabled={loading} autoFocus />
            <Input label="Contraseña" Icon={Lock} type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" autoComplete="current-password" disabled={loading} />

            {error && <Alert type="error" text={error} />}
            {info && <Alert type="ok" text={info} />}

            <button type="submit" disabled={loading}
              className="w-full h-10 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-hover transition-colors flex items-center justify-center gap-2 mt-1 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Verificando…</> : <><LogIn size={15} /> Iniciar sesión</>}
            </button>
            <p className="text-sm text-muted text-center">
              ¿No tienes cuenta?{" "}
              <button type="button" onClick={() => switchMode("register")} className="text-brand font-semibold hover:underline">Regístrate</button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="px-8 py-6 flex flex-col gap-4">
            <Input label="Nombre de usuario" Icon={User} value={reg.usuario} onChange={e => setR("usuario", e.target.value)}
              placeholder="juan.perez" autoComplete="username" disabled={loading} autoFocus />
            <Input label="Correo de la empresa" Icon={Mail} type="email" value={reg.correo} onChange={e => setR("correo", e.target.value)}
              placeholder="nombre@empresa.com" autoComplete="email" disabled={loading} />
            <Input label="Departamento" Icon={Building2} value={reg.departamento} onChange={e => setR("departamento", e.target.value)}
              placeholder="Ventas, RRHH, Contabilidad…" disabled={loading} />
            <Input label="Contraseña" Icon={Lock} type="password" value={reg.contrasena} onChange={e => setR("contrasena", e.target.value)}
              placeholder="Mínimo 4 caracteres" autoComplete="new-password" disabled={loading} />

            {error && <Alert type="error" text={error} />}

            <button type="submit" disabled={loading}
              className="w-full h-10 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-hover transition-colors flex items-center justify-center gap-2 mt-1 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Creando cuenta…</> : <><UserPlus size={15} /> Crear cuenta</>}
            </button>
            <p className="text-sm text-muted text-center">
              ¿Ya tienes cuenta?{" "}
              <button type="button" onClick={() => switchMode("login")} className="text-brand font-semibold hover:underline">Inicia sesión</button>
            </p>
          </form>
        )}

        <div className="px-8 pb-6 flex justify-center">
          <button
            onClick={() => setDark(d => !d)}
            className="text-xs text-faint flex items-center gap-1.5 hover:text-ink transition-colors"
          >
            {dark ? <Sun size={13} /> : <Moon size={13} />}
            {dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          </button>
        </div>
      </div>

      <Credits tone="dark" className="mt-6 text-center max-w-[400px]" />
    </div>
  );
}

function Alert({ type, text }) {
  const ok = type === "ok";
  return (
    <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 border ${ok ? "text-success bg-success/10 border-success/20" : "text-danger bg-danger/10 border-danger/20"}`}>
      {ok ? <CheckCircle2 size={13} className="flex-shrink-0" /> : <AlertCircle size={13} className="flex-shrink-0" />} {text}
    </div>
  );
}
