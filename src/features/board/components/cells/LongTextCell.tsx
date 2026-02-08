import React from 'react';
export const LongTextCell: React.FC<{ value?: string; onChange: (val: string) => void }> = ({ value, onChange }) => (
  <input value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent p-1" />
);
