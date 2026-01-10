import React, { useState } from 'react';
import {
    UserPlus, Search, Filter, MoreHorizontal, Mail, MapPin,
    Shield, CheckCircle, Clock, Zap, Users, UserCheck, UserX,
    MessageSquare, Settings, ArrowUpRight, Copy, X, Loader
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../auth-adapter';
import { inviteService } from '../../services/inviteService';
import { MOCK_MEMBERS } from './data';
import { TeamRole, TeamStatus } from './types';

// Components
const StatCard = ({ icon, label, value, trend, color }: any) => (
    <div className="bg-white dark:bg-monday-dark-surface p-4 rounded-xl border border-gray-100 dark:border-monday-dark-border shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-default">
        <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
        </div>
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white shadow-sm`}>
            {icon}
        </div>
    </div>
);

export const TeamsPage: React.FC = () => {
    const { t } = useAppContext();
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Invite State
    const { getToken } = useAuth();
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateInvite = async () => {
        setIsGenerating(true);
        setInviteLink('');
        try {
            const token = await getToken();
            if (!token) return;

            const data = await inviteService.createInvite(token); // No email needed for generic link
            setInviteLink(data.link);
        } catch (e) {
            console.error("Invite Gen Failed", e);
            alert("Failed to generate link");
        } finally {
            setIsGenerating(false);
        }
    }

    // Stats Logic
    const stats = {
        total: MOCK_MEMBERS.length,
        active: MOCK_MEMBERS.filter(m => m.status === TeamStatus.ACTIVE).length,
        guests: MOCK_MEMBERS.filter(m => m.role === TeamRole.GUEST).length,
        pending: MOCK_MEMBERS.filter(m => m.status === TeamStatus.INVITED).length
    };

    const filteredMembers = MOCK_MEMBERS.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'all') return matchesSearch;
        if (filter === 'active') return matchesSearch && member.status === TeamStatus.ACTIVE;
        if (filter === 'inactive') return matchesSearch && member.status !== TeamStatus.ACTIVE;
        return matchesSearch;
    });

    return (
        <div className="flex flex-col h-full w-full bg-[#FCFCFD] dark:bg-monday-dark-bg font-sans text-[#323338] dark:text-monday-dark-text animate-fade-in overflow-hidden">

            {/* 1. Dashboard Header & Stats */}
            <div className="px-8 pt-8 pb-6 flex-shrink-0">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#323338] dark:text-white mb-1 tracking-tight">Team Overview</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Manage your team's performance and access.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-monday-dark-border bg-white dark:bg-monday-dark-surface text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-monday-dark-hover transition-colors font-medium text-sm">
                            <Settings size={16} /> Settings
                        </button>
                        <button
                            onClick={() => { setIsInviteModalOpen(true); handleGenerateInvite(); }}
                            className="flex items-center gap-2 bg-monday-blue hover:bg-blue-600 text-white px-5 py-2 rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95 font-medium text-sm"
                        >
                            <UserPlus size={16} /> Invite Member
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Members"
                        value={stats.total}
                        icon={<Users size={20} />}
                        color="bg-gradient-to-br from-blue-500 to-indigo-600"
                    />
                    <StatCard
                        label="Online Now"
                        value={stats.active}
                        icon={<Zap size={20} />}
                        color="bg-gradient-to-br from-green-400 to-emerald-600"
                    />
                    <StatCard
                        label="Guests Access"
                        value={stats.guests}
                        icon={<Shield size={20} />}
                        color="bg-gradient-to-br from-orange-400 to-pink-600"
                    />
                    <StatCard
                        label="Pending Invites"
                        value={stats.pending}
                        icon={<Mail size={20} />}
                        color="bg-gradient-to-br from-purple-500 to-violet-600"
                    />
                </div>
            </div>

            {/* 2. Main Content Area (White Card) */}
            <div className="flex-1 px-8 pb-8 min-h-0">
                <div className="bg-white dark:bg-monday-dark-surface rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-monday-dark-border h-full flex flex-col overflow-hidden">

                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-100 dark:border-monday-dark-border flex items-center justify-between flex-shrink-0 bg-white dark:bg-monday-dark-surface z-10">
                        <div className="flex p-1 bg-gray-100 dark:bg-monday-dark-bg rounded-lg">
                            {(['all', 'active', 'inactive'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === f
                                        ? 'bg-white dark:bg-monday-dark-hover text-monday-blue shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                                        }`}
                                >
                                    {f === 'all' ? 'All Members' : f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-monday-blue transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search team..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-64 text-sm bg-gray-50 dark:bg-monday-dark-bg border border-transparent focus:bg-white dark:focus:bg-monday-dark-surface border-gray-200 dark:border-monday-dark-border rounded-lg focus:outline-none focus:border-monday-blue focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-y-auto w-full">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-gray-50/95 dark:bg-monday-dark-bg/95 backdrop-blur-sm z-10">
                                <tr className="border-b border-gray-200 dark:border-monday-dark-border text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="px-6 py-4 w-1/3">User</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-monday-dark-border">
                                {filteredMembers.map((member) => (
                                    <tr key={member.id} className="group hover:bg-blue-50/30 dark:hover:bg-monday-dark-hover transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full ${member.color} text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white dark:ring-monday-dark-surface`}>
                                                    {member.avatarUrl ? (
                                                        <img src={member.avatarUrl} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        member.initials
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white group-hover:text-monday-blue transition-colors cursor-pointer flex items-center gap-1">
                                                        {member.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                        {member.department} • {member.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {member.status === 'Active' && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
                                                {member.status === 'Invited' && <div className="w-2 h-2 rounded-full bg-yellow-500"></div>}
                                                {member.status === 'Away' && <div className="w-2 h-2 rounded-full bg-gray-400"></div>}
                                                <span className={`text-sm font-medium ${member.status === 'Active' ? 'text-green-700 dark:text-green-400' :
                                                    member.status === 'Invited' ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'
                                                    }`}>
                                                    {member.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${member.role === 'Admin' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                                                member.role === 'Guest' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' :
                                                    'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                                                }`}>
                                                {member.role === 'Admin' && <Shield size={12} />}
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                                <MapPin size={14} className="text-gray-400" />
                                                {member.location}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {/* Quick Actions - Visible on Hover */}
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-200">
                                                <button className="p-2 hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-monday-blue rounded-full shadow-sm border border-transparent hover:border-gray-100 transition-all tooltip" title="Message">
                                                    <MessageSquare size={16} />
                                                </button>
                                                <button className="p-2 hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-monday-blue rounded-full shadow-sm border border-transparent hover:border-gray-100 transition-all tooltip" title="View Profile">
                                                    <ArrowUpRight size={16} />
                                                </button>
                                                <button className="p-2 hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-gray-800 dark:hover:text-white rounded-full shadow-sm border border-transparent hover:border-gray-100 transition-all">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredMembers.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-20 h-20 bg-gray-50 dark:bg-monday-dark-bg rounded-full flex items-center justify-center mb-4 ring-4 ring-gray-50 dark:ring-gray-800">
                                    <Search size={32} className="text-gray-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No members found</h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                                    Try adjusting your search or filters to find what you're looking for.
                                </p>
                                <button onClick={() => { setFilter('all'); setSearchTerm('') }} className="mt-4 text-monday-blue font-medium hover:underline text-sm">
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {/* Invite Modal */}
                {isInviteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-monday-dark-surface p-6 rounded-xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-monday-dark-border m-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Invite to Workspace</h3>
                                <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                    <X size={20} />
                                </button>
                            </div>

                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                                Share this link with your team members. When they click it, they will be added to your workspace automatically.
                            </p>

                            <div className="bg-gray-50 dark:bg-monday-dark-bg p-4 rounded-lg border border-gray-200 dark:border-monday-dark-border flex items-center gap-3 mb-6">
                                {isGenerating ? (
                                    <div className="flex items-center gap-2 text-monday-blue">
                                        <Loader size={16} className="animate-spin" />
                                        <span className="text-sm font-medium">Generating link...</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate font-mono select-all">
                                                {inviteLink}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(inviteLink); alert("Copied!"); }}
                                            className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md text-monday-blue transition-colors"
                                            title="Copy Link"
                                        >
                                            <Copy size={18} />
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setIsInviteModalOpen(false)}
                                    className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium text-sm"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamsPage;
