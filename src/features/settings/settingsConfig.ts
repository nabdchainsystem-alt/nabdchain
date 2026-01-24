import {
    House, SquaresFour, Tray, Users, Lock,
    ShoppingCart, Globe, Package, Truck, UsersThree,
    Wrench, Factory, ShieldCheck, Buildings, Table, Megaphone, Money,
    Monitor, Layout, Flask, CurrencyDollar
} from 'phosphor-react';

export interface PageConfig {
    label: string;
    section: string;
    icon: React.ComponentType<any>;
}

export const ALL_PAGES: Record<string, PageConfig> = {
    // Top Level
    'home': { label: 'home', section: 'main', icon: House },
    'my_work': { label: 'my_work', section: 'main', icon: SquaresFour },
    'inbox': { label: 'inbox', section: 'main', icon: Tray },
    'teams': { label: 'teams', section: 'main', icon: Users },
    'vault': { label: 'vault', section: 'main', icon: Lock },
    'test_tools': { label: 'test_tools', section: 'main', icon: Flask },
    'mini_company': { label: 'departments', section: 'main', icon: Buildings },

    // Mini Company Departments
    'sales': { label: 'sales', section: 'mini_company', icon: Megaphone },
    'purchases': { label: 'purchases', section: 'mini_company', icon: ShoppingCart },
    'inventory': { label: 'inventory', section: 'mini_company', icon: Package },
    'expenses': { label: 'expenses', section: 'mini_company', icon: CurrencyDollar },
    'customers': { label: 'customers', section: 'mini_company', icon: UsersThree },
    'suppliers': { label: 'suppliers', section: 'mini_company', icon: Truck },

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
