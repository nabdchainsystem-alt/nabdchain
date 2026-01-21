import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, Info, WarningCircle, X } from 'phosphor-react';

interface ToastMessage {
    id: number;
    message: string;
    type: 'info' | 'success' | 'error';
}

interface ToastContextType {
    showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        // Fallback if used outside provider, though we wrap App
        return { showToast: (msg: string) => { } };
    }
    return context;
};

const ToastItem: React.FC<ToastMessage & { onClose: (id: number) => void }> = ({ id, message, type, onClose }) => {
    const bgColors = {
        info: 'bg-gray-900 text-white border-gray-800',
        success: 'bg-emerald-600 text-white border-emerald-700',
        error: 'bg-red-600 text-white border-red-700'
    };

    const icons = {
        info: <Info size={18} />,
        success: <CheckCircle size={18} />,
        error: <WarningCircle size={18} />
    };

    return (
        <div className={`${bgColors[type]} px-4 py-3 rounded-lg shadow-xl flex items-center space-x-3 min-w-[300px] max-w-md animate-in slide-in-from-right-5 fade-in duration-300 border`}>
            <div className="flex-shrink-0">{icons[type]}</div>
            <span className="text-sm font-medium flex-1">{message}</span>
            <button onClick={() => onClose(id)} className="opacity-70 hover:opacity-100 transition-opacity">
                <X size={16} />
            </button>
        </div>
    );
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col space-y-3 pointer-events-auto">
                {toasts.map(t => (
                    <ToastItem key={t.id} {...t} onClose={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};
