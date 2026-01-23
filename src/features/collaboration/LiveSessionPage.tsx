
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoChat } from './VideoChat';
import { LiveBoard } from './LiveBoard';
import { Share, Chalkboard, X } from 'phosphor-react';
import { useAppContext } from '../../contexts/AppContext';

interface LiveSessionPageProps {
    onClose?: () => void; // Optional close handler for modal mode
}

export const LiveSessionPage: React.FC<LiveSessionPageProps> = ({ onClose }) => {
    const { roomId = 'general' } = useParams();
    const navigate = useNavigate();
    const { t, dir } = useAppContext();
    const [isBoardOpen, setIsBoardOpen] = useState(false);

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            navigate(-1);
        }
    };

    const copyLink = () => {
        const sessionUrl = `${window.location.origin}/live_session/${roomId}`;
        navigator.clipboard.writeText(sessionUrl);
        alert(t('link_copied') || 'Session link copied to clipboard!');
    };

    return (
        <div className="relative h-screen bg-gray-900 text-white overflow-hidden flex flex-col" dir={dir}>
            {/* Header */}
            <div className="relative z-50 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-lg font-semibold">{t('live_session') || 'Live Session'}</h1>
                        <p className="text-xs text-gray-300 opacity-70">{t('room') || 'Room'}: {roomId}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsBoardOpen(!isBoardOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isBoardOpen ? 'bg-blue-600 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                        <Chalkboard size={20} />
                        <span className="hidden sm:inline">{t('whiteboard') || 'Whiteboard'}</span>
                    </button>
                    <button
                        onClick={copyLink}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        <Share size={20} />
                        <span className="hidden sm:inline">{t('invite') || 'Invite'}</span>
                    </button>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors ms-2"
                        title={t('close') || 'Close'}
                    >
                        <X size={24} weight="bold" />
                    </button>
                </div>
            </div>

            {/* Video Background (or main content) */}
            <div className="flex-1 relative">
                <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                    <p>{t('shared_screen_area') || 'Shared Screen Area'}</p>
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
