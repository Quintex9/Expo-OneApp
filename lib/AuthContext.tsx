/**
 * AuthContext: Riadi autentifikacny stav pouzivatela a poskytuje auth API cez React Context.
 *
 * Preco: Centralizovana sprava relacie zabranuje duplicitnej logike prihlasovania napriec UI.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  id: string;
  email?: string | null;
};

type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithEmail: (email: string, password: string) => Promise<string | null>;
  signUpWithEmail: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const AUTH_USER_KEY = "authUser";

export const isApiConfigured = Boolean(process.env.EXPO_PUBLIC_API_URL);

function getApiUrl(path: string) {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_URL nie je nastavene.");
  }

  const normalizedBase = baseUrl.replace(/\/+$/g, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildAuthUser(email: string): AuthUser {
  const normalizedEmail = normalizeEmail(email);
  return {
    id: normalizedEmail || "authenticated-user",
    email: normalizedEmail || null,
  };
}

function isAuthTokens(value: unknown): value is AuthTokens {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybeTokens = value as Partial<AuthTokens>;
  return (
    typeof maybeTokens.accessToken === "string" &&
    typeof maybeTokens.refreshToken === "string"
  );
}

function parseStoredUser(rawValue: string | null): AuthUser | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<AuthUser>;
    if (typeof parsed?.id !== "string") {
      return null;
    }

    return {
      id: parsed.id,
      email: typeof parsed.email === "string" ? parsed.email : null,
    };
  } catch {
    return null;
  }
}

function getErrorMessage(payload: unknown, fallbackMessage: string) {
  if (payload && typeof payload === "object") {
    const { message, error } = payload as { message?: unknown; error?: unknown };

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }

    if (typeof error === "string" && error.trim().length > 0) {
      return error;
    }
  }

  return fallbackMessage;
}

async function parseResponseBody(response: Response) {
  const rawBody = await response.text();
  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return rawBody;
  }
}

async function postAuthRequest(
  path: string,
  body: Record<string, unknown>,
  fallbackMessage: string
) {
  const response = await fetch(getApiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(payload, fallbackMessage));
  }

  return payload;
}

async function saveSession(session: AuthSession) {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, session.accessToken],
    [REFRESH_TOKEN_KEY, session.refreshToken],
    [AUTH_USER_KEY, JSON.stringify(session.user)],
  ]);
}

async function clearStoredSession() {
  await AsyncStorage.multiRemove([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    AUTH_USER_KEY,
  ]);
}

async function getStoredSession() {
  const storedEntries = await AsyncStorage.multiGet([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    AUTH_USER_KEY,
  ]);
  const entryMap = Object.fromEntries(storedEntries);

  return {
    accessToken: entryMap[ACCESS_TOKEN_KEY] ?? null,
    refreshToken: entryMap[REFRESH_TOKEN_KEY] ?? null,
    user: parseStoredUser(entryMap[AUTH_USER_KEY] ?? null),
  };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApiConfigured) {
      setLoading(false);
      return;
    }

    let isActive = true;

    const restoreSession = async () => {
      try {
        const storedSession = await getStoredSession();
        if (!storedSession.refreshToken || !storedSession.user) {
          await clearStoredSession();
          if (isActive) {
            setUser(null);
            setSession(null);
          }
          return;
        }

        const refreshedTokens = await postAuthRequest(
          "/auth/refresh",
          { refreshToken: storedSession.refreshToken },
          "Obnova relacie zlyhala."
        );

        if (!isAuthTokens(refreshedTokens)) {
          throw new Error("Server vratil neplatnu auth odpoved.");
        }

        const nextSession: AuthSession = {
          ...refreshedTokens,
          user: storedSession.user,
        };

        await saveSession(nextSession);

        if (isActive) {
          setUser(nextSession.user);
          setSession(nextSession);
        }
      } catch {
        await clearStoredSession();
        if (isActive) {
          setUser(null);
          setSession(null);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void restoreSession();

    return () => {
      isActive = false;
    };
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!isApiConfigured) {
        return "EXPO_PUBLIC_API_URL nie je nastavene.";
      }

      try {
        const payload = await postAuthRequest(
          "/auth/login",
          {
            email: normalizeEmail(email),
            password,
          },
          "Prihlasenie zlyhalo."
        );

        if (!isAuthTokens(payload)) {
          throw new Error("Server vratil neplatnu auth odpoved.");
        }

        const nextUser = buildAuthUser(email);
        const nextSession: AuthSession = {
          ...payload,
          user: nextUser,
        };

        await saveSession(nextSession);
        setUser(nextUser);
        setSession(nextSession);
        return null;
      } catch (error) {
        return error instanceof Error ? error.message : "Prihlasenie zlyhalo.";
      }
    },
    []
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!isApiConfigured) {
        return "EXPO_PUBLIC_API_URL nie je nastavene.";
      }

      try {
        await postAuthRequest(
          "/auth/register",
          {
            email: normalizeEmail(email),
            password,
          },
          "Registracia zlyhala."
        );

        return null;
      } catch (error) {
        return error instanceof Error ? error.message : "Registracia zlyhala.";
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    const refreshToken =
      session?.refreshToken ?? (await AsyncStorage.getItem(REFRESH_TOKEN_KEY));

    try {
      if (refreshToken && isApiConfigured) {
        await postAuthRequest(
          "/auth/logout",
          { refreshToken },
          "Odhlasenie zlyhalo."
        );
      }
    } catch {
      // Tokens clear locally even when server logout fails.
    } finally {
      await clearStoredSession();
      setUser(null);
      setSession(null);
    }
  }, [session]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      loading,
      isAuthenticated: Boolean(user),
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [loading, session, signInWithEmail, signOut, signUpWithEmail, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
