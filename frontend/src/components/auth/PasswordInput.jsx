import React, { useState } from "react";

export default function PasswordInput({
  label,
  name,
  placeholder,
  hint,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="field">
      {label && <label className="field-label">{label}</label>}

      <div className="password-wrapper">
        <input
          className="input"
          type={showPassword ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          autoComplete="current-password"
          {...props}
        />

        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? "🙈" : "👁"}
        </button>
      </div>
      {hint && <span className="field-hint" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "4px", display: "block" }}>{hint}</span>}
    </div>
  );
}