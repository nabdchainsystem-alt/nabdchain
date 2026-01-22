import React, { useState } from 'react';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { FormulaBar } from './components/FormulaBar';
import { Grid } from './components/Grid';
import { Footer } from './components/Footer';
import { INITIAL_DATA } from './constants';
import { GridData } from './types';

// Export as a component that can be used within NABD
export const SpreadsheetApp: React.FC = () => {
    const [selectedCell, setSelectedCell] = useState<{ col: string; row: number }>({ col: 'D', row: 2 });
    const [data] = useState<GridData>(INITIAL_DATA);

    // Get current cell value for Formula Bar
    const currentCellId = `${selectedCell.col}${selectedCell.row}`;
    const currentCellValue = data[currentCellId]?.value || '';

    return (
        <div className="flex flex-col h-full w-full bg-white text-gray-900 overflow-hidden font-[Inter]">
            <Header />
            <Toolbar />
            <FormulaBar
                selectedCell={currentCellId}
                value={currentCellValue}
            />
            <Grid
                data={data}
                selectedCell={selectedCell}
                onSelectCell={(col, row) => setSelectedCell({ col, row })}
            />
            <Footer />
        </div>
    );
};
