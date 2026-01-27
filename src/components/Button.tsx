import { Button as MantineButton, ButtonProps as MantineButtonProps } from '@mantine/core';

interface ButtonProps extends MantineButtonProps {
    // Add any project-specific props here if needed
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
}

export function Button(props: ButtonProps) {
    return <MantineButton {...props} />;
}
