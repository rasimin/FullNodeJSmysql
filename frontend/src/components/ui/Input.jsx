import { Calendar, Clock, X } from 'lucide-react';

const Input = ({ 
  label, type = 'text', placeholder, value, onChange, onClear,
  required = false, icon: Icon, className = '', disabled = false, readOnly = false 
}) => {
  const isDate = type === 'date' || type === 'datetime-local';
  const isTime = type === 'time';
  
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 px-1">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
            <Icon size={15} />
          </div>
        )}
        <input
          type={type} value={value} onChange={onChange}
          required={required} placeholder={placeholder}
          disabled={disabled} readOnly={readOnly}
          onClick={(e) => {
            if ((isDate || isTime) && !disabled && !readOnly) {
              try { e.currentTarget.showPicker(); } catch (err) { }
            }
          }}
          className={`input ${Icon ? 'pl-9' : ''} ${(isDate || isTime || (onClear && value)) ? 'pr-10' : ''} ${disabled || readOnly ? 'bg-gray-50 dark:bg-gray-900/50 cursor-not-allowed' : ''} ${isDate || isTime ? 'cursor-pointer' : ''} ${required && !value && !disabled && !readOnly ? 'border-red-500/50 bg-red-50/10 dark:bg-red-900/5' : ''} appearance-none custom-date-input`}
        />
        
        {/* Clear Button */}
        {onClear && value && !disabled && !readOnly && !isDate && !isTime && (
          <button 
            type="button" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClear();
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500 transition-all active:scale-90"
          >
            <X size={15} />
          </button>
        )}
        {(isDate || isTime) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 group-hover:text-blue-500 transition-colors">
            {isDate ? <Calendar size={15} /> : <Clock size={15} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default Input;
