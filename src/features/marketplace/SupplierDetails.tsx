import React from 'react';
import { Vendor } from './types';
import {
    ArrowLeft,
    CheckCircle,
    Filter,
    Globe,
    Heart,
    Mail,
    MapPin,
    Phone,
    Search,
    Share2,
    ShieldCheck,
    ShoppingCart,
    Star,
    Zap,
} from 'lucide-react';

interface SupplierDetailsProps {
    vendor: Vendor;
    onBack: () => void;
}

const sampleProducts = [
    { id: 'p1', title: 'Heavy Duty Steel I-Beam (Type H)', moq: 'MOQ: 50 Tons', price: '$450', unit: '/ton', badge: 'Bestseller', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAa_YadcGAEglrgCjiyKvwvWUBUQbUMbTEvJt9g-Slekwcn_fE3dp3CD3nTfrFMn1X3x1H092Nt_hDGCJ5g8SPXvMZNb_QTl-7TMMFsqSdOxvKgmu4h6t1quLjDxQ6vWbpipk8EKDbu7DeIJ-oylSGCldfMG_HGwEB3Ys4hwyyOLUMFi0dpgXIR9Vs7oJzo9da-KXzr2OdSTQNRndC_7up39R0JJRtjvlek_TexrtsF2iC4bmHHaN-FSYyI4lFqCjZYNKqMpBIJhpQ' },
    { id: 'p2', title: 'Stainless Steel Hex Bolts M12', moq: 'MOQ: 1000 Units', price: '$0.45', unit: '/unit', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwkUtcn1FPBrWKYfbrUGHcw2eq22D6jWmhgy8XaPXQL_1PynduksikWnh2meeuvmKwLY4j-1bDDGoLKK2s41VUj8pp3gyJnRIVNA4uJbfp_xcBEEDG1jRKvhv-zXy4CJ7b6l_ovUhty5UOKA_mm0FgCBNG5B-EfYfWCGxk6pq2Ghva3yAhok4n5A8w7balSCZ9b1bqR_Wgta9-WzQ5KzMByxlLuV-OjBPKABSdLFL3H0EjVjvibfvgo5Mu8mshd2t05zWjN6nXX7E' },
    { id: 'p3', title: 'Aluminum Sheet 5052', moq: 'MOQ: 20 Sheets', price: '$120', unit: '/sheet', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6JTz5ytSx7gyfmrURJqhRtIEh2XPOvcnMfqX3AYJR8U-ArDYLzvUvVz9JgwwG66apB3rOVkaRhzxtwd7PE9GoYhB49uLX4Xqcfhm6gUqsi3QsxhhI4hs-AfNYkRnuU-mlF6wBtxzz9Rveae2hmZfjNnEYI8vJLmy8PErHgjvcp3EbW1g32gfay8baZ3P0O_8fk0hdqm6CD0M5AFa78e0nsSK_hNTOO6UgGdomuhWj6l4wWcRoNzMt3jjZLTX0zaZfjR6godwut8U' },
    { id: 'p4', title: 'ARC 200 Welding Machine', moq: 'MOQ: 5 Units', price: '$299', unit: '', badge: 'Sale', original: '$349', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC05D5QCr0sFJ0xmYTKS6Z3SbZsaCfcq9mIyvsGmCALudUf8wOUKjxkgtlxKDoD9Liy2yW5x_4AMh_tQLhsLH_atwceF_Y-BUzAm-26RKc5kUhfcezz9sY2FXhc7VkxW18Y5ZuyEZ56Fon46Jchvz_z1A3eJQ5aYYyiAkytx_NW0zu6SqyEopcAvQHCzSIfPEf4F2VmS5IFHTeZtfWbMhbNPtzXfbMFGi5XahLlbeyNUGzbMUk-Xj50CiLwVmA5qN8bxCSfoNtvbak' },
    { id: 'p5', title: 'Seamless Steel Pipe', moq: 'MOQ: 50 Pipes', price: '$85', unit: '/pipe', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCN4giKJXqbIIxpmLOyCsdyAT3C3SKmZ6-ez3FtOfCyEu-3ZfGvl52HQTLaFkq6BcaznCU2vM5ZRDUNLL0_Zo77QV1JXY_BDtq3jaKXPO_BP-SmYcc5y3iKot_XqgdEf6SMIHYlnDm7BARtbsXuoCfk0u_ieM2w5lMNNonNMPDVeA3X_P2FZ_JrvMslqg3ZLHPhVUMdlD0JNCSIOqeXHGx-bT19I5MBAD4YU9Ky7fl0gVREhOEPf3EgTvKwtHPxIIRjYRjC8u5FmTs' },
    { id: 'p6', title: 'Alloy 6061 Plate', moq: 'MOQ: 15 Sheets', price: '$140', unit: '/sheet', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6JTz5ytSx7gyfmrURJqhRtIEh2XPOvcnMfqX3AYJR8U-ArDYLzvUvVz9JgwwG66apB3rOVkaRhzxtwd7PE9GoYhB49uLX4Xqcfhm6gUqsi3QsxhhI4hs-AfNYkRnuU-mlF6wBtxzz9Rveae2hmZfjNnEYI8vJLmy8PErHgjvcp3EbW1g32gfay8baZ3P0O_8fk0hdqm6CD0M5AFa78e0nsSK_hNTOO6UgGdomuhWj6l4wWcRoNzMt3jjZLTX0zaZfjR6godwut8U' },
    { id: 'p7', title: 'Structural Steel Beam (Type W)', moq: 'MOQ: 30 Tons', price: '$480', unit: '/ton', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAa_YadcGAEglrgCjiyKvwvWUBUQbUMbTEvJt9g-Slekwcn_fE3dp3CD3nTfrFMn1X3x1H092Nt_hDGCJ5g8SPXvMZNb_QTl-7TMMFsqSdOxvKgmu4h6t1quLjDxQ6vWbpipk8EKDbu7DeIJ-oylSGCldfMG_HGwEB3Ys4hwyyOLUMFi0dpgXIR9Vs7oJzo9da-KXzr2OdSTQNRndC_7up39R0JJRtjvlek_TexrtsF2iC4bmHHaN-FSYyI4lFqCjZYNKqMpBIJhpQ' },
    { id: 'p8', title: 'Carbon Steel Nuts M10', moq: 'MOQ: 5000 Units', price: '$0.08', unit: '/unit', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwkUtcn1FPBrWKYfbrUGHcw2eq22D6jWmhgy8XaPXQL_1PynduksikWnh2meeuvmKwLY4j-1bDDGoLKK2s41VUj8pp3gyJnRIVNA4uJbfp_xcBEEDG1jRKvhv-zXy4CJ7b6l_ovUhty5UOKA_mm0FgCBNG5B-EfYfWCGxk6pq2Ghva3yAhok4n5A8w7balSCZ9b1bqR_Wgta9-WzQ5KzMByxlLuV-OjBPKABSdLFL3H0EjVjvibfvgo5Mu8mshd2t05zWjN6nXX7E' },
];

const sampleReviews = [
    { id: 'r1', name: 'John D.', time: '2w ago', rating: 5, text: 'Excellent quality steel beams. The customization was spot on.', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC931LCqTWAhfR6L52sffoHMtyw--iVP9Wwyl5SY7qMhK3j83jomzz-28jQx-qTVOsutdlsi4-8Y8608_Wp_udNj_bbJUaaxId_uHHqpMK9iAhbShv48AyBHpkE7farcO3FbwY_T2mDTpz-b35ZytMC7aj5Y6omWw4RGKXrRanyBSZqWWD6nTjPxyWNnb_U9QsO2cDcpFvXlMINWTL4SB5nI9gdiN95-6-dSo6iyEzh2LuSrytDi_k9JrLKSezvWN5PKnG02ne5ZNY' },
    { id: 'r2', name: 'Sarah M.', time: '1mo ago', rating: 4, text: 'Great product, slight delay in shipping but good communication.', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGCwe7FHOGGBWutdaKAvDKkbgwIPFgAcuQGJaxmzPaGTp_3Kk53K313PVQa7FDdULQtDUdNX55jTApiujAi63G9cFpzSnvJ8rXiAc464FTzstG3RR2r0eQf8k3sQEC-fLlRPeM97o1sSQq2dgjX4Xmhw33hgEa87BcdZgAx0EqQbFcSFx27YU8iUpYxRO-RBUQVU6uNLvnBZt_-DHAUeSKr-XiyBbUHyOkRA6pY3x3C4VpNUOPsAflwJzFmvWnbUeWCrdVm2s2Fmg' },
    { id: 'r3', name: 'Mike K.', time: '2mo ago', rating: 4, text: 'Good value for the price. Packaging could be better.', avatar: null },
    { id: 'r4', name: 'Construction Co.', time: '3mo ago', rating: 5, text: 'Bulk order of hex bolts arrived perfectly counted. Recommended.', avatar: null },
    { id: 'r5', name: 'TechFab Inc', time: '4mo ago', rating: 5, text: 'Consistent quality over 3 years of partnership.', avatar: null },
];

export const SupplierDetails: React.FC<SupplierDetailsProps> = ({ vendor, onBack }) => {
    const location = vendor.address || 'Location not specified';
    const rating = vendor.rating ?? 4.8;
    const reviewsCount = vendor.reviews ?? 120;
    const responseTime = vendor.deliveryTime || '< 2h';
    const onTimeRate = vendor.reliabilityScore ? `${vendor.reliabilityScore}%` : '98%';
    const ordersCount = '1.2k+';
    const description =
        vendor.description ||
        'Premium provider of industrial materials and equipment with expertise in bulk orders and reliable logistics.';
    const isVerified = vendor.status === 'Active' || vendor.contractStatus === 'Active';
    const heroImage =
        vendor.image ||
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBYa31Ysrv0UAeVgQrZvkMxmkn-VIG0NSL3kyxBTQIFWRf6CWE2Q5j1KI9kvvM-YNa4nzYKWOkOF6WNazvC1G2nzXeBjShszVpzdQQQfqtGyUHNQ4KBQibzP2-99N3r7R1E0rCDlaNMzfFG_vUHBoidbkjFB1kYRXSCJ1ThhpyYQII8nwEWCRl1QmcrGKacGK27QVeIrshiO0x1iZROaiv5BnAIdQPUv2GgWP-01L4FvHDV2Si62wcuOMKfh8J66uwaKINxsWD3YhA';
    const coverImage =
        vendor.coverImage ||
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDWfVRxXjT2DNZcbZDWu2mq-ZxeWtJcKQ0x9uEwUHvAMjbS0DbBaFfvu-wlPsdhB6Ph_O-jBUvGnDYoNMDe4CGPNhQ1-jP56lTS1jJgWgWbO49VFCLKXqFrKUfp0mmtSvJvEzcPnJtdBd8JyXEZYAQG9MiHniImFocSkzC4NQBdk-rMKVLnni2zVxhiu4g38Vq9IRKpo2VLvllAJZMbiDeOEbWvK5vuR3JRJoHE38F54kfRCByW29GMyV7oh7I9L2rlGdRqNneuH8c';

    const metrics = [
        { label: 'Rating', value: rating.toFixed(1), sub: `(${reviewsCount} Reviews)`, icon: Star, color: 'text-amber-500' },
        { label: 'Response', value: responseTime, sub: 'Fast', icon: Zap, color: 'text-blue-600' },
        { label: 'On-time', value: onTimeRate, sub: 'Last 12 mo', icon: CheckCircle, color: 'text-emerald-600' },
        { label: 'Orders', value: ordersCount, sub: 'Completed', icon: ShoppingCart, color: 'text-indigo-600' },
    ];

    return (
        <div className="flex flex-col h-full bg-slate-50 text-slate-900 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="w-full mx-auto max-w-[min(110rem,calc(100vw-2rem))] px-4 md:px-6 lg:px-8 py-6 space-y-4">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <button
                            onClick={onBack}
                            className="inline-flex items-center px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors shadow-sm"
                        >
                            <ArrowLeft size={16} className="mr-1.5" />
                            Back
                        </button>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-500">Marketplace</span>
                        <span className="text-slate-300">/</span>
                        <span className="font-semibold text-slate-900">{vendor.name}</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                        <div className="lg:col-span-8 bg-white rounded-lg border border-slate-200 p-0 shadow-sm flex overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-slate-50 to-transparent pointer-events-none z-0"></div>
                            <div className="flex flex-col sm:flex-row w-full z-10">
                                <div className="shrink-0 p-5 flex flex-col justify-center items-center border-b sm:border-b-0 sm:border-r border-slate-200 bg-slate-50/60 w-full sm:w-48">
                                    <div className="size-20 bg-white rounded-lg p-2 border border-slate-200 flex items-center justify-center mb-3 shadow-sm overflow-hidden">
                                        <img src={heroImage} alt={vendor.name} className="w-full h-full object-cover rounded-md" />
                                    </div>
                                    {isVerified && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-inset ring-blue-100">
                                            <ShieldCheck size={12} className="fill-blue-600 text-blue-600" />
                                            Verified
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 p-5 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h1 className="text-2xl font-bold text-slate-900 leading-none">{vendor.name}</h1>
                                                <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                                                    <MapPin size={14} className="text-blue-500" />
                                                    <span className="truncate">{location}</span>
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="size-9 flex items-center justify-center rounded bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all">
                                                    <Share2 size={16} />
                                                </button>
                                                <button className="size-9 flex items-center justify-center rounded bg-slate-100 text-slate-500 hover:text-rose-500 hover:bg-white border border-transparent hover:border-slate-200 transition-all">
                                                    <Heart size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 max-w-2xl">{description}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-200">
                                        <button className="flex-1 sm:flex-none flex items-center justify-center rounded bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors">
                                            <Mail size={16} className="mr-1.5" /> Contact Supplier
                                        </button>
                                        <button className="flex-1 sm:flex-none flex items-center justify-center rounded bg-white border border-slate-200 px-4 py-1.5 text-xs font-bold text-slate-900 hover:bg-slate-50 transition-colors">
                                            <ShoppingCart size={16} className="mr-1.5" /> View Catalog
                                        </button>
                                        <div className="hidden sm:flex items-center gap-3 ml-auto text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <CheckCircle size={14} className="text-emerald-500" /> ISO 9001
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <CheckCircle size={14} className="text-emerald-500" /> Custom Mfg
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-4 grid grid-cols-2 gap-3">
                            {metrics.map((metric) => {
                                const Icon = metric.icon;
                                return (
                                    <div
                                        key={metric.label}
                                        className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between hover:border-blue-100 transition-colors shadow-sm"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-slate-500">{metric.label}</span>
                                            <Icon size={18} className={metric.color} />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <span className="text-2xl font-black text-slate-900 leading-none">{metric.value}</span>
                                            {metric.sub && <span className="text-[10px] text-slate-500 mb-0.5">{metric.sub}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                        <div className="lg:col-span-8 flex flex-col gap-3">
                            <div className="bg-white rounded-lg border border-slate-200 p-2 pl-3 flex flex-wrap gap-2 items-center justify-between shadow-sm sticky top-3 z-10">
                                <div className="flex items-center gap-4 overflow-x-auto">
                                    <h3 className="text-sm font-bold text-slate-900 whitespace-nowrap">Catalog</h3>
                                    <div className="h-4 w-px bg-slate-200"></div>
                                    <div className="flex gap-1">
                                        <button className="px-2.5 py-1 text-xs font-medium rounded bg-slate-100 text-slate-900 hover:bg-slate-200 transition-colors whitespace-nowrap">
                                            All Products
                                        </button>
                                        <button className="px-2.5 py-1 text-xs font-medium rounded text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-colors whitespace-nowrap">
                                            Raw Materials
                                        </button>
                                        <button className="px-2.5 py-1 text-xs font-medium rounded text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-colors whitespace-nowrap">
                                            Machinery
                                        </button>
                                        <button className="px-2.5 py-1 text-xs font-medium rounded text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-colors whitespace-nowrap">
                                            Fasteners
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <input
                                            className="h-8 w-36 md:w-48 text-xs border border-slate-200 bg-slate-50 rounded pl-8 pr-8 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                                            placeholder="Filter products..."
                                            type="text"
                                        />
                                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <Filter size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    </div>
                                    <button className="size-8 flex items-center justify-center rounded bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
                                        <Search size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
                                {sampleProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className="group bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md hover:border-blue-100 transition-all flex flex-col"
                                    >
                                        <div className="aspect-[4/3] relative bg-slate-100 overflow-hidden">
                                            {product.badge && (
                                                <div
                                                    className={`absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide text-white ${product.badge === 'Sale' ? 'bg-rose-500' : 'bg-black/70'}`}
                                                >
                                                    {product.badge}
                                                </div>
                                            )}
                                            <div
                                                className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                                                style={{ backgroundImage: `url(${product.image})` }}
                                            ></div>
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                        </div>
                                        <div className="p-3 flex flex-col flex-1">
                                            <h4 className="text-sm font-bold text-slate-900 leading-tight mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                {product.title}
                                            </h4>
                                            <p className="text-[10px] text-slate-500 mb-2">{product.moq}</p>
                                            <div className="mt-auto flex items-end justify-between border-t border-dashed border-slate-200 pt-2">
                                                <div className="flex flex-col leading-none">
                                                    {product.original && (
                                                        <span className="text-[10px] text-rose-500 line-through">{product.original}</span>
                                                    )}
                                                    <span className="text-sm font-bold text-slate-900">
                                                        {product.price}
                                                        <span className="text-[10px] font-normal text-slate-500">{product.unit}</span>
                                                    </span>
                                                </div>
                                                <button className="size-7 flex items-center justify-center rounded bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
                                                    <PlusIcon />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full py-2 bg-white border border-slate-200 text-xs font-semibold rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-colors">
                                Load More Products
                            </button>
                        </div>

                        <div className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-4 self-start">
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-900">Contact</h3>
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-500" title="Online"></span>
                                </div>
                                <div className="h-36 w-full relative bg-slate-200">
                                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${coverImage})` }}></div>
                                    <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded text-[10px] font-bold backdrop-blur shadow-sm">
                                        {location}
                                    </div>
                                </div>
                                <div className="p-4 space-y-3 text-sm">
                                    <div className="flex gap-3 items-center">
                                        <Phone size={18} className="text-slate-400" />
                                        <span className="font-medium text-slate-900">{vendor.phone || '+1 (555) 123-4567'}</span>
                                    </div>
                                    <div className="flex gap-3 items-center">
                                        <Globe size={18} className="text-slate-400" />
                                        <a
                                            className="font-medium text-blue-600 hover:underline"
                                            href={vendor.website || '#'}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {vendor.website || 'acmeindustrial.com'}
                                        </a>
                                    </div>
                                    <div className="flex gap-3 items-center">
                                        <Mail size={18} className="text-slate-400" />
                                        <span className="font-medium text-slate-900">{vendor.email || 'contact@acmeindustrial.com'}</span>
                                    </div>
                                    <div className="flex gap-3 items-center">
                                        <MapPin size={18} className="text-slate-400" />
                                        <span className="font-medium text-slate-900">{location}</span>
                                    </div>
                                    <button className="w-full mt-2 rounded bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 transition-all">
                                        Request Custom Quote
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col max-h-[70vh] overflow-hidden">
                                <div className="shrink-0 p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-slate-900">Reviews</h3>
                                        <p className="text-[10px] text-slate-500">Recent feedback from buyers</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-black text-slate-900 leading-none">{rating.toFixed(1)}</div>
                                        <div className="flex text-amber-500 text-[10px] space-x-0.5">
                                            {Array.from({ length: 5 }).map((_, idx) => (
                                                <Star
                                                    key={idx}
                                                    size={12}
                                                    className={`${idx < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="shrink-0 p-2 flex gap-2 border-b border-slate-200 overflow-x-auto">
                                    <button className="px-2 py-1 rounded-full bg-black text-white text-[10px] font-bold whitespace-nowrap">All</button>
                                    <button className="px-2 py-1 rounded-full border border-slate-200 text-slate-500 text-[10px] font-medium whitespace-nowrap hover:bg-slate-50">
                                        With Photos
                                    </button>
                                    <button className="px-2 py-1 rounded-full border border-slate-200 text-slate-500 text-[10px] font-medium whitespace-nowrap hover:bg-slate-50">
                                        5 Stars
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {sampleReviews.map((review) => (
                                        <div
                                            key={review.id}
                                            className="p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="shrink-0 size-8 rounded-full bg-slate-200 bg-cover bg-center flex items-center justify-center text-xs font-bold text-blue-600"
                                                    style={review.avatar ? { backgroundImage: `url(${review.avatar})` } : undefined}
                                                >
                                                    {!review.avatar && review.name.slice(0, 2)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <h5 className="text-xs font-bold text-slate-900 truncate">{review.name}</h5>
                                                        <span className="text-[10px] text-slate-500">{review.time}</span>
                                                    </div>
                                                    <div className="flex text-amber-500 mb-1">
                                                        {Array.from({ length: 5 }).map((_, idx) => (
                                                            <Star
                                                                key={idx}
                                                                size={10}
                                                                className={`${idx < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <p className="text-[11px] text-slate-800 leading-snug">{review.text}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="shrink-0 p-3 text-center border-t border-slate-200 bg-slate-50">
                                    <button className="text-xs font-bold text-blue-600 hover:underline">View All {reviewsCount} Reviews</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PlusIcon: React.FC = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);
