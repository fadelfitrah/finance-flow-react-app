import { useEffect, useRef, useState } from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshUserSession,
  registerUser,
  updateUserProfile,
} from "../services/authService";
import { SESSION_ACTIVITY_KEY, TOKEN_STORAGE_KEY } from "../services/api";
import { AuthContext } from "./AuthContextValue";

const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const SESSION_REFRESH_INTERVAL_MS = 15 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastActivityRef = useRef(0);
  const lastRefreshRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    getCurrentUser()
      .then((currentUser) => {
        if (cancelled) return;

        const storedActivity = Number(localStorage.getItem(SESSION_ACTIVITY_KEY));
        if (storedActivity && Date.now() - storedActivity >= SESSION_TIMEOUT_MS) {
          logoutUser();
          setUser(null);
          return;
        }

        const activityTime = storedActivity || Date.now();
        localStorage.setItem(SESSION_ACTIVITY_KEY, String(activityTime));
        lastActivityRef.current = activityTime;
        lastRefreshRef.current = Date.now();
        setUser(currentUser);
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        logoutUser();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    const loggedInUser = await loginUser(email, password);
    const now = Date.now();
    localStorage.setItem(SESSION_ACTIVITY_KEY, String(now));
    lastActivityRef.current = now;
    lastRefreshRef.current = now;
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (email, password) => {
    const registeredUser = await registerUser(email, password);
    const now = Date.now();
    localStorage.setItem(SESSION_ACTIVITY_KEY, String(now));
    lastActivityRef.current = now;
    lastRefreshRef.current = now;
    setUser(registeredUser);
    return registeredUser;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const updateProfile = async (profile) => {
    const updatedUser = await updateUserProfile(profile);
    setUser(updatedUser);
    return updatedUser;
  };

  useEffect(() => {
    if (!user) return undefined;

    let lastRecordedActivity = 0;
    const endSession = () => {
      logoutUser();
      setUser(null);
    };

    const recordActivity = () => {
      const now = Date.now();
      if (now - lastRecordedActivity < 5000) return;
      lastRecordedActivity = now;
      lastActivityRef.current = now;
      localStorage.setItem(SESSION_ACTIVITY_KEY, String(now));
    };

    const checkSession = () => {
      const storedActivity = Number(localStorage.getItem(SESSION_ACTIVITY_KEY));
      const lastActivity = storedActivity || lastActivityRef.current;
      lastActivityRef.current = lastActivity;

      if (Date.now() - lastActivity >= SESSION_TIMEOUT_MS) {
        endSession();
        return;
      }

      if (Date.now() - lastRefreshRef.current >= SESSION_REFRESH_INTERVAL_MS) {
        lastRefreshRef.current = Date.now();
        refreshUserSession().catch(() => {
          lastRefreshRef.current = 0;
        });
      }
    };

    const handleStorage = (event) => {
      if (event.key === SESSION_ACTIVITY_KEY && event.newValue) {
        lastActivityRef.current = Number(event.newValue);
      } else if (
        (event.key === SESSION_ACTIVITY_KEY || event.key === TOKEN_STORAGE_KEY) &&
        event.newValue === null
      ) {
        setUser(null);
      }
    };

    const handleUnauthorized = () => {
      logoutUser();
      setUser(null);
    };

    const activityEvents = ["pointerdown", "keydown", "scroll", "touchstart"];
    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, recordActivity, { passive: true }),
    );
    window.addEventListener("mousemove", recordActivity, { passive: true });
    window.addEventListener("storage", handleStorage);
    window.addEventListener("financeflow:unauthorized", handleUnauthorized);

    const sessionTimer = window.setInterval(checkSession, 30 * 1000);

    return () => {
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, recordActivity),
      );
      window.removeEventListener("mousemove", recordActivity);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("financeflow:unauthorized", handleUnauthorized);
      window.clearInterval(sessionTimer);
    };
  }, [user]);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
