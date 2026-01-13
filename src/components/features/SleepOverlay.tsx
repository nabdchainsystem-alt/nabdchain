import React, { useState, useEffect, useRef, useMemo } from 'react';

interface SleepOverlayProps {
    onCheck: () => void;
}

// Generate rain drops once
const generateRainDrops = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 0.5 + Math.random() * 0.3,
        width: 1 + Math.random() * 1.5,
        height: 15 + Math.random() * 20,
        opacity: 0.3 + Math.random() * 0.5,
    }));
};

export const SleepOverlay: React.FC<SleepOverlayProps> = ({ onCheck }) => {
    const [timeLeft, setTimeLeft] = useState(300);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isExiting, setIsExiting] = useState(false);
    const [lightning, setLightning] = useState(false);

    // Generate rain drops once on mount
    const rainDrops = useMemo(() => generateRainDrops(150), []);

    // Audio with fade-in
    useEffect(() => {
        const audio = new Audio('/sounds/dry-thunder-364468.mp3');
        audio.loop = true;
        audio.volume = 0;
        audioRef.current = audio;

        audio.play().catch(e => console.log('Audio play failed:', e));

        let volume = 0;
        const fadeIn = setInterval(() => {
            volume += 0.05;
            if (volume >= 0.5) {
                volume = 0.5;
                clearInterval(fadeIn);
            }
            audio.volume = volume;
        }, 100);

        return () => clearInterval(fadeIn);
    }, []);

    // Random lightning flashes
    useEffect(() => {
        const triggerLightning = () => {
            const delay = 8000 + Math.random() * 15000; // 8-23 seconds
            return setTimeout(() => {
                setLightning(true);
                // Double flash effect
                setTimeout(() => setLightning(false), 100);
                setTimeout(() => setLightning(true), 200);
                setTimeout(() => setLightning(false), 350);
                lightningTimeout.current = triggerLightning();
            }, delay);
        };

        const lightningTimeout = { current: triggerLightning() };

        return () => clearTimeout(lightningTimeout.current);
    }, []);

    // Countdown timer
    useEffect(() => {
        if (timeLeft <= 0) return;
        const intervalId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(intervalId);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleExit = () => {
        if (isExiting) return;
        setIsExiting(true);

        const audio = audioRef.current;
        if (audio) {
            let volume = audio.volume;
            const fadeOut = setInterval(() => {
                volume -= 0.05;
                if (volume <= 0) {
                    clearInterval(fadeOut);
                    audio.pause();
                    audio.currentTime = 0;
                    onCheck();
                }
                audio.volume = Math.max(0, volume);
            }, 50);
        } else {
            onCheck();
        }
    };

    return (
        <>
            <style>{`
                @keyframes rain-fall {
                    0% {
                        transform: translateY(-100vh) translateX(0);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    90% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) translateX(-20px);
                        opacity: 0;
                    }
                }
                
                @keyframes lightning-flash {
                    0%, 100% { opacity: 0; }
                    50% { opacity: 1; }
                }
                
                .rain-drop {
                    position: absolute;
                    top: -50px;
                    background: linear-gradient(to bottom, 
                        rgba(174, 194, 224, 0) 0%,
                        rgba(174, 194, 224, 0.6) 50%,
                        rgba(174, 194, 224, 0.9) 100%);
                    border-radius: 0 0 5px 5px;
                    animation: rain-fall linear infinite;
                    will-change: transform;
                    pointer-events: none;
                }
                
                .lightning-overlay {
                    position: fixed;
                    inset: 0;
                    background: radial-gradient(ellipse at top, rgba(200, 200, 255, 0.4) 0%, transparent 70%);
                    pointer-events: none;
                    z-index: 10;
                    transition: opacity 0.05s ease-out;
                }
            `}</style>

            <div
                onClick={handleExit}
                className={`fixed inset-0 z-[9999] overflow-hidden cursor-pointer select-none transition-opacity duration-700 ${isExiting ? 'opacity-0' : ''}`}
                style={{
                    background: 'linear-gradient(to bottom, #0a0a12 0%, #1a1a2e 50%, #16213e 100%)',
                }}
            >
                {/* Lightning flash overlay */}
                <div
                    className="lightning-overlay"
                    style={{ opacity: lightning ? 1 : 0 }}
                />

                {/* Rain container */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {rainDrops.map((drop) => (
                        <div
                            key={drop.id}
                            className="rain-drop"
                            style={{
                                left: `${drop.left}%`,
                                width: `${drop.width}px`,
                                height: `${drop.height}px`,
                                opacity: drop.opacity,
                                animationDelay: `${drop.delay}s`,
                                animationDuration: `${drop.duration}s`,
                            }}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="relative z-20 h-full flex flex-col items-center justify-center text-white">
                    <div className="text-center space-y-8">
                        <h2 className="text-4xl font-light tracking-wide text-gray-300 drop-shadow-lg">
                            Time to rest your eyes
                        </h2>

                        <div
                            className="text-9xl font-mono font-bold tracking-wider tabular-nums drop-shadow-2xl"
                            style={{
                                textShadow: lightning
                                    ? '0 0 60px rgba(200, 200, 255, 0.8), 0 0 120px rgba(200, 200, 255, 0.4)'
                                    : '0 0 40px rgba(0, 0, 0, 0.5)',
                                transition: 'text-shadow 0.1s ease-out',
                            }}
                        >
                            {formatTime(timeLeft)}
                        </div>

                        <p className="text-gray-400 text-sm mt-4">
                            🌧️ Rain & Thunder ambience
                        </p>

                        <p className="text-gray-500 text-lg mt-8 animate-pulse">
                            Click anywhere to resume
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};
