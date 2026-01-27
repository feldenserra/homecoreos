/*
    Copyright (C) 2026 feldenserra

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import { Container, Title, Text, Anchor } from '@mantine/core';
import Link from 'next/link';
import { LoginForm } from './LoginForm';
import { ClientLinkAnchor } from '@/components/ClientLinkAnchor';

export default function LoginPage() {
    return (
        <Container size={420} my={40}>
            <Title ta="center" className="mantine-font-family">
                Welcome back!
            </Title>
            <Text c="dimmed" size="sm" ta="center" mt={5}>
                Do not have an account yet?{' '}
                Do not have an account yet?{' '}
                <ClientLinkAnchor href="/auth/register" size="sm">
                    Create account
                </ClientLinkAnchor>
            </Text>

            <LoginForm />
        </Container>
    );
}
