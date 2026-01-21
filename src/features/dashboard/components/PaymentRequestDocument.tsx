import React from 'react';

/**
 * Escape HTML special characters to prevent XSS
 */
const escapeHTML = (str: string): string => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

export interface PaymentRequestData {
    vendorName: string;
    department: string;
    amountWithoutTax: number;
    taxAmount: number;
    totalAmount: number;
    description: string;
    paymentType: string;
    typeDate: string;
    logo: string | null;
    documents: string;
    date: string;
}

interface PaymentRequestDocumentProps {
    data: PaymentRequestData;
}

const departmentLabels: Record<string, { en: string; ar: string }> = {
    hr: { en: 'Human Resources', ar: 'الموارد البشرية' },
    finance: { en: 'Finance', ar: 'المالية' },
    it: { en: 'IT', ar: 'تقنية المعلومات' },
    operations: { en: 'Operations', ar: 'العمليات' },
    sales: { en: 'Sales', ar: 'المبيعات' },
    marketing: { en: 'Marketing', ar: 'التسويق' },
    procurement: { en: 'Procurement', ar: 'المشتريات' },
    warehouse: { en: 'Warehouse', ar: 'المستودعات' },
    production: { en: 'Production', ar: 'الإنتاج' },
    quality: { en: 'Quality', ar: 'الجودة' },
};

const typeLabels: Record<string, { en: string; ar: string }> = {
    purchase_order: { en: 'Purchase Order', ar: 'أمر شراء' },
    service: { en: 'Service', ar: 'خدمة' },
    urgent: { en: 'Urgent', ar: 'عاجل' },
};

export const PaymentRequestDocument: React.FC<PaymentRequestDocumentProps> = ({ data }) => {
    const getDepartmentLabel = (key: string, lang: 'en' | 'ar') =>
        departmentLabels[key]?.[lang] || key;

    const getTypeLabel = (key: string, lang: 'en' | 'ar') =>
        typeLabels[key]?.[lang] || key;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\//g, '-');
    };

    const formatNumber = (num: number): string => {
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div
            className="bg-white p-6 print:p-4"
            style={{
                fontFamily: 'Arial, sans-serif',
                direction: 'rtl',
                width: '100%',
                maxWidth: '210mm',
                minHeight: '297mm',
                margin: '0 auto',
                fontSize: '11px'
            }}
        >
            {/* Header - Centered Logo */}
            <div className="text-center border-b-2 border-gray-300 pb-4 mb-4">
                {/* Logo Center */}
                <div className="flex justify-center mb-3">
                    <div className="w-24 h-20 flex items-center justify-center">
                        {data.logo ? (
                            <img src={data.logo} alt="Company Logo" className="max-h-full max-w-full object-contain" />
                        ) : (
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-800">فايڤ</div>
                                <div className="text-xs text-gray-600 font-bold">view</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Company Name Below Logo */}
                <h1 className="text-xl font-bold text-gray-800 mb-1">
                    مصنع العنوان الاول للمياه
                </h1>
                <h2 className="text-sm text-gray-700 font-semibold">
                    طلب صرف نقدية / عهدة
                </h2>
                <h3 className="text-xs text-gray-600">
                    Claim & Petty Cash Form
                </h3>
            </div>

            {/* Date and Info Section */}
            <div className="flex justify-between items-baseline mb-3 text-sm">
                <div className="flex items-baseline gap-2">
                    <span className="text-gray-700">الاسم Name:</span>
                    <span className="border-b border-gray-400 min-w-[150px] px-2 pb-0.5 text-gray-900 font-medium">
                        {data.vendorName}
                    </span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-gray-700">Date: التاريخ</span>
                    <span className="border-b border-gray-400 min-w-[100px] px-2 pb-0.5 text-gray-900 font-medium">
                        {formatDate(data.date)}
                    </span>
                </div>
            </div>

            <div className="flex justify-start items-baseline mb-5 text-sm">
                <div className="flex items-baseline gap-2">
                    <span className="text-gray-700">الإدارة Dep:</span>
                    <span className="border-b border-gray-400 min-w-[150px] px-2 pb-0.5 text-gray-900 font-medium">
                        {getDepartmentLabel(data.department, 'ar')} / {getDepartmentLabel(data.department, 'en')}
                    </span>
                </div>
            </div>

            {/* Main Table */}
            <table className="w-full border-collapse border border-gray-400 mb-4 text-xs">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-gray-400 p-2 text-center" style={{ width: '10%' }}>
                            <div>الفرع</div>
                            <div className="text-[10px] text-gray-600">Branch</div>
                        </th>
                        <th className="border border-gray-400 p-2 text-center" style={{ width: '10%' }}>
                            <div>التاريخ</div>
                            <div className="text-[10px] text-gray-600">Date</div>
                        </th>
                        <th className="border border-gray-400 p-2 text-center" style={{ width: '12%' }}>
                            <div>نوع المستند</div>
                            <div className="text-[10px] text-gray-600">type</div>
                        </th>
                        <th className="border border-gray-400 p-2 text-center" style={{ width: '15%' }}>
                            <div>مستند الموثق المرفق</div>
                            <div className="text-[10px] text-gray-600">Documents</div>
                        </th>
                        <th className="border border-gray-400 p-2 text-center" style={{ width: '38%' }}>
                            <div>البيان</div>
                            <div className="text-[10px] text-gray-600">Description</div>
                        </th>
                        <th className="border border-gray-400 p-2 text-center" style={{ width: '15%' }}>
                            <div>المبلغ</div>
                            <div className="text-[10px] text-gray-600">Amount</div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {/* Main Data Row */}
                    <tr>
                        <td className="border border-gray-400 p-2 text-center">-</td>
                        <td className="border border-gray-400 p-2 text-center">{formatDate(data.typeDate)}</td>
                        <td className="border border-gray-400 p-2 text-center">
                            {getTypeLabel(data.paymentType, 'ar')}
                        </td>
                        <td className="border border-gray-400 p-2 text-center">{data.documents || '-'}</td>
                        <td className="border border-gray-400 p-2 text-right pr-3">
                            {data.description || '-'}
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-medium">
                            {formatNumber(data.amountWithoutTax)}
                        </td>
                    </tr>

                    {/* Tax Row */}
                    <tr>
                        <td className="border border-gray-400 p-2 text-center"></td>
                        <td className="border border-gray-400 p-2 text-center"></td>
                        <td className="border border-gray-400 p-2 text-center"></td>
                        <td className="border border-gray-400 p-2 text-center"></td>
                        <td className="border border-gray-400 p-2 text-right pr-3 font-medium">
                            ضريبة 15%
                        </td>
                        <td className="border border-gray-400 p-2 text-center">
                            {formatNumber(data.taxAmount)}
                        </td>
                    </tr>

                    {/* Empty rows for more entries */}
                    {[1, 2, 3].map((_, idx) => (
                        <tr key={idx} style={{ height: '30px' }}>
                            <td className="border border-gray-400 p-2"></td>
                            <td className="border border-gray-400 p-2"></td>
                            <td className="border border-gray-400 p-2"></td>
                            <td className="border border-gray-400 p-2"></td>
                            <td className="border border-gray-400 p-2"></td>
                            <td className="border border-gray-400 p-2"></td>
                        </tr>
                    ))}

                    {/* Total Row */}
                    <tr className="bg-gray-50">
                        <td colSpan={5} className="border border-gray-400 p-2 text-left font-bold">
                            <span className="ml-4">Total Amount</span>
                            <span className="mr-4">إجمالي المبلغ</span>
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold text-gray-900 text-sm">
                            {formatNumber(data.totalAmount)}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Approval Section */}
            <table className="w-full border-collapse border border-gray-400 mb-6 text-xs">
                <tbody>
                    <tr className="bg-gray-50">
                        <td className="border border-gray-400 p-3 text-center" style={{ width: '25%' }}>
                            <div className="font-semibold mb-1">طالب الصرف</div>
                            <div className="text-[10px] text-gray-600">Requester</div>
                        </td>
                        <td className="border border-gray-400 p-3 text-center" style={{ width: '25%' }}>
                            <div className="font-semibold mb-1">المدير المباشر</div>
                            <div className="text-[10px] text-gray-600">Direct Manager</div>
                        </td>
                        <td className="border border-gray-400 p-3 text-center" style={{ width: '25%' }}>
                            <div className="font-semibold mb-1">مدير الإدارة</div>
                            <div className="text-[10px] text-gray-600">Dep. Manager</div>
                        </td>
                        <td className="border border-gray-400 p-3 text-center" style={{ width: '25%' }}>
                            <div className="font-semibold mb-1">الاعتماد</div>
                            <div className="text-[10px] text-gray-600">Approval</div>
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-gray-400 p-4 h-16"></td>
                        <td className="border border-gray-400 p-4 h-16"></td>
                        <td className="border border-gray-400 p-4 h-16"></td>
                        <td className="border border-gray-400 p-4 h-16"></td>
                    </tr>
                </tbody>
            </table>

            {/* Finance Section */}
            <div className="border border-gray-400 p-4 mb-4">
                <div className="text-center font-bold text-sm mb-4 pb-2 border-b border-gray-300">
                    <span>خاص للاستخدام الإدارة المالية</span>
                    <span className="mx-2">|</span>
                    <span className="text-gray-600">Fill By Finance</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                    {/* Treasury Secretary */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-700">المبلغ / أمين الخزينة:</span>
                        <span className="flex-1 border-b border-gray-400"></span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600" dir="ltr">
                        <span>Dear Secretary of the Treasury:</span>
                        <span className="flex-1 border-b border-gray-400"></span>
                    </div>
                </div>

                <div className="text-xs mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-700">يرجى دفع / ارجاع مصروف سابق:</span>
                        <span className="flex-1 border-b border-gray-400"></span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-700">دون تحقق من صحة الحساب</span>
                        <span className="mr-2">only:</span>
                        <span className="flex-1 border-b border-gray-400"></span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600" dir="ltr">
                        <span>Please do necessary of amount payment</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs mt-6">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-700">المحاسب</span>
                        <span className="flex-1 border-b border-gray-400"></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-700">رئيس الحسابات</span>
                        <span className="flex-1 border-b border-gray-400"></span>
                    </div>
                </div>

                <div className="flex justify-between items-center text-xs mt-6 pt-4 border-t border-gray-300">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-700">TO Mr:</span>
                        <span className="border-b border-gray-400 min-w-[100px]"></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-700">According to the above approved</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold">CFO</span>
                    </div>
                </div>
            </div>

            {/* Page Number / Watermark */}
            <div className="text-center text-gray-300 text-6xl font-light mt-8 opacity-20">
                Page 1
            </div>

        </div>
    );
};

// Generate standalone HTML for printing in a new window
export const generatePrintHTML = (data: PaymentRequestData): string => {
    const getDepartmentLabel = (key: string, lang: 'en' | 'ar') =>
        departmentLabels[key]?.[lang] || key;

    const getTypeLabel = (key: string, lang: 'en' | 'ar') =>
        typeLabels[key]?.[lang] || key;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\//g, '-');
    };

    const formatNumber = (num: number): string => {
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Escape user data to prevent XSS
    const safeVendorName = escapeHTML(data.vendorName);
    const safeDescription = escapeHTML(data.description || '-');
    const safeDocuments = escapeHTML(data.documents || '-');
    const safeLogo = data.logo ? escapeHTML(data.logo) : null;

    const logoHTML = safeLogo
        ? `<img src="${safeLogo}" alt="Company Logo" style="max-height: 100%; max-width: 100%; object-fit: contain;" />`
        : `<div style="text-align: center;"><div style="font-size: 24px; font-weight: bold; color: #1f2937;">فايڤ</div><div style="font-size: 12px; color: #4b5563; font-weight: bold;">view</div></div>`;

    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>طلب صرف نقدية - Payment Request</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            direction: rtl;
            background: white;
            padding: 20px;
            font-size: 11px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        @page {
            size: A4;
            margin: 10mm;
        }
        @media print {
            body { padding: 0; }
        }
        .container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #d1d5db;
            padding-bottom: 16px;
            margin-bottom: 16px;
        }
        .logo-box {
            width: 96px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 12px auto;
        }
        .company-name {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 4px;
        }
        .form-title {
            font-size: 14px;
            color: #374151;
            font-weight: 600;
        }
        .form-subtitle {
            font-size: 12px;
            color: #4b5563;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
            font-size: 12px;
        }
        .info-item {
            display: flex;
            align-items: baseline;
            gap: 8px;
        }
        .info-label {
            color: #374151;
        }
        .info-value {
            border-bottom: 1px solid #9ca3af;
            min-width: 150px;
            padding: 0 8px 2px 8px;
            color: #111827;
            font-weight: 500;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            font-size: 11px;
        }
        th, td {
            border: 1px solid #9ca3af;
            padding: 8px;
            text-align: center;
        }
        th {
            background-color: #f3f4f6;
        }
        .th-sub {
            font-size: 10px;
            color: #4b5563;
        }
        .text-right { text-align: right; padding-right: 12px; }
        .font-medium { font-weight: 500; }
        .font-bold { font-weight: bold; }
        .total-row {
            background-color: #f9fafb;
        }
        .total-amount {
            color: #111827;
            font-size: 14px;
        }
        .approval-header {
            background-color: #f9fafb;
        }
        .signature-cell {
            height: 64px;
        }
        .finance-section {
            border: 1px solid #9ca3af;
            padding: 16px;
            margin-bottom: 16px;
        }
        .finance-title {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #d1d5db;
        }
        .finance-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            font-size: 11px;
        }
        .finance-line {
            flex: 1;
            border-bottom: 1px solid #9ca3af;
            min-height: 1px;
        }
        .finance-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .finance-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #d1d5db;
            font-size: 11px;
        }
        .watermark {
            text-align: center;
            color: #d1d5db;
            font-size: 48px;
            font-weight: 300;
            margin-top: 32px;
            opacity: 0.3;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header - Centered Logo -->
        <div class="header">
            <div class="logo-box">${logoHTML}</div>
            <div class="company-name">مصنع العنوان الاول للمياه</div>
            <div class="form-title">طلب صرف نقدية / عهدة</div>
            <div class="form-subtitle">Claim & Petty Cash Form</div>
        </div>

        <!-- Info Section -->
        <div class="info-row">
            <div class="info-item">
                <span class="info-label">الاسم Name:</span>
                <span class="info-value">${safeVendorName}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Date: التاريخ</span>
                <span class="info-value" style="min-width: 100px;">${formatDate(data.date)}</span>
            </div>
        </div>

        <div class="info-row" style="justify-content: flex-start;">
            <div class="info-item">
                <span class="info-label">الإدارة Dep:</span>
                <span class="info-value">${getDepartmentLabel(data.department, 'ar')} / ${getDepartmentLabel(data.department, 'en')}</span>
            </div>
        </div>

        <!-- Main Table -->
        <table>
            <thead>
                <tr>
                    <th style="width: 10%;">
                        <div>الفرع</div>
                        <div class="th-sub">Branch</div>
                    </th>
                    <th style="width: 10%;">
                        <div>التاريخ</div>
                        <div class="th-sub">Date</div>
                    </th>
                    <th style="width: 12%;">
                        <div>نوع المستند</div>
                        <div class="th-sub">type</div>
                    </th>
                    <th style="width: 15%;">
                        <div>مستند الموثق المرفق</div>
                        <div class="th-sub">Documents</div>
                    </th>
                    <th style="width: 38%;">
                        <div>البيان</div>
                        <div class="th-sub">Description</div>
                    </th>
                    <th style="width: 15%;">
                        <div>المبلغ</div>
                        <div class="th-sub">Amount</div>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>-</td>
                    <td>${formatDate(data.typeDate)}</td>
                    <td>${getTypeLabel(data.paymentType, 'ar')}</td>
                    <td>${safeDocuments}</td>
                    <td class="text-right">${safeDescription}</td>
                    <td class="font-medium">${formatNumber(data.amountWithoutTax)}</td>
                </tr>
                <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td class="text-right font-medium">ضريبة 15%</td>
                    <td>${formatNumber(data.taxAmount)}</td>
                </tr>
                <tr style="height: 30px;"><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                <tr style="height: 30px;"><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                <tr style="height: 30px;"><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                <tr class="total-row">
                    <td colspan="5" style="text-align: left;" class="font-bold">
                        <span style="margin-left: 16px;">Total Amount</span>
                        <span style="margin-right: 16px;">إجمالي المبلغ</span>
                    </td>
                    <td class="font-bold total-amount">${formatNumber(data.totalAmount)}</td>
                </tr>
            </tbody>
        </table>

        <!-- Approval Section -->
        <table>
            <tbody>
                <tr class="approval-header">
                    <td style="width: 25%;">
                        <div class="font-bold" style="margin-bottom: 4px;">طالب الصرف</div>
                        <div class="th-sub">Requester</div>
                    </td>
                    <td style="width: 25%;">
                        <div class="font-bold" style="margin-bottom: 4px;">المدير المباشر</div>
                        <div class="th-sub">Direct Manager</div>
                    </td>
                    <td style="width: 25%;">
                        <div class="font-bold" style="margin-bottom: 4px;">مدير الإدارة</div>
                        <div class="th-sub">Dep. Manager</div>
                    </td>
                    <td style="width: 25%;">
                        <div class="font-bold" style="margin-bottom: 4px;">الاعتماد</div>
                        <div class="th-sub">Approval</div>
                    </td>
                </tr>
                <tr>
                    <td class="signature-cell"></td>
                    <td class="signature-cell"></td>
                    <td class="signature-cell"></td>
                    <td class="signature-cell"></td>
                </tr>
            </tbody>
        </table>

        <!-- Finance Section -->
        <div class="finance-section">
            <div class="finance-title">
                <span>خاص للاستخدام الإدارة المالية</span>
                <span style="margin: 0 8px;">|</span>
                <span style="color: #4b5563;">Fill By Finance</span>
            </div>

            <div class="finance-grid">
                <div class="finance-row">
                    <span>المبلغ / أمين الخزينة:</span>
                    <span class="finance-line"></span>
                </div>
                <div class="finance-row" dir="ltr">
                    <span>Dear Secretary of the Treasury:</span>
                    <span class="finance-line"></span>
                </div>
            </div>

            <div class="finance-row">
                <span>يرجى دفع / ارجاع مصروف سابق:</span>
                <span class="finance-line"></span>
            </div>

            <div class="finance-grid">
                <div class="finance-row">
                    <span>دون تحقق من صحة الحساب only:</span>
                    <span class="finance-line"></span>
                </div>
                <div class="finance-row" dir="ltr">
                    <span>Please do necessary of amount payment</span>
                </div>
            </div>

            <div class="finance-grid" style="margin-top: 24px;">
                <div class="finance-row">
                    <span>المحاسب</span>
                    <span class="finance-line"></span>
                </div>
                <div class="finance-row">
                    <span>رئيس الحسابات</span>
                    <span class="finance-line"></span>
                </div>
            </div>

            <div class="finance-footer">
                <div class="finance-row" style="margin: 0;">
                    <span>TO Mr:</span>
                    <span style="border-bottom: 1px solid #9ca3af; min-width: 100px;"></span>
                </div>
                <span>According to the above approved</span>
                <span class="font-bold">CFO</span>
            </div>
        </div>

        <div class="watermark">Page 1</div>
    </div>
</body>
</html>
    `;
};
