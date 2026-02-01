import React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, CaretRight, Circle } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';

// Root
export const DropdownMenu = DropdownMenuPrimitive.Root;

// Trigger
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

// Group
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;

// Portal
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

// Sub
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;

// RadioGroup
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

// SubTrigger
interface SubTriggerProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> {
  inset?: boolean;
}

export const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  SubTriggerProps
>(({ className, inset, children, ...props }, ref) => {
  const { styles } = usePortal();

  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={`flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors ${
        inset ? 'pl-8' : ''
      } ${className || ''}`}
      style={{ color: styles.textPrimary }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = styles.bgHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      {...props}
    >
      {children}
      <CaretRight size={14} className="ml-auto" style={{ color: styles.textMuted }} />
    </DropdownMenuPrimitive.SubTrigger>
  );
});
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

// SubContent
export const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => {
  const { styles } = usePortal();

  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={`z-50 min-w-[180px] overflow-hidden rounded-xl border p-1 shadow-lg ${className || ''}`}
      style={{
        backgroundColor: styles.bgCard,
        borderColor: styles.border,
      }}
      {...props}
    />
  );
});
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

// Content
interface ContentProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> {
  sideOffset?: number;
}

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  ContentProps
>(({ className, sideOffset = 4, ...props }, ref) => {
  const { styles } = usePortal();

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={`z-50 min-w-[180px] overflow-hidden rounded-xl border p-1 shadow-lg ${className || ''}`}
        style={{
          backgroundColor: styles.bgCard,
          borderColor: styles.border,
        }}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';

// Item
interface ItemProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  inset?: boolean;
  destructive?: boolean;
}

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  ItemProps
>(({ className, inset, destructive, ...props }, ref) => {
  const { styles } = usePortal();

  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={`relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors ${
        inset ? 'pl-8' : ''
      } ${className || ''}`}
      style={{
        color: destructive ? styles.error : styles.textPrimary,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = destructive
          ? `${styles.error}10`
          : styles.bgHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      {...props}
    />
  );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';

// CheckboxItem
export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => {
  const { styles } = usePortal();

  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={`relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm outline-none transition-colors ${className || ''}`}
      style={{ color: styles.textPrimary }}
      checked={checked}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = styles.bgHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      {...props}
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check size={14} weight="bold" style={{ color: styles.info }} />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

// RadioItem
interface RadioItemProps {
  className?: string;
  children?: React.ReactNode;
  value: string;
}

export const DropdownMenuRadioItem: React.FC<RadioItemProps> = ({
  className,
  children,
  value,
}) => {
  const { styles } = usePortal();

  return (
    <DropdownMenuPrimitive.RadioItem
      value={value}
      className={`relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm outline-none transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${className || ''}`}
      style={{ color: styles.textPrimary }}
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle size={8} weight="fill" style={{ color: styles.info }} />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
};

// Label
interface LabelProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> {
  inset?: boolean;
}

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  LabelProps
>(({ className, inset, ...props }, ref) => {
  const { styles } = usePortal();

  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider ${inset ? 'pl-8' : ''} ${className || ''}`}
      style={{ color: styles.textMuted }}
      {...props}
    />
  );
});
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

// Separator
export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => {
  const { styles } = usePortal();

  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={`-mx-1 my-1 h-px ${className || ''}`}
      style={{ backgroundColor: styles.border }}
      {...props}
    />
  );
});
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

// Shortcut
interface ShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const DropdownMenuShortcut: React.FC<ShortcutProps> = ({ className, ...props }) => {
  const { styles } = usePortal();

  return (
    <span
      className={`ml-auto text-xs tracking-widest ${className || ''}`}
      style={{ color: styles.textMuted }}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';
