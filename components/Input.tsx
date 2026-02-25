import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  labelClassName?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, labelClassName, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className={`text-sm font-semibold tracking-wide ${labelClassName || 'text-baby-navy'}`}>{label}</label>}
      <input
        className={`
            w-full
            bg-baby-navy 
            text-white 
            placeholder-white/60
            border border-white/20
            rounded-xl 
            px-4 py-2.5 
            text-sm 
            outline-none 
            transition-all duration-300 ease-in-out
            focus:border-baby-pink 
            focus:ring-4 focus:ring-baby-pink/30 
            hover:border-white/40
            accent-baby-pink
            [&::-webkit-calendar-picker-indicator]:cursor-pointer
            [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]
            ${error ? 'border-red-500 focus:ring-red-200' : ''}
        `}
        {...props}
      />
      {error && <span className="text-xs text-red-500 font-medium animate-pulse">{error}</span>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string | number; label: string }[];
    placeholder?: string;
    labelClassName?: string;
}

export const Select: React.FC<SelectProps> = ({ label, error, options, placeholder, labelClassName, className = '', ...props }) => {
    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        {label && <label className={`text-sm font-semibold tracking-wide ${labelClassName || 'text-baby-navy'}`}>{label}</label>}
        <div className="relative">
            <select
            className={`
                w-full
                appearance-none
                bg-baby-navy 
                text-white 
                border border-white/20
                rounded-xl 
                px-4 py-2.5 
                text-sm 
                outline-none 
                transition-all duration-300 ease-in-out
                focus:border-baby-pink 
                focus:ring-4 focus:ring-baby-pink/30 
                hover:border-white/40
                cursor-pointer
                ${error ? 'border-red-500 focus:ring-red-200' : ''}
            `}
            {...props}
            >
                <option value="" className="text-gray-400">{placeholder || "-- Chọn --"}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="text-white bg-baby-navy py-1 font-medium">{opt.label}</option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>
        {error && <span className="text-xs text-red-500 font-medium animate-pulse">{error}</span>}
      </div>
    );
  };
