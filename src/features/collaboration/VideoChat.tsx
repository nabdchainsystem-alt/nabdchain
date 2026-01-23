
import React, { useEffect, useRef, useState } from 'react';
import SimplePeer, { Instance } from 'simple-peer';
import { useSocket } from '../../contexts/SocketContext';
import { useUser } from '../../auth-adapter';
import { useAppContext } from '../../contexts/AppContext';
import { Phone, PhoneSlash, Microphone, MicrophoneSlash, VideoCamera, VideoCameraSlash, Monitor, MonitorPlay } from 'phosphor-react';

// Free STUN/TURN servers for WebRTC connectivity
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        // Free TURN server from Open Relay Project (for NAT traversal)
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
    ],
};

interface VideoChatProps {
    roomId: string;
}

interface PeerNode {
    peerId: string;
    peer: Instance;
    userId?: string;
    name?: string;
}

const Video = ({ peer, name }: { peer: Instance, name?: string }) => {
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        peer.on('stream', (stream) => {
            if (ref.current) ref.current.srcObject = stream;
        });
    }, [peer]);

    return (
        <div className="relative w-48 h-36 bg-gray-900 rounded-lg overflow-hidden shadow-md">
            <video playsInline autoPlay ref={ref} className="w-full h-full object-cover" />
            <div className="absolute bottom-1 left-2 text-xs text-white bg-black/50 px-1 rounded">
                {name || 'Unknown'}
            </div>
        </div>
    );
};

export const VideoChat: React.FC<VideoChatProps> = ({ roomId }) => {
    const { socket } = useSocket();
    const { user } = useUser();
    const { t } = useAppContext();
    const [peers, setPeers] = useState<PeerNode[]>([]);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const [isJoined, setIsJoined] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    const userVideo = useRef<HTMLVideoElement>(null);
    const peersRef = useRef<PeerNode[]>([]); // Keep ref for event callbacks

    // Set video stream when it changes
    useEffect(() => {
        if (userVideo.current && stream && !isScreenSharing) {
            userVideo.current.srcObject = stream;
            // Ensure video plays (needed for some browsers)
            userVideo.current.play().catch(err => {
                console.log('Video autoplay prevented:', err);
            });
        }
    }, [stream, isJoined, isScreenSharing]);

    useEffect(() => {
        if (!socket) return;

        // Cleanup on unmount
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
            }
            // Destroy all peers
            peersRef.current.forEach(p => p.peer.destroy());
        };
    }, [stream, screenStream]);

    const joinCall = async () => {
        setIsJoining(true);
        try {
            console.log('[VideoChat] Joining call, socket status:', socket ? 'connected' : 'not connected');

            if (!socket) {
                alert('Socket not connected. Please refresh the page.');
                setIsJoining(false);
                return;
            }

            const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            console.log('[VideoChat] Got media stream:', currentStream.getTracks().map(t => t.kind));

            setStream(currentStream);
            setIsJoined(true);
            setIsJoining(false);

            // Use setTimeout to ensure video element is rendered before setting srcObject
            setTimeout(() => {
                if (userVideo.current) {
                    userVideo.current.srcObject = currentStream;
                    userVideo.current.play().catch(console.log);
                }
            }, 100);

            // Get all other users in the room to initiate connections
            socket.emit('join-room', {
                roomId,
                userId: user?.id || 'guest',
                name: user?.firstName || 'Guest',
                avatarUrl: user?.imageUrl
            });

            socket.on('room-users', (users: any[]) => {
                const peers: PeerNode[] = [];

                // Filter out self
                const others = users.filter(u => u.socketId !== socket.id);

                others.forEach(userToCall => {
                    // Initiate connection to existing users (We match "Init" side)
                    const peer = createPeer(userToCall.socketId, socket.id!, currentStream);
                    peersRef.current.push({
                        peerId: userToCall.socketId,
                        peer,
                        userId: userToCall.userId,
                        name: userToCall.name
                    });
                    peers.push({
                        peerId: userToCall.socketId,
                        peer,
                        userId: userToCall.userId,
                        name: userToCall.name
                    });
                });
                setPeers(peers);
            });

            socket.on('user-joined', (payload) => {
                // Wait for THEM to call US (We are "Receiver" side for new joiners in simple-peer mesh usually, 
                // BUT in this logic: existing users call new users? Or new users call existing?
                // Standard mesh: New joiner calls everyone.
                // My 'createPeer' implementation below implies WE are calling THEM.
                // So 'room-users' handles existing. 'user-joined' just notifies.
                // Actually, if I follow standard mesh:
                // 1. Join room. 2. Get list of all users. 3. Call all of them.
                // 4. When someone NEW joins, they will call ME. So I need to listen for 'call-made'.
            });

            socket.on('call-made', ({ signal, from, name }) => {
                const peer = addPeer(signal, from, currentStream);
                const peerObj = { peerId: from, peer, name };
                peersRef.current.push(peerObj);
                setPeers(prev => [...prev, peerObj]);
            });

            socket.on('call-answered', ({ signal, to }) => {
                const item = peersRef.current.find(p => p.peerId === to);
                if (item) {
                    item.peer.signal(signal);
                }
            });

            socket.on('peer-signal', ({ signal, from }) => {
                const item = peersRef.current.find(p => p.peerId === from);
                if (item) {
                    item.peer.signal(signal);
                }
            });

            socket.on('user-left', ({ socketId }) => {
                const peerObj = peersRef.current.find(p => p.peerId === socketId);
                if (peerObj) peerObj.peer.destroy();
                const newPeers = peersRef.current.filter(p => p.peerId !== socketId);
                peersRef.current = newPeers;
                setPeers(newPeers);
            });

        } catch (err: any) {
            console.error("[VideoChat] Failed to join call:", err);
            setIsJoining(false);
            if (err.name === 'NotAllowedError') {
                alert('Camera/microphone access denied. Please allow access and try again.');
            } else if (err.name === 'NotFoundError') {
                alert('No camera or microphone found. Please connect a device and try again.');
            } else {
                alert('Failed to join: ' + (err.message || 'Unknown error'));
            }
        }
    };

    const createPeer = (userToSignal: string, callerId: string, stream: MediaStream) => {
        const peer = new SimplePeer({
            initiator: true,
            trickle: false,
            stream,
            config: ICE_SERVERS,
        });

        peer.on('signal', signal => {
            socket?.emit('call-user', {
                userToCall: userToSignal,
                signalData: signal,
                from: callerId,
                name: user?.firstName
            });
        });

        // Handle stream in the Video component via prop
        return peer;
    };

    const addPeer = (incomingSignal: any, callerId: string, stream: MediaStream) => {
        const peer = new SimplePeer({
            initiator: false,
            trickle: false,
            stream,
            config: ICE_SERVERS,
        });

        peer.on('signal', signal => {
            socket?.emit('answer-call', { signal, to: callerId });
        });

        peer.signal(incomingSignal);

        return peer;
    };

    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoOff(!isVideoOff);
        }
    };

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            // Stop screen sharing - revert to camera
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
                setScreenStream(null);
            }

            // Replace video track with camera in all peers
            if (stream) {
                const videoTrack = stream.getVideoTracks()[0];
                if (videoTrack) {
                    peersRef.current.forEach(({ peer }) => {
                        const sender = (peer as any)._pc?.getSenders()?.find((s: RTCRtpSender) => s.track?.kind === 'video');
                        if (sender) {
                            sender.replaceTrack(videoTrack);
                        }
                    });
                }
                if (userVideo.current) {
                    userVideo.current.srcObject = stream;
                }
            }
            setIsScreenSharing(false);
        } else {
            // Start screen sharing
            try {
                const displayStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' } as any,
                    audio: false,
                });

                setScreenStream(displayStream);

                // Replace video track with screen share in all peers
                const screenTrack = displayStream.getVideoTracks()[0];
                peersRef.current.forEach(({ peer }) => {
                    const sender = (peer as any)._pc?.getSenders()?.find((s: RTCRtpSender) => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(screenTrack);
                    }
                });

                // Show screen share in local preview
                if (userVideo.current) {
                    userVideo.current.srcObject = displayStream;
                }

                // Handle when user stops sharing via browser UI
                screenTrack.onended = () => {
                    toggleScreenShare();
                };

                setIsScreenSharing(true);
            } catch (err) {
                console.error('Failed to start screen sharing:', err);
            }
        }
    };

    const leaveCall = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            setScreenStream(null);
        }
        peersRef.current.forEach(p => p.peer.destroy());
        setPeers([]);
        peersRef.current = [];
        setIsJoined(false);
        setIsScreenSharing(false);
        // Emit leave-room to notify other users
        if (socket) {
            socket.emit('leave-room', { roomId, userId: user?.id || 'guest' });
        }
    };

    if (!isJoined) {
        return (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
                <button
                    onClick={joinCall}
                    disabled={isJoining}
                    className={`flex items-center gap-3 px-8 py-5 text-white text-xl font-semibold rounded-2xl shadow-2xl transition-all border-2 border-blue-400 ${
                        isJoining
                            ? 'bg-blue-400 cursor-wait'
                            : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
                    }`}
                >
                    {isJoining ? (
                        <>
                            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                            <span>{t('connecting') || 'Connecting...'}</span>
                        </>
                    ) : (
                        <>
                            <span>{t('join_live_session') || 'Join Live Session'}</span>
                            <VideoCamera size={32} weight="fill" />
                        </>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 flex flex-col items-end pointer-events-none z-50">
            <div className="flex gap-2 mb-2 pointer-events-auto bg-gray-900/90 p-2 rounded-lg backdrop-blur-sm border border-gray-700">
                {/* My Video */}
                <div className="relative w-32 h-24 bg-gray-800 rounded overflow-hidden">
                    <video ref={userVideo} muted autoPlay playsInline className="w-full h-full object-cover" />
                    <div className="absolute bottom-1 start-1 text-[10px] text-white bg-black/50 px-1 rounded">{t('you') || 'You'}</div>
                </div>

                {/* Peers */}
                {peers.map((peer) => (
                    <div key={peer.peerId} className="w-32 h-24 bg-gray-800 rounded overflow-hidden">
                        <Video peer={peer.peer} name={peer.name} />
                    </div>
                ))}
            </div>

            <div className="flex gap-2 pointer-events-auto bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
                <button onClick={toggleMute} className={`p-2 rounded-full ${isMuted ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`} title={isMuted ? 'Unmute' : 'Mute'}>
                    {isMuted ? <MicrophoneSlash size={20} /> : <Microphone size={20} />}
                </button>
                <button onClick={toggleVideo} className={`p-2 rounded-full ${isVideoOff ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`} title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}>
                    {isVideoOff ? <VideoCameraSlash size={20} /> : <VideoCamera size={20} />}
                </button>
                <button onClick={toggleScreenShare} className={`p-2 rounded-full ${isScreenSharing ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`} title={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
                    {isScreenSharing ? <MonitorPlay size={20} /> : <Monitor size={20} />}
                </button>
                <button onClick={leaveCall} className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700" title="Leave call">
                    <PhoneSlash size={20} />
                </button>
            </div>
        </div>
    );
};
