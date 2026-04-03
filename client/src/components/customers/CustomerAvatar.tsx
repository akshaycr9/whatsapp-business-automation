import React from 'react';
import { getInitials } from '@/lib/utils';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
];

interface CustomerAvatarProps {
  name: string | null;
  phone: string;
}

export const CustomerAvatar = React.memo(function CustomerAvatar({ name, phone }: CustomerAvatarProps) {
  const label = name ?? phone;
  const initials = getInitials(label);
  const colorIndex = phone.charCodeAt(phone.length - 1) % AVATAR_COLORS.length;
  const colorClass = AVATAR_COLORS[colorIndex];

  return (
    <div
      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${colorClass}`}
    >
      {initials}
    </div>
  );
});
