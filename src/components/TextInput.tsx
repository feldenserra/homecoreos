import { TextInput as MantineTextInput, TextInputProps as MantineTextInputProps } from '@mantine/core';

interface TextInputProps extends MantineTextInputProps {
    // Add any project-specific props here if needed
}

export function TextInput(props: TextInputProps) {
    return <MantineTextInput {...props} />;
}
