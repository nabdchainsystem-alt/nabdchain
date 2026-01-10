import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useAppContext } from '../../contexts/AppContext';
import {
    Save, AlertTriangle, Layout, Check, Shield,
    Home, Sparkles, Activity, Grid, Inbox, MessageSquare, Users, Lock,
    ShoppingCart, Globe, Boxes, Truck, Users2, LayoutDashboard,
    Wrench, Factory, ShieldCheck, Building2, FileSpreadsheet, Megaphone, Banknote,
    Monitor, User, Bell, Eye, Moon, Sun, Globe2, LogOut
} from 'lucide-react';

export const ALL_PAGES = {
    // Top Level
    'home': { label: 'Home', section: 'Main', icon: Home },
    'flow_hub': { label: 'Flow Hub', section: 'Main', icon: Sparkles },
    'process_map': { label: 'Process Map', section: 'Main', icon: Activity },
    'my_work': { label: 'My Work', section: 'Main', icon: Grid },
    'inbox': { label: 'Inbox', section: 'Main', icon: Inbox },
    'discussion': { label: 'Discussion', section: 'Main', icon: MessageSquare },
    'teams': { label: 'Teams', section: 'Main', icon: Users },
    'vault': { label: 'Vault', section: 'Main', icon: Lock },

    // Marketplace
    'local_marketplace': { label: 'Local Marketplace', section: 'Marketplace', icon: ShoppingCart },
    'foreign_marketplace': { label: 'Foreign Marketplace', section: 'Marketplace', icon: Globe },

    // Supply Chain
    'supply_chain': { label: 'Supply Chain (Group)', section: 'Departments', icon: Boxes },
    'procurement': { label: 'Procurement', section: 'Supply Chain', icon: ShoppingCart },
    'warehouse': { label: 'Warehouse', section: 'Supply Chain', icon: Home },
    'shipping': { label: 'Shipping', section: 'Supply Chain', icon: Truck },
    'fleet': { label: 'Fleet', section: 'Supply Chain', icon: Truck },
    'vendors': { label: 'Vendors', section: 'Supply Chain', icon: Users2 },
    'planning': { label: 'Planning', section: 'Supply Chain', icon: LayoutDashboard },

    // Operations
    'operations': { label: 'Operations (Group)', section: 'Departments', icon: Factory },
    'maintenance': { label: 'Maintenance', section: 'Operations', icon: Wrench },
    'production': { label: 'Production', section: 'Operations', icon: Factory },
    'quality': { label: 'Quality', section: 'Operations', icon: ShieldCheck },

    // Business
    'business': { label: 'Business (Group)', section: 'Departments', icon: Building2 },
    'sales_listing': { label: 'Sales Listings', section: 'Business', icon: FileSpreadsheet },
    'sales_factory': { label: 'Sales Factory', section: 'Business', icon: Factory },
    'sales': { label: 'Sales', section: 'Business', icon: Megaphone },
    'finance': { label: 'Finance', section: 'Business', icon: Banknote },

    // Business Support
    'business_support': { label: 'Business Support (Group)', section: 'Departments', icon: Users },
    'it_support': { label: 'IT Support', section: 'Business Support', icon: Monitor },
    'hr': { label: 'HR', section: 'Business Support', icon: Users2 },
    'marketing': { label: 'Marketing', section: 'Business Support', icon: Megaphone },
};

export const INITIAL_VISIBILITY = Object.keys(ALL_PAGES).reduce((acc, key) => {
    acc[key] = true;
    return acc;
}, {} as Record<string, boolean>);

interface SettingsPageProps {
    visibility: Record<string, boolean>;
    onVisibilityChange: (newVisibility: Record<string, boolean>) => void;
}

type SettingsTab = 'general' | 'views' | 'notifications';

export const SettingsPage: React.FC<SettingsPageProps> = ({ visibility, onVisibilityChange }) => {
    const { user } = useUser();
    const { signOut } = useClerk();
    const { theme, toggleTheme, language, toggleLanguage, t, userDisplayName, updateUserDisplayName } = useAppContext();

    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(userDisplayName);

    const handleSaveName = () => {
        if (newName.trim()) {
            updateUserDisplayName(newName.trim());
            setIsEditingName(false);
        }
    };

    // Views Config State
    const [localVisibility, setLocalVisibility] = useState(visibility);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setLocalVisibility(visibility);
    }, [visibility]);

    const handleToggleView = (key: string) => {
        const currentStatus = localVisibility[key] !== false;
        const newVis = { ...localVisibility, [key]: !currentStatus };
        setLocalVisibility(newVis);
        setHasChanges(true);
    };

    // Profile State
    const [jobTitle, setJobTitle] = useState(() => localStorage.getItem('user_job_title') || '');
    const [department, setDepartment] = useState(() => localStorage.getItem('user_department') || '');
    const [bio, setBio] = useState(() => localStorage.getItem('user_bio') || '');

    const handleSaveProfile = () => {
        localStorage.setItem('user_job_title', jobTitle);
        localStorage.setItem('user_department', department);
        localStorage.setItem('user_bio', bio);
        // Visual feedback could be added here
        alert('Profile saved successfully!');
    };

    const handleSaveViews = () => {
        onVisibilityChange(localVisibility);
        setHasChanges(false);
    };

    const sections = Array.from(new Set(Object.values(ALL_PAGES).map(p => p.section)));

    const renderGeneral = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-white dark:bg-monday-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-monday-dark-border shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <User className="text-blue-500" size={20} />
                    Profile Information
                </h3>
                <div className="flex items-start gap-6">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-purple-500 text-white flex items-center justify-center text-4xl font-bold border-4 border-gray-50 dark:border-monday-dark-bg shadow-md">
                            {userDisplayName.charAt(0).toUpperCase()}
                        </div>
                        <button className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                            Change Photo
                        </button>
                    </div>

                    <div className="flex-1 space-y-6">
                        {/* Name Field */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={isEditingName ? newName : userDisplayName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            disabled={!isEditingName}
                                            className={`w-full px-4 py-2 border rounded-xl transition-all ${isEditingName
                                                ? 'border-blue-300 focus:ring-2 focus:ring-blue-100 bg-white dark:bg-monday-dark-bg'
                                                : 'border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-monday-dark-hover/50'}`}
                                        />
                                        {!isEditingName && (
                                            <button
                                                onClick={() => { setIsEditingName(true); setNewName(userDisplayName); }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                        )}
                                    </div>
                                    {isEditingName && (
                                        <button
                                            onClick={handleSaveName}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm flex items-center gap-2"
                                        >
                                            <Check size={16} />
                                            Save
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                <input
                                    type="text"
                                    value={user?.primaryEmailAddress?.emailAddress || ''}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl dark:border-gray-700 dark:bg-monday-dark-hover/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Job Title</label>
                                <input
                                    type="text"
                                    value={jobTitle}
                                    onChange={(e) => setJobTitle(e.target.value)}
                                    placeholder="e.g. Senior Product Designer"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all dark:bg-monday-dark-bg dark:border-gray-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                                <input
                                    type="text"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    placeholder="e.g. Product"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all dark:bg-monday-dark-bg dark:border-gray-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                            <textarea
                                rows={3}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell us a little about yourself..."
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none dark:bg-monday-dark-bg dark:border-gray-700"
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSaveProfile}
                                className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                            >
                                <Save size={18} />
                                Save Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-monday-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-monday-dark-border shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Sparkles className="text-yellow-500" size={20} />
                    Preferences
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-monday-dark-hover rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-monday-dark-bg rounded-lg">
                                {theme === 'light' ? <Sun size={18} className="text-orange-500" /> : <Moon size={18} className="text-blue-400" />}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Appearance</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark mode</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="px-4 py-2 bg-gray-100 dark:bg-monday-dark-hover text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-monday-dark-hover rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-monday-dark-bg rounded-lg">
                                <Globe2 size={18} className="text-green-500" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Language</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Change system language</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleLanguage}
                            className="px-4 py-2 bg-gray-100 dark:bg-monday-dark-hover text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            {language === 'en' ? 'English' : 'Arabic'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 px-6 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors font-medium border border-transparent hover:border-red-100"
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
        </div>
    );

    const renderViews = () => (
        <div className="animate-fadeIn space-y-6">
            <div className="flex items-center justify-between mb-4 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <div>
                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Visibility Control</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Toggle which pages are visible in your sidebar navigation.</p>
                </div>
                <button
                    onClick={handleSaveViews}
                    disabled={!hasChanges}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all shadow-sm ${hasChanges
                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md transform hover:-translate-y-0.5'
                        : 'bg-white text-gray-400 border border-gray-200 cursor-not-allowed dark:bg-monday-dark-bg dark:border-gray-700'
                        }`}
                >
                    <Save size={16} />
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map(section => (
                    <div key={section} className="bg-white dark:bg-monday-dark-surface rounded-2xl border border-gray-100 dark:border-monday-dark-border shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                        <div className="px-5 py-4 bg-gray-50/80 dark:bg-monday-dark-hover/30 border-b border-gray-100 dark:border-monday-dark-border flex items-center justify-between backdrop-blur-sm">
                            <span className="font-bold text-gray-800 dark:text-monday-dark-text">{section}</span>
                            {section === 'Departments' && <Layout size={18} className="text-gray-400" />}
                        </div>
                        <div className="p-2 space-y-1">
                            {Object.entries(ALL_PAGES)
                                .filter(([_, config]) => config.section === section)
                                .map(([key, config]) => {
                                    const Icon = config.icon;
                                    const isVisible = localVisibility[key] !== false;
                                    return (
                                        <div
                                            key={key}
                                            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-monday-dark-hover rounded-xl transition-all group cursor-pointer"
                                            onClick={() => handleToggleView(key)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg transition-colors ${isVisible ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}>
                                                    <Icon size={18} />
                                                </div>
                                                <span className={`text-sm font-medium transition-colors ${isVisible ? 'text-gray-700 dark:text-monday-dark-text' : 'text-gray-400 line-through decoration-gray-300'}`}>
                                                    {config.label}
                                                </span>
                                            </div>

                                            {/* Premium Toggle Switch */}
                                            <div
                                                className={`relative w-11 h-6 rounded-full transition-all duration-300 ease-out flex-shrink-0 cursor-pointer border-2 ${isVisible
                                                    ? 'bg-blue-600 border-blue-600'
                                                    : 'bg-gray-200 border-gray-200 dark:bg-gray-700 dark:border-gray-700'
                                                    }`}
                                            >
                                                <span
                                                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isVisible ? 'translate-x-5' : 'translate-x-0'
                                                        }`}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-white dark:bg-monday-dark-surface p-8 rounded-2xl border border-gray-100 dark:border-monday-dark-border text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600 dark:text-purple-400">
                    <Bell size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Notification Settings</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                    Manage how and when you receive updates from NABD.
                </p>

                <div className="max-w-md mx-auto space-y-4 text-left">
                    {['Email Digest', 'Real-time Alerts', 'Mobile Push', 'Slack Integration'].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 border border-gray-100 dark:border-monday-dark-border rounded-xl">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{item}</span>
                            <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full cursor-not-allowed opacity-60 relative">
                                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm inline-block rounded-lg font-medium">
                    Coming Soon 🚀
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-full bg-[#FCFCFD] dark:bg-monday-dark-bg">
            {/* Left Sidebar for Settings */}
            <div className="w-64 border-r border-gray-200 dark:border-monday-dark-border bg-white dark:bg-monday-dark-surface flex flex-col">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <SettingsIcon size={24} className="text-gray-400" />
                        Settings
                    </h2>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'general'
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-monday-dark-hover'
                            }`}
                    >
                        <User size={18} />
                        General
                    </button>

                    <button
                        onClick={() => setActiveTab('views')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'views'
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-monday-dark-hover'
                            }`}
                    >
                        <Eye size={18} />
                        Views & Visibility
                    </button>

                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'notifications'
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-monday-dark-hover'
                            }`}
                    >
                        <Bell size={18} />
                        Notifications
                    </button>
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-8">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {activeTab === 'general' && 'General Settings'}
                            {activeTab === 'views' && 'Page Visibility'}
                            {activeTab === 'notifications' && 'Notifications'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            {activeTab === 'general' && 'Manage your profile and workspace preferences.'}
                            {activeTab === 'views' && 'Customize your sidebar by showing or hiding pages.'}
                            {activeTab === 'notifications' && 'Control your communication preferences.'}
                        </p>
                    </div>

                    {activeTab === 'general' && renderGeneral()}
                    {activeTab === 'views' && renderViews()}
                    {activeTab === 'notifications' && renderNotifications()}
                </div>
            </div>
        </div>
    );
};

// Helper icon component for internal use
const SettingsIcon: React.FC<{ size?: number, className?: string }> = ({ size = 24, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

export default SettingsPage;
