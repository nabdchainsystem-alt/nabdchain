
import React, { useEffect, useRef, useState } from 'react';
import SimplePeer, { Instance } from 'simple-peer';
import { useSocket } from '../../contexts/SocketContext';
import { useUser } from '../../auth-adapter';
import { Phone, PhoneSlash, Microphone, MicrophoneSlash, VideoCamera, VideoCameraSlash } from 'phosphor-react';

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
    const [peers, setPeers] = useState<PeerNode[]>([]);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isJoined, setIsJoined] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const userVideo = useRef<HTMLVideoElement>(null);
    const peersRef = useRef<PeerNode[]>([]); // Keep ref for event callbacks

    useEffect(() => {
        if (!socket) return;

        // Cleanup on unmount
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            // Destroy all peers
            peersRef.current.forEach(p => p.peer.destroy());
        };
    }, []);

    const joinCall = async () => {
        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(currentStream);
            setIsJoined(true);
            if (userVideo.current) userVideo.current.srcObject = currentStream;

            if (!socket) return;

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

        } catch (err) {
            console.error("Failed to access media devices", err);
        }
    };

    const createPeer = (userToSignal: string, callerId: string, stream: MediaStream) => {
        const peer = new SimplePeer({
            initiator: true,
            trickle: false,
            stream,
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

    const leaveCall = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        peersRef.current.forEach(p => p.peer.destroy());
        setPeers([]);
        peersRef.current = [];
        setIsJoined(false);
        // Also emit leave-room if we want to fully disconnect? 
        // Or just stop sending video. For now, keep socket connection alive for board.
    };

    if (!isJoined) {
        return (
            <button
                onClick={joinCall}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors"
            >
                <VideoCamera size={20} />
                <span>Join Live Session</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 flex flex-col items-end pointer-events-none z-50">
            <div className="flex gap-2 mb-2 pointer-events-auto bg-gray-900/90 p-2 rounded-lg backdrop-blur-sm border border-gray-700">
                {/* My Video */}
                <div className="relative w-32 h-24 bg-gray-800 rounded overflow-hidden">
                    <video ref={userVideo} muted autoPlay playsInline className="w-full h-full object-cover" />
                    <div className="absolute bottom-1 left-1 text-[10px] text-white bg-black/50 px-1 rounded">You</div>
                </div>

                {/* Peers */}
                {peers.map((peer) => (
                    <div key={peer.peerId} className="w-32 h-24 bg-gray-800 rounded overflow-hidden">
                        <Video peer={peer.peer} name={peer.name} />
                    </div>
                ))}
            </div>

            <div className="flex gap-2 pointer-events-auto bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
                <button onClick={toggleMute} className={`p-2 rounded-full ${isMuted ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    {isMuted ? <MicrophoneSlash size={20} /> : <Microphone size={20} />}
                </button>
                <button onClick={toggleVideo} className={`p-2 rounded-full ${isVideoOff ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    {isVideoOff ? <VideoCameraSlash size={20} /> : <VideoCamera size={20} />}
                </button>
                <button onClick={leaveCall} className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700">
                    <PhoneSlash size={20} />
                </button>
            </div>
        </div>
    );
};
