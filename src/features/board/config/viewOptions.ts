import {
    LayoutDashboard,
    Table,
    Kanban,
    List,
    Calendar,
    FileText,
    GanttChart,
    Image as ImageIcon,
    FileEdit,
    Package,
    Truck,
    Users,
    Target,
    Settings2,
    UserCheck,
    RotateCw,
} from 'lucide-react';

export interface ViewOption {
    label: string;
    icon: any; // Using any for lucide-react component type to avoid strict type issues
    id: string;
    description: string;
}

export const VIEW_OPTIONS: ViewOption[] = [
    { label: 'Overview', icon: LayoutDashboard, id: 'overview', description: 'Everything in one place' },
    { label: 'Table', icon: Table, id: 'table', description: 'Manage project workflows' },
    { label: 'Data Table', icon: Table, id: 'datatable', description: 'Standard table view' },
    { label: 'Kanban', icon: Kanban, id: 'kanban', description: 'Visualize your work' },
    { label: 'List', icon: List, id: 'list', description: 'Simple list view' },
    { label: 'Calendar', icon: Calendar, id: 'calendar', description: 'Schedule tasks' },
    { label: 'Doc', icon: FileText, id: 'doc', description: 'Collaborate on docs' },
    { label: 'Gantt', icon: GanttChart, id: 'gantt', description: 'Visual timeline' },
    { label: 'File gallery', icon: ImageIcon, id: 'file_gallery', description: 'View all files' },
    { label: 'Form', icon: FileEdit, id: 'form', description: 'Collect data' },
    { label: 'Pivot Table', icon: Table, id: 'pivot_table', description: 'Analyze Data' },
    { label: 'Custom Dashboard', icon: LayoutDashboard, id: 'custom_dashboard', description: 'Build your own view' },
    { label: 'Workload View', icon: UserCheck, id: 'workload', description: 'Balance team load' },
    { label: 'Smart Sheet', icon: Table, id: 'spreadsheet', description: 'Spreadsheet workspace' },
    { label: 'Automation Rules', icon: Settings2, id: 'automation_rules', description: 'Light trigger → action' },
    { label: 'Goals & OKRs', icon: Target, id: 'goals_okrs', description: 'Objective tracking' },
    { label: 'Recurring Logic', icon: RotateCw, id: 'recurring', description: 'Repeatable work patterns' },
    { label: 'Capacity Map', icon: LayoutDashboard, id: 'warehouse_capacity_map', description: 'Visual warehouse capacity map' },
    // Supply Chain (New)
    { label: 'Warehouse', icon: Package, id: 'sc_warehouse', description: 'Inventory & Stock' },
    { label: 'Shipping', icon: Truck, id: 'sc_shipping', description: 'Logistics & Delivery' },
    { label: 'Fleet', icon: Truck, id: 'sc_fleet', description: 'Vehicle Management' },
    { label: 'Vendors', icon: Users, id: 'sc_vendors', description: 'Supplier Relations' },
    { label: 'Planning', icon: Target, id: 'sc_planning', description: 'Demand Forecasting' },
    // Requests (R01-R07)
    { label: 'Requests Control', icon: LayoutDashboard, id: 'req_control', description: 'Daily requests snapshot' },
    { label: 'Backlog & Aging', icon: LayoutDashboard, id: 'req_backlog', description: 'Workload & delays' },
    { label: 'SKU Demand', icon: LayoutDashboard, id: 'req_sku_demand', description: 'Critical items demand' },
    { label: 'Vendor Pipeline', icon: LayoutDashboard, id: 'req_rfq_pipeline', description: 'RFQs & Quotes' },
    { label: 'Approvals & SLA', icon: LayoutDashboard, id: 'req_approvals', description: 'Approval efficiency' },
    { label: 'Spend & Budget', icon: LayoutDashboard, id: 'req_spend', description: 'Budget exposure' },
    { label: 'Risks (Req)', icon: LayoutDashboard, id: 'req_risks', description: 'Exceptions & alerts' },
    // Orders (O01-O05)
    { label: 'Orders Control', icon: LayoutDashboard, id: 'ord_control', description: 'Daily orders snapshot' },
    { label: 'Fulfillment', icon: LayoutDashboard, id: 'ord_fulfillment', description: 'Delivery & OTIF' },
    { label: 'Order Finance', icon: LayoutDashboard, id: 'ord_finance', description: 'Invoicing & Margins' },
    { label: 'Cust & Vendor', icon: LayoutDashboard, id: 'ord_performance', description: 'Service levels' },
    { label: 'Risks (Ord)', icon: LayoutDashboard, id: 'ord_risks', description: 'Order blocks & delays' },
];
