import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { COUNTRIES, DEFAULT_COUNTRY_CODE, CountryConfig, CurrencyConfig } from '../config/currency';

type Theme = 'light' | 'dark';
type Language = 'en' | 'ar';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}
const translations: Translations = {
  // Navigation & Core
  home: { en: 'Home', ar: 'الرئيسية' },
  my_work: { en: 'My work', ar: 'أعمالي' },
  inbox: { en: 'Inbox', ar: 'الوارد' },
  teams: { en: 'Teams', ar: 'الفرق' },
  vault: { en: 'Vault', ar: 'الخزنة' },
  talk: { en: 'Talk', ar: 'المحادثة' },
  favorites: { en: 'Favorites', ar: 'المفضلة' },
  workspaces: { en: 'Workspaces', ar: 'مساحات العمل' },
  search: { en: 'Search', ar: 'بحث' },
  add_workspace: { en: 'Add Workspace', ar: 'إضافة مساحة عمل' },
  or_create_workspace: { en: 'or create workspace', ar: 'أو إنشاء مساحة عمل' },
  create_workspace: { en: 'Create Workspace', ar: 'إنشاء مساحة عمل' },
  rename: { en: 'Rename', ar: 'إعادة تسمية' },
  edit_workspace: { en: 'Edit Workspace', ar: 'تعديل مساحة العمل' },
  workspace_name: { en: 'Workspace Name', ar: 'اسم مساحة العمل' },
  workspace_icon: { en: 'Workspace Icon', ar: 'أيقونة مساحة العمل' },
  workspace_name_placeholder: { en: 'e.g. Marketing Team', ar: 'مثال: فريق التسويق' },
  save_changes: { en: 'Save Changes', ar: 'حفظ التغييرات' },
  cancel: { en: 'Cancel', ar: 'إلغاء' },
  // Workspace Icons
  'Briefcase': { en: 'Briefcase', ar: 'حقيبة عمل' },
  'Layout': { en: 'Layout', ar: 'تخطيط' },
  'Star': { en: 'Star', ar: 'نجمة' },
  'Heart': { en: 'Heart', ar: 'قلب' },
  'Smile': { en: 'Smile', ar: 'ابتسامة' },
  'Globe': { en: 'Globe', ar: 'عالم' },
  'Cpu': { en: 'CPU', ar: 'معالج' },
  'Database': { en: 'Database', ar: 'قاعدة بيانات' },
  'Cloud': { en: 'Cloud', ar: 'سحابة' },
  'Code': { en: 'Code', ar: 'كود' },
  'Terminal': { en: 'Terminal', ar: 'مبنى' },
  'Command': { en: 'Command', ar: 'أمر' },
  'Hash': { en: 'Hash', ar: 'هاشتاج' },
  'Image': { en: 'Image', ar: 'صورة' },
  'Music': { en: 'Music', ar: 'موسيقى' },
  'Video': { en: 'Video', ar: 'فيديو' },
  'PenTool': { en: 'Pen Tool', ar: 'أداة القلم' },
  'Box': { en: 'Box', ar: 'صندوق' },
  'Package': { en: 'Package', ar: 'حزمة' },
  'Layers': { en: 'Layers', ar: 'طبقات' },
  'Home': { en: 'Home', ar: 'البيت' },
  'Grid': { en: 'Grid', ar: 'شبكة' },
  'Folder': { en: 'Folder', ar: 'مجلد' },
  'Table': { en: 'Table', ar: 'جدول' },
  'List': { en: 'List', ar: 'قائمة' },
  'KanbanSquare': { en: 'Kanban', ar: 'كانبان' },
  'CheckSquare': { en: 'Check', ar: 'تحقق' },

  // Arcade
  arcade: { en: 'Arcade', ar: 'الأركيد' },
  take_break: { en: 'Take a break and have some fun', ar: 'خذ استراحة واستمتع' },
  games: { en: 'games', ar: 'ألعاب' },
  play_now: { en: 'Play Now', ar: 'العب الآن' },
  high_score: { en: 'High Score', ar: 'أعلى نتيجة' },
  coming_soon: { en: 'Coming Soon', ar: 'قريباً' },


  notifications: { en: 'Notifications', ar: 'الإشعارات' },
  mark_all_read: { en: 'Mark all as read', ar: 'تحديد الكل كمقروء' },
  no_notifications: { en: 'No notifications', ar: 'لا توجد إشعارات' },
  view_assignment: { en: 'View Assignment', ar: 'عرض المهمة' },

  // Invite Member
  invite_member_desc: { en: 'Invite team members to collaborate on your workspace', ar: 'قم بدعوة أعضاء الفريق للتعاون في مساحة العمل الخاصة بك' },
  enter_email_placeholder: { en: 'Enter email address', ar: 'أدخل عنوان البريد الإلكتروني' },
  send_invitation: { en: 'Send Invitation', ar: 'إرسال الدعوة' },

  // Save to Vault
  save_to_vault: { en: 'Save to Vault', ar: 'حفظ في الخزنة' },
  file_name: { en: 'File Name', ar: 'اسم الملف' },
  where_to_save: { en: 'Where to save', ar: 'أين تريد الحفظ؟' },
  root_no_folder: { en: 'Root (No Folder)', ar: 'الجذر (بدون مجلد)' },
  create_new_folder: { en: 'Create new folder', ar: 'إنشاء مجلد جديد' },
  tags: { en: 'Tags', ar: 'الوسوم' },
  tags_placeholder: { en: 'design, project, important (comma separated)', ar: 'تصميم، مشروع، مهم (مفصولة بفواصل)' },
  saving: { en: 'Saving...', ar: 'جاري الحفظ...' },
  folder_name: { en: 'Folder Name', ar: 'اسم المجلد' },
  enter_file_name: { en: 'Enter file name', ar: 'أدخل اسم الملف' },
  original: { en: 'Original', ar: 'الأصلي' },
  kb: { en: 'KB', ar: 'كيلوبايت' },

  or_create_board: { en: 'or create board', ar: 'أو إنشاء لوحة' },




  // Greetings
  good_morning: { en: 'Good morning', ar: 'صباح الخير' },
  good_afternoon: { en: 'Good afternoon', ar: 'مساء الخير' },
  good_evening: { en: 'Good evening', ar: 'مساء الخير' },
  daily_overview: { en: "Here's your daily overview.", ar: 'إليك نظرة عامة على يومك.' },

  // AI Generator
  ai_generator: { en: 'AI Board Generator', ar: 'منشئ اللوحات بالذكاء الاصطناعي' },
  describe_workflow: { en: "Describe your workflow, and we'll build the perfect board for you instantly.", ar: "وصف سير عملك، وسنقوم ببناء اللوحة المثالية لك على الفور." },
  try_it_out: { en: 'Try it out', ar: 'جربه الآن' },

  // Dashboard
  recently_visited: { en: 'Recently visited', ar: 'تمت زيارته مؤخراً' },
  no_recent_history: { en: 'No recent history', ar: 'لا يوجد سجل حديث' },
  pages_appear_here: { en: 'Pages you visit will appear here', ar: 'الصفحات التي تزورها ستظهر هنا' },
  project_board: { en: 'Project Board', ar: 'لوحة المشروع' },
  application_module: { en: 'Application Module', ar: 'وحدة التطبيق' },
  urgent_tasks: { en: 'Urgent Tasks', ar: 'المهام العاجلة' },
  show_all: { en: 'Show All', ar: 'عرض الكل' },
  all_tasks: { en: 'All Tasks', ar: 'جميع المهام' },
  high_priority: { en: 'High Priority', ar: 'أولوية عالية' },
  high_priority_only: { en: 'High Priority Only', ar: 'الأولوية العالية فقط' },
  medium_priority: { en: 'Medium Priority', ar: 'أولوية متوسطة' },
  medium_priority_only: { en: 'Medium Priority Only', ar: 'الأولوية المتوسطة فقط' },
  overdue: { en: 'Overdue', ar: 'متأخرة' },
  this_week: { en: 'This Week', ar: 'هذا الأسبوع' },
  search_everything: { en: 'Search everything...', ar: 'البحث في كل شيء...' },
  no_matches_found: { en: 'No matches found', ar: 'لا توجد نتائج مطابقة' },
  no_status: { en: 'No status', ar: 'بدون حالة' },
  results: { en: 'results', ar: 'نتائج' },
  close: { en: 'Close', ar: 'إغلاق' },
  all: { en: 'All', ar: 'الكل' },
  boards: { en: 'Boards', ar: 'اللوحات' },
  tasks: { en: 'Tasks', ar: 'المهام' },
  no_date: { en: 'No Date', ar: 'بدون تاريخ' },
  no_urgent_tasks: { en: "No urgent tasks due. You're all caught up!", ar: 'لا توجد مهام عاجلة. أنت على اطلاع!' },
  quick_actions: { en: 'Quick Actions', ar: 'إجراءات سريعة' },
  new_task: { en: 'New Task', ar: 'مهمة جديدة' },
  invite_member: { en: 'Invite Member', ar: 'دعوة عضو' },
  search_all: { en: 'Search All', ar: 'بحث شامل' },
  new_board: { en: 'New Board', ar: 'لوحة جديدة' },
  events: { en: 'Events', ar: 'الأحداث' },
  upload: { en: 'Upload', ar: 'رفع' },
  recent_activity: { en: 'Recent Activity', ar: 'النشاط الأخير' },
  no_recent_activity: { en: 'No recent activity found.', ar: 'لم يتم العثور على نشاط حديث.' },
  quick_notes: { en: 'Quick Notes', ar: 'ملاحظات سريعة' },
  auto_saved: { en: 'Auto-saved', ar: 'حفظ تلقائي' },
  jot_down: { en: 'Jot down something...', ar: 'اكتب شيئاً...' },
  reminders: { en: 'Reminders', ar: 'التذكيرات' },
  clear: { en: 'Clear', ar: 'مسح' },
  active_tasks: { en: 'Active Tasks', ar: 'المهام النشطة' },
  open: { en: 'Open', ar: 'فتح' },

  // Quick Actions Labels
  payment_request: { en: 'Payment Request', ar: 'طلب دفع' },
  new_email: { en: 'New Email', ar: 'بريد جديد' },
  new_customer: { en: 'New Customer', ar: 'عميل جديد' },
  new_product: { en: 'New Product', ar: 'منتج جديد' },

  // Filter & Search
  search_people: { en: 'Search people...', ar: 'البحث عن أشخاص...' },
  add_more: { en: 'Add more...', ar: 'إضافة المزيد...' },
  no_matches: { en: 'No matches', ar: 'لا توجد نتائج' },
  team: { en: 'Team', ar: 'فريق' },
  filter_by_person: { en: 'Filter by Person', ar: 'تصفية حسب الشخص' },
  clear_and_close: { en: 'Clear all and close', ar: 'مسح الكل وإغلاق' },
  open_in_board: { en: 'Open in board', ar: 'فتح في اللوحة' },
  email_update_to_client: { en: 'Email update to client', ar: 'إرسال بريد للعميل' },
  check_in_with_design: { en: 'Check in with Design', ar: 'التواصل مع فريق التصميم' },

  // Boards & Workspaces
  add_board: { en: 'Add a board', ar: 'إضافة لوحة' },
  my_workspaces: { en: 'My workspaces', ar: 'مساحات العمل الخاصة بي' },
  templates: { en: 'Templates', ar: 'القوالب' },
  support: { en: 'Support', ar: 'الدعم' },
  help_center: { en: 'Help center', ar: 'مركز المساعدة' },
  create_board: { en: 'Create Board', ar: 'إنشاء لوحة' },
  generating: { en: 'Generating...', ar: 'جاري الإنشاء...' },

  // Table & Data
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

  // Email/Inbox
  new_mail: { en: 'New Mail', ar: 'بريد جديد' },
  compose_new_message: { en: 'Compose a new message', ar: 'إنشاء رسالة جديدة' },
  to: { en: 'To', ar: 'إلى' },
  subject: { en: 'Subject', ar: 'الموضوع' },
  message: { en: 'Message', ar: 'الرسالة' },
  recipient_placeholder: { en: 'recipient@example.com', ar: 'المستلم@example.com' },
  enter_subject: { en: 'Enter subject...', ar: 'أدخل الموضوع...' },
  write_message: { en: 'Write your message here...', ar: 'اكتب رسالتك هنا...' },
  discard: { en: 'Discard', ar: 'إلغاء' },
  send_email: { en: 'Send Email', ar: 'إرسال البريد' },
  please_enter_recipient: { en: 'Please enter a recipient.', ar: 'يرجى إدخال المستلم.' },
  please_enter_subject: { en: 'Please enter a subject.', ar: 'يرجى إدخال الموضوع.' },
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
  read: { en: 'Read', ar: 'مقروء' },
  unread: { en: 'Unread', ar: 'غير مقروء' },
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
  connect: { en: 'Connect', ar: 'اتصال' },
  connected: { en: 'Connected', ar: 'متصل' },
  syncing_emails: { en: 'Syncing emails...', ar: 'جاري مزامنة البريد...' },
  no_emails_found: { en: 'No emails found', ar: 'لم يتم العثور على رسائل' },
  select_item_to_read: { en: 'Select an item to read', ar: 'اختر عنصراً للقراءة' },
  connect_inbox_title: { en: 'Connect your Inbox', ar: 'ربط بريدك الوارد' },
  connect_inbox_desc: { en: 'Sync your work email to manage everything in one place. We support Gmail and Outlook.', ar: 'قم بمزامنة بريد العمل الخاص بك لإدارة كل شيء في مكان واحد. نحن ندعم Gmail و Outlook.' },
  connect_with_google: { en: 'Connect with Google', ar: 'الاتصال بـ Google' },
  connect_with_outlook: { en: 'Connect with Outlook', ar: 'الاتصال بـ Outlook' },
  connect_terms: { en: 'By connecting, you agree to grant read/write access to your emails.', ar: 'من خلال الاتصال، فإنك توافق على منح حق الوصول للقراءة/الكتابة لرسائل بريدك الإلكتروني.' },
  must_be_logged_in: { en: 'You must be logged in to connect an account.', ar: 'يجب عليك تسجيل الدخول لربط حساب.' },
  failed_init_connection: { en: 'Failed to initialize connection', ar: 'فشل بدء الاتصال' },
  activity: { en: 'Activity', ar: 'النشاط' },
  task: { en: 'Task', ar: 'مهمة' },
  ai: { en: 'AI', ar: 'ذكاء اصطناعي' },
  star: { en: 'Star', ar: 'نجمة' },
  spam: { en: 'Spam', ar: 'بريد مزعج' },
  move_to_trash: { en: 'Move to Trash', ar: 'نقل إلى سلة المهملات' },
  move_to_trash_confirm: { en: 'This email will be moved to your trash folder.', ar: 'سيتم نقل هذا البريد إلى سلة المهملات.' },
  disconnect: { en: 'Disconnect', ar: 'قطع الاتصال' },
  disconnect_account: { en: 'Disconnect Account?', ar: 'قطع اتصال الحساب؟' },
  disconnect_confirm: { en: 'Are you sure you want to disconnect this email account? You will stop receiving updates.', ar: 'هل أنت متأكد من قطع اتصال هذا الحساب؟ لن تتلقى تحديثات بعد الآن.' },
  loading: { en: 'Loading...', ar: 'جاري التحميل...' },

  // Settings & Theme
  more: { en: 'More', ar: 'المزيد' },
  dark_mode: { en: 'Dark Mode', ar: 'الوضع الداكن' },
  light_mode: { en: 'Light Mode', ar: 'الوضع الفاتح' },
  language: { en: 'Language', ar: 'اللغة' },
  english: { en: 'English', ar: 'إنجليزي' },
  arabic: { en: 'Arabic', ar: 'عربي' },
  region_currency: { en: 'Region & Currency', ar: 'المنطقة والعملة' },
  edit: { en: 'Edit', ar: 'تعديل' },
  pages: { en: 'Pages', ar: 'الصفحات' },

  // Add Menu Items
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

  // Board View Options
  overview: { en: 'Overview', ar: 'نظرة عامة' },
  insights: { en: 'Insights', ar: 'رؤى' },
  table: { en: 'Table', ar: 'جدول' },
  data: { en: 'Data', ar: 'بيانات' },
  data_table: { en: 'Data Table', ar: 'جدول البيانات' },
  kanban: { en: 'Kanban', ar: 'كانبان' },
  list: { en: 'List', ar: 'قائمة' },
  calendar: { en: 'Calendar', ar: 'التقويم' },
  gantt: { en: 'Gantt', ar: 'جانت' },
  timeline: { en: 'Timeline', ar: 'الجدول الزمني' },
  workload: { en: 'Workload View', ar: 'عرض عبء العمل' },
  smart_sheet: { en: 'Smart Sheet', ar: 'ورقة ذكية' },
  gtd_system: { en: 'GTD System', ar: 'نظام GTD' },
  cornell_notes: { en: 'Cornell Notes', ar: 'ملاحظات كورنيل' },
  automation_rules: { en: 'Automation Rules', ar: 'قواعد الأتمتة' },
  goals_okrs: { en: 'Goals & OKRs', ar: 'الأهداف والنتائج الرئيسية' },
  recurring: { en: 'Recurring Logic', ar: 'المنطق المتكرر' },
  whiteboard: { en: 'Whiteboard', ar: 'السبورة البيضاء' },
  capacity_map: { en: 'Capacity Map', ar: 'خريطة السعة' },

  // Live Session
  live_session: { en: 'Live Session', ar: 'جلسة مباشرة' },
  join_live_session: { en: 'Join Live Session', ar: 'انضم للجلسة المباشرة' },
  room: { en: 'Room', ar: 'الغرفة' },
  link_copied: { en: 'Session link copied to clipboard!', ar: 'تم نسخ رابط الجلسة!' },
  shared_screen_area: { en: 'Shared Screen Area', ar: 'منطقة مشاركة الشاشة' },
  connecting: { en: 'Connecting...', ar: 'جاري الاتصال...' },
  you: { en: 'You', ar: 'أنت' },
  // Note: 'close' already defined above

  // Board View Descriptions
  board_overview_desc: { en: 'Board overview', ar: 'نظرة عامة على اللوحة' },
  manage_workflows_desc: { en: 'Manage project workflows', ar: 'إدارة سير عمل المشروع' },
  raw_data_desc: { en: 'Raw data view', ar: 'عرض البيانات الخام' },
  high_perf_grid_desc: { en: 'High performance data grid', ar: 'شبكة بيانات عالية الأداء' },
  visualize_work_desc: { en: 'Visualize your work', ar: 'تصور عملك' },
  simple_list_desc: { en: 'Simple list view', ar: 'عرض قائمة بسيط' },
  schedule_tasks_desc: { en: 'Schedule tasks', ar: 'جدولة المهام' },
  collaborate_docs_desc: { en: 'Collaborate on docs', ar: 'التعاون على المستندات' },
  visual_timeline_desc: { en: 'Visual timeline', ar: 'جدول زمني مرئي' },
  balance_assignments_desc: { en: 'Balance assignments', ar: 'توازن المهام' },
  spreadsheet_workspace_desc: { en: 'Spreadsheet workspace', ar: 'مساحة عمل جدول البيانات' },
  gtd_desc: { en: 'Getting Things Done', ar: 'إنجاز الأمور' },
  cornell_desc: { en: 'Effective note-taking', ar: 'تدوين ملاحظات فعال' },
  automation_desc: { en: 'Simple trigger → action', ar: 'تفعيل بسيط ← إجراء' },
  goals_desc: { en: 'Align work to outcomes', ar: 'مواءمة العمل مع النتائج' },
  recurring_desc: { en: 'Repeat work patterns', ar: 'تكرار أنماط العمل' },
  timeline_desc: { en: 'Visual project timeline', ar: 'جدول زمني مرئي للمشروع' },
  whiteboard_desc: { en: 'Collaborative mind map', ar: 'خريطة ذهنية تعاونية' },
  everything_in_one_place: { en: 'Everything in one place', ar: 'كل شيء في مكان واحد' },

  // Overview Tab Metrics & Messages
  total_tasks_kpi: { en: 'Total Tasks', ar: 'إجمالي المهام' },
  urgent_tasks_kpi: { en: 'Urgent Tasks', ar: 'المهام العاجلة' },
  overdue_kpi: { en: 'Overdue', ar: 'متأخرة' },
  notifications_kpi: { en: 'Notifications', ar: 'الإشعارات' },
  vs_last_month: { en: 'vs last month', ar: 'مقارنة بالشهر الماضي' },
  all_items_on_track: { en: 'All items are on track', ar: 'جميع المهام في المسار الصحيح' },
  urgent_items_attention: { en: '{count} urgent items require attention', ar: '{count} مهمة عاجلة تحتاج انتباه' },
  items_past_deadline: { en: '{count} items are past their deadline', ar: '{count} مهمة تجاوزت الموعد النهائي' },
  board_active: { en: 'Board active', ar: 'اللوحة نشطة' },
  dashboards_page_title: { en: 'Dashboards', ar: 'لوحات المعلومات' },
  dashboards_page_desc: { en: 'Centralized view of all department dashboards', ar: 'عرض مركزي لجميع لوحات معلومات الأقسام' },

  // Overview Charts
  tasks_by_status: { en: 'Tasks by Status', ar: 'المهام حسب الحالة' },
  priority_breakdown: { en: 'Priority Breakdown', ar: 'توزيع الأولويات' },
  total_score: { en: 'Total Score', ar: 'النتيجة الإجمالية' },
  recent_tasks: { en: 'Recent Tasks', ar: 'المهام الأخيرة' },
  upcoming_deadlines: { en: 'Upcoming Deadlines', ar: 'المواعيد النهائية القادمة' },
  no_tasks: { en: 'No tasks', ar: 'لا توجد مهام' },

  // Board Settings & Context Menu
  board_settings: { en: 'Board Settings', ar: 'إعدادات اللوحة' },
  name: { en: 'Name', ar: 'الاسم' },
  description: { en: 'Description', ar: 'الوصف' },
  add_view: { en: 'Add View', ar: 'إضافة عرض' },
  simple_tools: { en: 'Simple Tools', ar: 'أدوات بسيطة' },
  advanced_tools: { en: 'Advanced Tools', ar: 'أدوات متقدمة' },
  tab_options: { en: 'Tab Options', ar: 'خيارات التبويب' },
  pin_view: { en: 'Pin view', ar: 'تثبيت العرض' },
  unpin_view: { en: 'Unpin view', ar: 'إلغاء تثبيت العرض' },
  rename_view: { en: 'Rename view', ar: 'إعادة تسمية العرض' },
  duplicate_view: { en: 'Duplicate view', ar: 'تكرار العرض' },
  share_view: { en: 'Share view', ar: 'مشاركة العرض' },
  unlock_view: { en: 'Unlock view', ar: 'فتح العرض' },
  move_left: { en: 'Move Left', ar: 'نقل لليسار' },
  move_right: { en: 'Move Right', ar: 'نقل لليمين' },
  delete_view: { en: 'Delete view', ar: 'حذف العرض' },
  enter_fullscreen: { en: 'Enter Full Screen', ar: 'ملء الشاشة' },
  exit_fullscreen: { en: 'Exit Full Screen', ar: 'الخروج من ملء الشاشة' },

  // New Task Modal
  task_name: { en: 'Task Name', ar: 'اسم المهمة' },
  what_needs_done: { en: 'What needs to be done?', ar: 'ما الذي يجب القيام به؟' },
  priority: { en: 'Priority', ar: 'الأولوية' },
  due_date: { en: 'Due Date', ar: 'تاريخ الاستحقاق' },
  location: { en: 'Location', ar: 'الموقع' },
  remote: { en: 'Remote', ar: 'عن بُعد' },
  existing_board: { en: 'Existing Board', ar: 'لوحة موجودة' },
  workspace: { en: 'Workspace', ar: 'مساحة العمل' },
  select_workspace: { en: 'Select Workspace', ar: 'اختر مساحة العمل' },
  continue: { en: 'Continue', ar: 'متابعة' },
  new_board_name: { en: 'New Board Name', ar: 'اسم اللوحة الجديدة' },
  no_boards_found: { en: 'No boards found', ar: 'لم يتم العثور على لوحات' },
  create_task: { en: 'Create Task', ar: 'إنشاء مهمة' },

  // Priority Levels
  urgent: { en: 'Urgent', ar: 'عاجل' },
  high: { en: 'High', ar: 'مرتفع' },
  medium: { en: 'Medium', ar: 'متوسط' },
  low: { en: 'Low', ar: 'منخفض' },

  // Smart Bar
  quick_note: { en: 'Quick Note', ar: 'ملاحظة سريعة' },
  save_quick_note: { en: 'Save a quick note', ar: 'حفظ ملاحظة سريعة' },
  search_tasks_boards: { en: 'Search tasks & boards', ar: 'البحث في المهام واللوحات' },
  view_notes: { en: 'View Notes', ar: 'عرض الملاحظات' },
  see_saved_notes: { en: 'See your saved notes', ar: 'عرض ملاحظاتك المحفوظة' },
  select_board: { en: 'Select Board', ar: 'اختر لوحة' },
  recent_notes: { en: 'Recent Notes', ar: 'الملاحظات الأخيرة' },
  view_all: { en: 'View All', ar: 'عرض الكل' },
  no_notes_yet: { en: 'No notes yet', ar: 'لا توجد ملاحظات بعد' },
  type_search_boards: { en: 'Type to search boards...', ar: 'اكتب للبحث في اللوحات...' },
  type_task_enter: { en: 'Type your task and press Enter...', ar: 'اكتب مهمتك واضغط Enter...' },
  type_note_tags: { en: 'Type your note... use #tags', ar: 'اكتب ملاحظتك... استخدم #وسوم' },
  type_at_commands: { en: 'Type @ for commands...', ar: 'اكتب @ للأوامر...' },
  save: { en: 'Save', ar: 'حفظ' },
  add: { en: 'Add', ar: 'إضافة' },

  // Status
  status: { en: 'Status', ar: 'الحالة' },
  to_do: { en: 'To Do', ar: 'للقيام' },
  in_progress: { en: 'In Progress', ar: 'قيد التنفيذ' },
  done: { en: 'Done', ar: 'منجز' },
  completed: { en: 'Completed', ar: 'مكتمل' },
  not_started: { en: 'Not Started', ar: 'لم يبدأ' },

  // Common Actions
  confirm: { en: 'Confirm', ar: 'تأكيد' },
  submit: { en: 'Submit', ar: 'إرسال' },
  update: { en: 'Update', ar: 'تحديث' },
  create: { en: 'Create', ar: 'إنشاء' },

  duplicate: { en: 'Duplicate', ar: 'تكرار' },
  share: { en: 'Share', ar: 'مشاركة' },
  settings: { en: 'Settings', ar: 'الإعدادات' },

  // Misc
  attachment: { en: 'Attachment', ar: 'مرفق' },
  today: { en: 'Today', ar: 'اليوم' },
  yesterday: { en: 'Yesterday', ar: 'أمس' },
  tomorrow: { en: 'Tomorrow', ar: 'غداً' },
  next_week: { en: 'Next week', ar: 'الأسبوع القادم' },
  important: { en: 'Important', ar: 'مهم' },

  // Error Messages
  failed_to_delete: { en: 'Failed to delete', ar: 'فشل الحذف' },
  failed_to_archive: { en: 'Failed to archive', ar: 'فشل الأرشفة' },
  please_select_board: { en: 'Please select a board.', ar: 'يرجى اختيار لوحة.' },
  please_enter_board_name: { en: 'Please enter a board name and select a workspace.', ar: 'يرجى إدخال اسم اللوحة واختيار مساحة عمل.' },

  // Confirmation Dialogs
  delete_board: { en: 'Delete Board', ar: 'حذف اللوحة' },
  delete_board_confirm: { en: 'Are you sure you want to delete this board? This action cannot be undone.', ar: 'هل أنت متأكد من حذف هذه اللوحة؟ لا يمكن التراجع عن هذا الإجراء.' },

  // Board Creation
  board_name: { en: 'Board Name', ar: 'اسم اللوحة' },
  board_name_placeholder: { en: 'e.g. Q4 Marketing Plan', ar: 'مثال: خطة تسويق الربع الرابع' },
  board_icon: { en: 'Board Icon', ar: 'أيقونة اللوحة' },
  click_to_change_icon: { en: 'Click to change icon', ar: 'انقر لتغيير الأيقونة' },

  delete_workspace: { en: 'Delete Workspace', ar: 'حذف مساحة العمل' },
  delete_workspace_confirm: { en: 'Are you sure you want to delete this workspace? All boards within it will be deleted. This action cannot be undone.', ar: 'هل أنت متأكد من حذف مساحة العمل هذه؟ سيتم حذف جميع اللوحات فيها. لا يمكن التراجع عن هذا الإجراء.' },

  cannot_delete_only_workspace: { en: 'Cannot delete the only workspace. Create another one first.', ar: 'لا يمكن حذف مساحة العمل الوحيدة. قم بإنشاء واحدة أخرى أولاً.' },

  // Delete Board Modal
  delete_board_confirmation_named: { en: 'Are you sure you want to delete "{boardName}"? This action cannot be undone.', ar: 'هل أنت متأكد أنك تريد حذف "{boardName}"؟ لا يمكن التراجع عن هذا الإجراء.' },
  has_sub_boards_warning: { en: 'This board contains nested sub-boards. How would you like to handle them?', ar: 'تحتوي هذه اللوحة على لوحات فرعية متداخلة. كيف تود التعامل معها؟' },
  delete_single_board: { en: 'Delete this board only', ar: 'حذف هذه اللوحة فقط' },
  delete_single_board_desc: { en: 'Sub-boards will be moved to the parent level.', ar: 'سيتم نقل اللوحات الفرعية إلى المستوى الأعلى.' },
  delete_recursive_board: { en: 'Delete board and sub-boards', ar: 'حذف اللوحة واللوحات الفرعية' },
  delete_recursive_board_desc: { en: 'Everything will be permanently deleted.', ar: 'سيتم حذف كل شيء بشكل دائم.' },

  // Department & Page Names
  operations: { en: 'Operations', ar: 'العمليات' },
  sales: { en: 'Sales', ar: 'المبيعات' },
  purchases: { en: 'Purchases', ar: 'المشتريات' },
  stock_inventory: { en: 'Stock / Inventory', ar: 'المخزون' },
  finance: { en: 'Finance', ar: 'المالية' },
  expenses: { en: 'Expenses', ar: 'المصروفات' },
  people: { en: 'People', ar: 'الأشخاص' },
  customers: { en: 'Customers', ar: 'العملاء' },
  suppliers: { en: 'Suppliers', ar: 'الموردون' },
  supply_chain: { en: 'Supply Chain', ar: 'سلسلة التوريد' },
  procurement: { en: 'Procurement', ar: 'المشتريات' },
  warehouse: { en: 'Warehouse', ar: 'المستودع' },
  fleet: { en: 'Fleet', ar: 'الأسطول' },
  vendors: { en: 'Vendors', ar: 'البائعون' },
  planning: { en: 'Planning', ar: 'التخطيط' },
  manufacturing: { en: 'Manufacturing', ar: 'التصنيع' },
  maintenance: { en: 'Maintenance', ar: 'الصيانة' },
  production: { en: 'Production', ar: 'الإنتاج' },
  quality: { en: 'Quality', ar: 'الجودة' },
  business: { en: 'Business', ar: 'الأعمال' },
  listings: { en: 'Listings', ar: 'القوائم' },
  sales_listings: { en: 'Sales', ar: 'المبيعات' },
  sales_factory: { en: 'Finance', ar: 'المالية' },
  business_support: { en: 'Support', ar: 'الدعم' },
  it: { en: 'IT', ar: 'تقنية المعلومات' },
  it_support: { en: 'IT Support', ar: 'دعم تقنية المعلومات' },
  hr: { en: 'HR', ar: 'الموارد البشرية' },
  marketing: { en: 'Marketing', ar: 'التسويق' },
  shipping: { en: 'Shipping', ar: 'الشحن' },
  local_marketplace: { en: 'Local Marketplace', ar: 'السوق المحلي' },
  foreign_marketplace: { en: 'Foreign Marketplace', ar: 'السوق الأجنبي' },
  main: { en: 'Main', ar: 'الرئيسية' },
  marketplace: { en: 'Marketplace', ar: 'السوق' },
  departments: { en: 'Departments', ar: 'الأقسام' },
  supply_chain_group: { en: 'Supply Chain (Group)', ar: 'سلسلة التوريد (مجموعة)' },
  operations_group: { en: 'Operations (Group)', ar: 'العمليات (مجموعة)' },
  business_group: { en: 'Business (Group)', ar: 'الأعمال (مجموعة)' },
  business_support_group: { en: 'Business Support (Group)', ar: 'دعم الأعمال (مجموعة)' },

  // Talk Page
  channels: { en: 'Channels', ar: 'القنوات' },
  direct_messages: { en: 'Direct Messages', ar: 'الرسائل المباشرة' },
  new_discussion: { en: 'New Discussion', ar: 'محادثة جديدة' },
  active_sprint: { en: 'Active Sprint', ar: 'سبرينت نشط' },
  no_messages_yet: { en: 'No messages yet', ar: 'لا توجد رسائل بعد' },
  start_new_discussion_desc: { en: 'Select a channel or start a new discussion to begin talking.', ar: 'اختر قناة أو ابدأ مناقشة جديدة.' },
  mentions_and_files: { en: 'Mentions & Files', ar: 'الإشارات والملفات' },
  no_active_tasks: { en: 'No active tasks', ar: 'لا توجد مهام نشطة' },
  no_recent_files: { en: 'No recent files', ar: 'لا توجد ملفات حديثة' },
  pro_tip: { en: 'Pro Tip:', ar: 'نصيحة:' },
  type: { en: 'Type', ar: 'اكتب' },
  to_create_task_chat: { en: 'to create a new task directly from chat.', ar: 'لإنشاء مهمة جديدة مباشرة من الدردشة.' },
  new_message: { en: 'New Message', ar: 'رسالة جديدة' },
  no_conversations: { en: 'No conversations yet', ar: 'لا توجد محادثات بعد' },
  select_conversation: { en: 'Select Conversation', ar: 'اختر محادثة' },
  select_or_start_conversation: { en: 'Choose a conversation from the sidebar or start a new one', ar: 'اختر محادثة من الشريط الجانبي أو ابدأ واحدة جديدة' },
  start_new_conversation: { en: 'Start New Conversation', ar: 'بدء محادثة جديدة' },
  send_first_message: { en: 'Send the first message to start the conversation', ar: 'أرسل الرسالة الأولى لبدء المحادثة' },
  select_conversation_to_see_data: { en: 'Select a conversation to see tasks & reminders', ar: 'اختر محادثة لعرض المهام والتذكيرات' },
  // Note: 'no_tasks' already defined above
  no_reminders: { en: 'No reminders', ar: 'لا توجد تذكيرات' },
  no_files: { en: 'No files', ar: 'لا توجد ملفات' },
  send_to_board: { en: 'Send to Board', ar: 'إرسال إلى اللوحة' },
  select_board_desc: { en: 'Select board:', ar: 'اختر اللوحة:' },
  no_boards_available: { en: 'No boards available', ar: 'لا توجد لوحات متاحة' },
  online: { en: 'Online', ar: 'متصل' },
  offline: { en: 'Offline', ar: 'غير متصل' },
  save_to_vault_optional: { en: 'Save to Vault?', ar: 'حفظ في الخزنة؟' },
  save_to_vault_desc: { en: 'Keep a copy in your secure vault', ar: 'احتفظ بنسخة في خزنتك الآمنة' },
  upload_to_chat: { en: 'Upload to Chat', ar: 'رفع إلى الدردشة' },
  file_details: { en: 'File Details', ar: 'تفاصيل الملف' },
  view_file: { en: 'View File', ar: 'عرض الملف' },
  close_chat: { en: 'Close Chat', ar: 'إغلاق المحادثة' },
  delete_chat: { en: 'Delete Chat', ar: 'حذف المحادثة' },
  chat_closed_owner: { en: 'You have closed this chat.', ar: 'لقد قمت بإغلاق هذه المحادثة.' },
  chat_closed_participant: { en: 'The team member who created this chat has closed it. You can\'t send messages anymore.', ar: 'قام العضو الذي أنشأ هذه المحادثة بإغلاقها. لا يمكنك إرسال رسائل بعد الآن.' },
  chat_deleted_participant: { en: 'This chat has been deleted by the owner.', ar: 'تم حذف هذه المحادثة من قبل المالك.' },
  confirm_close_chat: { en: 'Are you sure you want to close this chat? Participants will no longer be able to send messages.', ar: 'هل أنت متأكد أنك تريد إغلاق هذه المحادثة؟ لن يتمكن المشاركون من إرسال رسائل بعد الآن.' },
  confirm_delete_chat: { en: 'Are you sure you want to delete this chat? This action cannot be undone.', ar: 'هل أنت متأكد أنك تريد حذف هذه المحادثة؟ لا يمكن التراجع عن هذا الإجراء.' },

  // Vault Page (unique entries only)
  no_folders_yet: { en: 'No folders yet', ar: 'لا توجد مجلدات بعد' },
  add_login: { en: 'Add Login', ar: 'إضافة تسجيل دخول' },
  new_folder: { en: 'New Folder', ar: 'مجلد جديد' },
  secure_note: { en: 'Secure Note', ar: 'ملاحظة آمنة' },

  // GTD Page
  getting_things_done: { en: 'Getting Things Done', ar: 'إنجاز المهام' },

  // Additional
  back: { en: 'Back', ar: 'رجوع' },

  // Tools & Views
  dashboards: { en: 'Dashboards', ar: 'لوحات المعلومات' },
  reports: { en: 'Reports', ar: 'التقارير' },
  logistics: { en: 'Logistics', ar: 'الخدمات اللوجستية' },

  // Auth
  sign_out: { en: 'Sign out', ar: 'تسجيل الخروج' },

  // Settings Page
  general_settings: { en: 'General Settings', ar: 'الإعدادات العامة' },
  manage_profile_desc: { en: 'Manage your profile and workspace preferences.', ar: 'إدارة ملفك الشخصي وتفضيلات مساحة العمل.' },
  profile_information: { en: 'Profile Information', ar: 'معلومات الملف الشخصي' },
  email_address: { en: 'Email Address', ar: 'البريد الإلكتروني' },
  display_name: { en: 'Display Name', ar: 'الاسم المعروض' },
  change_photo: { en: 'Change Photo', ar: 'تغيير الصورة' },
  job_title: { en: 'Job Title', ar: 'المسمى الوظيفي' },
  bio: { en: 'Bio', ar: 'نبذة' },
  save_profile: { en: 'Save Profile', ar: 'حفظ الملف الشخصي' },
  placeholder_job_title: { en: 'Product Manager', ar: 'مدير منتج' },
  placeholder_department: { en: 'Engineering', ar: 'الهندسة' },
  preferences: { en: 'Preferences', ar: 'التفضيلات' },
  appearance: { en: 'Appearance', ar: 'المظهر' },
  switch_theme_desc: { en: 'Switch between light and dark mode', ar: 'التبديل بين الوضع الفاتح والداكن' },
  change_language_desc: { en: 'Switch between English and Arabic', ar: 'التبديل بين الإنجليزية والعربية' },

  // Security Section
  security: { en: 'Security', ar: 'الأمان' },
  change_password: { en: 'Change Password', ar: 'تغيير كلمة المرور' },
  update_password_desc: { en: 'Update your account password', ar: 'تحديث كلمة مرور حسابك' },
  manage: { en: 'Manage', ar: 'إدارة' },

  // Developer Login
  enter_dev_credentials: { en: 'Enter your developer credentials below', ar: 'أدخل بيانات المطور أدناه' },

  // Event Modal
  create_event: { en: 'Create Event', ar: 'إنشاء حدث' },
  schedule_event_desc: { en: 'Schedule a new event for your project', ar: 'جدولة حدث جديد لمشروعك' },
  project_context: { en: 'Project Context', ar: 'سياق المشروع' },
  event_title: { en: 'Event Title', ar: 'عنوان الحدث' },
  placeholder_event_title: { en: 'e.g. Project Kickoff Meeting', ar: 'مثال: اجتماع انطلاق المشروع' },
  placeholder_event_desc: { en: 'Add details about this event...', ar: 'أضف تفاصيل حول هذا الحدث...' },
  attendees: { en: 'Attendees', ar: 'الحضور' },
  add_people: { en: 'Add people...', ar: 'إضافة أشخاص...' },

  // Settings Page
  account_settings: { en: 'Account Settings', ar: 'إعدادات الحساب' },
  notification_settings: { en: 'Notification Settings', ar: 'إعدادات الإشعارات' },
  control_notifications_desc: { en: 'Control how you receive notifications.', ar: 'تحكم في كيفية تلقي الإشعارات.' },
  manage_notifications_desc: { en: 'Manage your notification preferences.', ar: 'إدارة تفضيلات الإشعارات الخاصة بك.' },
  email_digest: { en: 'Email Digest', ar: 'ملخص البريد الإلكتروني' },
  realtime_alerts: { en: 'Real-time Alerts', ar: 'تنبيهات فورية' },
  mobile_push: { en: 'Mobile Push', ar: 'إشعارات الجوال' },
  slack_integration: { en: 'Slack Integration', ar: 'تكامل Slack' },

  general: { en: 'General', ar: 'عام' },
  user_profile: { en: 'User Profile', ar: 'الملف الشخصي' },
  email_notifications: { en: 'Email Notifications', ar: 'إشعارات البريد الإلكتروني' },
  push_notifications: { en: 'Push Notifications', ar: 'الإشعارات الفورية' },
  privacy_security: { en: 'Privacy & Security', ar: 'الخصوصية والأمان' },

  // Dashboard & Home


  // Arcade Games


  // TopBar - Focus Timer
  pause: { en: 'Pause', ar: 'إيقاف مؤقت' },
  resume: { en: 'Resume', ar: 'استئناف' },
  reset: { en: 'Reset', ar: 'إعادة تعيين' },
  cancel_session: { en: 'Cancel Session', ar: 'إلغاء الجلسة' },
  sleep_mode: { en: 'Sleep Mode', ar: 'وضع السكون' },
  chain_system: { en: 'Chain System', ar: 'نظام السلسلة' },

  // Smart Bar Commands
  create_task_in_board: { en: 'Create a task in a board', ar: 'إنشاء مهمة في لوحة' },
  save_a_quick_note: { en: 'Save a quick note', ar: 'حفظ ملاحظة سريعة' },
  type_newtask_select_board: { en: 'Type @newtask/ to select a board', ar: 'اكتب @newtask/ لاختيار لوحة' },
  added_to: { en: 'Added to', ar: 'أُضيف إلى' },
  note_saved: { en: 'Note saved', ar: 'تم حفظ الملاحظة' },
  open_smart_bar: { en: 'Open Smart Bar', ar: 'فتح الشريط الذكي' },

  // Board View
  add_description: { en: 'Add a detailed description...', ar: 'أضف وصفاً مفصلاً...' },
  enter_view_name: { en: 'Enter new name for this view:', ar: 'أدخل اسماً جديداً لهذا العرض:' },

  // Kanban & List
  assign: { en: 'Assign', ar: 'تعيين' },
  add_dates: { en: 'Add dates', ar: 'إضافة تواريخ' },
  add_priority: { en: 'Add priority', ar: 'إضافة أولوية' },
  add_tag: { en: 'Add tag', ar: 'إضافة وسم' },
  tags_count: { en: 'tags', ar: 'وسوم' },
  task_name_placeholder: { en: 'Task Name...', ar: 'اسم المهمة...' },
  search_placeholder: { en: 'Search...', ar: 'بحث...' },
  search_or_add_tags: { en: 'Search or add tags...', ar: 'البحث أو إضافة وسوم...' },
  search_or_create_tag: { en: 'Search or Create tag...', ar: 'البحث أو إنشاء وسم...' },
  status_name: { en: 'Status name', ar: 'اسم الحالة' },
  task_name_or_commands: { en: "Task Name or type '/' for commands", ar: "اسم المهمة أو اكتب '/' للأوامر" },
  write_comment: { en: 'Write a comment...', ar: 'اكتب تعليقاً...' },
  expand: { en: 'Expand', ar: 'توسيع' },
  add_column: { en: 'Add Column', ar: 'إضافة عمود' },
  new_tab: { en: 'New Tab', ar: 'علامة تبويب جديدة' },
  manage_reminders: { en: 'Manage reminders', ar: 'إدارة التذكيرات' },
  add_reminder: { en: 'Add reminder', ar: 'إضافة تذكير' },
  untitled: { en: 'Untitled', ar: 'بدون عنوان' },
  enter_group_name: { en: 'Enter group name:', ar: 'أدخل اسم المجموعة:' },
  confirm_archive_tasks: { en: 'Are you sure you want to archive all tasks in this group?', ar: 'هل أنت متأكد من أرشفة جميع المهام في هذه المجموعة؟' },
  confirm_delete_group: { en: 'Are you sure you want to delete this group? All tasks within it will be deleted.', ar: 'هل أنت متأكد من حذف هذه المجموعة؟ سيتم حذف جميع المهام فيها.' },

  // Sort Options
  task_name_sort: { en: 'Task Name', ar: 'اسم المهمة' },
  toggle_direction: { en: 'Toggle Direction', ar: 'تبديل الاتجاه' },
  ascending: { en: 'Ascending', ar: 'تصاعدي' },
  descending: { en: 'Descending', ar: 'تنازلي' },
  sort_by: { en: 'Sort By', ar: 'ترتيب حسب' },
  filter_by_priority: { en: 'Filter by Priority', ar: 'تصفية حسب الأولوية' },
  filter_by_assignee: { en: 'Filter by Assignee', ar: 'تصفية حسب المكلف' },
  clear_all_filters: { en: 'Clear All Filters', ar: 'مسح جميع الفلاتر' },

  // Menu Items
  convert_to: { en: 'Convert to', ar: 'تحويل إلى' },
  task_type: { en: 'Task Type', ar: 'نوع المهمة' },
  remind_me: { en: 'Remind me', ar: 'ذكرني' },
  follow_task: { en: 'Follow task', ar: 'متابعة المهمة' },
  send_email_to_task: { en: 'Send email to task', ar: 'إرسال بريد للمهمة' },
  add_to: { en: 'Add To', ar: 'إضافة إلى' },
  merge: { en: 'Merge', ar: 'دمج' },
  start_timer: { en: 'Start timer', ar: 'بدء المؤقت' },
  dependencies: { en: 'Dependencies', ar: 'التبعيات' },

  // Table View
  search_this_board: { en: 'Search this board', ar: 'البحث في هذه اللوحة' },
  find_columns: { en: 'Find columns to show/hide', ar: 'البحث عن أعمدة لإظهارها/إخفائها' },
  no_assigned_users: { en: 'No assigned users found', ar: 'لا يوجد مستخدمين معينين' },
  value_placeholder: { en: 'Value', ar: 'القيمة' },

  // Sidebar
  expand_sidebar: { en: 'Expand sidebar', ar: 'توسيع الشريط الجانبي' },
  add_sub_board: { en: 'Add sub-board', ar: 'إضافة لوحة فرعية' },
  test_tools: { en: 'Test Tools', ar: 'أدوات الاختبار' },
  more_options: { en: 'More options', ar: 'خيارات إضافية' },
  spreadsheet_view: { en: 'Spreadsheet view', ar: 'عرض جدول البيانات' },
  visual_workflow: { en: 'Visual workflow', ar: 'سير عمل مرئي' },
  customize_quick_nav: { en: 'Customize quick nav', ar: 'تخصيص التنقل السريع' },
  no_tags: { en: 'No tags', ar: 'بدون وسوم' },
  in_board: { en: 'in', ar: 'في' },

  // GTD
  write_it_down: { en: 'Write it down...', ar: 'اكتبه...' },
  enter: { en: 'Enter', ar: 'إدخال' },
  review: { en: 'Review', ar: 'مراجعة' },
  backlog: { en: 'Backlog', ar: 'قائمة الانتظار' },
  pending: { en: 'Pending', ar: 'معلق' },

  // Vault
  direction: { en: 'Direction', ar: 'الاتجاه' },
  no_grouping: { en: 'No Grouping', ar: 'بدون تجميع' },
  new_subfolder: { en: 'New Subfolder', ar: 'مجلد فرعي جديد' },
  new_note: { en: 'New Note', ar: 'ملاحظة جديدة' },
  web_link: { en: 'Web Link', ar: 'رابط ويب' },
  upload_file: { en: 'Upload File', ar: 'رفع ملف' },
  something_went_wrong: { en: 'Something went wrong', ar: 'حدث خطأ ما' },
  retry: { en: 'Retry', ar: 'إعادة المحاولة' },
  new: { en: 'New', ar: 'جديد' },
  date: { en: 'Date', ar: 'التاريخ' },
  size: { en: 'Size', ar: 'الحجم' },
  sort_type: { en: 'Type', ar: 'النوع' },
  create_new_group: { en: 'Create New Group', ar: 'إنشاء مجموعة جديدة' },
  files: { en: 'Files', ar: 'الملفات' },
  trash: { en: 'Trash', ar: 'المحذوفات' },

  // Supply Chain - General
  warehouse_dashboards: { en: 'Warehouse Dashboards', ar: 'لوحات المستودع' },
  shipping_dashboards: { en: 'Shipping Dashboards', ar: 'لوحات الشحن' },


  // Vault Sidebar & Groups

  all_items: { en: 'All Items', ar: 'جميع العناصر' },

  weblinks: { en: 'Web Links', ar: 'روابط الويب' },
  documents: { en: 'Documents', ar: 'المستندات' },
  images: { en: 'Images', ar: 'الصور' },
  logins: { en: 'Logins', ar: 'بيانات الدخول' },
  secure_notes: { en: 'Secure Notes', ar: 'ملاحظات آمنة' },
  last_7_days: { en: 'Last 7 Days', ar: 'آخر 7 أيام' },
  older: { en: 'Older', ar: 'الأقدم' },

  notes_group: { en: 'Notes', ar: 'الملاحظات' },
  weblinks_group: { en: 'Web Links', ar: 'روابط الويب' },
  folders_group: { en: 'Folders', ar: 'المجلدات' },

  // Vault Empty States
  no_matching_items: { en: 'No matching items found', ar: 'لم يتم العثور على عناصر مطابقة' },
  no_matching_desc: { en: 'We couldn\'t find anything matching "{query}". Try a different keyword or check for typos.', ar: 'لم نتمكن من العثور على أي شيء يطابق "{query}". جرب كلمة مفتاحية مختلفة أو تحقق من الأخطاء الإملائية.' },
  clear_search: { en: 'Clear search', ar: 'مسح البحث' },
  no_favorites_yet: { en: 'No favorites yet', ar: 'لا توجد مفضلات بعد' },
  favorites_empty_desc: { en: 'Mark important items as favorites to access them quickly from here.', ar: 'قم بتمييز العناصر المهمة كمفضلة للوصول إليها بسرعة من هنا.' },
  no_category_yet: { en: 'No {category}s yet', ar: 'لا توجد {category} بعد' },
  empty_folder_desc: { en: 'This folder is empty. Start by creating a new {category}.', ar: 'هذا المجلد فارغ. ابدأ بإنشاء {category} جديد.' },
  create_category_item: { en: 'Create new {category}', ar: 'إنشاء {category} جديد' },
  this_folder_is_empty: { en: 'This folder is empty', ar: 'هذا المجلد فارغ' },
  add_new_items_folder: { en: 'Add new items specifically to this folder.', ar: 'أضف عناصر جديدة خصيصًا لهذا المجلد.' },

  secure_digital_life: { en: 'Secure your digital life', ar: 'أمّن حياتك الرقمية' },
  vault_empty_desc: { en: 'Your vault is empty. Store passwords, secure notes, and sensitive documents with bank-grade encryption.', ar: 'خزنتك فارغة. قم بتخزين كلمات المرور والملاحظات الآمنة والمستندات الحساسة بتشفير بنكي.' },

  save_passwords_desc: { en: 'Save passwords & credentials', ar: 'حفظ كلمات المرور وبيانات الاعتماد' },
  create_secure_folder: { en: 'Create a secure folder', ar: 'إنشاء مجلد آمن' },

  encrypted_text_notes: { en: 'Encrypted text notes', ar: 'ملاحظات نصية مشفرة' },
  import_from_1password: { en: 'Import from 1Password / Chrome', ar: 'استيراد من 1Password / Chrome' },
  to_create_new_item: { en: 'to create new item', ar: 'لإنشاء عنصر جديد' },

  fleet_dashboards: { en: 'Fleet Dashboards', ar: 'لوحات الأسطول' },
  vendor_dashboards: { en: 'Vendor Dashboards', ar: 'لوحات الموردين' },
  planning_dashboards: { en: 'Planning Dashboards', ar: 'لوحات التخطيط' },
  visual_warehouse_space_map: { en: 'Visual warehouse space map', ar: 'خريطة مرئية لمساحة المستودع' },
  dynamic_dashboard_view: { en: 'Dynamic Dashboard View', ar: 'عرض لوحة تحكم ديناميكي' },
  vs_last_week: { en: 'vs. last week', ar: 'مقارنة بالأسبوع الماضي' },
  trends: { en: 'Trends', ar: 'الاتجاهات' },

  // Shipping Dashboard
  shipping_dashboard: { en: 'Shipping Dashboard', ar: 'لوحة الشحن' },
  logistics_tracking_desc: { en: 'Logistics tracking, delivery performance, and route optimization.', ar: 'تتبع الخدمات اللوجستية وأداء التسليم وتحسين المسارات.' },
  active_shipments: { en: 'Active Shipments', ar: 'الشحنات النشطة' },
  // Activity Patterns
  activity_created_board: { en: 'Created board: {name}', ar: 'تم إنشاء اللوحة: {name}' },
  activity_created_task: { en: 'Created task "{task}" in {board}', ar: 'تم إنشاء المهمة "{task}" في {board}' },
  activity_updated_status: { en: 'Updated "{task}" status to {status} in {board}', ar: 'تم تحديث حالة "{task}" إلى {status} في {board}' },
  activity_sent_email: { en: 'Sent email to {email}', ar: 'تم إرسال بريد إلى {email}' },
  activity_deleted_board: { en: 'Deleted board: {name}', ar: 'تم حذف اللوحة: {name}' },

  // Arcade Descriptions

  // Arcade Games
  games_suffix: { en: 'games', ar: 'لعبة' },
  press_esc_to_pause: { en: 'Press ESC while playing to pause the game', ar: 'اضغط ESC أثناء اللعب لإيقاف اللعبة مؤقتاً' },
  'space-shooter': { en: 'Space Shooter', ar: 'مهاجم الفضاء' },
  'desc_space-shooter': { en: 'Classic vertical scrolling shooter. Destroy enemies, collect power-ups, survive waves!', ar: 'لعبة إطلاق نار كلاسيكية. دمر الأعداء واجمع القوة!' },

  'space-invaders': { en: 'Space Invaders', ar: 'غزاة الفضاء' },
  'desc_space-invaders': { en: 'Defend Earth from descending alien invaders. Classic arcade action!', ar: 'دافع عن الأرض من الغزاة الفضائيين. أكشن كلاسيكي!' },

  'asteroids': { en: 'Asteroids', ar: 'الكويكبات' },
  'desc_asteroids': { en: 'Navigate your ship through space and destroy asteroids to survive!', ar: 'قُد سفينتك عبر الفضاء ودمر الكويكبات للبقاء على قيد الحياة!' },

  'snake': { en: 'Snake', ar: 'الثعبان' },
  'desc_snake': { en: 'Classic snake game. Eat food to grow!', ar: 'لعبة الثعبان الكلاسيكية. كل الطعام لتكبر!' },

  'tetris': { en: 'Tetris', ar: 'تتريس' },
  'desc_tetris': { en: 'Stack falling blocks to clear lines.', ar: 'رتب الكتل المتساقطة لتحطيم الخطوط.' },

  'breakout': { en: 'Breakout', ar: 'تحطيم الطوب' },
  'desc_breakout': { en: 'Bounce the ball and break all the bricks. Collect power-ups!', ar: 'اكسر الطوب بالكرة. اجمع القوة!' },

  'pong': { en: 'Pong', ar: 'بونغ' },
  'desc_pong': { en: 'Classic paddle game against AI. First to 7 points wins!', ar: 'لعبة المضرب الكلاسيكية. أول من يصل 7 نقاط يفوز!' },

  'flappy-bird': { en: 'Flappy Bird', ar: 'الطائر المحلق' },
  'desc_flappy-bird': { en: 'Tap to fly through pipes. Simple but addictive!', ar: 'انقر للطيران عبر الأنابيب. بسيطة لكن ممتعة!' },

  'whack-a-mole': { en: 'Whack-a-Mole', ar: 'اضرب الخلد' },
  'desc_whack-a-mole': { en: 'Hit the moles as they pop up! Golden moles worth more points!', ar: 'اضرب حيوان الخلد عندما يظهر! الخلد الذهبي يساوي نقاط أكثر!' },

  'memory-match': { en: 'Memory Match', ar: 'تطابق الذاكرة' },
  'desc_memory-match': { en: 'Find matching pairs. Test your memory skills!', ar: 'جد الأزواج المتطابقة. اختبر مهارات ذاكرتك!' },

  'sudoku': { en: 'Sudoku', ar: 'سودوكو' },
  'desc_sudoku': { en: 'Fill the grid so every row, column, and 3x3 box has 1-9!', ar: 'املأ الشبكة بحيث يحتوي كل صف وعمود ومربع على 1-9!' },

  'simon-says': { en: 'Simon Says', ar: 'سايمون يقول' },
  'desc_simon-says': { en: 'Remember and repeat the color sequence. Test your memory!', ar: 'تذكر وكرر تسلسل الألوان. اختبر ذاكرتك!' },
  page_visibility: { en: 'Page Visibility', ar: 'إعدادات الصفحات' },
  views_visibility: { en: 'Views Visibility', ar: 'رؤية الصفحات' },
  customize_sidebar_desc: { en: 'Customize which pages appear in your sidebar.', ar: 'تخصيص الصفحات التي تظهر في الشريط الجانبي.' },
  visibility_control: { en: 'Visibility Control', ar: 'التحكم في الرؤية' },
  toggle_pages_desc: { en: 'Toggle pages on or off to customize your experience.', ar: 'شغّل أو عطّل الصفحات لتخصيص تجربتك.' },





  on_track: { en: 'On Track', ar: 'على المسار' },
  use_quick_notes_hint: { en: 'If you want to write a quick note use NABD Bar', ar: 'إذا أردت كتابة ملاحظة سريعة استخدم شريط نبض' },

  // Team Profile
  back_to_team: { en: 'Back to Team', ar: 'العودة للفريق' },
  message_btn: { en: 'Message', ar: 'رسالة' },
  department: { en: 'Department', ar: 'القسم' },
  last_active_prefix: { en: 'Last active:', ar: 'آخر نشاط:' },
  tasks_completed: { en: 'Tasks Completed', ar: 'المهام المكتملة' },
  avg_response_time: { en: 'Avg. Response Time', ar: 'متوسط وقت الاستجابة' },
  performance_score: { en: 'Performance Score', ar: 'نقاط الأداء' },
  overview_tab: { en: 'Overview', ar: 'نظرة عامة' },
  performance_tab: { en: 'Performance', ar: 'الأداء' },
  activity_tab: { en: 'Activity', ar: 'النشاط' },
  about_section: { en: 'About', ar: 'نبذة' },
  team_dept: { en: 'Team', ar: 'فريق' },
  management: { en: 'Management', ar: 'إدارة' },
  current_projects: { en: 'Current Projects', ar: 'المشاريع الحالية' },
  q3_marketing_campaign: { en: 'Q3 Marketing Campaign', ar: 'حملة تسويق الربع الثالث' },
  due_in_days: { en: 'Due in {days} days', ar: 'يستحق خلال {days} أيام' },
  performance_coming_soon: { en: 'Performance metrics are coming soon.', ar: 'مقاييس الأداء قادمة قريباً.' },
  completed_task: { en: 'Completed task', ar: 'أكمل مهمة' },
  hours_ago: { en: '{count} hours ago', ar: 'منذ {count} ساعة' },

  delayed: { en: 'Delayed', ar: 'متأخر' },
  delivered_today: { en: 'Delivered Today', ar: 'تم التسليم اليوم' },
  target_met: { en: 'Target Met', ar: 'تم تحقيق الهدف' },
  in_transit: { en: 'In Transit', ar: 'في الطريق' },
  normal: { en: 'Normal', ar: 'عادي' },
  shipments_by_zone: { en: 'Shipments by Zone', ar: 'الشحنات حسب المنطقة' },

  // Fleet Dashboard
  fleet_management: { en: 'Fleet Management', ar: 'إدارة الأسطول' },
  vehicle_status_desc: { en: 'Vehicle status, maintenance schedules, and utilization.', ar: 'حالة المركبات وجداول الصيانة ومعدلات الاستخدام.' },
  total_fleet: { en: 'Total Fleet', ar: 'إجمالي الأسطول' },
  active: { en: 'Active', ar: 'نشط' },
  in_maintenance: { en: 'In Maintenance', ar: 'في الصيانة' },
  scheduled: { en: 'Scheduled', ar: 'مجدول' },
  distance_today: { en: 'Distance (Today)', ar: 'المسافة (اليوم)' },
  fuel_efficiency: { en: 'Fuel Efficiency', ar: 'كفاءة الوقود' },
  utilization_by_type: { en: 'Utilization by Type', ar: 'الاستخدام حسب النوع' },

  // Vendors Dashboard
  vendor_management: { en: 'Vendor Management', ar: 'إدارة الموردين' },
  supplier_performance_desc: { en: 'Supplier performance, relationships, and spend analysis.', ar: 'أداء الموردين والعلاقات وتحليل الإنفاق.' },
  active_vendors: { en: 'Active Vendors', ar: 'الموردون النشطون' },
  total: { en: 'Total', ar: 'الإجمالي' },
  top_rated: { en: 'Top Rated', ar: 'الأعلى تقييماً' },
  avg_lead_time: { en: 'Avg Lead Time', ar: 'متوسط وقت التسليم' },
  monthly_spend: { en: 'Monthly Spend', ar: 'الإنفاق الشهري' },
  spend_by_category: { en: 'Spend by Category', ar: 'الإنفاق حسب الفئة' },

  // Planning Dashboard
  demand_planning: { en: 'Demand Planning', ar: 'تخطيط الطلب' },
  forecasting_desc: { en: 'Forecasting, demand sensing, and supply alignment.', ar: 'التنبؤ واستشعار الطلب ومواءمة العرض.' },
  forecast_accuracy: { en: 'Forecast Accuracy', ar: 'دقة التنبؤ' },
  demand_growth: { en: 'Demand Growth', ar: 'نمو الطلب' },
  planning_cycle: { en: 'Planning Cycle', ar: 'دورة التخطيط' },
  weekly: { en: 'Weekly', ar: 'أسبوعي' },
  stockout_risks: { en: 'Stockout Risks', ar: 'مخاطر نفاد المخزون' },
  attention: { en: 'Attention', ar: 'انتباه' },
  forecast_vs_actual: { en: 'Forecast vs Actual', ar: 'التنبؤ مقابل الفعلي' },
  forecast: { en: 'Forecast', ar: 'التنبؤ' },
  actual: { en: 'Actual', ar: 'الفعلي' },

  // Warehouse Capacity Map
  warehouse_capacity_map: { en: 'Warehouse Capacity Map', ar: 'خريطة سعة المستودع' },
  live_inventory_positioning: { en: 'Live inventory positioning and facility status', ar: 'تحديد موقع المخزون الحي وحالة المنشأة' },
  filters: { en: 'Filters', ar: 'التصفية' },
  refine_floor_view: { en: 'Refine the floor view', ar: 'تحسين عرض الطابق' },
  zones: { en: 'Zones', ar: 'المناطق' },
  receiving_zone_a: { en: 'Receiving (Zone A)', ar: 'الاستلام (المنطقة أ)' },
  storage_zone_b: { en: 'Storage (Zone B)', ar: 'التخزين (المنطقة ب)' },
  shipping_zone_c: { en: 'Shipping (Zone C)', ar: 'الشحن (المنطقة ج)' },
  empty: { en: 'Empty', ar: 'فارغ' },
  partial: { en: 'Partial', ar: 'جزئي' },
  full: { en: 'Full', ar: 'ممتلئ' },
  issue: { en: 'Issue', ar: 'مشكلة' },
  reset_filters: { en: 'Reset Filters', ar: 'إعادة تعيين التصفية' },
  capacity_used: { en: 'Capacity Used', ar: 'السعة المستخدمة' },
  pending_in: { en: 'Pending In', ar: 'في انتظار الدخول' },
  total_units: { en: 'Total Units', ar: 'إجمالي الوحدات' },
  issues: { en: 'Issues', ar: 'المشاكل' },
  receiving_bay: { en: 'Receiving Bay', ar: 'منطقة الاستلام' },
  zone_a: { en: 'Zone A', ar: 'المنطقة أ' },
  zone_c: { en: 'Zone C', ar: 'المنطقة ج' },
  no_outbound_lanes: { en: 'No outbound lanes', ar: 'لا توجد ممرات خروج' },
  details: { en: 'Details', ar: 'التفاصيل' },
  bin: { en: 'Bin', ar: 'الحاوية' },
  occupancy: { en: 'Occupancy', ar: 'الإشغال' },
  stock_item: { en: 'Stock Item', ar: 'عنصر المخزون' },
  unassigned: { en: 'Unassigned', ar: 'غير مخصص' },
  quantity: { en: 'Quantity', ar: 'الكمية' },
  units: { en: 'Units', ar: 'وحدات' },
  smart_tip: { en: 'Smart Tip', ar: 'نصيحة ذكية' },
  analyzing_live_capacity: { en: 'Analyzing live capacity...', ar: 'جاري تحليل السعة الحية...' },
  enable_gemini_api: { en: 'Enable Gemini API to see live recommendations.', ar: 'قم بتفعيل Gemini API لرؤية التوصيات الحية.' },
  add_gemini_api_key: { en: 'Add VITE_GEMINI_API_KEY to enable Smart Tips.', ar: 'أضف VITE_GEMINI_API_KEY لتفعيل النصائح الذكية.' },
  smart_tips_unavailable: { en: 'Smart Tips are temporarily unavailable.', ar: 'النصائح الذكية غير متاحة مؤقتاً.' },
  ai_standing_by: { en: 'AI is standing by with recommendations.', ar: 'الذكاء الاصطناعي جاهز بالتوصيات.' },
  select_storage_bin: { en: 'Select a storage bin on the map to see details', ar: 'اختر حاوية تخزين على الخريطة لرؤية التفاصيل' },
  zoom_in: { en: 'Zoom In', ar: 'تكبير' },
  zoom_out: { en: 'Zoom Out', ar: 'تصغير' },
  aisle: { en: 'Aisle', ar: 'الممر' },

  // Procurement
  total_requests: { en: 'Total Requests', ar: 'إجمالي الطلبات' },
  open_requests: { en: 'Open Requests', ar: 'الطلبات المفتوحة' },
  todays_requests: { en: "Today's Requests", ar: 'طلبات اليوم' },
  urgent_requests: { en: 'Urgent Requests', ar: 'الطلبات العاجلة' },
  year_to_date: { en: 'Year to Date', ar: 'منذ بداية العام' },
  pending_action: { en: 'Pending Action', ar: 'في انتظار الإجراء' },
  new_incoming: { en: 'New Incoming', ar: 'واردات جديدة' },
  needs_attention: { en: 'Needs Attention', ar: 'يحتاج انتباه' },
  request: { en: 'Request', ar: 'الطلب' },
  no_reference_provided: { en: 'No reference provided', ar: 'لم يتم تقديم مرجع' },
  approval: { en: 'Approval', ar: 'الموافقة' },
  related_to: { en: 'Related To', ar: 'مرتبط بـ' },
  rfq: { en: 'RFQ', ar: 'طلب عرض سعر' },
  not_sent: { en: 'Not sent', ar: 'غير مرسل' },
  each_item_glance: { en: 'Each item in this request at a glance', ar: 'نظرة سريعة على كل عنصر في هذا الطلب' },
  item_code: { en: 'Item Code', ar: 'رمز العنصر' },
  no_items_captured: { en: 'No items captured for this request.', ar: 'لم يتم تسجيل عناصر لهذا الطلب.' },

  // Mini Company
  mini_company: { en: 'Mini Company', ar: 'الشركة المصغرة' },
  company_overview: { en: 'Company Overview', ar: 'نظرة عامة على الشركة' },
  company_people: { en: 'People', ar: 'الموظفون' },
  company_operations: { en: 'Operations', ar: 'العمليات' },
  company_finance: { en: 'Finance', ar: 'المالية' },
  sales_insights: { en: 'Sales Insights', ar: 'رؤى المبيعات' },
  sales_overview: { en: 'Sales Overview', ar: 'نظرة عامة على المبيعات' },
  general_sales_insights: { en: 'General sales insights and key metrics', ar: 'رؤى المبيعات العامة والمقاييس الرئيسية' },
  overview_coming_soon: { en: 'Overview Dashboard Coming Soon', ar: 'لوحة النظرة العامة قادمة قريباً' },
  overview_coming_soon_desc: { en: 'This will be the general sales overview with aggregated insights from all dashboards. Use the other tabs to view detailed sales dashboards.', ar: 'ستكون هذه نظرة عامة على المبيعات مع رؤى مجمعة من جميع لوحات المعلومات. استخدم علامات التبويب الأخرى لعرض لوحات المبيعات التفصيلية.' },
  sales_dashboards: { en: 'Sales Dashboards', ar: 'لوحات المبيعات' },
  performance: { en: 'Performance', ar: 'الأداء' },
  efficiency_analysis: { en: 'Efficiency analysis', ar: 'تحليل الكفاءة' },
  analysis: { en: 'Analysis', ar: 'التحليل' },
  deep_dive_analytics: { en: 'Deep dive analytics', ar: 'تحليلات معمقة' },
  predictions_trends: { en: 'Predictions & trends', ar: 'التنبؤات والاتجاهات' },
  funnel: { en: 'Funnel', ar: 'القمع' },
  pipeline_visualization: { en: 'Pipeline visualization', ar: 'تصور خط الأنابيب' },
  segmentation: { en: 'Segmentation', ar: 'التقسيم' },
  customer_segments: { en: 'Customer segments', ar: 'شرائح العملاء' },
  promotions: { en: 'Promotions', ar: 'العروض الترويجية' },
  campaign_effectiveness: { en: 'Campaign effectiveness', ar: 'فعالية الحملة' },
  key_metrics_overview: { en: 'Key metrics overview', ar: 'نظرة عامة على المقاييس الرئيسية' },

  // Sales Dashboard
  about_dashboard: { en: 'About Dashboard', ar: 'حول لوحة المعلومات' },
  key_sales_metrics_desc: { en: 'Key sales metrics and revenue distribution overview', ar: 'نظرة عامة على مقاييس المبيعات الرئيسية وتوزيع الإيرادات' },
  total_sales: { en: 'Total Sales', ar: 'إجمالي المبيعات' },
  gross_sales_revenue: { en: 'Gross sales revenue', ar: 'إجمالي إيرادات المبيعات' },
  net_revenue: { en: 'Net Revenue', ar: 'صافي الإيرادات' },
  after_deductions: { en: 'After deductions', ar: 'بعد الخصومات' },
  orders_count: { en: 'Orders Count', ar: 'عدد الطلبات' },
  total_processed: { en: 'Total processed', ar: 'إجمالي المعالج' },
  avg_order_value: { en: 'Avg Order Value', ar: 'متوسط قيمة الطلب' },
  per_transaction: { en: 'Per transaction', ar: 'لكل معاملة' },
  sales_over_time: { en: 'Sales Over Time', ar: 'المبيعات عبر الزمن' },
  weekly_performance_overview: { en: 'Weekly performance overview', ar: 'نظرة عامة على الأداء الأسبوعي' },
  sales_by_channel: { en: 'Sales by Channel', ar: 'المبيعات حسب القناة' },
  revenue_distribution_source: { en: 'Revenue distribution source', ar: 'مصدر توزيع الإيرادات' },
  category: { en: 'Category', ar: 'الفئة' },
  sales_by_product_category: { en: 'Sales by product category', ar: 'المبيعات حسب فئة المنتج' },
  order_status: { en: 'Status', ar: 'الحالة' },
  current_order_status_split: { en: 'Current order status split', ar: 'توزيع حالة الطلبات الحالية' },
  returned_orders: { en: 'Returned Orders', ar: 'الطلبات المرتجعة' },
  processing_returns: { en: 'Processing returns', ar: 'معالجة المرتجعات' },
  top_customer_percent: { en: 'Top Customer %', ar: 'نسبة كبار العملاء' },
  repeat_buyers: { en: 'Repeat buyers', ar: 'المشترون المتكررون' },
  profit_margin: { en: 'Profit Margin', ar: 'هامش الربح' },
  net_earnings_ratio: { en: 'Net earnings ratio', ar: 'نسبة الأرباح الصافية' },
  conversion_rate: { en: 'Conversion Rate', ar: 'معدل التحويل' },
  visitor_to_buyer: { en: 'Visitor to buyer', ar: 'من زائر إلى مشتري' },
  top_5_selling_products: { en: 'Top 5 Selling Products', ar: 'أفضل 5 منتجات مبيعاً' },
  inventory_revenue_leaders: { en: 'Inventory and revenue leaders', ar: 'المنتجات الرائدة في المخزون والإيرادات' },
  product_name: { en: 'Product Name', ar: 'اسم المنتج' },
  qty: { en: 'Qty', ar: 'الكمية' },
  revenue: { en: 'Revenue', ar: 'الإيرادات' },
  profit: { en: 'Profit', ar: 'الربح' },
  revenue_contribution: { en: 'Revenue Contribution', ar: 'مساهمة الإيرادات' },
  visual_dominance_product_sales: { en: 'Visual dominance of product sales', ar: 'التمثيل البصري لمبيعات المنتجات' },
  daily_sales: { en: 'Daily Sales', ar: 'المبيعات اليومية' },
  full_screen: { en: 'Full Screen', ar: 'ملء الشاشة' },
  // Day names
  mon: { en: 'Mon', ar: 'الإثنين' },
  tue: { en: 'Tue', ar: 'الثلاثاء' },
  wed: { en: 'Wed', ar: 'الأربعاء' },
  thu: { en: 'Thu', ar: 'الخميس' },
  fri: { en: 'Fri', ar: 'الجمعة' },
  sat: { en: 'Sat', ar: 'السبت' },
  sun: { en: 'Sun', ar: 'الأحد' },
  // Channel names (sales dashboard)
  channel_online: { en: 'Online', ar: 'أونلاين' },
  channel_store: { en: 'Store', ar: 'المتجر' },
  channel_marketplace: { en: 'Marketplace', ar: 'السوق' },
  channel_whatsapp: { en: 'WhatsApp', ar: 'واتساب' },
  // Category names (sales dashboard)
  category_electronics: { en: 'Electronics', ar: 'إلكترونيات' },
  category_clothing: { en: 'Clothing', ar: 'ملابس' },
  category_groceries: { en: 'Groceries', ar: 'بقالة' },
  category_home: { en: 'Home', ar: 'الرئيسية' },
  // Order status names (sales dashboard)
  order_completed: { en: 'Completed', ar: 'مكتمل' },
  order_pending: { en: 'Pending', ar: 'قيد الانتظار' },
  order_returned: { en: 'Returned', ar: 'مرتجع' },
  order_cancelled: { en: 'Cancelled', ar: 'ملغي' },

  // About Dashboard Info
  understanding_sales_insights: { en: 'Understanding Sales Insights', ar: 'فهم رؤى المبيعات' },
  // Note: 'overview' already defined above in Board View Options
  dashboard_overview_desc: { en: 'This dashboard gives you a quick snapshot of your sales health. It helps you understand how much you are selling, profitability, and trends—all in one place.', ar: 'تمنحك لوحة المعلومات هذه لمحة سريعة عن صحة مبيعاتك. تساعدك على فهم حجم مبيعاتك والربحية والاتجاهات - كل ذلك في مكان واحد.' },
  key_questions_answered: { en: 'Key Questions Answered', ar: 'الأسئلة الرئيسية المجاب عنها' },
  q_sales_growing: { en: 'Are sales growing?', ar: 'هل المبيعات في نمو؟' },
  a_sales_growing: { en: 'Check the "Sales Over Time" chart and the "Total Sales" KPI trend arrow. Green/Up means growth.', ar: 'تحقق من مخطط "المبيعات عبر الزمن" وسهم اتجاه "إجمالي المبيعات". الأخضر/للأعلى يعني النمو.' },
  q_pricing_working: { en: 'Is pricing working?', ar: 'هل التسعير فعال؟' },
  a_pricing_working: { en: 'Compare "Total Sales" vs "Net Revenue". A large gap might mean heavy discounting is needed to move product.', ar: 'قارن "إجمالي المبيعات" مقابل "صافي الإيرادات". الفجوة الكبيرة قد تعني الحاجة لخصومات كبيرة لتحريك المنتج.' },
  q_returns_high: { en: 'Are returns high?', ar: 'هل المرتجعات مرتفعة؟' },
  a_returns_high: { en: 'Look at the "Returned Orders" KPI and "Status" Pie Chart. A high % here requires immediate attention.', ar: 'انظر إلى مؤشر "الطلبات المرتجعة" ومخطط "الحالة" الدائري. النسبة العالية هنا تتطلب اهتماماً فورياً.' },
  q_volume_vs_value: { en: 'Volume vs Value focus?', ar: 'التركيز على الحجم مقابل القيمة؟' },
  a_volume_vs_value: { en: 'See "Avg Order Value" vs "Orders Count". If orders are up but value is down, you are selling more cheap items.', ar: 'انظر "متوسط قيمة الطلب" مقابل "عدد الطلبات". إذا ارتفعت الطلبات لكن انخفضت القيمة، فأنت تبيع منتجات رخيصة أكثر.' },
  detailed_breakdown: { en: 'Detailed Breakdown', ar: 'تفصيل مفصل' },
  top_kpis: { en: 'Top KPIs', ar: 'المؤشرات الرئيسية' },
  side_kpis: { en: 'Side KPIs', ar: 'المؤشرات الجانبية' },
  charts_tables: { en: 'Charts & Tables', ar: 'المخططات والجداول' },
  total_sales_desc: { en: 'Gross revenue before any deductions. The top-line number.', ar: 'إجمالي الإيرادات قبل أي خصومات. الرقم الأعلى.' },
  net_revenue_desc: { en: 'Real money earned after discounts and returns. The bottom-line.', ar: 'المال الحقيقي المكتسب بعد الخصومات والمرتجعات. الرقم النهائي.' },
  orders_count_desc: { en: 'Total number of completed transactions.', ar: 'إجمالي عدد المعاملات المكتملة.' },
  avg_order_value_desc: { en: 'Average amount a customer spends per transaction. Higher is better.', ar: 'متوسط المبلغ الذي ينفقه العميل في كل معاملة. الأعلى أفضل.' },
  return_rate: { en: 'Return Rate', ar: 'معدل المرتجعات' },
  return_rate_desc: { en: 'Percentage of orders that were returned.', ar: 'نسبة الطلبات التي تم إرجاعها.' },
  customer_count: { en: 'Customer Count', ar: 'عدد العملاء' },
  customer_count_desc: { en: 'Unique customers who placed orders.', ar: 'العملاء الفريدون الذين قدموا طلبات.' },
  top_category: { en: 'Top Category', ar: 'الفئة الأعلى' },
  top_category_desc: { en: 'Product category generating highest revenue.', ar: 'فئة المنتج التي تحقق أعلى إيرادات.' },
  discount_impact: { en: 'Discount Impact', ar: 'تأثير الخصم' },
  discount_impact_desc: { en: 'Revenue reduction from applied discounts.', ar: 'انخفاض الإيرادات من الخصومات المطبقة.' },
  sales_over_time_desc: { en: 'Bar chart showing daily sales volume to identify peak days.', ar: 'مخطط شريطي يوضح حجم المبيعات اليومية لتحديد أيام الذروة.' },
  sales_by_channel_desc: { en: 'Breakdown of where customers shop (Online vs Store).', ar: 'تفصيل أماكن تسوق العملاء (أونلاين مقابل المتجر).' },
  category_pie_desc: { en: 'Distribution of sales across different product categories.', ar: 'توزيع المبيعات عبر فئات المنتجات المختلفة.' },
  status_pie_desc: { en: 'Operational health check: Completed vs Returned/Cancelled orders.', ar: 'فحص الصحة التشغيلية: الطلبات المكتملة مقابل المرتجعة/الملغية.' },
  top_products_desc: { en: 'Table highlighting best sellers and their profit margins.', ar: 'جدول يبرز أفضل المنتجات مبيعاً وهوامش ربحها.' },
  revenue_contribution_desc: { en: 'Treemap showing which products drive the most revenue.', ar: 'خريطة شجرية توضح المنتجات التي تحقق أكبر إيرادات.' },
  data_sources_logic: { en: 'Data Sources & Logic', ar: 'مصادر البيانات والمنطق' },
  core_calculation_logic: { en: 'Core Calculation Logic', ar: 'منطق الحساب الأساسي' },
  kpis_based_completed: { en: 'KPIs are based on completed orders only to ensure accuracy.', ar: 'تعتمد المؤشرات على الطلبات المكتملة فقط لضمان الدقة.' },
  net_revenue_formula: { en: 'Net Revenue = Total Sales - (Discounts + Returns).', ar: 'صافي الإيرادات = إجمالي المبيعات - (الخصومات + المرتجعات).' },
  data_filtered_date: { en: 'Data is automatically filtered by your selected date range.', ar: 'يتم تصفية البيانات تلقائياً حسب نطاق التاريخ المحدد.' },
  source_tables_fields: { en: 'Source Tables & Fields', ar: 'الجداول والحقول المصدرية' },
  orders_table: { en: 'Orders Table', ar: 'جدول الطلبات' },
  orders_table_desc: { en: 'Used to calculate sales volume and order-related KPIs.', ar: 'يستخدم لحساب حجم المبيعات ومؤشرات الطلبات.' },
  order_items_table: { en: 'Order Items Table', ar: 'جدول عناصر الطلب' },
  order_items_table_desc: { en: 'Used to analyze product-level performance.', ar: 'يستخدم لتحليل أداء المنتجات.' },
  products_table: { en: 'Products Table', ar: 'جدول المنتجات' },
  products_table_desc: { en: 'Used for product identification and grouping.', ar: 'يستخدم لتحديد المنتجات وتجميعها.' },
  customers_table: { en: 'Customers Table', ar: 'جدول العملاء' },
  customers_table_desc: { en: 'Used for basic customer contribution insights.', ar: 'يستخدم لرؤى مساهمة العملاء الأساسية.' },
  dashboard_aggregates_data: { en: 'This dashboard aggregates data for high-level decision making.', ar: 'تجمع لوحة المعلومات هذه البيانات لاتخاذ قرارات عالية المستوى.' },
  close_guide: { en: 'Close Guide', ar: 'إغلاق الدليل' },
  // Table column names
  order_id: { en: 'Order ID', ar: 'رقم الطلب' },
  order_date: { en: 'Order Date', ar: 'تاريخ الطلب' },
  column_order_status: { en: 'Order Status', ar: 'حالة الطلب' },
  total_order_amount: { en: 'Total Order Amount', ar: 'إجمالي مبلغ الطلب' },
  discount_amount: { en: 'Discount Amount', ar: 'مبلغ الخصم' },
  net_order_amount: { en: 'Net Order Amount', ar: 'صافي مبلغ الطلب' },
  customer_id: { en: 'Customer ID', ar: 'رقم العميل' },
  product_id: { en: 'Product ID', ar: 'رقم المنتج' },
  quantity_sold: { en: 'Quantity Sold', ar: 'الكمية المباعة' },
  item_revenue: { en: 'Item Revenue', ar: 'إيرادات العنصر' },
  item_cost: { en: 'Item Cost', ar: 'تكلفة العنصر' },
  product_category: { en: 'Product Category', ar: 'فئة المنتج' },
  selling_price: { en: 'Selling Price', ar: 'سعر البيع' },
  cost_price: { en: 'Cost Price', ar: 'سعر التكلفة' },
  customer_name: { en: 'Customer Name', ar: 'اسم العميل' },
  customer_type: { en: 'Customer Type', ar: 'نوع العميل' },
  total_orders_count: { en: 'Total Orders Count', ar: 'إجمالي عدد الطلبات' },
  category_pie: { en: 'Category Pie', ar: 'مخطط الفئات' },
  status_pie: { en: 'Status Pie', ar: 'مخطط الحالة' },
  top_products: { en: 'Top Products', ar: 'أفضل المنتجات' },

  // Performance Dashboard
  performance_efficiency: { en: 'Performance & Efficiency', ar: 'الأداء والكفاءة' },
  operational_leakage_analysis: { en: 'Operational leakage and fulfillment efficiency analysis', ar: 'تحليل التسرب التشغيلي وكفاءة التنفيذ' },
  sales_growth: { en: 'Sales Growth', ar: 'نمو المبيعات' },
  vs_previous_period: { en: 'vs Previous Period', ar: 'مقارنة بالفترة السابقة' },
  global_conversion: { en: 'Global conversion', ar: 'التحويل العام' },
  rev_per_customer: { en: 'Rev per Customer', ar: 'الإيراد لكل عميل' },
  customer_value: { en: 'Customer value', ar: 'قيمة العميل' },
  repeat_cust_percent: { en: 'Repeat Cust %', ar: 'نسبة العملاء المتكررين' },
  retention_rate: { en: 'Retention rate', ar: 'معدل الاحتفاظ' },
  // Note: 'discount_impact' already defined above
  revenue_foregone: { en: 'Revenue foregone', ar: 'الإيرادات المفقودة' },
  avg_fulfillment: { en: 'Avg Fulfillment', ar: 'متوسط التنفيذ' },
  hours_to_ship: { en: 'Hours to ship', ar: 'ساعات للشحن' },
  cancelled_percent: { en: 'Cancelled %', ar: 'نسبة الملغية' },
  order_failure_rate: { en: 'Order failure rate', ar: 'معدل فشل الطلبات' },
  product_returns: { en: 'Product returns', ar: 'مرتجعات المنتجات' },
  orders_vs_completed: { en: 'Orders vs Completed', ar: 'الطلبات مقابل المكتملة' },
  operational_leakage: { en: 'Operational leakage analysis', ar: 'تحليل التسرب التشغيلي' },
  total_orders: { en: 'Total Orders', ar: 'إجمالي الطلبات' },
  revenue_by_channel: { en: 'Revenue by Channel', ar: 'الإيرادات حسب القناة' },
  where_sales_coming: { en: 'Where sales are coming from', ar: 'من أين تأتي المبيعات' },
  online_store: { en: 'Online Store', ar: 'المتجر الإلكتروني' },
  retail_pos: { en: 'Retail POS', ar: 'نقطة البيع' },
  social_whatsapp: { en: 'Social/WhatsApp', ar: 'التواصل الاجتماعي/واتساب' },
  new_vs_returning: { en: 'New vs Returning', ar: 'جدد مقابل عائدين' },
  customer_base_quality: { en: 'Customer base quality', ar: 'جودة قاعدة العملاء' },
  new_customers: { en: 'New Customers', ar: 'عملاء جدد' },
  returning: { en: 'Returning', ar: 'عائدون' },
  discount_vs_full: { en: 'Discount vs Full-Price', ar: 'الخصم مقابل السعر الكامل' },
  pricing_health_check: { en: 'Pricing health check', ar: 'فحص صحة التسعير' },
  full_price: { en: 'Full Price', ar: 'السعر الكامل' },
  discounted: { en: 'Discounted', ar: 'مخصوم' },
  low_performance_products: { en: 'Low Performance Products', ar: 'المنتجات ضعيفة الأداء' },
  high_views_low_conversion: { en: 'High interest (views) but low conversion', ar: 'اهتمام عالي (مشاهدات) لكن تحويل منخفض' },
  views: { en: 'Views', ar: 'المشاهدات' },
  orders: { en: 'Orders', ar: 'الطلبات' },
  conv_rate: { en: 'Conv. Rate', ar: 'معدل التحويل' },
  conversion_flow: { en: 'Conversion Flow', ar: 'تدفق التحويل' },
  views_to_orders_path: { en: 'Hidden story: Views to Orders path', ar: 'القصة الخفية: مسار المشاهدات إلى الطلبات' },

  // Performance Dashboard Info Panel
  understanding_performance: { en: 'Understanding Performance & Efficiency', ar: 'فهم الأداء والكفاءة' },
  perf_overview_desc: { en: 'This dashboard tracks sales efficiency and performance quality to help you understand why sales are growing, slowing, or leaking operationally.', ar: 'تتبع لوحة المعلومات هذه كفاءة المبيعات وجودة الأداء لمساعدتك على فهم سبب نمو المبيعات أو تباطؤها أو تسربها تشغيلياً.' },

  // Performance Info Questions
  perf_q1: { en: 'Are sales growth numbers healthy or inflated?', ar: 'هل أرقام نمو المبيعات صحية أم مبالغ فيها؟' },
  perf_a1: { en: 'Check "Sales Growth %" vs "Discount Impact". High growth with high discounts might mean you are "buying" revenue.', ar: 'تحقق من "نسبة نمو المبيعات" مقابل "تأثير الخصم". النمو المرتفع مع خصومات عالية قد يعني أنك "تشتري" الإيرادات.' },
  perf_q2: { en: 'Are customers buying again or only once?', ar: 'هل يشتري العملاء مرة أخرى أم مرة واحدة فقط؟' },
  perf_a2: { en: 'Look at "Repeat Customers %" and the "New vs Returning" pie chart. Low repeat rates indicate a "leaky bucket" problem.', ar: 'انظر إلى "نسبة العملاء المتكررين" ومخطط "الجدد مقابل العائدين". معدلات التكرار المنخفضة تشير إلى مشكلة "الدلو المثقوب".' },
  perf_q3: { en: 'Are discounts driving sales at the cost of margin?', ar: 'هل تدفع الخصومات المبيعات على حساب الهامش؟' },
  perf_a3: { en: 'Compare "Discount Impact %" with "Average Order Value". If discounts are > 15-20% and margins are thin, you might be losing money.', ar: 'قارن "نسبة تأثير الخصم" مع "متوسط قيمة الطلب". إذا كانت الخصومات > 15-20% والهوامش ضعيفة، فقد تخسر المال.' },
  perf_q4: { en: 'Where are orders failing or being cancelled?', ar: 'أين تفشل الطلبات أو يتم إلغاؤها؟' },
  perf_a4: { en: 'See "Cancelled Orders %" and the "Orders vs Completed" chart. High cancellations often mean inventory or fulfillment issues.', ar: 'انظر "نسبة الطلبات الملغاة" ومخطط "الطلبات مقابل المكتملة". الإلغاءات العالية غالباً تعني مشاكل في المخزون أو التنفيذ.' },
  perf_q5: { en: 'Is operational execution supporting sales volume?', ar: 'هل التنفيذ التشغيلي يدعم حجم المبيعات؟' },
  perf_a5: { en: 'Check "Avg Fulfillment Time". If sales are up but fulfillment is slowing down, your operations are bottlenecked.', ar: 'تحقق من "متوسط وقت التنفيذ". إذا زادت المبيعات لكن التنفيذ يتباطأ، فعملياتك تعاني من اختناق.' },

  // Performance Info - Top KPIs descriptions
  sales_growth_percent: { en: 'Sales Growth %', ar: 'نسبة نمو المبيعات' },
  sales_growth_desc: { en: 'Measures the direction and speed of sales change vs previous period.', ar: 'يقيس اتجاه وسرعة تغير المبيعات مقارنة بالفترة السابقة.' },
  // Note: 'conversion_rate' already defined above
  conversion_rate_desc: { en: 'Orders divided by visits. Shows efficiency of interest to orders.', ar: 'الطلبات مقسومة على الزيارات. يُظهر كفاءة تحويل الاهتمام إلى طلبات.' },
  revenue_per_customer: { en: 'Revenue per Customer', ar: 'الإيراد لكل عميل' },
  revenue_per_customer_desc: { en: 'Total Revenue / Unique Customers. Indicates customer value.', ar: 'إجمالي الإيرادات / العملاء الفريدين. يشير إلى قيمة العميل.' },
  repeat_customers_percent: { en: 'Repeat Customers %', ar: 'نسبة العملاء المتكررين' },
  repeat_customers_desc: { en: 'Percentage of customers who placed more than one order.', ar: 'نسبة العملاء الذين قدموا أكثر من طلب واحد.' },

  // Performance Info - Side KPIs descriptions
  discount_impact_percent: { en: 'Discount Impact %', ar: 'نسبة تأثير الخصم' },
  discount_impact_perf_desc: { en: 'Percentage of revenue foregone due to discounts.', ar: 'نسبة الإيرادات المفقودة بسبب الخصومات.' },
  avg_fulfillment_title: { en: 'Avg Fulfillment', ar: 'متوسط التنفيذ' },
  avg_fulfillment_desc: { en: 'Average time from order creation to shipment (hours).', ar: 'متوسط الوقت من إنشاء الطلب إلى الشحن (بالساعات).' },
  cancelled_percent_title: { en: 'Cancelled %', ar: 'نسبة الملغاة' },
  cancelled_desc: { en: 'Order failure rate indicating sales friction.', ar: 'معدل فشل الطلبات الذي يشير إلى احتكاك المبيعات.' },
  return_rate_title: { en: 'Return Rate', ar: 'معدل الإرجاع' },
  return_rate_perf_desc: { en: 'Percentage of product returns.', ar: 'نسبة مرتجعات المنتجات.' },

  // Performance Info - Charts descriptions
  orders_vs_completed_desc: { en: 'Bar chart identifying operational leakage (orders derived but not completed).', ar: 'مخطط شريطي يحدد التسرب التشغيلي (طلبات مستلمة لكن لم تكتمل).' },
  revenue_by_channel_desc: { en: 'Highlights strongest and weakest sales channels (Online, Store, etc.).', ar: 'يبرز أقوى وأضعف قنوات البيع (عبر الإنترنت، المتجر، إلخ).' },
  new_vs_returning_desc: { en: 'Pie chart evaluating customer base quality and loyalty.', ar: 'مخطط دائري يقيّم جودة قاعدة العملاء والولاء.' },
  discount_vs_full_desc: { en: 'Pie chart revealing pricing dependency.', ar: 'مخطط دائري يكشف الاعتماد على التسعير.' },
  low_perf_products_desc: { en: 'Table identifying products with views but low conversion.', ar: 'جدول يحدد المنتجات ذات المشاهدات لكن التحويل منخفض.' },
  conversion_flow_desc: { en: 'Parallel coordinates chart visualizing the drop-off shape from Views → Orders → Conversion for each product.', ar: 'مخطط إحداثيات متوازية يوضح شكل الانخفاض من المشاهدات ← الطلبات ← التحويل لكل منتج.' },

  // Performance Info - Data Sources
  perf_orders_table: { en: 'Orders Table', ar: 'جدول الطلبات' },
  perf_orders_table_desc: { en: 'Fulfillment status and cancellation data.', ar: 'حالة التنفيذ وبيانات الإلغاء.' },
  perf_customers_table: { en: 'Customers Table', ar: 'جدول العملاء' },
  perf_customers_table_desc: { en: 'Used for Repeat and New vs Returning logic.', ar: 'يُستخدم لمنطق التكرار والجدد مقابل العائدين.' },
  status_col: { en: 'Status', ar: 'الحالة' },
  fulfillment_date: { en: 'Fulfillment Date', ar: 'تاريخ التنفيذ' },
  total_col: { en: 'Total', ar: 'الإجمالي' },
  discount_col: { en: 'Discount', ar: 'الخصم' },
  total_orders_col: { en: 'Total Orders', ar: 'إجمالي الطلبات' },
  first_order_date: { en: 'First Order Date', ar: 'تاريخ أول طلب' },

  // Performance Info - Calculation Logic
  perf_calc_conversion: { en: 'Conversion Rate', ar: 'معدل التحويل' },
  perf_calc_conversion_formula: { en: '= Orders / Visits (or Leads).', ar: '= الطلبات / الزيارات (أو العملاء المحتملين).' },
  perf_calc_rev_per_cust: { en: 'Revenue per Customer', ar: 'الإيراد لكل عميل' },
  perf_calc_rev_formula: { en: '= Total Revenue / Unique Customers.', ar: '= إجمالي الإيرادات / العملاء الفريدين.' },
  perf_calc_discount: { en: 'Discount Impact %', ar: 'نسبة تأثير الخصم' },
  perf_calc_discount_formula: { en: '= Total Discounts / Gross Revenue.', ar: '= إجمالي الخصومات / الإيرادات الإجمالية.' },
  perf_calc_note: { en: 'Includes all completed and cancelled orders for operational visibility.', ar: 'يشمل جميع الطلبات المكتملة والملغاة للرؤية التشغيلية.' },

  // My Work Page
  add_to_project: { en: 'Add to Project', ar: 'إضافة إلى مشروع' },
  create_new_project: { en: 'Create New Project', ar: 'إنشاء مشروع جديد' },
  search_projects: { en: 'Search projects...', ar: 'البحث في المشاريع...' },
  no_projects_found: { en: 'No projects found', ar: 'لم يتم العثور على مشاريع' },
  project_name: { en: 'Project Name', ar: 'اسم المشروع' },
  create_project: { en: 'Create Project', ar: 'إنشاء مشروع' },
  daily_agenda: { en: 'Daily Agenda', ar: 'جدول اليوم' },
  tasks_scheduled: { en: 'tasks scheduled', ar: 'مهمة مجدولة' },
  no_tasks_scheduled_today: { en: 'No tasks scheduled for today', ar: 'لا توجد مهام مجدولة لهذا اليوم' },
  add_task: { en: 'Add Task', ar: 'إضافة مهمة' },
  due_today: { en: 'Due Today', ar: 'مستحقة اليوم' },
  lunch_break: { en: 'Lunch Break', ar: 'استراحة الغداء' },
  task_bucket: { en: 'Task Bucket', ar: 'سلة المهام' },
  items: { en: 'items', ar: 'عنصر' },
  add_new_task_placeholder: { en: 'Add a new task...', ar: 'إضافة مهمة جديدة...' },
  design_filter: { en: 'Design', ar: 'تصميم' },
  development_filter: { en: 'Development', ar: 'تطوير' },
  no_tasks_in_inbox: { en: 'No tasks in inbox', ar: 'لا توجد مهام في الوارد' },
  active_projects: { en: 'Active Projects', ar: 'المشاريع النشطة' },
  new_goal: { en: 'New Goal', ar: 'هدف جديد' },
  new_project: { en: 'New Project', ar: 'مشروع جديد' },

  // Teams Page
  team_overview: { en: 'Team Overview', ar: 'نظرة عامة على الفريق' },
  manage_team_access: { en: "Manage your team's performance and access.", ar: 'إدارة أداء فريقك والوصول.' },
  total_members: { en: 'Total Members', ar: 'إجمالي الأعضاء' },
  online_now: { en: 'Online Now', ar: 'متصل الآن' },
  guests_access: { en: 'Guests Access', ar: 'وصول الضيوف' },
  pending_invites: { en: 'Pending Invites', ar: 'الدعوات المعلقة' },
  all_members: { en: 'All Members', ar: 'جميع الأعضاء' },
  inactive: { en: 'Inactive', ar: 'غير نشط' },
  search_team: { en: 'Search team...', ar: 'البحث في الفريق...' },
  user: { en: 'User', ar: 'المستخدم' },
  role: { en: 'Role', ar: 'الدور' },
  actions: { en: 'Actions', ar: 'الإجراءات' },
  no_members_found: { en: 'No members found', ar: 'لم يتم العثور على أعضاء' },
  adjust_search_filters: { en: "Try adjusting your search or filters to find what you're looking for.", ar: 'حاول تعديل البحث أو الفلاتر للعثور على ما تبحث عنه.' },
  invite_to_workspace: { en: 'Invite to Workspace', ar: 'دعوة إلى مساحة العمل' },
  invite_link_description: { en: 'Share this link with your team members. When they click it, they will be added to your workspace automatically.', ar: 'شارك هذا الرابط مع أعضاء فريقك. عند النقر عليه، سيتم إضافتهم تلقائياً إلى مساحة العمل.' },
  generating_link: { en: 'Generating link...', ar: 'جاري إنشاء الرابط...' },
  view_profile: { en: 'View Profile', ar: 'عرض الملف الشخصي' },
  away: { en: 'Away', ar: 'بعيد' },
  invited: { en: 'Invited', ar: 'تمت الدعوة' },
  admin: { en: 'Admin', ar: 'مدير' },
  member_role: { en: 'Member', ar: 'عضو' },
  guest: { en: 'Guest', ar: 'ضيف' },

  // Auth - Sign Up
  industry: { en: 'Industry', ar: 'الصناعة' },
  select_your_industry: { en: 'Select your industry...', ar: 'اختر صناعتك...' },
  logistics_supply_chain: { en: 'Logistics & Supply Chain', ar: 'الخدمات اللوجستية وسلسلة التوريد' },
  retail_ecommerce: { en: 'Retail & E-commerce', ar: 'التجزئة والتجارة الإلكترونية' },
  healthcare: { en: 'Healthcare', ar: 'الرعاية الصحية' },
  technology: { en: 'Technology', ar: 'التكنولوجيا' },
  company_size: { en: 'Company Size', ar: 'حجم الشركة' },
  employees: { en: 'employees', ar: 'موظفين' },
  first_name: { en: 'First Name', ar: 'الاسم الأول' },
  last_name: { en: 'Last Name', ar: 'اسم العائلة' },
  phone_number: { en: 'Phone Number', ar: 'رقم الهاتف' },
  work_email: { en: 'Work Email', ar: 'البريد الإلكتروني للعمل' },
  password: { en: 'Password', ar: 'كلمة المرور' },
  next_step: { en: 'Next Step', ar: 'الخطوة التالية' },
  create_account: { en: 'Create Account', ar: 'إنشاء حساب' },
  verify_launch: { en: 'Verify & Launch', ar: 'تأكيد وبدء' },
  tell_us_about_team: { en: 'Tell us about your team', ar: 'أخبرنا عن فريقك' },
  who_are_you: { en: 'Who are you?', ar: 'من أنت؟' },
  secure_your_account: { en: 'Secure your account', ar: 'تأمين حسابك' },
  verify_email: { en: 'Verify Email', ar: 'تأكيد البريد الإلكتروني' },
  customize_workspace_industry: { en: "We'll customize your workspace based on your industry.", ar: 'سنخصص مساحة عملك بناءً على صناعتك.' },
  enter_details_personalize: { en: 'Enter your details to personalize your profile.', ar: 'أدخل بياناتك لتخصيص ملفك الشخصي.' },
  choose_strong_password: { en: 'Choose a strong password to protect your data.', ar: 'اختر كلمة مرور قوية لحماية بياناتك.' },
  enter_code_inbox: { en: 'Enter the code sent to your inbox.', ar: 'أدخل الرمز المرسل إلى بريدك الإلكتروني.' },
  please_complete_fields: { en: 'Please complete all fields', ar: 'يرجى إكمال جميع الحقول' },
  name_required: { en: 'Name is required', ar: 'الاسم مطلوب' },
  something_went_wrong_retry: { en: 'Something went wrong. Please try again.', ar: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.' },
  verification_not_completed: { en: 'Verification was not completed. Please try again.', ar: 'لم يكتمل التحقق. يرجى المحاولة مرة أخرى.' },
  invalid_code: { en: 'Invalid code', ar: 'رمز غير صالح' },
  check_your_email: { en: 'Check your email', ar: 'تحقق من بريدك الإلكتروني' },
  sent_verification_code: { en: 'We sent a verification code to', ar: 'أرسلنا رمز التحقق إلى' },
  already_have_account: { en: 'Already have an account?', ar: 'لديك حساب بالفعل؟' },
  sign_in: { en: 'Sign in', ar: 'تسجيل الدخول' },
  privacy: { en: 'Privacy', ar: 'الخصوصية' },
  terms: { en: 'Terms', ar: 'الشروط' },

  // Auth - Accept Invite
  please_sign_in_accept: { en: 'Please sign in to accept the invitation...', ar: 'يرجى تسجيل الدخول لقبول الدعوة...' },
  joining_team: { en: 'Joining Team...', ar: 'جاري الانضمام للفريق...' },
  verifying_token: { en: 'Verifying your invitation token.', ar: 'جاري التحقق من رمز الدعوة.' },
  welcome_to_team: { en: 'Welcome to the Team!', ar: 'مرحباً بك في الفريق!' },
  successfully_joined: { en: 'You have successfully joined the workspace.', ar: 'لقد انضممت بنجاح إلى مساحة العمل.' },
  redirecting_dashboard: { en: 'Redirecting to dashboard...', ar: 'جاري التوجيه إلى لوحة التحكم...' },
  invitation_failed: { en: 'Invitation Failed', ar: 'فشلت الدعوة' },
  go_to_dashboard: { en: 'Go to Dashboard', ar: 'الذهاب إلى لوحة التحكم' },
  invalid_invitation_link: { en: 'Invalid invitation link (missing token).', ar: 'رابط دعوة غير صالح (الرمز مفقود).' },
  failed_to_join: { en: 'Failed to join team.', ar: 'فشل الانضمام للفريق.' },

  // Auth - Developer Login Modal
  sign_in_to_nabd: { en: 'Sign in to NabdChain', ar: 'تسجيل الدخول إلى نبض' },
  welcome_back_continue: { en: 'Welcome back! Please sign in to continue', ar: 'مرحباً بعودتك! يرجى تسجيل الدخول للمتابعة' },
  continue_with_google: { en: 'Continue with Google', ar: 'المتابعة مع جوجل' },
  or_divider: { en: 'or', ar: 'أو' },
  continue_btn: { en: 'Continue', ar: 'متابعة' },
  dont_have_account: { en: "Don't have an account?", ar: 'ليس لديك حساب؟' },
  sign_up: { en: 'Sign up', ar: 'إنشاء حساب' },
  invalid_dev_credentials: { en: 'Invalid credentials for Development Mode', ar: 'بيانات اعتماد غير صالحة لوضع التطوير' },

  // Tools - Whiteboard
  mindmap_studio: { en: 'MindMap Studio Pro', ar: 'استوديو الخرائط الذهنية' },
  collaborative_workspace: { en: 'Collaborative Workspace', ar: 'مساحة عمل تعاونية' },
  weight: { en: 'Weight', ar: 'السماكة' },
  opacity: { en: 'Opacity', ar: 'الشفافية' },
  type_something: { en: 'Type something...', ar: 'اكتب شيئاً...' },
  sticky_note_placeholder: { en: 'Sticky note...', ar: 'ملاحظة لاصقة...' },
  search_commands: { en: 'Search mind-map nodes or commands...', ar: 'البحث في العقد أو الأوامر...' },

  // Tools - Workload
  workload_view: { en: 'Workload view', ar: 'عرض عبء العمل' },
  balance_capacity: { en: 'Balance capacity by person', ar: 'توازن السعة حسب الشخص' },
  this_month: { en: 'This month', ar: 'هذا الشهر' },
  this_quarter: { en: 'This quarter', ar: 'هذا الربع' },
  overloaded: { en: 'Overloaded', ar: 'مثقل' },
  available: { en: 'Available', ar: 'متاح' },
  healthy: { en: 'Healthy', ar: 'صحي' },
  later: { en: 'Later', ar: 'لاحقاً' },
  upcoming_items: { en: 'Upcoming items', ar: 'العناصر القادمة' },
  no_items_scheduled: { en: 'No items scheduled in this range.', ar: 'لا توجد عناصر مجدولة في هذا النطاق.' },
  no_workload_yet: { en: 'No workload yet. Assign owners and due dates to see the load chart.', ar: 'لا يوجد عبء عمل بعد. عيّن المالكين وتواريخ الاستحقاق لرؤية مخطط الحمل.' },
  workload_indicator_help: { en: 'Indicators show overload, healthy load, or available capacity for the selected window.', ar: 'تُظهر المؤشرات الحمل الزائد أو الحمل الصحي أو السعة المتاحة للفترة المحددة.' },

  // Tools - Spreadsheet
  smart_insights: { en: 'Smart Insights', ar: 'رؤى ذكية' },
  analyzing: { en: 'Analyzing...', ar: 'جاري التحليل...' },
  ai_assistant: { en: 'AI Assistant', ar: 'مساعد الذكاء الاصطناعي' },
  last_edit: { en: 'Last edit was', ar: 'آخر تعديل كان' },
  minutes_ago: { en: 'minutes ago', ar: 'دقائق مضت' },
  sorting_filtering: { en: 'Sorting & Filtering', ar: 'الفرز والتصفية' },
  sort_az: { en: 'Sort A → Z', ar: 'فرز أ → ي' },
  alphabetical_order: { en: 'Alphabetical order', ar: 'ترتيب أبجدي' },
  sort_za: { en: 'Sort Z → A', ar: 'فرز ي → أ' },
  reverse_order: { en: 'Reverse order', ar: 'ترتيب عكسي' },
  filter_by_category: { en: 'Filter by category', ar: 'تصفية حسب الفئة' },
  select_all: { en: 'Select All', ar: 'تحديد الكل' },
  search_categories: { en: 'Search categories...', ar: 'البحث في الفئات...' },
  apply_filter: { en: 'Apply Filter', ar: 'تطبيق الفلتر' },
  intelligence: { en: 'Intelligence', ar: 'الذكاء' },
  live_performance: { en: 'Live Performance', ar: 'الأداء المباشر' },
  total_net_profit: { en: 'Total Net Profit', ar: 'إجمالي صافي الربح' },
  auto_calculated: { en: 'AUTO-CALCULATED FROM GRID', ar: 'محسوب تلقائياً من الجدول' },
  need_review: { en: 'Need Review', ar: 'يحتاج مراجعة' },
  transactions: { en: 'Transactions', ar: 'المعاملات' },
  transaction_volume: { en: 'Transaction Volume', ar: 'حجم المعاملات' },
  growth_forecast: { en: 'Growth Forecast', ar: 'توقعات النمو' },
  analyze_more: { en: 'Analyze More', ar: 'تحليل المزيد' },
  report_total: { en: 'Report Total', ar: 'إجمالي التقرير' },

  // Tools - Automation Rules
  manage_workflow: { en: 'Manage your workflow logic and integrations.', ar: 'إدارة منطق سير العمل والتكاملات.' },
  create_new_rule: { en: 'Create New Rule', ar: 'إنشاء قاعدة جديدة' },
  search_rules: { en: 'Search rules...', ar: 'البحث في القواعد...' },
  all_rules: { en: 'All Rules', ar: 'جميع القواعد' },
  paused: { en: 'Paused', ar: 'متوقف' },
  draft: { en: 'Draft', ar: 'مسودة' },
  task_completed: { en: 'Task Completed', ar: 'المهمة مكتملة' },
  notify_slack: { en: 'Notify Slack', ar: 'إشعار سلاك' },
  time_schedule: { en: 'Time Schedule', ar: 'جدول زمني' },
  every_friday: { en: 'Every Friday', ar: 'كل جمعة' },
  send_report: { en: 'Send Report', ar: 'إرسال تقرير' },
  email_to_admin: { en: 'Email to Admin', ar: 'بريد للمدير' },
  paused_by_user: { en: 'Paused by User', ar: 'أوقفه المستخدم' },
  no_recent_data: { en: 'No recent data', ar: 'لا توجد بيانات حديثة' },
  urgent_ticket_alert: { en: 'Urgent Ticket Alert', ar: 'تنبيه تذكرة عاجلة' },
  ticket_tagged: { en: 'Ticket Tagged', ar: 'تذكرة موسومة' },
  page_oncall: { en: 'Page On-Call', ar: 'صفحة الطوارئ' },
  logic_incomplete: { en: 'Logic configuration incomplete...', ar: 'تكوين المنطق غير مكتمل...' },
  last_edited: { en: 'Last edited', ar: 'آخر تعديل' },
  days_ago: { en: 'days ago', ar: 'أيام مضت' },
  continue_setup: { en: 'Continue Setup', ar: 'متابعة الإعداد' },
  new_user: { en: 'New User', ar: 'مستخدم جديد' },
  on_signup: { en: 'On Signup', ar: 'عند التسجيل' },
  create_record: { en: 'Create Record', ar: 'إنشاء سجل' },
  start_from_scratch: { en: 'Start from scratch or use a template', ar: 'ابدأ من الصفر أو استخدم قالب' },
  success_rate: { en: 'Success', ar: 'نجاح' },

  // Tools - Dashboards (additional)
  open_items: { en: 'Open items', ar: 'العناصر المفتوحة' },
  in_progress_planned: { en: 'In progress or planned', ar: 'قيد التنفيذ أو مخطط' },
  upcoming: { en: 'Upcoming', ar: 'القادم' },
  due_within: { en: 'Due within', ar: 'مستحق خلال' },
  completion_rate: { en: 'Completion', ar: 'الإكمال' },
  of_done: { en: 'of', ar: 'من' },
  done_label: { en: 'done', ar: 'مكتمل' },
  status_distribution: { en: 'Status distribution', ar: 'توزيع الحالة' },
  fast_overview: { en: 'Fast overview across the team', ar: 'نظرة سريعة على الفريق' },
  no_status_data: { en: 'No status data yet.', ar: 'لا توجد بيانات حالة بعد.' },
  readiness: { en: 'Readiness', ar: 'الجاهزية' },
  health_overdue_risk: { en: 'Health based on overdue risk', ar: 'الصحة بناءً على مخاطر التأخر' },
  higher_better: { en: 'Higher is better. Based on overdue vs total items.', ar: 'الأعلى أفضل. بناءً على المتأخر مقارنة بالإجمالي.' },
  timeline_readonly: { en: 'Timeline (read-only)', ar: 'الجدول الزمني (للقراءة فقط)' },
  upcoming_overdue_range: { en: 'Upcoming and overdue items within the selected range', ar: 'العناصر القادمة والمتأخرة ضمن النطاق المحدد' },
  no_items_yet: { en: 'No items yet. Add tasks to see live dashboards.', ar: 'لا توجد عناصر بعد. أضف مهام لرؤية لوحات المعلومات.' },
  priority_mix: { en: 'Priority mix', ar: 'مزيج الأولويات' },
  based_on_tasks: { en: 'Based on existing tasks', ar: 'بناءً على المهام الموجودة' },
  no_priority_data: { en: 'No priority data yet.', ar: 'لا توجد بيانات أولوية بعد.' },

  // Sleep Mode
  increasing_volume: { en: 'Increasing volume...', ar: 'جاري رفع الصوت...' },
  relax_breathe: { en: 'Relax and breathe deeply', ar: 'استرخِ وتنفس بعمق' },
  rest_eyes: { en: 'Time to rest your eyes', ar: 'حان الوقت لراحة عينيك' },
  sleep_exit_instruction: { en: 'Click anywhere to exit • ← → to switch', ar: 'انقر في أي مكان للخروج • ← → للتبديل' },
  anim_rain: { en: 'Animated Rain', ar: 'مطر متحرك' },
  gentle_rain: { en: 'Gentle Rain', ar: 'مطر خفيف' },
  starry_night: { en: 'Starry Night', ar: 'ليلة مليئة بالنجوم' },
  heavy_storm: { en: 'Heavy Storm', ar: 'عاصفة قوية' },
  midnight_rain: { en: 'Midnight Rain', ar: 'مطر منتصف الليل' },

  // Science Facts
  fact_0: { en: 'Honey never spoils.', ar: 'العسل لا يفسد أبداً.' },
  fact_1: { en: 'Bananas are berries, but strawberries aren\'t.', ar: 'الموز من التوتيات، لكن الفراولة ليست كذلك.' },
  fact_2: { en: 'A day on Venus is longer than a year on Venus.', ar: 'اليوم على كوكب الزهرة أطول من السنة عليه.' },
  fact_3: { en: 'Octopuses have three hearts.', ar: 'للأخطبوط ثلاثة قلوب.' },
  fact_4: { en: 'Water can boil and freeze at the same time.', ar: 'يمكن للماء أن يغلي ويتجمد في نفس الوقت.' },
  fact_5: { en: 'There are more trees on Earth than stars in the Milky Way.', ar: 'عدد الأشجار على الأرض أكثر من النجوم في درب التبانة.' },
  fact_6: { en: 'The Eiffel Tower can be 15 cm taller during the summer.', ar: 'يمكن لبرج إيفل أن يزداد ارتفاعه 15 سم في الصيف.' },
  fact_7: { en: '20% of Earth\'s oxygen is produced by the Amazon rainforest.', ar: 'تنتج غابات الأمازون 20% من أكسجين الأرض.' },
  fact_8: { en: 'Some metals are so reactive that they explode on contact with water.', ar: 'تتفاعل بعض المعادن بقوة لدرجة الانفجار عند ملامستها للماء.' },
  fact_9: { en: 'A teaspoonful of neutron star would weigh 6 billion tons.', ar: 'ملعقة صغيرة من نجم نيوتروني تزن 6 مليارات طن.' },

  // ========================================
  // SALES DASHBOARDS TRANSLATIONS
  // ========================================
  // Note: Common dashboard elements (about_dashboard, full_screen, etc.) and
  // status labels (completed, pending, etc.) are defined earlier in this file

  // ========================================
  // SALES ANALYSIS DASHBOARD
  // ========================================
  sales_insights_patterns: { en: 'Sales Insights & Patterns', ar: 'رؤى وأنماط المبيعات' },
  sales_insights_patterns_subtitle: { en: 'Deep sales performance analysis and pattern detection', ar: 'تحليل معمق لأداء المبيعات واكتشاف الأنماط' },
  understanding_sales_insights: { en: 'Understanding Sales Insights & Patterns', ar: 'فهم رؤى وأنماط المبيعات' },

  // Analysis KPIs
  total_sales_value: { en: 'Total Sales Value', ar: 'إجمالي قيمة المبيعات' },
  gross_revenue_generated: { en: 'Gross revenue generated', ar: 'إجمالي الإيرادات المحققة' },
  // total_orders - defined earlier
  volume_of_transactions: { en: 'Volume of transactions', ar: 'حجم المعاملات' },
  // avg_order_value - defined earlier
  revenue_per_transaction: { en: 'Revenue per transaction', ar: 'الإيرادات لكل معاملة' },
  sales_growth_rate: { en: 'Sales Growth Rate', ar: 'معدل نمو المبيعات' },
  period_over_period: { en: 'Period over period', ar: 'مقارنة بالفترة السابقة' },
  top_agent: { en: 'Top Agent', ar: 'أفضل مندوب' },
  best_performer: { en: 'Best performer', ar: 'الأفضل أداءً' },
  top_product: { en: 'Top Product', ar: 'أفضل منتج' },
  revenue_leader: { en: 'Revenue leader', ar: 'الرائد في الإيرادات' },
  top_region: { en: 'Top Region', ar: 'أفضل منطقة' },
  highest_volume: { en: 'Highest volume', ar: 'أعلى حجم' },
  completion_rate_label: { en: 'Completion Rate', ar: 'معدل الإكمال' },
  order_fulfillment: { en: 'Order fulfillment', ar: 'تنفيذ الطلبات' },

  // Analysis Charts
  sales_by_product: { en: 'Sales by Product', ar: 'المبيعات حسب المنتج' },
  revenue_generating_items: { en: 'Revenue generating items', ar: 'المنتجات المدرة للإيرادات' },
  sales_by_agent: { en: 'Sales by Agent', ar: 'المبيعات حسب المندوب' },
  individual_contribution: { en: 'Individual contribution', ar: 'المساهمة الفردية' },
  regional_split: { en: 'Regional Split', ar: 'التوزيع الإقليمي' },
  geographic_distribution: { en: 'Geographic distribution', ar: 'التوزيع الجغرافي' },
  sales_flow: { en: 'Sales Flow', ar: 'تدفق المبيعات' },
  region_agent_status: { en: 'Region → Agent → Status', ar: 'المنطقة ← المندوب ← الحالة' },
  operational_sales_log: { en: 'Operational Sales Log', ar: 'سجل المبيعات التشغيلي' },
  detailed_transactional_review: { en: 'Detailed transactional review for auditing', ar: 'مراجعة تفصيلية للمعاملات للتدقيق' },
  // order_id, date, customer, total, status - defined earlier
  sales_customer: { en: 'Customer', ar: 'العميل' },
  regional_performance: { en: 'Regional Performance', ar: 'الأداء الإقليمي' },
  comparative_volume_territory: { en: 'Comparative volume by territory', ar: 'حجم المقارنة حسب المنطقة' },
  share_percent: { en: 'Share %', ar: 'نسبة الحصة' },
  analysis_insight: { en: 'Riyadh leads with 45% of sales, followed by Jeddah (25%). Expansion opportunities exist in Abha region.', ar: 'تتصدر الرياض بنسبة 45% من المبيعات، تليها جدة (25%). توجد فرص توسع في منطقة أبها.' },

  // Analysis Info
  analysis_overview_text: { en: 'The Sales Insights & Patterns dashboard focuses on deep sales performance analysis. It uncovers patterns, efficiency, and hidden signals that are not obvious in high-level summaries, helping you identify strengths and weaknesses at a glance.', ar: 'تركز لوحة رؤى وأنماط المبيعات على التحليل المعمق لأداء المبيعات. تكشف الأنماط والكفاءة والإشارات الخفية غير الواضحة في الملخصات العامة، مما يساعدك على تحديد نقاط القوة والضعف بنظرة واحدة.' },
  analysis_q1: { en: 'How does this help my decisions?', ar: 'كيف يساعدني هذا في قراراتي؟' },
  analysis_a1: { en: 'By showing region-to-agent performance flows, it helps you allocate resources and detect efficiency gaps early.', ar: 'من خلال عرض تدفقات الأداء من المنطقة إلى المندوب، يساعدك على تخصيص الموارد واكتشاف فجوات الكفاءة مبكراً.' },
  analysis_q2: { en: 'How do the table and side chart work?', ar: 'كيف يعمل الجدول والرسم البياني الجانبي؟' },
  analysis_a2: { en: 'The table provides the raw facts, while the companion chart reveals the "hidden story" of value concentration and agent contribution.', ar: 'يوفر الجدول الحقائق الأولية، بينما يكشف الرسم البياني المرافق عن "القصة الخفية" لتركيز القيمة ومساهمة المندوبين.' },
  analysis_q3: { en: 'How to detect unusual behavior?', ar: 'كيف أكتشف السلوك غير العادي؟' },
  analysis_a3: { en: 'Look for imbalances in the flow chart—if one agent or region has high volume but low completion, it signals a process bottleneck.', ar: 'ابحث عن اختلالات في مخطط التدفق—إذا كان لدى مندوب أو منطقة حجم عالٍ لكن إكمال منخفض، فهذا يشير إلى عنق زجاجة في العملية.' },
  analysis_logic: { en: 'Analysis Logic', ar: 'منطق التحليل' },
  operational_accuracy: { en: 'Operational Accuracy:', ar: 'الدقة التشغيلية:' },
  operational_accuracy_desc: { en: 'Table data is pulled directly from the `sales_orders` transactional log.', ar: 'يتم سحب بيانات الجدول مباشرة من سجل معاملات `sales_orders`.' },
  flow_mapping: { en: 'Flow Mapping:', ar: 'رسم التدفق:' },
  flow_mapping_desc: { en: 'The Sankey diagram uses a relational join between `orders`, `agents`, and `regions` to map trajectory.', ar: 'يستخدم مخطط سانكي ربطاً علائقياً بين `الطلبات` و`المندوبين` و`المناطق` لرسم المسار.' },
  operational_log_table: { en: '1. Operational Log', ar: '1. السجل التشغيلي' },
  operational_log_desc: { en: 'Stores raw transactional data for every order.', ar: 'يخزن البيانات الأولية للمعاملات لكل طلب.' },
  sales_agents_table: { en: '2. Sales Agents', ar: '2. مندوبي المبيعات' },
  sales_agents_desc: { en: 'Regional assignment and performance tracking.', ar: 'التخصيص الإقليمي وتتبع الأداء.' },
  customer_profiles_table: { en: '3. Customer Profiles', ar: '3. ملفات العملاء' },
  customer_profiles_desc: { en: 'Used for customer-specific filtering and search.', ar: 'تستخدم للتصفية والبحث الخاص بالعملاء.' },
  gross_revenue_desc: { en: 'Gross revenue generated before deductions. The top-line health metric.', ar: 'إجمالي الإيرادات المحققة قبل الخصومات. مؤشر الصحة الرئيسي.' },
  total_orders_desc: { en: 'Number of transactions processed in the selected period.', ar: 'عدد المعاملات المعالجة في الفترة المحددة.' },
  avg_order_desc: { en: 'Average revenue per transaction. Indicates pricing efficiency.', ar: 'متوسط الإيرادات لكل معاملة. يشير إلى كفاءة التسعير.' },
  sales_growth_desc: { en: 'Percentage increase in revenue compared to previous period.', ar: 'نسبة الزيادة في الإيرادات مقارنة بالفترة السابقة.' },
  top_agent_desc: { en: 'Best performing salesperson based on closed revenue.', ar: 'أفضل مندوب مبيعات بناءً على الإيرادات المغلقة.' },
  top_product_desc: { en: 'Revenue leader among all products sold.', ar: 'الرائد في الإيرادات بين جميع المنتجات المباعة.' },
  top_region_desc: { en: 'Highest volume region driving sales.', ar: 'المنطقة الأعلى حجماً في دفع المبيعات.' },
  completion_rate_desc: { en: 'Order fulfillment success rate percentage.', ar: 'نسبة معدل نجاح تنفيذ الطلبات.' },
  sales_by_product_desc: { en: 'Bar chart identifying your most popular and profitable items.', ar: 'مخطط شريطي يحدد العناصر الأكثر شعبية وربحية.' },
  sales_by_agent_desc: { en: 'Horizontal bars comparing salesperson performance.', ar: 'أشرطة أفقية تقارن أداء مندوبي المبيعات.' },
  regional_split_desc: { en: 'Donut chart showing revenue distribution by geography.', ar: 'مخطط دائري يوضح توزيع الإيرادات جغرافياً.' },
  agent_performance_desc: { en: 'Pie chart showing contribution by each sales agent.', ar: 'مخطط دائري يوضح مساهمة كل مندوب مبيعات.' },
  operational_log_desc2: { en: 'Sortable table with raw transactional data for auditing.', ar: 'جدول قابل للفرز مع البيانات الأولية للمعاملات للتدقيق.' },
  hidden_story_desc: { en: 'Sankey diagram visualizing the flow from Regions to Agents to Status.', ar: 'مخطط سانكي يصور التدفق من المناطق إلى المندوبين إلى الحالة.' },

  // ========================================
  // SALES FORECAST DASHBOARD
  // ========================================
  forecast_prediction: { en: 'Forecast & Prediction', ar: 'التنبؤ والتوقعات' },
  forecast_prediction_subtitle: { en: 'Strategic planning and predictive risk assessment', ar: 'التخطيط الاستراتيجي وتقييم المخاطر التنبؤية' },
  understanding_forecast: { en: 'Understanding Forecast & Prediction', ar: 'فهم التنبؤ والتوقعات' },

  // Forecast KPIs
  expected_revenue: { en: 'Expected Revenue', ar: 'الإيرادات المتوقعة' },
  next_90_days_projection: { en: 'Next 90 Days projection', ar: 'توقعات الـ 90 يوماً القادمة' },
  forecast_accuracy: { en: 'Forecast Accuracy', ar: 'دقة التنبؤ' },
  historical_performance: { en: 'Historical performance', ar: 'الأداء التاريخي' },
  risk_level: { en: 'Risk Level', ar: 'مستوى المخاطر' },
  operational_risk_status: { en: 'Operational risk status', ar: 'حالة المخاطر التشغيلية' },
  // low, medium, high - defined earlier
  exp_profit_margin: { en: 'Exp. Profit Margin', ar: 'هامش الربح المتوقع' },
  projected_efficiency: { en: 'Projected efficiency', ar: 'الكفاءة المتوقعة' },
  growth_rate: { en: 'Growth Rate', ar: 'معدل النمو' },
  yoy_projection: { en: 'YoY Projection', ar: 'التوقعات السنوية' },
  pipeline_value: { en: 'Pipeline Value', ar: 'قيمة خط الأنابيب' },
  potential_revenue: { en: 'Potential Revenue', ar: 'الإيرادات المحتملة' },
  confidence_score: { en: 'Confidence Score', ar: 'درجة الثقة' },
  model_reliability: { en: 'Model Reliability', ar: 'موثوقية النموذج' },
  deviation_avg: { en: 'Deviation Avg', ar: 'متوسط الانحراف' },
  forecast_error: { en: 'Forecast Error', ar: 'خطأ التنبؤ' },

  // Forecast Charts
  actual_vs_forecast: { en: 'Actual vs Forecast', ar: 'الفعلي مقابل المتوقع' },
  trend_comparison: { en: 'Trend comparison', ar: 'مقارنة الاتجاهات' },
  // actual, forecast - defined earlier
  forecast_per_product: { en: 'Forecast per Product', ar: 'التوقعات حسب المنتج' },
  projected_demand: { en: 'Projected demand', ar: 'الطلب المتوقع' },
  current: { en: 'Current', ar: 'الحالي' },
  risk_distribution: { en: 'Risk Distribution', ar: 'توزيع المخاطر' },
  vulnerability_assessment: { en: 'Vulnerability assessment', ar: 'تقييم نقاط الضعف' },
  low_risk: { en: 'Low Risk', ar: 'مخاطر منخفضة' },
  medium_risk: { en: 'Medium Risk', ar: 'مخاطر متوسطة' },
  high_risk: { en: 'High Risk', ar: 'مخاطر عالية' },
  regional_forecast: { en: 'Regional Forecast', ar: 'التوقعات الإقليمية' },
  territory_performance: { en: 'Territory performance', ar: 'أداء المناطق' },
  strategic_decision_table: { en: 'Strategic Decision Table', ar: 'جدول القرارات الاستراتيجية' },
  comparing_trends_targets: { en: 'Comparing current trends against predictive targets', ar: 'مقارنة الاتجاهات الحالية مع الأهداف التنبؤية' },
  target_product_region: { en: 'Target (Product/Region)', ar: 'الهدف (المنتج/المنطقة)' },
  last_30d_avg: { en: 'Last 30D Avg', ar: 'متوسط آخر 30 يوم' },
  next_30d_forecast: { en: 'Next 30D Forecast', ar: 'توقعات الـ 30 يوم القادمة' },
  dev_percent: { en: 'Dev. %', ar: 'الانحراف %' },
  product: { en: 'Product', ar: 'منتج' },
  region: { en: 'Region', ar: 'منطقة' },
  forecast_confidence_deviation: { en: 'Forecast Confidence vs Deviation', ar: 'ثقة التنبؤ مقابل الانحراف' },
  scatter_analysis_desc: { en: 'Scatter analysis: Bubble size = Projected Revenue, Red Bubbles = High Deviation', ar: 'تحليل مبعثر: حجم الفقاعة = الإيرادات المتوقعة، الفقاعات الحمراء = انحراف عالٍ' },
  forecast_insight: { en: 'Webcam 4K shows the highest deviation from forecast (+52.4%), suggesting an unexpected surge in demand or a conservative initial prediction.', ar: 'تُظهر كاميرا الويب 4K أعلى انحراف عن التوقعات (+52.4%)، مما يشير إلى ارتفاع غير متوقع في الطلب أو توقع أولي متحفظ.' },

  // Forecast Info
  forecast_overview_text: { en: 'The Forecast & Prediction dashboard tracks sales forecasts and predictive insights to help decision-makers plan ahead and reduce risk. It focuses on future trends rather than historical summaries.', ar: 'تتتبع لوحة التنبؤ والتوقعات توقعات المبيعات والرؤى التنبؤية لمساعدة صانعي القرار على التخطيط المسبق وتقليل المخاطر. تركز على الاتجاهات المستقبلية بدلاً من الملخصات التاريخية.' },
  forecast_q1: { en: 'Are sales on track for the next period?', ar: 'هل المبيعات على المسار الصحيح للفترة القادمة؟' },
  forecast_a1: { en: 'By comparing actual sales against weighted forecasts, we can see if performance is meeting expectations.', ar: 'من خلال مقارنة المبيعات الفعلية مع التوقعات المرجحة، يمكننا معرفة ما إذا كان الأداء يلبي التوقعات.' },
  forecast_q2: { en: 'Which products or regions are at risk?', ar: 'أي المنتجات أو المناطق معرضة للخطر؟' },
  forecast_a2: { en: 'The Decision Table highlights deviations, flagging items that are significantly underperforming relative to their forecast.', ar: 'يبرز جدول القرارات الانحرافات، مشيراً إلى العناصر التي تؤدي أداءً أقل بكثير مقارنة بتوقعاتها.' },
  forecast_q3: { en: 'Are trends linear or changing unexpectedly?', ar: 'هل الاتجاهات خطية أم تتغير بشكل غير متوقع؟' },
  forecast_a3: { en: 'Our predictive models look for subtle shifts in historical data that might indicate a non-linear trend change.', ar: 'تبحث نماذجنا التنبؤية عن تحولات دقيقة في البيانات التاريخية قد تشير إلى تغيير اتجاه غير خطي.' },
  forecast_q4: { en: 'Should we adjust strategy to prevent potential shortfalls?', ar: 'هل يجب تعديل الاستراتيجية لمنع النقص المحتمل؟' },
  forecast_a4: { en: 'Proactive insights allow management to reallocate resources or launch promotions before a predicted risk becomes a reality.', ar: 'تتيح الرؤى الاستباقية للإدارة إعادة تخصيص الموارد أو إطلاق العروض قبل أن تصبح المخاطر المتوقعة حقيقة.' },
  prediction_logic: { en: 'Prediction Logic', ar: 'منطق التنبؤ' },
  forecast_model: { en: 'Forecast Model:', ar: 'نموذج التنبؤ:' },
  forecast_model_desc: { en: 'Uses a weighted moving average of historical sales data.', ar: 'يستخدم المتوسط المتحرك المرجح لبيانات المبيعات التاريخية.' },
  trend_lines: { en: 'Trend Lines:', ar: 'خطوط الاتجاه:' },
  trend_lines_desc: { en: 'Derived using linear regression and exponential smoothing algorithms.', ar: 'مشتقة باستخدام خوارزميات الانحدار الخطي والتنعيم الأسي.' },
  orders_items_table: { en: '1. Orders & Items', ar: '1. الطلبات والعناصر' },
  orders_items_desc: { en: 'Primary volume data for trend extrapolation.', ar: 'بيانات الحجم الأساسية لاستقراء الاتجاهات.' },
  product_metadata_table: { en: '2. Product Metadata', ar: '2. بيانات المنتجات الوصفية' },
  product_metadata_desc: { en: 'Historical performance and category trends.', ar: 'الأداء التاريخي واتجاهات الفئات.' },
  expected_revenue_desc: { en: 'Projected revenue for the next 90 days based on historical weighted trends.', ar: 'الإيرادات المتوقعة لـ 90 يوماً القادمة بناءً على الاتجاهات المرجحة التاريخية.' },
  forecast_accuracy_desc: { en: 'Percentage of how closely past predictions matched actual sales outcomes.', ar: 'نسبة مدى تطابق التوقعات السابقة مع نتائج المبيعات الفعلية.' },
  risk_level_desc: { en: 'Overall potential for falling short of forecasted targets (Low/Medium/High).', ar: 'الإمكانية الإجمالية للتقصير عن الأهداف المتوقعة (منخفض/متوسط/مرتفع).' },
  profit_margin_desc: { en: 'Projected efficiency ratio indicating expected profit percentage.', ar: 'نسبة الكفاءة المتوقعة التي تشير إلى نسبة الربح المتوقعة.' },
  growth_rate_desc: { en: 'Year-over-year projected growth percentage for sales.', ar: 'نسبة النمو المتوقعة سنوياً للمبيعات.' },
  pipeline_value_desc: { en: 'Total potential revenue from opportunities in the sales pipeline.', ar: 'إجمالي الإيرادات المحتملة من الفرص في خط أنابيب المبيعات.' },
  confidence_score_desc: { en: 'Statistical confidence level of the forecast model reliability.', ar: 'مستوى الثقة الإحصائية لموثوقية نموذج التنبؤ.' },
  deviation_avg_desc: { en: 'Average forecast error expressed as percentage deviation from actuals.', ar: 'متوسط خطأ التنبؤ معبراً عنه كنسبة انحراف عن الفعلي.' },
  actual_vs_forecast_desc: { en: 'ECharts line comparison showing how reality aligns with projections over time.', ar: 'مقارنة خطية توضح كيفية توافق الواقع مع التوقعات بمرور الوقت.' },
  forecast_per_product_desc: { en: 'Bar chart comparing current vs projected spend by product category.', ar: 'مخطط شريطي يقارن الإنفاق الحالي مقابل المتوقع حسب فئة المنتج.' },
  risk_distribution_desc: { en: 'Pie chart visualizing where potential shortfalls are concentrated.', ar: 'مخطط دائري يصور أين يتركز النقص المحتمل.' },
  regional_forecast_desc: { en: 'Horizontal bar chart showing territory performance projections.', ar: 'مخطط شريطي أفقي يوضح توقعات أداء المناطق.' },
  decision_table_desc: { en: 'Actionable log highlighting deviations between current and predicted sales.', ar: 'سجل قابل للتنفيذ يبرز الانحرافات بين المبيعات الحالية والمتوقعة.' },
  deviation_scatter_desc: { en: 'Companion chart visualizing forecast value vs actual deviation percentage.', ar: 'مخطط مرافق يصور قيمة التنبؤ مقابل نسبة الانحراف الفعلية.' },

  // ========================================
  // SALES FUNNEL DASHBOARD
  // ========================================
  funnel_leakage: { en: 'Sales Funnel & Leakage', ar: 'قمع المبيعات والتسرب' },
  funnel_leakage_subtitle: { en: 'Optimizing lead-to-order flow and minimizing drop-offs', ar: 'تحسين تدفق العملاء المحتملين إلى الطلبات وتقليل التسرب' },
  understanding_funnel: { en: 'Understanding Funnel & Leakage', ar: 'فهم قمع المبيعات والتسرب' },

  // Funnel KPIs
  leads_entered: { en: 'Leads Entered', ar: 'العملاء المحتملون الجدد' },
  new_potential_leads: { en: 'New potential leads', ar: 'عملاء محتملون جدد' },
  leads_contacted: { en: 'Leads Contacted', ar: 'العملاء المُتواصل معهم' },
  first_outreach_made: { en: 'First outreach made', ar: 'تم التواصل الأول' },
  quotes_sent: { en: 'Quotes Sent', ar: 'العروض المرسلة' },
  price_proposals_delivered: { en: 'Price proposals delivered', ar: 'عروض الأسعار المُسلّمة' },
  orders_placed: { en: 'Orders Placed', ar: 'الطلبات المُقدمة' },
  closed_won_deals: { en: 'Closed won deals', ar: 'الصفقات المغلقة الناجحة' },
  // conversion_rate - defined earlier
  leads_to_orders: { en: 'Leads → Orders', ar: 'عملاء محتملون ← طلبات' },
  funnel_dropoff: { en: 'Funnel Drop-Off', ar: 'تسرب القمع' },
  avg_stage_leakage: { en: 'Avg. stage leakage', ar: 'متوسط تسرب المراحل' },
  potential_revenue_lost: { en: 'Potential Revenue Lost', ar: 'الإيرادات المحتملة المفقودة' },
  value_dropped_deals: { en: 'Value in dropped deals', ar: 'قيمة الصفقات المفقودة' },
  avg_deal_size: { en: 'Avg Deal Size', ar: 'متوسط حجم الصفقة' },
  won_deals_value: { en: 'Won deals value', ar: 'قيمة الصفقات الناجحة' },

  // Funnel Charts
  main_sales_funnel: { en: 'Main Sales Funnel', ar: 'قمع المبيعات الرئيسي' },
  lead_conversion_stages: { en: 'Lead conversion stages', ar: 'مراحل تحويل العملاء المحتملين' },
  dropoff_by_rep: { en: 'Drop-off by Sales Rep', ar: 'التسرب حسب مندوب المبيعات' },
  team_leakage_analysis: { en: 'Team leakage analysis', ar: 'تحليل تسرب الفريق' },
  leakage_percent: { en: 'Leakage %', ar: 'نسبة التسرب' },
  won_vs_lost_deals: { en: 'Won vs Lost Deals', ar: 'الصفقات الناجحة مقابل الخاسرة' },
  success_rate_breakdown: { en: 'Success rate breakdown', ar: 'تفصيل معدل النجاح' },
  won_deals: { en: 'Won Deals', ar: 'الصفقات الناجحة' },
  lost_dropped: { en: 'Lost/Dropped', ar: 'خاسرة/متروكة' },
  leakage_heatmap: { en: 'Leakage Heatmap', ar: 'خريطة حرارية للتسرب' },
  stage_category_analysis: { en: 'Stage vs category analysis', ar: 'تحليل المرحلة مقابل الفئة' },
  lead_tracking_table: { en: 'Lead Tracking Table', ar: 'جدول تتبع العملاء المحتملين' },
  detailed_stage_monitoring: { en: 'Detailed stage and status monitoring', ar: 'مراقبة تفصيلية للمراحل والحالة' },
  lead_customer: { en: 'Lead/Customer', ar: 'عميل محتمل/عميل' },
  stage: { en: 'Stage', ar: 'المرحلة' },
  date_entered: { en: 'Date Entered', ar: 'تاريخ الدخول' },
  value: { en: 'Value', ar: 'القيمة' },
  stage_velocity_analysis: { en: 'Stage Velocity Analysis', ar: 'تحليل سرعة المراحل' },
  avg_time_conversion_stage: { en: 'Average time and conversion by stage', ar: 'متوسط الوقت والتحويل حسب المرحلة' },
  avg_days: { en: 'Avg Days', ar: 'متوسط الأيام' },
  conv_percent: { en: 'Conv %', ar: 'نسبة التحويل' },
  lead_to_contact: { en: 'Lead→Contact', ar: 'عميل محتمل←تواصل' },
  contact_to_quote: { en: 'Contact→Quote', ar: 'تواصل←عرض سعر' },
  quote_to_order: { en: 'Quote→Order', ar: 'عرض سعر←طلب' },
  funnel_insight: { en: 'Quote→Order stage takes the longest (7.8 days avg) but maintains 70% conversion. Focus on reducing this cycle time.', ar: 'مرحلة عرض السعر←الطلب تستغرق الأطول (7.8 أيام في المتوسط) لكنها تحافظ على 70% تحويل. ركز على تقليل وقت هذه الدورة.' },

  // Funnel Info
  funnel_overview_text: { en: 'Tracks the sales funnel stages and identifies leakage points. This dashboard helps you visualize the journey from Lead to Order, allowing for data-driven optimizations to improve overall conversion.', ar: 'يتتبع مراحل قمع المبيعات ويحدد نقاط التسرب. تساعدك هذه اللوحة على تصور الرحلة من العميل المحتمل إلى الطلب، مما يتيح تحسينات قائمة على البيانات لتحسين التحويل الإجمالي.' },
  funnel_q1: { en: 'Where are we losing the most leads?', ar: 'أين نفقد معظم العملاء المحتملين؟' },
  funnel_a1: { en: 'Check the Funnel Chart drop-off percentages between stages. High leakage after "Quotes Sent" usually indicates pricing or follow-up issues.', ar: 'تحقق من نسب التسرب بين المراحل في مخطط القمع. التسرب العالي بعد "العروض المرسلة" يشير عادة إلى مشاكل في التسعير أو المتابعة.' },
  funnel_q2: { en: 'Which sales reps have higher drop-off?', ar: 'أي مندوبي المبيعات لديهم تسرب أعلى؟' },
  funnel_a2: { en: 'The "Drop-off by Sales Rep" bar chart identifies team members who may need additional training on closing or qualifying leads.', ar: 'يحدد مخطط "التسرب حسب مندوب المبيعات" أعضاء الفريق الذين قد يحتاجون تدريباً إضافياً على الإغلاق أو تأهيل العملاء المحتملين.' },
  funnel_q3: { en: 'Which products have highest leakage?', ar: 'أي المنتجات لديها أعلى تسرب؟' },
  funnel_a3: { en: 'The Leakage Heatmap highlights specific products that frequently enter the funnel but fail to reach the "Won" status.', ar: 'تبرز خريطة التسرب الحرارية المنتجات المحددة التي تدخل القمع بشكل متكرر لكنها تفشل في الوصول إلى حالة "ناجح".' },
  funnel_logic: { en: 'Funnel Logic', ar: 'منطق القمع' },
  active_tracking: { en: 'Active Tracking:', ar: 'التتبع النشط:' },
  active_tracking_desc: { en: 'Includes all leads with \'Won\', \'Lost\', or \'Pending\' status.', ar: 'يشمل جميع العملاء المحتملين بحالة "ناجح" أو "خاسر" أو "معلق".' },
  data_sanitation: { en: 'Data Sanitation:', ar: 'تنقية البيانات:' },
  data_sanitation_desc: { en: 'Excludes test, draft or invalid entries to maintain accuracy.', ar: 'يستثني الإدخالات التجريبية أو المسودات أو غير الصالحة للحفاظ على الدقة.' },
  crm_leads_table: { en: '1. CRM Leads', ar: '1. العملاء المحتملون في CRM' },
  crm_leads_desc: { en: 'Entry point for all potential customer interactions.', ar: 'نقطة الدخول لجميع تفاعلات العملاء المحتملين.' },
  sales_orders_table: { en: '2. Sales Orders', ar: '2. طلبات المبيعات' },
  sales_orders_desc: { en: 'Fulfillment and completion data for the final stage.', ar: 'بيانات التنفيذ والإكمال للمرحلة النهائية.' },
  leads_entered_desc: { en: 'Total number of potential customers entering the top of the funnel.', ar: 'إجمالي عدد العملاء المحتملين الداخلين إلى قمة القمع.' },
  leads_contacted_desc: { en: 'Number of leads that received first outreach from sales team.', ar: 'عدد العملاء المحتملين الذين تلقوا أول تواصل من فريق المبيعات.' },
  quotes_sent_desc: { en: 'Number of price proposals delivered to qualified prospects.', ar: 'عدد عروض الأسعار المُسلّمة للعملاء المؤهلين.' },
  orders_placed_desc: { en: 'Total closed won deals that converted to actual orders.', ar: 'إجمالي الصفقات المغلقة الناجحة التي تحولت إلى طلبات فعلية.' },
  // conversion_rate_desc - defined earlier
  funnel_dropoff_desc: { en: 'Average stage leakage rate across all funnel transitions.', ar: 'متوسط معدل تسرب المراحل عبر جميع انتقالات القمع.' },
  revenue_lost_desc: { en: 'Financial value of deals that were marked as Lost or dropped out.', ar: 'القيمة المالية للصفقات التي تم تصنيفها كخاسرة أو متروكة.' },
  deal_size_desc: { en: 'Average value of won deals indicating deal quality.', ar: 'متوسط قيمة الصفقات الناجحة مما يشير إلى جودة الصفقات.' },
  main_funnel_desc: { en: 'ECharts funnel visualization showing lead volume through conversion stages.', ar: 'تصور قمعي يوضح حجم العملاء المحتملين عبر مراحل التحويل.' },
  dropoff_rep_desc: { en: 'Bar chart identifying team members with highest leakage rates.', ar: 'مخطط شريطي يحدد أعضاء الفريق ذوي أعلى معدلات تسرب.' },
  won_lost_desc: { en: 'Pie chart showing success rate breakdown between won and lost.', ar: 'مخطط دائري يوضح تفصيل معدل النجاح بين الناجح والخاسر.' },
  heatmap_desc: { en: 'Matrix view showing stage vs category value loss intensity.', ar: 'عرض مصفوفة يوضح شدة فقدان القيمة حسب المرحلة والفئة.' },
  lead_table_desc: { en: 'Detailed log of leads with stage, date, value and status.', ar: 'سجل تفصيلي للعملاء المحتملين مع المرحلة والتاريخ والقيمة والحالة.' },
  velocity_desc: { en: 'Companion chart showing average time and conversion by stage.', ar: 'مخطط مرافق يوضح متوسط الوقت والتحويل حسب المرحلة.' },

  // ========================================
  // SALES SEGMENTATION DASHBOARD
  // ========================================
  segmentation_loyalty: { en: 'Customer Segmentation & Loyalty', ar: 'تقسيم العملاء والولاء' },
  segmentation_loyalty_subtitle: { en: 'Personalizing campaigns and maximizing customer lifetime value', ar: 'تخصيص الحملات وتعظيم القيمة العمرية للعميل' },
  understanding_segmentation: { en: 'Understanding Segmentation & Loyalty', ar: 'فهم التقسيم والولاء' },

  // Segmentation KPIs
  total_customers: { en: 'Total Customers', ar: 'إجمالي العملاء' },
  lifetime_registered_base: { en: 'Lifetime registered base', ar: 'قاعدة المسجلين التراكمية' },
  active_customers: { en: 'Active Customers', ar: 'العملاء النشطون' },
  last_90_days_activity: { en: 'Last 90 days activity', ar: 'نشاط آخر 90 يوماً' },
  repeat_customer_percent: { en: 'Repeat Customer %', ar: 'نسبة العملاء المتكررين' },
  loyalty_retention_rate: { en: 'Loyalty retention rate', ar: 'معدل الاحتفاظ بالولاء' },
  avg_clv: { en: 'Avg. CLV', ar: 'متوسط قيمة العميل الدائمة' },
  est_lifetime_value: { en: 'Est. lifetime value', ar: 'القيمة العمرية المقدرة' },
  avg_orders: { en: 'Avg. Orders', ar: 'متوسط الطلبات' },
  per_customer_frequency: { en: 'Per customer frequency', ar: 'تكرار لكل عميل' },
  churn_rate_percent: { en: 'Churn Rate %', ar: 'نسبة التسرب' },
  lost_customer_ratio: { en: 'Lost customer ratio', ar: 'نسبة العملاء المفقودين' },
  engagement_score: { en: 'Engagement Score', ar: 'درجة التفاعل' },
  rfv_avg: { en: 'Recency/Freq/Value avg', ar: 'متوسط الحداثة/التكرار/القيمة' },
  // new_customers - defined earlier
  monthly_acquisitions: { en: 'Monthly acquisitions', ar: 'الاستحواذات الشهرية' },

  // Segmentation Charts
  customer_segmentation: { en: 'Customer Segmentation', ar: 'تقسيم العملاء' },
  count_per_segment: { en: 'Count per segment', ar: 'العدد لكل شريحة' },
  // customers - defined earlier
  repeat_vs_onetime: { en: 'Repeat vs One-Time', ar: 'متكرر مقابل لمرة واحدة' },
  loyalty_depth_segment: { en: 'Loyalty depth by segment', ar: 'عمق الولاء حسب الشريحة' },
  repeat_percent: { en: 'Repeat %', ar: 'نسبة التكرار' },
  onetime_percent: { en: 'One-Time %', ar: 'نسبة المرة الواحدة' },
  revenue_by_segment: { en: 'Revenue by Segment', ar: 'الإيرادات حسب الشريحة' },
  contribution_share: { en: 'Contribution share', ar: 'حصة المساهمة' },
  loyalty_curve: { en: 'Loyalty Curve', ar: 'منحنى الولاء' },
  orders_vs_revenue_segment: { en: 'Orders vs revenue by segment', ar: 'الطلبات مقابل الإيرادات حسب الشريحة' },
  orders_per_customer: { en: 'Orders per Customer', ar: 'الطلبات لكل عميل' },
  // revenue_per_customer - defined earlier as revenue_per_transaction

  // Segment names
  high_value: { en: 'High Value', ar: 'قيمة عالية' },
  medium_value: { en: 'Medium Value', ar: 'قيمة متوسطة' },
  low_value: { en: 'Low Value', ar: 'قيمة منخفضة' },
  high_value_avg: { en: 'High Value Avg', ar: 'متوسط القيمة العالية' },
  medium_value_avg: { en: 'Medium Value Avg', ar: 'متوسط القيمة المتوسطة' },
  low_value_avg: { en: 'Low Value Avg', ar: 'متوسط القيمة المنخفضة' },
  at_risk_avg: { en: 'At Risk Avg', ar: 'متوسط المعرض للخطر' },
  vip: { en: 'VIP', ar: 'كبار العملاء' },
  regular: { en: 'Regular', ar: 'عادي' },
  // new - defined earlier
  churned: { en: 'Churned', ar: 'متسرب' },

  // Segmentation Table
  top_customers_list: { en: 'Top Customers List', ar: 'قائمة أفضل العملاء' },
  segmentation_engagement_monitoring: { en: 'Segmentation and engagement monitoring', ar: 'مراقبة التقسيم والتفاعل' },
  segment: { en: 'Segment', ar: 'الشريحة' },
  // orders, revenue - defined earlier
  eng_score: { en: 'Eng. Score', ar: 'درجة التفاعل' },
  customer_value_distribution: { en: 'Customer Value Distribution', ar: 'توزيع قيمة العملاء' },
  revenue_contribution_tier: { en: 'Revenue contribution by segment tier', ar: 'مساهمة الإيرادات حسب مستوى الشريحة' },
  segmentation_insight: { en: 'The "High Value" segment accounts for 55% of revenue while making up only 7.5% of the total customer base.', ar: 'تمثل شريحة "القيمة العالية" 55% من الإيرادات بينما تشكل 7.5% فقط من إجمالي قاعدة العملاء.' },

  // Segmentation Info
  segmentation_overview_text: { en: 'This dashboard provides insights into customer segmentation, loyalty patterns, and CLV (Customer Lifetime Value) analysis to help optimize retention strategies and personalize marketing efforts.', ar: 'توفر هذه اللوحة رؤى حول تقسيم العملاء وأنماط الولاء وتحليل القيمة العمرية للعميل للمساعدة في تحسين استراتيجيات الاحتفاظ وتخصيص جهود التسويق.' },
  segmentation_q1: { en: 'Which customer segments drive the most revenue?', ar: 'أي شرائح العملاء تحقق أكبر الإيرادات؟' },
  segmentation_a1: { en: 'Check the "Revenue by Segment" pie chart. High Value customers typically generate the majority of revenue despite being a smaller percentage of the base.', ar: 'تحقق من مخطط "الإيرادات حسب الشريحة". عادة ما يحقق عملاء القيمة العالية غالبية الإيرادات رغم كونهم نسبة أصغر من القاعدة.' },
  segmentation_q2: { en: 'How do I identify customers at risk of churning?', ar: 'كيف أحدد العملاء المعرضين لخطر التسرب؟' },
  segmentation_a2: { en: 'Look at the "At Risk" segment in the segmentation charts and the Churn Rate KPI. Customers with declining engagement scores should be prioritized for retention campaigns.', ar: 'انظر إلى شريحة "المعرض للخطر" في مخططات التقسيم ومؤشر معدل التسرب. يجب إعطاء الأولوية للعملاء ذوي درجات التفاعل المتراجعة في حملات الاحتفاظ.' },
  segmentation_q3: { en: 'How effective are our loyalty programs?', ar: 'ما مدى فعالية برامج الولاء لدينا؟' },
  segmentation_a3: { en: 'The Repeat Customer % and Loyalty Curve show retention success. Compare repeat vs one-time purchase patterns across segments to measure program effectiveness.', ar: 'تُظهر نسبة العملاء المتكررين ومنحنى الولاء نجاح الاحتفاظ. قارن أنماط الشراء المتكرر مقابل المرة الواحدة عبر الشرائح لقياس فعالية البرنامج.' },
  segmentation_logic: { en: 'Segmentation Logic', ar: 'منطق التقسيم' },
  rfm_scoring: { en: 'RFM Scoring:', ar: 'تسجيل RFM:' },
  rfm_scoring_desc: { en: 'Customers are scored based on Recency (last purchase), Frequency (purchase count), and Monetary (total spend) values.', ar: 'يتم تسجيل العملاء بناءً على الحداثة (آخر شراء) والتكرار (عدد المشتريات) والقيمة النقدية (إجمالي الإنفاق).' },
  clv_calculation: { en: 'CLV Calculation:', ar: 'حساب القيمة العمرية:' },
  clv_calculation_desc: { en: 'Customer Lifetime Value is estimated using average order value × purchase frequency × expected customer lifespan.', ar: 'يتم تقدير القيمة العمرية للعميل باستخدام متوسط قيمة الطلب × تكرار الشراء × العمر المتوقع للعميل.' },
  customer_profiles_table2: { en: '1. Customer Profiles', ar: '1. ملفات العملاء' },
  customer_profiles_desc2: { en: 'Master data for all registered customers with demographic and contact info.', ar: 'البيانات الرئيسية لجميع العملاء المسجلين مع المعلومات الديموغرافية وبيانات الاتصال.' },
  purchase_history_table: { en: '2. Purchase History', ar: '2. سجل المشتريات' },
  purchase_history_desc: { en: 'Transaction log used for RFM analysis and spending patterns.', ar: 'سجل المعاملات المستخدم لتحليل RFM وأنماط الإنفاق.' },
  total_customers_desc: { en: 'Lifetime registered customer count across all channels.', ar: 'إجمالي عدد العملاء المسجلين عبر جميع القنوات.' },
  active_customers_desc: { en: 'Customers with at least one interaction in the last 90 days.', ar: 'العملاء الذين لديهم تفاعل واحد على الأقل في آخر 90 يوماً.' },
  repeat_customer_desc: { en: 'Percentage of customers who made more than one purchase.', ar: 'نسبة العملاء الذين أجروا أكثر من عملية شراء.' },
  avg_clv_desc: { en: 'Average predicted lifetime value per customer.', ar: 'متوسط القيمة العمرية المتوقعة لكل عميل.' },
  avg_orders_desc: { en: 'Average number of orders per customer over their lifetime.', ar: 'متوسط عدد الطلبات لكل عميل خلال فترة تعامله.' },
  churn_rate_desc: { en: 'Percentage of customers who stopped purchasing in the analysis period.', ar: 'نسبة العملاء الذين توقفوا عن الشراء في فترة التحليل.' },
  engagement_score_desc: { en: 'Composite score based on recency, frequency, and value metrics.', ar: 'درجة مركبة بناءً على مقاييس الحداثة والتكرار والقيمة.' },
  new_customers_desc: { en: 'Count of new customer acquisitions in the current month.', ar: 'عدد العملاء الجدد المكتسبين في الشهر الحالي.' },
  segmentation_chart_desc: { en: 'Bar chart showing customer count distribution across value segments.', ar: 'مخطط شريطي يوضح توزيع عدد العملاء عبر شرائح القيمة.' },
  repeat_onetime_desc: { en: 'Stacked bar showing loyalty depth comparison by customer type.', ar: 'شريط مكدس يوضح مقارنة عمق الولاء حسب نوع العميل.' },
  revenue_segment_desc: { en: 'Donut chart showing revenue contribution percentage by segment.', ar: 'مخطط دائري يوضح نسبة مساهمة الإيرادات حسب الشريحة.' },
  loyalty_curve_desc: { en: 'Scatter plot showing correlation between order frequency and revenue.', ar: 'مخطط مبعثر يوضح الارتباط بين تكرار الطلبات والإيرادات.' },
  top_customers_desc: { en: 'Ranked table of highest-value customers with engagement metrics.', ar: 'جدول مرتب لأعلى العملاء قيمة مع مقاييس التفاعل.' },
  value_distribution_desc: { en: 'Companion chart showing revenue distribution across segment tiers.', ar: 'مخطط مرافق يوضح توزيع الإيرادات عبر مستويات الشرائح.' },

  // ========================================
  // SALES PROMOTIONS DASHBOARD
  // ========================================
  promotions_effectiveness: { en: 'Promotions & Campaign Effectiveness', ar: 'العروض الترويجية وفعالية الحملات' },
  promotions_effectiveness_subtitle: { en: 'Measuring ROI and optimizing marketing spend impact', ar: 'قياس العائد على الاستثمار وتحسين تأثير الإنفاق التسويقي' },
  campaign_effectiveness: { en: 'Campaign Effectiveness', ar: 'فعالية الحملة' },
  understanding_promotions: { en: 'Understanding Promotion ROI', ar: 'فهم عائد الاستثمار للعروض' },

  // Promotions KPIs
  campaigns_active: { en: 'Campaigns Active', ar: 'الحملات النشطة' },
  live_promotional_events: { en: 'Live promotional events', ar: 'الأحداث الترويجية الحية' },
  total_spend_label: { en: 'Total Spend', ar: 'إجمالي الإنفاق' },
  marketing_budget_used: { en: 'Marketing budget used', ar: 'الميزانية التسويقية المستخدمة' },
  revenue_from_promo: { en: 'Revenue from Promo', ar: 'الإيرادات من العروض' },
  attributed_gross_volume: { en: 'Attributed gross volume', ar: 'الحجم الإجمالي المنسوب' },
  overall_roi: { en: 'Overall ROI', ar: 'العائد الإجمالي على الاستثمار' },
  campaign_profitability: { en: 'Campaign profitability', ar: 'ربحية الحملة' },
  promo_conversion: { en: 'Promo Conversion', ar: 'تحويل العروض' },
  engaged_vs_purchased: { en: 'Engaged vs Purchased', ar: 'المتفاعلون مقابل المشترون' },
  incremental_sales: { en: 'Incremental Sales', ar: 'المبيعات الإضافية' },
  above_organic_baseline: { en: 'Above organic baseline', ar: 'فوق خط الأساس العضوي' },
  engagement_rate_label: { en: 'Engagement Rate', ar: 'معدل التفاعل' },
  clicks_engagement_avg: { en: 'Clicks/Engagement avg', ar: 'متوسط النقرات/التفاعل' },
  coupon_redemption: { en: 'Coupon Redemption', ar: 'استخدام الكوبونات' },
  codes_used_issued: { en: 'Codes used vs issued', ar: 'الأكواد المستخدمة مقابل الصادرة' },

  // Promotions Charts
  campaign_performance: { en: 'Campaign Performance', ar: 'أداء الحملة' },
  revenue_per_campaign: { en: 'Revenue per campaign', ar: 'الإيرادات لكل حملة' },
  conversion_by_campaign: { en: 'Conversion by Campaign', ar: 'التحويل حسب الحملة' },
  conversion_efficiency: { en: 'Conversion efficiency', ar: 'كفاءة التحويل' },
  conversion: { en: 'Conversion', ar: 'التحويل' },
  revenue_by_type: { en: 'Revenue by Type', ar: 'الإيرادات حسب النوع' },
  promotion_type_breakdown: { en: 'Promotion type breakdown', ar: 'تفصيل نوع العرض' },
  campaign_impact: { en: 'Campaign Impact', ar: 'تأثير الحملة' },
  roi_vs_conversion: { en: 'ROI vs Conversion', ar: 'العائد مقابل التحويل' },

  // Promo types
  direct_discount: { en: 'Direct Discount', ar: 'خصم مباشر' },
  coupon_code: { en: 'Coupon Code', ar: 'كود خصم' },
  bogo: { en: 'BOGO', ar: 'اشترِ واحد واحصل على آخر' },
  free_shipping: { en: 'Free Shipping', ar: 'شحن مجاني' },
  discount: { en: 'Discount', ar: 'خصم' },
  coupon: { en: 'Coupon', ar: 'كوبون' },
  free_ship: { en: 'Free Ship', ar: 'شحن مجاني' },
  event: { en: 'Event', ar: 'حدث' },

  // Promotions Table
  campaign_audit_table: { en: 'Campaign Audit Table', ar: 'جدول تدقيق الحملات' },
  detailed_roi_tracking: { en: 'Detailed ROI and budget tracking', ar: 'تتبع تفصيلي للعائد والميزانية' },
  campaign: { en: 'Campaign', ar: 'الحملة' },
  type: { en: 'Type', ar: 'النوع' },
  budget: { en: 'Budget', ar: 'الميزانية' },
  roi_percent: { en: 'ROI %', ar: 'نسبة العائد' },
  campaign_roi_analysis: { en: 'Campaign ROI Analysis', ar: 'تحليل عائد الحملة' },
  budget_vs_revenue: { en: 'Budget vs Revenue comparison', ar: 'مقارنة الميزانية مقابل الإيرادات' },
  promotions_insight: { en: '"Flash Deal" shows the highest conversion (22.4%) and ROI (800%), suggesting high-intensity short-term deals are most effective for immediate revenue.', ar: 'يُظهر "العرض السريع" أعلى تحويل (22.4%) وعائد (800%)، مما يشير إلى أن الصفقات قصيرة المدى عالية الكثافة هي الأكثر فعالية للإيرادات الفورية.' },

  // Promotions Info
  promotions_overview_text: { en: 'Evaluates the impact of marketing campaigns and promotions on revenue and behavior. Helps management optimize ROI and phase out ineffective spend.', ar: 'يقيّم تأثير الحملات التسويقية والعروض الترويجية على الإيرادات والسلوك. يساعد الإدارة على تحسين العائد على الاستثمار والتخلص من الإنفاق غير الفعال.' },
  promotions_q1: { en: 'Which campaigns deliver the best ROI?', ar: 'أي الحملات تحقق أفضل عائد على الاستثمار؟' },
  promotions_a1: { en: 'Check the "ROI %" column in the Campaign Table or the Campaign Impact Bubble chart. Campaigns in the top-right quadrant have high ROI and high engagement.', ar: 'تحقق من عمود "نسبة العائد" في جدول الحملات أو مخطط فقاعات تأثير الحملة. الحملات في الربع العلوي الأيمن لديها عائد عالٍ وتفاعل مرتفع.' },
  promotions_q2: { en: 'Are promotions driving real sales or just discounts?', ar: 'هل العروض تحقق مبيعات حقيقية أم مجرد خصومات؟' },
  promotions_a2: { en: 'Compare the "Incremental Sales vs Baseline" KPI. A positive value indicates the promotion is driving volume beyond normal organic levels.', ar: 'قارن مؤشر "المبيعات الإضافية مقابل خط الأساس". القيمة الإيجابية تشير إلى أن العرض يدفع الحجم فوق المستويات العضوية الطبيعية.' },
  promotions_q3: { en: 'Which campaigns reach the right customers?', ar: 'أي الحملات تصل إلى العملاء المناسبين؟' },
  promotions_a3: { en: 'Refer to the Customer Participation pie chart to see if your target segments are the ones actually utilizing the promotions.', ar: 'راجع مخطط مشاركة العملاء لمعرفة ما إذا كانت الشرائح المستهدفة هي التي تستخدم العروض فعلياً.' },
  attribution_logic: { en: 'Attribution Logic', ar: 'منطق الإسناد' },
  promo_attribution: { en: 'Promo Attribution:', ar: 'إسناد العرض:' },
  promo_attribution_desc: { en: 'Orders are attributed to a campaign if a promo code was applied or if the purchase followed a campaign link within 7 days.', ar: 'تُنسب الطلبات إلى حملة إذا تم تطبيق كود خصم أو إذا تمت عملية الشراء بعد رابط الحملة خلال 7 أيام.' },
  roi_calculation: { en: 'ROI Calculation:', ar: 'حساب العائد:' },
  roi_calculation_desc: { en: '(Promo Revenue - Marketing Spend) / Marketing Spend × 100.', ar: '(إيرادات العرض - الإنفاق التسويقي) / الإنفاق التسويقي × 100.' },
  baseline_exclusion: { en: 'Baseline Exclusion:', ar: 'استبعاد خط الأساس:' },
  baseline_exclusion_desc: { en: 'Incremental sales exclude organic baseline estimated from non-promo period averages.', ar: 'تستثني المبيعات الإضافية خط الأساس العضوي المقدر من متوسطات فترات عدم العروض.' },
  campaign_master_table: { en: '1. Campaign Master', ar: '1. سجل الحملات الرئيسي' },
  campaign_master_desc: { en: 'All promotional campaigns and their configurations.', ar: 'جميع الحملات الترويجية وتكويناتها.' },
  promo_transactions_table: { en: '2. Promo Transactions', ar: '2. معاملات العروض' },
  promo_transactions_desc: { en: 'Orders linked to promotional activities.', ar: 'الطلبات المرتبطة بالأنشطة الترويجية.' },
  marketing_spend_table: { en: '3. Marketing Spend', ar: '3. الإنفاق التسويقي' },
  marketing_spend_desc: { en: 'Budget allocation and spend tracking per campaign.', ar: 'تخصيص الميزانية وتتبع الإنفاق لكل حملة.' },
  campaigns_active_desc: { en: 'Number of currently live promotional events.', ar: 'عدد الأحداث الترويجية الحية حالياً.' },
  total_spend_desc: { en: 'Marketing budget utilized across all campaigns.', ar: 'الميزانية التسويقية المستخدمة عبر جميع الحملات.' },
  revenue_promo_desc: { en: 'Attributed gross volume generated from promotions.', ar: 'الحجم الإجمالي المنسوب المُولَّد من العروض.' },
  overall_roi_desc: { en: 'Campaign profitability percentage.', ar: 'نسبة ربحية الحملة.' },
  promo_conversion_desc: { en: 'Percentage of engaged customers who completed a purchase.', ar: 'نسبة العملاء المتفاعلين الذين أكملوا عملية شراء.' },
  incremental_sales_desc: { en: 'Sales above organic baseline attributed to promotions.', ar: 'المبيعات فوق خط الأساس العضوي المنسوبة للعروض.' },
  engagement_rate_desc: { en: 'Average clicks and engagement per campaign.', ar: 'متوسط النقرات والتفاعل لكل حملة.' },
  coupon_redemption_desc: { en: 'Percentage of issued codes that were used.', ar: 'نسبة الأكواد الصادرة التي تم استخدامها.' },
  campaign_performance_desc: { en: 'Bar chart showing revenue per campaign.', ar: 'مخطط شريطي يوضح الإيرادات لكل حملة.' },
  conversion_campaign_desc: { en: 'Horizontal bar showing conversion efficiency.', ar: 'شريط أفقي يوضح كفاءة التحويل.' },
  revenue_type_desc: { en: 'Pie chart of promotion type breakdown.', ar: 'مخطط دائري لتفصيل نوع العرض.' },
  campaign_impact_desc: { en: 'Scatter chart showing ROI vs Conversion.', ar: 'مخطط مبعثر يوضح العائد مقابل التحويل.' },
  campaign_audit_desc: { en: 'Detailed ROI and budget tracking per campaign.', ar: 'تتبع تفصيلي للعائد والميزانية لكل حملة.' },
  campaign_roi_desc: { en: 'Companion chart comparing budget vs revenue.', ar: 'مخطط مرافق يقارن الميزانية مقابل الإيرادات.' },
};

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
  userDisplayName: string;
  updateUserDisplayName: (name: string) => void;
  country: CountryConfig;
  updateCountry: (countryCode: string) => void;
  currency: CurrencyConfig;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('app-language') as Language) || 'en';
  });
  const [userDisplayName, setUserDisplayName] = useState<string>(() => {
    return localStorage.getItem('app-user-display-name') || 'Alex';
  });

  const [country, setCountry] = useState<CountryConfig>(() => {
    const savedCode = localStorage.getItem('app-country-code');
    return COUNTRIES[savedCode || DEFAULT_COUNTRY_CODE] || COUNTRIES[DEFAULT_COUNTRY_CODE];
  });

  // Load from local storage on mount (optional, omitting for brevity in this demo)

  useEffect(() => {
    // Update HTML class for Tailwind Dark Mode
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Persist theme preference
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Update HTML direction for RTL
    const root = window.document.documentElement;
    root.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', language);
    localStorage.setItem('app-language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('app-user-display-name', userDisplayName);
  }, [userDisplayName]);

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

  const updateUserDisplayName = (name: string) => {
    setUserDisplayName(name);
  };

  const updateCountry = (countryCode: string) => {
    if (COUNTRIES[countryCode]) {
      setCountry(COUNTRIES[countryCode]);
      localStorage.setItem('app-country-code', countryCode);
    }
  };

  return (
    <AppContext.Provider value={{
      theme,
      toggleTheme,
      language,
      toggleLanguage,
      t,
      dir: language === 'ar' ? 'rtl' : 'ltr',
      userDisplayName,
      updateUserDisplayName,
      country,
      updateCountry,
      currency: {
        ...country.currency,
        // Use English symbol when in English mode if available
        symbol: language === 'en' && country.currency.symbolEn
          ? country.currency.symbolEn
          : country.currency.symbol
      }
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
