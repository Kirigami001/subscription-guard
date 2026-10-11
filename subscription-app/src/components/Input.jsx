import React from 'react';

export default function Input({
  label,
  error,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  ...props
}) {
  return (
    <div className="input-group">
      {label && (
        <label className="input-label" htmlFor={name}>
          {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="input-field"
        {...props}
      />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}
