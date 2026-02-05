import React from 'react';
import { Broadcast, PencilSimple, Upload } from 'phosphor-react';
import { ComparisonDataSource } from '../types/comparison.types';

interface DataSourceBadgeProps {
  source: ComparisonDataSource;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const sourceConfig: Record<
  ComparisonDataSource,
  { label: string; bgColor: string; textColor: string; icon: React.ElementType }
> = {
  live: {
    label: 'Live',
    bgColor: '#dbeafe', // blue-100
    textColor: '#1d4ed8', // blue-700
    icon: Broadcast,
  },
  manual: {
    label: 'Manual',
    bgColor: '#f3f4f6', // gray-100
    textColor: '#4b5563', // gray-600
    icon: PencilSimple,
  },
  imported: {
    label: 'Imported',
    bgColor: '#f3e8ff', // purple-100
    textColor: '#7c3aed', // purple-600
    icon: Upload,
  },
};

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({
  source,
  size = 'sm',
  showIcon = true,
}) => {
  const config = sourceConfig[source];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2 py-1 text-xs gap-1.5',
  };

  const iconSize = size === 'sm' ? 10 : 12;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]}`}
      style={{ backgroundColor: config.bgColor, color: config.textColor }}
    >
      {showIcon && <Icon size={iconSize} weight="bold" />}
      {config.label}
    </span>
  );
};

export default DataSourceBadge;
