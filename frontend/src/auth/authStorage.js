const USER_KEY = "smartflow_user";
const TOKEN_KEY = "smartflow_token";
const REFRESH_TOKEN_KEY = "smartflow_refresh_token";
const REMEMBER_KEY = "smartflow_remember";

export const saveAuth = (user, token, remember = false) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REMEMBER_KEY, remember);
};

export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const isRemembered = () => {
  return localStorage.getItem(REMEMBER_KEY) === "true";
};

export const clearAuth = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(REMEMBER_KEY);
};