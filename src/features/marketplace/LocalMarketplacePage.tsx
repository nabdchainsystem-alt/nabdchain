import React, { useState } from 'react';
import { MagnifyingGlass as Search, Star, Funnel as Filter, MapPin, CaretDown as ChevronDown, ArrowUpRight, TrendUp as TrendingUp, Users, ShoppingBag, WarningCircle as AlertCircle, CurrencyDollar as DollarSign, CaretLeft as ChevronLeft, CaretRight as ChevronRight, Package, PlusCircle, GridFour as LayoutGrid, ChartBar as BarChart3 } from 'phosphor-react';
import { useToast } from './components/Toast';
import { VENDORS_DATA } from './vendorsData';
import { Vendor } from './types';
import { CATEGORY_GROUPS, getCategoryGroup } from './categoryMapping';
import { useMarketplaceData } from './integration'; // Import integration hook

const INITIAL_SUPPLIERS = VENDORS_DATA as unknown as Vendor[]; // Cast to new type for initial state

const HERO_SLIDES = [
    {
        id: 1,
        title: "Summer Construction Sale",
        subtitle: "Up to 30% off on raw materials",
        image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
        color: "from-orange-500 to-red-500"
    },
    {
        id: 2,
        title: "Premium Office Furniture",
        subtitle: "Transform your workspace today",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
        color: "from-blue-500 to-indigo-500"
    },
    {
        id: 3,
        title: "Eco-Friendly Supplies",
        subtitle: "Sustainable solutions for your business",
        image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80",
        color: "from-green-500 to-emerald-500"
    }
];

const MOCK_MATERIALS = [
    { id: 1, name: 'Portland Cement', price: '$12/bag', supplier: 'ConstructCo', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=300&q=80' },
    { id: 2, name: 'Steel Rebar', price: '$450/ton', supplier: 'MetalWorks', image: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=300&q=80' },
    { id: 3, name: 'Office Paper A4', price: '$45/box', supplier: 'GreenLeaf', image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=300&q=80' },
    { id: 4, name: 'Ergonomic Chair', price: '$250/unit', supplier: 'OfficeComfort', image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=300&q=80' },
    { id: 5, name: 'Safety Helmets', price: '$25/unit', supplier: 'SafeGear', image: 'https://images.unsplash.com/photo-1584646369054-1372485973b1?auto=format&fit=crop&w=300&q=80' },
    { id: 6, name: 'Copper Wire', price: '$8/m', supplier: 'TechSolutions', image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=300&q=80' },
];

import { SupplierDetails } from './SupplierDetails';

const LocalMarketplacePage: React.FC = () => {
    const { showToast } = useToast();
    const { vendors: marketplaceVendors } = useMarketplaceData(); // Use hook
    const [viewMode, setViewMode] = useState<'marketplace' | 'live_tracking'>('marketplace');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        'Industrial & Manufacturing': true,
        'Construction & Materials': true,
        'Office & Business Services': true,
        'Other': true
    });
    const [categorySearchQuery, setCategorySearchQuery] = useState('');
    const [areCategoriesExpanded, setAreCategoriesExpanded] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [suppliers, setSuppliers] = useState<Vendor[]>(marketplaceVendors); // Initialize with hook data
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const ITEMS_PER_PAGE = 12;

    // Dynamically group categories present in the data
    const groupedCategories = React.useMemo(() => {
        const groups: Record<string, string[]> = {};
        const uniqueCategories = Array.from(new Set(VENDORS_DATA.map(v => v.category).filter(Boolean)));

        uniqueCategories.forEach(cat => {
            // Filter based on category search query
            if (categorySearchQuery && !cat.toLowerCase().includes(categorySearchQuery.toLowerCase())) {
                return;
            }

            const groupName = getCategoryGroup(cat);
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(cat);
        });

        // Sort categories within groups
        Object.keys(groups).forEach(key => {
            groups[key].sort();
        });

        return groups;
    }, [categorySearchQuery]);

    // Auto-expand groups when searching
    React.useEffect(() => {
        if (categorySearchQuery) {
            const newExpanded: Record<string, boolean> = {};
            Object.keys(groupedCategories).forEach(group => {
                newExpanded[group] = true;
            });
            setExpandedGroups(newExpanded);
        }
    }, [categorySearchQuery, groupedCategories]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const filteredSuppliers = suppliers.filter(supplier => {
        const matchesCategory = selectedCategory === 'All' || supplier.category === selectedCategory;
        const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (supplier.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (selectedVendor) {
        return <SupplierDetails vendor={selectedVendor} onBack={() => setSelectedVendor(null)} />;
    }

    return (
        <div className="flex flex-col h-full bg-gray-50/50 overflow-hidden font-sans text-gray-800">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 z-20 shadow-sm">
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Local Marketplace</h1>
                    <div className="h-6 w-[1px] bg-gray-200 hidden md:block"></div>
                    <div className="hidden md:flex items-center text-gray-500 text-sm hover:text-gray-900 cursor-pointer transition-colors bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 hover:border-gray-300">
                        <MapPin size={16} className="mr-2 text-clickup-purple" />
                        <span className="font-medium">Riyadh, SA</span>
                        <ChevronDown size={14} className="ml-2 opacity-50" />
                    </div>
                </div>

                <div className="flex items-center space-x-4 flex-1 max-w-xl mx-4 md:mx-8">
                    <div className="relative flex-1 group">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-clickup-purple transition-colors" />
                        <input
                            type="text"
                            placeholder="Search for suppliers, services, or products..."
                            className="w-full bg-gray-100 border border-transparent focus:bg-white focus:border-clickup-purple/50 focus:ring-4 focus:ring-clickup-purple/10 rounded-xl pl-10 pr-4 py-2.5 text-sm transition-all outline-none placeholder:text-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                        <button
                            onClick={() => setViewMode('marketplace')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'marketplace'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Marketplace
                        </button>
                        <button
                            onClick={() => setViewMode('live_tracking')}
                            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'live_tracking'
                                ? 'bg-white text-clickup-purple shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <BarChart3 size={14} className="mr-1.5" />
                            Live Tracking
                        </button>
                    </div>

                    <button className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-all active:scale-95">
                        <Filter size={16} />
                        <span className="hidden md:inline">Filters</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            {viewMode === 'live_tracking' ? (
                <div className="flex-1 overflow-y-auto">
                    <LiveTrackingView />
                </div>
            ) : (
                <div className="flex flex-1 overflow-hidden" style={{ zoom: '90%' }}>
                    {/* Sidebar Filters */}
                    <div className="w-72 bg-white border-r border-gray-200 p-6 overflow-y-auto hidden lg:block shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categories</h3>
                            </div>

                            {/* Category Search */}
                            <div className="relative mb-4">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Filter categories..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-clickup-purple focus:ring-1 focus:ring-clickup-purple/20 transition-all"
                                    value={categorySearchQuery}
                                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                                />
                            </div>

                            {/* All Category */}
                            <div className={`flex items-center justify-between mb-2 px-3 py-2 rounded-lg transition-all ${selectedCategory === 'All' ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                                <div
                                    className={`flex-1 cursor-pointer text-sm font-semibold ${selectedCategory === 'All' ? 'text-clickup-purple' : 'text-gray-700'}`}
                                    onClick={() => setSelectedCategory('All')}
                                >
                                    <span>All Categories</span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const newState = !areCategoriesExpanded;
                                        setAreCategoriesExpanded(newState);
                                        const newExpandedGroups: Record<string, boolean> = {};
                                        Object.keys(groupedCategories).forEach(key => {
                                            newExpandedGroups[key] = newState;
                                        });
                                        setExpandedGroups(newExpandedGroups);
                                    }}
                                    className="p-1 -mr-1 hover:bg-gray-200 rounded-md text-gray-400 transition-colors flex items-center justify-center"
                                >
                                    <ChevronDown
                                        size={14}
                                        className={`transition-transform duration-200 ${areCategoriesExpanded ? 'rotate-180' : ''}`}
                                    />
                                </button>
                            </div>

                            {/* Grouped Categories */}
                            <div className="space-y-1">
                                {Object.entries(groupedCategories).map(([group, categories]: [string, string[]]) => (
                                    <div key={group} className="mb-1">
                                        <div
                                            className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                            onClick={() => toggleGroup(group)}
                                        >
                                            <span>{group}</span>
                                            <ChevronDown
                                                size={14}
                                                className={`text-gray-400 transition-transform duration-200 ${expandedGroups[group] ? 'rotate-180' : ''}`}
                                            />
                                        </div>

                                        {expandedGroups[group] && (
                                            <div className="ml-2 pl-2 border-l border-gray-100 mt-1 space-y-0.5">
                                                {categories.map(cat => (
                                                    <div
                                                        key={cat}
                                                        className={`flex items-center justify-between px-3 py-1.5 rounded-md cursor-pointer text-sm transition-all ${selectedCategory === cat
                                                            ? 'bg-purple-50 text-clickup-purple font-medium'
                                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                                            }`}
                                                        onClick={() => setSelectedCategory(cat)}
                                                    >
                                                        <span className="truncate">{cat}</span>
                                                        {selectedCategory === cat && <div className="w-1.5 h-1.5 rounded-full bg-clickup-purple shrink-0 ml-2"></div>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Rating</h3>
                            <div className="space-y-2">
                                {[4, 3, 2, 1].map(stars => (
                                    <div key={stars} className="flex items-center group cursor-pointer px-2 py-1 rounded hover:bg-gray-50">
                                        <div className="flex text-yellow-400 mr-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} fill={i < stars ? "currentColor" : "none"} className={i < stars ? "" : "text-gray-200"} />
                                            ))}
                                        </div>
                                        <span className="text-sm text-gray-500 group-hover:text-gray-700">& Up</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Price Range</h3>
                            <div className="flex gap-2">
                                {['$', '$$', '$$$'].map(price => (
                                    <button key={price} className="flex-1 px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 hover:border-clickup-purple hover:text-clickup-purple transition-colors">
                                        {price}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Results Grid */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50/50">

                        {/* KPI & Charts Section */}
                        <div className="mb-8 space-y-6">
                            {/* KPI Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Spend</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">$124.5k</h3>
                                        <div className="flex items-center mt-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                                            <TrendingUp size={12} className="mr-1" />
                                            +12.5%
                                        </div>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                        <DollarSign size={24} />
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Suppliers</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">48</h3>
                                        <div className="flex items-center mt-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                                            <TrendingUp size={12} className="mr-1" />
                                            +4 new
                                        </div>
                                    </div>
                                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                                        <Users size={24} />
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Open Orders</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">15</h3>
                                        <div className="flex items-center mt-2 text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full w-fit">
                                            <AlertCircle size={12} className="mr-1" />
                                            3 pending
                                        </div>
                                    </div>
                                    <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                                        <ShoppingBag size={24} />
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Rating</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">4.8</h3>
                                        <div className="flex items-center mt-2 text-xs font-medium text-gray-500">
                                            Based on 1.2k reviews
                                        </div>
                                    </div>
                                    <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600">
                                        <Star size={24} fill="currentColor" />
                                    </div>
                                </div>
                            </div>


                        </div>

                        {/* Hero Banner */}
                        <div className="mb-8 relative rounded-2xl overflow-hidden h-40 shadow-sm">
                            <img
                                src="https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=1200&q=80"
                                alt="Marketplace Banner"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-transparent flex flex-col justify-center px-8 text-white">
                                <h2 className="text-2xl font-bold mb-2">Find Trusted Local Suppliers</h2>
                                <p className="text-sm opacity-90 max-w-md">Connect with top-rated vendors in your area for all your business needs.</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-800">
                                {selectedCategory === 'All' ? 'All Suppliers' : selectedCategory}
                                <span className="ml-2 text-sm font-normal text-gray-400">({filteredSuppliers.length} results)</span>
                            </h2>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <span>Sort by:</span>
                                <button className="font-medium text-gray-800 flex items-center hover:text-clickup-purple">
                                    Recommended <ChevronDown size={14} className="ml-1" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8">
                            {filteredSuppliers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(supplier => (
                                <div
                                    key={supplier.id}
                                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer"
                                    onClick={() => setSelectedVendor(supplier)}
                                >
                                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                                        <img
                                            src={supplier.image}
                                            alt={supplier.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-gray-700 shadow-sm">
                                            {supplier.category}
                                        </div>
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-base font-bold text-gray-900 group-hover:text-clickup-purple transition-colors line-clamp-1">
                                                {supplier.name}
                                            </h3>
                                            <div className="flex items-center bg-yellow-50 px-1.5 py-0.5 rounded text-yellow-700 border border-yellow-100">
                                                <Star size={10} fill="currentColor" className="mr-1" />
                                                <span className="text-xs font-bold">{supplier.rating}</span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-1 leading-relaxed">
                                            {supplier.description}
                                        </p>

                                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pt-4 border-t border-gray-50">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase tracking-wider text-gray-400">Min Order</span>
                                                <span className="font-medium text-gray-700">{supplier.minOrder}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] uppercase tracking-wider text-gray-400">Reviews</span>
                                                <span className="font-medium text-gray-700">{supplier.reviews}</span>
                                            </div>
                                        </div>

                                        <button
                                            className="w-full bg-gray-900 hover:bg-clickup-purple text-white py-2.5 rounded-xl text-sm font-medium shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center group-hover:bg-clickup-purple"
                                            onClick={() => showToast(`Request sent to ${supplier.name}`, 'success')}
                                        >
                                            <span>Connect Supplier</span>
                                            <ArrowUpRight size={14} className="ml-2 opacity-70" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {filteredSuppliers.length > ITEMS_PER_PAGE && (
                            <div className="flex items-center justify-center space-x-2 mb-12">
                                <button
                                    className={`p-2 rounded-lg border ${currentPage === 1 ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'}`}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft size={18} />
                                </button>

                                {[...Array(Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE))].map((_, i) => (
                                    <button
                                        key={i}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-clickup-purple text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900'}`}
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}

                                <button
                                    className={`p-2 rounded-lg border ${currentPage === Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE) ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'}`}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE)))}
                                    disabled={currentPage === Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE)}
                                >
                                    <ChevronRight size={18} />
                                </button>

                                <div className="flex items-center ml-4 space-x-2 border-l border-gray-200 pl-4">
                                    <span className="text-sm text-gray-500">Go to</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE)}
                                        className="w-12 px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-clickup-purple transition-colors text-center"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = parseInt(e.currentTarget.value);
                                                if (!isNaN(val) && val >= 1 && val <= Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE)) {
                                                    setCurrentPage(val);
                                                    e.currentTarget.value = '';
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Hero Section (Carousel) */}
                        <div className="mb-8 relative group rounded-2xl overflow-hidden h-48 md:h-64 shadow-md">
                            <div
                                className="absolute inset-0 flex transition-transform duration-500 ease-out"
                                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                            >
                                {HERO_SLIDES.map((slide) => (
                                    <div key={slide.id} className="w-full h-full flex-shrink-0 relative">
                                        <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                                        <div className={`absolute inset-0 bg-gradient-to-r ${slide.color} opacity-80 mix-blend-multiply`}></div>
                                        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 text-white">
                                            <h2 className="text-3xl md:text-4xl font-bold mb-2">{slide.title}</h2>
                                            <p className="text-lg md:text-xl opacity-90">{slide.subtitle}</p>
                                            <button className="mt-6 bg-white text-gray-900 px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors w-fit">
                                                Explore Now
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={prevSlide}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-2 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-2 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                            >
                                <ChevronRight size={24} />
                            </button>

                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                                {HERO_SLIDES.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-all ${currentSlide === index ? 'bg-white w-6' : 'bg-white/50'}`}
                                    ></div>
                                ))}
                            </div>
                        </div>

                        {/* Materials Grid */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                                    <Package size={20} className="mr-2 text-clickup-purple" />
                                    Featured Materials
                                </h2>
                                <button className="text-sm text-clickup-purple hover:underline font-medium">View All</button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {MOCK_MATERIALS.map((material) => (
                                    <div key={material.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer">
                                        <div className="h-24 bg-gray-100 relative overflow-hidden">
                                            <img src={material.image} alt={material.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <div className="p-3">
                                            <h3 className="text-sm font-bold text-gray-800 truncate" title={material.name}>{material.name}</h3>
                                            <p className="text-xs text-gray-500 truncate">{material.supplier}</p>
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className="text-xs font-bold text-clickup-purple bg-purple-50 px-1.5 py-0.5 rounded">{material.price}</span>
                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-clickup-purple hover:text-white transition-colors">
                                                    <PlusCircle size={12} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const LiveTrackingView: React.FC = () => {
    const glassPanel = "bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05),0_4px_6px_-2px_rgba(0,0,0,0.025)]";

    return (
        <div className="bg-background-light text-slate-900 font-display overflow-hidden h-full w-full flex flex-col md:flex-row">
            {/* Left Sidebar */}
            <aside className="w-full md:w-[300px] lg:w-[320px] h-full bg-white border-r border-slate-200 flex flex-col overflow-y-auto shrink-0 z-20 shadow-xl shadow-slate-200/50">
                <div className="p-5 pb-2">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-primary text-3xl">deployed_code</span>
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">SwiftLogistics</h1>
                    </div>

                    <div className="mb-6">
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded">Priority Air</span>
                        <h2 className="mt-2 text-xl font-bold text-slate-900">#8493-XJ</h2>
                        <p className="text-slate-500 text-sm">Created Oct 23, 2023</p>
                    </div>

                    <div className="relative overflow-hidden rounded-xl bg-primary p-4 shadow-lg shadow-primary/30 text-white mb-6 group cursor-pointer transition-transform hover:scale-[1.01]">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-8xl">local_shipping</span>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                </span>
                                <span className="text-xs font-bold uppercase tracking-widest">Live Status</span>
                            </div>
                            <p className="text-xl font-bold leading-tight mb-1">In Transit</p>
                            <p className="text-blue-100 text-sm font-medium">Est. Arrival: Oct 27 - 2:00 PM</p>
                        </div>
                    </div>
                </div>

                <div className="px-5 py-2">
                    <h3 className="text-slate-900 font-bold text-sm uppercase tracking-wider mb-3">Package Details</h3>
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex flex-col gap-1">
                            <p className="text-slate-500 text-xs font-medium uppercase">Weight</p>
                            <p className="text-slate-900 text-sm font-semibold">4.5 lbs</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-slate-500 text-xs font-medium uppercase">Dimensions</p>
                            <p className="text-slate-900 text-sm font-semibold">12x10x5 in</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-slate-500 text-xs font-medium uppercase">Service</p>
                            <p className="text-slate-900 text-sm font-semibold">Express Air</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-slate-500 text-xs font-medium uppercase">Items</p>
                            <p className="text-slate-900 text-sm font-semibold">Electronics</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-5 pt-4">
                    <h3 className="text-slate-900 font-bold text-sm uppercase tracking-wider mb-4">Tracking History</h3>
                    <div className="grid grid-cols-[32px_1fr] gap-x-3">
                        <div className="flex flex-col items-center gap-1 pt-1">
                            <div className="text-primary material-symbols-outlined text-[20px]">check_circle</div>
                            <div className="w-[2px] bg-primary/20 h-full grow rounded-full"></div>
                        </div>
                        <div className="pb-6">
                            <p className="text-slate-900 text-sm font-bold">Order Placed</p>
                            <p className="text-slate-500 text-xs">Oct 23, 9:00 AM • San Francisco, CA</p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-[2px] bg-primary/20 h-2 rounded-full"></div>
                            <div className="text-primary material-symbols-outlined text-[20px]">local_shipping</div>
                            <div className="w-[2px] bg-primary/20 h-full grow rounded-full"></div>
                        </div>
                        <div className="pb-6 pt-1">
                            <p className="text-slate-900 text-sm font-bold">Picked Up</p>
                            <p className="text-slate-500 text-xs">Oct 23, 2:30 PM • San Francisco, CA</p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-[2px] bg-primary/20 h-2 rounded-full"></div>
                            <div className="text-primary material-symbols-outlined text-[20px] animate-pulse">warehouse</div>
                        </div>
                        <div className="pt-1">
                            <p className="text-primary text-sm font-bold">In Transit to Hub</p>
                            <p className="text-slate-500 text-xs">Oct 24, 5:00 AM • Phoenix, AZ</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Map + Progress */}
            <main className="flex-1 relative bg-slate-50 overflow-hidden flex flex-col justify-center items-center" style={{ background: 'radial-gradient(circle at center, rgba(19, 127, 236, 0.03) 0%, rgba(255,255,255,0) 60%)' }}>
                <div
                    className="absolute inset-0 z-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(#137fec 1px, transparent 1px), linear-gradient(90deg, #137fec 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                ></div>

                <div className="absolute top-6 w-full px-4 md:px-8 z-20 flex justify-center">
                    <div className={`${glassPanel} px-5 py-2 rounded-full shadow-lg flex items-center justify-between gap-5 max-w-2xl w-full mx-auto relative overflow-hidden`}>
                        <div className="absolute bottom-0 left-0 h-[2px] bg-slate-100 w-full z-0">
                            <div className="h-full bg-primary w-[34%] shadow-[0_0_10px_rgba(19,127,236,0.5)]"></div>
                        </div>
                        <div className="flex items-center gap-3 z-10 shrink-0">
                            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined text-[18px]">moving</span>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Covered</span>
                                <span className="text-base font-bold text-slate-900 font-display leading-none">642 <span className="text-[10px] font-normal text-slate-500">mi</span></span>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-center z-10 mx-2">
                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
                                <div className="h-full bg-gradient-to-r from-primary to-blue-400 w-[34%] rounded-full relative">
                                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/30 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 z-10 shrink-0 justify-end">
                            <div className="flex flex-col justify-center items-end">
                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Remaining</span>
                                <span className="text-base font-bold text-slate-900 font-display leading-none">1,240 <span className="text-[10px] font-normal text-slate-500">mi</span></span>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                <span className="material-symbols-outlined text-[18px]">flag</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative w-full max-w-5xl h-[340px] flex items-center justify-center z-10 px-3 md:px-8">
                    <div className="absolute left-10 md:left-14 top-1/2 transform -translate-y-1/2 flex flex-col items-center group z-20">
                        <div className="w-5 h-5 rounded-full bg-white border-4 border-slate-200 shadow-md mb-3 transition-colors"></div>
                        <div className={`${glassPanel} px-4 py-2 rounded-xl shadow-sm text-center`}>
                            <p className="text-sm font-bold text-slate-800">San Francisco</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Origin</p>
                        </div>
                    </div>
                    <div className="absolute right-10 md:right-14 top-1/2 transform -translate-y-1/2 flex flex-col items-center group z-20">
                        <div className="w-5 h-5 rounded-full bg-slate-800 border-4 border-slate-100 shadow-md mb-3"></div>
                        <div className={`${glassPanel} px-4 py-2 rounded-xl shadow-sm text-center`}>
                            <p className="text-sm font-bold text-slate-800">New York</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Destination</p>
                        </div>
                    </div>

                    <svg className="w-full h-full absolute inset-0 pointer-events-none" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="routeGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                                <stop offset="0%" stopColor="#cbd5e1"></stop>
                                <stop offset="35%" stopColor="#137fec"></stop>
                                <stop offset="100%" stopColor="#e2e8f0"></stop>
                            </linearGradient>
                            <filter id="glow-line" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="4"></feGaussianBlur>
                                <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
                            </filter>
                        </defs>
                        <path d="M 100 200 C 350 120, 650 280, 900 200" fill="none" stroke="#e2e8f0" strokeLinecap="round" strokeWidth="8" vectorEffect="non-scaling-stroke"></path>
                        <path className="drop-shadow-xl animate-pulse" d="M 100 200 C 350 120, 650 280, 900 200" fill="none" filter="url(#glow-line)" stroke="url(#routeGradient)" strokeDasharray="1000" strokeDashoffset="0" strokeLinecap="round" strokeWidth="5" vectorEffect="non-scaling-stroke"></path>
                    </svg>

                    <div className="absolute left-[35%] top-[34%] transform -translate-x-1/2 -translate-y-1/2 z-30 animate-[bounce_4s_ease-in-out_infinite]">
                        <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-xl w-max flex items-center gap-2 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-6 after:border-transparent after:border-t-slate-900 z-30">
                            <span className="material-symbols-outlined text-[16px] text-yellow-400">schedule</span>
                            <div className="text-left leading-none">
                                <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Est. Arrival</span>
                                <span className="block text-sm font-bold">3 days left</span>
                            </div>
                        </div>
                        <div className="relative w-16 h-16 bg-white rounded-full shadow-[0_0_24px_rgba(19,127,236,0.35)] flex items-center justify-center border-[5px] border-blue-50 z-20">
                            <div className="absolute inset-0 rounded-full border border-primary/20"></div>
                            <span className="material-symbols-outlined text-primary text-3xl drop-shadow-sm">local_shipping</span>
                            <div className="absolute inset-0 rounded-full border-2 border-primary opacity-0 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                        </div>
                        <div className={`${glassPanel} absolute top-24 left-1/2 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded-lg border border-white/50 shadow-lg w-max flex items-center gap-2`}>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <p className="text-xs font-bold text-slate-700">Passing Phoenix, AZ</p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8 z-10 w-full px-3 md:px-6">
                    <div className="flex gap-3 justify-center flex-wrap">
                        <div className={`${glassPanel} h-11 px-4 rounded-full shadow-sm flex items-center gap-3 min-w-[150px] hover:-translate-y-1 transition-transform duration-300`}>
                            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-orange-400 text-lg">sunny</span>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Weather</span>
                                <span className="text-sm font-bold text-slate-900 leading-none">Clear, 78°F</span>
                            </div>
                        </div>
                        <div className={`${glassPanel} h-11 px-4 rounded-full shadow-sm flex items-center gap-3 min-w-[150px] hover:-translate-y-1 transition-transform duration-300`}>
                            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-green-500 text-lg">traffic</span>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Traffic</span>
                                <span className="text-sm font-bold text-slate-900 leading-none">Light</span>
                            </div>
                        </div>
                        <div className={`${glassPanel} h-11 px-4 rounded-full shadow-sm flex items-center gap-3 min-w-[150px] hover:-translate-y-1 transition-transform duration-300`}>
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-blue-500 text-lg">speed</span>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Avg Speed</span>
                                <span className="text-sm font-bold text-slate-900 leading-none">62 mph</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Right Sidebar */}
            <aside className="w-full md:w-[280px] bg-slate-50/50 border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto">
                <div className="p-5 border-b border-slate-200 bg-white">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Your Courier</h3>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-md" data-alt="Portrait of delivery driver in uniform">
                                <img alt="Driver" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAtid8GVeWd3NUiRISf8oaQNQM8t8PssDfs5wCEwzNnzMg26CAe1gyCuLN_AoVmBKNIs_kLk593dl-aMDfKwZFcYY9scvwcM6v82XC5yeJXJyjtfNi6CPM_qmB6JcGN4-M9b4O5nbGhsdnZJyrHmHViip4_WvOh-aevWvnaq4ve_bYapSp0aOIV4s8zUn7W4UY9AeLm-tJpH5eOS5K7DFOqX5BaRv1CFk_QGJAzdvyp6Oqq-CZsUYwZfuqnZZP_Ni0qYPzUgKT4-un" />
                            </div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 text-lg">Michael R.</p>
                            <div className="flex items-center gap-1 text-yellow-500">
                                <span className="material-symbols-outlined text-[16px] fill-current">star</span>
                                <span className="text-slate-600 text-xs font-medium">4.9 (1240)</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <button className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
                            <span className="material-symbols-outlined text-[18px]">chat</span>
                            Message
                        </button>
                        <button className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
                            <span className="material-symbols-outlined text-[18px]">call</span>
                            Call
                        </button>
                    </div>
                </div>

                <div className="p-5 border-b border-slate-200">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Management</h3>
                    <div className="flex flex-col gap-3">
                        <button className="group flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-md bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">edit_location_alt</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-slate-900">Change Delivery</p>
                                    <p className="text-xs text-slate-500">Update address or time</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-300 group-hover:text-primary">chevron_right</span>
                        </button>
                        <button className="group flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-md bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">support_agent</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-slate-900">Report Issue</p>
                                    <p className="text-xs text-slate-500">Damaged or lost item</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-300 group-hover:text-primary">chevron_right</span>
                        </button>
                        <button className="group flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-md bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">ios_share</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-slate-900">Share Tracking</p>
                                    <p className="text-xs text-slate-500">Send link to recipient</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-300 group-hover:text-primary">chevron_right</span>
                        </button>
                    </div>
                </div>

                <div className="p-5 flex-1">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Other Orders</h3>
                        <button className="text-primary text-xs font-semibold hover:underline">View All</button>
                    </div>
                    <div className="space-y-3">
                        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-slate-800 text-sm">#9281-AB</span>
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded">Delivered</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-slate-400 text-[16px]">package_2</span>
                                <p className="text-xs text-slate-600 truncate">Office Supplies Bundle</p>
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                                <p className="text-[10px] text-slate-400">Oct 20, 2023</p>
                                <span className="material-symbols-outlined text-slate-300 text-[16px] group-hover:text-primary">arrow_forward</span>
                            </div>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-slate-800 text-sm">#7734-XY</span>
                                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase rounded">Processing</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-slate-400 text-[16px]">inventory_2</span>
                                <p className="text-xs text-slate-600 truncate">Gaming Monitor 27"</p>
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                                <p className="text-[10px] text-slate-400">Today</p>
                                <span className="material-symbols-outlined text-slate-300 text-[16px] group-hover:text-primary">arrow_forward</span>
                            </div>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-slate-800 text-sm">#6521-ZZ</span>
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded">Draft</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-slate-400 text-[16px]">edit_note</span>
                                <p className="text-xs text-slate-600 truncate">Return: Headphones</p>
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                                <p className="text-[10px] text-slate-400">Created yesterday</p>
                                <span className="material-symbols-outlined text-slate-300 text-[16px] group-hover:text-primary">arrow_forward</span>
                            </div>
                        </div>
                    </div>
                    <button className="mt-4 w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 text-sm font-medium hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Create New Shipment
                    </button>
                </div>
            </aside>
        </div>
    );
};

export default LocalMarketplacePage;
