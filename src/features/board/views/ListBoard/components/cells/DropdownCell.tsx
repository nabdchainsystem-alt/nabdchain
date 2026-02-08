import React from 'react';
export const DropdownCell: React.FC<{
  value?: string;
  onChange: (val: string) => void;
  options?: { id: string; label: string }[];
}> = ({ value, onChange, options }) => (
  <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent p-1">
    <option value="">-</option>
    {options?.map((o) => (
      <option key={o.id} value={o.id}>
        {o.label}
      </option>
    ))}
  </select>
);
