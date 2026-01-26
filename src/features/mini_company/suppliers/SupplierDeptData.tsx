import React from 'react';
import { DeptDataView, TableSchema } from '../components/DeptDataView';

// Suppliers Table Schema
const SUPPLIERS_TABLE: TableSchema = {
    id: 'suppliers',
    name: 'Suppliers',
    nameAr: 'الموردون',
    description: 'Supplier master data. Core supplier information and categorization.',
    descriptionAr: 'البيانات الرئيسية للموردين. معلومات الموردين الأساسية والتصنيف.',
    columns: [
        {
            id: 'supplier_id',
            label: 'Supplier ID',
            labelAr: 'رقم المورد',
            type: 'text',
            required: true,
            description: 'Unique supplier identifier',
            alternatives: ['Supplier Number', 'Vendor ID', 'Vendor Number', 'Supplier Code'],
            width: 120
        },
        {
            id: 'supplier_name',
            label: 'Name',
            labelAr: 'الاسم',
            type: 'text',
            required: true,
            description: 'Supplier company name',
            alternatives: ['Name', 'Vendor Name', 'Company Name', 'Business Name'],
            width: 200
        },
        {
            id: 'contact_name',
            label: 'Contact',
            labelAr: 'جهة الاتصال',
            type: 'text',
            required: false,
            description: 'Primary contact person',
            alternatives: ['Contact', 'Contact Person', 'Representative', 'Account Manager'],
            width: 150
        },
        {
            id: 'email',
            label: 'Email',
            labelAr: 'البريد الإلكتروني',
            type: 'text',
            required: true,
            description: 'Primary email',
            alternatives: ['Email', 'E-mail', 'Contact Email'],
            width: 180
        },
        {
            id: 'phone',
            label: 'Phone',
            labelAr: 'الهاتف',
            type: 'text',
            required: false,
            description: 'Phone number',
            alternatives: ['Phone', 'Telephone', 'Contact Number'],
            width: 130
        },
        {
            id: 'category',
            label: 'Category',
            labelAr: 'الفئة',
            type: 'text',
            required: true,
            description: 'Supplier category',
            alternatives: ['Category', 'Type', 'Classification', 'Supplier Type', 'Commodity'],
            width: 130
        },
        {
            id: 'status',
            label: 'Status',
            labelAr: 'الحالة',
            type: 'enum',
            required: true,
            description: 'Supplier status',
            alternatives: ['Status', 'State', 'Standing'],
            enumValues: [
                { value: 'active', label: 'Active', labelAr: 'نشط' },
                { value: 'inactive', label: 'Inactive', labelAr: 'غير نشط' },
                { value: 'pending', label: 'Pending', labelAr: 'قيد الانتظار' },
                { value: 'blocked', label: 'Blocked', labelAr: 'محظور' }
            ],
            width: 100
        },
        {
            id: 'tier',
            label: 'Tier',
            labelAr: 'المستوى',
            type: 'enum',
            required: true,
            description: 'Partnership level',
            alternatives: ['Tier', 'Level', 'Partner Level', 'Strategic Level', 'Rank'],
            enumValues: [
                { value: 'strategic', label: 'Strategic', labelAr: 'استراتيجي' },
                { value: 'preferred', label: 'Preferred', labelAr: 'مفضل' },
                { value: 'approved', label: 'Approved', labelAr: 'معتمد' },
                { value: 'trial', label: 'Trial', labelAr: 'تجريبي' }
            ],
            width: 100
        },
        {
            id: 'country',
            label: 'Country',
            labelAr: 'الدولة',
            type: 'text',
            required: false,
            description: 'Supplier country',
            alternatives: ['Country', 'Location', 'Region', 'Origin'],
            width: 120
        },
        {
            id: 'payment_terms',
            label: 'Payment Terms',
            labelAr: 'شروط الدفع',
            type: 'text',
            required: false,
            description: 'Payment terms',
            alternatives: ['Payment Terms', 'Terms', 'Credit Terms', 'Net Days'],
            width: 120
        },
        {
            id: 'onboarding_date',
            label: 'Onboarding Date',
            labelAr: 'تاريخ التسجيل',
            type: 'date',
            required: true,
            description: 'Date added as supplier',
            alternatives: ['Start Date', 'Registration Date', 'Qualification Date'],
            width: 130
        }
    ]
};

// Supplier Orders Table Schema
const SUPPLIER_ORDERS_TABLE: TableSchema = {
    id: 'supplier_orders',
    name: 'Orders',
    nameAr: 'الطلبات',
    description: 'Purchase orders to suppliers. Links to Suppliers via supplier_id.',
    descriptionAr: 'أوامر الشراء للموردين. مرتبطة بالموردين عبر رقم المورد.',
    columns: [
        {
            id: 'order_id',
            label: 'Order ID',
            labelAr: 'رقم الطلب',
            type: 'text',
            required: true,
            description: 'Unique order identifier',
            alternatives: ['Order Number', 'PO Number', 'Purchase Order', 'Requisition Number'],
            width: 120
        },
        {
            id: 'supplier_id',
            label: 'Supplier ID',
            labelAr: 'رقم المورد',
            type: 'text',
            required: true,
            description: 'Reference to supplier',
            alternatives: ['Supplier Number', 'Vendor ID'],
            width: 120
        },
        {
            id: 'order_date',
            label: 'Order Date',
            labelAr: 'تاريخ الطلب',
            type: 'date',
            required: true,
            description: 'Order placement date',
            alternatives: ['Order Date', 'PO Date', 'Purchase Date', 'Issue Date'],
            width: 120
        },
        {
            id: 'expected_delivery',
            label: 'Expected Delivery',
            labelAr: 'التسليم المتوقع',
            type: 'date',
            required: true,
            description: 'Expected delivery date',
            alternatives: ['Expected Date', 'Due Date', 'Promised Date', 'Target Date', 'ETA'],
            width: 140
        },
        {
            id: 'actual_delivery',
            label: 'Actual Delivery',
            labelAr: 'التسليم الفعلي',
            type: 'date',
            required: false,
            description: 'Actual delivery date',
            alternatives: ['Delivery Date', 'Receipt Date', 'Actual Date', 'Arrival Date'],
            width: 130
        },
        {
            id: 'order_value',
            label: 'Order Value',
            labelAr: 'قيمة الطلب',
            type: 'decimal',
            required: true,
            description: 'Total order value',
            alternatives: ['Value', 'Amount', 'Order Amount', 'PO Value', 'Total'],
            width: 120
        },
        {
            id: 'currency',
            label: 'Currency',
            labelAr: 'العملة',
            type: 'text',
            required: false,
            description: 'Currency code',
            alternatives: ['Currency', 'Currency Code'],
            width: 80
        },
        {
            id: 'status',
            label: 'Status',
            labelAr: 'الحالة',
            type: 'enum',
            required: true,
            description: 'Order status',
            alternatives: ['Status', 'State', 'Order Status'],
            enumValues: [
                { value: 'pending', label: 'Pending', labelAr: 'قيد الانتظار' },
                { value: 'confirmed', label: 'Confirmed', labelAr: 'مؤكد' },
                { value: 'shipped', label: 'Shipped', labelAr: 'تم الشحن' },
                { value: 'delivered', label: 'Delivered', labelAr: 'تم التسليم' },
                { value: 'cancelled', label: 'Cancelled', labelAr: 'ملغى' }
            ],
            width: 100
        },
        {
            id: 'category',
            label: 'Category',
            labelAr: 'الفئة',
            type: 'text',
            required: false,
            description: 'Order category',
            alternatives: ['Category', 'Type', 'Procurement Category'],
            width: 120
        }
    ]
};

// Supplier Metrics Table Schema
const SUPPLIER_METRICS_TABLE: TableSchema = {
    id: 'supplier_metrics',
    name: 'Metrics',
    nameAr: 'المقاييس',
    description: 'Supplier performance metrics. One row per supplier.',
    descriptionAr: 'مقاييس أداء الموردين. صف واحد لكل مورد.',
    columns: [
        {
            id: 'supplier_id',
            label: 'Supplier ID',
            labelAr: 'رقم المورد',
            type: 'text',
            required: true,
            description: 'Reference to supplier',
            alternatives: ['Supplier Number', 'Vendor ID'],
            width: 120
        },
        {
            id: 'total_spend_ytd',
            label: 'YTD Spend',
            labelAr: 'الإنفاق السنوي',
            type: 'decimal',
            required: true,
            description: 'Year-to-date spend',
            alternatives: ['YTD Spend', 'Annual Spend', 'Total Spend'],
            width: 120
        },
        {
            id: 'order_count_ytd',
            label: 'YTD Orders',
            labelAr: 'الطلبات السنوية',
            type: 'number',
            required: true,
            description: 'Year-to-date orders',
            alternatives: ['Order Count', 'PO Count', 'Transaction Count'],
            width: 110
        },
        {
            id: 'on_time_delivery_rate',
            label: 'OTD Rate',
            labelAr: 'معدل التسليم',
            type: 'decimal',
            required: true,
            description: 'On-time delivery percentage',
            alternatives: ['OTD', 'On-Time Rate', 'Delivery Performance', 'OTIF Rate'],
            width: 100
        },
        {
            id: 'average_lead_time',
            label: 'Lead Time',
            labelAr: 'وقت التسليم',
            type: 'number',
            required: true,
            description: 'Average delivery days',
            alternatives: ['Lead Time', 'Delivery Days', 'Cycle Time', 'Transit Time'],
            width: 100
        },
        {
            id: 'quality_score',
            label: 'Quality Score',
            labelAr: 'نقاط الجودة',
            type: 'number',
            required: true,
            description: 'Quality rating (0-100)',
            alternatives: ['Quality', 'Quality Rating', 'Quality Index', 'QC Score'],
            width: 110
        },
        {
            id: 'defect_rate',
            label: 'Defect Rate',
            labelAr: 'معدل العيوب',
            type: 'decimal',
            required: false,
            description: 'Defective items percentage',
            alternatives: ['Defect Rate', 'Rejection Rate', 'Failure Rate'],
            width: 100
        },
        {
            id: 'overall_rating',
            label: 'Rating',
            labelAr: 'التقييم',
            type: 'decimal',
            required: true,
            description: 'Overall score (0-5)',
            alternatives: ['Rating', 'Score', 'Supplier Rating', 'Vendor Rating'],
            width: 80
        },
        {
            id: 'risk_level',
            label: 'Risk Level',
            labelAr: 'مستوى المخاطر',
            type: 'enum',
            required: true,
            description: 'Risk classification',
            alternatives: ['Risk', 'Risk Level', 'Risk Score', 'Risk Category'],
            enumValues: [
                { value: 'low', label: 'Low', labelAr: 'منخفض' },
                { value: 'medium', label: 'Medium', labelAr: 'متوسط' },
                { value: 'high', label: 'High', labelAr: 'مرتفع' },
                { value: 'critical', label: 'Critical', labelAr: 'حرج' }
            ],
            width: 100
        }
    ]
};

// Supplier Deliveries Table Schema
const SUPPLIER_DELIVERIES_TABLE: TableSchema = {
    id: 'supplier_deliveries',
    name: 'Deliveries',
    nameAr: 'التسليمات',
    description: 'Delivery performance tracking. One row per delivery.',
    descriptionAr: 'تتبع أداء التسليم. صف واحد لكل تسليم.',
    columns: [
        {
            id: 'delivery_id',
            label: 'Delivery ID',
            labelAr: 'رقم التسليم',
            type: 'text',
            required: true,
            description: 'Unique delivery identifier',
            alternatives: ['Delivery Number', 'Shipment ID', 'Receipt Number', 'GRN Number'],
            width: 120
        },
        {
            id: 'order_id',
            label: 'Order ID',
            labelAr: 'رقم الطلب',
            type: 'text',
            required: true,
            description: 'Related order',
            alternatives: ['Order Number', 'PO Number'],
            width: 120
        },
        {
            id: 'supplier_id',
            label: 'Supplier ID',
            labelAr: 'رقم المورد',
            type: 'text',
            required: true,
            description: 'Reference to supplier',
            alternatives: ['Supplier Number', 'Vendor ID'],
            width: 120
        },
        {
            id: 'expected_date',
            label: 'Expected Date',
            labelAr: 'التاريخ المتوقع',
            type: 'date',
            required: true,
            description: 'Expected delivery date',
            alternatives: ['Due Date', 'Promised Date', 'Expected', 'ETA'],
            width: 120
        },
        {
            id: 'actual_date',
            label: 'Actual Date',
            labelAr: 'التاريخ الفعلي',
            type: 'date',
            required: true,
            description: 'Actual delivery date',
            alternatives: ['Delivery Date', 'Receipt Date', 'Arrival Date'],
            width: 120
        },
        {
            id: 'variance_days',
            label: 'Variance (Days)',
            labelAr: 'الفرق (أيام)',
            type: 'number',
            required: true,
            description: 'Days early/late',
            alternatives: ['Variance', 'Delay', 'Days Late', 'Days Early'],
            width: 120
        },
        {
            id: 'on_time',
            label: 'On Time',
            labelAr: 'في الوقت',
            type: 'boolean',
            required: true,
            description: 'Was delivery on time',
            alternatives: ['On Time', 'OTD', 'Punctual'],
            width: 80
        },
        {
            id: 'quantity_ordered',
            label: 'Qty Ordered',
            labelAr: 'الكمية المطلوبة',
            type: 'number',
            required: true,
            description: 'Quantity ordered',
            alternatives: ['Ordered', 'Order Qty', 'Expected Qty'],
            width: 100
        },
        {
            id: 'quantity_received',
            label: 'Qty Received',
            labelAr: 'الكمية المستلمة',
            type: 'number',
            required: true,
            description: 'Quantity received',
            alternatives: ['Received', 'Delivered Qty', 'Actual Qty'],
            width: 100
        },
        {
            id: 'complete',
            label: 'Complete',
            labelAr: 'مكتمل',
            type: 'boolean',
            required: true,
            description: 'Full delivery',
            alternatives: ['Complete', 'Full', 'OTIF'],
            width: 80
        }
    ]
};

// All Supplier Tables
const SUPPLIER_TABLES: TableSchema[] = [
    SUPPLIERS_TABLE,
    SUPPLIER_ORDERS_TABLE,
    SUPPLIER_METRICS_TABLE,
    SUPPLIER_DELIVERIES_TABLE
];

// Main Component
export const SupplierDeptData: React.FC = () => {
    return (
        <DeptDataView
            departmentId="suppliers"
            departmentName="Suppliers"
            departmentNameAr="الموردون"
            tables={SUPPLIER_TABLES}
        />
    );
};

export default SupplierDeptData;
