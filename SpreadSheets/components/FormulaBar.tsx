import React from 'react';

interface FormulaBarProps {
  selectedCell: string;
  value: string | number;
}

export const FormulaBar: React.FC<FormulaBarProps> = ({ selectedCell, value }) => {
  return (
    <div className="flex items-center gap-0 px-2 py-1 bg-white border-b border-gray-200 h-10">
      {/* Name Box */}
      <div className="relative group flex items-center h-full">
        <input 
          className="w-20 px-2 py-1 text-sm font-medium text-center border-none focus:ring-1 focus:ring-black rounded hover:bg-gray-50 bg-transparent text-gray-700" 
          type="text" 
          value={selectedCell}
          readOnly
        />
        <div className="w-[1px] h-4 bg-gray-300 mx-2"></div>
      </div>

      {/* Fx Button */}
      <button className="px-3 text-gray-500 hover:text-black font-serif italic font-bold text-lg flex items-center justify-center h-full">
        fx
      </button>
      <div className="w-[1px] h-6 bg-gray-300 mx-1"></div>

      {/* Input Area */}
      <input 
        className="flex-1 px-2 py-1 text-sm text-gray-900 border-none focus:ring-0 placeholder:text-gray-400 font-display h-full" 
        placeholder="Enter text or formula" 
        type="text" 
        value={value} 
        readOnly // Readonly for this demo
      />
    </div>
  );
};