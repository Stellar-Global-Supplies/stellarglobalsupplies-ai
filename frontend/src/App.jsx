import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./lib/store.js";
import LoginPage from "./pages/LoginPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";

export default function App() {
  const { init, loading, user } = useAuthStore();

  useEffect(() => { init(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-surface">
        <div className="gem-logo animate-gem-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
      <Route path="/*" element={user ? <ChatPage /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}
