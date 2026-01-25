'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CoreStack } from './CoreStack'
import { CoreItem } from './CoreItem'

export default function Sidebar() {
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path ? 'active' : ''

    return (
        <aside className="w-50 bg-base-100 border-r border-base-300 min-h-screen flex flex-col">
            <CoreStack justify='between'>
                <CoreItem>
                    <div className="p-6 text-2xl font-bold text-primary">HomeCoreOS</div>
                    <ul className="menu p-4 w-full text-base-content gap-2">

                        {/* Navigation Links */}
                        <li>
                            <Link href="/" className={isActive('/')}>
                                Task Manager
                            </Link>
                        </li>
                        <li>
                            <Link href="/recipes" className={isActive('/recipes')}>
                                Recipes
                            </Link>
                        </li>
                        <li>
                            <Link href="/calendar" className={isActive('/calendar')}>
                                Calendar
                            </Link>
                        </li>
                        <li>
                            <Link href="/settings" className={isActive('/settings')}>
                                Settings
                            </Link>
                        </li>
                    </ul>
                </CoreItem>
                <CoreItem>
                    <div>v0.2</div>
                </CoreItem>
            </CoreStack>
        </aside>
    )
}