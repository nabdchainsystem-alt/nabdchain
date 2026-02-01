import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { CaretDown, Check, CaretUp } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  className = '',
}) => {
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange} disabled={disabled} dir={direction}>
      <SelectPrimitive.Trigger
        className={`inline-flex items-center justify-between gap-2 h-9 px-3 text-sm rounded-lg border outline-none transition-all ${className}`}
        style={{
          backgroundColor: styles.bgPrimary,
          borderColor: styles.border,
          color: selectedOption ? styles.textPrimary : styles.textMuted,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          minWidth: '140px',
        }}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <CaretDown size={14} style={{ color: styles.textMuted }} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="overflow-hidden rounded-xl border shadow-lg z-50"
          style={{
            backgroundColor: styles.bgCard,
            borderColor: styles.border,
            minWidth: 'var(--radix-select-trigger-width)',
            maxHeight: 'var(--radix-select-content-available-height)',
          }}
          position="popper"
          sideOffset={4}
          align={isRtl ? 'end' : 'start'}
        >
          <SelectPrimitive.ScrollUpButton
            className="flex items-center justify-center h-6 cursor-default"
            style={{ backgroundColor: styles.bgCard }}
          >
            <CaretUp size={14} style={{ color: styles.textMuted }} />
          </SelectPrimitive.ScrollUpButton>

          <SelectPrimitive.Viewport className="p-1">
            {options
              .filter((option) => option.value !== '') // Radix doesn't allow empty string values
              .map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="relative flex items-center h-9 px-3 pr-8 text-sm rounded-lg outline-none cursor-pointer select-none transition-colors"
                style={{
                  color: option.disabled ? styles.textMuted : styles.textPrimary,
                  opacity: option.disabled ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!option.disabled) {
                    e.currentTarget.style.backgroundColor = styles.bgHover;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator
                  className="absolute right-2 flex items-center justify-center"
                >
                  <Check size={14} weight="bold" style={{ color: styles.info }} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>

          <SelectPrimitive.ScrollDownButton
            className="flex items-center justify-center h-6 cursor-default"
            style={{ backgroundColor: styles.bgCard }}
          >
            <CaretDown size={14} style={{ color: styles.textMuted }} />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
};

export default Select;
