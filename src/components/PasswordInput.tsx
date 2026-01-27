import { PasswordInput as MantinePasswordInput, PasswordInputProps as MantinePasswordInputProps } from '@mantine/core';

interface PasswordInputProps extends MantinePasswordInputProps {
    // Add any project-specific props here if needed
}

export function PasswordInput(props: PasswordInputProps) {
    return <MantinePasswordInput {...props} />;
}
