import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  User,
  body,
  getToken,
  setToken,
  remote,
  errorText,
  ApiError,
  setLocalProfileId,
} from "../services/api";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";

interface Auth {
  user: User | null;
  loading: boolean;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}
const AuthContext = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const generation = useRef(0);
  function logout() {
    generation.current++;
    setToken(null);
    setLocalProfileId(null);
    setUser(null);
    setError("");
    setLoading(false);
  }
  async function refresh() {
    const gen = ++generation.current;
    setError("");
    if (!getToken()) {
      setLocalProfileId(null);
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const next = await remote<User>("/auth/me");
      if (gen === generation.current) {
        setUser(next);
        setLocalProfileId(next.id);
      }
    } catch (err) {
      if (gen === generation.current) {
        setUser(null);
        setLocalProfileId(null);
        setError(
          err instanceof ApiError && err.status === 401 ? "" : errorText(err),
        );
      }
    } finally {
      if (gen === generation.current) setLoading(false);
    }
  }
  async function login(email: string, password: string) {
    logout();
    const data = await remote<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: body({ email, password }),
    });
    setToken(data.access_token);
    try {
      const user = await remote<User>("/auth/me");
      setUser(user);
      setLocalProfileId(user.id);
    } catch (err) {
      logout();
      throw err;
    }
  }
  useEffect(() => {
    void refresh();
    window.addEventListener("salsilauncher:logout", logout);
    return () => window.removeEventListener("salsilauncher:logout", logout);
  }, []);
  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider ausente");
  return value;
}
export function RequireAuth() {
  const { user, loading, error, refresh } = useAuth();
  const location = useLocation();
  if (loading) return <p className="online-notice">Verificando conta...</p>;
  if (error)
    return (
      <div className="online-notice">
        <p role="alert">{error}</p>
        <button onClick={() => void refresh()}>Tentar novamente</button>{" "}
        <Link to="/">Biblioteca local</Link>
      </div>
    );
  return user ? (
    <div key={user.id}>
      <Outlet />
    </div>
  ) : (
    <Navigate to="/login" replace state={{ from: location.pathname }} />
  );
}
