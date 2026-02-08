import React from 'react';
import { SpreadsheetApp } from './spreadsheets/SpreadsheetApp';

interface SmartSheetViewProps {
  boardId: string;
}

const SmartSheetView: React.FC<SmartSheetViewProps> = ({ _boardId }) => {
  // Note: boardId is available here if we want to add persistence in the future,
  // but for now we are using the new SpreadSheets tool as is.
  return (
    <div className="h-full w-full overflow-hidden">
      <SpreadsheetApp />
    </div>
  );
};

export default SmartSheetView;
