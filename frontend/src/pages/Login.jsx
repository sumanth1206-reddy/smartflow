import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import { useTranslation } from "react-i18next";
import SmartFlowLogo from "../components/common/SmartFlowLogo";
import ProductShowcase from "../components/common/ProductShowcase";
import LanguageSwitcher from "../components/common/LanguageSwitcher";

import { validateLogin } from "../auth/authValidator";
import { register as registerService } from "../auth/authService";
import PasswordInput from "../components/auth/PasswordInput";
import ForgotPasswordModal from "../components/auth/ForgotPasswordModal";
import LoadingSpinner from "../components/auth/LoadingSpinner";
import IntroCanvas from "../animations/Intro/IntroCanvas";

function validateRegistration(email, password, confirmPassword, name, role) {
  const errors = {};
  if (!name || !name.trim()) {
    errors.name = "Full Name is required";
  }
  if (!email || !email.trim()) {
    errors.email = "Email is required";
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.email = "Email address is invalid";
  }
  if (!password) {
    errors.password = "Password is required";
  } else {
    if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    } else if (!/[A-Z]/.test(password)) {
      errors.password = "Must contain at least one uppercase letter.";
    } else if (!/[a-z]/.test(password)) {
      errors.password = "Must contain at least one lowercase letter.";
    } else if (!/\d/.test(password)) {
      errors.password = "Must contain at least one digit.";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.password = "Must contain at least one special character.";
    }
  }
  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }
  if (!role) {
    errors.role = "Role / Post Category is required";
  }
  return errors;
}

export default function Login({ darkMode, setDarkMode, isRegisterPage = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginGoogle, loading } = useAuth();

  const [isRegistering, setIsRegistering] = useState(isRegisterPage || location.pathname === "/register");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    setIsRegistering(isRegisterPage || location.pathname === "/register");
    setErrors({});
    setAuthError("");
  }, [isRegisterPage, location.pathname]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (clientId && !clientId.includes("your-actual-client-id") && window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (response.credential) {
              const result = await loginGoogle(response.credential, null);
              if (result.success) {
                toast.success("Welcome back to SmartFlow via Google!");
                navigate("/");
              } else {
                toast.error(result.message || "Google Sign-In failed.");
              }
            }
          }
        });
        window.google.accounts.id.prompt();
      } catch (error) {
        console.error("Failed to initialize Google One Tap", error);
      }
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = form.email.value;
    const password = form.password.value;

    if (isRegistering) {
      const name = form.name.value;
      const confirmPassword = form.confirmPassword ? form.confirmPassword.value : "";
      const role = form.role.value;
      const validation = validateRegistration(email, password, confirmPassword, name, role);

      if (Object.keys(validation).length) {
        setErrors(validation);
        toast.error("Please correct the errors in the form.");
        return;
      }

      setErrors({});
      setAuthError("");
      setRegisterLoading(true);

      const regResult = await registerService({ name, email, password, role });

      if (regResult.success) {
        toast.success("Account created successfully!");
        if (regResult.isDemo) {
          setRegisterLoading(false);
          navigate("/");
          return;
        }
        const loginResult = await login(email, password, remember);
        setRegisterLoading(false);
        if (loginResult.success) {
          toast.success("Welcome to SmartFlow!");
          navigate("/");
        } else {
          toast.error("Account created! Please sign in manually.");
          navigate("/login");
        }
      } else {
        setRegisterLoading(false);
        toast.error(regResult.message);
        setAuthError(regResult.message);
      }
    } else {
      const validation = validateLogin({ email, password });

      if (Object.keys(validation).length) {
        setErrors(validation);
        toast.error("Please fill in all required fields.");
        return;
      }

      setErrors({});
      setAuthError("");

      const result = await login(email, password, remember);

      if (result.success) {
        toast.success("Welcome back to SmartFlow!");
        navigate("/");
      } else {
        toast.error(result.message);
        setAuthError(result.message);
      }
    }
  }

  const handleGoogleSignIn = async () => {
    if (!window.google) {
      toast.error("Google Identity Services script not loaded. Please check your internet connection.");
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId.includes("your-actual-client-id")) {
      toast.error("Google Sign-In is not configured yet. Please set up a valid Google Client ID in your environment variables.");
      return;
    }

    try {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: "email profile",
            callback: async (tokenResponse) => {
              if (tokenResponse && tokenResponse.access_token) {
                const result = await loginGoogle(null, tokenResponse.access_token);
                if (result.success) {
                  toast.success("Welcome back to SmartFlow via Google!");
                  navigate("/");
                } else {
                  toast.error(result.message || "Google Sign-In failed.");
                }
              } else {
                toast.error("Google authentication was cancelled.");
              }
            },
            error_callback: (err) => {
              toast.error(`Google authentication error: ${err.message || err}`);
            }
          });
          client.requestAccessToken();
        }
      });
    } catch (error) {
      console.error(error);
      toast.error("Could not initialize Google Sign-In.");
    }
  }

  return (
    <IntroCanvas>
      <div
        className="login-enterprise-page"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          background: "var(--bg)",
          color: "var(--text)",
          position: "relative",
          boxSizing: "border-box",
          width: "100%",
          overflowY: "auto"
        }}
      >
        {/* Top Right Tools: Theme Switcher */}
        <div style={{ position: "fixed", top: "24px", right: "32px", zIndex: 50, display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            style={{
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "var(--shadow)"
            }}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

        {/* 55% Left / 45% Right Split Container */}
        <div className="login-grid-wrapper">
          {/* LEFT SIDE (55%): Brand Showcase & Floating UI Previews */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="login-showcase-panel"
          >
            {/* Left Panel Header with Big Blue SMARTFLOW Logo */}
            <div style={{ marginBottom: "4px" }}>
              <SmartFlowLogo fontSize="2.8rem" />
            </div>

            <div>
              <h1
                style={{
                  fontSize: "2.3rem",
                  fontWeight: "800",
                  color: "var(--text)",
                  letterSpacing: "-0.02em",
                  margin: "8px 0 6px",
                  lineHeight: 1.2
                }}
              >
                AI Powered Inventory Management
              </h1>
              <p
                style={{
                  fontSize: "1rem",
                  color: "var(--secondary-text)",
                  margin: 0,
                  lineHeight: 1.5,
                  maxWidth: "540px"
                }}
              >
                Enterprise stock tracking, automated demand forecasting, and intuitive management tools in one unified platform.
              </p>
            </div>

            {/* Product Feature Showcase */}
            <ProductShowcase />
          </motion.div>

          {/* RIGHT SIDE (45%): Floating 24px Rounded Authentication Form */}
          <motion.div
            initial={{ opacity: 0, x: 45, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: "24px",
              padding: "40px 36px",
              boxShadow: "var(--floating-shadow)",
              border: "1px solid var(--border)",
              position: "relative"
            }}
          >
            <div style={{ marginBottom: "28px" }}>
              <h2
                style={{
                  margin: "0 0 6px",
                  fontSize: "1.65rem",
                  fontWeight: "800",
                  color: "var(--text)"
                }}
              >
                {isRegistering ? "Create Account" : "Sign In"}
              </h2>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--secondary-text)" }}>
                {isRegistering
                  ? "Enter your details and select your post category to register."
                  : "Welcome back. Sign in to access your inventory dashboard."}
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {isRegistering && (
                <div>
                  <Input label="Full Name" name="name" type="text" placeholder="e.g. Sumanth Reddy" required />
                  {errors.name && <small className="error-text">{errors.name}</small>}
                </div>
              )}

              <div>
                <Input label="Email Address" name="email" type="email" placeholder="name@company.com" required />
                {errors.email && <small className="error-text">{errors.email}</small>}
              </div>

              <div>
                <PasswordInput
                  label={isRegistering ? "Create Password" : "Password"}
                  name="password"
                  placeholder="••••••••"
                  hint={isRegistering ? "Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char" : null}
                  required
                />
                {errors.password && <small className="error-text">{errors.password}</small>}
              </div>

              {isRegistering && (
                <div>
                  <PasswordInput
                    label="Confirm Password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    required
                  />
                  {errors.confirmPassword && <small className="error-text">{errors.confirmPassword}</small>}
                </div>
              )}

              {isRegistering && (
                <div>
                  <Select label="Category / Post" name="role" defaultValue="Cashier">
                    <option value="Cashier">Cashier</option>
                    <option value="Assistant Manager">Assistant Manager</option>
                    <option value="Operations Manager">Operations Manager</option>
                    <option value="Store Manager">Store Manager</option>
                    <option value="Inventory Specialist">Inventory Specialist</option>
                    <option value="Admin">Admin</option>
                  </Select>
                  {errors.role && <small className="error-text">{errors.role}</small>}
                </div>
              )}

              {!isRegistering && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label className="remember-me" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.88rem", color: "var(--secondary-text)" }}>
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={() => setRemember(!remember)}
                      style={{ accentColor: "var(--accent)" }}
                    />
                    Remember Me
                  </label>

                  <button
                    type="button"
                    className="text-btn"
                    style={{ fontSize: "0.88rem", color: "var(--accent)", fontWeight: "600", background: "none", border: "none", cursor: "pointer" }}
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {authError && <p className="error-text" style={{ color: "var(--danger)", fontSize: "0.85rem", margin: 0 }}>{authError}</p>}

              <Button
                type="submit"
                className="full-width btn-loading"
                disabled={loading || registerLoading}
                style={{
                  height: "48px",
                  fontSize: "1rem",
                  fontWeight: "700",
                  borderRadius: "12px",
                  backgroundColor: "var(--accent)",
                  color: "#FFFFFF",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)"
                }}
              >
                {loading || registerLoading ? (
                  <>
                    <LoadingSpinner />
                    {isRegistering ? "Registering..." : "Signing In..."}
                  </>
                ) : isRegistering ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", margin: "4px 0", color: "var(--muted)" }}>
                <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
                <span style={{ padding: "0 12px", fontSize: "0.78rem", textTransform: "uppercase", fontWeight: "600" }}>OR</span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                style={{
                  width: "100%",
                  height: "46px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  backgroundColor: "var(--surface)",
                  color: "var(--text)",
                  fontWeight: "600",
                  fontSize: "0.92rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Sign in with Google
              </button>

              <div style={{ textAlign: "center", marginTop: "8px" }}>
                <span style={{ fontSize: "0.88rem", color: "var(--secondary-text)" }}>
                  {isRegistering ? "Already have an account?" : "Don't have an account?"}
                </span>{" "}
                <button
                  type="button"
                  className="text-btn"
                  style={{ fontWeight: "700", color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontSize: "0.88rem" }}
                  onClick={() => {
                    if (isRegistering) {
                      navigate("/login");
                    } else {
                      navigate("/register");
                    }
                    setErrors({});
                    setAuthError("");
                  }}
                >
                  {isRegistering ? "Sign In" : "Create Account"}
                </button>
              </div>
            </form>

            <ForgotPasswordModal
              isOpen={showForgotPassword}
              onClose={() => setShowForgotPassword(false)}
            />
          </motion.div>
        </div>
      </div>
    </IntroCanvas>
  );
}