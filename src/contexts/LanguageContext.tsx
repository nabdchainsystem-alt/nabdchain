import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';

type Language = 'en' | 'ar';

interface Translations {
    [key: string]: string;
}

interface TranslationMap {
    en: Translations;
    ar: Translations;
}

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    dir: 'ltr' | 'rtl';
}

const translations: TranslationMap = {
    en: {
        // General
        home: 'Home',

        // Table Toolbar
        search: 'Search',
        search_this_board: 'Search this board...',
        person: 'Person',
        filter: 'Filter',
        sort: 'Sort',
        hide: 'Hide',
        clear: 'Clear',
        group_by: 'Group by',
        duplicate: 'Duplicate',
        archive: 'Archive',
        delete: 'Delete',
        export: 'Export',
        import: 'Import',

        // Filter Panel
        filter_by_person: 'Filter by person',
        advanced_filters: 'Advanced filters',
        showing_x_of_y: 'Showing {0} of {1} items',
        clear_all: 'Clear all',
        save_as_new_view: 'Save as new view',
        where: 'Where',
        and: 'And',
        column: 'Column',
        condition: 'Condition',
        value: 'Value',
        new_filter: '+ New filter',

        // Sort Panel
        sort_by: 'Sort by',
        choose_column: 'Choose column',
        ascending: '↑ Ascending',
        descending: '↓ Descending',
        new_sort: '+ New sort',

        // Hide Columns Panel
        display_columns: 'Display columns',
        find_columns: 'Find columns...',
        all_columns: 'All columns',
        x_selected: '{0} selected',

        // Group
        new_group: 'New Group',
        group_1: 'Group 1',
        tasks: 'Tasks',
        item: 'item',
        items: 'items',
        pin_group: 'Pin Group',
        unpin_group: 'Unpin Group',

        // Status Options
        to_do: 'To Do',
        in_progress: 'In Progress',
        done: 'Done',
        stuck: 'Stuck',
        rejected: 'Rejected',

        // Priority Options
        urgent: 'Urgent',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
        none: 'None',

        // Actions & Messages
        no_data_to_export: 'No data to export.',
        table_cleared_successfully: 'Table cleared successfully',
        cannot_delete_last_group: 'Cannot delete the last group.',
        new_item: 'New Item',
        delete_x_items: 'Delete {0} items?',
        this_action_cannot_be_undone: 'This action cannot be undone.',
        export_x_selected_rows: 'Export {0} selected rows',
        export_all_rows: 'Export all rows',
        import_from_file: 'Import from CSV or Excel file',
        clear_all_data: 'Clear all data?',
        file_appears_empty: 'The file appears to be empty.',
        found_headers_no_data: 'Found headers at row {0}, but no data rows.',
        no_assigned_users: 'No assigned users',

        // Delete Confirmation
        delete_group_confirm: 'Delete "{0}" and all its items?',
        delete_group_description: 'This will permanently remove the group and all tasks within it.',

        // Table Headers
        name: 'Name',
        status: 'Status',
        priority: 'Priority',
        due_date: 'Due Date',
        date: 'Date',
        people: 'People',
        files: 'Files',
        text: 'Text',
        number: 'Number',
        link: 'Link',

        // Add Column
        add_column: 'Add Column',
        column_type: 'Column Type',

        // Pagination
        rows_per_page: 'Rows per page',
        page_x_of_y: 'Page {0} of {1}',

        // Context Menu
        rename: 'Rename',
        sort_ascending: 'Sort Ascending',
        sort_descending: 'Sort Descending',
        pin_column: 'Pin Column',
        unpin_column: 'Unpin Column',
        delete_column: 'Delete Column',

        // Cell Actions
        copy: 'Copy',
        paste: 'Paste',
        clear_cell: 'Clear cell',

        // Misc
        add_new_item: '+ Add new item',
        type_to_add: 'Type to add...',
        select_all: 'Select all',
        deselect_all: 'Deselect all',

        // Calendar
        calendar_today: 'Today',
        calendar_day: 'Day',
        calendar_work_week: 'Work week',
        calendar_week: 'Week',
        calendar_month: 'Month',
        calendar_new_event: 'New event',
        calendar_my_calendars: 'My calendars',
        calendar_calendar: 'Calendar',

        // Doc
        doc_add_page: 'Add page',

        // Gantt
        gantt_today: 'Today',
        gantt_week: 'Week',
        gantt_week_short: 'W',
        gantt_auto_fit: 'Auto fit',
        gantt_assignee: 'Assignee',
        gantt_add_task: 'Add task'
    },
    ar: {
        // General
        home: 'الرئيسية',

        // Table Toolbar
        search: 'بحث',
        search_this_board: 'البحث في هذه اللوحة...',
        person: 'شخص',
        filter: 'تصفية',
        sort: 'ترتيب',
        hide: 'إخفاء',
        clear: 'مسح',
        group_by: 'تجميع حسب',
        duplicate: 'تكرار',
        archive: 'أرشفة',
        delete: 'حذف',
        export: 'تصدير',
        import: 'استيراد',

        // Filter Panel
        filter_by_person: 'تصفية حسب الشخص',
        advanced_filters: 'تصفية متقدمة',
        showing_x_of_y: 'عرض {0} من {1} عنصر',
        clear_all: 'مسح الكل',
        save_as_new_view: 'حفظ كعرض جديد',
        where: 'حيث',
        and: 'و',
        column: 'عمود',
        condition: 'شرط',
        value: 'قيمة',
        new_filter: '+ تصفية جديدة',

        // Sort Panel
        sort_by: 'ترتيب حسب',
        choose_column: 'اختر عمود',
        ascending: '↑ تصاعدي',
        descending: '↓ تنازلي',
        new_sort: '+ ترتيب جديد',

        // Hide Columns Panel
        display_columns: 'عرض الأعمدة',
        find_columns: 'البحث عن أعمدة...',
        all_columns: 'جميع الأعمدة',
        x_selected: '{0} محدد',

        // Group
        new_group: 'مجموعة جديدة',
        group_1: 'المجموعة 1',
        tasks: 'المهام',
        item: 'عنصر',
        items: 'عناصر',
        pin_group: 'تثبيت المجموعة',
        unpin_group: 'إلغاء تثبيت المجموعة',

        // Status Options
        to_do: 'للتنفيذ',
        in_progress: 'قيد التنفيذ',
        done: 'مكتمل',
        stuck: 'متوقف',
        rejected: 'مرفوض',

        // Priority Options
        urgent: 'عاجل',
        high: 'عالي',
        medium: 'متوسط',
        low: 'منخفض',
        none: 'بدون',

        // Actions & Messages
        no_data_to_export: 'لا توجد بيانات للتصدير.',
        table_cleared_successfully: 'تم مسح الجدول بنجاح',
        cannot_delete_last_group: 'لا يمكن حذف المجموعة الأخيرة.',
        new_item: 'عنصر جديد',
        delete_x_items: 'حذف {0} عنصر؟',
        this_action_cannot_be_undone: 'لا يمكن التراجع عن هذا الإجراء.',
        export_x_selected_rows: 'تصدير {0} صف محدد',
        export_all_rows: 'تصدير جميع الصفوف',
        import_from_file: 'استيراد من ملف CSV أو Excel',
        clear_all_data: 'مسح جميع البيانات؟',
        file_appears_empty: 'يبدو أن الملف فارغ.',
        found_headers_no_data: 'تم العثور على العناوين في الصف {0}، لكن لا توجد بيانات.',
        no_assigned_users: 'لا يوجد مستخدمون معينون',

        // Delete Confirmation
        delete_group_confirm: 'حذف "{0}" وجميع عناصرها؟',
        delete_group_description: 'سيؤدي هذا إلى إزالة المجموعة وجميع المهام بداخلها نهائياً.',

        // Table Headers
        name: 'الاسم',
        status: 'الحالة',
        priority: 'الأولوية',
        due_date: 'تاريخ الاستحقاق',
        date: 'التاريخ',
        people: 'الأشخاص',
        files: 'الملفات',
        text: 'نص',
        number: 'رقم',
        link: 'رابط',

        // Add Column
        add_column: 'إضافة عمود',
        column_type: 'نوع العمود',

        // Pagination
        rows_per_page: 'صفوف في الصفحة',
        page_x_of_y: 'صفحة {0} من {1}',

        // Context Menu
        rename: 'إعادة تسمية',
        sort_ascending: 'ترتيب تصاعدي',
        sort_descending: 'ترتيب تنازلي',
        pin_column: 'تثبيت العمود',
        unpin_column: 'إلغاء تثبيت العمود',
        delete_column: 'حذف العمود',

        // Cell Actions
        copy: 'نسخ',
        paste: 'لصق',
        clear_cell: 'مسح الخلية',

        // Misc
        add_new_item: '+ إضافة عنصر جديد',
        type_to_add: 'اكتب للإضافة...',
        select_all: 'تحديد الكل',
        deselect_all: 'إلغاء تحديد الكل',

        // Calendar
        calendar_today: 'اليوم',
        calendar_day: 'يوم',
        calendar_work_week: 'أسبوع العمل',
        calendar_week: 'أسبوع',
        calendar_month: 'شهر',
        calendar_new_event: 'حدث جديد',
        calendar_my_calendars: 'تقويماتي',
        calendar_calendar: 'التقويم',

        // Doc
        doc_add_page: 'إضافة صفحة',

        // Gantt
        gantt_today: 'اليوم',
        gantt_week: 'أسبوع',
        gantt_week_short: 'أ',
        gantt_auto_fit: 'ملاءمة تلقائية',
        gantt_assignee: 'المسؤول',
        gantt_add_task: 'إضافة مهمة'
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        return (localStorage.getItem('app-language') as Language) || 'en';
    });
    const t = useCallback((key: string): string => translations[language]?.[key] || key, [language]);

    // Update document direction and language capability
    React.useEffect(() => {
        const dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.dir = dir;
        document.documentElement.lang = language;
        localStorage.setItem('app-language', language);
    }, [language]);

    const value = useMemo<LanguageContextType>(() => ({
        language,
        setLanguage,
        t,
        dir: language === 'ar' ? 'rtl' : 'ltr'
    }), [language, t]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        return {
            language: 'en',
            setLanguage: () => { },
            t: (k: string) => k,
            dir: 'ltr'
        };
    }
    return context;
};
