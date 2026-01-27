'use client';

import { Button, ButtonProps } from '@mantine/core';
import Link from 'next/link';
import { ReactNode } from 'react';

interface ClientLinkButtonProps extends ButtonProps {
    href: string;
    children: ReactNode;
}

export function ClientLinkButton({ href, children, ...props }: ClientLinkButtonProps) {
    return (
        <Button component={Link} href={href} {...props}>
            {children}
        </Button>
    );
}
