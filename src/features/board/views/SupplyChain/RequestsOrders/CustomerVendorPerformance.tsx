import React from "react";
import { StatCard } from "../../../components/dashboard/StatCard";
import { DashboardChart } from "../../../components/dashboard/DashboardChart";
import { DashboardTable } from "../../../components/dashboard/DashboardTable";
import { Users, Truck, RotateCcw, MessageCircle, AlertTriangle, ShieldCheck, Clock, UserCheck } from 'lucide-react';

export const CustomerVendorPerformance: React.FC = () => {
    // O04: Customer & Vendor Performance
    const kpis = [
        { title: "Top Customer Val", value: "$850k", trend: "Acme Corp", trendDirection: "neutral", icon: <UserCheck size={20} />, color: "blue" },
        { title: "Top Vendor Vol", value: "2,500 units", trend: "Global Supply", trendDirection: "neutral", icon: <Users size={20} />, color: "purple" },
        { title: "On-Time Delivery", value: "92%", trend: "Vendors", trendDirection: "up", icon: <Truck size={20} />, color: "green" },
        { title: "Return Rate", value: "3.5%", trend: "Above Target 2%", trendDirection: "down", icon: <RotateCcw size={20} />, color: "red" },
        { title: "Complaints Today", value: "4", trend: "New", trendDirection: "down", icon: <MessageCircle size={20} />, color: "orange" },
        { title: "Vendor Delay Rate", value: "8%", trend: "Improving", trendDirection: "up", icon: <Clock size={20} />, color: "yellow" },
        { title: "Cust. Blocked Ord", value: "12", trend: "Credit Limit", trendDirection: "down", icon: <ShieldCheck size={20} />, color: "red" },
        { title: "Avg Response", value: "4 Hrs", trend: "Support", trendDirection: "up", icon: <Clock size={20} />, color: "blue" },
    ];

    const vendorOtif = {
        title: { text: '' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: ['Vendor A', 'Vendor B', 'Vendor C', 'Vendor D', 'Vendor E'] },
        yAxis: { type: 'value', max: 100 },
        series: [{ name: 'OTIF %', data: [98, 85, 92, 78, 95], type: 'bar', itemStyle: { color: '#3b82f6' } }]
    };

    const returnsByReason = {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0 },
        series: [
            {
                name: 'Return Reason',
                type: 'pie',
                radius: ['40%', '70%'],
                data: [
                    { value: 45, name: 'Defective' },
                    { value: 25, name: 'Late Delivery' },
                    { value: 20, name: 'Wrong Item' },
                    { value: 10, name: 'Better Price' }
                ]
            }
        ]
    };

    const tableColumns = [
        { header: "Order ID", accessor: "order_id" },
        { header: "Customer", accessor: "customer" },
        { header: "Vendor", accessor: "vendor" },
        { header: "Delivery Status", accessor: "delivery_status" },
        { header: "Return Status", accessor: "return_status" },
        {
            header: "OTIF", accessor: "otif_flag", render: (val: string) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${val === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{val}</span>
            )
        }
    ];

    const tableData = [
        { order_id: "ORD-8001", customer: "Acme Corp", vendor: "TechSols", delivery_status: "Delivered", return_status: "None", otif_flag: "Yes" },
        { order_id: "ORD-8005", customer: "Global Inc", vendor: "Office Depot", delivery_status: "Delivered", return_status: "Returned", otif_flag: "Yes" },
        { order_id: "ORD-8012", customer: "Small Biz", vendor: "TechSols", delivery_status: "Late", return_status: "None", otif_flag: "No" },
        { order_id: "ORD-8020", customer: "Gov Body", vendor: "SafeGear", delivery_status: "Shipped", return_status: "-", otif_flag: "Yes" },
        { order_id: "ORD-8025", customer: "Acme Corp", vendor: "BuildMat", delivery_status: "Late", return_status: "None", otif_flag: "No" },
    ];

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-monday-dark-bg p-6 overflow-y-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Customer & Vendor Performance</h1>
            <p className="text-gray-500 text-sm mb-6">Service levels, reliability, and quality metrics.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {kpis.map((kpi, idx) => <StatCard key={idx} {...kpi} trendDirection={kpi.trendDirection as any} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-96">
                <div className="lg:col-span-2 h-full"><DashboardChart title="Vendor OTIF Performance" options={vendorOtif} height="100%" /></div>
                <div className="h-full"><DashboardChart title="Returns by Reason" options={returnsByReason} height="100%" /></div>
            </div>

            <div className="flex-1 min-h-[300px] mb-20">
                <DashboardTable title="Performance Log" columns={tableColumns} data={tableData} />
            </div>
        </div>
    );
};

export default CustomerVendorPerformance;
