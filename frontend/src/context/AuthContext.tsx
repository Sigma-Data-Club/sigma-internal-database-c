import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getMe,
  getMyAccessProfile,
  login as loginRequest,
  logout as logoutRequest,
} from "../api/auth";
import type { AuthUser, LoginRequest } from "../types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

function mergeUserData(
  profile: Awaited<ReturnType<typeof getMyAccessProfile>>,
  member?: Awaited<ReturnType<typeof getMe>> | null,
): AuthUser {
  return {
    member_id: profile.member_id,
    email: profile.email,
    is_active: profile.is_active,
    roles: profile.roles,
    permissions: profile.permissions,
    first_name: member?.first_name,
    last_name: member?.last_name,
    phone: member?.phone ?? null,
    academic_program_id: member?.academic_program_id ?? null,
    study_year: member?.study_year ?? null,
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("access_token"),
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    const storedToken = localStorage.getItem("access_token");

    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const [profile, member] = await Promise.all([
        getMyAccessProfile(),
        getMe().catch(() => null),
      ]);

      setUser(mergeUserData(profile, member));
      setToken(storedToken);
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCurrentUser();
  }, [loadCurrentUser]);

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await loginRequest(payload);

    localStorage.setItem("access_token", response.access_token);

    if (response.refresh_token) {
      localStorage.setItem("refresh_token", response.refresh_token);
    }

    setToken(response.access_token);

    const [profile, member] = await Promise.all([
      getMyAccessProfile(),
      getMe().catch(() => null),
    ]);

    setUser(mergeUserData(profile, member));
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // ignore backend logout failure and still clear local auth state
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
      setToken(null);
    }
  }, []);

  const reloadUser = useCallback(async () => {
    const storedToken = localStorage.getItem("access_token");

    if (!storedToken) {
      setUser(null);
      setToken(null);
      return;
    }

    const [profile, member] = await Promise.all([
      getMyAccessProfile(),
      getMe().catch(() => null),
    ]);

    setUser(mergeUserData(profile, member));
    setToken(storedToken);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      logout,
      reloadUser,
    }),
    [user, token, isLoading, login, logout, reloadUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}