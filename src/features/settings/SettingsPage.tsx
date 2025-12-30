import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    Save, AlertTriangle, Layout, Check, Shield,
    Home, Sparkles, Activity, Grid, Inbox, MessageSquare, Users, Lock,
    ShoppingCart, Globe, Boxes, Truck, Users2, LayoutDashboard,
    Wrench, Factory, ShieldCheck, Building2, FileSpreadsheet, Megaphone, Banknote,
    Monitor
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

export const SettingsPage: React.FC<SettingsPageProps> = ({ visibility, onVisibilityChange }) => {
    const { user } = useAuth();
    const [localVisibility, setLocalVisibility] = useState(visibility);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setLocalVisibility(visibility);
    }, [visibility]);

    if (user?.email !== 'master@nabd.com') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <AlertTriangle className="text-red-500" size={48} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
                <p className="text-gray-600 max-w-md">
                    Only the master account (master@nabd.com) has permission to access these settings.
                </p>
            </div>
        );
    }

    const handleToggle = (key: string) => {
        const currentStatus = localVisibility[key] !== false;
        const newVis = { ...localVisibility, [key]: !currentStatus };
        setLocalVisibility(newVis);
        setHasChanges(true);
    };

    const handleSave = () => {
        onVisibilityChange(localVisibility);
        setHasChanges(false);
    };

    const sections = Array.from(new Set(Object.values(ALL_PAGES).map(p => p.section)));

    return (
        <div className="flex flex-col h-full bg-[#FCFCFD] dark:bg-monday-dark-bg p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full">
                <header className="mb-8 border-b pb-4 border-gray-200 dark:border-monday-dark-border flex items-center justify-between sticky top-0 bg-[#FCFCFD] dark:bg-monday-dark-bg z-10 pt-2">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-monday-dark-text flex items-center gap-2">
                            <Shield className="text-blue-600" />
                            Master Settings
                        </h1>
                        <p className="text-gray-500 dark:text-monday-dark-text-secondary mt-1">
                            Control page visibility for the entire workspace.
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all shadow-sm ${hasChanges
                                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md transform hover:-translate-y-0.5'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-monday-dark-hover dark:text-gray-500'
                            }`}
                    >
                        <Save size={18} />
                        Save Changes
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
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
                                                onClick={() => handleToggle(key)}
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
                                                    className={`relative w-12 h-7 rounded-full transition-all duration-300 ease-out flex-shrink-0 cursor-pointer border-2 ${isVisible
                                                            ? 'bg-blue-600 border-blue-600'
                                                            : 'bg-gray-200 border-gray-200 dark:bg-gray-700 dark:border-gray-700'
                                                        }`}
                                                >
                                                    <span className="sr-only">Toggle {config.label}</span>
                                                    <span
                                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isVisible ? 'translate-x-5' : 'translate-x-0'
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
        </div>
    );
};

export default SettingsPage;
