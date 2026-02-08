import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  X,
  Plus,
  Trash,
  FilePdf,
  FileXls,
  Upload,
  ClipboardText,
  Trophy,
  Scales,
  Sliders,
  FloppyDisk,
  FolderOpen,
  Star,
  Lightbulb,
  CaretDown,
  CaretUp,
  Info,
  CheckCircle,
  WarningCircle,
} from 'phosphor-react';
import { usePortal } from '../context/PortalContext';
import {
  exportManualCompareToPDF,
  exportManualCompareToExcel,
  parseCSVToCompare,
  getSampleCSVTemplate,
  ManualCompareColumn,
  ManualCompareRow,
} from '../services/comparisonExportService';
import { scoreManualCompare, ScoringWeights, DEFAULT_WEIGHTS, WEIGHT_PRESETS } from '../services/compareScoringService';
import {
  saveComparisonSet,
  getComparisonSets,
  deleteComparisonSet,
  toggleFavorite,
  SavedComparisonSet,
} from '../services/comparisonSetService';

interface ManualCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'manual' | 'import' | 'saved';
}

// Translations for Manual Compare drawer
const drawerTranslations = {
  en: {
    title: 'Manual Compare',
    subtitle: 'Compare any products or options side by side',
    tabs: {
      manual: 'Manual Entry',
      import: 'Import Data',
      saved: 'Saved',
    },
    scoringWeights: 'Scoring Weights',
    quickPresets: 'Quick Presets',
    custom: 'Custom',
    saveComparison: 'Save Comparison',
    recommended: 'Recommended',
    score: 'Score',
    highConfidence: 'High confidence',
    mediumConfidence: 'Medium confidence',
    lowConfidenceAddData: 'Low confidence - add more data',
    whyThisQuote: 'Why this quote?',
    keyStrengths: 'Key Strengths',
    tradeOffsToConsider: 'Trade-offs to Consider',
    highConfidenceDesc: 'Analysis based on multiple comparable data points. High confidence in recommendation.',
    mediumConfidenceDesc: 'Limited data points available. Consider adding more metrics for better analysis.',
    lowConfidenceDesc: 'Insufficient data for reliable comparison. Add more values to improve accuracy.',
    metric: 'Metric',
    add: 'Add',
    addRow: 'Add Row',
    newMetric: 'New Metric',
    pasteCSV: 'Paste CSV Data',
    csvPlaceholder: 'Metric,Option A,Option B,Option C\nPrice,$100,$120,$95\nLead Time,5 days,3 days,7 days',
    importAndCompare: 'Import & Compare',
    loadSample: 'Load Sample',
    csvFormatGuide: 'CSV Format Guide',
    csvGuide1: 'First row should be headers: Metric, Option A, Option B, ...',
    csvGuide2: 'First column is the metric name (Price, Lead Time, etc.)',
    csvGuide3: 'Maximum 4 columns supported (excluding metric column)',
    csvGuide4: 'Use quotes for values containing commas',
    noSavedYet: 'No saved comparisons yet',
    noSavedDesc: 'Create a comparison and save it to access it later',
    saveComparisonSet: 'Save Comparison Set',
    enterName: 'Enter a name for this comparison...',
    cancel: 'Cancel',
    save: 'Save',
    deleteConfirm: 'Delete this comparison set?',
    options: 'options',
    metrics: 'metrics',
    pdf: 'PDF',
    excel: 'Excel',
    done: 'Done',
    best: 'Best',
    // Default metrics
    price: 'Price',
    leadTime: 'Lead Time',
    quality: 'Quality',
    moq: 'MOQ',
    warranty: 'Warranty',
    optionA: 'Option A',
    optionB: 'Option B',
  },
  ar: {
    title: 'المقارنة اليدوية',
    subtitle: 'قارن أي منتجات أو خيارات جنبًا إلى جنب',
    tabs: {
      manual: 'إدخال يدوي',
      import: 'استيراد بيانات',
      saved: 'المحفوظات',
    },
    scoringWeights: 'أوزان التقييم',
    quickPresets: 'إعدادات سريعة',
    custom: 'مخصص',
    saveComparison: 'حفظ المقارنة',
    recommended: 'مُوصى به',
    score: 'النتيجة',
    highConfidence: 'ثقة عالية',
    mediumConfidence: 'ثقة متوسطة',
    lowConfidenceAddData: 'ثقة منخفضة - أضف المزيد من البيانات',
    whyThisQuote: 'لماذا هذا العرض؟',
    keyStrengths: 'نقاط القوة الرئيسية',
    tradeOffsToConsider: 'المقايضات للنظر فيها',
    highConfidenceDesc: 'تحليل بناءً على نقاط بيانات متعددة قابلة للمقارنة. ثقة عالية في التوصية.',
    mediumConfidenceDesc: 'نقاط بيانات محدودة متاحة. فكر في إضافة المزيد من المقاييس لتحليل أفضل.',
    lowConfidenceDesc: 'بيانات غير كافية لمقارنة موثوقة. أضف المزيد من القيم لتحسين الدقة.',
    metric: 'المعيار',
    add: 'إضافة',
    addRow: 'إضافة صف',
    newMetric: 'معيار جديد',
    pasteCSV: 'لصق بيانات CSV',
    csvPlaceholder:
      'المعيار,الخيار أ,الخيار ب,الخيار ج\nالسعر,100 ر.س,120 ر.س,95 ر.س\nوقت التسليم,5 أيام,3 أيام,7 أيام',
    importAndCompare: 'استيراد ومقارنة',
    loadSample: 'تحميل نموذج',
    csvFormatGuide: 'دليل تنسيق CSV',
    csvGuide1: 'الصف الأول يجب أن يكون رؤوس: المعيار، الخيار أ، الخيار ب، ...',
    csvGuide2: 'العمود الأول هو اسم المعيار (السعر، وقت التسليم، إلخ)',
    csvGuide3: 'الحد الأقصى 4 أعمدة مدعومة (باستثناء عمود المعيار)',
    csvGuide4: 'استخدم علامات الاقتباس للقيم التي تحتوي على فواصل',
    noSavedYet: 'لا توجد مقارنات محفوظة بعد',
    noSavedDesc: 'أنشئ مقارنة واحفظها للوصول إليها لاحقًا',
    saveComparisonSet: 'حفظ مجموعة المقارنة',
    enterName: 'أدخل اسمًا لهذه المقارنة...',
    cancel: 'إلغاء',
    save: 'حفظ',
    deleteConfirm: 'حذف مجموعة المقارنة هذه؟',
    options: 'خيارات',
    metrics: 'معايير',
    pdf: 'PDF',
    excel: 'Excel',
    done: 'تم',
    best: 'الأفضل',
    // Default metrics
    price: 'السعر',
    leadTime: 'وقت التسليم',
    quality: 'الجودة',
    moq: 'الحد الأدنى للطلب',
    warranty: 'الضمان',
    optionA: 'الخيار أ',
    optionB: 'الخيار ب',
  },
};

export const ManualCompareModal: React.FC<ManualCompareModalProps> = ({ isOpen, onClose, defaultTab = 'manual' }) => {
  const { styles, language, direction } = usePortal();
  const isRtl = direction === 'rtl';
  const t = drawerTranslations[language] || drawerTranslations.en;

  const [activeTab, setActiveTab] = useState<'manual' | 'import' | 'saved'>(
    defaultTab as 'manual' | 'import' | 'saved',
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Handle open/close animations (smooth two-phase like AddProductPanel)
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Double requestAnimationFrame for smooth animation start
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Manual compare state
  const [manualColumns, setManualColumns] = useState<ManualCompareColumn[]>([
    { id: 'col-1', name: t.optionA },
    { id: 'col-2', name: t.optionB },
  ]);
  const [manualRows, setManualRows] = useState<ManualCompareRow[]>([
    { id: 'row-1', metric: t.price, values: {} },
    { id: 'row-2', metric: t.leadTime, values: {} },
    { id: 'row-3', metric: t.quality, values: {} },
    { id: 'row-4', metric: t.moq, values: {} },
    { id: 'row-5', metric: t.warranty, values: {} },
  ]);

  // Import state
  const [importText, setImportText] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // Weight customization state
  const [showWeightPanel, setShowWeightPanel] = useState(false);
  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);
  const [selectedPreset, setSelectedPreset] = useState<string>('balanced');

  // Save/Load state
  const [savedSets, setSavedSets] = useState<SavedComparisonSet[]>([]);
  const [saveName, setSaveName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [loadedSetId, setLoadedSetId] = useState<string | null>(null);

  // Reasoning panel state
  const [showReasoning, setShowReasoning] = useState(false);

  // Load saved sets on mount
  useEffect(() => {
    if (isOpen) {
      setSavedSets(getComparisonSets({ sortBy: 'updatedAt', sortOrder: 'desc' }));
    }
  }, [isOpen, activeTab]);

  // Calculate manual compare scores
  const manualScores = useMemo(() => {
    return scoreManualCompare({ columns: manualColumns, rows: manualRows });
  }, [manualColumns, manualRows]);

  // Generate reasoning for best pick
  const bestPickReasoning = useMemo(() => {
    if (!manualScores.bestColumnId) return null;

    const bestCol = manualColumns.find((c) => c.id === manualScores.bestColumnId);
    const reasons: string[] = [];
    const tradeOffs: { description: string; severity: 'minor' | 'moderate' | 'significant' }[] = [];

    manualRows.forEach((row) => {
      const values: { colId: string; value: number }[] = [];
      manualColumns.forEach((col) => {
        const rawValue = row.values[col.id] || '';
        const numValue = parseFloat(rawValue.replace(/[^0-9.-]/g, ''));
        if (!isNaN(numValue)) {
          values.push({ colId: col.id, value: numValue });
        }
      });

      if (values.length >= 2 && manualScores.bestColumnId) {
        const metricLower = row.metric.toLowerCase();
        const isLowerBetter =
          metricLower.includes('price') ||
          metricLower.includes('cost') ||
          metricLower.includes('lead') ||
          metricLower.includes('time') ||
          metricLower.includes('moq') ||
          metricLower.includes('minimum') ||
          metricLower.includes('سعر') ||
          metricLower.includes('وقت') ||
          metricLower.includes('حد');

        const bestVal = isLowerBetter
          ? Math.min(...values.map((v) => v.value))
          : Math.max(...values.map((v) => v.value));

        const bestValue = values.find((v) => v.colId === manualScores.bestColumnId);
        if (bestValue && bestValue.value === bestVal) {
          reasons.push(`${language === 'ar' ? 'أفضل' : 'Best'} ${row.metric.toLowerCase()}`);
        } else if (bestValue) {
          const diff = isLowerBetter
            ? ((bestValue.value - bestVal) / bestVal) * 100
            : ((bestVal - bestValue.value) / bestVal) * 100;

          if (diff > 20) {
            tradeOffs.push({
              description: `${row.metric} ${language === 'ar' ? 'أعلى بنسبة' : 'is'} ${Math.round(diff)}% ${isLowerBetter ? (language === 'ar' ? 'أعلى' : 'higher') : language === 'ar' ? 'أقل' : 'lower'} ${language === 'ar' ? 'من الأفضل' : 'than best'}`,
              severity: diff > 50 ? 'significant' : diff > 30 ? 'moderate' : 'minor',
            });
          }
        }
      }
    });

    return {
      name: bestCol?.name || 'Unknown',
      reasons: reasons.slice(0, 4),
      tradeOffs,
      confidence: reasons.length >= 2 ? 'high' : reasons.length >= 1 ? 'medium' : 'low',
    };
  }, [manualScores, manualColumns, manualRows, language]);

  // Manual compare handlers
  const addColumn = useCallback(() => {
    if (manualColumns.length >= 4) return;
    const newId = `col-${Date.now()}`;
    const letters = ['أ', 'ب', 'ج', 'د'];
    const letterIndex = manualColumns.length;
    const optionName =
      language === 'ar'
        ? `الخيار ${letters[letterIndex] || letterIndex + 1}`
        : `Option ${String.fromCharCode(65 + manualColumns.length)}`;
    setManualColumns([...manualColumns, { id: newId, name: optionName }]);
  }, [manualColumns, language]);

  const removeColumn = useCallback(
    (colId: string) => {
      if (manualColumns.length <= 2) return;
      setManualColumns(manualColumns.filter((c) => c.id !== colId));
      setManualRows(
        manualRows.map((row) => {
          const newValues = { ...row.values };
          delete newValues[colId];
          return { ...row, values: newValues };
        }),
      );
    },
    [manualColumns, manualRows],
  );

  const updateColumnName = useCallback(
    (colId: string, name: string) => {
      setManualColumns(manualColumns.map((c) => (c.id === colId ? { ...c, name } : c)));
    },
    [manualColumns],
  );

  const addRow = useCallback(() => {
    const newId = `row-${Date.now()}`;
    setManualRows([...manualRows, { id: newId, metric: t.newMetric, values: {} }]);
  }, [manualRows, t]);

  const removeRow = useCallback(
    (rowId: string) => {
      if (manualRows.length <= 1) return;
      setManualRows(manualRows.filter((r) => r.id !== rowId));
    },
    [manualRows],
  );

  const updateRowMetric = useCallback(
    (rowId: string, metric: string) => {
      setManualRows(manualRows.map((r) => (r.id === rowId ? { ...r, metric } : r)));
    },
    [manualRows],
  );

  const updateCellValue = useCallback(
    (rowId: string, colId: string, value: string) => {
      setManualRows(
        manualRows.map((r) => {
          if (r.id !== rowId) return r;
          return { ...r, values: { ...r.values, [colId]: value } };
        }),
      );
    },
    [manualRows],
  );

  // Import handlers
  const handleImport = useCallback(() => {
    const result = parseCSVToCompare(importText);
    setImportErrors(result.errors);
    if (result.columns.length > 0 && result.rows.length > 0) {
      setManualColumns(result.columns);
      setManualRows(result.rows);
      setActiveTab('manual');
      setImportText('');
      setLoadedSetId(null);
    }
  }, [importText]);

  const loadSampleTemplate = useCallback(() => {
    setImportText(getSampleCSVTemplate());
  }, []);

  // Weight preset handler
  const handlePresetChange = useCallback((presetKey: string) => {
    setSelectedPreset(presetKey);
    const preset = WEIGHT_PRESETS[presetKey];
    if (preset) {
      setWeights(preset.weights);
    }
  }, []);

  // Individual weight handler
  const handleWeightChange = useCallback((factor: keyof ScoringWeights, value: number) => {
    setSelectedPreset('custom');
    setWeights((prev) => ({ ...prev, [factor]: value }));
  }, []);

  // Save comparison set handler
  const handleSaveSet = useCallback(() => {
    if (!saveName.trim()) return;

    const saved = saveComparisonSet({
      name: saveName.trim(),
      columns: manualColumns,
      rows: manualRows,
      weights,
      presetUsed: selectedPreset,
      source: 'manual',
      bestPickColumnId: manualScores.bestColumnId,
      resultSnapshot: {
        columnScores: manualScores.columnScores,
        calculatedAt: new Date().toISOString(),
      },
    });

    if (saved) {
      setSavedSets(getComparisonSets({ sortBy: 'updatedAt', sortOrder: 'desc' }));
      setLoadedSetId(saved.id);
      setShowSaveDialog(false);
      setSaveName('');
    }
  }, [saveName, manualColumns, manualRows, weights, selectedPreset, manualScores]);

  // Load comparison set handler
  const handleLoadSet = useCallback((set: SavedComparisonSet) => {
    setManualColumns(set.columns);
    setManualRows(set.rows);
    setWeights(set.weights);
    setSelectedPreset(set.presetUsed || 'custom');
    setLoadedSetId(set.id);
    setActiveTab('manual');
  }, []);

  // Delete comparison set handler
  const handleDeleteSet = useCallback(
    (id: string) => {
      if (deleteComparisonSet(id)) {
        setSavedSets(getComparisonSets({ sortBy: 'updatedAt', sortOrder: 'desc' }));
        if (loadedSetId === id) {
          setLoadedSetId(null);
        }
      }
    },
    [loadedSetId],
  );

  // Toggle favorite handler
  const handleToggleFavorite = useCallback((id: string) => {
    const updated = toggleFavorite(id);
    if (updated) {
      setSavedSets(getComparisonSets({ sortBy: 'updatedAt', sortOrder: 'desc' }));
    }
  }, []);

  // Export handlers
  const handleExportPDF = useCallback(() => {
    exportManualCompareToPDF({
      columns: manualColumns,
      rows: manualRows,
      exportDate: new Date().toISOString(),
    });
  }, [manualColumns, manualRows]);

  const handleExportExcel = useCallback(() => {
    exportManualCompareToExcel({
      columns: manualColumns,
      rows: manualRows,
      exportDate: new Date().toISOString(),
    });
  }, [manualColumns, manualRows]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0" style={{ zIndex: 9990, top: '64px' }} dir={direction}>
      {/* Clickable backdrop (no blur, no dark) - below top bar */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel - below top bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute flex flex-col overflow-hidden"
        style={{
          zIndex: 9991,
          top: 0,
          bottom: 0,
          width: '480px',
          maxWidth: '90vw',
          backgroundColor: styles.bgPrimary,
          boxShadow: isRtl ? '4px 0 24px rgba(0, 0, 0, 0.15)' : '-4px 0 24px rgba(0, 0, 0, 0.15)',
          [isRtl ? 'left' : 'right']: 0,
          transform: isAnimating ? 'translateX(0)' : isRtl ? 'translateX(-100%)' : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            background: `linear-gradient(135deg, ${styles.info}15 0%, ${styles.info}05 100%)`,
            borderBottom: `1px solid ${styles.border}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: styles.info, boxShadow: `0 4px 12px ${styles.info}40` }}
            >
              <Scales size={20} weight="bold" style={{ color: '#fff' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: styles.textPrimary }}>
                {t.title}
              </h2>
              <p className="text-xs" style={{ color: styles.textMuted }}>
                {t.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ backgroundColor: styles.bgSecondary, color: styles.textMuted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = styles.bgHover;
              e.currentTarget.style.color = styles.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = styles.bgSecondary;
              e.currentTarget.style.color = styles.textMuted;
            }}
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3" style={{ backgroundColor: styles.bgPrimary }}>
          {(['manual', 'import', 'saved'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2"
              style={{
                backgroundColor: activeTab === tab ? styles.bgCard : 'transparent',
                color: activeTab === tab ? styles.info : styles.textMuted,
                borderBottom: activeTab === tab ? `2px solid ${styles.info}` : '2px solid transparent',
              }}
            >
              {tab === 'manual' && t.tabs.manual}
              {tab === 'import' && t.tabs.import}
              {tab === 'saved' && (
                <>
                  <FolderOpen size={14} />
                  {t.tabs.saved} ({savedSets.length})
                </>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5" style={{ backgroundColor: styles.bgCard }}>
          {activeTab === 'manual' && (
            <div className="space-y-4">
              {/* Weight Customization Toggle */}
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setShowWeightPanel(!showWeightPanel)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: showWeightPanel ? `${styles.info}15` : styles.bgSecondary,
                    color: showWeightPanel ? styles.info : styles.textSecondary,
                  }}
                >
                  <Sliders size={14} weight="bold" />
                  {t.scoringWeights}
                  {showWeightPanel ? <CaretUp size={12} /> : <CaretDown size={12} />}
                </button>

                {/* Save Button */}
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
                >
                  <FloppyDisk size={14} />
                  {t.saveComparison}
                </button>
              </div>

              {/* Weight Customization Panel */}
              {showWeightPanel && (
                <div
                  className="p-3 rounded-xl space-y-3"
                  style={{ backgroundColor: styles.bgSecondary, border: `1px solid ${styles.border}` }}
                >
                  {/* Presets */}
                  <div>
                    <label className="text-xs font-semibold uppercase mb-2 block" style={{ color: styles.textMuted }}>
                      {t.quickPresets}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(WEIGHT_PRESETS).map(([key, preset]) => (
                        <button
                          key={key}
                          onClick={() => handlePresetChange(key)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                          style={{
                            backgroundColor: selectedPreset === key ? styles.info : styles.bgCard,
                            color: selectedPreset === key ? '#fff' : styles.textSecondary,
                          }}
                          title={preset.description}
                        >
                          {preset.name}
                        </button>
                      ))}
                      {selectedPreset === 'custom' && (
                        <span
                          className="px-2.5 py-1 rounded-lg text-xs font-medium"
                          style={{ backgroundColor: styles.info, color: '#fff' }}
                        >
                          {t.custom}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Weight Sliders */}
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(weights) as (keyof ScoringWeights)[]).map((factor) => (
                      <div key={factor} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span style={{ color: styles.textSecondary }} className="capitalize">
                            {factor === 'moq' ? 'MOQ' : factor.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span style={{ color: styles.info }} className="font-semibold">
                            {weights[factor]}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={weights[factor]}
                          onChange={(e) => handleWeightChange(factor, parseInt(e.target.value))}
                          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to ${isRtl ? 'left' : 'right'}, ${styles.info} ${weights[factor] * 2}%, ${styles.bgCard} ${weights[factor] * 2}%)`,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Best Pick Banner with Reasoning */}
              {manualScores.bestColumnId && bestPickReasoning && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #fbbf24' }}>
                  <div
                    className="flex items-center justify-between p-3 gap-2"
                    style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                        <Trophy size={16} weight="fill" style={{ color: '#fff' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: '#92400e' }}>
                          {t.recommended}: {bestPickReasoning.name}
                        </p>
                        <p className="text-xs truncate" style={{ color: '#a16207' }}>
                          {t.score}: {manualScores.columnScores[manualScores.bestColumnId]}
                          {bestPickReasoning.confidence === 'high' && ` | ${t.highConfidence}`}
                          {bestPickReasoning.confidence === 'medium' && ` | ${t.mediumConfidence}`}
                          {bestPickReasoning.confidence === 'low' && ` | ${t.lowConfidenceAddData}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowReasoning(!showReasoning)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0"
                      style={{ backgroundColor: 'rgba(146, 64, 14, 0.15)', color: '#92400e' }}
                    >
                      <Lightbulb size={12} />
                      {showReasoning ? <CaretUp size={10} /> : <CaretDown size={10} />}
                    </button>
                  </div>

                  {/* Expanded Reasoning Panel */}
                  {showReasoning && (
                    <div className="p-3 space-y-3" style={{ backgroundColor: '#fffbeb' }}>
                      {/* Key Strengths */}
                      {bestPickReasoning.reasons.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase mb-1.5" style={{ color: '#92400e' }}>
                            {t.keyStrengths}
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {bestPickReasoning.reasons.map((reason, idx) => (
                              <span
                                key={idx}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs"
                                style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#166534' }}
                              >
                                <CheckCircle size={10} weight="fill" />
                                {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Trade-offs */}
                      {bestPickReasoning.tradeOffs.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase mb-1.5" style={{ color: '#92400e' }}>
                            {t.tradeOffsToConsider}
                          </h4>
                          <div className="space-y-1.5">
                            {bestPickReasoning.tradeOffs.map((tradeOff, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-1.5 p-1.5 rounded-lg"
                                style={{
                                  backgroundColor:
                                    tradeOff.severity === 'significant'
                                      ? 'rgba(239, 68, 68, 0.15)'
                                      : tradeOff.severity === 'moderate'
                                        ? 'rgba(245, 158, 11, 0.15)'
                                        : 'rgba(156, 163, 175, 0.15)',
                                }}
                              >
                                <WarningCircle
                                  size={12}
                                  weight="fill"
                                  style={{
                                    color:
                                      tradeOff.severity === 'significant'
                                        ? '#dc2626'
                                        : tradeOff.severity === 'moderate'
                                          ? '#d97706'
                                          : '#6b7280',
                                    marginTop: 1,
                                    flexShrink: 0,
                                  }}
                                />
                                <span className="text-xs" style={{ color: '#78350f' }}>
                                  {tradeOff.description}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Confidence Explanation */}
                      <div
                        className="flex items-center gap-1.5 p-1.5 rounded-lg text-xs"
                        style={{ backgroundColor: 'rgba(146, 64, 14, 0.1)', color: '#78350f' }}
                      >
                        <Info size={12} style={{ flexShrink: 0 }} />
                        {bestPickReasoning.confidence === 'high'
                          ? t.highConfidenceDesc
                          : bestPickReasoning.confidence === 'medium'
                            ? t.mediumConfidenceDesc
                            : t.lowConfidenceDesc}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Table */}
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${styles.border}` }}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr style={{ backgroundColor: styles.bgSecondary }}>
                        <th
                          className="px-3 py-2.5 text-sm font-semibold"
                          style={{
                            color: styles.textSecondary,
                            width: '100px',
                            textAlign: isRtl ? 'right' : 'left',
                          }}
                        >
                          {t.metric}
                        </th>
                        {manualColumns.map((col) => (
                          <th
                            key={col.id}
                            className="px-3 py-2.5 text-center relative"
                            style={{
                              backgroundColor: manualScores.bestColumnId === col.id ? '#fef3c7' : styles.bgSecondary,
                            }}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="text"
                                value={col.name}
                                onChange={(e) => updateColumnName(col.id, e.target.value)}
                                className="bg-transparent text-sm font-semibold outline-none text-center w-full"
                                style={{ color: styles.textPrimary }}
                              />
                              {manualColumns.length > 2 && (
                                <button
                                  onClick={() => removeColumn(col.id)}
                                  className="p-0.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-red-100 transition-all"
                                >
                                  <X size={12} style={{ color: '#ef4444' }} />
                                </button>
                              )}
                            </div>
                            {manualScores.bestColumnId === col.id && (
                              <div
                                className="absolute -top-1.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-md"
                                style={{ [isRtl ? 'left' : 'right']: '-6px' }}
                              >
                                <Trophy size={10} weight="fill" style={{ color: '#fff' }} />
                              </div>
                            )}
                          </th>
                        ))}
                        {manualColumns.length < 4 && (
                          <th className="px-2 py-2.5" style={{ backgroundColor: styles.bgSecondary, width: '60px' }}>
                            <button
                              onClick={addColumn}
                              className="w-full py-1 rounded-lg flex items-center justify-center gap-1 text-xs font-medium transition-all"
                              style={{
                                color: styles.info,
                                backgroundColor: `${styles.info}10`,
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${styles.info}20`)}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = `${styles.info}10`)}
                            >
                              <Plus size={12} weight="bold" />
                              {t.add}
                            </button>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {manualRows.map((row, idx) => (
                        <tr
                          key={row.id}
                          style={{
                            backgroundColor: idx % 2 === 0 ? styles.bgPrimary : styles.bgCard,
                            borderTop: `1px solid ${styles.border}`,
                          }}
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={row.metric}
                                onChange={(e) => updateRowMetric(row.id, e.target.value)}
                                className="flex-1 bg-transparent text-sm font-medium outline-none min-w-0"
                                style={{
                                  color: styles.textPrimary,
                                  textAlign: isRtl ? 'right' : 'left',
                                }}
                              />
                              {manualRows.length > 1 && (
                                <button
                                  onClick={() => removeRow(row.id)}
                                  className="p-0.5 rounded-lg opacity-30 hover:opacity-100 hover:bg-red-100 transition-all flex-shrink-0"
                                >
                                  <Trash size={12} style={{ color: '#ef4444' }} />
                                </button>
                              )}
                            </div>
                          </td>
                          {manualColumns.map((col) => (
                            <td
                              key={col.id}
                              className="px-3 py-2.5"
                              style={{
                                backgroundColor: manualScores.bestColumnId === col.id ? '#fffbeb' : 'transparent',
                              }}
                            >
                              <input
                                type="text"
                                value={row.values[col.id] || ''}
                                onChange={(e) => updateCellValue(row.id, col.id, e.target.value)}
                                placeholder="—"
                                className="w-full bg-transparent text-sm outline-none text-center placeholder:text-gray-300"
                                style={{ color: styles.textPrimary }}
                              />
                            </td>
                          ))}
                          {manualColumns.length < 4 && <td />}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Row Button */}
              <button
                onClick={addRow}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: `${styles.info}10`,
                  color: styles.info,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${styles.info}20`)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = `${styles.info}10`)}
              >
                <Plus size={14} weight="bold" />
                {t.addRow}
              </button>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: styles.textPrimary }}>
                  {t.pasteCSV}
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={t.csvPlaceholder}
                  className="w-full h-40 p-3 rounded-xl text-sm resize-none transition-all focus:ring-2"
                  style={{
                    backgroundColor: styles.bgPrimary,
                    border: `1px solid ${styles.border}`,
                    color: styles.textPrimary,
                    outline: 'none',
                    direction: isRtl ? 'rtl' : 'ltr',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = styles.info)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = styles.border)}
                />
              </div>

              {importErrors.length > 0 && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  {importErrors.map((err, i) => (
                    <p key={i} className="text-sm text-red-600">
                      {err}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ backgroundColor: styles.info, color: '#fff' }}
                >
                  <Upload size={14} weight="bold" />
                  {t.importAndCompare}
                </button>
                <button
                  onClick={loadSampleTemplate}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    backgroundColor: styles.bgSecondary,
                    color: styles.textSecondary,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = styles.bgSecondary)}
                >
                  <ClipboardText size={14} />
                  {t.loadSample}
                </button>
              </div>

              <div className="p-4 rounded-xl" style={{ backgroundColor: styles.bgSecondary }}>
                <h4 className="text-sm font-semibold mb-2" style={{ color: styles.textPrimary }}>
                  {t.csvFormatGuide}
                </h4>
                <ul className="text-sm space-y-1" style={{ color: styles.textMuted }}>
                  <li>• {t.csvGuide1}</li>
                  <li>• {t.csvGuide2}</li>
                  <li>• {t.csvGuide3}</li>
                  <li>• {t.csvGuide4}</li>
                </ul>
              </div>
            </div>
          )}

          {/* Saved Comparisons Tab */}
          {activeTab === 'saved' && (
            <div className="space-y-3">
              {savedSets.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-10 text-center"
                  style={{ color: styles.textMuted }}
                >
                  <FolderOpen size={40} weight="thin" className="mb-3 opacity-50" />
                  <p className="font-medium mb-1" style={{ color: styles.textSecondary }}>
                    {t.noSavedYet}
                  </p>
                  <p className="text-sm">{t.noSavedDesc}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedSets.map((set) => (
                    <div
                      key={set.id}
                      className="flex items-center justify-between p-3 rounded-xl transition-all hover:shadow-md cursor-pointer"
                      style={{
                        backgroundColor: loadedSetId === set.id ? `${styles.info}10` : styles.bgPrimary,
                        border: `1px solid ${loadedSetId === set.id ? styles.info : styles.border}`,
                      }}
                      onClick={() => handleLoadSet(set)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(set.id);
                          }}
                          className="flex-shrink-0"
                        >
                          {set.isFavorite ? (
                            <Star size={16} weight="fill" style={{ color: '#fbbf24' }} />
                          ) : (
                            <Star size={16} style={{ color: styles.textMuted }} />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate" style={{ color: styles.textPrimary }}>
                            {set.name}
                          </p>
                          <p className="text-xs truncate" style={{ color: styles.textMuted }}>
                            {set.columns.length} {t.options} • {set.rows.length} {t.metrics} •{' '}
                            {new Date(set.updatedAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {set.bestPickColumnId && (
                          <span
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                            style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
                          >
                            <Trophy size={10} weight="fill" />
                            {set.columns.find((c) => c.id === set.bestPickColumnId)?.name || t.best}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(t.deleteConfirm)) {
                              handleDeleteSet(set.id);
                            }
                          }}
                          className="p-1.5 rounded-lg transition-all hover:bg-red-100"
                        >
                          <Trash size={14} style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save Dialog Overlay */}
        {showSaveDialog && (
          <div
            className="absolute inset-0 flex items-center justify-center p-5"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowSaveDialog(false)}
          >
            <div
              className="w-full max-w-sm p-5 rounded-2xl shadow-2xl"
              style={{ backgroundColor: styles.bgPrimary }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-bold mb-3" style={{ color: styles.textPrimary }}>
                {t.saveComparisonSet}
              </h3>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder={t.enterName}
                className="w-full px-3 py-2.5 rounded-xl text-sm mb-3"
                style={{
                  backgroundColor: styles.bgSecondary,
                  border: `1px solid ${styles.border}`,
                  color: styles.textPrimary,
                  outline: 'none',
                }}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveSet()}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSaveSet}
                  disabled={!saveName.trim()}
                  className="px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                  style={{ backgroundColor: styles.info, color: '#fff' }}
                >
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{
            backgroundColor: styles.bgPrimary,
            borderTop: `1px solid ${styles.border}`,
          }}
        >
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: '#ef444415',
                color: '#ef4444',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ef444425')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ef444415')}
            >
              <FilePdf size={16} weight="fill" />
              {t.pdf}
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: '#22c55e15',
                color: '#22c55e',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#22c55e25')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#22c55e15')}
            >
              <FileXls size={16} weight="fill" />
              {t.excel}
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-md"
            style={{
              backgroundColor: styles.info,
              color: '#fff',
              boxShadow: `0 4px 12px ${styles.info}40`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualCompareModal;
