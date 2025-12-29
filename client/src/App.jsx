import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { useAuth } from "./state/AuthContext.jsx";

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { token, logout } = useAuth();
  return (
    <div className="max-w-5xl mx-auto p-4">
      <header className="flex items-center justify-between mb-4">
        <Link to="/" className="text-xl font-bold text-gray-900">
          Health Wallet
        </Link>
        <nav className="flex items-center gap-2">
          {token ? (
            <button onClick={logout} className="btn-secondary">
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Register
              </Link>
            </>
          )}
        </nav>
      </header>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}
