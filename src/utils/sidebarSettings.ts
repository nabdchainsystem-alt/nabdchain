/**
 * Sidebar quick navigation settings utilities
 */

const DEFAULT_QUICK_NAV = ['dashboard', 'my_work', 'inbox', 'vault'];

export const getQuickNavSettings = (): string[] => {
    const saved = localStorage.getItem('sidebar-quick-nav-items');
    return saved ? JSON.parse(saved) : DEFAULT_QUICK_NAV;
};

export const setQuickNavSettings = (items: string[]): void => {
    localStorage.setItem('sidebar-quick-nav-items', JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('quicknav-settings-changed', { detail: items }));
};
