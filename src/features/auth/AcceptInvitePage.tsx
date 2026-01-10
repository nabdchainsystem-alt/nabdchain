import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '../../auth-adapter';
import { inviteService } from '../../services/inviteService';
import { CheckCircle, AlertTriangle, Loader } from 'lucide-react';

export const AcceptInvitePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();

    const token = searchParams.get('token');
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            // Redirect to login, preserving the invite link as the redirect url
            // Clerk usually handles this if we protect the route, but explicit is good
            const redirectUrl = encodeURIComponent(window.location.href);
            // Assuming we have a way to trigger login or just let Clerk's RedirectToSignIn handle it via route protection
            return;
        }

        const processInvite = async () => {
            if (!token) {
                setStatus('error');
                setErrorMsg("Invalid invitation link (missing token).");
                return;
            }

            try {
                const authToken = await getToken();
                if (!authToken) return;

                await inviteService.acceptInvite(authToken, token);
                setStatus('success');

                // Redirect after small delay
                setTimeout(() => {
                    navigate('/');
                }, 2000);

            } catch (e: any) {
                console.error("Invite Error", e);
                setStatus('error');
                setErrorMsg(e.message || "Failed to join team.");
            }
        };

        processInvite();
    }, [isLoaded, isSignedIn, token, getToken, navigate]);

    if (!isLoaded || !isSignedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p>Please sign in to accept the invitation...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">

                {status === 'processing' && (
                    <div className="flex flex-col items-center">
                        <Loader className="animate-spin text-blue-600 mb-4" size={48} />
                        <h2 className="text-xl font-bold mb-2">Joining Team...</h2>
                        <p className="text-gray-500">Verifying your invitation token.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                            <CheckCircle size={32} />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Welcome to the Team!</h2>
                        <p className="text-gray-500 mb-4">You have successfully joined the workspace.</p>
                        <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                            <AlertTriangle size={32} />
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-red-700">Invitation Failed</h2>
                        <p className="text-gray-600 mb-6">{errorMsg}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
