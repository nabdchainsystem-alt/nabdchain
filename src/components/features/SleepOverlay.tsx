import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CaretLeft, CaretRight } from 'phosphor-react';

interface SleepOverlayProps {
    onCheck: () => void;
}

type Scene = 'rain' | 'video1' | 'video2' | 'video3' | 'video4';

interface SceneConfig {
    id: Scene;
    label: string;
    textColor: string;
    subTextColor: string;
}

const SCENES: SceneConfig[] = [
    { id: 'rain', label: '🌧️ Animated Rain', textColor: 'text-gray-300', subTextColor: 'text-gray-500' },
    { id: 'video1', label: '🌧️ Gentle Rain', textColor: 'text-gray-200', subTextColor: 'text-gray-400' },
    { id: 'video2', label: '🌌 Starry Night', textColor: 'text-blue-300', subTextColor: 'text-blue-400/70' },
    { id: 'video3', label: '⛈️ Heavy Storm', textColor: 'text-slate-200', subTextColor: 'text-slate-400' },
    { id: 'video4', label: '🌧️ Midnight Rain', textColor: 'text-indigo-200', subTextColor: 'text-indigo-400' },
];

// Generate subtle rain drops
const generateRainDrops = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 2,
        opacity: 0.1 + Math.random() * 0.2,
    }));
};

export const SleepOverlay: React.FC<SleepOverlayProps> = ({ onCheck }) => {
    const [timeLeft, setTimeLeft] = useState(300);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const rainAudioRef = useRef<HTMLAudioElement | null>(null);
    const [isExiting, setIsExiting] = useState(false);
    const [lightning, setLightning] = useState(false);
    const [sceneIndex, setSceneIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const [introStep, setIntroStep] = useState(0);
    const userInteractedRef = useRef(false);

    // Get current scene config
    const currentScene = SCENES[sceneIndex];
    const scene = currentScene.id;

    // Generate elements once
    const rainDrops = useMemo(() => generateRainDrops(80), []);

    // Intro animation sequence
    useEffect(() => {
        const timer1 = setTimeout(() => setIntroStep(1), 500);
        const timer2 = setTimeout(() => setIntroStep(2), 2500);
        const timer3 = setTimeout(() => setShowIntro(false), 5500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, []);

    // Scene navigation
    const goToScene = useCallback((direction: 'left' | 'right') => {
        if (isTransitioning) return;
        userInteractedRef.current = true; // Stop auto-nav on manual interaction
        setIsTransitioning(true);

        setTimeout(() => {
            if (direction === 'right') {
                setSceneIndex((prev) => (prev + 1) % SCENES.length);
            } else {
                setSceneIndex((prev) => (prev - 1 + SCENES.length) % SCENES.length);
            }
            setTimeout(() => setIsTransitioning(false), 600);
        }, 600);
    }, [isTransitioning]);

    // Auto-navigate every 3 seconds (stops if user interacts)
    useEffect(() => {
        const interval = setInterval(() => {
            if (!userInteractedRef.current && !isTransitioning) {
                setIsTransitioning(true);
                setTimeout(() => {
                    setSceneIndex((prev) => (prev + 1) % SCENES.length);
                    setTimeout(() => setIsTransitioning(false), 600);
                }, 600);
            }
        }, 3000); // 3 seconds per scene

        return () => clearInterval(interval);
    }, [isTransitioning]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') goToScene('right');
            if (e.key === 'ArrowLeft') goToScene('left');
            if (e.key === 'Escape') handleExit();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToScene]);

    // Audio with smooth fade-in
    useEffect(() => {
        // Thunder audio
        const audio = new Audio('/sounds/dry-thunder-364468.mp3');
        audio.loop = true;
        audio.volume = 0;
        audioRef.current = audio;

        // Rain audio
        const rainAudio = new Audio('/sounds/calming-rain-257596.mp3');
        rainAudio.loop = true;
        rainAudio.volume = 0;
        rainAudioRef.current = rainAudio;

        audio.play().catch(e => console.log('Thunder audio play failed:', e));
        rainAudio.play().catch(e => console.log('Rain audio play failed:', e));

        let volume = 0;
        const fadeIn = setInterval(() => {
            volume += 0.02;
            if (volume >= 0.6) {
                volume = 0.6;
                clearInterval(fadeIn);
            }
            audio.volume = volume;
            rainAudio.volume = volume * 0.7; // Rain slightly quieter than thunder
        }, 60);

        return () => {
            clearInterval(fadeIn);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            if (rainAudioRef.current) {
                rainAudioRef.current.pause();
                rainAudioRef.current.currentTime = 0;
            }
        };
    }, []);

    // Lightning for rain scene
    useEffect(() => {
        if (scene !== 'rain') return;

        const triggerLightning = () => {
            const delay = 15000 + Math.random() * 25000;
            return setTimeout(() => {
                setLightning(true);
                setTimeout(() => setLightning(false), 80);
                setTimeout(() => setLightning(true), 160);
                setTimeout(() => setLightning(false), 280);
                lightningTimeout.current = triggerLightning();
            }, delay);
        };

        const lightningTimeout = { current: triggerLightning() };
        return () => clearTimeout(lightningTimeout.current);
    }, [scene]);

    // Countdown - auto-exit when timer reaches 0
    useEffect(() => {
        if (timeLeft <= 0) {
            handleExit();
            return;
        }
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
        const rainAudio = rainAudioRef.current;

        if (audio || rainAudio) {
            let volume = audio?.volume || rainAudio?.volume || 0.6;
            const fadeOut = setInterval(() => {
                volume -= 0.02;
                if (volume <= 0) {
                    clearInterval(fadeOut);
                    if (audio) {
                        audio.pause();
                        audio.currentTime = 0;
                    }
                    if (rainAudio) {
                        rainAudio.pause();
                        rainAudio.currentTime = 0;
                    }
                    onCheck();
                }
                if (audio) audio.volume = Math.max(0, volume);
                if (rainAudio) rainAudio.volume = Math.max(0, volume * 0.7);
            }, 30);
        } else {
            onCheck();
        }
    };

    return (
        <>
            <style>{`
                @keyframes rain-line {
                    0% { transform: translateY(-20px); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(100vh); opacity: 0; }
                }
                .rain-line {
                    position: absolute;
                    top: -20px;
                    width: 1px;
                    height: 40px;
                    background: linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%);
                    animation: rain-line linear infinite;
                    pointer-events: none;
                }
                .intro-text {
                    opacity: 0;
                    transform: translateY(10px);
                    transition: opacity 0.8s ease-out, transform 0.8s ease-out;
                }
                .intro-text.visible {
                    opacity: 1;
                    transform: translateY(0);
                }
                .scene-content {
                    transition: opacity 0.6s ease-in-out;
                }
                .nav-arrow {
                    transition: all 0.3s ease;
                }
            `}</style>

            <div
                onClick={handleExit}
                className={`fixed inset-0 z-[9999] overflow-hidden cursor-pointer select-none transition-all duration-1000 bg-black ${isExiting ? 'opacity-0' : ''}`}
            >
                {/* Intro overlay */}
                {showIntro && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
                        <div className="text-center space-y-6">
                            <p className={`intro-text text-gray-400 text-lg ${introStep >= 1 ? 'visible' : ''}`}>
                                🔊 Increasing volume...
                            </p>
                            <p className={`intro-text text-gray-300 text-xl ${introStep >= 2 ? 'visible' : ''}`} style={{ transitionDelay: '0.3s' }}>
                                Relax and breathe deeply
                            </p>
                        </div>
                    </div>
                )}

                {/* Scene content */}
                <div className="scene-content absolute inset-0" style={{ opacity: isTransitioning ? 0 : 1 }}>
                    {scene === 'rain' && (
                        <>
                            <div className="absolute inset-0 pointer-events-none transition-opacity" style={{ background: 'rgba(255, 255, 255, 0.08)', opacity: lightning ? 1 : 0, transitionDuration: '50ms' }} />
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                {rainDrops.map((drop) => (
                                    <div key={drop.id} className="rain-line" style={{ left: `${drop.left}%`, opacity: drop.opacity, animationDelay: `${drop.delay}s`, animationDuration: `${drop.duration}s` }} />
                                ))}
                            </div>
                        </>
                    )}
                    {scene === 'video1' && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <video autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: 'brightness(0.4)' }}>
                                <source src="/videos/rain-background.mp4" type="video/mp4" />
                            </video>
                        </div>
                    )}
                    {scene === 'video2' && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <video autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: 'brightness(0.4)' }}>
                                <source src="/videos/rain-background2.mp4" type="video/mp4" />
                            </video>
                        </div>
                    )}
                    {scene === 'video3' && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <video autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: 'brightness(0.4)' }}>
                                <source src="/videos/ain-background3.mp4" type="video/mp4" />
                            </video>
                        </div>
                    )}
                    {scene === 'video4' && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <video autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: 'brightness(0.4)' }}>
                                <source src="/videos/ain-background4.mp4" type="video/mp4" />
                            </video>
                        </div>
                    )}
                </div>

                {/* Navigation arrows */}
                <button
                    onClick={(e) => { e.stopPropagation(); goToScene('left'); }}
                    className="nav-arrow absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full text-white/20 hover:text-white/50 hover:bg-white/5"
                >
                    <CaretLeft size={18} weight="bold" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); goToScene('right'); }}
                    className="nav-arrow absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full text-white/20 hover:text-white/50 hover:bg-white/5"
                >
                    <CaretRight size={18} weight="bold" />
                </button>

                {/* Scene indicators */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                    {SCENES.map((s, i) => (
                        <div
                            key={s.id}
                            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                            style={{ background: i === sceneIndex ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)' }}
                        />
                    ))}
                </div>

                {/* Main content */}
                <div className="relative z-20 h-full flex flex-col items-center justify-center text-white">
                    <div className="text-center space-y-6">
                        <h2 className="text-3xl font-light tracking-wide text-gray-400">
                            Time to rest your eyes
                        </h2>

                        <div className="text-8xl font-mono font-bold tracking-wider tabular-nums text-white">
                            {formatTime(timeLeft)}
                        </div>

                        <p className={`text-sm mt-6 transition-colors duration-500 ${currentScene.textColor}`}>
                            {currentScene.label}
                        </p>

                        <p className={`text-sm mt-6 transition-colors duration-500 ${currentScene.subTextColor}`}>
                            Click anywhere to exit • ← → to switch
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};
