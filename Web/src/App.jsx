import { useState, useEffect } from "react";
import { useDarkMode } from "./hooks/useDarkMode";
import { setToken, setUnauthorizedHandler } from "./lib/api";
import { startRealtime, stopRealtime } from "./lib/realtime";
import { clearImageCache } from "./components/tickets/Attachments";
import { NotificationsProvider } from "./notifications/NotificationsProvider";
import { LoginScreen } from "./components/auth/LoginScreen";
import { AdminPanel } from "./panels/AdminPanel";
import { AgentPanel } from "./panels/AgentPanel";
import { UserPortal } from "./portal/UserPortal";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [dark, setDark] = useDarkMode();

  const logout = () => {
    stopRealtime();
    clearImageCache();   // que la siguiente persona no vea imágenes de esta sesión
    setToken(null);
    setCurrentUser(null);
  };

  // Si el token expira, la API responde 401 y se vuelve al login
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, []);

  // Conexión de notificaciones en tiempo real mientras haya sesión
  useEffect(() => {
    if (!currentUser) return;
    startRealtime();
    return () => stopRealtime();
  }, [currentUser]);

  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />;
  }

  const props = { user: currentUser, onLogout: logout, dark, onToggleDark: () => setDark(d => !d) };
  const isStaff = currentUser.role === "admin" || currentUser.role === "agente";

  return (
    <NotificationsProvider user={currentUser}>
      {!isStaff ? (
        // Usuarios normales: portal sencillo para reportar y seguir sus tickets
        <UserPortal {...props} />
      ) : currentUser.role === "admin" ? (
        <AdminPanel {...props} />
      ) : (
        <AgentPanel {...props} />
      )}
    </NotificationsProvider>
  );
}
