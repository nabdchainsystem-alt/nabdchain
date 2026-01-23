
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';

interface FocusContextType {
    isActive: boolean;
    isSessionActive: boolean;
    timeLeft: number;
    startFocus: (durationMinutes: number) => void;
    stopFocus: () => void; // Legacy, aliases to pause
    toggleFocus: () => void;
    resetFocus: () => void;
    cancelFocus: () => void;
    formatTime: (seconds: number) => string;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const FocusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isActive, setIsActive] = useState(false); // Timer is ticking
    const [isSessionActive, setIsSessionActive] = useState(false); // Timer UI is visible
    const [timeLeft, setTimeLeft] = useState(25 * 60);

    const startFocus = useCallback((durationMinutes: number) => {
        setTimeLeft(durationMinutes * 60);
        setIsActive(true);
        setIsSessionActive(true);
    }, []);

    const stopFocus = useCallback(() => {
        setIsActive(false);
    }, []);

    const toggleFocus = useCallback(() => {
        setIsActive(prev => !prev);
    }, []);

    const resetFocus = useCallback(() => {
        setIsActive(false);
        setTimeLeft(25 * 60);
    }, []);

    const cancelFocus = useCallback(() => {
        setIsActive(false);
        setIsSessionActive(false);
        setTimeLeft(25 * 60);
    }, []);

    const formatTime = useCallback((seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsActive(false);
                        // Keep session active so user sees 00:00? Or close?
                        // Let's keep it active but finished.
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const value = useMemo(() => ({
        isActive,
        isSessionActive,
        timeLeft,
        startFocus,
        stopFocus,
        toggleFocus,
        resetFocus,
        cancelFocus,
        formatTime
    }), [isActive, isSessionActive, timeLeft, startFocus, stopFocus, toggleFocus, resetFocus, cancelFocus, formatTime]);

    return (
        <FocusContext.Provider value={value}>
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
