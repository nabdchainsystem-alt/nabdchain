import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext<any>(null);

const translations: any = {
    en: {
        'discussion.title': 'DISCUSSIONS',
        'discussion.new_board': 'New Board',
        'discussion.capture': 'Capture',
        'discussion.capture_your_thought': 'What is on your mind?',
        'discussion.search': 'Search discussions...',
        'discussion.new_discussion': 'New Discussion',
        'discussion.start_discussing': 'Start Discussing',
        'discussion.start_writing': 'Start writing...',
        'discussion.no_threads': 'No discussions yet',
        'discussion.delete_board': 'Delete board',
        'discussion.select_conversation': 'Select a conversation to start chatting',
        'discussion.add': 'Add',
        'discussion.last_active': 'Last active',
        'discussion.new_board_modal.title': 'Create New Board',
        'discussion.new_board_modal.name_placeholder': 'Board Name',
        'discussion.new_board_modal.desc_placeholder': 'Description (optional)',
        'discussion.new_board_modal.team': 'Team',
        'discussion.new_board_modal.options': 'Options',
        'discussion.new_board_modal.cancel': 'Cancel',
        'discussion.new_board_modal.create': 'Create Board',
    },
    ar: {
        'discussion.title': 'المحادثات',
        'discussion.new_board': 'لوحة جديدة',
        'discussion.capture': 'سجل فكرة',
        'discussion.capture_your_thought': 'بماذا تفكر؟',
        'discussion.search': 'بحث...',
        'discussion.new_discussion': 'محادثة جديدة',
        'discussion.start_discussing': 'ابدأ النقاش',
        'discussion.start_writing': 'ابدأ الكتابة...',
        'discussion.no_threads': 'لا توجد محادثات',
        'discussion.delete_board': 'حذف اللوحة',
        'discussion.select_conversation': 'اختر محادثة للبدء',
        'discussion.add': 'إضافة',
        'discussion.last_active': 'آخر نشاط',
        'discussion.new_board_modal.title': 'إنشاء لوحة جديدة',
        'discussion.new_board_modal.name_placeholder': 'اسم اللوحة',
        'discussion.new_board_modal.desc_placeholder': 'الوصف (اختياري)',
        'discussion.new_board_modal.team': 'الفريق',
        'discussion.new_board_modal.options': 'خيارات',
        'discussion.new_board_modal.cancel': 'إلغاء',
        'discussion.new_board_modal.create': 'إنشاء اللوحة',
    }
};

export const LanguageProvider = ({ children }: any) => {
    const [language, setLanguage] = useState('en');
    const t = (key: string) => translations[language]?.[key] || key;
    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext) || { language: 'en', t: (k: string) => k };
