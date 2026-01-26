import React from 'react';
import { DeptDataView, TableSchema } from '../components/DeptDataView';

// Expenses Table Schema
const EXPENSES_TABLE: TableSchema = {
    id: 'expenses',
    name: 'Expenses',
    nameAr: 'المصروفات',
    description: 'All expense transactions. Each row represents one expense entry.',
    descriptionAr: 'جميع معاملات المصروفات. كل صف يمثل إدخال مصروف واحد.',
    columns: [
        {
            id: 'expense_id',
            label: 'Expense ID',
            labelAr: 'رقم المصروف',
            type: 'text',
            required: true,
            description: 'Unique expense identifier',
            alternatives: ['Expense Number', 'Transaction ID', 'Voucher Number', 'Entry Number', 'Document Number'],
            width: 120
        },
        {
            id: 'expense_date',
            label: 'Date',
            labelAr: 'التاريخ',
            type: 'date',
            required: true,
            description: 'Expense date',
            alternatives: ['Date', 'Transaction Date', 'Posting Date', 'Entry Date', 'Voucher Date'],
            width: 120
        },
        {
            id: 'amount',
            label: 'Amount',
            labelAr: 'المبلغ',
            type: 'decimal',
            required: true,
            description: 'Expense amount',
            alternatives: ['Amount', 'Value', 'Sum', 'Total', 'Cost', 'Expenditure'],
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
            id: 'category',
            label: 'Category',
            labelAr: 'الفئة',
            type: 'text',
            required: true,
            description: 'Expense category',
            alternatives: ['Category', 'Type', 'Classification', 'Expense Type', 'Account', 'Cost Type'],
            width: 140
        },
        {
            id: 'subcategory',
            label: 'Subcategory',
            labelAr: 'الفئة الفرعية',
            type: 'text',
            required: false,
            description: 'Expense subcategory',
            alternatives: ['Subcategory', 'Sub-type', 'Detail Category'],
            width: 130
        },
        {
            id: 'description',
            label: 'Description',
            labelAr: 'الوصف',
            type: 'text',
            required: false,
            description: 'Expense description',
            alternatives: ['Description', 'Details', 'Narrative', 'Notes', 'Purpose', 'Memo'],
            width: 200
        },
        {
            id: 'department',
            label: 'Department',
            labelAr: 'القسم',
            type: 'text',
            required: true,
            description: 'Requesting department',
            alternatives: ['Department', 'Cost Center', 'Business Unit', 'Division'],
            width: 130
        },
        {
            id: 'employee_id',
            label: 'Employee ID',
            labelAr: 'رقم الموظف',
            type: 'text',
            required: true,
            description: 'Requester ID',
            alternatives: ['Employee ID', 'User ID', 'Requester', 'Claimant', 'Submitter'],
            width: 120
        },
        {
            id: 'employee_name',
            label: 'Employee Name',
            labelAr: 'اسم الموظف',
            type: 'text',
            required: false,
            description: 'Requester name',
            alternatives: ['Name', 'Employee Name', 'Requester Name'],
            width: 150
        },
        {
            id: 'vendor',
            label: 'Vendor',
            labelAr: 'المورد',
            type: 'text',
            required: false,
            description: 'Vendor/payee',
            alternatives: ['Vendor', 'Supplier', 'Payee', 'Merchant', 'Provider'],
            width: 150
        },
        {
            id: 'status',
            label: 'Status',
            labelAr: 'الحالة',
            type: 'enum',
            required: true,
            description: 'Approval status',
            alternatives: ['Status', 'State', 'Approval Status', 'Workflow Status'],
            enumValues: [
                { value: 'draft', label: 'Draft', labelAr: 'مسودة' },
                { value: 'pending', label: 'Pending Approval', labelAr: 'قيد الموافقة' },
                { value: 'approved', label: 'Approved', labelAr: 'موافق عليه' },
                { value: 'rejected', label: 'Rejected', labelAr: 'مرفوض' },
                { value: 'paid', label: 'Paid', labelAr: 'مدفوع' }
            ],
            width: 130
        },
        {
            id: 'type',
            label: 'Type',
            labelAr: 'النوع',
            type: 'enum',
            required: true,
            description: 'Fixed or variable',
            alternatives: ['Type', 'Cost Type', 'Expense Nature', 'Classification'],
            enumValues: [
                { value: 'fixed', label: 'Fixed', labelAr: 'ثابت' },
                { value: 'variable', label: 'Variable', labelAr: 'متغير' }
            ],
            width: 100
        },
        {
            id: 'project',
            label: 'Project',
            labelAr: 'المشروع',
            type: 'text',
            required: false,
            description: 'Project reference',
            alternatives: ['Project', 'Project Code', 'Work Order', 'Cost Object'],
            width: 120
        }
    ]
};

// Expense Categories Table Schema
const EXPENSE_CATEGORIES_TABLE: TableSchema = {
    id: 'expense_categories',
    name: 'Categories',
    nameAr: 'الفئات',
    description: 'Expense category definitions and budget limits.',
    descriptionAr: 'تعريفات فئات المصروفات وحدود الميزانية.',
    columns: [
        {
            id: 'category_id',
            label: 'Category ID',
            labelAr: 'رقم الفئة',
            type: 'text',
            required: true,
            description: 'Unique category identifier',
            alternatives: ['Category Number', 'Code', 'Category Code'],
            width: 120
        },
        {
            id: 'category_name',
            label: 'Name',
            labelAr: 'الاسم',
            type: 'text',
            required: true,
            description: 'Category display name',
            alternatives: ['Name', 'Category Name', 'Title', 'Label'],
            width: 180
        },
        {
            id: 'parent_category',
            label: 'Parent Category',
            labelAr: 'الفئة الأم',
            type: 'text',
            required: false,
            description: 'Parent category for hierarchy',
            alternatives: ['Parent', 'Parent Category', 'Main Category'],
            width: 140
        },
        {
            id: 'type',
            label: 'Type',
            labelAr: 'النوع',
            type: 'enum',
            required: true,
            description: 'Fixed or variable',
            alternatives: ['Type', 'Category Type', 'Nature'],
            enumValues: [
                { value: 'fixed', label: 'Fixed', labelAr: 'ثابت' },
                { value: 'variable', label: 'Variable', labelAr: 'متغير' }
            ],
            width: 100
        },
        {
            id: 'budget_limit',
            label: 'Budget Limit',
            labelAr: 'حد الميزانية',
            type: 'decimal',
            required: false,
            description: 'Monthly budget limit',
            alternatives: ['Limit', 'Budget', 'Cap', 'Maximum'],
            width: 120
        },
        {
            id: 'gl_account',
            label: 'GL Account',
            labelAr: 'حساب دفتر الأستاذ',
            type: 'text',
            required: false,
            description: 'General ledger account',
            alternatives: ['GL Account', 'Account Number', 'Ledger Code'],
            width: 120
        },
        {
            id: 'active',
            label: 'Active',
            labelAr: 'نشط',
            type: 'boolean',
            required: true,
            description: 'Is category active',
            alternatives: ['Active', 'Enabled', 'Live'],
            width: 80
        }
    ]
};

// Expense Budgets Table Schema
const EXPENSE_BUDGETS_TABLE: TableSchema = {
    id: 'expense_budgets',
    name: 'Budgets',
    nameAr: 'الميزانيات',
    description: 'Budget allocations by department and period.',
    descriptionAr: 'تخصيصات الميزانية حسب القسم والفترة.',
    columns: [
        {
            id: 'budget_id',
            label: 'Budget ID',
            labelAr: 'رقم الميزانية',
            type: 'text',
            required: true,
            description: 'Unique budget identifier',
            alternatives: ['Budget Number', 'Budget Code', 'Allocation Number'],
            width: 120
        },
        {
            id: 'period',
            label: 'Period',
            labelAr: 'الفترة',
            type: 'text',
            required: true,
            description: 'Budget period (YYYY-MM or YYYY)',
            alternatives: ['Period', 'Month', 'Year', 'Fiscal Period'],
            width: 100
        },
        {
            id: 'department',
            label: 'Department',
            labelAr: 'القسم',
            type: 'text',
            required: true,
            description: 'Department',
            alternatives: ['Department', 'Cost Center', 'Business Unit'],
            width: 140
        },
        {
            id: 'category',
            label: 'Category',
            labelAr: 'الفئة',
            type: 'text',
            required: false,
            description: 'Category (if category budget)',
            alternatives: ['Category', 'Expense Type'],
            width: 130
        },
        {
            id: 'budget_amount',
            label: 'Budget Amount',
            labelAr: 'مبلغ الميزانية',
            type: 'decimal',
            required: true,
            description: 'Budgeted amount',
            alternatives: ['Budget', 'Allocation', 'Planned', 'Target'],
            width: 130
        },
        {
            id: 'actual_amount',
            label: 'Actual Amount',
            labelAr: 'المبلغ الفعلي',
            type: 'decimal',
            required: false,
            description: 'Actual spent',
            alternatives: ['Actual', 'Spent', 'Expenditure'],
            width: 120
        },
        {
            id: 'variance',
            label: 'Variance',
            labelAr: 'الفرق',
            type: 'decimal',
            required: false,
            description: 'Variance (Actual - Budget)',
            alternatives: ['Variance', 'Difference', 'Over/Under'],
            width: 100
        },
        {
            id: 'status',
            label: 'Status',
            labelAr: 'الحالة',
            type: 'enum',
            required: false,
            description: 'Budget status',
            alternatives: ['Status', 'Health', 'State'],
            enumValues: [
                { value: 'on_track', label: 'On Track', labelAr: 'على المسار' },
                { value: 'at_risk', label: 'At Risk', labelAr: 'في خطر' },
                { value: 'over_budget', label: 'Over Budget', labelAr: 'تجاوز الميزانية' },
                { value: 'under_budget', label: 'Under Budget', labelAr: 'أقل من الميزانية' }
            ],
            width: 120
        }
    ]
};

// Expense Approvals Table Schema
const EXPENSE_APPROVALS_TABLE: TableSchema = {
    id: 'expense_approvals',
    name: 'Approvals',
    nameAr: 'الموافقات',
    description: 'Expense approval workflow tracking.',
    descriptionAr: 'تتبع سير عمل الموافقة على المصروفات.',
    columns: [
        {
            id: 'approval_id',
            label: 'Approval ID',
            labelAr: 'رقم الموافقة',
            type: 'text',
            required: true,
            description: 'Unique approval identifier',
            alternatives: ['Approval Number', 'Workflow Number', 'Task Number'],
            width: 120
        },
        {
            id: 'expense_id',
            label: 'Expense ID',
            labelAr: 'رقم المصروف',
            type: 'text',
            required: true,
            description: 'Expense reference',
            alternatives: ['Expense Number', 'Claim Number'],
            width: 120
        },
        {
            id: 'approver_id',
            label: 'Approver ID',
            labelAr: 'رقم المعتمد',
            type: 'text',
            required: true,
            description: 'Approver ID',
            alternatives: ['Approver', 'Reviewer', 'Authorizer', 'Manager ID'],
            width: 120
        },
        {
            id: 'approver_name',
            label: 'Approver Name',
            labelAr: 'اسم المعتمد',
            type: 'text',
            required: false,
            description: 'Approver name',
            alternatives: ['Name', 'Approver Name', 'Manager Name'],
            width: 150
        },
        {
            id: 'approval_level',
            label: 'Level',
            labelAr: 'المستوى',
            type: 'number',
            required: true,
            description: 'Approval level (1, 2, 3...)',
            alternatives: ['Level', 'Step', 'Stage', 'Tier'],
            width: 80
        },
        {
            id: 'submission_date',
            label: 'Submitted',
            labelAr: 'تاريخ التقديم',
            type: 'date',
            required: true,
            description: 'When submitted for approval',
            alternatives: ['Submitted', 'Submission Date', 'Request Date'],
            width: 120
        },
        {
            id: 'approval_date',
            label: 'Approved',
            labelAr: 'تاريخ الموافقة',
            type: 'date',
            required: false,
            description: 'When approved/rejected',
            alternatives: ['Approval Date', 'Action Date', 'Decision Date'],
            width: 120
        },
        {
            id: 'status',
            label: 'Status',
            labelAr: 'الحالة',
            type: 'enum',
            required: true,
            description: 'Approval status',
            alternatives: ['Status', 'Decision', 'Outcome'],
            enumValues: [
                { value: 'pending', label: 'Pending', labelAr: 'قيد الانتظار' },
                { value: 'approved', label: 'Approved', labelAr: 'موافق عليه' },
                { value: 'rejected', label: 'Rejected', labelAr: 'مرفوض' },
                { value: 'returned', label: 'Returned', labelAr: 'مرتجع' }
            ],
            width: 100
        },
        {
            id: 'amount',
            label: 'Amount',
            labelAr: 'المبلغ',
            type: 'decimal',
            required: true,
            description: 'Amount for approval',
            alternatives: ['Amount', 'Value'],
            width: 110
        },
        {
            id: 'comments',
            label: 'Comments',
            labelAr: 'التعليقات',
            type: 'text',
            required: false,
            description: 'Approver comments',
            alternatives: ['Comments', 'Notes', 'Remarks', 'Reason'],
            width: 200
        }
    ]
};

// All Finance/Expenses Tables
const EXPENSES_TABLES: TableSchema[] = [
    EXPENSES_TABLE,
    EXPENSE_CATEGORIES_TABLE,
    EXPENSE_BUDGETS_TABLE,
    EXPENSE_APPROVALS_TABLE
];

// Main Component
export const ExpensesDeptData: React.FC = () => {
    return (
        <DeptDataView
            departmentId="expenses"
            departmentName="Expenses"
            departmentNameAr="المصروفات"
            tables={EXPENSES_TABLES}
        />
    );
};

export default ExpensesDeptData;
