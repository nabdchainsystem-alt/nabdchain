import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type Language = 'en' | 'ar';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

const translations: Translations = {
  home: { en: 'Home', ar: 'الرئيسية' },
  my_work: { en: 'My work', ar: 'أعمالي' },
  inbox: { en: 'Inbox', ar: 'الوارد' },
  teams: { en: 'Teams', ar: 'الفرق' },
  vault: { en: 'Vault', ar: 'الخزنة' },
  favorites: { en: 'Favorites', ar: 'المفضلة' },
  workspaces: { en: 'Workspaces', ar: 'مساحات العمل' },
  search: { en: 'Search', ar: 'بحث' },
  add_workspace: { en: 'Add Workspace', ar: 'إضافة مساحة عمل' },
  good_evening: { en: 'Good evening', ar: 'مساء الخير' },
  ai_generator: { en: 'AI Board Generator', ar: 'منشئ اللوحات بالذكاء الاصطناعي' },
  describe_workflow: { en: "Describe your workflow, and we'll build the perfect board for you instantly.", ar: "وصف سير عملك، وسنقوم ببناء اللوحة المثالية لك على الفور." },
  try_it_out: { en: 'Try it out', ar: 'جربه الآن' },
  recently_visited: { en: 'Recently visited', ar: 'تمت زيارته مؤخراً' },
  add_board: { en: 'Add a board', ar: 'إضافة لوحة' },
  my_workspaces: { en: 'My workspaces', ar: 'مساحات العمل الخاصة بي' },
  templates: { en: 'Templates', ar: 'القوالب' },
  support: { en: 'Support', ar: 'الدعم' },
  help_center: { en: 'Help center', ar: 'مركز المساعدة' },
  create_board: { en: 'Create Board', ar: 'إنشاء لوحة' },
  cancel: { en: 'Cancel', ar: 'إلغاء' },
  generating: { en: 'Generating...', ar: 'جاري الإنشاء...' },
  new_item: { en: 'New item', ar: 'عنصر جديد' },
  person: { en: 'Person', ar: 'شخص' },
  filter: { en: 'Filter', ar: 'تصفية' },
  sort: { en: 'Sort', ar: 'فرز' },
  hide: { en: 'Hide', ar: 'إخفاء' },
  group_by: { en: 'Group by', ar: 'تجميع حسب' },
  main_table: { en: 'Main table', ar: 'الجدول الرئيسي' },
  sidekick: { en: 'Sidekick', ar: 'المساعد' },
  integrate: { en: 'Integrate', ar: 'ربط' },
  automate: { en: 'Automate', ar: 'أتمتة' },
  invite: { en: 'Invite', ar: 'دعوة' },
  new_mail: { en: 'New Mail', ar: 'بريد جديد' },
  capture: { en: 'Capture', ar: 'التقاط' },
  archive: { en: 'Archive', ar: 'الأرشيف' },
  drafts: { en: 'Drafts', ar: 'المسودات' },
  sent: { en: 'Sent', ar: 'المرسل' },
  deleted_items: { en: 'Deleted Items', ar: 'المحذوفات' },
  junk_email: { en: 'Junk Email', ar: 'البريد غير الهام' },
  folders: { en: 'Folders', ar: 'المجلدات' },
  focused: { en: 'Focused', ar: 'المركز عليه' },
  other: { en: 'Other', ar: 'أخرى' },
  delete: { en: 'Delete', ar: 'حذف' },
  read_unread: { en: 'Read / Unread', ar: 'مقرؤ / غير مقروء' },
  reply: { en: 'Reply', ar: 'رد' },
  reply_all: { en: 'Reply All', ar: 'الرد على الكل' },
  forward: { en: 'Forward', ar: 'إعادة توجيه' },
  move: { en: 'Move', ar: 'نقل' },
  copy: { en: 'Copy', ar: 'نسخ' },
  categorize: { en: 'Categorize', ar: 'تصنيف' },
  pin: { en: 'Pin', ar: 'تثبيت' },
  snooze: { en: 'Snooze', ar: 'تأجيل' },
  flag: { en: 'Flag', ar: 'علم' },
  sync: { en: 'Sync', ar: 'مزامنة' },
  report: { en: 'Report', ar: 'إبلاغ' },
  block: { en: 'Block', ar: 'حظر' },
  translate: { en: 'Translate', ar: 'ترجمة' },
  print: { en: 'Print', ar: 'طباعة' },
  more: { en: 'More', ar: 'المزيد' },
  dark_mode: { en: 'Dark Mode', ar: 'الوضع الداكن' },
  light_mode: { en: 'Light Mode', ar: 'الوضع الفاتح' },
  language: { en: 'Language', ar: 'اللغة' },
  
  // New Add Menu Translations
  add_new: { en: 'Add new', ar: 'إضافة جديد' },
  tasks_board: { en: 'TasksBoard', ar: 'لوحة مهام' },
  list_view: { en: 'List', ar: 'قائمة' },
  kanban_view: { en: 'Kanban', ar: 'كانبان' },
  doc: { en: 'Doc', ar: 'مستند' },
  project: { en: 'Project', ar: 'مشروع' },
  portfolio: { en: 'Portfolio', ar: 'ملف مشاريع' },
  board: { en: 'Board', ar: 'لوحة' },
  dashboard: { en: 'Dashboard', ar: 'لوحة تحكم' },
  form: { en: 'Form', ar: 'نموذج' },
  workflow: { en: 'Workflow', ar: 'سير عمل' },
  folder: { en: 'Folder', ar: 'مجلد' },
  installed_apps: { en: 'Installed apps', ar: 'التطبيقات المثبتة' },
  import_data: { en: 'Import data', ar: 'استيراد البيانات' },
  template_center: { en: 'Template center', ar: 'مركز القوالب' },
};

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('en');

  // Load from local storage on mount (optional, omitting for brevity in this demo)

  useEffect(() => {
    // Update HTML class for Tailwind Dark Mode
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    // Update HTML direction for RTL
    const root = window.document.documentElement;
    root.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', language);
  }, [language]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const t = (key: string) => {
    if (!translations[key]) return key;
    return translations[key][language];
  };

  return (
    <AppContext.Provider value={{ 
      theme, 
      toggleTheme, 
      language, 
      toggleLanguage, 
      t,
      dir: language === 'ar' ? 'rtl' : 'ltr'
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
