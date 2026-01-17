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
  cancel: { en: 'Cancel', ar: 'إلغاء' },
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
  trash: { en: 'Trash', ar: 'سلة المهملات' },
  connected: { en: 'Connected', ar: 'متصل' },
  syncing_emails: { en: 'Syncing emails...', ar: 'جاري مزامنة البريد...' },
  no_emails_found: { en: 'No emails found', ar: 'لم يتم العثور على رسائل' },
  select_item_to_read: { en: 'Select an item to read', ar: 'اختر عنصراً للقراءة' },
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
  existing_board: { en: 'Existing Board', ar: 'لوحة موجودة' },
  workspace: { en: 'Workspace', ar: 'مساحة العمل' },
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
  rename: { en: 'Rename', ar: 'إعادة التسمية' },
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
  delete_workspace: { en: 'Delete Workspace', ar: 'حذف مساحة العمل' },
  delete_workspace_confirm: { en: 'Are you sure you want to delete this workspace? All boards within it will be deleted. This action cannot be undone.', ar: 'هل أنت متأكد من حذف مساحة العمل هذه؟ سيتم حذف جميع اللوحات فيها. لا يمكن التراجع عن هذا الإجراء.' },
  cannot_delete_only_workspace: { en: 'Cannot delete the only workspace. Create another one first.', ar: 'لا يمكن حذف مساحة العمل الوحيدة. قم بإنشاء واحدة أخرى أولاً.' },

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
  flow_hub: { en: 'Flow Hub', ar: 'مركز التدفق' },
  process_map: { en: 'Process Map', ar: 'خريطة العمليات' },
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
  preferences: { en: 'Preferences', ar: 'التفضيلات' },
  appearance: { en: 'Appearance', ar: 'المظهر' },
  switch_theme_desc: { en: 'Switch between light and dark mode', ar: 'التبديل بين الوضع الفاتح والداكن' },

  // Event Modal
  create_event: { en: 'Create Event', ar: 'إنشاء حدث' },
  schedule_event_desc: { en: 'Schedule a new event for your project', ar: 'جدولة حدث جديد لمشروعك' },
  project_context: { en: 'Project Context', ar: 'سياق المشروع' },
  event_title: { en: 'Event Title', ar: 'عنوان الحدث' },
  placeholder_event_title: { en: 'e.g. Project Kickoff Meeting', ar: 'مثال: اجتماع انطلاق المشروع' },
  placeholder_event_desc: { en: 'Add details about this event...', ar: 'أضف تفاصيل حول هذا الحدث...' },
  attendees: { en: 'Attendees', ar: 'الحضور' },
  add_people: { en: 'Add people...', ar: 'إضافة أشخاص...' },

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
  board_name_placeholder: { en: 'Board name', ar: 'اسم اللوحة' },
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
  type: { en: 'Type', ar: 'النوع' },

  // Supply Chain - General
  warehouse_dashboards: { en: 'Warehouse Dashboards', ar: 'لوحات المستودع' },
  shipping_dashboards: { en: 'Shipping Dashboards', ar: 'لوحات الشحن' },
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
  on_track: { en: 'On Track', ar: 'على المسار' },
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
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('en');
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
  }, [theme]);

  useEffect(() => {
    // Update HTML direction for RTL
    const root = window.document.documentElement;
    root.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', language);
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
      currency: country.currency
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
