import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../util/api.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "null")
  );

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  function login(data) {
    setToken(data.token);
    setUser(data.user);
  }
  function logout() {
    setToken(null);
    setUser(null);
  }

  const value = { token, user, login, logout };
  api.setToken(token);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
