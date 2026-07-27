import React, { useState } from "react";

export default function PasswordInput({
  label,
  name,
  placeholder,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="field">
      <label className="field-label">{label}</label>

      <div className="password-wrapper">
        <input
          className="input"
          type={showPassword ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          autoComplete="current-password"
        />

        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? "🙈" : "👁"}
        </button>
      </div>
    </div>
  );
}