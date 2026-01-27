import { Group, Button } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';

interface DateRangeFilterProps {
    value: [Date | null, Date | null];
    onChange: (value: [Date | null, Date | null]) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
    const setPreset = (months: number) => {
        const end = dayjs().endOf('day').toDate();
        const start = dayjs().subtract(months, 'month').startOf('day').toDate();
        onChange([start, end]);
    };

    const setThisMonth = () => {
        onChange([
            dayjs().startOf('month').toDate(),
            dayjs().endOf('month').toDate(),
        ]);
    };

    return (
        <Group>
            <Button variant="default" size="xs" onClick={setThisMonth}>This Month</Button>
            <Button variant="default" size="xs" onClick={() => setPreset(3)}>Last 3 Months</Button>
            <Button variant="default" size="xs" onClick={() => setPreset(6)}>Last 6 Months</Button>
            <Button variant="default" size="xs" onClick={() => setPreset(12)}>Last Year</Button>

            <DatePickerInput
                type="range"
                placeholder="Pick dates range"
                value={value}
                onChange={onChange}
                w={250}
                clearable
            />
        </Group>
    );
}
