import React, { useState, useEffect, useRef } from 'react';
import { useUser, useClerk } from '../../auth-adapter';
import { useAppContext } from '../../contexts/AppContext';
import { COUNTRIES } from '../../config/currency';
import {
    FloppyDisk, Warning, Layout, Check, Shield,
    House, Sparkle, Activity, SquaresFour, Tray, Users, Lock,
    ShoppingCart, Globe, Package, Truck, UsersThree,
    Wrench, Factory, ShieldCheck, Buildings, Table, Megaphone, Money,
    Monitor, User, Bell, Eye, Moon, Sun, SignOut
} from 'phosphor-react';

export const ALL_PAGES = {
    // Top Level
    'home': { label: 'home', section: 'main', icon: House },
    'flow_hub': { label: 'flow_hub', section: 'main', icon: Sparkle },
    'process_map': { label: 'process_map', section: 'main', icon: Activity },
    'my_work': { label: 'my_work', section: 'main', icon: SquaresFour },
    'inbox': { label: 'inbox', section: 'main', icon: Tray },
    'teams': { label: 'teams', section: 'main', icon: Users },
    'vault': { label: 'vault', section: 'main', icon: Lock },
    'mini_company': { label: 'departments', section: 'main', icon: Buildings },

    // Marketplace
    'local_marketplace': { label: 'local_marketplace', section: 'marketplace', icon: ShoppingCart },
    'foreign_marketplace': { label: 'foreign_marketplace', section: 'marketplace', icon: Globe },

    // Supply Chain
    'supply_chain': { label: 'supply_chain_group', section: 'departments', icon: Package },
    'procurement': { label: 'procurement', section: 'supply_chain', icon: ShoppingCart },
    'warehouse': { label: 'warehouse', section: 'supply_chain', icon: House },
    'shipping': { label: 'shipping', section: 'supply_chain', icon: Truck },
    'fleet': { label: 'fleet', section: 'supply_chain', icon: Truck },
    'vendors': { label: 'vendors', section: 'supply_chain', icon: UsersThree },
    'planning': { label: 'planning', section: 'supply_chain', icon: Layout },

    // Operations
    'operations': { label: 'operations_group', section: 'departments', icon: Factory },
    'maintenance': { label: 'maintenance', section: 'operations', icon: Wrench },
    'production': { label: 'production', section: 'operations', icon: Factory },
    'quality': { label: 'quality', section: 'operations', icon: ShieldCheck },

    // Business
    'business': { label: 'business_group', section: 'departments', icon: Buildings },
    'sales_listing': { label: 'sales_listings', section: 'business', icon: Table },
    'sales_factory': { label: 'sales_factory', section: 'business', icon: Factory },
    'sales': { label: 'sales', section: 'business', icon: Megaphone },
    'finance': { label: 'finance', section: 'business', icon: Money },

    // Business Support
    'business_support': { label: 'business_support_group', section: 'departments', icon: Users },
    'it_support': { label: 'it_support', section: 'business_support', icon: Monitor },
    'hr': { label: 'hr', section: 'business_support', icon: UsersThree },
    'marketing': { label: 'marketing', section: 'business_support', icon: Megaphone },
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
    const { signOut, openUserProfile } = useClerk();
    const { theme, toggleTheme, language, toggleLanguage, t, userDisplayName, updateUserDisplayName, country, updateCountry } = useAppContext();

    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(userDisplayName);

    // Keep newName in sync with userDisplayName when not editing
    useEffect(() => {
        if (!isEditingName) {
            setNewName(userDisplayName);
        }
    }, [userDisplayName, isEditingName]);

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
    const [profileImage, setProfileImage] = useState(() => localStorage.getItem('user_profile_image') || user?.imageUrl || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size too large. Please upload an image smaller than 10MB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setProfileImage(base64String); // Only update preview, don't save yet
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleSaveProfile = () => {
        localStorage.setItem('user_job_title', jobTitle);
        localStorage.setItem('user_department', department);
        localStorage.setItem('user_bio', bio);

        // Save profile image if it has changed/set
        if (profileImage && profileImage.startsWith('data:image')) {
            try {
                localStorage.setItem('user_profile_image', profileImage);
                window.dispatchEvent(new Event('profile-image-updated'));
            } catch (error) {
                console.error('Storage quota exceeded', error);
                alert('Image is too large to save locally. Please try a smaller image.');
                return;
            }
        }

        // Visual feedback
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
                    {t('profile_information')}
                </h3>
                <div className="flex items-start gap-6">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-purple-500 text-white flex items-center justify-center text-4xl font-bold border-4 border-gray-50 dark:border-monday-dark-bg shadow-md overflow-hidden relative group">
                            {profileImage ? (
                                <img
                                    src={profileImage}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                userDisplayName.charAt(0).toUpperCase()
                            )}
                            <div
                                onClick={triggerFileInput}
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-white">edit</span>
                            </div>
                        </div>
                        <button
                            onClick={triggerFileInput}
                            className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                        >
                            {t('change_photo')}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    <div className="flex-1 space-y-6">
                        {/* Name Field */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('display_name')}</label>
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
                                            {t('save')}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('email_address')}</label>
                                <input
                                    type="text"
                                    value={user?.primaryEmailAddress?.emailAddress || ''}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl dark:border-gray-700 dark:bg-monday-dark-hover/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('job_title')}</label>
                                <input
                                    type="text"
                                    value={jobTitle}
                                    onChange={(e) => setJobTitle(e.target.value)}
                                    placeholder={t('placeholder_job_title')}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all dark:bg-monday-dark-bg dark:border-gray-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('department')}</label>
                                <input
                                    type="text"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    placeholder={t('placeholder_department')}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all dark:bg-monday-dark-bg dark:border-gray-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('bio')}</label>
                            <textarea
                                rows={3}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder={t('placeholder_bio')}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none dark:bg-monday-dark-bg dark:border-gray-700"
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSaveProfile}
                                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <FloppyDisk size={18} />
                                {t('save_profile')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-monday-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-monday-dark-border shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Sparkle className="text-yellow-500" size={20} />
                    {t('preferences')}
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-monday-dark-hover rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-monday-dark-bg rounded-lg">
                                {theme === 'light' ? <Sun size={18} className="text-orange-500" /> : <Moon size={18} className="text-blue-400" />}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{t('appearance')}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('switch_theme_desc')}</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="px-4 py-2 bg-gray-100 dark:bg-monday-dark-hover text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            {theme === 'light' ? t('light_mode') : t('dark_mode')}
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-monday-dark-hover rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-monday-dark-bg rounded-lg">
                                <Globe size={18} className="text-green-500" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{t('language')}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('change_language_desc')}</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleLanguage}
                            className="px-4 py-2 bg-gray-100 dark:bg-monday-dark-hover text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            {language === 'en' ? t('english') : t('arabic')}
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-monday-dark-hover rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-monday-dark-bg rounded-lg">
                                <Globe size={18} className="text-purple-500" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Region & Currency</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Select your country to update currency ({country.currency.symbol})</p>
                            </div>
                        </div>
                        <select
                            value={country.code}
                            onChange={(e) => updateCountry(e.target.value)}
                            className="px-4 py-2 bg-gray-100 dark:bg-monday-dark-hover text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border-none outline-none cursor-pointer"
                        >
                            {Object.values(COUNTRIES).map((c) => (
                                <option key={c.code} value={c.code}>
                                    {c.name} ({c.currency.code})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-monday-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-monday-dark-border shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Shield className="text-red-500" size={20} />
                    {t('security')}
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-monday-dark-hover rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-monday-dark-bg rounded-lg">
                                <Lock size={18} className="text-red-500" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{t('change_password')}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('update_password_desc')}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => openUserProfile({ appearance: { variables: { colorPrimary: '#000000' } } })}
                            className="px-4 py-2 bg-gray-100 dark:bg-monday-dark-hover text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            {t('manage')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={async () => {
                        await signOut();
                        // Redirect to landing page after sign out
                        const hostname = window.location.hostname;
                        if (hostname.startsWith('app.') && hostname.includes('nabdchain.com')) {
                            window.location.href = 'https://nabdchain.com';
                        }
                    }}
                    className="flex items-center gap-2 px-6 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors font-medium border border-transparent hover:border-red-100"
                >
                    <SignOut size={16} />
                    {t('sign_out')}
                </button>
            </div>
        </div>
    );

    const renderViews = () => (
        <div className="animate-fadeIn space-y-6">
            <div className="flex items-center justify-between mb-4 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <div>
                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">{t('visibility_control')}</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{t('toggle_pages_desc')}</p>
                </div>
                <button
                    onClick={handleSaveViews}
                    disabled={!hasChanges}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all shadow-sm ${hasChanges
                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md transform hover:-translate-y-0.5'
                        : 'bg-white text-gray-400 border border-gray-200 cursor-not-allowed dark:bg-monday-dark-bg dark:border-gray-700'
                        }`}
                >
                    <FloppyDisk size={16} />
                    {t('save_changes')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map(section => (
                    <div key={section} className="bg-white dark:bg-monday-dark-surface rounded-2xl border border-gray-100 dark:border-monday-dark-border shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                        <div className="px-5 py-4 bg-gray-50/80 dark:bg-monday-dark-hover/30 border-b border-gray-100 dark:border-monday-dark-border flex items-center justify-between backdrop-blur-sm">
                            <span className="font-bold text-gray-800 dark:text-monday-dark-text">{t(section)}</span>
                            {section === 'departments' && <Layout size={18} className="text-gray-400" />}
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
                                                    {t(config.label)}
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
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('notification_settings')}</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                    {t('manage_notifications_desc')}
                </p>

                <div className="max-w-md mx-auto space-y-4 text-start">
                    {[
                        { key: 'email_digest', label: t('email_digest') },
                        { key: 'realtime_alerts', label: t('realtime_alerts') },
                        { key: 'mobile_push', label: t('mobile_push') },
                        { key: 'slack_integration', label: t('slack_integration') }
                    ].map((item, i) => (
                        <div key={item.key} className="flex items-center justify-between p-3 border border-gray-100 dark:border-monday-dark-border rounded-xl">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                            <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full cursor-not-allowed opacity-60 relative">
                                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm inline-block rounded-lg font-medium">
                    {t('coming_soon')} 🚀
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
                        <Wrench size={24} className="text-gray-400" />
                        {t('settings')}
                    </h2>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'general'
                            ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-monday-dark-hover'
                            }`}
                    >
                        <User size={18} />
                        {t('general')}
                    </button>

                    <button
                        onClick={() => setActiveTab('views')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'views'
                            ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-monday-dark-hover'
                            }`}
                    >
                        <Eye size={18} />
                        {t('views_visibility')}
                    </button>

                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'notifications'
                            ? 'bg-gradient-to-br from-[#e9ecef] to-[#dee2e6] text-[#212529] shadow-sm border border-white/60 dark:from-[#495057] dark:to-[#343a40] dark:text-[#f8f9fa] dark:border-white/10'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-monday-dark-hover'
                            }`}
                    >
                        <Bell size={18} />
                        {t('notifications')}
                    </button>
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-8">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {activeTab === 'general' && t('general_settings')}
                            {activeTab === 'views' && t('page_visibility')}
                            {activeTab === 'notifications' && t('notifications')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            {activeTab === 'general' && t('manage_profile_desc')}
                            {activeTab === 'views' && t('customize_sidebar_desc')}
                            {activeTab === 'notifications' && t('control_notifications_desc')}
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



export default SettingsPage;
