import { request, setToken } from "./api";

export const registerUser = async (email, password) => {
  const result = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  setToken(result.token);
  return result.user;
};

export const loginUser = async (email, password) => {
  const result = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  setToken(result.token);
  return result.user;
};

export const logoutUser = async () => {
  setToken(null);
  localStorage.removeItem("financeflow_last_activity");
};

export const getCurrentUser = async () => {
  const result = await request("/auth/me");
  return result.user;
};

export const refreshUserSession = async () => {
  await request("/auth/activity", { method: "POST" });
};

export const updateUserProfile = async (profile) => {
  const result = await request("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
  return result.user;
};
