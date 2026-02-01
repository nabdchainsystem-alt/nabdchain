import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser, useClerk, useAuth } from '../../auth-adapter';
import { appLogger } from '../../utils/logger';
import { useAppContext } from '../../contexts/AppContext';
import { COUNTRIES } from '../../config/currency';
import {
    FloppyDisk, Warning, Layout, Check, Shield,
    House, Sparkle, Activity, SquaresFour, Tray, Users, Lock,
    ShoppingCart, Globe, Package, Truck, UsersThree,
    Wrench, Factory, ShieldCheck, Buildings, Table, Megaphone, Money,
    Monitor, User, Bell, Eye, Moon, Sun, SignOut, Crown, ToggleLeft, SpinnerGap,
    Flask
} from 'phosphor-react';
import { adminService, FeatureFlag, AdminUser, UserPagePermission } from '../../services/adminService';
import { userService } from '../../services/userService';
import { ALL_PAGES, INITIAL_VISIBILITY } from './settingsConfig';

// Re-export for backwards compatibility
export { ALL_PAGES, INITIAL_VISIBILITY } from './settingsConfig';

interface SettingsPageProps {
    visibility: Record<string, boolean>;
    onVisibilityChange: (newVisibility: Record<string, boolean>) => void;
    isAdmin?: boolean;
    onFeatureFlagsChange?: () => void;
    serverAllowedPages?: Record<string, boolean>; // Pages the admin has allowed for this user
}

type SettingsTab = 'general' | 'views' | 'notifications' | 'admin';

// Feature categories for admin panel
const FEATURE_CATEGORIES = {
    'Core': ['page_dashboard', 'page_my_work', 'page_inbox', 'page_teams', 'page_vault', 'page_talk'],
    'Tools': ['page_dashboards', 'page_reports', 'page_test_tools'],
    'Mini Company': ['page_mini_company', 'page_sales', 'page_purchases', 'page_inventory', 'page_expenses', 'page_customers', 'page_suppliers'],
    'Supply Chain': ['page_supply_chain', 'page_procurement', 'page_warehouse', 'page_fleet', 'page_vendors', 'page_planning'],
    'Manufacturing': ['page_operations', 'page_maintenance', 'page_production', 'page_quality'],
    'Business': ['page_business', 'page_sales_listing', 'page_sales_factory'],
    'Business Support': ['page_business_support', 'page_it_support', 'page_hr', 'page_marketing'],
    'Marketplace': ['page_marketplace', 'page_local_marketplace', 'page_foreign_marketplace'],
};

const FEATURE_LABELS: Record<string, string> = {
    page_dashboard: 'Dashboard',
    page_my_work: 'My Work',
    page_inbox: 'Inbox',
    page_teams: 'Teams',
    page_vault: 'Vault',
    page_talk: 'Talk',
    page_dashboards: 'Dashboards',
    page_reports: 'Reports',
    page_test_tools: 'Test Tools',
    page_mini_company: 'Mini Company (Group)',
    page_sales: 'Sales',
    page_purchases: 'Purchases',
    page_inventory: 'Inventory',
    page_expenses: 'Expenses',
    page_customers: 'Customers',
    page_suppliers: 'Suppliers',
    page_supply_chain: 'Supply Chain (Group)',
    page_procurement: 'Procurement',
    page_warehouse: 'Warehouse',
    page_fleet: 'Fleet',
    page_vendors: 'Vendors',
    page_planning: 'Planning',
    page_operations: 'Manufacturing (Group)',
    page_maintenance: 'Maintenance',
    page_production: 'Production',
    page_quality: 'Quality',
    page_business: 'Business (Group)',
    page_sales_listing: 'Sales Listings',
    page_sales_factory: 'Sales Factory',
    page_business_support: 'Business Support (Group)',
    page_it_support: 'IT Support',
    page_hr: 'HR',
    page_marketing: 'Marketing',
    page_marketplace: 'Marketplace (Group)',
    page_local_marketplace: 'Local Marketplace',
    page_foreign_marketplace: 'Foreign Marketplace',
};

export const SettingsPage: React.FC<SettingsPageProps> = ({ visibility, onVisibilityChange, isAdmin = false, onFeatureFlagsChange, serverAllowedPages = {} }) => {
    const { user } = useUser();
    const { signOut, openUserProfile } = useClerk();
    const { getToken } = useAuth();
    const { theme, toggleTheme, language, toggleLanguage, t, userDisplayName, updateUserDisplayName, country, updateCountry } = useAppContext();

    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(userDisplayName);

    // Admin state
    const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [togglingFeature, setTogglingFeature] = useState<string | null>(null);
    const [changingRole, setChangingRole] = useState<string | null>(null);

    // User permissions state
    const [selectedUserForPerms, setSelectedUserForPerms] = useState<AdminUser | null>(null);
    const [userPermissions, setUserPermissions] = useState<UserPagePermission[]>([]);
    const [isLoadingUserPerms, setIsLoadingUserPerms] = useState(false);
    const [savingUserPerm, setSavingUserPerm] = useState<string | null>(null);

    // Fetch admin data when admin tab is selected
    const fetchAdminData = useCallback(async () => {
        if (!isAdmin) return;

        try {
            const token = await getToken();
            if (!token) return;

            setIsLoadingFeatures(true);
            setIsLoadingUsers(true);

            const [flags, users] = await Promise.all([
                adminService.getFeatureFlags(token),
                adminService.getUsers(token)
            ]);

            setFeatureFlags(flags);
            setAdminUsers(users);
        } catch (error) {
            appLogger.error('Failed to fetch admin data:', error);
        } finally {
            setIsLoadingFeatures(false);
            setIsLoadingUsers(false);
        }
    }, [isAdmin, getToken]);

    useEffect(() => {
        if (activeTab === 'admin' && isAdmin) {
            fetchAdminData();
        }
    }, [activeTab, isAdmin, fetchAdminData]);

    const handleToggleFeature = async (key: string, currentEnabled: boolean) => {
        try {
            const token = await getToken();
            if (!token) return;

            setTogglingFeature(key);
            await adminService.toggleFeature(token, key, !currentEnabled);

            // Update local state
            setFeatureFlags(prev => prev.map(f =>
                f.key === key ? { ...f, enabled: !currentEnabled } : f
            ));

            // Notify parent to refresh feature flags
            onFeatureFlagsChange?.();
        } catch (error) {
            appLogger.error('Failed to toggle feature:', error);
            showToast('Failed to toggle feature', 'error');
        } finally {
            setTogglingFeature(null);
        }
    };

    const handleChangeUserRole = async (userId: string, newRole: 'admin' | 'member') => {
        try {
            const token = await getToken();
            if (!token) return;

            setChangingRole(userId);
            await adminService.setUserRole(token, userId, newRole);

            // Update local state
            setAdminUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, role: newRole } : u
            ));
        } catch (error) {
            appLogger.error('Failed to change user role:', error);
            showToast(error instanceof Error ? error.message : 'Failed to change user role', 'error');
        } finally {
            setChangingRole(null);
        }
    };

    // Load permissions for selected user
    const handleSelectUserForPerms = async (userId: string) => {
        const selectedUser = adminUsers.find(u => u.id === userId);
        if (!selectedUser) {
            setSelectedUserForPerms(null);
            setUserPermissions([]);
            return;
        }

        setSelectedUserForPerms(selectedUser);
        setIsLoadingUserPerms(true);

        try {
            const token = await getToken();
            if (!token) return;

            const response = await adminService.getUserPermissions(token, userId);
            setUserPermissions(response.permissions);
        } catch (error) {
            appLogger.error('Failed to load user permissions:', error);
            showToast('Failed to load user permissions', 'error');
        } finally {
            setIsLoadingUserPerms(false);
        }
    };

    // Toggle a single permission for selected user
    const handleToggleUserPermission = async (pageKey: string, currentEnabled: boolean, source: 'user' | 'global') => {
        if (!selectedUserForPerms) return;

        try {
            const token = await getToken();
            if (!token) return;

            setSavingUserPerm(pageKey);

            // If currently using global, set to opposite of global
            // If currently user override, toggle it
            const newEnabled = !currentEnabled;

            await adminService.updateUserPermissions(token, selectedUserForPerms.id, [
                { pageKey, enabled: newEnabled }
            ]);

            // Update local state
            setUserPermissions(prev => prev.map(p =>
                p.pageKey === pageKey
                    ? { ...p, enabled: newEnabled, source: 'user' }
                    : p
            ));
        } catch (error) {
            appLogger.error('Failed to update user permission:', error);
            showToast('Failed to update permission', 'error');
        } finally {
            setSavingUserPerm(null);
        }
    };

    // Reset permission to global default
    const handleResetUserPermission = async (pageKey: string) => {
        if (!selectedUserForPerms) return;

        try {
            const token = await getToken();
            if (!token) return;

            setSavingUserPerm(pageKey);

            await adminService.updateUserPermissions(token, selectedUserForPerms.id, [
                { pageKey, enabled: null }
            ]);

            // Update local state - revert to global
            setUserPermissions(prev => prev.map(p =>
                p.pageKey === pageKey
                    ? { ...p, enabled: p.globalEnabled, source: 'global' }
                    : p
            ));
        } catch (error) {
            appLogger.error('Failed to reset user permission:', error);
            showToast('Failed to reset permission', 'error');
        } finally {
            setSavingUserPerm(null);
        }
    };

    // Reset all permissions to global defaults
    const handleResetAllUserPermissions = async () => {
        if (!selectedUserForPerms) return;

        if (!confirm('Reset all permissions to global defaults for this user?')) return;

        try {
            const token = await getToken();
            if (!token) return;

            setIsLoadingUserPerms(true);
            await adminService.resetUserPermissions(token, selectedUserForPerms.id);

            // Update local state - revert all to global
            setUserPermissions(prev => prev.map(p => ({
                ...p,
                enabled: p.globalEnabled,
                source: 'global'
            })));
        } catch (error) {
            appLogger.error('Failed to reset user permissions:', error);
            showToast('Failed to reset permissions', 'error');
        } finally {
            setIsLoadingUserPerms(false);
        }
    };

    // Enable all pages for user
    const handleEnableAllUserPermissions = async () => {
        if (!selectedUserForPerms) return;

        try {
            const token = await getToken();
            if (!token) return;

            setIsLoadingUserPerms(true);

            // Get all page keys and set them all to enabled
            const allKeys = Object.values(FEATURE_CATEGORIES).flat();
            const permissions = allKeys.map(key => ({ pageKey: key, enabled: true }));

            await adminService.updateUserPermissions(token, selectedUserForPerms.id, permissions);

            // Update local state
            setUserPermissions(prev => prev.map(p => ({
                ...p,
                enabled: true,
                source: 'user' as const
            })));
        } catch (error) {
            appLogger.error('Failed to enable all permissions:', error);
            showToast('Failed to enable all permissions', 'error');
        } finally {
            setIsLoadingUserPerms(false);
        }
    };

    // Disable all pages for user
    const handleDisableAllUserPermissions = async () => {
        if (!selectedUserForPerms) return;

        if (!confirm('Disable ALL pages for this user? They will see nothing.')) return;

        try {
            const token = await getToken();
            if (!token) return;

            setIsLoadingUserPerms(true);

            // Get all page keys and set them all to disabled
            const allKeys = Object.values(FEATURE_CATEGORIES).flat();
            const permissions = allKeys.map(key => ({ pageKey: key, enabled: false }));

            await adminService.updateUserPermissions(token, selectedUserForPerms.id, permissions);

            // Update local state
            setUserPermissions(prev => prev.map(p => ({
                ...p,
                enabled: false,
                source: 'user' as const
            })));
        } catch (error) {
            appLogger.error('Failed to disable all permissions:', error);
            showToast('Failed to disable all permissions', 'error');
        } finally {
            setIsLoadingUserPerms(false);
        }
    };

    // Keep newName in sync with userDisplayName when not editing
    useEffect(() => {
        if (!isEditingName) {
            setNewName(userDisplayName);
        }
    }, [userDisplayName, isEditingName]);

    const handleSaveName = async () => {
        const trimmedName = newName.trim();
        if (trimmedName) {
            // Update local state (fast)
            updateUserDisplayName(trimmedName);
            setIsEditingName(false);

            // Sync with Auth Provider (Clerk or Mock)
            if (user && (user as any).update) {
                try {
                    const nameParts = trimmedName.split(' ');
                    const firstName = nameParts[0];
                    const lastName = nameParts.slice(1).join(' ');

                    await (user as any).update({
                        firstName: firstName,
                        lastName: lastName
                    });
                } catch (error) {
                    appLogger.error('Failed to update user profile:', error);
                    // Minimal error handling for strictly visual preference
                }
            }
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

    // Toast notification state
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                showToast('File size too large. Please upload an image smaller than 10MB.', 'error');
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

    const handleSaveProfile = async () => {
        localStorage.setItem('user_job_title', jobTitle);
        localStorage.setItem('user_department', department);
        localStorage.setItem('user_bio', bio);

        // Save profile image if it has changed/set
        if (profileImage && profileImage.startsWith('data:image')) {
            try {
                localStorage.setItem('user_profile_image', profileImage);

                // Sync with backend - THIS IS THE CRITICAL PART FOR OTHERS TO SEE IT
                const token = await getToken();
                if (token) {
                    await userService.updateProfile(token, { avatarUrl: profileImage });
                }

                window.dispatchEvent(new Event('profile-image-updated'));
            } catch (error) {
                appLogger.error('Failed to sync profile image:', error);

                if (error instanceof Error && error.message.includes('quota')) {
                    showToast('Image is too large to save locally. Please try a smaller image.', 'error');
                } else {
                    showToast('Failed to sync profile picture with backend. Others might not see your update.', 'error');
                }
                return;
            }
        }

        // Visual feedback
        showToast(t('profile_saved') || 'Profile saved successfully!', 'success');
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
                                                className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
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
                                <p className="font-medium text-gray-900 dark:text-white">{t('region_currency') || 'Region & Currency'}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? `اختر دولتك لتحديث العملة (${country.currency.symbol})` : `Select your country to update currency (${country.currency.symbol})`}</p>
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
                    onClick={() => {
                        // Clear all user data before sign out
                        const keysToRemove = [
                            'app-active-workspace', 'app-active-board', 'app-active-view',
                            'app-workspaces', 'app-boards', 'app-recently-visited',
                            'app-page-visibility', 'app-deleted-boards', 'app-unsynced-boards',
                        ];
                        keysToRemove.forEach(key => localStorage.removeItem(key));
                        Object.keys(localStorage).forEach(key => {
                            if (key.startsWith('room-') || key.startsWith('board-')) {
                                localStorage.removeItem(key);
                            }
                        });
                        sessionStorage.removeItem('app-last-user-id');

                        const hostname = window.location.hostname;
                        const isAppDomain = hostname.startsWith('app.') && hostname.includes('nabdchain.com');

                        // Use Clerk's built-in redirect option
                        if (isAppDomain) {
                            signOut({ redirectUrl: 'https://nabdchain.com' });
                        } else {
                            signOut();
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
                                .filter(([key]) => {
                                    // For admins, show all pages
                                    // For regular users, only show pages the admin has allowed
                                    if (isAdmin) return true;
                                    return serverAllowedPages[key] !== false;
                                })
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

    const renderAdmin = () => {
        const getFeatureEnabled = (key: string) => {
            const flag = featureFlags.find(f => f.key === key);
            return flag?.enabled ?? true;
        };

        return (
            <div className="space-y-6 animate-fadeIn">
                {/* Feature Control Section */}
                <div className="bg-white dark:bg-monday-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-monday-dark-border shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <ToggleLeft size={24} className="text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Feature Control</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Toggle which pages are visible to all users</p>
                            </div>
                        </div>
                    </div>

                    {isLoadingFeatures ? (
                        <div className="flex items-center justify-center py-12">
                            <SpinnerGap size={32} className="text-blue-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(FEATURE_CATEGORIES).map(([category, keys]) => (
                                <div key={category} className="border border-gray-100 dark:border-monday-dark-border rounded-xl overflow-hidden">
                                    <div className="px-4 py-3 bg-gray-50 dark:bg-monday-dark-hover/50 border-b border-gray-100 dark:border-monday-dark-border">
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{category}</span>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        {keys.map(key => {
                                            const isEnabled = getFeatureEnabled(key);
                                            const isToggling = togglingFeature === key;
                                            return (
                                                <div
                                                    key={key}
                                                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-monday-dark-hover rounded-lg transition-colors"
                                                >
                                                    <span className={`text-sm ${isEnabled ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                                                        {FEATURE_LABELS[key] || key}
                                                    </span>
                                                    <button
                                                        onClick={() => handleToggleFeature(key, isEnabled)}
                                                        disabled={isToggling}
                                                        className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${isToggling ? 'opacity-50 cursor-wait' : 'cursor-pointer'
                                                            } ${isEnabled
                                                                ? 'bg-green-500'
                                                                : 'bg-gray-300 dark:bg-gray-600'
                                                            }`}
                                                    >
                                                        <span
                                                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 ${isEnabled ? 'translate-x-5' : 'translate-x-0'
                                                                }`}
                                                        />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* User Page Permissions Section */}
                <div className="bg-white dark:bg-monday-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-monday-dark-border shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Eye size={24} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">User Page Permissions</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Control which pages each user can see</p>
                            </div>
                        </div>
                    </div>

                    {/* User Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select User
                        </label>
                        <select
                            value={selectedUserForPerms?.id || ''}
                            onChange={(e) => handleSelectUserForPerms(e.target.value)}
                            className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-monday-dark-bg text-gray-800 dark:text-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        >
                            <option value="">-- Select a user --</option>
                            {adminUsers.filter(u => u.role !== 'admin').map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.name || u.email} ({u.email})
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Note: Admin users always see all pages
                        </p>
                    </div>

                    {/* Permissions Grid */}
                    {selectedUserForPerms && (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    {selectedUserForPerms.avatarUrl ? (
                                        <img src={selectedUserForPerms.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                                            {(selectedUserForPerms.name || selectedUserForPerms.email).charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <span className="font-medium text-gray-800 dark:text-gray-100">
                                        {selectedUserForPerms.name || selectedUserForPerms.email}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleEnableAllUserPermissions}
                                        disabled={isLoadingUserPerms}
                                        className="text-sm px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                    >
                                        Enable All
                                    </button>
                                    <button
                                        onClick={handleDisableAllUserPermissions}
                                        disabled={isLoadingUserPerms}
                                        className="text-sm px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                    >
                                        Disable All
                                    </button>
                                    <button
                                        onClick={handleResetAllUserPermissions}
                                        disabled={isLoadingUserPerms}
                                        className="text-sm px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Reset to Global
                                    </button>
                                </div>
                            </div>

                            {isLoadingUserPerms ? (
                                <div className="flex items-center justify-center py-12">
                                    <SpinnerGap size={32} className="text-blue-500 animate-spin" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(FEATURE_CATEGORIES).map(([category, keys]) => (
                                        <div key={category} className="border border-gray-100 dark:border-monday-dark-border rounded-xl overflow-hidden">
                                            <div className="px-4 py-3 bg-gray-50 dark:bg-monday-dark-hover/50 border-b border-gray-100 dark:border-monday-dark-border">
                                                <span className="font-semibold text-gray-700 dark:text-gray-200">{category}</span>
                                            </div>
                                            <div className="p-2 space-y-1">
                                                {keys.map(key => {
                                                    const perm = userPermissions.find(p => p.pageKey === key);
                                                    const isEnabled = perm?.enabled ?? true;
                                                    const isUserOverride = perm?.source === 'user';
                                                    const isSaving = savingUserPerm === key;

                                                    return (
                                                        <div
                                                            key={key}
                                                            className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-monday-dark-hover rounded-lg transition-colors"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-sm ${isEnabled ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500 line-through'}`}>
                                                                    {FEATURE_LABELS[key] || key}
                                                                </span>
                                                                {isUserOverride && (
                                                                    <button
                                                                        onClick={() => handleResetUserPermission(key)}
                                                                        disabled={isSaving}
                                                                        className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                                                        title="Reset to global"
                                                                    >
                                                                        custom
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => handleToggleUserPermission(key, isEnabled, perm?.source || 'global')}
                                                                disabled={isSaving}
                                                                className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${isSaving ? 'opacity-50 cursor-wait' : 'cursor-pointer'
                                                                    } ${isEnabled
                                                                        ? isUserOverride ? 'bg-blue-500' : 'bg-green-500'
                                                                        : 'bg-gray-300 dark:bg-gray-600'
                                                                    }`}
                                                            >
                                                                <span
                                                                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 ${isEnabled ? 'translate-x-5' : 'translate-x-0'
                                                                        }`}
                                                                />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-4 p-3 bg-gray-50 dark:bg-monday-dark-hover/30 rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span> Green = Using global setting
                                    <span className="inline-block w-3 h-3 bg-blue-500 rounded-full ml-3 mr-1"></span> Blue = Custom override
                                    <span className="inline-block w-3 h-3 bg-gray-300 rounded-full ml-3 mr-1"></span> Gray = Disabled
                                </p>
                            </div>
                        </>
                    )}

                    {!selectedUserForPerms && (
                        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                            Select a user above to manage their page permissions
                        </div>
                    )}
                </div>

                {/* User Management Section */}
                <div className="bg-white dark:bg-monday-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-monday-dark-border shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <Users size={24} className="text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">User Management</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage user roles and permissions</p>
                        </div>
                    </div>

                    {isLoadingUsers ? (
                        <div className="flex items-center justify-center py-12">
                            <SpinnerGap size={32} className="text-blue-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-monday-dark-border">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">User</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Email</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Role</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {adminUsers.map(adminUser => (
                                        <tr key={adminUser.id} className="border-b border-gray-50 dark:border-monday-dark-border/50 hover:bg-gray-50 dark:hover:bg-monday-dark-hover/50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    {adminUser.avatarUrl ? (
                                                        <img src={adminUser.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                                                            {(adminUser.name || adminUser.email).charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span className="font-medium text-gray-800 dark:text-gray-100">
                                                        {adminUser.name || 'No name'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                                {adminUser.email}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${adminUser.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                    }`}>
                                                    {adminUser.role === 'admin' && <Crown size={12} />}
                                                    {adminUser.role}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {adminUser.id !== user?.id && (
                                                    <button
                                                        onClick={() => handleChangeUserRole(
                                                            adminUser.id,
                                                            adminUser.role === 'admin' ? 'member' : 'admin'
                                                        )}
                                                        disabled={changingRole === adminUser.id}
                                                        className={`text-sm px-3 py-1 rounded-lg transition-colors ${changingRole === adminUser.id
                                                            ? 'bg-gray-100 text-gray-400 cursor-wait'
                                                            : adminUser.role === 'admin'
                                                                ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
                                                                : 'bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400'
                                                            }`}
                                                    >
                                                        {changingRole === adminUser.id
                                                            ? 'Saving...'
                                                            : adminUser.role === 'admin'
                                                                ? 'Remove Admin'
                                                                : 'Make Admin'}
                                                    </button>
                                                )}
                                                {adminUser.id === user?.id && (
                                                    <span className="text-xs text-gray-400">(You)</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full bg-[#FCFCFD] dark:bg-monday-dark-bg">
            {/* Toast Notification */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 rtl:right-auto rtl:left-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border backdrop-blur-sm animate-slideIn ${
                        toast.type === 'success'
                            ? 'bg-green-50/95 dark:bg-green-900/90 border-green-200 dark:border-green-700'
                            : 'bg-red-50/95 dark:bg-red-900/90 border-red-200 dark:border-red-700'
                    }`}
                    style={{
                        animation: 'slideIn 0.3s ease-out'
                    }}
                >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        toast.type === 'success'
                            ? 'bg-green-100 dark:bg-green-800'
                            : 'bg-red-100 dark:bg-red-800'
                    }`}>
                        {toast.type === 'success' ? (
                            <Check size={18} className="text-green-600 dark:text-green-300" weight="bold" />
                        ) : (
                            <Warning size={18} className="text-red-600 dark:text-red-300" weight="bold" />
                        )}
                    </div>
                    <span className={`font-medium ${
                        toast.type === 'success'
                            ? 'text-green-800 dark:text-green-100'
                            : 'text-red-800 dark:text-red-100'
                    }`}>
                        {toast.message}
                    </span>
                    <button
                        onClick={() => setToast(null)}
                        className={`ml-2 p-1 rounded-lg transition-colors ${
                            toast.type === 'success'
                                ? 'hover:bg-green-200 dark:hover:bg-green-700 text-green-600 dark:text-green-300'
                                : 'hover:bg-red-200 dark:hover:bg-red-700 text-red-600 dark:text-red-300'
                        }`}
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            )}

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

                    {/* Admin Tab - Only visible to admins */}
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('admin')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'admin'
                                ? 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-900 shadow-sm border border-purple-200/60 dark:from-purple-900/50 dark:to-purple-800/50 dark:text-purple-100 dark:border-purple-700/30'
                                : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                                }`}
                        >
                            <Crown size={18} />
                            Admin Panel
                        </button>
                    )}
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
                            {activeTab === 'admin' && 'Admin Panel'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            {activeTab === 'general' && t('manage_profile_desc')}
                            {activeTab === 'views' && t('customize_sidebar_desc')}
                            {activeTab === 'notifications' && t('control_notifications_desc')}
                            {activeTab === 'admin' && 'Control features and manage users across the platform'}
                        </p>
                    </div>

                    {activeTab === 'general' && renderGeneral()}
                    {activeTab === 'views' && renderViews()}
                    {activeTab === 'notifications' && renderNotifications()}
                    {activeTab === 'admin' && isAdmin && renderAdmin()}
                </div>
            </div>
        </div>
    );
};



export default SettingsPage;
