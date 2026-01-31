import React, { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus,
    Trash,
    Copy,
    Eye,
    PencilSimple,
    DotsSixVertical,
    TextT,
    ListNumbers,
    CheckSquare,
    Calendar,
    User,
    Star,
    Upload,
    Link as LinkIcon,
    Phone,
    Envelope,
    TextAlignLeft,
    ToggleLeft,
    CaretCircleDown,
    X
} from 'phosphor-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { boardLogger } from '@/utils/logger';

// Field Types
type FieldType =
    | 'short_text'
    | 'long_text'
    | 'number'
    | 'email'
    | 'phone'
    | 'url'
    | 'date'
    | 'dropdown'
    | 'checkbox'
    | 'rating'
    | 'file'
    | 'person'
    | 'toggle';

interface FormField {
    id: string;
    type: FieldType;
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    maxRating?: number;
}

interface Form {
    id: string;
    name: string;
    description: string;
    fields: FormField[];
    createdAt: number;
    updatedAt: number;
    responses: FormResponse[];
    settings: {
        submitButtonText: string;
        successMessage: string;
        allowMultipleSubmissions: boolean;
    };
}

interface FormResponse {
    id: string;
    submittedAt: number;
    data: Record<string, any>;
}

interface FormsViewProps {
    roomId: string;
    boardName?: string;
}

// Sortable Field Component
const SortableField: React.FC<{
    field: FormField;
    onUpdate: (id: string, updates: Partial<FormField>) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    t: (key: string) => string;
    getFieldTypeLabel: (type: FieldType) => string;
    getFieldTypeIcon: (type: FieldType) => React.ElementType;
}> = ({ field, onUpdate, onDelete, onDuplicate, t, getFieldTypeLabel, getFieldTypeIcon }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const FieldIcon = getFieldTypeIcon(field.type);

    // Always use translated label for display based on field type
    const displayLabel = getFieldTypeLabel(field.type);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-4 mb-3 ${isDragging ? 'shadow-lg' : 'shadow-sm'}`}
        >
            <div className="flex items-start gap-3">
                {/* Drag Handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="mt-1 p-1 cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                >
                    <DotsSixVertical size={18} weight="bold" />
                </button>

                {/* Field Content */}
                <div className="flex-1 min-w-0">
                    {/* Field Label */}
                    <div className="flex items-center gap-2 mb-2">
                        <FieldIcon size={16} className="text-stone-500 flex-shrink-0" />
                        <span className="flex-1 font-medium text-stone-800 dark:text-stone-200">
                            {displayLabel}
                        </span>
                        <label className="flex items-center gap-1.5 text-xs text-stone-500">
                            <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => onUpdate(field.id, { required: e.target.checked })}
                                className="w-3.5 h-3.5 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                            />
                            {t('forms_required')}
                        </label>
                    </div>

                    {/* Placeholder */}
                    <input
                        type="text"
                        value={field.placeholder || ''}
                        onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
                        className="w-full text-sm text-stone-500 dark:text-stone-400 bg-transparent border-none outline-none focus:ring-0 p-0 mb-2"
                        placeholder={t('forms_placeholder_optional')}
                    />

                    {/* Dropdown Options */}
                    {field.type === 'dropdown' && (
                        <div className="mt-2 space-y-1">
                            <p className="text-xs text-stone-500 mb-1">{t('forms_options_per_line')}</p>
                            <textarea
                                value={(field.options || []).join('\n')}
                                onChange={(e) => onUpdate(field.id, { options: e.target.value.split('\n').filter(Boolean) })}
                                className="w-full text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded p-2 resize-none"
                                rows={3}
                                placeholder={`${t('forms_option')} 1\n${t('forms_option')} 2\n${t('forms_option')} 3`}
                            />
                        </div>
                    )}

                    {/* Rating Max */}
                    {field.type === 'rating' && (
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-stone-500">{t('forms_max_rating')}</span>
                            <select
                                value={field.maxRating || 5}
                                onChange={(e) => onUpdate(field.id, { maxRating: parseInt(e.target.value) })}
                                className="text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded px-2 py-1"
                            >
                                {[3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onDuplicate(field.id)}
                        className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded"
                        title={t('forms_duplicate')}
                    >
                        <Copy size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(field.id)}
                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title={t('delete')}
                    >
                        <Trash size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Form Preview Component
const FormPreview: React.FC<{
    form: Form;
    onClose: () => void;
    t: (key: string) => string;
    isRTL: boolean;
}> = ({ form, onClose, t, isRTL }) => {
    const [values, setValues] = useState<Record<string, any>>({});

    const handleChange = (fieldId: string, value: any) => {
        setValues(prev => ({ ...prev, [fieldId]: value }));
    };

    const renderField = (field: FormField) => {
        const baseInputClass = "w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent";

        switch (field.type) {
            case 'short_text':
            case 'email':
            case 'phone':
            case 'url':
                return (
                    <input
                        type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : 'text'}
                        value={values[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className={baseInputClass}
                        required={field.required}
                    />
                );
            case 'long_text':
                return (
                    <textarea
                        value={values[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className={`${baseInputClass} resize-none`}
                        rows={4}
                        required={field.required}
                    />
                );
            case 'number':
                return (
                    <input
                        type="number"
                        value={values[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className={baseInputClass}
                        required={field.required}
                    />
                );
            case 'date':
                return (
                    <input
                        type="date"
                        value={values[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        className={baseInputClass}
                        required={field.required}
                    />
                );
            case 'dropdown':
                return (
                    <select
                        value={values[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        className={baseInputClass}
                        required={field.required}
                    >
                        <option value="">{field.placeholder || t('forms_select_option')}</option>
                        {(field.options || []).map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
            case 'checkbox':
                return (
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={values[field.id] || false}
                            onChange={(e) => handleChange(field.id, e.target.checked)}
                            className="w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-stone-600 dark:text-stone-400">{field.placeholder || t('forms_check_this')}</span>
                    </label>
                );
            case 'rating':
                const max = field.maxRating || 5;
                return (
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                        {Array.from({ length: max }, (_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleChange(field.id, i + 1)}
                                className="p-0.5"
                            >
                                <Star
                                    size={24}
                                    weight={(values[field.id] || 0) > i ? 'fill' : 'regular'}
                                    className={(values[field.id] || 0) > i ? 'text-yellow-400' : 'text-stone-300'}
                                />
                            </button>
                        ))}
                    </div>
                );
            case 'toggle':
                return (
                    <button
                        type="button"
                        onClick={() => handleChange(field.id, !values[field.id])}
                        className={`relative w-12 h-6 rounded-full transition-colors ${values[field.id] ? 'bg-blue-600' : 'bg-stone-300 dark:bg-stone-600'}`}
                    >
                        <div
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isRTL
                                ? (values[field.id] ? 'right-7' : 'right-1')
                                : (values[field.id] ? 'left-7' : 'left-1')
                                }`}
                        />
                    </button>
                );
            case 'file':
                return (
                    <div className="border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-lg p-4 text-center">
                        <Upload size={24} className="mx-auto mb-2 text-stone-400" />
                        <p className="text-sm text-stone-500">{t('forms_upload_hint')}</p>
                    </div>
                );
            case 'person':
                return (
                    <input
                        type="text"
                        value={values[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={field.placeholder || t('forms_enter_name')}
                        className={baseInputClass}
                        required={field.required}
                    />
                );
            default:
                return null;
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Dark Overlay */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />
            {/* Modal Content */}
            <div className="relative bg-white dark:bg-stone-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                >
                    <X size={20} />
                </button>
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700 p-4 pr-14">
                    <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200">{form.name}</h2>
                    {form.description && (
                        <p className="text-sm text-stone-500 mt-0.5">{form.description}</p>
                    )}
                </div>

                {/* Form Fields */}
                <form className="p-6 space-y-5" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
                    {form.fields.map(field => (
                        <div key={field.id}>
                            <label className={`block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5`}>
                                {field.label}
                                {field.required && <span className={`text-red-500 ${isRTL ? 'mr-1' : 'ml-1'}`}>*</span>}
                            </label>
                            {renderField(field)}
                        </div>
                    ))}

                    <button
                        type="submit"
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                        {form.settings.submitButtonText}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};

// Main Forms View Component
export const FormsView: React.FC<FormsViewProps> = ({ roomId }) => {
    const { t, dir } = useLanguage();
    const isRTL = dir === 'rtl';
    const storageKey = `forms-data-${roomId}` as const;

    // Field types with translations
    const getFieldTypeLabel = useCallback((type: FieldType): string => {
        const labels: Record<FieldType, string> = {
            short_text: t('forms_short_text'),
            long_text: t('forms_long_text'),
            number: t('forms_number'),
            email: t('forms_email'),
            phone: t('forms_phone'),
            url: t('forms_url'),
            date: t('forms_date'),
            dropdown: t('forms_dropdown'),
            checkbox: t('forms_checkbox'),
            rating: t('forms_rating'),
            file: t('forms_file_upload'),
            person: t('forms_person'),
            toggle: t('forms_toggle'),
        };
        return labels[type] || type;
    }, [t]);

    const getFieldTypeIcon = useCallback((type: FieldType): React.ElementType => {
        const icons: Record<FieldType, React.ElementType> = {
            short_text: TextT,
            long_text: TextAlignLeft,
            number: ListNumbers,
            email: Envelope,
            phone: Phone,
            url: LinkIcon,
            date: Calendar,
            dropdown: CaretCircleDown,
            checkbox: CheckSquare,
            rating: Star,
            file: Upload,
            person: User,
            toggle: ToggleLeft,
        };
        return icons[type] || TextT;
    }, []);

    const FIELD_TYPES: FieldType[] = [
        'short_text', 'long_text', 'number', 'email', 'phone', 'url',
        'date', 'dropdown', 'checkbox', 'rating', 'file', 'person', 'toggle'
    ];

    // Load forms from storage
    const [forms, setForms] = useState<Form[]>(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const [selectedFormId, setSelectedFormId] = useState<string | null>(
        forms.length > 0 ? forms[0].id : null
    );
    const [previewForm, setPreviewForm] = useState<Form | null>(null);
    const [showFieldPicker, setShowFieldPicker] = useState(false);

    // Persist forms
    const saveForms = useCallback((newForms: Form[]) => {
        setForms(newForms);
        try {
            localStorage.setItem(storageKey, JSON.stringify(newForms));
        } catch (e) {
            boardLogger.error('Failed to save forms', e);
        }
    }, [storageKey]);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const selectedForm = useMemo(() => {
        return forms.find(f => f.id === selectedFormId) || null;
    }, [forms, selectedFormId]);

    // Create new form
    const createForm = useCallback(() => {
        const newForm: Form = {
            id: `form-${Date.now()}`,
            name: t('forms_untitled'),
            description: '',
            fields: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            responses: [],
            settings: {
                submitButtonText: t('forms_submit'),
                successMessage: t('forms_success_message'),
                allowMultipleSubmissions: true
            }
        };
        const newForms = [...forms, newForm];
        saveForms(newForms);
        setSelectedFormId(newForm.id);
    }, [forms, saveForms, t]);

    // Update form
    const updateForm = useCallback((formId: string, updates: Partial<Form>) => {
        const newForms = forms.map(f =>
            f.id === formId ? { ...f, ...updates, updatedAt: Date.now() } : f
        );
        saveForms(newForms);
    }, [forms, saveForms]);

    // Delete form
    const deleteForm = useCallback((formId: string) => {
        const newForms = forms.filter(f => f.id !== formId);
        saveForms(newForms);
        if (selectedFormId === formId) {
            setSelectedFormId(newForms.length > 0 ? newForms[0].id : null);
        }
    }, [forms, saveForms, selectedFormId]);

    // Add field
    const addField = useCallback((type: FieldType) => {
        if (!selectedForm) return;

        const newField: FormField = {
            id: `field-${Date.now()}`,
            type,
            label: getFieldTypeLabel(type),
            required: false,
            options: type === 'dropdown' ? [`${t('forms_option')} 1`, `${t('forms_option')} 2`] : undefined,
            maxRating: type === 'rating' ? 5 : undefined
        };

        updateForm(selectedForm.id, {
            fields: [...selectedForm.fields, newField]
        });
        setShowFieldPicker(false);
    }, [selectedForm, updateForm, getFieldTypeLabel, t]);

    // Update field
    const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
        if (!selectedForm) return;

        const newFields = selectedForm.fields.map(f =>
            f.id === fieldId ? { ...f, ...updates } : f
        );
        updateForm(selectedForm.id, { fields: newFields });
    }, [selectedForm, updateForm]);

    // Delete field
    const deleteField = useCallback((fieldId: string) => {
        if (!selectedForm) return;

        const newFields = selectedForm.fields.filter(f => f.id !== fieldId);
        updateForm(selectedForm.id, { fields: newFields });
    }, [selectedForm, updateForm]);

    // Duplicate field
    const duplicateField = useCallback((fieldId: string) => {
        if (!selectedForm) return;

        const fieldToDuplicate = selectedForm.fields.find(f => f.id === fieldId);
        if (!fieldToDuplicate) return;

        const newField: FormField = {
            ...fieldToDuplicate,
            id: `field-${Date.now()}`,
            label: `${fieldToDuplicate.label} (${t('forms_copy')})`
        };

        const index = selectedForm.fields.findIndex(f => f.id === fieldId);
        const newFields = [...selectedForm.fields];
        newFields.splice(index + 1, 0, newField);

        updateForm(selectedForm.id, { fields: newFields });
    }, [selectedForm, updateForm, t]);

    // Handle field drag end
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        if (!selectedForm) return;

        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = selectedForm.fields.findIndex(f => f.id === active.id);
        const newIndex = selectedForm.fields.findIndex(f => f.id === over.id);

        const newFields = arrayMove(selectedForm.fields, oldIndex, newIndex);
        updateForm(selectedForm.id, { fields: newFields });
    }, [selectedForm, updateForm]);

    return (
        <div className="h-full flex bg-stone-50 dark:bg-stone-900" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Sidebar - Forms List */}
            <div className={`w-64 flex-shrink-0 bg-white dark:bg-stone-800 ${isRTL ? 'border-l' : 'border-r'} border-stone-200 dark:border-stone-700 flex flex-col`}>
                <div className="p-4 border-b border-stone-200 dark:border-stone-700">
                    <button
                        onClick={createForm}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <Plus size={18} weight="bold" />
                        {t('forms_new_form')}
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-2">
                    {forms.length === 0 ? (
                        <div className="text-center py-8 px-4">
                            <p className="text-sm text-stone-500">{t('forms_no_forms')}</p>
                            <p className="text-xs text-stone-400 mt-1">{t('forms_create_first')}</p>
                        </div>
                    ) : (
                        forms.map(form => (
                            <button
                                key={form.id}
                                onClick={() => setSelectedFormId(form.id)}
                                className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-3 py-2 rounded-lg mb-1 transition-colors ${selectedFormId === form.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    : 'hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300'
                                    }`}
                            >
                                <p className="font-medium truncate">{form.name}</p>
                                <p className="text-xs text-stone-500 mt-0.5">{form.fields.length} {t('forms_fields')}</p>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content - Form Builder */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {selectedForm ? (
                    <>
                        {/* Form Header */}
                        <div className="flex-shrink-0 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <input
                                        type="text"
                                        value={selectedForm.name}
                                        onChange={(e) => updateForm(selectedForm.id, { name: e.target.value })}
                                        className={`text-xl font-semibold text-stone-800 dark:text-stone-200 bg-transparent border-none outline-none focus:ring-0 w-full ${isRTL ? 'text-right' : 'text-left'}`}
                                        placeholder={t('forms_form_name')}
                                    />
                                    <input
                                        type="text"
                                        value={selectedForm.description}
                                        onChange={(e) => updateForm(selectedForm.id, { description: e.target.value })}
                                        className={`text-sm text-stone-500 bg-transparent border-none outline-none focus:ring-0 w-full mt-1 ${isRTL ? 'text-right' : 'text-left'}`}
                                        placeholder={t('forms_add_description')}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPreviewForm(selectedForm)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                                    >
                                        <Eye size={16} />
                                        {t('forms_preview')}
                                    </button>
                                    <button
                                        onClick={() => deleteForm(selectedForm.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash size={16} />
                                        {t('delete')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Form Builder Area */}
                        <div className="flex-1 overflow-auto p-6">
                            <div className="max-w-2xl mx-auto">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={selectedForm.fields.map(f => f.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {selectedForm.fields.map(field => (
                                            <SortableField
                                                key={field.id}
                                                field={field}
                                                onUpdate={updateField}
                                                onDelete={deleteField}
                                                onDuplicate={duplicateField}
                                                t={t}
                                                getFieldTypeLabel={getFieldTypeLabel}
                                                getFieldTypeIcon={getFieldTypeIcon}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>

                                {/* Add Field Button */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowFieldPicker(!showFieldPicker)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-lg text-stone-500 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
                                    >
                                        <Plus size={20} />
                                        {t('forms_add_field')}
                                    </button>

                                    {/* Field Type Picker */}
                                    {showFieldPicker && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl p-4 z-10">
                                            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">{t('forms_field_types')}</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {FIELD_TYPES.map(type => {
                                                    const Icon = getFieldTypeIcon(type);
                                                    return (
                                                        <button
                                                            key={type}
                                                            onClick={() => addField(type)}
                                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-sm transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                                                        >
                                                            <Icon size={16} className="text-stone-500" />
                                                            {getFieldTypeLabel(type)}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Empty State */}
                                {selectedForm.fields.length === 0 && (
                                    <div className="text-center py-12 text-stone-500">
                                        <PencilSimple size={48} className="mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">{t('forms_start_building')}</p>
                                        <p className="text-sm mt-1">{t('forms_click_add_field')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <PencilSimple size={64} className="mx-auto mb-4 text-stone-300" />
                            <h3 className="text-lg font-medium text-stone-600 dark:text-stone-400">{t('forms_no_selected')}</h3>
                            <p className="text-sm text-stone-500 mt-1">{t('forms_select_or_create')}</p>
                            <button
                                onClick={createForm}
                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors mx-auto"
                            >
                                <Plus size={18} weight="bold" />
                                {t('forms_create_form')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {previewForm && (
                <FormPreview form={previewForm} onClose={() => setPreviewForm(null)} t={t} isRTL={isRTL} />
            )}
        </div>
    );
};

export default FormsView;
