import React from 'react';
export const PersonCell: React.FC<{ personId?: string; onChange: (val: string) => void }> = ({
  personId,
  onChange,
}) => (
  <div
    onClick={() => onChange('u2')}
    className="bg-blue-400 p-1 text-xs text-center cursor-pointer text-white rounded-full w-6 h-6"
  >
    {personId ? personId[0] : '?'}
  </div>
);
