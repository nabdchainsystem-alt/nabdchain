export interface CellData {
  value: string | number;
  displayValue?: string;
  style?: {
    bold?: boolean;
    italic?: boolean;
    align?: 'left' | 'center' | 'right';
    color?: string; // Tailwind class or hex
    bg?: string; // Tailwind class or hex
    borderBottom?: boolean;
  };
}

export type GridData = Record<string, CellData>;

export interface Selection {
  row: number;
  col: number;
}