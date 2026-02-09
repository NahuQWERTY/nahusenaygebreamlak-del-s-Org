
import React, { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({ label, error, required, ...props }) => (
  <div className="mb-6">
    <label className="block text-sm font-bold text-[#0D0D12] mb-2.5 px-1">
      {label} {required && <span className="text-gray-500 font-normal">*</span>}
    </label>
    <input
      {...props}
      className={`w-full px-6 py-4 border border-gray-200 rounded-[1.5rem] bg-white shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] focus:shadow-[0_8px_30px_rgb(0,0,0,0.08)] focus:border-[#0D0D12] outline-none transition-all font-semibold text-base placeholder:text-gray-400 ${
        error ? 'border-red-500' : 'hover:border-gray-400'
      }`}
    />
    {error && <p className="text-xs text-red-600 mt-2 px-4 font-bold">{error}</p>}
  </div>
);

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, error, required, rows = 4, ...props }) => (
  <div className="mb-8">
    <label className="block text-sm font-bold text-[#0D0D12] mb-2.5 px-1">
      {label} {required && <span className="text-gray-500 font-normal">*</span>}
    </label>
    <textarea
      {...props}
      rows={rows}
      className={`w-full px-6 py-5 border border-gray-200 rounded-[2rem] bg-white shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] focus:shadow-[0_8px_30px_rgb(0,0,0,0.08)] focus:border-[#0D0D12] outline-none transition-all resize-none font-semibold text-base leading-relaxed placeholder:text-gray-400 ${
        error ? 'border-red-500' : 'hover:border-gray-400'
      }`}
    />
    {error && <p className="text-xs text-red-600 mt-2 px-4 font-bold">{error}</p>}
  </div>
);

export const Select: React.FC<{
  label: string;
  options: { label: string; value: string }[];
  required?: boolean;
  value: string;
  onChange: any;
  name: string;
}> = ({ label, options, required, ...props }) => (
  <div className="mb-6">
    <label className="block text-sm font-bold text-[#0D0D12] mb-2.5 px-1">
      {label} {required && <span className="text-gray-500 font-normal">*</span>}
    </label>
    <div className="relative">
      <select
        {...props}
        className="w-full px-6 py-4 border border-gray-200 bg-white rounded-[1.5rem] shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] focus:border-[#0D0D12] outline-none appearance-none font-semibold text-base cursor-pointer hover:border-gray-400 transition-all text-[#0D0D12]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#0D0D12]">
        <i className="fa-solid fa-chevron-down text-[10px]"></i>
      </div>
    </div>
  </div>
);

export const RadioGroup: React.FC<{
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: any) => void;
  required?: boolean;
}> = ({ label, options, value, onChange, required }) => (
  <div className="mb-8">
    <label className="block text-sm font-bold text-[#0D0D12] mb-3 px-1">
      {label} {required && <span className="text-gray-500 font-normal">*</span>}
    </label>
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-8 py-3 rounded-full border text-sm font-bold transition-all shadow-sm ${
            value === opt.value 
              ? 'bg-[#0D0D12] border-[#0D0D12] text-white shadow-black/20' 
              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

export const Calendar: React.FC<{
  label: string;
  value: string;
  onChange: (date: string) => void;
  error?: string;
}> = ({ label, value, onChange, error }) => {
  const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date());
  
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isSelected = (d: number) => {
    if (!value) return false;
    const selected = new Date(value);
    return selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === d;
  };

  const isPast = (d: number) => {
    const checkDate = new Date(year, month, d);
    return checkDate < today;
  };

  const handleDateClick = (d: number) => {
    if (isPast(d)) return;
    const dateStr = new Date(year, month, d).toISOString().split('T')[0];
    onChange(dateStr);
  };

  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate);

  return (
    <div className="mb-0">
      {label && <label className="block text-sm font-bold text-[#0D0D12] mb-2.5 px-1">{label}</label>}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <button type="button" onClick={prevMonth} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <i className="fa-solid fa-chevron-left text-[12px]"></i>
          </button>
          <span className="text-xs font-black uppercase tracking-widest">{monthName} {year}</span>
          <button type="button" onClick={nextMonth} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <i className="fa-solid fa-chevron-right text-[12px]"></i>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
            <div key={d} className="text-center text-[10px] font-black text-gray-300 py-3 uppercase tracking-tighter">{d}</div>
          ))}
          {Array.from({ length: firstDayOfMonth(year, month) }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth(year, month) }).map((_, i) => {
            const day = i + 1;
            const past = isPast(day);
            const selected = isSelected(day);
            return (
              <button
                key={day}
                type="button"
                disabled={past}
                onClick={() => handleDateClick(day)}
                className={`aspect-square text-[11px] font-black rounded-xl flex items-center justify-center transition-all ${
                  selected 
                    ? 'bg-black text-white shadow-lg scale-110' 
                    : past 
                    ? 'text-gray-200 cursor-not-allowed' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
      {error && <p className="text-xs text-red-600 mt-2 px-4 font-bold">{error}</p>}
    </div>
  );
};
