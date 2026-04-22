import React from 'react';
import { ChevronDown } from 'lucide-react';

const Select = ({ label, value, onChange, options, required = false, placeholder = 'Select option', icon: Icon, className = '', disabled = false }) => (
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
      <select
        value={value} onChange={onChange} required={required} disabled={disabled}
        className={`input appearance-none cursor-pointer pr-8 dark:bg-gray-800 dark:text-gray-100 ${Icon ? 'pl-9' : ''} ${disabled ? 'bg-gray-50 dark:bg-gray-900/50 cursor-not-allowed' : ''} ${required && !value && !disabled ? 'border-red-500/50 bg-red-50/10 dark:bg-red-900/5' : ''}`}
      >
        <option value="" disabled className="dark:bg-gray-800 text-gray-400">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="dark:bg-gray-800 dark:text-gray-100">{opt.label}</option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
        <ChevronDown size={14} />
      </div>
    </div>
  </div>
);

export default Select;
