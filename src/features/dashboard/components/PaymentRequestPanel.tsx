import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../../contexts/AppContext';
import { X, Upload, FilePdf, DownloadSimple, Eye, Plus, Trash } from 'phosphor-react';
import { PaymentRequestDocument, PaymentRequestData, generatePrintHTML } from './PaymentRequestDocument';
import { appLogger } from '../../../utils/logger';

interface MaterialItem {
    id: string;
    material: string;
    quantity: number;
    unitPrice: string; // Store as string to allow decimal input
}

interface PaymentRequestPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PaymentRequestPanel: React.FC<PaymentRequestPanelProps> = ({
    isOpen,
    onClose
}) => {
    const { language } = useAppContext();
    const isRTL = language === 'ar';
    const fileInputRef = useRef<HTMLInputElement>(null);
    const materialsTableRef = useRef<HTMLDivElement>(null);

    // Form state
    const [vendorName, setVendorName] = useState('');
    const [department, setDepartment] = useState('');
    const [description, setDescription] = useState('');
    const [paymentType, setPaymentType] = useState('');
    const [typeDate, setTypeDate] = useState(new Date().toISOString().split('T')[0]);
    const [logo, setLogo] = useState<string | null>(null);
    const [logoFileName, setLogoFileName] = useState('');
    const [documents, setDocuments] = useState('');

    // Materials state
    const [materials, setMaterials] = useState<MaterialItem[]>([]);

    // Preview state
    const [showPreview, setShowPreview] = useState(false);

    // Format number with commas
    const formatNumber = (num: number | string): string => {
        const n = typeof num === 'string' ? parseFloat(num) : num;
        if (isNaN(n)) return '0.00';
        return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Calculate totals from materials
    const calculateMaterialTotals = (item: MaterialItem) => {
        const price = parseFloat(item.unitPrice) || 0;
        const totalWithoutVat = item.quantity * price;
        const vat = totalWithoutVat * 0.15;
        const totalWithVat = totalWithoutVat + vat;
        return { totalWithoutVat, vat, totalWithVat };
    };

    const grandTotalWithoutVat = materials.reduce((sum, item) => {
        const price = parseFloat(item.unitPrice) || 0;
        return sum + (item.quantity * price);
    }, 0);

    const grandVat = grandTotalWithoutVat * 0.15;
    const grandTotalWithVat = grandTotalWithoutVat + grandVat;

    // Add new material row
    const addMaterial = () => {
        setMaterials([
            ...materials,
            {
                id: Date.now().toString(),
                material: '',
                quantity: 1,
                unitPrice: ''
            }
        ]);
    };

    // Update material
    const updateMaterial = (id: string, field: keyof MaterialItem, value: string | number) => {
        setMaterials(materials.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    // Remove material
    const removeMaterial = (id: string) => {
        setMaterials(materials.filter(item => item.id !== id));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = () => {
        if (!vendorName.trim() || !department.trim()) {
            return;
        }
        // Need either materials or a total > 0
        if (materials.length === 0 && grandTotalWithVat === 0) {
            return;
        }
        setShowPreview(true);
    };

    // Generate materials table as image
    const generateMaterialsTableImage = async (): Promise<string | null> => {
        if (materials.length === 0) return null;

        const html2canvas = (await import('html2canvas')).default;

        // Create a temporary container for the table
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.background = 'white';
        container.style.padding = '24px';

        const logoHTML = logo
            ? `<img src="${logo}" alt="Logo" style="max-height: 40px; max-width: 80px; object-fit: contain;" />`
            : `<div style="font-size: 16px; font-weight: bold; color: #1f2937;">فايڤ<div style="font-size: 10px; color: #6b7280;">view</div></div>`;

        container.innerHTML = `
            <div style="font-family: Arial, sans-serif; min-width: 650px; padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        ${logoHTML}
                        <span style="font-size: 14px; font-weight: 600; color: #1f2937;">${vendorName || '-'}</span>
                    </div>
                    <span style="font-size: 12px; color: #6b7280;">${typeDate}</span>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="border: 1px solid #e5e7eb; padding: 8px 10px; text-align: ${isRTL ? 'right' : 'left'}; font-weight: 600; color: #374151;">
                                ${isRTL ? 'المادة' : 'Material'}
                            </th>
                            <th style="border: 1px solid #e5e7eb; padding: 8px 10px; text-align: center; font-weight: 600; color: #374151;">
                                ${isRTL ? 'الكمية' : 'Qty'}
                            </th>
                            <th style="border: 1px solid #e5e7eb; padding: 8px 10px; text-align: center; font-weight: 600; color: #374151;">
                                ${isRTL ? 'السعر' : 'Unit Price'}
                            </th>
                            <th style="border: 1px solid #e5e7eb; padding: 8px 10px; text-align: center; font-weight: 600; color: #374151;">
                                ${isRTL ? 'بدون ض' : 'Excl. VAT'}
                            </th>
                            <th style="border: 1px solid #e5e7eb; padding: 8px 10px; text-align: center; font-weight: 600; color: #374151;">
                                ${isRTL ? 'مع ض' : 'Incl. VAT'}
                            </th>
                            <th style="border: 1px solid #e5e7eb; padding: 8px 10px; text-align: ${isRTL ? 'right' : 'left'}; font-weight: 600; color: #374151;">
                                ${isRTL ? 'الوصف' : 'Description'}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${materials.map((item, index) => {
                            const totals = calculateMaterialTotals(item);
                            const price = parseFloat(item.unitPrice) || 0;
                            return `
                                <tr>
                                    <td style="border: 1px solid #e5e7eb; padding: 8px 10px; text-align: ${isRTL ? 'right' : 'left'}; color: #1f2937;">
                                        ${item.material || '-'}
                                    </td>
                                    <td style="border: 1px solid #e5e7eb; padding: 8px 10px; text-align: center; color: #1f2937;">
                                        ${item.quantity}
                                    </td>
                                    <td style="border: 1px solid #e5e7eb; padding: 8px 10px; text-align: center; color: #1f2937;">
                                        ${formatNumber(price)}
                                    </td>
                                    <td style="border: 1px solid #e5e7eb; padding: 8px 10px; text-align: center; color: #1f2937;">
                                        ${formatNumber(totals.totalWithoutVat)}
                                    </td>
                                    <td style="border: 1px solid #e5e7eb; padding: 8px 10px; text-align: center; font-weight: 500; color: #1f2937;">
                                        ${formatNumber(totals.totalWithVat)}
                                    </td>
                                    <td style="border: 1px solid #e5e7eb; padding: 8px 10px; text-align: ${isRTL ? 'right' : 'left'}; color: #1f2937;">
                                        ${index === 0 ? (description || '-') : ''}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                        <tr style="background: #f9fafb; font-weight: 600;">
                            <td colspan="3" style="border: 1px solid #e5e7eb; padding: 8px 10px; text-align: ${isRTL ? 'left' : 'right'}; color: #1f2937;">
                                ${isRTL ? 'الإجمالي' : 'Total'}
                            </td>
                            <td style="border: 1px solid #e5e7eb; padding: 8px 10px; text-align: center; color: #1f2937;">
                                ${formatNumber(grandTotalWithoutVat)}
                            </td>
                            <td style="border: 1px solid #e5e7eb; padding: 8px 10px; text-align: center; color: #1f2937; font-weight: 700;">
                                ${formatNumber(grandTotalWithVat)}
                            </td>
                            <td style="border: 1px solid #e5e7eb; padding: 8px 10px;"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        document.body.appendChild(container);

        try {
            const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true
            });

            const imageData = canvas.toDataURL('image/png');
            document.body.removeChild(container);
            return imageData;
        } catch (error) {
            document.body.removeChild(container);
            appLogger.error('Failed to generate materials table image:', error);
            return null;
        }
    };

    const handleDownloadPDF = async () => {
        // Dynamically import html2pdf for better bundle size
        const html2pdf = (await import('html2pdf.js')).default;

        // Create a temporary container for the HTML
        const container = document.createElement('div');
        container.innerHTML = generatePrintHTML(formData);
        document.body.appendChild(container);

        const element = container.querySelector('.container') as HTMLElement;

        await html2pdf()
            .set({
                margin: 10,
                filename: `payment-request-${formData.vendorName}-${formData.date}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            })
            .from(element)
            .save();

        document.body.removeChild(container);

        // If there are materials, also download the table image
        if (materials.length > 0) {
            const imageData = await generateMaterialsTableImage();
            if (imageData) {
                const link = document.createElement('a');
                link.download = `materials-description-${formData.vendorName}-${formData.date}.png`;
                link.href = imageData;
                link.click();
            }
        }
    };

    const resetForm = () => {
        setVendorName('');
        setDepartment('');
        setDescription('');
        setPaymentType('');
        setTypeDate(new Date().toISOString().split('T')[0]);
        setLogo(null);
        setLogoFileName('');
        setDocuments('');
        setMaterials([]);
        setShowPreview(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const formData: PaymentRequestData = {
        vendorName,
        department,
        amountWithoutTax: grandTotalWithoutVat,
        taxAmount: grandVat,
        totalAmount: grandTotalWithVat,
        description,
        paymentType,
        typeDate,
        logo,
        documents,
        date: new Date().toISOString().split('T')[0]
    };

    const paymentTypes = [
        { value: 'purchase_order', labelEn: 'Purchase Order', labelAr: 'أمر شراء' },
        { value: 'service', labelEn: 'Service', labelAr: 'خدمة' },
        { value: 'urgent', labelEn: 'Urgent', labelAr: 'عاجل' },
    ];

    const departments = [
        { value: 'hr', labelEn: 'Human Resources', labelAr: 'الموارد البشرية' },
        { value: 'finance', labelEn: 'Finance', labelAr: 'المالية' },
        { value: 'it', labelEn: 'IT', labelAr: 'تقنية المعلومات' },
        { value: 'operations', labelEn: 'Operations', labelAr: 'العمليات' },
        { value: 'sales', labelEn: 'Sales', labelAr: 'المبيعات' },
        { value: 'marketing', labelEn: 'Marketing', labelAr: 'التسويق' },
        { value: 'procurement', labelEn: 'Procurement', labelAr: 'المشتريات' },
        { value: 'warehouse', labelEn: 'Warehouse', labelAr: 'المستودعات' },
        { value: 'production', labelEn: 'Production', labelAr: 'الإنتاج' },
        { value: 'quality', labelEn: 'Quality', labelAr: 'الجودة' },
    ];

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Panel */}
                    <motion.div
                        className="fixed inset-0 z-[9999] flex justify-end bg-transparent print:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleClose}
                    >
                        <motion.div
                            className="bg-white w-full max-w-[480px] h-full shadow-2xl overflow-hidden flex flex-col border-s border-gray-100"
                            initial={{ x: isRTL ? '-100%' : '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: isRTL ? '-100%' : '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {!showPreview ? (
                                // Form View
                                <form
                                    className="flex flex-col h-full"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleGenerate();
                                    }}
                                >
                                    {/* Header */}
                                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-gray-700">receipt_long</span>
                                            {isRTL ? 'طلب صرف نقدية' : 'Payment Request'}
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="text-gray-400 hover:text-gray-600 rounded-full p-2 hover:bg-gray-100 transition-colors"
                                        >
                                            <X size={20} weight="bold" />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 space-y-4 flex-1 overflow-y-auto custom-scrollbar">

                                        {/* Logo Upload */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                {isRTL ? 'شعار الشركة' : 'Company Logo'}
                                            </label>
                                            <div
                                                className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-gray-400 transition-colors cursor-pointer"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                {logo ? (
                                                    <div className="flex items-center justify-center gap-3">
                                                        <img src={logo} alt="Logo" className="h-12 object-contain" />
                                                        <span className="text-sm text-gray-600">{logoFileName}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-gray-500">
                                                        <Upload size={24} />
                                                        <span className="text-sm">{isRTL ? 'اضغط لرفع الشعار' : 'Click to upload logo'}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleLogoUpload}
                                            />
                                        </div>

                                        {/* Vendor Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                {isRTL ? 'اسم المورد / الاسم' : 'Vendor Name / Name'}
                                            </label>
                                            <input
                                                autoFocus
                                                type="text"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-100 focus:border-gray-900 outline-none transition-all text-gray-900 placeholder-gray-400"
                                                placeholder={isRTL ? 'أدخل اسم المورد' : 'Enter vendor name'}
                                                value={vendorName}
                                                onChange={e => setVendorName(e.target.value)}
                                                required
                                            />
                                        </div>

                                        {/* Department */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                {isRTL ? 'القسم / الإدارة' : 'Department'}
                                            </label>
                                            <select
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-100 focus:border-gray-900 outline-none bg-white"
                                                value={department}
                                                onChange={e => setDepartment(e.target.value)}
                                                required
                                            >
                                                <option value="">{isRTL ? 'اختر القسم' : 'Select department'}</option>
                                                {departments.map(dept => (
                                                    <option key={dept.value} value={dept.value}>
                                                        {isRTL ? dept.labelAr : dept.labelEn}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Payment Type */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                {isRTL ? 'نوع الصرف' : 'Payment Type'}
                                            </label>
                                            <select
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-100 focus:border-gray-900 outline-none bg-white"
                                                value={paymentType}
                                                onChange={e => setPaymentType(e.target.value)}
                                                required
                                            >
                                                <option value="">{isRTL ? 'اختر النوع' : 'Select type'}</option>
                                                {paymentTypes.map(type => (
                                                    <option key={type.value} value={type.value}>
                                                        {isRTL ? type.labelAr : type.labelEn}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Date of Type */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                {isRTL ? 'التاريخ' : 'Date'}
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-100 focus:border-gray-900 outline-none"
                                                value={typeDate}
                                                onChange={e => setTypeDate(e.target.value)}
                                                required
                                            />
                                        </div>

                                        {/* Documents */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                {isRTL ? 'المستندات المرفقة' : 'Documents'}
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-100 focus:border-gray-900 outline-none transition-all text-gray-900 placeholder-gray-400"
                                                placeholder={isRTL ? 'رقم أو وصف المستند' : 'Document number or description'}
                                                value={documents}
                                                onChange={e => setDocuments(e.target.value)}
                                            />
                                        </div>

                                        <hr className="border-gray-100" />

                                        {/* Materials Section */}
                                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold text-gray-700 text-sm">
                                                    {isRTL ? 'المواد' : 'Materials'}
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={addMaterial}
                                                    className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors"
                                                >
                                                    <Plus size={14} weight="bold" />
                                                    {isRTL ? 'إضافة مادة' : 'Add Material'}
                                                </button>
                                            </div>

                                            {materials.length === 0 ? (
                                                <div className="text-center py-4 text-gray-400 text-sm">
                                                    {isRTL ? 'لم يتم إضافة مواد بعد' : 'No materials added yet'}
                                                </div>
                                            ) : (
                                                <div className="space-y-3" ref={materialsTableRef}>
                                                    {/* Table Header */}
                                                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                                                        <div className="col-span-3">{isRTL ? 'المادة' : 'Material'}</div>
                                                        <div className="col-span-3 text-center">{isRTL ? 'الكمية' : 'Qty'}</div>
                                                        <div className="col-span-2 text-center">{isRTL ? 'السعر' : 'Price'}</div>
                                                        <div className="col-span-3 text-center">{isRTL ? 'المجموع' : 'Total'}</div>
                                                        <div className="col-span-1"></div>
                                                    </div>

                                                    {/* Material Rows */}
                                                    {materials.map((item) => {
                                                        const totals = calculateMaterialTotals(item);
                                                        return (
                                                            <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-white rounded-lg p-2 border border-gray-200">
                                                                <div className="col-span-3">
                                                                    <input
                                                                        type="text"
                                                                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:border-gray-400 outline-none"
                                                                        placeholder={isRTL ? 'اسم المادة' : 'Material name'}
                                                                        value={item.material}
                                                                        onChange={e => updateMaterial(item.id, 'material', e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="col-span-3">
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        className="w-full px-2 py-1.5 text-sm text-center border border-gray-200 rounded-lg focus:border-gray-400 outline-none"
                                                                        value={item.quantity}
                                                                        onChange={e => updateMaterial(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                                                    />
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        className="w-full px-2 py-1.5 text-sm text-center border border-gray-200 rounded-lg focus:border-gray-400 outline-none"
                                                                        placeholder="0.00"
                                                                        value={item.unitPrice}
                                                                        onChange={e => updateMaterial(item.id, 'unitPrice', e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="col-span-3 text-xs text-center font-medium text-gray-700">
                                                                    {formatNumber(totals.totalWithVat)}
                                                                </div>
                                                                <div className="col-span-1 flex justify-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeMaterial(item.id)}
                                                                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                                    >
                                                                        <Trash size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Totals */}
                                            {materials.length > 0 && (
                                                <div className="pt-3 border-t border-gray-200 space-y-2">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-500">{isRTL ? 'المجموع بدون ضريبة' : 'Subtotal (excl. VAT)'}</span>
                                                        <span className="font-medium text-gray-700">{formatNumber(grandTotalWithoutVat)} {isRTL ? 'ر.س' : 'SAR'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-500">{isRTL ? 'ضريبة القيمة المضافة (15%)' : 'VAT (15%)'}</span>
                                                        <span className="font-medium text-gray-700">{formatNumber(grandVat)} {isRTL ? 'ر.س' : 'SAR'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                                                        <span className="font-semibold text-gray-700">{isRTL ? 'الإجمالي' : 'Total'}</span>
                                                        <span className="font-bold text-gray-900 text-lg">{formatNumber(grandTotalWithVat)} {isRTL ? 'ر.س' : 'SAR'}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                {isRTL ? 'البيان / الوصف' : 'Description'}
                                            </label>
                                            <textarea
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-100 focus:border-gray-900 outline-none transition-all text-sm min-h-[80px] resize-y"
                                                placeholder={isRTL ? 'أدخل وصف الطلب...' : 'Enter request description...'}
                                                value={description}
                                                onChange={e => setDescription(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
                                        >
                                            {isRTL ? 'إلغاء' : 'Cancel'}
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-5 py-2.5 text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 rounded-xl shadow-lg shadow-gray-300 transition-all hover:-translate-y-0.5 flex items-center gap-2"
                                        >
                                            <Eye size={18} />
                                            {isRTL ? 'معاينة وإنشاء' : 'Preview & Generate'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                // Preview View
                                <div className="flex flex-col h-full">
                                    {/* Header */}
                                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                            <FilePdf size={24} className="text-red-500" />
                                            {isRTL ? 'معاينة النموذج' : 'Form Preview'}
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={() => setShowPreview(false)}
                                            className="text-gray-400 hover:text-gray-600 rounded-full p-2 hover:bg-gray-100 transition-colors"
                                        >
                                            <X size={20} weight="bold" />
                                        </button>
                                    </div>

                                    {/* Preview Content */}
                                    <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
                                        <div className="bg-white shadow-lg mx-auto" style={{ maxWidth: '210mm' }}>
                                            <PaymentRequestDocument data={formData} />
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-between shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setShowPreview(false)}
                                            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
                                        >
                                            {isRTL ? 'رجوع للتعديل' : 'Back to Edit'}
                                        </button>
                                        <div className="flex items-center gap-2">
                                            {materials.length > 0 && (
                                                <span className="text-xs text-gray-500">
                                                    {isRTL ? 'سيتم تحميل PDF + صورة المواد' : 'PDF + Materials image will download'}
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={handleDownloadPDF}
                                                className="px-5 py-2.5 text-sm font-bold text-white bg-gray-800 hover:bg-gray-900 rounded-xl shadow-lg shadow-gray-300 transition-all hover:-translate-y-0.5 flex items-center gap-2"
                                            >
                                                <DownloadSimple size={18} />
                                                {isRTL ? 'تحميل' : 'Download'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
