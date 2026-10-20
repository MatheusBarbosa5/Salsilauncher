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
  getRemoteApiUrl,
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

const getCachedUserKey = () => `salsilauncher.user:${getRemoteApiUrl()}`;
function loadCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(getCachedUserKey());
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}
function saveCachedUser(u: User | null) {
  try {
    if (u) localStorage.setItem(getCachedUserKey(), JSON.stringify(u));
    else localStorage.removeItem(getCachedUserKey());
  } catch {
    // ignore storage errors
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() =>
    getToken() ? loadCachedUser() : null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const generation = useRef(0);
  function logout() {
    generation.current++;
    setToken(null);
    setLocalProfileId(null);
    saveCachedUser(null);
    setUser(null);
    setError("");
    setLoading(false);
  }
  async function refresh() {
    const gen = ++generation.current;
    setError("");
    if (!getToken()) {
      setLocalProfileId(null);
      saveCachedUser(null);
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const next = await remote<User>("/auth/me");
      if (gen === generation.current) {
        setUser(next);
        saveCachedUser(next);
        setLocalProfileId(next.id);
      }
    } catch (err) {
      if (gen === generation.current) {
        if (err instanceof ApiError && err.status === 401) {
          setUser(null);
          saveCachedUser(null);
          setLocalProfileId(null);
          setError("");
        } else {
          const cached = loadCachedUser();
          if (cached) {
            setUser(cached);
            setLocalProfileId(cached.id);
          } else {
            setError(errorText(err));
          }
        }
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
      saveCachedUser(user);
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

  useEffect(() => {
    if (!user) return;
    const renewToken = async () => {
      if (!getToken()) return;
      try {
        const data = await remote<{ access_token: string }>("/auth/refresh", {
          method: "POST",
        });
        if (data?.access_token) {
          setToken(data.access_token);
        }
      } catch {
        // ignore if offline or endpoint not yet available
      }
    };
    void renewToken();
    const timer = window.setInterval(
      () => {
        void renewToken();
      },
      20 * 60 * 1000,
    );
    return () => window.clearInterval(timer);
  }, [user?.id]);

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
