interface FieldGroupProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export function FieldGroup({ label, hint, children }: FieldGroupProps) {
  return (
    <div className="mb-[18px]">
      <div className="mb-1.5 flex items-center justify-between text-2xs font-[650] uppercase text-ink-700 tracking-[0.05em]">
        <span>{label}</span>
        {hint && (
          <span className="font-medium text-ink-500 normal-case tracking-normal">
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
