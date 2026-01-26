import React, { useState, useEffect, useRef } from 'react';

interface FormulaBarProps {
    selectedCell: string;
    value: string | number;
    onChange: (value: string) => void;
    isEditing: boolean;
}

export const FormulaBar: React.FC<FormulaBarProps> = ({
    selectedCell,
    value,
    onChange,
    isEditing,
}) => {
    const [inputValue, setInputValue] = useState(String(value));
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync with external value
    useEffect(() => {
        if (!isFocused) {
            setInputValue(String(value));
        }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onChange(inputValue);
            inputRef.current?.blur();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setInputValue(String(value));
            inputRef.current?.blur();
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        if (inputValue !== String(value)) {
            onChange(inputValue);
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    return (
        <div className="flex items-center bg-white border-b border-[#dadce0] h-[30px]">
            {/* Name Box */}
            <div className="flex items-center h-full border-r border-[#dadce0]">
                <input
                    className="w-[80px] px-2 text-[13px] font-medium text-center border-none outline-none hover:bg-[#f1f3f4] bg-transparent text-[#202124] h-full cursor-pointer focus:bg-[#e8f0fe] focus:text-[#1a73e8] transition-colors"
                    type="text"
                    value={selectedCell}
                    readOnly
                    title="Name Box"
                />
            </div>

            {/* Function buttons */}
            <div className="flex items-center h-full border-r border-[#dadce0]">
                {(isFocused || inputValue !== String(value)) ? (
                    <>
                        <button
                            onClick={() => {
                                setInputValue(String(value));
                                inputRef.current?.blur();
                            }}
                            className="w-[30px] h-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] transition-colors"
                            title="Cancel (Escape)"
                        >
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                        <button
                            onClick={() => {
                                onChange(inputValue);
                                inputRef.current?.blur();
                            }}
                            className="w-[30px] h-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] transition-colors"
                            title="Confirm (Enter)"
                        >
                            <span className="material-symbols-outlined text-[20px]">check</span>
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            className="w-[30px] h-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] transition-colors opacity-50"
                            disabled
                        >
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                        <button
                            className="w-[30px] h-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] transition-colors opacity-50"
                            disabled
                        >
                            <span className="material-symbols-outlined text-[20px]">check</span>
                        </button>
                    </>
                )}
                <button
                    className="w-[30px] h-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] transition-colors font-serif italic font-bold text-[16px]"
                    title="Insert function"
                >
                    <span className="italic">fx</span>
                </button>
            </div>

            {/* Input Area */}
            <input
                ref={inputRef}
                className={`flex-1 px-3 text-[13px] text-[#202124] border-none outline-none h-full transition-colors ${
                    isFocused || isEditing ? 'bg-white ring-2 ring-inset ring-[#1a73e8]' : 'bg-white hover:bg-[#f8f9fa]'
                }`}
                placeholder=""
                type="text"
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onFocus={handleFocus}
            />
        </div>
    );
};
