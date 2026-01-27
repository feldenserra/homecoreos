import { Container, Title, Text, Anchor } from '@mantine/core';
import Link from 'next/link';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
    return (
        <Container size={420} my={40}>
            <Title ta="center" className="mantine-font-family">
                Welcome back!
            </Title>
            <Text c="dimmed" size="sm" ta="center" mt={5}>
                Do not have an account yet?{' '}
                <Link href="/auth/register" passHref legacyBehavior>
                    <Anchor component="a" size="sm">
                        Create account
                    </Anchor>
                </Link>
            </Text>

            <LoginForm />
        </Container>
    );
}
