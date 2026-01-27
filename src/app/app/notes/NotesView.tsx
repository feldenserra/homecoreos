'use client';

import { useState, useEffect } from 'react';
import { Container, Title, Paper, Stack, Textarea, Button, Tabs, Text, Group, LoadingOverlay, Alert, ActionIcon, ScrollArea, Box } from '@mantine/core';
import { IconNote, IconHistory, IconInfoCircle, IconTrash, IconPencil } from '@tabler/icons-react';
import { createNote, getNotes, deleteNote, Note } from '@/lib/repositories/notesRepository';

export function NotesView() {
    const [activeTab, setActiveTab] = useState<string | null>('new');
    const [noteText, setNoteText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [notes, setNotes] = useState<Note[]>([]);
    const [alert, setAlert] = useState<{ title: string; message: string; color: string } | null>(null);

    const loadHistory = async () => {
        setLoadingHistory(true);
        try {
            const data = await getNotes();
            setNotes(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Load history when tab changes to history
    useEffect(() => {
        if (activeTab === 'history') {
            loadHistory();
        }
    }, [activeTab]);

    const handleSubmit = async () => {
        if (!noteText.trim()) return;

        setSubmitting(true);
        setAlert(null);
        try {
            const newNote = await createNote(noteText);
            if (newNote) {
                setAlert({ title: 'Success', message: 'Note saved successfully!', color: 'green' });
                setNoteText('');
                // If we implemented a shared state/cache we'd update it here, but for now we just clear.
            } else {
                setAlert({ title: 'Error', message: 'Failed to save note.', color: 'red' });
            }
        } catch (error) {
            console.error(error);
            setAlert({ title: 'Error', message: 'An unexpected error occurred.', color: 'red' });
        } finally {
            setSubmitting(false);
            setTimeout(() => setAlert(null), 3000);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this note?')) return;

        const success = await deleteNote(id);
        if (success) {
            setNotes(notes.filter(n => n.id !== id));
        }
    };

    return (
        <Container size="xl" py="xl" h="calc(100vh - 80px)">
            <Stack h="100%" gap="md">
                <Title order={1}>Daily Notes</Title>

                <Tabs
                    value={activeTab}
                    onChange={setActiveTab}
                    variant="outline"
                    radius="md"
                    style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
                >
                    <Tabs.List mb="md" style={{ flexShrink: 0 }}>
                        <Tabs.Tab value="new" leftSection={<IconPencil size={16} />}>
                            New Note
                        </Tabs.Tab>
                        <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
                            History
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="new" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        <ScrollArea h="100%" type="scroll">
                            <Box pb="xl">
                                <Paper withBorder p="md" radius="md" pos="relative">
                                    <LoadingOverlay visible={submitting} />
                                    <Stack>
                                        {alert && (
                                            <Alert variant="light" color={alert.color} title={alert.title} icon={<IconInfoCircle />} onClose={() => setAlert(null)} withCloseButton>
                                                {alert.message}
                                            </Alert>
                                        )}
                                        <Textarea
                                            placeholder="What's on your mind today?"
                                            value={noteText}
                                            onChange={(e) => setNoteText(e.currentTarget.value)}
                                            minRows={6}
                                            autosize
                                            label="Today's Note"
                                        />
                                        <Group justify="flex-end">
                                            <Button onClick={handleSubmit} disabled={!noteText.trim()}>
                                                Submit Note
                                            </Button>
                                        </Group>
                                    </Stack>
                                </Paper>
                            </Box>
                        </ScrollArea>
                    </Tabs.Panel>

                    <Tabs.Panel value="history" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        <ScrollArea h="100%" type="scroll">
                            <Box pb="xl">
                                {loadingHistory ? (
                                    <Text>Loading history...</Text>
                                ) : (
                                    <Stack gap="md">
                                        {notes.length === 0 && <Text c="dimmed">No notes found.</Text>}
                                        {notes.map(note => (
                                            <Paper key={note.id} withBorder p="md" radius="md">
                                                <Group justify="space-between" mb="xs">
                                                    <Text size="sm" c="dimmed">
                                                        {new Date(note.created_at || '').toLocaleString()}
                                                    </Text>
                                                    <ActionIcon color="red" variant="subtle" onClick={() => handleDelete(note.id)}>
                                                        <IconTrash size={16} />
                                                    </ActionIcon>
                                                </Group>
                                                <Text style={{ whiteSpace: 'pre-line' }}>{note.note}</Text>
                                            </Paper>
                                        ))}
                                    </Stack>
                                )}
                            </Box>
                        </ScrollArea>
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Container>
    );
}
