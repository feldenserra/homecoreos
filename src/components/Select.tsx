import { Select as MantineSelect, SelectProps as MantineSelectProps } from '@mantine/core';

interface SelectProps extends MantineSelectProps {
    // Add any project-specific props here if needed
}

export function Select(props: SelectProps) {
    return <MantineSelect {...props} />;
}
