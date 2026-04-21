interface DateSeparatorProps {
  date: string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  let label: string;
  if (d.toDateString() === today.toDateString()) {
    label = 'Today';
  } else if (d.toDateString() === yesterday.toDateString()) {
    label = 'Yesterday';
  } else {
    label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div
      style={{
        alignSelf: 'center',
        background: 'rgba(255, 255, 255, 0.7)',
        color: '#54656f',
        fontSize: 11.5,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 8,
        margin: '8px 0',
      }}
    >
      {label}
    </div>
  );
}
