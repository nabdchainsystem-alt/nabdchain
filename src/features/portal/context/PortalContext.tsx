import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { getThemeStyles, ThemeStyles, Theme, Language } from '../../../theme/portalColors';

type Direction = 'ltr' | 'rtl';

interface PortalContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  direction: Direction;
  t: (key: string) => string;
  styles: ThemeStyles;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

// Translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'common.signOut': 'Sign Out',
    'common.seller': 'Seller',
    'common.buyer': 'Buyer',
    'common.search': 'Search',
    'common.viewAll': 'View All',
    'common.submit': 'Submit',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.loading': 'Loading...',
    'common.noData': 'No data available',
    'common.back': 'Back',
    'common.continue': 'Continue',
    'common.filters': 'Filters',
    'common.all': 'All',
    'common.new': 'New',
    'common.view': 'View',
    'common.track': 'Track',
    'common.details': 'Details',
    'common.confirm': 'Confirm',
    'common.ship': 'Ship',
    'common.quote': 'Quote',
    'common.suppliers': 'Suppliers',
    'common.products': 'Products',
    'common.onTimeDelivery': 'On-time Delivery',

    // Seller Nav
    'seller.nav.home': 'Home',
    'seller.nav.listings': 'Listings',
    'seller.nav.rfqs': 'RFQ Inbox',
    'seller.nav.orders': 'Orders',
    'seller.nav.analytics': 'Analytics',
    'seller.nav.workspace': 'Workspace',
    'seller.nav.inventory': 'Inventory',
    'seller.nav.logistics': 'Logistics',
    'seller.nav.tracking': 'Live Tracking',
    'seller.nav.settings': 'Settings',
    'seller.nav.tests': 'Tests',

    // Seller Tests
    'seller.tests.title': 'Tests',
    'seller.tests.subtitle': 'Manage and track your certification tests',
    'seller.tests.testName': 'Test Name',
    'seller.tests.status': 'Status',
    'seller.tests.score': 'Score',
    'seller.tests.duration': 'Duration',
    'seller.tests.date': 'Date',
    'seller.tests.passed': 'Passed',
    'seller.tests.pending': 'Pending',
    'seller.tests.failed': 'Failed',

    // Seller Home
    'seller.home.title': 'Seller Dashboard',
    'seller.home.subtitle': 'Manage your listings, respond to RFQs, and grow your business',
    'seller.home.revenue': 'Revenue (MTD)',
    'seller.home.activeOrders': 'Active Orders',
    'seller.home.rfqsThisMonth': 'RFQs This Month',
    'seller.home.fromLastMonth': 'from last month',
    'seller.home.manageListings': 'Manage Listings',
    'seller.home.viewListings': 'View Listings',
    'seller.home.activeProducts': 'active products in your catalog',
    'seller.home.rfqInbox': 'RFQ Inbox',
    'seller.home.viewRfqs': 'View RFQs',
    'seller.home.newRequests': 'new requests awaiting response',

    // Seller Listings
    'seller.listings.title': 'Listings',
    'seller.listings.subtitle': 'Manage your product catalog',
    'seller.listings.addProduct': 'Add Product',
    'seller.listings.searchPlaceholder': 'Search by SKU, name, or manufacturer...',
    'seller.listings.allCategories': 'All Categories',
    'seller.listings.allStatus': 'All Status',
    'seller.listings.noListings': 'No listings yet',
    'seller.listings.noListingsDesc': 'Add your first product to start receiving quote requests',
    'seller.listings.sku': 'SKU',
    'seller.listings.productName': 'Product Name',
    'seller.listings.manufacturer': 'Manufacturer',
    'seller.listings.category': 'Category',
    'seller.listings.price': 'Price',
    'seller.listings.stock': 'Stock',
    'seller.listings.status': 'Status',
    'seller.listings.active': 'Active',
    'seller.listings.draft': 'Draft',
    'seller.listings.outOfStock': 'Out of Stock',

    // Add Product Panel
    'addProduct.basicInfo': 'Basic Information',
    'addProduct.productName': 'Product Name',
    'addProduct.productNamePlaceholder': 'Enter product name',
    'addProduct.sku': 'SKU',
    'addProduct.skuPlaceholder': 'e.g., SKU-001',
    'addProduct.partNumber': 'Part Number',
    'addProduct.partNumberPlaceholder': 'e.g., PN-12345',
    'addProduct.description': 'Description',
    'addProduct.descriptionPlaceholder': 'Describe your product...',
    'addProduct.pricingInventory': 'Pricing & Inventory',
    'addProduct.price': 'Price',
    'addProduct.stockQuantity': 'Stock Quantity',
    'addProduct.minOrderQty': 'Minimum Order Quantity',
    'addProduct.productDetails': 'Product Details',
    'addProduct.category': 'Category',
    'addProduct.selectCategory': 'Select category',
    'addProduct.manufacturer': 'Manufacturer',
    'addProduct.manufacturerPlaceholder': 'e.g., Siemens',
    'addProduct.brand': 'Brand',
    'addProduct.brandPlaceholder': 'e.g., Industrial Pro',
    'addProduct.specifications': 'Specifications',
    'addProduct.weight': 'Weight',
    'addProduct.dimensions': 'Dimensions (L x W x H)',
    'addProduct.dimensionsPlaceholder': 'e.g., 100 x 50 x 25 cm',
    'addProduct.material': 'Material',
    'addProduct.materialPlaceholder': 'e.g., Stainless Steel',
    'addProduct.productImage': 'Product Image',
    'addProduct.dropImage': 'Drop your image here, or',
    'addProduct.browse': 'browse',
    'addProduct.dragDropUpload': 'Click or drag and drop to upload',
    'addProduct.uploaded': 'Uploaded',
    'addProduct.imageRequirements': 'Image Requirements',
    'addProduct.format': 'Format',
    'addProduct.maxSize': 'Max Size',
    'addProduct.recommended': 'Recommended',
    'addProduct.aspectRatio': 'Aspect Ratio',
    'addProduct.square': '1:1 (Square)',
    'addProduct.imageGuidelines': 'Use a clean, white or neutral background for best results. Product should fill 80% of the frame.',
    'addProduct.saveDraft': 'Save as Draft',
    'addProduct.publish': 'Publish Product',
    // Categories
    'category.machinery': 'Machinery',
    'category.spareParts': 'Spare Parts',
    'category.electronics': 'Electronics',
    'category.hydraulics': 'Hydraulics',
    'category.pneumatics': 'Pneumatics',
    'category.bearings': 'Bearings',
    'category.motors': 'Motors',
    'category.pumps': 'Pumps',
    'category.valves': 'Valves',
    'category.safetyEquipment': 'Safety Equipment',

    // Seller RFQs
    'seller.rfqs.title': 'RFQ Inbox',
    'seller.rfqs.subtitle': 'Respond to quote requests from buyers',
    'seller.rfqs.allRfqs': 'All RFQs',
    'seller.rfqs.noRfqs': 'No RFQs yet',
    'seller.rfqs.noRfqsDesc': 'Incoming quote requests from buyers will appear here',
    'seller.rfqs.rfqNumber': 'RFQ #',
    'seller.rfqs.buyer': 'Buyer',
    'seller.rfqs.partNumber': 'Part Number',
    'seller.rfqs.qty': 'Qty',
    'seller.rfqs.status': 'Status',
    'seller.rfqs.deadline': 'Deadline',
    'seller.rfqs.received': 'Received',
    'seller.rfqs.new': 'New',
    'seller.rfqs.quoted': 'Quoted',
    'seller.rfqs.won': 'Won',
    'seller.rfqs.lost': 'Lost',

    // Seller Orders
    'seller.orders.title': 'Orders',
    'seller.orders.subtitle': 'Manage and fulfill customer orders',
    'seller.orders.noOrders': 'No orders yet',
    'seller.orders.noOrdersDesc': 'Orders from accepted quotes will appear here',
    'seller.orders.orderNumber': 'Order #',
    'seller.orders.buyer': 'Buyer',
    'seller.orders.items': 'Items',
    'seller.orders.total': 'Total',
    'seller.orders.status': 'Status',
    'seller.orders.date': 'Date',
    'seller.orders.pending': 'Pending',
    'seller.orders.confirmed': 'Confirmed',
    'seller.orders.shipped': 'Shipped',
    'seller.orders.delivered': 'Delivered',

    // Seller Analytics
    'seller.analytics.title': 'Analytics',
    'seller.analytics.subtitle': 'Track your performance metrics',
    'seller.analytics.revenue': 'Revenue',
    'seller.analytics.orders': 'Orders',
    'seller.analytics.newBuyers': 'New Buyers',
    'seller.analytics.winRate': 'Win Rate',
    'seller.analytics.vsLastPeriod': 'vs last period',
    'seller.analytics.revenueTrend': 'Revenue Trend',
    'seller.analytics.ordersByCategory': 'Orders by Category',
    'seller.analytics.rfqConversion': 'RFQ Conversion',
    'seller.analytics.topProducts': 'Top Products',
    'seller.analytics.geoDistribution': 'Geographic Distribution',
    'seller.analytics.7days': '7 Days',
    'seller.analytics.30days': '30 Days',
    'seller.analytics.90days': '90 Days',
    'seller.analytics.12months': '12 Months',

    // Seller Workspace
    'seller.workspace.title': 'Workspace',
    'seller.workspace.subtitle': 'Manage your business operations',
    'seller.workspace.dashboard': 'Dashboard',
    'seller.workspace.sales': 'Sales',
    'seller.workspace.customers': 'Customers',
    'seller.workspace.inventory': 'Inventory',
    'seller.workspace.expenses': 'Expenses',
    'seller.workspace.totalRevenue': 'Total Revenue',
    'seller.workspace.totalCustomers': 'Total Customers',
    'seller.workspace.inventoryItems': 'Inventory Items',
    'seller.workspace.monthlyExpenses': 'Monthly Expenses',
    'seller.workspace.salesOverview': 'Sales Overview',
    'seller.workspace.expenseBreakdown': 'Expense Breakdown',

    // Buyer Nav
    'buyer.nav.home': 'Home',
    'buyer.nav.marketplace': 'Marketplace',
    'buyer.nav.requestQuote': 'Request Quote',
    'buyer.nav.myRfqs': 'My RFQs',
    'buyer.nav.orders': 'Orders',
    'buyer.nav.workspace': 'Workspace',
    'buyer.nav.tests': 'Tests',

    // Buyer Tests
    'buyer.tests.title': 'Tests',
    'buyer.tests.subtitle': 'View and track your quality tests',
    'buyer.tests.testName': 'Test Name',
    'buyer.tests.status': 'Status',
    'buyer.tests.score': 'Score',
    'buyer.tests.duration': 'Duration',
    'buyer.tests.date': 'Date',
    'buyer.tests.passed': 'Passed',
    'buyer.tests.pending': 'Pending',
    'buyer.tests.failed': 'Failed',

    // Buyer Home
    'buyer.home.title': 'Industrial Marketplace',
    'buyer.home.subtitle': 'Source parts and equipment from verified suppliers worldwide',
    'buyer.home.searchPlaceholder': 'Search by part number, manufacturer, or keyword...',
    'buyer.home.requestQuote': 'Request Quote',
    'buyer.home.browseCatalog': 'Browse Catalog',
    'buyer.home.viewOrders': 'View Orders',

    // Buyer Marketplace
    'buyer.marketplace.title': 'Marketplace',
    'buyer.marketplace.subtitle': 'Browse parts and equipment from verified suppliers',
    'buyer.marketplace.searchPlaceholder': 'Search by part number, manufacturer...',
    'buyer.marketplace.machinery': 'Machinery',
    'buyer.marketplace.spareParts': 'Spare Parts',
    'buyer.marketplace.electronics': 'Electronics',
    'buyer.marketplace.hydraulics': 'Hydraulics',
    'buyer.marketplace.safetyEquipment': 'Safety Equipment',

    // Buyer Request Quote
    'buyer.rfq.title': 'Request Quote',
    'buyer.rfq.subtitle': 'Get competitive quotes from verified suppliers',
    'buyer.rfq.selectType': 'Select Type',
    'buyer.rfq.partDetails': 'Part Details',
    'buyer.rfq.reviewSubmit': 'Review & Submit',
    'buyer.rfq.whatType': 'What type of RFQ do you need?',
    'buyer.rfq.singlePart': 'Single Part',
    'buyer.rfq.singlePartDesc': 'Request quote for one specific part',
    'buyer.rfq.multipleParts': 'Multiple Parts',
    'buyer.rfq.multiplePartsDesc': 'Request quotes for multiple items',
    'buyer.rfq.enterDetails': 'Enter Part Details',
    'buyer.rfq.partNumber': 'Part Number',
    'buyer.rfq.manufacturer': 'Manufacturer',
    'buyer.rfq.quantity': 'Quantity',
    'buyer.rfq.description': 'Description (Optional)',
    'buyer.rfq.reviewRfq': 'Review Your RFQ',
    'buyer.rfq.willBeSent': 'Your request will be sent to matching suppliers',
    'buyer.rfq.type': 'Type',
    'buyer.rfq.submitRfq': 'Submit RFQ',

    // Buyer My RFQs
    'buyer.myRfqs.title': 'My RFQs',
    'buyer.myRfqs.subtitle': 'Track and manage your quote requests',
    'buyer.myRfqs.newRfq': 'New RFQ',
    'buyer.myRfqs.noRfqs': 'No RFQs yet',
    'buyer.myRfqs.noRfqsDesc': 'Create your first request for quote to get competitive prices from suppliers',
    'buyer.myRfqs.createRfq': 'Create RFQ',
    'buyer.myRfqs.partNumber': 'Part Number',
    'buyer.myRfqs.manufacturer': 'Manufacturer',
    'buyer.myRfqs.qty': 'Qty',
    'buyer.myRfqs.status': 'Status',
    'buyer.myRfqs.quotes': 'Quotes',
    'buyer.myRfqs.created': 'Created',
    'buyer.myRfqs.viewDetails': 'View Details',
    'buyer.myRfqs.pending': 'Pending',
    'buyer.myRfqs.quoted': 'Quoted',
    'buyer.myRfqs.accepted': 'Accepted',
    'buyer.myRfqs.expired': 'Expired',

    // Buyer Orders
    'buyer.orders.title': 'My Orders',
    'buyer.orders.subtitle': 'View and track your purchase orders',
    'buyer.orders.noOrders': 'No orders yet',
    'buyer.orders.noOrdersDesc': 'Your orders will appear here once you accept a quote',
    'buyer.orders.browseMarketplace': 'Browse Marketplace',
    'buyer.orders.orderNumber': 'Order #',
    'buyer.orders.supplier': 'Supplier',
    'buyer.orders.items': 'Items',
    'buyer.orders.total': 'Total',
    'buyer.orders.status': 'Status',
    'buyer.orders.date': 'Date',
    'buyer.orders.processing': 'Processing',
    'buyer.orders.shipped': 'Shipped',
    'buyer.orders.delivered': 'Delivered',
    'buyer.orders.cancelled': 'Cancelled',

    // Buyer Tracking
    'buyer.tracking.title': 'Order Tracking',
    'buyer.tracking.subtitle': 'Track your shipments in real-time',
    'buyer.tracking.enterTracking': 'Enter Tracking Number',
    'buyer.tracking.trackingPlaceholder': 'e.g., NABD-2024-001234',
    'buyer.tracking.orderStatus': 'Order Status',
    'buyer.tracking.tracking': 'Tracking',
    'buyer.tracking.inTransit': 'In Transit',
    'buyer.tracking.orderConfirmed': 'Order Confirmed',
    'buyer.tracking.orderConfirmedDesc': 'Your order has been confirmed',
    'buyer.tracking.shipped': 'Shipped',
    'buyer.tracking.shippedDesc': 'Package picked up by carrier',
    'buyer.tracking.inTransitDesc': 'Package is on its way',
    'buyer.tracking.outForDelivery': 'Out for Delivery',
    'buyer.tracking.outForDeliveryDesc': 'Package will be delivered today',
    'buyer.tracking.delivered': 'Delivered',
    'buyer.tracking.deliveredDesc': 'Package delivered',
    'buyer.tracking.estimated': 'Estimated',

    // Buyer Workspace
    'buyer.workspace.title': 'Workspace',
    'buyer.workspace.subtitle': 'Manage your purchasing operations',
    'buyer.workspace.dashboard': 'Dashboard',
    'buyer.workspace.purchases': 'Purchases',
    'buyer.workspace.suppliers': 'Suppliers',
    'buyer.workspace.inventory': 'Inventory',
    'buyer.workspace.expenses': 'Expenses',
    'buyer.workspace.totalSpend': 'Total Spend',
    'buyer.workspace.activeOrders': 'Active Orders',
    'buyer.workspace.pendingRfqs': 'Pending RFQs',
    'buyer.workspace.suppliersCount': 'Suppliers',
    'buyer.workspace.spendingOverview': 'Spending Overview',
  },
  ar: {
    // Common
    'common.signOut': 'تسجيل الخروج',
    'common.seller': 'بائع',
    'common.buyer': 'مشتري',
    'common.search': 'بحث',
    'common.viewAll': 'عرض الكل',
    'common.submit': 'إرسال',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.edit': 'تعديل',
    'common.delete': 'حذف',
    'common.loading': 'جاري التحميل...',
    'common.noData': 'لا توجد بيانات',
    'common.back': 'رجوع',
    'common.continue': 'متابعة',
    'common.filters': 'تصفية',
    'common.all': 'الكل',
    'common.new': 'جديد',
    'common.view': 'عرض',
    'common.track': 'تتبع',
    'common.details': 'التفاصيل',
    'common.confirm': 'تأكيد',
    'common.ship': 'شحن',
    'common.quote': 'تسعير',
    'common.suppliers': 'الموردين',
    'common.products': 'المنتجات',
    'common.onTimeDelivery': 'التوصيل في الوقت',

    // Seller Nav
    'seller.nav.home': 'الرئيسية',
    'seller.nav.listings': 'المنتجات',
    'seller.nav.rfqs': 'طلبات الأسعار',
    'seller.nav.orders': 'الطلبات',
    'seller.nav.analytics': 'التحليلات',
    'seller.nav.workspace': 'مساحة العمل',
    'seller.nav.inventory': 'المخزون',
    'seller.nav.logistics': 'اللوجستيات',
    'seller.nav.tracking': 'التتبع المباشر',
    'seller.nav.settings': 'الإعدادات',
    'seller.nav.tests': 'الاختبارات',

    // Seller Tests
    'seller.tests.title': 'الاختبارات',
    'seller.tests.subtitle': 'إدارة وتتبع اختبارات الشهادات',
    'seller.tests.testName': 'اسم الاختبار',
    'seller.tests.status': 'الحالة',
    'seller.tests.score': 'الدرجة',
    'seller.tests.duration': 'المدة',
    'seller.tests.date': 'التاريخ',
    'seller.tests.passed': 'ناجح',
    'seller.tests.pending': 'قيد الانتظار',
    'seller.tests.failed': 'راسب',

    // Seller Home
    'seller.home.title': 'لوحة تحكم البائع',
    'seller.home.subtitle': 'إدارة منتجاتك، والرد على طلبات الأسعار، وتنمية أعمالك',
    'seller.home.revenue': 'الإيرادات (هذا الشهر)',
    'seller.home.activeOrders': 'الطلبات النشطة',
    'seller.home.rfqsThisMonth': 'طلبات الأسعار هذا الشهر',
    'seller.home.fromLastMonth': 'من الشهر الماضي',
    'seller.home.manageListings': 'إدارة المنتجات',
    'seller.home.viewListings': 'عرض المنتجات',
    'seller.home.activeProducts': 'منتج نشط في الكتالوج',
    'seller.home.rfqInbox': 'صندوق طلبات الأسعار',
    'seller.home.viewRfqs': 'عرض الطلبات',
    'seller.home.newRequests': 'طلبات جديدة بانتظار الرد',

    // Seller Listings
    'seller.listings.title': 'المنتجات',
    'seller.listings.subtitle': 'إدارة كتالوج المنتجات',
    'seller.listings.addProduct': 'إضافة منتج',
    'seller.listings.searchPlaceholder': 'البحث برمز المنتج أو الاسم أو الشركة المصنعة...',
    'seller.listings.allCategories': 'جميع الفئات',
    'seller.listings.allStatus': 'جميع الحالات',
    'seller.listings.noListings': 'لا توجد منتجات بعد',
    'seller.listings.noListingsDesc': 'أضف أول منتج لبدء استقبال طلبات الأسعار',
    'seller.listings.sku': 'رمز المنتج',
    'seller.listings.productName': 'اسم المنتج',
    'seller.listings.manufacturer': 'الشركة المصنعة',
    'seller.listings.category': 'الفئة',
    'seller.listings.price': 'السعر',
    'seller.listings.stock': 'المخزون',
    'seller.listings.status': 'الحالة',
    'seller.listings.active': 'نشط',
    'seller.listings.draft': 'مسودة',
    'seller.listings.outOfStock': 'نفذ المخزون',

    // Add Product Panel
    'addProduct.basicInfo': 'المعلومات الأساسية',
    'addProduct.productName': 'اسم المنتج',
    'addProduct.productNamePlaceholder': 'أدخل اسم المنتج',
    'addProduct.sku': 'رمز المنتج',
    'addProduct.skuPlaceholder': 'مثال: SKU-001',
    'addProduct.partNumber': 'رقم القطعة',
    'addProduct.partNumberPlaceholder': 'مثال: PN-12345',
    'addProduct.description': 'الوصف',
    'addProduct.descriptionPlaceholder': 'صف منتجك...',
    'addProduct.pricingInventory': 'التسعير والمخزون',
    'addProduct.price': 'السعر',
    'addProduct.stockQuantity': 'كمية المخزون',
    'addProduct.minOrderQty': 'الحد الأدنى للطلب',
    'addProduct.productDetails': 'تفاصيل المنتج',
    'addProduct.category': 'الفئة',
    'addProduct.selectCategory': 'اختر الفئة',
    'addProduct.manufacturer': 'الشركة المصنعة',
    'addProduct.manufacturerPlaceholder': 'مثال: سيمنز',
    'addProduct.brand': 'العلامة التجارية',
    'addProduct.brandPlaceholder': 'مثال: Industrial Pro',
    'addProduct.specifications': 'المواصفات',
    'addProduct.weight': 'الوزن',
    'addProduct.dimensions': 'الأبعاد (الطول × العرض × الارتفاع)',
    'addProduct.dimensionsPlaceholder': 'مثال: 100 × 50 × 25 سم',
    'addProduct.material': 'المادة',
    'addProduct.materialPlaceholder': 'مثال: فولاذ مقاوم للصدأ',
    'addProduct.productImage': 'صورة المنتج',
    'addProduct.dropImage': 'أفلت صورتك هنا، أو',
    'addProduct.browse': 'تصفح',
    'addProduct.dragDropUpload': 'انقر أو اسحب وأفلت للرفع',
    'addProduct.uploaded': 'تم الرفع',
    'addProduct.imageRequirements': 'متطلبات الصورة',
    'addProduct.format': 'الصيغة',
    'addProduct.maxSize': 'الحجم الأقصى',
    'addProduct.recommended': 'الموصى به',
    'addProduct.aspectRatio': 'نسبة العرض للارتفاع',
    'addProduct.square': '1:1 (مربع)',
    'addProduct.imageGuidelines': 'استخدم خلفية نظيفة، بيضاء أو محايدة للحصول على أفضل النتائج. يجب أن يملأ المنتج 80% من الإطار.',
    'addProduct.saveDraft': 'حفظ كمسودة',
    'addProduct.publish': 'نشر المنتج',
    // Categories
    'category.machinery': 'الآلات',
    'category.spareParts': 'قطع الغيار',
    'category.electronics': 'الإلكترونيات',
    'category.hydraulics': 'الهيدروليك',
    'category.pneumatics': 'الهوائيات',
    'category.bearings': 'المحامل',
    'category.motors': 'المحركات',
    'category.pumps': 'المضخات',
    'category.valves': 'الصمامات',
    'category.safetyEquipment': 'معدات السلامة',

    // Seller RFQs
    'seller.rfqs.title': 'صندوق طلبات الأسعار',
    'seller.rfqs.subtitle': 'الرد على طلبات الأسعار من المشترين',
    'seller.rfqs.allRfqs': 'جميع الطلبات',
    'seller.rfqs.noRfqs': 'لا توجد طلبات بعد',
    'seller.rfqs.noRfqsDesc': 'ستظهر طلبات الأسعار الواردة من المشترين هنا',
    'seller.rfqs.rfqNumber': 'رقم الطلب',
    'seller.rfqs.buyer': 'المشتري',
    'seller.rfqs.partNumber': 'رقم القطعة',
    'seller.rfqs.qty': 'الكمية',
    'seller.rfqs.status': 'الحالة',
    'seller.rfqs.deadline': 'الموعد النهائي',
    'seller.rfqs.received': 'تاريخ الاستلام',
    'seller.rfqs.new': 'جديد',
    'seller.rfqs.quoted': 'تم التسعير',
    'seller.rfqs.won': 'فاز',
    'seller.rfqs.lost': 'خسر',

    // Seller Orders
    'seller.orders.title': 'الطلبات',
    'seller.orders.subtitle': 'إدارة وتنفيذ طلبات العملاء',
    'seller.orders.noOrders': 'لا توجد طلبات بعد',
    'seller.orders.noOrdersDesc': 'ستظهر الطلبات من عروض الأسعار المقبولة هنا',
    'seller.orders.orderNumber': 'رقم الطلب',
    'seller.orders.buyer': 'المشتري',
    'seller.orders.items': 'المنتجات',
    'seller.orders.total': 'الإجمالي',
    'seller.orders.status': 'الحالة',
    'seller.orders.date': 'التاريخ',
    'seller.orders.pending': 'قيد الانتظار',
    'seller.orders.confirmed': 'مؤكد',
    'seller.orders.shipped': 'تم الشحن',
    'seller.orders.delivered': 'تم التوصيل',

    // Seller Analytics
    'seller.analytics.title': 'التحليلات',
    'seller.analytics.subtitle': 'تتبع مؤشرات أدائك',
    'seller.analytics.revenue': 'الإيرادات',
    'seller.analytics.orders': 'الطلبات',
    'seller.analytics.newBuyers': 'مشترين جدد',
    'seller.analytics.winRate': 'معدل الفوز',
    'seller.analytics.vsLastPeriod': 'مقارنة بالفترة السابقة',
    'seller.analytics.revenueTrend': 'اتجاه الإيرادات',
    'seller.analytics.ordersByCategory': 'الطلبات حسب الفئة',
    'seller.analytics.rfqConversion': 'معدل تحويل الطلبات',
    'seller.analytics.topProducts': 'أفضل المنتجات',
    'seller.analytics.geoDistribution': 'التوزيع الجغرافي',
    'seller.analytics.7days': '٧ أيام',
    'seller.analytics.30days': '٣٠ يوم',
    'seller.analytics.90days': '٩٠ يوم',
    'seller.analytics.12months': '١٢ شهر',

    // Seller Workspace
    'seller.workspace.title': 'مساحة العمل',
    'seller.workspace.subtitle': 'إدارة عمليات أعمالك',
    'seller.workspace.dashboard': 'لوحة التحكم',
    'seller.workspace.sales': 'المبيعات',
    'seller.workspace.customers': 'العملاء',
    'seller.workspace.inventory': 'المخزون',
    'seller.workspace.expenses': 'المصروفات',
    'seller.workspace.totalRevenue': 'إجمالي الإيرادات',
    'seller.workspace.totalCustomers': 'إجمالي العملاء',
    'seller.workspace.inventoryItems': 'عناصر المخزون',
    'seller.workspace.monthlyExpenses': 'المصروفات الشهرية',
    'seller.workspace.salesOverview': 'نظرة عامة على المبيعات',
    'seller.workspace.expenseBreakdown': 'تفاصيل المصروفات',

    // Buyer Nav
    'buyer.nav.home': 'الرئيسية',
    'buyer.nav.marketplace': 'السوق',
    'buyer.nav.requestQuote': 'طلب سعر',
    'buyer.nav.myRfqs': 'طلباتي',
    'buyer.nav.orders': 'الطلبات',
    'buyer.nav.workspace': 'مساحة العمل',
    'buyer.nav.tests': 'الاختبارات',

    // Buyer Tests
    'buyer.tests.title': 'الاختبارات',
    'buyer.tests.subtitle': 'عرض وتتبع اختبارات الجودة',
    'buyer.tests.testName': 'اسم الاختبار',
    'buyer.tests.status': 'الحالة',
    'buyer.tests.score': 'الدرجة',
    'buyer.tests.duration': 'المدة',
    'buyer.tests.date': 'التاريخ',
    'buyer.tests.passed': 'ناجح',
    'buyer.tests.pending': 'قيد الانتظار',
    'buyer.tests.failed': 'راسب',

    // Buyer Home
    'buyer.home.title': 'السوق الصناعي',
    'buyer.home.subtitle': 'احصل على قطع الغيار والمعدات من موردين موثوقين حول العالم',
    'buyer.home.searchPlaceholder': 'البحث برقم القطعة أو الشركة المصنعة أو كلمة مفتاحية...',
    'buyer.home.requestQuote': 'طلب سعر',
    'buyer.home.browseCatalog': 'تصفح الكتالوج',
    'buyer.home.viewOrders': 'عرض الطلبات',

    // Buyer Marketplace
    'buyer.marketplace.title': 'السوق',
    'buyer.marketplace.subtitle': 'تصفح قطع الغيار والمعدات من موردين موثوقين',
    'buyer.marketplace.searchPlaceholder': 'البحث برقم القطعة أو الشركة المصنعة...',
    'buyer.marketplace.machinery': 'الآلات',
    'buyer.marketplace.spareParts': 'قطع الغيار',
    'buyer.marketplace.electronics': 'الإلكترونيات',
    'buyer.marketplace.hydraulics': 'الهيدروليك',
    'buyer.marketplace.safetyEquipment': 'معدات السلامة',

    // Buyer Request Quote
    'buyer.rfq.title': 'طلب سعر',
    'buyer.rfq.subtitle': 'احصل على أسعار تنافسية من موردين موثوقين',
    'buyer.rfq.selectType': 'اختر النوع',
    'buyer.rfq.partDetails': 'تفاصيل القطعة',
    'buyer.rfq.reviewSubmit': 'مراجعة وإرسال',
    'buyer.rfq.whatType': 'ما نوع طلب السعر الذي تحتاجه؟',
    'buyer.rfq.singlePart': 'قطعة واحدة',
    'buyer.rfq.singlePartDesc': 'طلب سعر لقطعة واحدة محددة',
    'buyer.rfq.multipleParts': 'قطع متعددة',
    'buyer.rfq.multiplePartsDesc': 'طلب أسعار لعدة قطع',
    'buyer.rfq.enterDetails': 'أدخل تفاصيل القطعة',
    'buyer.rfq.partNumber': 'رقم القطعة',
    'buyer.rfq.manufacturer': 'الشركة المصنعة',
    'buyer.rfq.quantity': 'الكمية',
    'buyer.rfq.description': 'الوصف (اختياري)',
    'buyer.rfq.reviewRfq': 'مراجعة طلبك',
    'buyer.rfq.willBeSent': 'سيتم إرسال طلبك إلى الموردين المطابقين',
    'buyer.rfq.type': 'النوع',
    'buyer.rfq.submitRfq': 'إرسال الطلب',

    // Buyer My RFQs
    'buyer.myRfqs.title': 'طلباتي',
    'buyer.myRfqs.subtitle': 'تتبع وإدارة طلبات الأسعار',
    'buyer.myRfqs.newRfq': 'طلب جديد',
    'buyer.myRfqs.noRfqs': 'لا توجد طلبات بعد',
    'buyer.myRfqs.noRfqsDesc': 'أنشئ أول طلب سعر للحصول على أسعار تنافسية من الموردين',
    'buyer.myRfqs.createRfq': 'إنشاء طلب',
    'buyer.myRfqs.partNumber': 'رقم القطعة',
    'buyer.myRfqs.manufacturer': 'الشركة المصنعة',
    'buyer.myRfqs.qty': 'الكمية',
    'buyer.myRfqs.status': 'الحالة',
    'buyer.myRfqs.quotes': 'العروض',
    'buyer.myRfqs.created': 'تاريخ الإنشاء',
    'buyer.myRfqs.viewDetails': 'عرض التفاصيل',
    'buyer.myRfqs.pending': 'قيد الانتظار',
    'buyer.myRfqs.quoted': 'تم التسعير',
    'buyer.myRfqs.accepted': 'مقبول',
    'buyer.myRfqs.expired': 'منتهي',

    // Buyer Orders
    'buyer.orders.title': 'طلباتي',
    'buyer.orders.subtitle': 'عرض وتتبع طلبات الشراء',
    'buyer.orders.noOrders': 'لا توجد طلبات بعد',
    'buyer.orders.noOrdersDesc': 'ستظهر طلباتك هنا بعد قبول عرض سعر',
    'buyer.orders.browseMarketplace': 'تصفح السوق',
    'buyer.orders.orderNumber': 'رقم الطلب',
    'buyer.orders.supplier': 'المورد',
    'buyer.orders.items': 'المنتجات',
    'buyer.orders.total': 'الإجمالي',
    'buyer.orders.status': 'الحالة',
    'buyer.orders.date': 'التاريخ',
    'buyer.orders.processing': 'قيد المعالجة',
    'buyer.orders.shipped': 'تم الشحن',
    'buyer.orders.delivered': 'تم التوصيل',
    'buyer.orders.cancelled': 'ملغي',

    // Buyer Tracking
    'buyer.tracking.title': 'تتبع الطلب',
    'buyer.tracking.subtitle': 'تتبع شحناتك في الوقت الفعلي',
    'buyer.tracking.enterTracking': 'أدخل رقم التتبع',
    'buyer.tracking.trackingPlaceholder': 'مثال: NABD-2024-001234',
    'buyer.tracking.orderStatus': 'حالة الطلب',
    'buyer.tracking.tracking': 'التتبع',
    'buyer.tracking.inTransit': 'في الطريق',
    'buyer.tracking.orderConfirmed': 'تم تأكيد الطلب',
    'buyer.tracking.orderConfirmedDesc': 'تم تأكيد طلبك',
    'buyer.tracking.shipped': 'تم الشحن',
    'buyer.tracking.shippedDesc': 'تم استلام الشحنة من الناقل',
    'buyer.tracking.inTransitDesc': 'الشحنة في الطريق',
    'buyer.tracking.outForDelivery': 'جاري التوصيل',
    'buyer.tracking.outForDeliveryDesc': 'سيتم توصيل الشحنة اليوم',
    'buyer.tracking.delivered': 'تم التوصيل',
    'buyer.tracking.deliveredDesc': 'تم توصيل الشحنة',
    'buyer.tracking.estimated': 'المتوقع',

    // Buyer Workspace
    'buyer.workspace.title': 'مساحة العمل',
    'buyer.workspace.subtitle': 'إدارة عمليات الشراء',
    'buyer.workspace.dashboard': 'لوحة التحكم',
    'buyer.workspace.purchases': 'المشتريات',
    'buyer.workspace.suppliers': 'الموردين',
    'buyer.workspace.inventory': 'المخزون',
    'buyer.workspace.expenses': 'المصروفات',
    'buyer.workspace.totalSpend': 'إجمالي الإنفاق',
    'buyer.workspace.activeOrders': 'الطلبات النشطة',
    'buyer.workspace.pendingRfqs': 'طلبات الأسعار المعلقة',
    'buyer.workspace.suppliersCount': 'الموردين',
    'buyer.workspace.spendingOverview': 'نظرة عامة على الإنفاق',
  },
};

interface PortalProviderProps {
  children: ReactNode;
}

export const PortalProvider: React.FC<PortalProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('portal-language');
    return (saved as Language) || 'en';
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('portal-theme');
    return (saved as Theme) || 'light';
  });

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('portal-language', lang);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('portal-theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  // Compute styles based on theme and language using smart theme getter
  const styles: ThemeStyles = useMemo(() => {
    return getThemeStyles(theme, language);
  }, [theme, language]);

  // Apply direction and theme to document
  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [direction, language, theme]);

  return (
    <PortalContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        toggleTheme,
        direction,
        t,
        styles,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
};

export const usePortal = (): PortalContextType => {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
};

export default PortalContext;
