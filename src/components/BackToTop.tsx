'use client';

import { ActionIcon, Transition } from '@mantine/core';
import { IconArrowUp } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export function BackToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            // Show button when page is scrolled down 300px
            setIsVisible(window.scrollY > 300);
        };

        window.addEventListener('scroll', toggleVisibility, { passive: true });

        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <Transition transition="slide-up" duration={200} mounted={isVisible}>
            {(styles) => (
                <ActionIcon
                    onClick={scrollToTop}
                    size="lg"
                    radius="xl"
                    variant="default"
                    aria-label="Back to top"
                    style={{
                        ...styles,
                        position: 'fixed',
                        bottom: 20,
                        right: 20,
                        zIndex: 1000,
                    }}
                >
                    <IconArrowUp size={18} stroke={1.5} />
                </ActionIcon>
            )}
        </Transition>
    );
}
