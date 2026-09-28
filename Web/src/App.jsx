import { useState, useEffect } from "react";
import { useDarkMode } from "./hooks/useDarkMode";
import { setToken, setUnauthorizedHandler } from "./lib/api";
import { LoginScreen } from "./components/auth/LoginScreen";
import { AdminPanel } from "./panels/AdminPanel";
import { AgentPanel } from "./panels/AgentPanel";
import { UserPortal } from "./portal/UserPortal";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [dark, setDark] = useDarkMode();

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
  };

  // Si el token expira, la API responde 401 y se vuelve al login
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, []);

  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />;
  }

  // Usuarios normales: portal sencillo para reportar y seguir sus tickets
  if (currentUser.role !== "admin" && currentUser.role !== "agente") {
    return (
      <UserPortal
        user={currentUser}
        onLogout={logout}
        dark={dark}
        onToggleDark={() => setDark(d => !d)}
      />
    );
  }

  if (currentUser.role === "admin") {
    return (
      <AdminPanel
        user={currentUser}
        onLogout={logout}
        dark={dark}
        onToggleDark={() => setDark(d => !d)}
      />
    );
  }

  return (
    <AgentPanel
      user={currentUser}
      onLogout={logout}
      dark={dark}
      onToggleDark={() => setDark(d => !d)}
    />
  );
}
