'use client';

import { Anchor, AnchorProps } from '@mantine/core';
import Link from 'next/link';
import { ReactNode } from 'react';

interface ClientLinkAnchorProps extends AnchorProps {
    href: string;
    children: ReactNode;
}

export function ClientLinkAnchor({ href, children, ...props }: ClientLinkAnchorProps) {
    return (
        <Anchor component={Link} href={href} {...props}>
            {children}
        </Anchor>
    );
}
