
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoChat } from './VideoChat';
import { LiveBoard } from './LiveBoard';
import { Share, Chalkboard, ArrowLeft } from 'phosphor-react';

export const LiveSessionPage: React.FC = () => {
    const { roomId = 'general' } = useParams();
    const navigate = useNavigate();
    const [isBoardOpen, setIsBoardOpen] = useState(false);

    const copyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        alert('Session link copied to clipboard!');
    };

    return (
        <div className="relative h-screen bg-gray-900 text-white overflow-hidden flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold">Live Session</h1>
                        <p className="text-xs text-gray-300 opacity-70">Room: {roomId}</p>
                    </div>
                </div>

                <div className="pointer-events-auto flex gap-3">
                    <button
                        onClick={() => setIsBoardOpen(!isBoardOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isBoardOpen ? 'bg-blue-600 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                        <Chalkboard size={20} />
                        <span>Whiteboard</span>
                    </button>
                    <button
                        onClick={copyLink}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        <Share size={20} />
                        <span>Invite</span>
                    </button>
                </div>
            </div>

            {/* Video Background (or main content) */}
            <div className="flex-1 relative">
                <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                    <p>Background Content / Shared Screen Area</p>
                </div>

                {/* Video Chat Overlay */}
                <VideoChat roomId={roomId} />
            </div>

            {/* Whiteboard Overlay */}
            {isBoardOpen && (
                <LiveBoard roomId={roomId} onClose={() => setIsBoardOpen(false)} />
            )}
        </div>
    );
};
