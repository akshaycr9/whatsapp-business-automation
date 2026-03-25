import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatRelativeTime = (date: Date | string): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const formatPhoneDisplay = (phone: string): string => {
  // Format E.164 without + (919876543210) → +91 98765 43210
  if (phone.startsWith('91') && phone.length === 12) {
    return `+91 ${phone.slice(2, 7)} ${phone.slice(7)}`;
  }
  return `+${phone}`;
};

export const getInitials = (name: string): string =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
