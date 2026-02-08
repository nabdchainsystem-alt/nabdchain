import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Info, CaretRight, CaretDown, MapTrifold } from 'phosphor-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface JourneyTouchpointsInfoProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JourneyTouchpointsInfo: React.FC<JourneyTouchpointsInfoProps> = ({ isOpen, onClose }) => {
  const { t, dir } = useLanguage();
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [openQuestionIndex, setOpenQuestionIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const questions = [
    { q: t('journey_info_q1'), a: t('journey_info_a1') },
    { q: t('journey_info_q2'), a: t('journey_info_a2') },
    { q: t('journey_info_q3'), a: t('journey_info_a3') },
    { q: t('journey_info_q4'), a: t('journey_info_a4') },
  ];

  const toggleQuestion = (index: number) => {
    setOpenQuestionIndex(openQuestionIndex === index ? null : index);
  };

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted || !shouldRender) return null;

  const portalTarget = document.fullscreenElement || document.body;
  const isRTL = dir === 'rtl';

  return ReactDOM.createPortal(
    <div className={`fixed inset-0 z-[9999] flex justify-end overflow-hidden pointer-events-none font-sans`} dir={dir}>
      <div
        className={`absolute inset-0 pointer-events-auto transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
        style={{ background: 'transparent' }}
      />

      <div
        className={`
                    pointer-events-auto
                    relative w-full max-w-md bg-white dark:bg-monday-dark-surface shadow-2xl h-full flex flex-col ${isRTL ? 'border-r' : 'border-l'} border-gray-100 dark:border-gray-700
                    transform transition-transform duration-500
                    ${isVisible ? 'translate-x-0' : isRTL ? '-translate-x-full' : 'translate-x-full'}
                `}
        style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
      >
        <div className="flex-none flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-monday-dark-surface z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Info size={24} className="text-teal-600 dark:text-teal-400" />
              {t('journey_touchpoints_title')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('journey_subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={t('info_close_guide')}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 text-gray-600 dark:text-gray-300 pb-24">
          <section>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs">
                01
              </span>
              {t('info_overview')}
            </h3>
            <p className="text-sm leading-relaxed p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
              {t('journey_overview_desc')}
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs">
                02
              </span>
              {t('info_key_questions')}
            </h3>
            <div className="grid gap-2">
              {questions.map((item, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-colors overflow-hidden"
                >
                  <button
                    onClick={() => toggleQuestion(i)}
                    className={`w-full flex gap-3 items-center text-sm p-3 bg-white hover:bg-gray-50 dark:bg-transparent dark:hover:bg-gray-800/50 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                  >
                    {openQuestionIndex === i ? (
                      <CaretDown weight="bold" className="text-teal-500 shrink-0" size={14} />
                    ) : (
                      <CaretRight weight="bold" className="text-gray-400 shrink-0" size={14} />
                    )}
                    <span
                      className={`font-medium ${openQuestionIndex === i ? 'text-teal-600 dark:text-teal-400' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      {item.q}
                    </span>
                  </button>
                  <div
                    className={`px-3 overflow-hidden transition-all duration-300 ease-in-out ${openQuestionIndex === i ? 'max-h-40 py-2 opacity-100' : 'max-h-0 py-0 opacity-0'}`}
                  >
                    <p
                      className={`text-xs text-gray-500 dark:text-gray-400 ${isRTL ? 'pr-7' : 'pl-7'} pb-2 leading-relaxed`}
                    >
                      {item.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs">
                03
              </span>
              {t('info_detailed_breakdown')}
            </h3>

            <div className="space-y-6">
              <div>
                <h4
                  className={`text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 ${isRTL ? 'text-right' : 'text-left'}`}
                >
                  {t('info_kpis')}
                </h4>
                <div className="space-y-3">
                  <DetailItem title={t('avg_touchpoints')} desc={t('avg_touchpoints_desc')} isRTL={isRTL} />
                  <DetailItem title={t('conversion_time')} desc={t('conversion_time_desc')} isRTL={isRTL} />
                  <DetailItem title={t('drop_off_points')} desc={t('drop_off_points_desc')} isRTL={isRTL} />
                  <DetailItem title={t('channel_mix')} desc={t('channel_mix_desc')} isRTL={isRTL} />
                </div>
              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-700" />

              <div>
                <h4
                  className={`text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 ${isRTL ? 'text-right' : 'text-left'}`}
                >
                  {t('info_charts_tables')}
                </h4>
                <div className="space-y-3">
                  <DetailItem title={t('journey_map')} desc={t('journey_map_desc')} isRTL={isRTL} />
                  <DetailItem title={t('touchpoint_analysis')} desc={t('touchpoint_analysis_desc')} isRTL={isRTL} />
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs">
                04
              </span>
              {t('info_attribution')}
            </h3>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200 font-semibold text-xs uppercase tracking-wide">
                  <MapTrifold size={14} className="text-gray-500" />
                  <span>{t('attribution_model')}</span>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-100 dark:border-gray-700 p-3">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{t('attribution_model_desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex-none p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-monday-dark-bg z-10">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {t('info_close_guide')}
          </button>
        </div>
      </div>
    </div>,
    portalTarget,
  );
};

const DetailItem = ({ title, desc, isRTL = false }: { title: string; desc: string; isRTL?: boolean }) => (
  <div className={`group ${isRTL ? 'text-right' : 'text-left'}`}>
    <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
      {title}
    </div>
    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
  </div>
);
