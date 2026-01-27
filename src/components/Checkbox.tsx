import { Checkbox as MantineCheckbox, CheckboxProps as MantineCheckboxProps } from '@mantine/core';

interface CheckboxProps extends MantineCheckboxProps {
    // Add any project-specific props here if needed
}

export function Checkbox(props: CheckboxProps) {
    return <MantineCheckbox {...props} />;
}
