import React from 'react';
import {
    Factory,
    MagnifyingGlass,
    ArrowRight,
    FileText,
    ShoppingCart,
    Clock,
    Package,
    Globe
} from 'phosphor-react';

interface MarketplacePageProps {
    onNavigate: (view: string, boardId?: string, skipHistoryPush?: boolean, searchQuery?: string) => void;
}

const MarketplacePage: React.FC<MarketplacePageProps> = ({ onNavigate }) => {
    const [searchTerm, setSearchTerm] = React.useState('');

    const handleSearch = () => {
        if (searchTerm.trim()) {
            onNavigate('local_marketplace', undefined, undefined, searchTerm);
        }
    };

    return (
        <div className="font-display bg-background-dark text-white overflow-hidden antialiased h-full w-full relative">
            <style>{`
        .btn-3d-primary {
            background: linear-gradient(180deg, #3b9eff 0%, #137fec 100%);
            box-shadow: 0px 6px 0px #0b5cb0, 0px 10px 10px rgba(0,0,0,0.3);
            transition: all 0.1s ease-in-out;
        }
        .btn-3d-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0px 8px 0px #0b5cb0, 0px 15px 15px rgba(0,0,0,0.3);
            filter: brightness(1.1);
        }
        .btn-3d-primary:active {
            transform: translateY(4px);
            box-shadow: 0px 2px 0px #0b5cb0, inset 0px 2px 5px rgba(0,0,0,0.2);
        }

        .btn-3d-secondary {
            background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.3);
            box-shadow: 0px 6px 0px rgba(0,0,0,0.4), 0px 10px 10px rgba(0,0,0,0.3);
            transition: all 0.1s ease-in-out;
        }
        .btn-3d-secondary:hover {
            transform: translateY(-2px);
            background: linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%);
            box-shadow: 0px 8px 0px rgba(0,0,0,0.4), 0px 15px 15px rgba(0,0,0,0.3);
        }
        .btn-3d-secondary:active {
            transform: translateY(4px);
            box-shadow: 0px 2px 0px rgba(0,0,0,0.4), inset 0px 2px 5px rgba(0,0,0,0.2);
        }

        /* Glass Search Bar */
        .glass-panel {
            background: rgba(16, 25, 34, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
        
        /* Font fix since we might not have Space Grotesk loaded globally */
        .font-display {
            font-family: 'Space Grotesk', system-ui, sans-serif;
        }
        
        .bg-background-dark {
          background-color: #101922;
        }
        .text-primary {
          color: #137fec;
        }
        .bg-primary {
          background-color: #137fec;
        }
        .hover\\:bg-primary-dark:hover {
          background-color: #0b5cb0;
        }
      `}</style>

            {/* Main Container */}
            <div className="relative h-screen w-full flex flex-col">
                {/* Background Video/Image Layer */}
                <div className="absolute inset-0 z-0">
                    <img
                        alt="Automated warehouse background"
                        className="h-full w-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQnKSrKCruEBiMioxg7OUteOW4aq_L08_aq6xzh-egBgcqL7N5_pmRAKV3qN-Gs9Ap1624ivxFeNQmuDxmVMRR4QO6nRCVFnBMACKNJLY-HmFfeaHRPCJgHJIj3sBbXEA98PLTAVHAhgXq-D2Iw-9W855YVW5Du-mokXHPXLs2YcIrAj_52OCmW8EzqsDYdv8PkrpB7pr5iyRYBT384Jm1NQO8sGd2Z3Y9vmdJ4KHidlPBq3ipd7QJpTF6hHlFnsw1ugGVxjI7aAw"
                    />
                    {/* Heavy Dark Overlay */}
                    <div className="absolute inset-0 bg-background-dark/70 bg-gradient-to-t from-background-dark/90 via-background-dark/50 to-background-dark/80" style={{ backgroundColor: '#101922', opacity: 0.7 }}></div>
                    {/* Gradient Overlay using inline style for exact colors if Tailwind config is missing */}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(16,25,34,0.9), rgba(16,25,34,0.5), rgba(16,25,34,0.8))' }}></div>
                </div>

                {/* Top Navigation */}
                <header className="relative z-50 flex items-center justify-between px-6 py-6 lg:px-16 w-full">
                    <div className="flex items-center gap-3 text-white">
                        <div className="size-8 text-primary" style={{ color: '#137fec' }}>
                            <Factory size={36} weight="fill" />
                        </div>
                        <h2 className="text-white text-xl font-bold tracking-tight">PartsMarket</h2>
                    </div>
                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-10">
                        <a className="text-white/80 hover:text-white text-sm font-medium transition-colors" href="#">Solutions</a>
                        <a className="text-white/80 hover:text-white text-sm font-medium transition-colors" href="#">Pricing</a>
                        <a className="text-white/80 hover:text-white text-sm font-medium transition-colors" href="#">Support</a>
                    </div>
                    <div className="flex gap-4">
                        <button className="hidden md:flex cursor-pointer items-center justify-center rounded-lg px-4 py-2 text-white/90 text-sm font-bold hover:bg-white/10 transition-colors">
                            Log In
                        </button>
                        <button className="flex cursor-pointer items-center justify-center rounded-lg px-5 py-2 bg-white text-background-dark text-sm font-bold hover:bg-gray-100 transition-colors shadow-lg shadow-white/10" style={{ color: '#101922' }}>
                            Sign Up
                        </button>
                    </div>
                </header>

                {/* Main Hero Content */}
                <main className="relative z-40 flex flex-1 flex-col items-center justify-center px-4 w-full">
                    <div className="w-full max-w-4xl flex flex-col items-center text-center gap-8">
                        {/* Headings */}
                        <div className="space-y-4">
                            <h1 className="text-white text-5xl md:text-7xl font-bold leading-tight tracking-tight drop-shadow-2xl">
                                The Engine of <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">Global Industry</span>
                            </h1>
                            <p className="text-white/80 text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto drop-shadow-md">
                                Source critical spare parts in seconds. Connect directly with verified manufacturers worldwide.
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="w-full max-w-2xl mt-4">
                            <div className="glass-panel rounded-xl p-2 flex items-center gap-2 transition-all focus-within:ring-2 focus-within:ring-primary/50">
                                <div className="pl-4 text-white/50 flex items-center">
                                    <MagnifyingGlass size={24} />
                                </div>
                                <input
                                    className="w-full bg-transparent border-none text-white placeholder-white/50 focus:ring-0 text-lg h-14 outline-none"
                                    placeholder="Search by Part Number, SKU, or Manufacturer..."
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button
                                    onClick={handleSearch}
                                    className="bg-primary hover:bg-primary-dark text-white rounded-lg px-6 h-12 font-bold transition-colors flex items-center gap-2"
                                    style={{ backgroundColor: '#137fec' }}
                                >
                                    <span>Search</span>
                                </button>
                            </div>
                        </div>

                        {/* 3D Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-6 mt-8 w-full justify-center">
                            <button
                                onClick={() => onNavigate('local_marketplace')}
                                className="btn-3d-primary relative flex items-center justify-center rounded-lg h-16 px-10 min-w-[240px] text-white text-lg font-bold tracking-wide group"
                            >
                                <span className="mr-2">Browse Marketplace</span>
                                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="btn-3d-secondary relative flex items-center justify-center rounded-lg h-16 px-10 min-w-[240px] text-white text-lg font-bold tracking-wide group">
                                <span className="mr-2">Request Quote</span>
                                <FileText size={20} />
                            </button>
                        </div>
                    </div>
                </main>

                {/* Live Stats Ticker (Bottom Bar) */}
                <footer className="relative z-50 w-full glass-panel border-t border-white/10 backdrop-blur-xl">
                    <div className="max-w-[1920px] mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="text-white font-bold tracking-wider uppercase text-sm">Live Activity</span>
                        </div>

                        {/* Stats Container */}
                        <div className="flex-1 flex overflow-hidden">
                            <div className="flex items-center gap-12 w-full justify-center md:justify-end text-sm md:text-base whitespace-nowrap text-white/90">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart size={20} weight="fill" className="text-primary" style={{ color: '#137fec' }} />
                                    <span className="font-light">Parts Sold Today:</span>
                                    <span className="font-bold">1,204</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={20} weight="fill" className="text-primary" style={{ color: '#137fec' }} />
                                    <span className="font-light">Active RFQs:</span>
                                    <span className="font-bold">342</span>
                                </div>
                                <div className="flex items-center gap-2 hidden sm:flex">
                                    <Package size={20} weight="fill" className="text-primary" style={{ color: '#137fec' }} />
                                    <span className="font-light">New Listings:</span>
                                    <span className="font-bold text-green-400">+500</span>
                                </div>
                                <div className="flex items-center gap-2 hidden lg:flex">
                                    <Globe size={20} weight="fill" className="text-primary" style={{ color: '#137fec' }} />
                                    <span className="font-light">Active Regions:</span>
                                    <span className="font-bold">42</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default MarketplacePage;
