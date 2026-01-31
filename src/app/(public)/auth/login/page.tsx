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
import { Container, Title, Text } from '@mantine/core';
import { LoginForm } from './LoginForm';
import { PasswordLoginForm } from './PasswordLoginForm';

const isRunningLocal = process.env.IS_RUNNING_LOCAL === 'true';

export default function LoginPage() {
    return (
        <Container size={420} my={40}>
            <Title ta="center" className="mantine-font-family">
                Login or Create Account
            </Title>
            <Text c="dimmed" size="sm" ta="center" mt={5}>
                {isRunningLocal
                    ? 'Enter your email and password to login or create an account.'
                    : 'Enter your email to receive a magic link. If you don\'t have an account, one will be created for you.'}
            </Text>

            {isRunningLocal ? <PasswordLoginForm /> : <LoginForm />}
        </Container>
    );
}
