export interface MappingRowProps {
  label: string;
  path: string;
  isAbandonedCart: boolean;
  onChange: (path: string) => void;
}
