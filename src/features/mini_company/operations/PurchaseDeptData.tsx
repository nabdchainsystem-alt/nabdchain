import React from 'react';
import { DeptDataView, TableSchema } from '../components/DeptDataView';

// Purchase Orders Table Schema
const PURCHASE_ORDERS_TABLE: TableSchema = {
    id: 'purchase_orders',
    name: 'Purchase Orders',
    nameAr: 'أوامر الشراء',
    description: 'All purchase orders. Each row represents one PO.',
    descriptionAr: 'جميع أوامر الشراء. كل صف يمثل أمر شراء واحد.',
    columns: [
        {
            id: 'po_id',
            label: 'PO ID',
            labelAr: 'رقم أمر الشراء',
            type: 'text',
            required: true,
            description: 'Unique PO identifier',
            alternatives: ['PO Number', 'Order Number', 'Purchase Order', 'Procurement Number'],
            width: 120
        },
        {
            id: 'po_date',
            label: 'Order Date',
            labelAr: 'تاريخ الطلب',
            type: 'date',
            required: true,
            description: 'Order creation date',
            alternatives: ['Date', 'Order Date', 'Issue Date', 'PO Date'],
            width: 120
        },
        {
            id: 'supplier_id',
            label: 'Supplier ID',
            labelAr: 'رقم المورد',
            type: 'text',
            required: true,
            description: 'Supplier reference',
            alternatives: ['Supplier', 'Vendor', 'Vendor ID'],
            width: 120
        },
        {
            id: 'supplier_name',
            label: 'Supplier Name',
            labelAr: 'اسم المورد',
            type: 'text',
            required: false,
            description: 'Supplier name',
            alternatives: ['Supplier Name', 'Vendor Name'],
            width: 180
        },
        {
            id: 'total_amount',
            label: 'Total Amount',
            labelAr: 'المبلغ الإجمالي',
            type: 'decimal',
            required: true,
            description: 'Total order value',
            alternatives: ['Amount', 'Value', 'Total', 'PO Value', 'Order Value'],
            width: 130
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
                { value: 'draft', label: 'Draft', labelAr: 'مسودة' },
                { value: 'pending', label: 'Pending Approval', labelAr: 'قيد الموافقة' },
                { value: 'approved', label: 'Approved', labelAr: 'موافق عليه' },
                { value: 'sent', label: 'Sent to Supplier', labelAr: 'تم الإرسال للمورد' },
                { value: 'partial', label: 'Partially Received', labelAr: 'استلام جزئي' },
                { value: 'received', label: 'Received', labelAr: 'تم الاستلام' },
                { value: 'cancelled', label: 'Cancelled', labelAr: 'ملغى' }
            ],
            width: 140
        },
        {
            id: 'expected_delivery',
            label: 'Expected Delivery',
            labelAr: 'التسليم المتوقع',
            type: 'date',
            required: true,
            description: 'Expected delivery date',
            alternatives: ['Delivery Date', 'Due Date', 'Expected Date', 'ETA'],
            width: 140
        },
        {
            id: 'actual_delivery',
            label: 'Actual Delivery',
            labelAr: 'التسليم الفعلي',
            type: 'date',
            required: false,
            description: 'Actual delivery date',
            alternatives: ['Receipt Date', 'Actual Date', 'GRN Date'],
            width: 130
        },
        {
            id: 'department',
            label: 'Department',
            labelAr: 'القسم',
            type: 'text',
            required: true,
            description: 'Requesting department',
            alternatives: ['Department', 'Cost Center', 'Business Unit'],
            width: 130
        },
        {
            id: 'buyer_id',
            label: 'Buyer ID',
            labelAr: 'رقم المشتري',
            type: 'text',
            required: true,
            description: 'Buyer/procurement officer',
            alternatives: ['Buyer', 'Purchaser', 'Officer', 'Creator'],
            width: 110
        },
        {
            id: 'category',
            label: 'Category',
            labelAr: 'الفئة',
            type: 'text',
            required: true,
            description: 'Purchase category',
            alternatives: ['Category', 'Commodity', 'Product Category'],
            width: 130
        },
        {
            id: 'priority',
            label: 'Priority',
            labelAr: 'الأولوية',
            type: 'enum',
            required: false,
            description: 'Order priority',
            alternatives: ['Priority', 'Urgency', 'Importance'],
            enumValues: [
                { value: 'low', label: 'Low', labelAr: 'منخفض' },
                { value: 'medium', label: 'Medium', labelAr: 'متوسط' },
                { value: 'high', label: 'High', labelAr: 'مرتفع' },
                { value: 'critical', label: 'Critical', labelAr: 'حرج' }
            ],
            width: 100
        },
        {
            id: 'payment_terms',
            label: 'Payment Terms',
            labelAr: 'شروط الدفع',
            type: 'text',
            required: false,
            description: 'Payment terms',
            alternatives: ['Terms', 'Payment Terms'],
            width: 120
        }
    ]
};

// Purchase Order Lines Table Schema
const PURCHASE_ORDER_LINES_TABLE: TableSchema = {
    id: 'purchase_order_lines',
    name: 'Order Lines',
    nameAr: 'بنود الطلبات',
    description: 'Line items for each PO. Links to Purchase Orders via po_id.',
    descriptionAr: 'بنود السطر لكل أمر شراء. مرتبطة بأوامر الشراء عبر رقم الطلب.',
    columns: [
        {
            id: 'line_id',
            label: 'Line ID',
            labelAr: 'رقم السطر',
            type: 'text',
            required: true,
            description: 'Unique line identifier',
            alternatives: ['Line Number', 'Item Number', 'Detail Number'],
            width: 100
        },
        {
            id: 'po_id',
            label: 'PO ID',
            labelAr: 'رقم أمر الشراء',
            type: 'text',
            required: true,
            description: 'PO reference',
            alternatives: ['PO Number', 'Order Number'],
            width: 120
        },
        {
            id: 'item_id',
            label: 'Item ID',
            labelAr: 'رقم الصنف',
            type: 'text',
            required: true,
            description: 'Item/product ID',
            alternatives: ['Item', 'SKU', 'Product', 'Part Number'],
            width: 120
        },
        {
            id: 'item_name',
            label: 'Item Name',
            labelAr: 'اسم الصنف',
            type: 'text',
            required: true,
            description: 'Item description',
            alternatives: ['Description', 'Item Name', 'Product Name'],
            width: 180
        },
        {
            id: 'quantity',
            label: 'Quantity',
            labelAr: 'الكمية',
            type: 'number',
            required: true,
            description: 'Quantity ordered',
            alternatives: ['Quantity', 'Count', 'Units', 'Order Qty'],
            width: 90
        },
        {
            id: 'unit_price',
            label: 'Unit Price',
            labelAr: 'سعر الوحدة',
            type: 'decimal',
            required: true,
            description: 'Price per unit',
            alternatives: ['Price', 'Unit Price', 'Cost', 'Rate'],
            width: 110
        },
        {
            id: 'line_total',
            label: 'Line Total',
            labelAr: 'إجمالي السطر',
            type: 'decimal',
            required: true,
            description: 'Line total (Qty × Price)',
            alternatives: ['Total', 'Amount', 'Line Amount'],
            width: 120
        },
        {
            id: 'unit',
            label: 'Unit',
            labelAr: 'الوحدة',
            type: 'text',
            required: true,
            description: 'Unit of measure',
            alternatives: ['Unit', 'UOM'],
            width: 80
        },
        {
            id: 'received_qty',
            label: 'Received Qty',
            labelAr: 'الكمية المستلمة',
            type: 'number',
            required: false,
            description: 'Quantity received',
            alternatives: ['Received', 'Delivered Qty'],
            width: 110
        },
        {
            id: 'status',
            label: 'Status',
            labelAr: 'الحالة',
            type: 'enum',
            required: false,
            description: 'Line status',
            alternatives: ['Status', 'State'],
            enumValues: [
                { value: 'pending', label: 'Pending', labelAr: 'قيد الانتظار' },
                { value: 'partial', label: 'Partial', labelAr: 'جزئي' },
                { value: 'complete', label: 'Complete', labelAr: 'مكتمل' },
                { value: 'cancelled', label: 'Cancelled', labelAr: 'ملغى' }
            ],
            width: 100
        }
    ]
};

// Purchase Requisitions Table Schema
const PURCHASE_REQUISITIONS_TABLE: TableSchema = {
    id: 'purchase_requisitions',
    name: 'Requisitions',
    nameAr: 'طلبات الشراء',
    description: 'Internal purchase requests before becoming POs.',
    descriptionAr: 'طلبات الشراء الداخلية قبل التحويل لأوامر شراء.',
    columns: [
        {
            id: 'req_id',
            label: 'Requisition ID',
            labelAr: 'رقم الطلب',
            type: 'text',
            required: true,
            description: 'Unique requisition identifier',
            alternatives: ['Requisition Number', 'PR Number', 'Request Number'],
            width: 130
        },
        {
            id: 'req_date',
            label: 'Date',
            labelAr: 'التاريخ',
            type: 'date',
            required: true,
            description: 'Request date',
            alternatives: ['Date', 'Request Date'],
            width: 120
        },
        {
            id: 'requester_id',
            label: 'Requester ID',
            labelAr: 'رقم الطالب',
            type: 'text',
            required: true,
            description: 'Requester ID',
            alternatives: ['Requester', 'User ID', 'Employee'],
            width: 120
        },
        {
            id: 'requester_name',
            label: 'Requester Name',
            labelAr: 'اسم الطالب',
            type: 'text',
            required: false,
            description: 'Requester name',
            alternatives: ['Name', 'Requester Name'],
            width: 150
        },
        {
            id: 'department',
            label: 'Department',
            labelAr: 'القسم',
            type: 'text',
            required: true,
            description: 'Department',
            alternatives: ['Department', 'Cost Center'],
            width: 130
        },
        {
            id: 'description',
            label: 'Description',
            labelAr: 'الوصف',
            type: 'text',
            required: true,
            description: 'Request description',
            alternatives: ['Description', 'Details', 'Purpose'],
            width: 200
        },
        {
            id: 'estimated_value',
            label: 'Estimated Value',
            labelAr: 'القيمة المقدرة',
            type: 'decimal',
            required: false,
            description: 'Estimated cost',
            alternatives: ['Value', 'Estimate', 'Budget'],
            width: 130
        },
        {
            id: 'urgency',
            label: 'Urgency',
            labelAr: 'الاستعجال',
            type: 'enum',
            required: false,
            description: 'Request urgency',
            alternatives: ['Urgency', 'Priority'],
            enumValues: [
                { value: 'low', label: 'Low', labelAr: 'منخفض' },
                { value: 'medium', label: 'Medium', labelAr: 'متوسط' },
                { value: 'high', label: 'High', labelAr: 'مرتفع' },
                { value: 'critical', label: 'Critical', labelAr: 'حرج' }
            ],
            width: 100
        },
        {
            id: 'status',
            label: 'Status',
            labelAr: 'الحالة',
            type: 'enum',
            required: true,
            description: 'Requisition status',
            alternatives: ['Status', 'State'],
            enumValues: [
                { value: 'draft', label: 'Draft', labelAr: 'مسودة' },
                { value: 'pending', label: 'Pending', labelAr: 'قيد الانتظار' },
                { value: 'approved', label: 'Approved', labelAr: 'موافق عليه' },
                { value: 'rejected', label: 'Rejected', labelAr: 'مرفوض' },
                { value: 'converted', label: 'Converted to PO', labelAr: 'تم التحويل' }
            ],
            width: 130
        },
        {
            id: 'po_id',
            label: 'PO ID',
            labelAr: 'رقم أمر الشراء',
            type: 'text',
            required: false,
            description: 'Linked PO (if converted)',
            alternatives: ['PO', 'Order', 'Purchase Order'],
            width: 120
        }
    ]
};

// Purchase Receipts Table Schema
const PURCHASE_RECEIPTS_TABLE: TableSchema = {
    id: 'purchase_receipts',
    name: 'Receipts',
    nameAr: 'سندات الاستلام',
    description: 'Goods receipt notes (GRN). Tracks received items.',
    descriptionAr: 'سندات استلام البضائع. تتبع الأصناف المستلمة.',
    columns: [
        {
            id: 'receipt_id',
            label: 'Receipt ID',
            labelAr: 'رقم السند',
            type: 'text',
            required: true,
            description: 'Unique receipt identifier',
            alternatives: ['Receipt Number', 'GRN Number', 'Receiving Number'],
            width: 120
        },
        {
            id: 'receipt_date',
            label: 'Date',
            labelAr: 'التاريخ',
            type: 'date',
            required: true,
            description: 'Receipt date',
            alternatives: ['Date', 'Receiving Date', 'GRN Date'],
            width: 120
        },
        {
            id: 'po_id',
            label: 'PO ID',
            labelAr: 'رقم أمر الشراء',
            type: 'text',
            required: true,
            description: 'Related PO',
            alternatives: ['PO Number', 'Order Number'],
            width: 120
        },
        {
            id: 'supplier_id',
            label: 'Supplier ID',
            labelAr: 'رقم المورد',
            type: 'text',
            required: true,
            description: 'Supplier',
            alternatives: ['Supplier', 'Vendor'],
            width: 120
        },
        {
            id: 'warehouse_id',
            label: 'Warehouse',
            labelAr: 'المستودع',
            type: 'text',
            required: true,
            description: 'Receiving warehouse',
            alternatives: ['Warehouse', 'Location', 'Site'],
            width: 120
        },
        {
            id: 'total_quantity',
            label: 'Total Qty',
            labelAr: 'إجمالي الكمية',
            type: 'number',
            required: true,
            description: 'Total units received',
            alternatives: ['Quantity', 'Units'],
            width: 100
        },
        {
            id: 'total_value',
            label: 'Total Value',
            labelAr: 'إجمالي القيمة',
            type: 'decimal',
            required: true,
            description: 'Receipt value',
            alternatives: ['Value', 'Amount'],
            width: 120
        },
        {
            id: 'status',
            label: 'Status',
            labelAr: 'الحالة',
            type: 'enum',
            required: true,
            description: 'Receipt status',
            alternatives: ['Status', 'State'],
            enumValues: [
                { value: 'pending', label: 'Pending QC', labelAr: 'قيد الفحص' },
                { value: 'accepted', label: 'Accepted', labelAr: 'مقبول' },
                { value: 'partial', label: 'Partial Reject', labelAr: 'رفض جزئي' },
                { value: 'rejected', label: 'Rejected', labelAr: 'مرفوض' }
            ],
            width: 120
        },
        {
            id: 'quality_status',
            label: 'QC Status',
            labelAr: 'حالة الجودة',
            type: 'enum',
            required: false,
            description: 'QC result',
            alternatives: ['Quality', 'QC', 'Inspection Result'],
            enumValues: [
                { value: 'pending', label: 'Pending', labelAr: 'قيد الانتظار' },
                { value: 'pass', label: 'Pass', labelAr: 'ناجح' },
                { value: 'fail', label: 'Fail', labelAr: 'فاشل' }
            ],
            width: 100
        },
        {
            id: 'received_by',
            label: 'Received By',
            labelAr: 'المستلم',
            type: 'text',
            required: false,
            description: 'Receiver',
            alternatives: ['Receiver', 'Operator'],
            width: 120
        },
        {
            id: 'carrier',
            label: 'Carrier',
            labelAr: 'الناقل',
            type: 'text',
            required: false,
            description: 'Shipping carrier',
            alternatives: ['Carrier', 'Shipper'],
            width: 120
        }
    ]
};

// All Purchase Tables
const PURCHASE_TABLES: TableSchema[] = [
    PURCHASE_ORDERS_TABLE,
    PURCHASE_ORDER_LINES_TABLE,
    PURCHASE_REQUISITIONS_TABLE,
    PURCHASE_RECEIPTS_TABLE
];

// Main Component
export const PurchaseDeptData: React.FC = () => {
    return (
        <DeptDataView
            departmentId="purchases"
            departmentName="Purchases"
            departmentNameAr="المشتريات"
            tables={PURCHASE_TABLES}
        />
    );
};

export default PurchaseDeptData;
