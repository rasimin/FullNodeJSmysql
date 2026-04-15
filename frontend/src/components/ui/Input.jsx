import React from 'react';

const Input = ({ label, type = 'text', placeholder, value, onChange, required = false, icon: Icon, className = '', disabled = false, readOnly = false }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    )}
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Icon size={15} />
        </div>
      )}
      <input
        type={type} value={value} onChange={onChange}
        required={required} placeholder={placeholder}
        disabled={disabled} readOnly={readOnly}
        className={`input ${Icon ? 'pl-9' : ''} ${disabled || readOnly ? 'bg-gray-50 dark:bg-gray-900/50 cursor-not-allowed' : ''}`}
      />
    </div>
  </div>
);

export default Input;
