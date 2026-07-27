import React, { useState } from "react";
import toast from "react-hot-toast";
import { forgotPassword, resetPassword } from "../../auth/authService";

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1 = Request Code, 2 = Reset Password
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState("");

  if (!isOpen) return null;

  async function handleRequestCode(e) {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      toast.success(res.message || "A recovery code has been sent!");
      if (res.dev_sim_code) {
        setDevCode(res.dev_sim_code);
      }
      setStep(2);
    } catch (err) {
      toast.error(err.message || "Failed to send recovery code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (!resetToken || !newPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(resetToken, newPassword);
      toast.success(res.message || "Password successfully reset!");
      // Reset state and close
      setEmail("");
      setResetToken("");
      setNewPassword("");
      setStep(1);
      setDevCode("");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="forgot-modal" style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <h2>Forgot Password</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '16px' }}>
          {step === 1 
            ? "Enter your registered email address to receive a password reset code."
            : "Enter the recovery code sent to your email and your new password."}
        </p>

        {step === 1 ? (
          <form onSubmit={handleRequestCode} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              className="input"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
            />
            <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setStep(1);
                  setDevCode("");
                  onClose();
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Code"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {devCode && (
              <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '8px', border: '1px dashed var(--accent)', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: '500' }}>
                🔑 <strong>[Dev Mode] Recovery Code:</strong> <code>{devCode}</code>
              </div>
            )}
            <input
              className="input"
              type="text"
              placeholder="Enter 6-char Recovery Code"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
            />
            <input
              className="input"
              type="password"
              placeholder="New Secure Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '-4px' }}>
              * Must be at least 8 chars with 1 uppercase, 1 lowercase, 1 number, and 1 special char.
            </div>
            <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setStep(1);
                  setDevCode("");
                }}
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}