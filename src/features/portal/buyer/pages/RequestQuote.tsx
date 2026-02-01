import React, { useState } from 'react';
import { Check } from 'phosphor-react';
import { Container, PageHeader, Button } from '../../components';
import { usePortal } from '../../context/PortalContext';

interface RequestQuoteProps {
  onNavigate: (page: string) => void;
}

type RFQStep = 'type' | 'details' | 'review';

export const RequestQuote: React.FC<RequestQuoteProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<RFQStep>('type');
  const [rfqType, setRfqType] = useState<'single' | 'multi' | null>(null);
  const { styles, t } = usePortal();

  const steps: { id: RFQStep; label: string }[] = [
    { id: 'type', label: t('buyer.rfq.selectType') },
    { id: 'details', label: t('buyer.rfq.partDetails') },
    { id: 'review', label: t('buyer.rfq.reviewSubmit') },
  ];

  return (
    <div
      className="min-h-screen transition-colors"
      style={{ backgroundColor: styles.bgPrimary }}
    >
      <Container variant="full">
        <PageHeader
          title={t('buyer.rfq.title')}
          subtitle={t('buyer.rfq.subtitle')}
        />

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <StepIndicator
                number={i + 1}
                label={s.label}
                active={step === s.id}
                completed={steps.findIndex((x) => x.id === step) > i}
              />
              {i < steps.length - 1 && (
                <div className="w-16 h-px" style={{ backgroundColor: styles.border }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div
          className="rounded-lg border p-8 transition-colors"
          style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
        >
          {step === 'type' && (
            <div className="max-w-xl mx-auto">
              <h2
                className="text-lg font-semibold text-center mb-6"
                style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
              >
                {t('buyer.rfq.whatType')}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <RFQTypeCard
                  selected={rfqType === 'single'}
                  onClick={() => setRfqType('single')}
                  title={t('buyer.rfq.singlePart')}
                  description={t('buyer.rfq.singlePartDesc')}
                />
                <RFQTypeCard
                  selected={rfqType === 'multi'}
                  onClick={() => setRfqType('multi')}
                  title={t('buyer.rfq.multipleParts')}
                  description={t('buyer.rfq.multiplePartsDesc')}
                />
              </div>
              <div className="mt-8 flex justify-end">
                <Button
                  onClick={() => rfqType && setStep('details')}
                  disabled={!rfqType}
                >
                  {t('common.continue')}
                </Button>
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="max-w-xl mx-auto">
              <h2
                className="text-lg font-semibold text-center mb-6"
                style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
              >
                {t('buyer.rfq.enterDetails')}
              </h2>
              <div className="space-y-4">
                <FormField label={t('buyer.rfq.partNumber')} placeholder="e.g., SKF-6205-2RS" />
                <FormField label={t('buyer.rfq.manufacturer')} placeholder="e.g., SKF, NSK, FAG" />
                <FormField label={t('buyer.rfq.quantity')} placeholder="e.g., 100" type="number" />
                <FormField label={t('buyer.rfq.description')} placeholder="Additional specifications..." multiline />
              </div>
              <div className="mt-8 flex justify-between">
                <Button variant="secondary" onClick={() => setStep('type')}>
                  {t('common.back')}
                </Button>
                <Button onClick={() => setStep('review')}>
                  {t('common.continue')}
                </Button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="max-w-xl mx-auto text-center">
              <h2
                className="text-lg font-semibold mb-2"
                style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
              >
                {t('buyer.rfq.reviewRfq')}
              </h2>
              <p className="text-sm mb-8" style={{ color: styles.textSecondary }}>
                {t('buyer.rfq.willBeSent')}
              </p>
              <div
                className="rounded-md border p-6 text-left mb-8 transition-colors"
                style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
              >
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: styles.textSecondary }}>{t('buyer.rfq.type')}</span>
                    <span style={{ color: styles.textPrimary }} className="font-medium">
                      {rfqType === 'single' ? t('buyer.rfq.singlePart') : t('buyer.rfq.multipleParts')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: styles.textSecondary }}>{t('buyer.rfq.partNumber')}</span>
                    <span style={{ color: styles.textPrimary }} className="font-medium">—</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: styles.textSecondary }}>{t('buyer.rfq.quantity')}</span>
                    <span style={{ color: styles.textPrimary }} className="font-medium">—</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep('details')}>
                  {t('common.back')}
                </Button>
                <Button onClick={() => onNavigate('my-rfqs')}>
                  {t('buyer.rfq.submitRfq')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

const StepIndicator: React.FC<{
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}> = ({ number, label, active, completed }) => {
  const { styles } = usePortal();

  return (
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
        style={{
          backgroundColor: active || completed ? (styles.isDark ? '#E6E8EB' : '#0F1115') : styles.bgSecondary,
          color: active || completed ? (styles.isDark ? '#0F1115' : '#E6E8EB') : styles.textMuted,
        }}
      >
        {completed ? <Check size={16} weight="bold" /> : number}
      </div>
      <span
        className="text-sm font-medium hidden sm:block"
        style={{ color: active ? styles.textPrimary : styles.textMuted }}
      >
        {label}
      </span>
    </div>
  );
};

const RFQTypeCard: React.FC<{
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
}> = ({ selected, onClick, title, description }) => {
  const { styles } = usePortal();

  return (
    <button
      onClick={onClick}
      className="p-5 rounded-lg border text-left transition-all"
      style={{
        borderColor: selected ? (styles.isDark ? '#E6E8EB' : '#0F1115') : styles.border,
        backgroundColor: selected ? styles.bgSecondary : styles.bgCard,
      }}
    >
      <div
        className="text-sm font-semibold"
        style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
      >
        {title}
      </div>
      <div className="text-xs mt-1" style={{ color: styles.textSecondary }}>
        {description}
      </div>
    </button>
  );
};

const FormField: React.FC<{
  label: string;
  placeholder: string;
  type?: string;
  multiline?: boolean;
}> = ({ label, placeholder, type = 'text', multiline }) => {
  const { styles } = usePortal();

  return (
    <div>
      <label
        className="block text-sm font-medium mb-1.5"
        style={{ color: styles.textPrimary }}
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2.5 rounded-md border outline-none text-sm resize-none transition-colors"
          style={{
            borderColor: styles.border,
            backgroundColor: styles.bgPrimary,
            color: styles.textPrimary,
            fontFamily: styles.fontBody,
          }}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 rounded-md border outline-none text-sm transition-colors"
          style={{
            borderColor: styles.border,
            backgroundColor: styles.bgPrimary,
            color: styles.textPrimary,
            fontFamily: styles.fontBody,
          }}
        />
      )}
    </div>
  );
};

export default RequestQuote;
