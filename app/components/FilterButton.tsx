'use client'

import { Button } from '@mantine/core';
import Link from 'next/link';
import { IconCheck, IconList } from '@tabler/icons-react';

interface FilterButtonProps {
  filterType: 'active' | 'done';
  currentFilter: string;
}

export default function FilterButton({ filterType, currentFilter }: FilterButtonProps) {
  const isTarget = filterType === 'done' 
    ? currentFilter === 'done' 
    : currentFilter !== 'done';

  const href = filterType === 'done' ? '?filter=done' : '?filter=active';
  const label = filterType === 'done' ? 'Archive' : 'My Tasks';
  const Icon = filterType === 'done' ? IconCheck : IconList;

  return (
    <Button
      component={Link}
      href={href}
      variant={isTarget ? 'light' : 'subtle'}
      color={isTarget ? 'blue' : 'gray'}
      justify="flex-start"
      leftSection={<Icon size={20} />}
      fullWidth
    >
      {label}
    </Button>
  );
}