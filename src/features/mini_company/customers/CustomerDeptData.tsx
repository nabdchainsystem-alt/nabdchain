import React from 'react';
import { DeptDataView, TableSchema } from '../components/DeptDataView';

// Customers Table Schema
const CUSTOMERS_TABLE: TableSchema = {
    id: 'customers',
    name: 'Customers',
    nameAr: 'العملاء',
    description: 'Customer master data. Core customer information and segmentation.',
    descriptionAr: 'البيانات الرئيسية للعملاء. معلومات العملاء الأساسية والتقسيم.',
    columns: [
        {
            id: 'customer_id',
            label: 'Customer ID',
            labelAr: 'رقم العميل',
            type: 'text',
            required: true,
            description: 'Unique customer identifier',
            alternatives: ['Customer Number', 'Client ID', 'Account Number', 'Customer Code', 'Party ID'],
            width: 120
        },
        {
            id: 'customer_name',
            label: 'Name',
            labelAr: 'الاسم',
            type: 'text',
            required: true,
            description: 'Full customer name',
            alternatives: ['Name', 'Full Name', 'Client Name', 'Account Name', 'Company Name'],
            width: 180
        },
        {
            id: 'email',
            label: 'Email',
            labelAr: 'البريد الإلكتروني',
            type: 'text',
            required: true,
            description: 'Primary email address',
            alternatives: ['Email Address', 'E-mail', 'Contact Email', 'Mail'],
            width: 200
        },
        {
            id: 'phone',
            label: 'Phone',
            labelAr: 'الهاتف',
            type: 'text',
            required: false,
            description: 'Phone number',
            alternatives: ['Phone Number', 'Telephone', 'Mobile', 'Cell', 'Contact Number'],
            width: 140
        },
        {
            id: 'segment',
            label: 'Segment',
            labelAr: 'الشريحة',
            type: 'enum',
            required: true,
            description: 'Customer segment',
            alternatives: ['Customer Segment', 'Tier', 'Classification', 'Customer Type', 'Grade'],
            enumValues: [
                { value: 'enterprise', label: 'Enterprise', labelAr: 'مؤسسات كبرى' },
                { value: 'mid_market', label: 'Mid-Market', labelAr: 'سوق متوسط' },
                { value: 'small_business', label: 'Small Business', labelAr: 'أعمال صغيرة' },
                { value: 'consumer', label: 'Consumer', labelAr: 'مستهلك' },
                { value: 'vip', label: 'VIP', labelAr: 'كبار العملاء' }
            ],
            width: 130
        },
        {
            id: 'status',
            label: 'Status',
            labelAr: 'الحالة',
            type: 'enum',
            required: true,
            description: 'Account status',
            alternatives: ['Account Status', 'Customer Status', 'State', 'Activity Status'],
            enumValues: [
                { value: 'active', label: 'Active', labelAr: 'نشط' },
                { value: 'inactive', label: 'Inactive', labelAr: 'غير نشط' },
                { value: 'churned', label: 'Churned', labelAr: 'متوقف' },
                { value: 'prospect', label: 'Prospect', labelAr: 'محتمل' }
            ],
            width: 100
        },
        {
            id: 'registration_date',
            label: 'Registration Date',
            labelAr: 'تاريخ التسجيل',
            type: 'date',
            required: true,
            description: 'Account creation date',
            alternatives: ['Created Date', 'Sign Up Date', 'Join Date', 'Start Date'],
            width: 130
        },
        {
            id: 'last_activity_date',
            label: 'Last Activity',
            labelAr: 'آخر نشاط',
            type: 'date',
            required: false,
            description: 'Last interaction date',
            alternatives: ['Last Active', 'Last Login', 'Last Purchase', 'Last Transaction'],
            width: 130
        },
        {
            id: 'country',
            label: 'Country',
            labelAr: 'الدولة',
            type: 'text',
            required: false,
            description: 'Customer country',
            alternatives: ['Country', 'Location', 'Region', 'Territory'],
            width: 120
        },
        {
            id: 'industry',
            label: 'Industry',
            labelAr: 'الصناعة',
            type: 'text',
            required: false,
            description: 'Business sector',
            alternatives: ['Industry', 'Sector', 'Business Type', 'Vertical'],
            width: 140
        },
        {
            id: 'source',
            label: 'Source',
            labelAr: 'المصدر',
            type: 'text',
            required: false,
            description: 'Acquisition source',
            alternatives: ['Acquisition Source', 'Lead Source', 'Channel', 'Origin', 'Referral'],
            width: 120
        }
    ]
};

// Customer Transactions Table Schema
const CUSTOMER_TRANSACTIONS_TABLE: TableSchema = {
    id: 'customer_transactions',
    name: 'Transactions',
    nameAr: 'المعاملات',
    description: 'Customer purchase history. Links to Customers via customer_id.',
    descriptionAr: 'سجل مشتريات العملاء. مرتبط بالعملاء عبر رقم العميل.',
    columns: [
        {
            id: 'transaction_id',
            label: 'Transaction ID',
            labelAr: 'رقم المعاملة',
            type: 'text',
            required: true,
            description: 'Unique transaction identifier',
            alternatives: ['Transaction Number', 'Order Number', 'Invoice Number', 'Receipt Number'],
            width: 130
        },
        {
            id: 'customer_id',
            label: 'Customer ID',
            labelAr: 'رقم العميل',
            type: 'text',
            required: true,
            description: 'Reference to customer',
            alternatives: ['Customer Number', 'Client ID', 'Account Number'],
            width: 120
        },
        {
            id: 'transaction_date',
            label: 'Date',
            labelAr: 'التاريخ',
            type: 'date',
            required: true,
            description: 'Transaction date',
            alternatives: ['Date', 'Order Date', 'Purchase Date', 'Sale Date'],
            width: 120
        },
        {
            id: 'amount',
            label: 'Amount',
            labelAr: 'المبلغ',
            type: 'decimal',
            required: true,
            description: 'Transaction value',
            alternatives: ['Amount', 'Value', 'Total', 'Sum', 'Revenue'],
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
            id: 'product_category',
            label: 'Category',
            labelAr: 'الفئة',
            type: 'text',
            required: false,
            description: 'Product category',
            alternatives: ['Category', 'Product Type', 'Item Category'],
            width: 120
        },
        {
            id: 'quantity',
            label: 'Quantity',
            labelAr: 'الكمية',
            type: 'number',
            required: false,
            description: 'Items purchased',
            alternatives: ['Quantity', 'Count', 'Units'],
            width: 80
        },
        {
            id: 'channel',
            label: 'Channel',
            labelAr: 'القناة',
            type: 'text',
            required: false,
            description: 'Sales channel',
            alternatives: ['Channel', 'Sales Channel', 'Source', 'Platform'],
            width: 100
        }
    ]
};

// Customer Metrics Table Schema
const CUSTOMER_METRICS_TABLE: TableSchema = {
    id: 'customer_metrics',
    name: 'Metrics',
    nameAr: 'المقاييس',
    description: 'Customer KPIs and scores. One row per customer.',
    descriptionAr: 'مؤشرات الأداء والتقييمات. صف واحد لكل عميل.',
    columns: [
        {
            id: 'customer_id',
            label: 'Customer ID',
            labelAr: 'رقم العميل',
            type: 'text',
            required: true,
            description: 'Reference to customer',
            alternatives: ['Customer Number', 'Client ID'],
            width: 120
        },
        {
            id: 'lifetime_value',
            label: 'Lifetime Value',
            labelAr: 'القيمة الدائمة',
            type: 'decimal',
            required: true,
            description: 'Customer lifetime value (CLV)',
            alternatives: ['CLV', 'LTV', 'Lifetime Value', 'Total Revenue'],
            width: 130
        },
        {
            id: 'total_revenue',
            label: 'Total Revenue',
            labelAr: 'إجمالي الإيرادات',
            type: 'decimal',
            required: true,
            description: 'Total revenue from customer',
            alternatives: ['Revenue', 'Total Sales', 'Cumulative Revenue'],
            width: 130
        },
        {
            id: 'total_orders',
            label: 'Total Orders',
            labelAr: 'إجمالي الطلبات',
            type: 'number',
            required: true,
            description: 'Total order count',
            alternatives: ['Orders', 'Order Count', 'Purchase Count'],
            width: 110
        },
        {
            id: 'average_order_value',
            label: 'AOV',
            labelAr: 'متوسط الطلب',
            type: 'decimal',
            required: false,
            description: 'Average order value',
            alternatives: ['AOV', 'Average Order', 'Average Purchase'],
            width: 100
        },
        {
            id: 'purchase_frequency',
            label: 'Frequency',
            labelAr: 'التكرار',
            type: 'decimal',
            required: false,
            description: 'Purchases per period',
            alternatives: ['Frequency', 'Purchase Rate', 'Order Frequency'],
            width: 100
        },
        {
            id: 'engagement_score',
            label: 'Engagement',
            labelAr: 'التفاعل',
            type: 'number',
            required: false,
            description: 'Engagement level (0-100)',
            alternatives: ['Engagement', 'Activity Score', 'Interaction Score'],
            width: 100
        },
        {
            id: 'churn_risk',
            label: 'Churn Risk',
            labelAr: 'خطر المغادرة',
            type: 'number',
            required: false,
            description: 'Churn probability (0-100)',
            alternatives: ['Churn Risk', 'Risk Score', 'Attrition Risk'],
            width: 100
        },
        {
            id: 'nps_score',
            label: 'NPS',
            labelAr: 'صافي الترويج',
            type: 'number',
            required: false,
            description: 'Net Promoter Score',
            alternatives: ['NPS', 'Net Promoter', 'Promoter Score'],
            width: 80
        }
    ]
};

// Customer Feedback Table Schema
const CUSTOMER_FEEDBACK_TABLE: TableSchema = {
    id: 'customer_feedback',
    name: 'Feedback',
    nameAr: 'التعليقات',
    description: 'Customer feedback and surveys.',
    descriptionAr: 'تعليقات واستطلاعات العملاء.',
    columns: [
        {
            id: 'feedback_id',
            label: 'Feedback ID',
            labelAr: 'رقم التعليق',
            type: 'text',
            required: true,
            description: 'Unique feedback identifier',
            alternatives: ['Feedback Number', 'Survey ID', 'Response ID'],
            width: 120
        },
        {
            id: 'customer_id',
            label: 'Customer ID',
            labelAr: 'رقم العميل',
            type: 'text',
            required: true,
            description: 'Reference to customer',
            alternatives: ['Customer Number', 'Client ID'],
            width: 120
        },
        {
            id: 'feedback_date',
            label: 'Date',
            labelAr: 'التاريخ',
            type: 'date',
            required: true,
            description: 'Feedback date',
            alternatives: ['Date', 'Submit Date', 'Response Date'],
            width: 120
        },
        {
            id: 'feedback_type',
            label: 'Type',
            labelAr: 'النوع',
            type: 'enum',
            required: true,
            description: 'Type of feedback',
            alternatives: ['Type', 'Category', 'Feedback Category'],
            enumValues: [
                { value: 'survey', label: 'Survey', labelAr: 'استطلاع' },
                { value: 'review', label: 'Review', labelAr: 'مراجعة' },
                { value: 'complaint', label: 'Complaint', labelAr: 'شكوى' },
                { value: 'suggestion', label: 'Suggestion', labelAr: 'اقتراح' },
                { value: 'compliment', label: 'Compliment', labelAr: 'مدح' }
            ],
            width: 100
        },
        {
            id: 'rating',
            label: 'Rating',
            labelAr: 'التقييم',
            type: 'number',
            required: true,
            description: 'Numeric rating (1-5)',
            alternatives: ['Rating', 'Score', 'Stars', 'Grade'],
            width: 80
        },
        {
            id: 'comment',
            label: 'Comment',
            labelAr: 'التعليق',
            type: 'text',
            required: false,
            description: 'Free-text feedback',
            alternatives: ['Comment', 'Note', 'Remarks', 'Feedback Text', 'Review'],
            width: 250
        },
        {
            id: 'sentiment',
            label: 'Sentiment',
            labelAr: 'المشاعر',
            type: 'enum',
            required: false,
            description: 'Detected sentiment',
            alternatives: ['Sentiment', 'Tone', 'Mood'],
            enumValues: [
                { value: 'positive', label: 'Positive', labelAr: 'إيجابي' },
                { value: 'neutral', label: 'Neutral', labelAr: 'محايد' },
                { value: 'negative', label: 'Negative', labelAr: 'سلبي' }
            ],
            width: 100
        }
    ]
};

// All Customer Tables
const CUSTOMER_TABLES: TableSchema[] = [
    CUSTOMERS_TABLE,
    CUSTOMER_TRANSACTIONS_TABLE,
    CUSTOMER_METRICS_TABLE,
    CUSTOMER_FEEDBACK_TABLE
];

// Main Component
export const CustomerDeptData: React.FC = () => {
    return (
        <DeptDataView
            departmentId="customers"
            departmentName="Customers"
            departmentNameAr="العملاء"
            tables={CUSTOMER_TABLES}
        />
    );
};

export default CustomerDeptData;
