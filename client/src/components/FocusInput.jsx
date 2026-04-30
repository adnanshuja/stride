import { useState } from 'react';

export default function FocusInput({ initialValue, onChange }) {
  const [value, setValue] = useState(initialValue || '');

  const handleBlur = () => {
    if (onChange) onChange(value);
  };

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
      <span className="text-[11px] text-gray-600 font-sans tracking-wider uppercase">Today's Focus</span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="What's your main goal today?"
        className="w-full bg-transparent text-sm text-gray-300 font-sans placeholder:text-gray-700 focus:outline-none mt-0.5"
      />
    </div>
  );
}
