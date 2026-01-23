import React from 'react';
import { useMarketplaceData } from './integration';
import { Vendor } from './types';

import { AutoReplenishmentPanel } from './AutoReplenishmentPanel';

export const VendorDashboard: React.FC = () => {
    const { vendors, purchaseOrders } = useMarketplaceData();

    // --- Metrics ---
    const totalVendors = vendors.length;
    const activeVendors = vendors.filter(v => v.contractStatus === 'Active').length;
    const totalSpend = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
    const avgReliability = Math.round(vendors.reduce((sum, v) => sum + (v.reliabilityScore || 0), 0) / (totalVendors || 1));

    // --- Top Vendors ---
    const topVendors = [...vendors].sort((a, b) => (b.reliabilityScore || 0) - (a.reliabilityScore || 0)).slice(0, 5);

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Vendor Intelligence</h1>
                <div className="text-sm text-gray-500">Last updated: <span className="font-datetime">{new Date().toLocaleDateString()}</span></div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard title="Total Vendors" value={totalVendors} icon="🏪" />
                <MetricCard title="Active Contracts" value={activeVendors} icon="📜" color="text-green-600" />
                <MetricCard title="Total Spend" value={`$${totalSpend.toLocaleString()}`} icon="💰" />
                <MetricCard title="Avg Reliability" value={`${avgReliability}%`} icon="🛡️" color={avgReliability > 90 ? 'text-green-600' : 'text-yellow-600'} />
            </div>

            {/* Auto Replenishment Section */}
            <div className="mb-6">
                <AutoReplenishmentPanel />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Performance Chart Placeholder */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h2 className="text-lg font-semibold mb-4">Delivery Performance</h2>
                    <div className="h-64 flex items-end justify-between space-x-2 px-4">
                        {topVendors.map((v, i) => (
                            <div key={v.id} className="flex flex-col items-center flex-1 group">
                                <div
                                    className="w-full bg-blue-500 rounded-t-md transition-all duration-300 group-hover:bg-blue-600 relative"
                                    style={{ height: `${v.reliabilityScore}%` }}
                                >
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {v.reliabilityScore}%
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 mt-2 truncate w-full text-center">{v.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Risk Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4">Risk Assessment</h2>
                    <div className="space-y-4">
                        <RiskRow label="Low Risk (90+)" count={vendors.filter(v => (v.reliabilityScore || 0) >= 90).length} total={totalVendors} color="bg-green-500" />
                        <RiskRow label="Medium Risk (70-89)" count={vendors.filter(v => (v.reliabilityScore || 0) >= 70 && (v.reliabilityScore || 0) < 90).length} total={totalVendors} color="bg-yellow-500" />
                        <RiskRow label="High Risk (<70)" count={vendors.filter(v => (v.reliabilityScore || 0) < 70).length} total={totalVendors} color="bg-red-500" />
                    </div>
                </div>
            </div>

            {/* Top Vendors Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold">Top Performing Vendors</h2>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-sm">
                        <tr>
                            <th className="p-4 font-medium">Vendor</th>
                            <th className="p-4 font-medium">Category</th>
                            <th className="p-4 font-medium">Reliability</th>
                            <th className="p-4 font-medium">Rating</th>
                            <th className="p-4 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {topVendors.map(vendor => (
                            <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-medium text-gray-900">{vendor.name}</td>
                                <td className="p-4 text-gray-500">{vendor.category}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${(vendor.reliabilityScore || 0) >= 90 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {vendor.reliabilityScore}%
                                    </span>
                                </td>
                                <td className="p-4 text-yellow-500">{'★'.repeat(Math.round(vendor.rating))}</td>
                                <td className="p-4">
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        {vendor.contractStatus}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, icon, color = 'text-gray-900' }: { title: string, value: string | number, icon: string, color?: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
        <div className="text-3xl">{icon}</div>
        <div>
            <div className="text-sm text-gray-500">{title}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
        </div>
    </div>
);

const RiskRow = ({ label, count, total, color }: { label: string, count: number, total: number, color: string }) => (
    <div>
        <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{label}</span>
            <span className="font-medium">{count}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
            <div className={`h-2 rounded-full ${color}`} style={{ width: `${(count / total) * 100}%` }}></div>
        </div>
    </div>
);
