'use client'

import { useState, useRef, useEffect } from 'react'
import { useToast } from './ToastProvider';

export interface AutoItem { id: string; name: string, active?: boolean }

interface AutocompleteProps {
  items: AutoItem[]
  value: string
  onSelect: (item: { id: string | null, name: string }) => void
  placeholder?: string
}

export function Autocomplete({ items = [], value, onSelect, placeholder = "Search..." }: AutocompleteProps) {
    const { toast } = useToast()
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState(value)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => { setSearch(value) }, [value])

    const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) && i.active)

    useEffect(() => {
        function clickOutside(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false)
        }
        document.addEventListener("mousedown", clickOutside)
        return () => document.removeEventListener("mousedown", clickOutside)
    }, [])

    const handlePick = (item: AutoItem) => {
        setSearch(item.name)
        setIsOpen(false)
        onSelect({ id: item.id, name: item.name })
    }

    const handleCreate = () => {
        setIsOpen(false)
        onSelect({ id: null, name: search })
    }

    return (
        <div className="relative flex-1" ref={wrapperRef}>
            <input
                className="input input-bordered input-sm w-full"
                placeholder={placeholder}
                value={search}
                onFocus={() => setIsOpen(true)}
                onChange={(e) => {
                    setSearch(e.target.value)
                    setIsOpen(true)
                }}
            />

            {isOpen && search && (
                <ul className="absolute z-50 menu bg-base-100 w-full shadow-xl rounded-box mt-1 max-h-48 overflow-y-auto border border-base-200">
                    {filtered.map(item => (
                        <li key={item.id}>
                            <button type="button" onClick={() => handlePick(item)} className="capitalize">{item.name}</button>
                        </li>
                    ))}

                    {!items.some(i => i.name.toLowerCase() === search.toLowerCase()) && (
                        <li>
                            <button type="button" onClick={handleCreate} className="text-primary font-bold">
                                + Create "{search}"
                            </button>
                        </li>
                    )}
                </ul>
            )}
        </div>
    )
}