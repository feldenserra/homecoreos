import { Container, Title, Text, Anchor } from '@mantine/core';
import { ClientForm } from '@/components/ClientForm'; // We should probably rename this to RegisterForm eventually
import Link from 'next/link';

export default function RegisterPage() {
    return (
        <Container size="sm" py="xl">
            <Title ta="center" mb="xs">Create an Account</Title>
            <Text c="dimmed" size="sm" ta="center" mb="xl">
                Already have an account?{' '}
                <Link href="/auth/login" passHref legacyBehavior>
                    <Anchor size="sm" component="a">
                        Login
                    </Anchor>
                </Link>
            </Text>
            {/* The Form is the isolated client island */}
            <ClientForm />
        </Container>
    );
}
