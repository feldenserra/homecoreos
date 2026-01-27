'use client';

import { useState, useEffect } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Paper, Stack, TextInput, Textarea, Button, Text, ActionIcon, Group, LoadingOverlay, Alert, Box, Title, Modal } from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { createAchievement, deleteAchievement, Achievement, getAchievements } from '@/lib/repositories/achievementsRepository';

// Sticky Note Functionality
const COLORS = ['#ffeb3b', '#ffc107', '#ff9800', '#ffcdd2', '#f8bbd0', '#e1bee7', '#d1c4e9', '#c5cae9', '#bbdefb', '#b3e5fc', '#b2ebf2', '#b2dfdb', '#c8e6c9', '#dcedc8', '#f0f4c3', '#fff9c4'];

interface StickyNote extends Achievement {
    x: number;
    y: number;
    rotation: number;
    color: string;
}

export function AchievementsView() {
    const [achievements, setAchievements] = useState<StickyNote[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState<{ title: string; message: string; color: string } | null>(null);

    // Modal state
    const [opened, { open, close }] = useDisclosure(false);

    // Random Position Generator
    const getRandomPosition = () => {
        // Full range 5% to 85%
        let x, y;
        let attempts = 0;

        do {
            x = Math.random() * 80 + 5;
            y = Math.random() * 80 + 5;
            attempts++;

            // Avoid bottom-left corner where the FAB is (0-20% X, 80-100% Y)
            const isBottomLeft = x < 20 && y > 75;

            if (!isBottomLeft) {
                break;
            }
        } while (attempts < 50);

        return { x, y };
    };

    const loadAchievements = async () => {
        setLoading(true);
        try {
            const data = await getAchievements();

            setAchievements(currentStickyNotes => {
                // Create a map of existing notes for quick lookup
                const existingMap = new Map(currentStickyNotes.map(note => [note.id, note]));

                return data.map(item => {
                    // if we already have this note, keep its visual properties
                    if (existingMap.has(item.id)) {
                        return {
                            ...item,
                            x: existingMap.get(item.id)!.x,
                            y: existingMap.get(item.id)!.y,
                            rotation: existingMap.get(item.id)!.rotation,
                            color: existingMap.get(item.id)!.color
                        };
                    }

                    // otherwise generate new randoms
                    const { x, y } = getRandomPosition();
                    return {
                        ...item,
                        x,
                        y,
                        rotation: Math.random() * 10 - 5,
                        color: COLORS[Math.floor(Math.random() * COLORS.length)]
                    };
                });
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAchievements();
    }, []);

    const handleSubmit = async () => {
        if (!title.trim()) return;

        setSubmitting(true);
        setAlert(null);
        try {
            const newAch = await createAchievement(title, description);
            if (newAch) {
                const { x, y } = getRandomPosition();
                const sticky: StickyNote = {
                    ...newAch,
                    x,
                    y,
                    rotation: Math.random() * 10 - 5,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)]
                };
                setAchievements(prev => [...prev, sticky]);

                setTitle('');
                setDescription('');
                close();
            }
        } catch (error) {
            console.error(error);
            setAlert({ title: 'Error', message: 'Failed to save.', color: 'red' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Forget this achievement?')) return;
        const success = await deleteAchievement(id);
        if (success) {
            setAchievements(prev => prev.filter(a => a.id !== id));
        }
    };

    return (
        <Box w="100%" h="calc(100vh - 80px)" pos="relative" style={{ overflow: 'hidden' }}>
            <Text
                pos="absolute" top="5%" left="50%"
                style={{ transform: 'translateX(-50%)', opacity: 0.1, fontSize: '3rem', fontWeight: 900, zIndex: 0 }}
                ta="center"
            >
                WALL OF ACHIEVEMENTS
            </Text>

            {/* Sticky Notes */}
            {achievements.map((note) => (
                <Paper
                    key={note.id}
                    shadow="xl"
                    p="md"
                    w={{ base: 180, sm: 220 }} // Responsive width
                    pos="absolute"
                    style={{
                        top: `${note.y}%`,
                        left: `${note.x}%`,
                        transform: `rotate(${note.rotation}deg)`,
                        backgroundColor: note.color,
                        zIndex: 1,
                        boxShadow: '5px 5px 15px rgba(0,0,0,0.2)'
                    }}
                >
                    <Group justify="space-between" align="start" mb="xs">
                        <Text size="xl">{note.icon}</Text>
                        <ActionIcon
                            size="sm"
                            variant="transparent"
                            color="dark"
                            onClick={() => handleDelete(note.id)}
                            style={{ opacity: 0.5 }}
                        >
                            <IconTrash size={14} />
                        </ActionIcon>
                    </Group>
                    <Text fw={700} style={{ fontFamily: 'cursive, sans-serif' }} lineClamp={2} mb="xs">
                        {note.title}
                    </Text>
                    {note.description && (
                        <Text size="sm" lineClamp={3}>
                            {note.description}
                        </Text>
                    )}
                    <Text size="xs" c="dimmed" mt="sm" ta="right">
                        {new Date(note.achieved_at || '').toLocaleDateString()}
                    </Text>
                </Paper>
            ))}

            {loading && (
                <Text pos="absolute" bottom="20px" left="20px">Loading achievements...</Text>
            )}

            {/* FAB for Adding Achievement */}
            <ActionIcon
                onClick={open}
                radius="xl"
                size={60}
                pos="absolute"
                bottom={30}
                right={30} // Moved to bottom-right of the container
                style={{
                    zIndex: 100,
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                    backgroundColor: 'rgba(57, 108, 205, 0.25)', // Semi-transparent blue
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    color: '#396ccd' // Muted shiny text color
                }}
            >
                <IconPlus size={32} />
            </ActionIcon>

            {/* Input Modal */}
            <Modal opened={opened} onClose={close} title="Add New Achievement" centered zIndex={200}>
                <Stack gap="md">
                    <LoadingOverlay visible={submitting} />
                    {alert && (
                        <Alert variant="light" color={alert.color} title={alert.title} py="xs" style={{ width: '100%' }}>
                            {alert.message}
                        </Alert>
                    )}

                    <TextInput
                        placeholder="What did you achieve?"
                        label="Title"
                        required
                        w="100%"
                        value={title}
                        onChange={(e) => setTitle(e.currentTarget.value)}
                        data-autofocus
                    />
                    <Textarea
                        placeholder="Details (optional)..."
                        label="Description"
                        w="100%"
                        minRows={3}
                        value={description}
                        onChange={(e) => setDescription(e.currentTarget.value)}
                    />
                    <Button onClick={handleSubmit} fullWidth color="blue">
                        Post to Wall
                    </Button>
                </Stack>
            </Modal>
        </Box>
    );
}
