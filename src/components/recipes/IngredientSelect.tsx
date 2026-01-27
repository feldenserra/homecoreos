'use client';

import { useState, useEffect } from 'react';
import { Combobox, TextInput, useCombobox, Loader, Group, Text, ActionIcon } from '@mantine/core';
import { IconSearch, IconPlus } from '@tabler/icons-react';
import { getAllIngredients, createIngredient, Ingredient } from '@/lib/repositories/recipesRepository';

interface IngredientSelectProps {
    excludedIds?: string[];
    onSelect: (ingredient: Ingredient) => void;
}

export function IngredientSelect({ excludedIds = [], onSelect }: IngredientSelectProps) {
    const combobox = useCombobox({
        onDropdownClose: () => {
            combobox.resetSelectedOption();
            // FIXED: Removed recursive combobox.closeDropdown() here.
            setSearch('');
            // We don't clear data here anymore, we keep the filtered view or reset it?
            // Actually let's just keep the search reset.
        },
    });

    const [loading, setLoading] = useState(false);
    // allIngredients stores the full list from DB
    const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
    // filteredIngredients is what we show
    const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
    const [search, setSearch] = useState('');
    const [creating, setCreating] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Initial load
    useEffect(() => {
        const load = async () => {
            if (!initialized) {
                setLoading(true);
                try {
                    const ingredients = await getAllIngredients();
                    setAllIngredients(ingredients);
                    setFilteredIngredients(ingredients);
                    } catch (error) {
                        console.error('Failed to load ingredients', error);
                    } finally {
                        setLoading(false);
                        setInitialized(true);
                    }
                };
            }
            load();
        }, []);

    // Filter whenever search or allIngredients changes
    useEffect(() => {
        const query = search.toLowerCase().trim();
        const filtered = allIngredients.filter(item => {
            if (excludedIds.includes(item.id)) return false;
            if (!query) return false; // Don't show everything when empty, only on search? 
            // Or maybe show recent? For now let's match behavior: show only on search or click?
            // User asked "read it form the local list".
            // Let's matching by name.
            return item.name.toLowerCase().includes(query);
        });

        // If search is empty, maybe we don't show anything? 
        // Or we show all (minus excluded)? 
        // Let's show empty if no search to keep it clean, unless user clicks?
        // Actually, if we want "Create ... at the bottom as you type", we need to filter.

        if (!query) {
            setFilteredIngredients([]);
        } else {
            setFilteredIngredients(filtered);
        }

    }, [search, allIngredients, excludedIds]);


    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const val = event.currentTarget.value;
        setSearch(val);
        combobox.openDropdown();
    };

    const handleCreate = async () => {
        const trimmedSearch = search.trim();
        if (!trimmedSearch) return;

        // Standardize: First letter uppercase, rest lowercase (Sentence case)
        const standardizedName = trimmedSearch.charAt(0).toUpperCase() + trimmedSearch.slice(1).toLowerCase();

        setCreating(true);
        try {
            const newIngredient = await createIngredient(standardizedName);
            if (newIngredient) {
                // Add to local list immediately
                setAllIngredients(prev => [...prev, newIngredient]);
                onSelect(newIngredient);
                combobox.closeDropdown();
                setSearch('');
            }
        } catch (error) {
            console.error('Failed to create ingredient', error);
        } finally {
            setCreating(false);
        }
    };

    // Check if exact match exists in the *entire* list, not just filtered results
    const exactMatch = allIngredients.some(item => item.name.toLowerCase() === search.trim().toLowerCase());
    const showCreate = search.trim().length > 0 && !exactMatch;
    const shouldShowDropdown = search.trim().length > 0;

    return (
        <Combobox
            store={combobox}
            onOptionSubmit={(val) => {
                if (val === '$create') {
                    handleCreate();
                } else {
                    const selected = allIngredients.find(i => i.id === val);
                    if (selected) {
                        onSelect(selected);
                        combobox.closeDropdown();
                        setSearch('');
                    }
                }
            }}
        >
            <Combobox.Target>
                <TextInput
                    leftSection={<IconSearch size={16} />}
                    rightSection={
                        (loading && !initialized) || creating ? <Loader size={18} /> : null
                    }
                    placeholder="Search or create ingredient..."
                    value={search}
                    onChange={handleChange}
                    onClick={() => combobox.openDropdown()}
                    onFocus={() => combobox.openDropdown()}
                    onBlur={() => combobox.closeDropdown()}
                />
            </Combobox.Target>

            <Combobox.Dropdown>
                <Combobox.Options>
                    {shouldShowDropdown && filteredIngredients.map((item) => (
                        <Combobox.Option value={item.id} key={item.id}>
                            <Group justify="space-between">
                                <Text>{item.name}</Text>
                            </Group>
                        </Combobox.Option>
                    ))}

                    {shouldShowDropdown && filteredIngredients.length === 0 && !creating && !showCreate && (
                        <Combobox.Empty>No results found</Combobox.Empty>
                    )}

                    {showCreate && (
                        <Combobox.Option value="$create">
                            <Group gap="xs">
                                <IconPlus size={16} />
                                <Text>Create "{search}"</Text>
                            </Group>
                        </Combobox.Option>
                    )}
                </Combobox.Options>
            </Combobox.Dropdown>
        </Combobox>
    );
}
