import React from 'react';
import { DeptDataView, TableSchema } from '../components/DeptDataView';

// Sales Orders Table Schema
const SALES_ORDERS_TABLE: TableSchema = {
    id: 'sales_orders',
    name: 'Sales Orders',
    nameAr: 'أوامر المبيعات',
    description: 'All sales transactions. Each row represents one order with customer, amount, and status.',
    descriptionAr: 'جميع معاملات المبيعات. كل صف يمثل طلب واحد مع العميل والمبلغ والحالة.',
    columns: [
        {
            id: 'order_id',
            label: 'Order ID',
            labelAr: 'رقم الطلب',
            type: 'text',
            required: true,
            description: 'Unique order identifier',
            alternatives: ['Order Number', 'SO Number', 'Invoice Number', 'Transaction ID', 'Receipt Number', 'Sale ID'],
            width: 120
        },
        {
            id: 'order_date',
            label: 'Order Date',
            labelAr: 'تاريخ الطلب',
            type: 'date',
            required: true,
            description: 'Date of the order',
            alternatives: ['Date', 'Sale Date', 'Transaction Date', 'Invoice Date'],
            width: 120
        },
        {
            id: 'customer_id',
            label: 'Customer ID',
            labelAr: 'رقم العميل',
            type: 'text',
            required: true,
            description: 'Customer reference',
            alternatives: ['Customer', 'Client ID', 'Account Number', 'Buyer ID'],
            width: 120
        },
        {
            id: 'customer_name',
            label: 'Customer Name',
            labelAr: 'اسم العميل',
            type: 'text',
            required: false,
            description: 'Customer display name',
            alternatives: ['Customer', 'Client Name', 'Account Name', 'Buyer Name'],
            width: 180
        },
        {
            id: 'total_amount',
            label: 'Total Amount',
            labelAr: 'المبلغ الإجمالي',
            type: 'decimal',
            required: true,
            description: 'Order total value',
            alternatives: ['Amount', 'Total', 'Value', 'Revenue', 'Sales Amount', 'Invoice Total'],
            width: 120
        },
        {
            id: 'currency',
            label: 'Currency',
            labelAr: 'العملة',
            type: 'text',
            required: false,
            description: 'Currency code (USD, EUR, etc.)',
            alternatives: ['Currency Code'],
            width: 80
        },
        {
            id: 'status',
            label: 'Status',
            labelAr: 'الحالة',
            type: 'enum',
            required: true,
            description: 'Order status',
            alternatives: ['Order Status', 'State'],
            enumValues: [
                { value: 'pending', label: 'Pending', labelAr: 'قيد الانتظار' },
                { value: 'confirmed', label: 'Confirmed', labelAr: 'مؤكد' },
                { value: 'processing', label: 'Processing', labelAr: 'قيد المعالجة' },
                { value: 'shipped', label: 'Shipped', labelAr: 'تم الشحن' },
                { value: 'delivered', label: 'Delivered', labelAr: 'تم التسليم' },
                { value: 'cancelled', label: 'Cancelled', labelAr: 'ملغى' },
                { value: 'returned', label: 'Returned', labelAr: 'مرتجع' }
            ],
            width: 120
        },
        {
            id: 'salesperson_id',
            label: 'Salesperson ID',
            labelAr: 'رقم المندوب',
            type: 'text',
            required: false,
            description: 'Sales representative',
            alternatives: ['Salesperson', 'Rep', 'Agent', 'Sales Rep', 'Account Manager'],
            width: 120
        },
        {
            id: 'region',
            label: 'Region',
            labelAr: 'المنطقة',
            type: 'text',
            required: false,
            description: 'Sales region/territory',
            alternatives: ['Territory', 'Area', 'Zone', 'Market', 'Geography'],
            width: 120
        },
        {
            id: 'channel',
            label: 'Channel',
            labelAr: 'القناة',
            type: 'enum',
            required: false,
            description: 'Sales channel',
            alternatives: ['Sales Channel', 'Source', 'Platform'],
            enumValues: [
                { value: 'direct', label: 'Direct', labelAr: 'مباشر' },
                { value: 'online', label: 'Online', labelAr: 'أونلاين' },
                { value: 'phone', label: 'Phone', labelAr: 'هاتف' },
                { value: 'retail', label: 'Retail', labelAr: 'تجزئة' },
                { value: 'wholesale', label: 'Wholesale', labelAr: 'جملة' },
                { value: 'partner', label: 'Partner', labelAr: 'شريك' }
            ],
            width: 100
        },
        {
            id: 'discount',
            label: 'Discount',
            labelAr: 'الخصم',
            type: 'decimal',
            required: false,
            description: 'Discount amount',
            alternatives: ['Discount Amount', 'Reduction', 'Rebate'],
            width: 100
        },
        {
            id: 'profit',
            label: 'Profit',
            labelAr: 'الربح',
            type: 'decimal',
            required: false,
            description: 'Order profit',
            alternatives: ['Margin', 'Net', 'Gain'],
            width: 100
        },
        {
            id: 'cost',
            label: 'Cost',
            labelAr: 'التكلفة',
            type: 'decimal',
            required: false,
            description: 'Order cost (COGS)',
            alternatives: ['COGS', 'Cost of Goods'],
            width: 100
        }
    ]
};

// Sales Order Lines Table Schema
const SALES_ORDER_LINES_TABLE: TableSchema = {
    id: 'sales_order_lines',
    name: 'Order Lines',
    nameAr: 'بنود الطلبات',
    description: 'Line items for each order. Links to Sales Orders via order_id.',
    descriptionAr: 'بنود السطر لكل طلب. مرتبطة بأوامر المبيعات عبر رقم الطلب.',
    columns: [
        {
            id: 'line_id',
            label: 'Line ID',
            labelAr: 'رقم السطر',
            type: 'text',
            required: true,
            description: 'Unique line identifier',
            alternatives: ['Line Number', 'Item Number', 'Detail ID'],
            width: 100
        },
        {
            id: 'order_id',
            label: 'Order ID',
            labelAr: 'رقم الطلب',
            type: 'text',
            required: true,
            description: 'Reference to Sales Order',
            alternatives: ['Order Number', 'SO Number', 'Invoice Number'],
            width: 120
        },
        {
            id: 'product_id',
            label: 'Product ID',
            labelAr: 'رقم المنتج',
            type: 'text',
            required: true,
            description: 'Product/SKU identifier',
            alternatives: ['SKU', 'Item', 'Part Number', 'Article Number'],
            width: 120
        },
        {
            id: 'product_name',
            label: 'Product Name',
            labelAr: 'اسم المنتج',
            type: 'text',
            required: false,
            description: 'Product display name',
            alternatives: ['Name', 'Description', 'Item Name'],
            width: 180
        },
        {
            id: 'quantity',
            label: 'Quantity',
            labelAr: 'الكمية',
            type: 'number',
            required: true,
            description: 'Units sold',
            alternatives: ['Qty', 'Count', 'Units'],
            width: 80
        },
        {
            id: 'unit_price',
            label: 'Unit Price',
            labelAr: 'سعر الوحدة',
            type: 'decimal',
            required: true,
            description: 'Price per unit',
            alternatives: ['Price', 'Rate', 'Sell Price'],
            width: 100
        },
        {
            id: 'line_total',
            label: 'Line Total',
            labelAr: 'إجمالي السطر',
            type: 'decimal',
            required: true,
            description: 'Quantity × Unit Price',
            alternatives: ['Total', 'Amount', 'Extended', 'Line Amount'],
            width: 120
        },
        {
            id: 'category',
            label: 'Category',
            labelAr: 'الفئة',
            type: 'text',
            required: false,
            description: 'Product category',
            alternatives: ['Product Category', 'Type', 'Group'],
            width: 120
        }
    ]
};

// Sales Pipeline Table Schema
const SALES_PIPELINE_TABLE: TableSchema = {
    id: 'sales_pipeline',
    name: 'Pipeline',
    nameAr: 'خط الأنابيب',
    description: 'Sales opportunities and deals. Tracks potential sales through stages.',
    descriptionAr: 'فرص ومعاملات المبيعات. تتبع المبيعات المحتملة عبر المراحل.',
    columns: [
        {
            id: 'opportunity_id',
            label: 'Opportunity ID',
            labelAr: 'رقم الفرصة',
            type: 'text',
            required: true,
            description: 'Unique opportunity identifier',
            alternatives: ['Opportunity Number', 'Deal ID', 'Lead Number'],
            width: 120
        },
        {
            id: 'opportunity_name',
            label: 'Name',
            labelAr: 'الاسم',
            type: 'text',
            required: true,
            description: 'Opportunity/deal name',
            alternatives: ['Deal Name', 'Title', 'Description'],
            width: 200
        },
        {
            id: 'customer_id',
            label: 'Customer ID',
            labelAr: 'رقم العميل',
            type: 'text',
            required: true,
            description: 'Customer or prospect',
            alternatives: ['Customer', 'Prospect', 'Lead', 'Account'],
            width: 120
        },
        {
            id: 'value',
            label: 'Value',
            labelAr: 'القيمة',
            type: 'decimal',
            required: true,
            description: 'Expected deal value',
            alternatives: ['Amount', 'Deal Size', 'Expected Revenue'],
            width: 120
        },
        {
            id: 'stage',
            label: 'Stage',
            labelAr: 'المرحلة',
            type: 'enum',
            required: true,
            description: 'Pipeline stage',
            alternatives: ['Phase', 'Status', 'Step'],
            enumValues: [
                { value: 'lead', label: 'Lead (10%)', labelAr: 'عميل محتمل (10%)' },
                { value: 'qualified', label: 'Qualified (25%)', labelAr: 'مؤهل (25%)' },
                { value: 'proposal', label: 'Proposal (50%)', labelAr: 'عرض (50%)' },
                { value: 'negotiation', label: 'Negotiation (75%)', labelAr: 'تفاوض (75%)' },
                { value: 'closed_won', label: 'Closed Won (100%)', labelAr: 'فوز (100%)' },
                { value: 'closed_lost', label: 'Closed Lost (0%)', labelAr: 'خسارة (0%)' }
            ],
            width: 150
        },
        {
            id: 'probability',
            label: 'Probability %',
            labelAr: 'الاحتمال %',
            type: 'number',
            required: false,
            description: 'Win probability percentage',
            alternatives: ['Confidence', 'Win Rate'],
            width: 100
        },
        {
            id: 'salesperson_id',
            label: 'Owner',
            labelAr: 'المالك',
            type: 'text',
            required: false,
            description: 'Deal owner/rep',
            alternatives: ['Salesperson', 'Rep', 'Assigned To'],
            width: 120
        },
        {
            id: 'expected_close',
            label: 'Expected Close',
            labelAr: 'الإغلاق المتوقع',
            type: 'date',
            required: false,
            description: 'Expected close date',
            alternatives: ['Close Date', 'Target Date'],
            width: 120
        },
        {
            id: 'source',
            label: 'Source',
            labelAr: 'المصدر',
            type: 'text',
            required: false,
            description: 'Lead source',
            alternatives: ['Lead Source', 'Origin', 'Channel'],
            width: 120
        }
    ]
};

// Sales Targets Table Schema
const SALES_TARGETS_TABLE: TableSchema = {
    id: 'sales_targets',
    name: 'Targets',
    nameAr: 'الأهداف',
    description: 'Sales targets and quotas per salesperson and period.',
    descriptionAr: 'أهداف وحصص المبيعات لكل مندوب وفترة.',
    columns: [
        {
            id: 'target_id',
            label: 'Target ID',
            labelAr: 'رقم الهدف',
            type: 'text',
            required: true,
            description: 'Unique target identifier',
            alternatives: ['ID', 'Quota ID'],
            width: 100
        },
        {
            id: 'period',
            label: 'Period',
            labelAr: 'الفترة',
            type: 'text',
            required: true,
            description: 'Target period (YYYY-MM or YYYY-Q1)',
            alternatives: ['Month', 'Quarter', 'Year'],
            width: 100
        },
        {
            id: 'salesperson_id',
            label: 'Salesperson',
            labelAr: 'المندوب',
            type: 'text',
            required: false,
            description: 'Sales rep (blank for team target)',
            alternatives: ['Rep', 'Employee', 'Owner'],
            width: 120
        },
        {
            id: 'region',
            label: 'Region',
            labelAr: 'المنطقة',
            type: 'text',
            required: false,
            description: 'Target region',
            alternatives: ['Territory', 'Area'],
            width: 120
        },
        {
            id: 'target_revenue',
            label: 'Target Revenue',
            labelAr: 'الإيرادات المستهدفة',
            type: 'decimal',
            required: true,
            description: 'Revenue target',
            alternatives: ['Target', 'Quota', 'Goal', 'Budget'],
            width: 130
        },
        {
            id: 'target_orders',
            label: 'Target Orders',
            labelAr: 'الطلبات المستهدفة',
            type: 'number',
            required: false,
            description: 'Order count target',
            alternatives: ['Order Target', 'Transaction Target'],
            width: 120
        }
    ]
};

// Promotions Table Schema
const PROMOTIONS_TABLE: TableSchema = {
    id: 'promotions',
    name: 'Promotions',
    nameAr: 'العروض',
    description: 'Sales campaigns and promotional offers.',
    descriptionAr: 'حملات المبيعات والعروض الترويجية.',
    columns: [
        {
            id: 'promotion_id',
            label: 'Promotion ID',
            labelAr: 'رقم العرض',
            type: 'text',
            required: true,
            description: 'Unique promotion identifier',
            alternatives: ['Promo ID', 'Campaign ID', 'Offer ID'],
            width: 120
        },
        {
            id: 'promotion_name',
            label: 'Name',
            labelAr: 'الاسم',
            type: 'text',
            required: true,
            description: 'Promotion name',
            alternatives: ['Campaign Name', 'Title', 'Description'],
            width: 200
        },
        {
            id: 'start_date',
            label: 'Start Date',
            labelAr: 'تاريخ البداية',
            type: 'date',
            required: true,
            description: 'Campaign start',
            alternatives: ['Start', 'From Date', 'Launch Date'],
            width: 120
        },
        {
            id: 'end_date',
            label: 'End Date',
            labelAr: 'تاريخ النهاية',
            type: 'date',
            required: true,
            description: 'Campaign end',
            alternatives: ['End', 'To Date', 'Expiry Date'],
            width: 120
        },
        {
            id: 'discount_type',
            label: 'Discount Type',
            labelAr: 'نوع الخصم',
            type: 'enum',
            required: true,
            description: 'Type of discount',
            alternatives: ['Type', 'Offer Type'],
            enumValues: [
                { value: 'percentage', label: 'Percentage', labelAr: 'نسبة مئوية' },
                { value: 'fixed', label: 'Fixed Amount', labelAr: 'مبلغ ثابت' },
                { value: 'bogo', label: 'Buy One Get One', labelAr: 'اشتر واحد واحصل على واحد' },
                { value: 'bundle', label: 'Bundle', labelAr: 'حزمة' }
            ],
            width: 130
        },
        {
            id: 'discount_value',
            label: 'Discount Value',
            labelAr: 'قيمة الخصم',
            type: 'decimal',
            required: true,
            description: 'Discount amount or percentage',
            alternatives: ['Value', 'Discount', 'Amount'],
            width: 120
        },
        {
            id: 'budget',
            label: 'Budget',
            labelAr: 'الميزانية',
            type: 'decimal',
            required: false,
            description: 'Campaign budget',
            alternatives: ['Spend Limit', 'Investment'],
            width: 120
        },
        {
            id: 'actual_spend',
            label: 'Actual Spend',
            labelAr: 'الإنفاق الفعلي',
            type: 'decimal',
            required: false,
            description: 'Amount actually spent',
            alternatives: ['Spend', 'Cost', 'Actual'],
            width: 120
        },
        {
            id: 'orders_generated',
            label: 'Orders Generated',
            labelAr: 'الطلبات المُولدة',
            type: 'number',
            required: false,
            description: 'Orders from this promotion',
            alternatives: ['Orders', 'Conversions', 'Sales'],
            width: 130
        },
        {
            id: 'revenue_generated',
            label: 'Revenue Generated',
            labelAr: 'الإيرادات المُولدة',
            type: 'decimal',
            required: false,
            description: 'Revenue from this promotion',
            alternatives: ['Revenue', 'Sales', 'Amount'],
            width: 140
        }
    ]
};

// Products Table (Linked from Inventory)
const PRODUCTS_LINKED_TABLE: TableSchema = {
    id: 'products',
    name: 'Products',
    nameAr: 'المنتجات',
    description: 'Product catalog. Managed in Inventory department.',
    descriptionAr: 'كتالوج المنتجات. يُدار في قسم المخزون.',
    isLinked: true,
    linkedDepartment: 'Inventory',
    columns: [
        { id: 'product_id', label: 'Product ID', labelAr: 'رقم المنتج', type: 'text', required: true, width: 120 },
        { id: 'product_name', label: 'Name', labelAr: 'الاسم', type: 'text', required: true, width: 200 },
        { id: 'category', label: 'Category', labelAr: 'الفئة', type: 'text', required: false, width: 150 },
        { id: 'unit_price', label: 'Price', labelAr: 'السعر', type: 'decimal', required: false, width: 100 }
    ]
};

// All Sales Tables
const SALES_TABLES: TableSchema[] = [
    SALES_ORDERS_TABLE,
    SALES_ORDER_LINES_TABLE,
    SALES_PIPELINE_TABLE,
    SALES_TARGETS_TABLE,
    PROMOTIONS_TABLE
];

// Linked Tables
const SALES_LINKED_TABLES: TableSchema[] = [
    PRODUCTS_LINKED_TABLE
];

// Main Component
export const SalesDeptData: React.FC = () => {
    return (
        <DeptDataView
            departmentId="sales"
            departmentName="Sales"
            departmentNameAr="المبيعات"
            tables={SALES_TABLES}
            linkedTables={SALES_LINKED_TABLES}
        />
    );
};

export default SalesDeptData;
