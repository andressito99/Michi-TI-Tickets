import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Edit2, X, Save } from "lucide-react";
import { api } from "../lib/api";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorBanner } from "../components/ui/ErrorBanner";

const ROLES = ["usuario", "agente", "admin"];

const ROLE_STYLES = {
  admin:   "bg-brand text-white",
  agente:  "bg-[#2563eb] text-white",
  usuario: "bg-warning text-white",
};

function RoleBadge({ role }) {
  const key = role?.toLowerCase();
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${ROLE_STYLES[key] ?? "bg-[#555] text-white"}`}>
      {role ?? "—"}
    </span>
  );
}

function EditUserModal({ user, onClose, onSave }) {
  const [email, setEmail] = useState(user.Correo ?? "");
  // Las contraseñas se guardan hasheadas: vacío = no cambiarla
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(user.id, password ? { Correo: email, Contraseña: password } : { Correo: email });
      onClose();
    } catch (err) {
      alert("Error al actualizar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="bg-surface w-96 rounded-xl border border-line-strong shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex justify-between items-center">
          <h3 className="font-semibold text-ink">Editar Usuario</h3>
          <button onClick={onClose} className="text-muted hover:text-black">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-1">
              Correo
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-line-strong rounded-lg px-3 py-2 text-sm bg-field text-ink outline-none focus:border-brand"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Dejar vacío para no cambiarla"
              autoComplete="new-password"
              className="w-full border border-line-strong rounded-lg px-3 py-2 text-sm bg-field text-ink outline-none focus:border-brand"
            />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm rounded-lg border border-line-strong text-muted hover:bg-hover">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-3 py-1.5 text-sm rounded-lg bg-brand text-white hover:bg-brand-hover flex items-center gap-1">
              <Save size={14} /> Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function useUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await api.get("/usuarios"));
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateRole = async (userId, newRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, Rol: newRole } : u));
    try {
      await api.patch(`/usuarios/${userId}`, { Rol: newRole });
    } catch (err) {
      console.error("Error al actualizar rol:", err.message);
      load();
    }
  };

  const updateUser = async (userId, updates) => {
    // updates can contain { Correo, Contraseña }
    try {
      const updated = await api.patch(`/usuarios/${userId}`, updates);
      setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    } catch (err) {
      console.error("Error al actualizar usuario:", err.message);
      load();
      throw err;
    }
  };

  return { users, loading, error, refresh: load, updateRole, updateUser };
}

export function UsersView() {
  const { users, loading, error, refresh, updateRole, updateUser } = useUsers();
  const [editingUser, setEditingUser] = useState(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-ink">Usuarios del sistema</p>
          <p className="text-xs text-faint mt-0.5">
            Gestiona los roles — cambia el rol para asignar o revocar permisos de agente
          </p>
        </div>
        <button
          onClick={refresh}
          className="w-8 h-8 rounded-lg border border-line-strong flex items-center justify-center text-muted hover:bg-hover transition-colors"
          title="Recargar"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={refresh} />}

      {loading ? <LoadingSpinner /> : (
        <div className="bg-surface rounded-xl border border-line overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-subtle border-b border-line-strong">
                  {["#", "Usuario", "Correo", "Departamento", "Rol actual", "Cambiar rol", "Acciones"].map((h, i) => (
                    <th key={i} className="px-4 py-2.5 text-left text-[11px] font-bold text-muted uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-faint text-sm">
                      Sin usuarios registrados
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr
                      key={u.id}
                      className="border-b border-line hover:bg-hover transition-colors last:border-none"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] text-muted">#{u.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                            {u.Usuario?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <span className="text-ink font-medium text-xs">{u.Usuario ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-2">{u.Correo ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-ink-2">{u.Departmento ?? "—"}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={u.Rol} />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.Rol ?? ""}
                          onChange={e => updateRole(u.id, e.target.value)}
                          className="border border-line-strong rounded-lg px-2.5 py-1.5 text-xs text-ink bg-field outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand cursor-pointer"
                        >
                          <option value="">— Sin rol —</option>
                          {ROLES.map(r => (
                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="w-7 h-7 rounded-lg border border-line-strong flex items-center justify-center text-muted hover:bg-hover transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {users.length > 0 && (
            <div className="px-4 py-2 border-t border-line flex items-center gap-4">
              <p className="text-[11px] text-faint">
                {users.length} usuario{users.length !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-3 ml-auto">
                {ROLES.map(r => {
                  const count = users.filter(u => u.Rol?.toLowerCase() === r).length;
                  return count > 0 ? (
                    <span key={r} className="flex items-center gap-1 text-[11px] text-muted">
                      <span className={`w-2 h-2 rounded-full ${ROLE_STYLES[r]?.split(" ")[0]}`} />
                      {r}: {count}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={updateUser}
        />
      )}
    </div>
  );
}
