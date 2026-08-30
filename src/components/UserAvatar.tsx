'use client';

import React from 'react';

interface UserAvatarProps {
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const AVATAR_COLORS = [
  { bg: 'bg-[#4285F4]', text: 'text-white' }, // Google Blue
  { bg: 'bg-[#EA4335]', text: 'text-white' }, // Google Red
  { bg: 'bg-[#006e2c]', text: 'text-white' }, // GDG Green
  { bg: 'bg-[#765700]', text: 'text-white' }, // GDG Amber/Yellow
  { bg: 'bg-[#7c3aed]', text: 'text-white' }, // Purple
  { bg: 'bg-[#0284c7]', text: 'text-white' }, // Sky Blue
  { bg: 'bg-[#0d9488]', text: 'text-white' }, // Teal
  { bg: 'bg-[#c026d3]', text: 'text-white' }, // Fuchsia
  { bg: 'bg-[#e11d48]', text: 'text-white' }, // Rose
  { bg: 'bg-[#4f46e5]', text: 'text-white' }, // Indigo
];

function getInitials(name?: string): string {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColor(name?: string) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px] font-bold rounded-lg',
  sm: 'w-8 h-8 text-xs font-bold rounded-xl',
  md: 'w-10 h-10 text-sm font-bold rounded-xl',
  lg: 'w-14 h-14 text-lg font-extrabold rounded-2xl',
  xl: 'w-16 h-16 text-xl font-extrabold rounded-2xl',
  '2xl': 'w-20 h-20 text-2xl font-extrabold rounded-2xl',
};

export default function UserAvatar({ name, size = 'md', className = '' }: UserAvatarProps) {
  const initials = getInitials(name);
  const color = getColor(name);
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <div
      className={`inline-flex items-center justify-center select-none shadow-xs font-headline flex-shrink-0 tracking-wider ${color.bg} ${color.text} ${sizeClass} ${className}`}
      title={name || 'User'}
    >
      {initials}
    </div>
  );
}
