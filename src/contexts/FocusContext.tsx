
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FocusContextType {
    isActive: boolean;
    timeLeft: number;
    startFocus: (durationMinutes: number) => void;
    stopFocus: () => void;
    formatTime: (seconds: number) => string;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const FocusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60);

    const startFocus = (durationMinutes: number) => {
        setTimeLeft(durationMinutes * 60);
        setIsActive(true);
    };

    const stopFocus = () => {
        setIsActive(false);
        // Optionally reset timer or keep it paused
        // setTimeLeft(25 * 60); 
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsActive(false);
                        // Could trigger a notification here
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    return (
        <FocusContext.Provider value={{ isActive, timeLeft, startFocus, stopFocus, formatTime }}>
            {children}
        </FocusContext.Provider>
    );
};

export const useFocus = () => {
    const context = useContext(FocusContext);
    if (context === undefined) {
        throw new Error('useFocus must be used within a FocusProvider');
    }
    return context;
};
