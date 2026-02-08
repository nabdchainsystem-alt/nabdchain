import React, { useState, useCallback, useMemo } from 'react';
import {
  X,
  Plus,
  Trash,
  FilePdf,
  FileXls,
  Upload,
  Trophy,
  Scales,
  ArrowsClockwise,
  ShieldCheck,
  Info,
  CaretDown,
  CaretUp,
  ClipboardText,
  Lightning,
} from 'phosphor-react';
import { usePortal } from '../context/PortalContext';
import { SupplierQuote } from '../types/comparison.types';
import { HybridComparisonData, HybridCellValue, quotesToHybridData, countDataPoints } from '../types/comparison.types';
import {
  addManualColumn,
  removeColumn,
  updateColumnName,
  addCustomRow,
  removeRow,
  updateRowMetric,
  updateCellValue,
  importCSVToHybrid,
  getDataQuality,
} from '../services/hybridComparisonService';
import { scoreManualCompare } from '../services/compareScoringService';
import {
  exportHybridCompareToPDF,
  exportHybridCompareToExcel,
  getSampleCSVTemplate,
} from '../services/comparisonExportService';
import { DataSourceBadge } from './DataSourceBadge';

interface HybridCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotes: SupplierQuote[];
  currency: string;
  rfqInfo?: {
    rfqId: string;
    rfqNumber?: string;
    itemName?: string;
  };
}

// Accent color (same as used in ManualCompareModal)
const ACCENT_COLOR = '#3b82f6'; // Blue-500

export const HybridCompareModal: React.FC<HybridCompareModalProps> = ({
  isOpen,
  onClose,
  quotes,
  currency,
  rfqInfo,
}) => {
  const { styles } = usePortal();

  // Initialize data from quotes
  const [data, setData] = useState<HybridComparisonData>(() => quotesToHybridData(quotes, currency, rfqInfo));

  // UI state
  const [activeTab, setActiveTab] = useState<'compare' | 'import'>('compare');
  const [importText, setImportText] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [showInfo, setShowInfo] = useState(false);

  // Calculate scores
  const scores = useMemo(() => {
    return scoreManualCompare({
      columns: data.columns.map((c) => ({ id: c.id, name: c.name })),
      rows: data.rows.map((r) => ({
        id: r.id,
        metric: r.metric,
        values: Object.fromEntries(Object.entries(r.values).map(([k, v]) => [k, (v as HybridCellValue).value])),
      })),
    });
  }, [data]);

  // Data quality metrics
  const quality = useMemo(() => getDataQuality(data), [data]);
  const dataCounts = useMemo(() => countDataPoints(data), [data]);

  // Handlers
  const handleAddColumn = useCallback(() => {
    if (data.columns.length >= 6) return;
    setData(addManualColumn(data));
  }, [data]);

  const handleRemoveColumn = useCallback(
    (columnId: string) => {
      setData(removeColumn(data, columnId));
    },
    [data],
  );

  const handleUpdateColumnName = useCallback(
    (columnId: string, name: string) => {
      setData(updateColumnName(data, columnId, name));
    },
    [data],
  );

  const handleAddRow = useCallback(() => {
    setData(addCustomRow(data));
  }, [data]);

  const handleRemoveRow = useCallback(
    (rowId: string) => {
      setData(removeRow(data, rowId));
    },
    [data],
  );

  const handleUpdateRowMetric = useCallback(
    (rowId: string, metric: string) => {
      setData(updateRowMetric(data, rowId, metric));
    },
    [data],
  );

  const handleUpdateCellValue = useCallback(
    (rowId: string, columnId: string, value: string) => {
      setData(updateCellValue(data, rowId, columnId, value));
    },
    [data],
  );

  const handleRefreshLiveData = useCallback(() => {
    // Re-initialize from quotes to refresh live data
    const freshData = quotesToHybridData(quotes, currency, rfqInfo);

    // Preserve manual columns and custom rows
    const manualColumns = data.columns.filter((c) => c.source === 'manual');
    const customRows = data.rows.filter((r) => r.rowType === 'custom');

    setData({
      ...freshData,
      columns: [...freshData.columns, ...manualColumns],
      rows: [...freshData.rows, ...customRows],
      hasManualData: manualColumns.length > 0 || customRows.length > 0,
    });
  }, [quotes, currency, rfqInfo, data]);

  const handleImport = useCallback(() => {
    const result = importCSVToHybrid(data, importText);
    setImportErrors(result.errors);
    if (result.errors.length === 0) {
      setData(result.data);
      setActiveTab('compare');
      setImportText('');
    }
  }, [data, importText]);

  const loadSampleTemplate = useCallback(() => {
    setImportText(getSampleCSVTemplate());
  }, []);

  const handleExportPDF = useCallback(() => {
    exportHybridCompareToPDF({
      rfqNumber: rfqInfo?.rfqNumber,
      itemName: rfqInfo?.itemName,
      columns: data.columns,
      rows: data.rows,
      bestColumnId: scores.bestColumnId,
      exportDate: new Date().toISOString(),
    });
  }, [data, scores.bestColumnId, rfqInfo]);

  const handleExportExcel = useCallback(() => {
    exportHybridCompareToExcel({
      rfqNumber: rfqInfo?.rfqNumber,
      itemName: rfqInfo?.itemName,
      columns: data.columns,
      rows: data.rows,
      bestColumnId: scores.bestColumnId,
      exportDate: new Date().toISOString(),
    });
  }, [data, scores.bestColumnId, rfqInfo]);

  if (!isOpen) return null;

  const bestColumn = data.columns.find((c) => c.id === scores.bestColumnId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: styles.bgPrimary, maxHeight: '90vh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{
            background: `linear-gradient(135deg, ${ACCENT_COLOR}15 0%, ${ACCENT_COLOR}05 100%)`,
            borderBottom: `1px solid ${styles.border}`,
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: ACCENT_COLOR,
                boxShadow: `0 4px 12px ${ACCENT_COLOR}40`,
              }}
            >
              <Scales size={24} weight="bold" style={{ color: '#fff' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: styles.textPrimary }}>
                Hybrid Comparison
              </h2>
              <p className="text-sm" style={{ color: styles.textMuted }}>
                {rfqInfo?.itemName || 'Compare supplier quotes with custom data'}
                {rfqInfo?.rfqNumber && <span className="ml-2 opacity-60">• {rfqInfo.rfqNumber}</span>}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{ backgroundColor: styles.bgSecondary, color: styles.textMuted }}
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {(['compare', 'import'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-2.5 text-sm font-medium rounded-t-xl transition-all flex items-center gap-2"
              style={{
                backgroundColor: activeTab === tab ? styles.bgCard : 'transparent',
                color: activeTab === tab ? ACCENT_COLOR : styles.textMuted,
                borderBottom: activeTab === tab ? `2px solid ${ACCENT_COLOR}` : '2px solid transparent',
              }}
            >
              {tab === 'compare' && 'Comparison'}
              {tab === 'import' && (
                <>
                  <Upload size={16} />
                  Import CSV
                </>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6" style={{ backgroundColor: styles.bgCard }}>
          {activeTab === 'compare' && (
            <div className="space-y-5">
              {/* Toolbar */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddColumn}
                    disabled={data.columns.length >= 6}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                    style={{ backgroundColor: `${ACCENT_COLOR}15`, color: ACCENT_COLOR }}
                  >
                    <Plus size={16} weight="bold" />
                    Add Column
                  </button>
                  <button
                    onClick={handleAddRow}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ backgroundColor: `${ACCENT_COLOR}15`, color: ACCENT_COLOR }}
                  >
                    <Plus size={16} weight="bold" />
                    Add Row
                  </button>
                  {data.hasLiveData && (
                    <button
                      onClick={handleRefreshLiveData}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
                    >
                      <ArrowsClockwise size={16} />
                      Refresh Live Data
                    </button>
                  )}
                </div>

                {/* Data Quality Indicator */}
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
                  style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
                >
                  <Info size={16} />
                  {dataCounts.live > 0 && <span className="text-blue-600">{dataCounts.live} live</span>}
                  {dataCounts.manual > 0 && <span className="text-gray-500">{dataCounts.manual} manual</span>}
                  {showInfo ? <CaretUp size={12} /> : <CaretDown size={12} />}
                </button>
              </div>

              {/* Info Panel */}
              {showInfo && (
                <div
                  className="p-4 rounded-xl text-sm space-y-2"
                  style={{ backgroundColor: styles.bgSecondary, border: `1px solid ${styles.border}` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <DataSourceBadge source="live" size="md" />
                      <span style={{ color: styles.textSecondary }}>Data from supplier quotes (read-only)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DataSourceBadge source="manual" size="md" />
                      <span style={{ color: styles.textSecondary }}>Your custom entries (editable)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2" style={{ color: styles.textMuted }}>
                    <span>Confidence: </span>
                    <span
                      className="font-medium"
                      style={{
                        color:
                          quality.confidence === 'high'
                            ? styles.success
                            : quality.confidence === 'medium'
                              ? '#f59e0b'
                              : '#ef4444',
                      }}
                    >
                      {quality.confidence.charAt(0).toUpperCase() + quality.confidence.slice(1)}
                    </span>
                    <span>
                      ({Math.round(quality.completeness)}% complete, {Math.round(quality.liveDataRatio)}% from live
                      data)
                    </span>
                  </div>
                </div>
              )}

              {/* Best Pick Banner */}
              {scores.bestColumnId && bestColumn && (
                <div
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    border: '1px solid #fbbf24',
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                      <Trophy size={20} weight="fill" style={{ color: '#fff' }} />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: '#92400e' }}>
                        Best Pick: {bestColumn.name}
                      </p>
                      <p className="text-sm" style={{ color: '#a16207' }}>
                        Score: {scores.columnScores[scores.bestColumnId]}
                        {bestColumn.source === 'live' && bestColumn.isVerified && (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <ShieldCheck size={12} weight="fill" /> Verified
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <DataSourceBadge source={bestColumn.source} size="md" />
                </div>
              )}

              {/* Comparison Table */}
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${styles.border}` }}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr style={{ backgroundColor: styles.bgSecondary }}>
                        <th
                          className="px-4 py-3 text-left text-sm font-semibold sticky left-0"
                          style={{
                            color: styles.textSecondary,
                            width: '160px',
                            backgroundColor: styles.bgSecondary,
                          }}
                        >
                          Metric
                        </th>
                        {data.columns.map((col) => (
                          <th
                            key={col.id}
                            className="px-4 py-3 text-center relative min-w-[140px]"
                            style={{
                              backgroundColor: scores.bestColumnId === col.id ? '#fef3c7' : styles.bgSecondary,
                            }}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center justify-center gap-2">
                                {col.source === 'live' ? (
                                  <span className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
                                    {col.name}
                                  </span>
                                ) : (
                                  <input
                                    type="text"
                                    value={col.name}
                                    onChange={(e) => handleUpdateColumnName(col.id, e.target.value)}
                                    className="bg-transparent text-sm font-semibold outline-none text-center w-full"
                                    style={{ color: styles.textPrimary }}
                                  />
                                )}
                                {col.source === 'manual' && data.columns.length > 2 && (
                                  <button
                                    onClick={() => handleRemoveColumn(col.id)}
                                    className="p-1 rounded-lg opacity-40 hover:opacity-100 hover:bg-red-100 transition-all"
                                  >
                                    <X size={14} style={{ color: '#ef4444' }} />
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <DataSourceBadge source={col.source} size="sm" />
                                {col.isVerified && (
                                  <ShieldCheck size={12} weight="fill" style={{ color: styles.success }} />
                                )}
                                {col.responseSpeed === 'fast' && (
                                  <Lightning size={12} weight="fill" style={{ color: '#f59e0b' }} />
                                )}
                              </div>
                            </div>
                            {scores.bestColumnId === col.id && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-md">
                                <Trophy size={12} weight="fill" style={{ color: '#fff' }} />
                              </div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row, idx) => (
                        <tr
                          key={row.id}
                          style={{
                            backgroundColor: idx % 2 === 0 ? styles.bgPrimary : styles.bgCard,
                            borderTop: `1px solid ${styles.border}`,
                          }}
                        >
                          <td
                            className="px-4 py-3 sticky left-0"
                            style={{ backgroundColor: idx % 2 === 0 ? styles.bgPrimary : styles.bgCard }}
                          >
                            <div className="flex items-center gap-2">
                              {row.rowType === 'system' ? (
                                <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                                  {row.metric}
                                </span>
                              ) : (
                                <input
                                  type="text"
                                  value={row.metric}
                                  onChange={(e) => handleUpdateRowMetric(row.id, e.target.value)}
                                  className="flex-1 bg-transparent text-sm font-medium outline-none"
                                  style={{ color: styles.textPrimary }}
                                />
                              )}
                              {row.rowType === 'custom' && data.rows.length > 1 && (
                                <button
                                  onClick={() => handleRemoveRow(row.id)}
                                  className="p-1 rounded-lg opacity-30 hover:opacity-100 hover:bg-red-100 transition-all"
                                >
                                  <Trash size={14} style={{ color: '#ef4444' }} />
                                </button>
                              )}
                            </div>
                            {row.rowType === 'system' && (
                              <span className="text-[10px]" style={{ color: styles.textMuted }}>
                                System
                              </span>
                            )}
                          </td>
                          {data.columns.map((col) => {
                            const cell = row.values[col.id];
                            const isLiveCell = cell?.source === 'live' && row.rowType === 'system';
                            const isBestColumn = scores.bestColumnId === col.id;

                            return (
                              <td
                                key={col.id}
                                className="px-4 py-3 text-center"
                                style={{
                                  backgroundColor: isBestColumn ? '#fffbeb' : isLiveCell ? '#eff6ff' : 'transparent',
                                }}
                              >
                                {isLiveCell ? (
                                  <span className="text-sm" style={{ color: styles.textPrimary }}>
                                    {cell?.value || '—'}
                                  </span>
                                ) : (
                                  <input
                                    type="text"
                                    value={cell?.value || ''}
                                    onChange={(e) => handleUpdateCellValue(row.id, col.id, e.target.value)}
                                    placeholder="—"
                                    className="w-full bg-transparent text-sm outline-none text-center placeholder:text-gray-300"
                                    style={{ color: styles.textPrimary }}
                                  />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: styles.textPrimary }}>
                  Paste CSV Data
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Metric,Option A,Option B,Option C&#10;Warranty,2 years,1 year,3 years&#10;Installation,Included,$500,Not available"
                  className="w-full h-48 p-4 rounded-xl text-sm resize-none transition-all focus:ring-2"
                  style={{
                    backgroundColor: styles.bgPrimary,
                    border: `1px solid ${styles.border}`,
                    color: styles.textPrimary,
                    outline: 'none',
                  }}
                />
              </div>

              {importErrors.length > 0 && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                  {importErrors.map((err, i) => (
                    <p key={i} className="text-sm text-red-600">
                      {err}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ backgroundColor: ACCENT_COLOR, color: '#fff' }}
                >
                  <Upload size={16} weight="bold" />
                  Import & Add to Comparison
                </button>
                <button
                  onClick={loadSampleTemplate}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
                >
                  <ClipboardText size={16} />
                  Load Sample
                </button>
              </div>

              <div className="p-5 rounded-xl" style={{ backgroundColor: styles.bgSecondary }}>
                <h4 className="text-sm font-semibold mb-3" style={{ color: styles.textPrimary }}>
                  CSV Import Guide
                </h4>
                <ul className="text-sm space-y-1.5" style={{ color: styles.textMuted }}>
                  <li>• First row should be headers: Metric, Option A, Option B, ...</li>
                  <li>• First column is the metric name (Warranty, Installation, etc.)</li>
                  <li>• Imported data will be added alongside existing comparison</li>
                  <li>• Use quotes for values containing commas</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            backgroundColor: styles.bgPrimary,
            borderTop: `1px solid ${styles.border}`,
          }}
        >
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ backgroundColor: '#ef444415', color: '#ef4444' }}
            >
              <FilePdf size={18} weight="fill" />
              PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ backgroundColor: '#22c55e15', color: '#22c55e' }}
            >
              <FileXls size={18} weight="fill" />
              Excel
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md"
            style={{
              backgroundColor: ACCENT_COLOR,
              color: '#fff',
              boxShadow: `0 4px 12px ${ACCENT_COLOR}40`,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default HybridCompareModal;
