'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SegmentedControl } from '@mantine/core';

export default function FilterToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get('filter') === 'done' ? 'done' : 'active';

  return (
    <SegmentedControl
      value={current}
      onChange={(value) => router.push(`?filter=${value}`)}
      data={[
        { label: 'My Tasks', value: 'active' },
        { label: 'Archive', value: 'done' },
      ]}
      fullWidth
      radius="md"
      color="dark"
    />
  );
}