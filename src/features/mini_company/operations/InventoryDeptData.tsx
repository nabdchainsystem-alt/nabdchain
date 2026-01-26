import React from 'react';
import { DeptDataView, TableSchema } from '../components/DeptDataView';

// Inventory Items Table Schema
const INVENTORY_ITEMS_TABLE: TableSchema = {
    id: 'inventory_items',
    name: 'Items',
    nameAr: 'الأصناف',
    description: 'Inventory master data. All products and stock items.',
    descriptionAr: 'البيانات الرئيسية للمخزون. جميع المنتجات والأصناف.',
    columns: [
        {
            id: 'item_id',
            label: 'Item ID',
            labelAr: 'رقم الصنف',
            type: 'text',
            required: true,
            description: 'Unique item identifier',
            alternatives: ['Item Number', 'SKU', 'Stock Code', 'Part Number', 'Product Number', 'Article Number', 'Barcode'],
            width: 120
        },
        {
            id: 'item_name',
            label: 'Name',
            labelAr: 'الاسم',
            type: 'text',
            required: true,
            description: 'Item name/description',
            alternatives: ['Name', 'Description', 'Item Name', 'Product Name', 'Title'],
            width: 200
        },
        {
            id: 'category',
            label: 'Category',
            labelAr: 'الفئة',
            type: 'text',
            required: true,
            description: 'Item category',
            alternatives: ['Category', 'Product Category', 'Type', 'Classification', 'Group', 'Family'],
            width: 130
        },
        {
            id: 'unit',
            label: 'Unit',
            labelAr: 'الوحدة',
            type: 'text',
            required: true,
            description: 'Unit of measure',
            alternatives: ['Unit', 'UOM', 'Measure', 'Unit of Quantity'],
            width: 80
        },
        {
            id: 'cost_price',
            label: 'Cost Price',
            labelAr: 'سعر التكلفة',
            type: 'decimal',
            required: true,
            description: 'Cost per unit',
            alternatives: ['Cost', 'Unit Cost', 'Purchase Price', 'Standard Cost', 'Landed Cost'],
            width: 110
        },
        {
            id: 'selling_price',
            label: 'Selling Price',
            labelAr: 'سعر البيع',
            type: 'decimal',
            required: false,
            description: 'Selling price per unit',
            alternatives: ['Price', 'Sell Price', 'List Price', 'Retail Price'],
            width: 110
        },
        {
            id: 'quantity_on_hand',
            label: 'QOH',
            labelAr: 'الكمية المتاحة',
            type: 'number',
            required: true,
            description: 'Current stock quantity',
            alternatives: ['Quantity', 'QOH', 'Stock', 'On Hand', 'Available', 'Current Stock'],
            width: 80
        },
        {
            id: 'reorder_point',
            label: 'Reorder Point',
            labelAr: 'نقطة إعادة الطلب',
            type: 'number',
            required: true,
            description: 'Minimum stock level',
            alternatives: ['Reorder Point', 'ROP', 'Min Level', 'Safety Stock', 'Alert Point'],
            width: 120
        },
        {
            id: 'reorder_quantity',
            label: 'Reorder Qty',
            labelAr: 'كمية إعادة الطلب',
            type: 'number',
            required: true,
            description: 'Order quantity when restocking',
            alternatives: ['Reorder Qty', 'Order Quantity', 'EOQ', 'Lot Size'],
            width: 110
        },
        {
            id: 'lead_time_days',
            label: 'Lead Time (Days)',
            labelAr: 'وقت التوريد (أيام)',
            type: 'number',
            required: true,
            description: 'Supplier lead time in days',
            alternatives: ['Lead Time', 'Delivery Days', 'Replenishment Time'],
            width: 130
        },
        {
            id: 'warehouse_id',
            label: 'Warehouse',
            labelAr: 'المستودع',
            type: 'text',
            required: true,
            description: 'Primary warehouse',
            alternatives: ['Warehouse', 'Location', 'Store', 'Site', 'Facility'],
            width: 120
        },
        {
            id: 'status',
            label: 'Status',
            labelAr: 'الحالة',
            type: 'enum',
            required: true,
            description: 'Item status',
            alternatives: ['Status', 'State', 'Availability'],
            enumValues: [
                { value: 'active', label: 'Active', labelAr: 'نشط' },
                { value: 'inactive', label: 'Inactive', labelAr: 'غير نشط' },
                { value: 'discontinued', label: 'Discontinued', labelAr: 'متوقف' },
                { value: 'pending', label: 'Pending', labelAr: 'قيد الانتظار' }
            ],
            width: 100
        },
        {
            id: 'supplier_id',
            label: 'Supplier',
            labelAr: 'المورد',
            type: 'text',
            required: false,
            description: 'Primary supplier',
            alternatives: ['Supplier', 'Vendor', 'Source'],
            width: 120
        }
    ]
};

// Inventory Movements Table Schema
const INVENTORY_MOVEMENTS_TABLE: TableSchema = {
    id: 'inventory_movements',
    name: 'Movements',
    nameAr: 'الحركات',
    description: 'Stock movements and transactions. Each row is one movement.',
    descriptionAr: 'حركات ومعاملات المخزون. كل صف يمثل حركة واحدة.',
    columns: [
        {
            id: 'movement_id',
            label: 'Movement ID',
            labelAr: 'رقم الحركة',
            type: 'text',
            required: true,
            description: 'Unique movement identifier',
            alternatives: ['Movement Number', 'Transaction ID', 'Stock Transaction'],
            width: 130
        },
        {
            id: 'item_id',
            label: 'Item ID',
            labelAr: 'رقم الصنف',
            type: 'text',
            required: true,
            description: 'Item reference',
            alternatives: ['Item Number', 'SKU', 'Product Number'],
            width: 120
        },
        {
            id: 'movement_date',
            label: 'Date',
            labelAr: 'التاريخ',
            type: 'date',
            required: true,
            description: 'Transaction date',
            alternatives: ['Date', 'Transaction Date', 'Movement Date', 'Posting Date'],
            width: 120
        },
        {
            id: 'movement_type',
            label: 'Type',
            labelAr: 'النوع',
            type: 'enum',
            required: true,
            description: 'Type of movement',
            alternatives: ['Type', 'Transaction Type', 'Movement Type'],
            enumValues: [
                { value: 'receipt', label: 'Receipt', labelAr: 'استلام' },
                { value: 'issue', label: 'Issue', labelAr: 'صرف' },
                { value: 'transfer', label: 'Transfer', labelAr: 'تحويل' },
                { value: 'adjustment', label: 'Adjustment', labelAr: 'تعديل' },
                { value: 'return', label: 'Return', labelAr: 'إرجاع' }
            ],
            width: 100
        },
        {
            id: 'quantity',
            label: 'Quantity',
            labelAr: 'الكمية',
            type: 'number',
            required: true,
            description: 'Quantity moved',
            alternatives: ['Quantity', 'Count', 'Units'],
            width: 90
        },
        {
            id: 'direction',
            label: 'Direction',
            labelAr: 'الاتجاه',
            type: 'enum',
            required: true,
            description: 'In or out',
            alternatives: ['Direction', 'Flow', 'Type'],
            enumValues: [
                { value: 'in', label: 'In', labelAr: 'داخل' },
                { value: 'out', label: 'Out', labelAr: 'خارج' }
            ],
            width: 80
        },
        {
            id: 'reference',
            label: 'Reference',
            labelAr: 'المرجع',
            type: 'text',
            required: false,
            description: 'Reference document',
            alternatives: ['Reference', 'Document', 'Order Number', 'PO Number', 'SO Number'],
            width: 130
        },
        {
            id: 'warehouse_from',
            label: 'From Warehouse',
            labelAr: 'من المستودع',
            type: 'text',
            required: false,
            description: 'Source warehouse',
            alternatives: ['From', 'Source', 'Origin'],
            width: 120
        },
        {
            id: 'warehouse_to',
            label: 'To Warehouse',
            labelAr: 'إلى المستودع',
            type: 'text',
            required: false,
            description: 'Destination warehouse',
            alternatives: ['To', 'Destination', 'Target'],
            width: 120
        },
        {
            id: 'cost',
            label: 'Cost',
            labelAr: 'التكلفة',
            type: 'decimal',
            required: false,
            description: 'Transaction cost',
            alternatives: ['Cost', 'Value', 'Amount'],
            width: 100
        },
        {
            id: 'reason',
            label: 'Reason',
            labelAr: 'السبب',
            type: 'text',
            required: false,
            description: 'Movement reason',
            alternatives: ['Reason', 'Purpose', 'Notes'],
            width: 150
        }
    ]
};

// Warehouses Table Schema
const WAREHOUSES_TABLE: TableSchema = {
    id: 'warehouses',
    name: 'Warehouses',
    nameAr: 'المستودعات',
    description: 'Warehouse/location master data.',
    descriptionAr: 'البيانات الرئيسية للمستودعات.',
    columns: [
        {
            id: 'warehouse_id',
            label: 'Warehouse ID',
            labelAr: 'رقم المستودع',
            type: 'text',
            required: true,
            description: 'Unique warehouse identifier',
            alternatives: ['Warehouse Number', 'Location ID', 'Site ID'],
            width: 130
        },
        {
            id: 'warehouse_name',
            label: 'Name',
            labelAr: 'الاسم',
            type: 'text',
            required: true,
            description: 'Warehouse name',
            alternatives: ['Name', 'Location Name', 'Site Name'],
            width: 180
        },
        {
            id: 'warehouse_type',
            label: 'Type',
            labelAr: 'النوع',
            type: 'enum',
            required: true,
            description: 'Warehouse type',
            alternatives: ['Type', 'Category'],
            enumValues: [
                { value: 'main', label: 'Main', labelAr: 'رئيسي' },
                { value: 'distribution', label: 'Distribution', labelAr: 'توزيع' },
                { value: 'retail', label: 'Retail', labelAr: 'تجزئة' },
                { value: 'cold_storage', label: 'Cold Storage', labelAr: 'تخزين بارد' }
            ],
            width: 120
        },
        {
            id: 'address',
            label: 'Address',
            labelAr: 'العنوان',
            type: 'text',
            required: false,
            description: 'Physical address',
            alternatives: ['Address', 'Location'],
            width: 200
        },
        {
            id: 'city',
            label: 'City',
            labelAr: 'المدينة',
            type: 'text',
            required: false,
            description: 'City',
            alternatives: ['City', 'Town'],
            width: 120
        },
        {
            id: 'country',
            label: 'Country',
            labelAr: 'الدولة',
            type: 'text',
            required: false,
            description: 'Country',
            alternatives: ['Country', 'Region'],
            width: 120
        },
        {
            id: 'capacity_units',
            label: 'Capacity',
            labelAr: 'السعة',
            type: 'number',
            required: false,
            description: 'Storage capacity in units',
            alternatives: ['Capacity', 'Max Units'],
            width: 100
        },
        {
            id: 'current_utilization',
            label: 'Utilization %',
            labelAr: 'نسبة الاستخدام',
            type: 'decimal',
            required: false,
            description: 'Current utilization percentage',
            alternatives: ['Utilization', 'Usage'],
            width: 110
        },
        {
            id: 'manager',
            label: 'Manager',
            labelAr: 'المدير',
            type: 'text',
            required: false,
            description: 'Warehouse manager',
            alternatives: ['Manager', 'Supervisor'],
            width: 130
        },
        {
            id: 'status',
            label: 'Status',
            labelAr: 'الحالة',
            type: 'enum',
            required: true,
            description: 'Operational status',
            alternatives: ['Status', 'State'],
            enumValues: [
                { value: 'active', label: 'Active', labelAr: 'نشط' },
                { value: 'inactive', label: 'Inactive', labelAr: 'غير نشط' },
                { value: 'maintenance', label: 'Maintenance', labelAr: 'صيانة' }
            ],
            width: 100
        }
    ]
};

// Stock Counts Table Schema
const STOCK_COUNTS_TABLE: TableSchema = {
    id: 'stock_counts',
    name: 'Stock Counts',
    nameAr: 'جرد المخزون',
    description: 'Physical inventory counts and variance tracking.',
    descriptionAr: 'جرد المخزون الفعلي وتتبع الفروقات.',
    columns: [
        {
            id: 'count_id',
            label: 'Count ID',
            labelAr: 'رقم الجرد',
            type: 'text',
            required: true,
            description: 'Unique count identifier',
            alternatives: ['Count Number', 'Audit Number', 'Cycle Count Number'],
            width: 120
        },
        {
            id: 'count_date',
            label: 'Date',
            labelAr: 'التاريخ',
            type: 'date',
            required: true,
            description: 'Count date',
            alternatives: ['Date', 'Count Date', 'Audit Date'],
            width: 120
        },
        {
            id: 'warehouse_id',
            label: 'Warehouse',
            labelAr: 'المستودع',
            type: 'text',
            required: true,
            description: 'Warehouse counted',
            alternatives: ['Warehouse', 'Location'],
            width: 120
        },
        {
            id: 'item_id',
            label: 'Item ID',
            labelAr: 'رقم الصنف',
            type: 'text',
            required: true,
            description: 'Item counted',
            alternatives: ['Item Number', 'SKU'],
            width: 120
        },
        {
            id: 'system_quantity',
            label: 'System Qty',
            labelAr: 'كمية النظام',
            type: 'number',
            required: true,
            description: 'System quantity',
            alternatives: ['System', 'Expected', 'Book Qty'],
            width: 100
        },
        {
            id: 'physical_quantity',
            label: 'Physical Qty',
            labelAr: 'الكمية الفعلية',
            type: 'number',
            required: true,
            description: 'Physical count',
            alternatives: ['Physical', 'Actual', 'Counted'],
            width: 100
        },
        {
            id: 'variance',
            label: 'Variance',
            labelAr: 'الفرق',
            type: 'number',
            required: true,
            description: 'Quantity difference',
            alternatives: ['Variance', 'Difference', 'Discrepancy'],
            width: 90
        },
        {
            id: 'variance_value',
            label: 'Variance Value',
            labelAr: 'قيمة الفرق',
            type: 'decimal',
            required: true,
            description: 'Value difference',
            alternatives: ['Variance Value', 'Amount'],
            width: 120
        },
        {
            id: 'reason',
            label: 'Reason',
            labelAr: 'السبب',
            type: 'text',
            required: false,
            description: 'Variance reason',
            alternatives: ['Reason', 'Explanation'],
            width: 150
        },
        {
            id: 'counted_by',
            label: 'Counted By',
            labelAr: 'العداد',
            type: 'text',
            required: false,
            description: 'Who counted',
            alternatives: ['Counter', 'Auditor'],
            width: 120
        },
        {
            id: 'adjustment_made',
            label: 'Adjusted',
            labelAr: 'تم التعديل',
            type: 'boolean',
            required: false,
            description: 'Was adjustment posted',
            alternatives: ['Adjusted', 'Posted'],
            width: 80
        }
    ]
};

// All Inventory Tables
const INVENTORY_TABLES: TableSchema[] = [
    INVENTORY_ITEMS_TABLE,
    INVENTORY_MOVEMENTS_TABLE,
    WAREHOUSES_TABLE,
    STOCK_COUNTS_TABLE
];

// Main Component
export const InventoryDeptData: React.FC = () => {
    return (
        <DeptDataView
            departmentId="inventory"
            departmentName="Inventory"
            departmentNameAr="المخزون"
            tables={INVENTORY_TABLES}
        />
    );
};

export default InventoryDeptData;
