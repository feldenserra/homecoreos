import { Container, Title, Text, Anchor } from '@mantine/core';
import { ClientForm } from '@/app/(public)/auth/register/ClientForm'; // We should probably rename this to RegisterForm eventually
import Link from 'next/link';
import { ClientLinkAnchor } from '@/components/ClientLinkAnchor';

export default function RegisterPage() {
    return (
        <Container size="sm" py="xl">
            <Title ta="center" mb="xs">Create an Account</Title>
            <Text c="dimmed" size="sm" ta="center" mb="xl">
                Already have an account?{' '}
                Already have an account?{' '}
                <ClientLinkAnchor href="/auth/login" size="sm">
                    Login
                </ClientLinkAnchor>
            </Text>
            {/* The Form is the isolated client island */}
            <ClientForm />
        </Container>
    );
}
