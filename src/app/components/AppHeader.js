'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserDropdown from './UserDropdown';

export default function AppHeader({ user, profile }) {
    const pathname = usePathname();

    const isActive = (path) => {
        if (path === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(path);
    };

    return (
        <header className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 h-20">
            <div className="container mx-auto px-4 h-full flex items-center justify-between">

                {/* LEFT: Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <span className="text-2xl font-black text-gray-900 tracking-tighter group-hover:text-orange-500 transition-colors">
                        Kusoma<span className="text-orange-500 group-hover:text-gray-900 transition-colors">Kids</span>
                    </span>
                    {profile?.subscription_status === 'active' && (
                        <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm transform -rotate-2 ml-1">
                            Club
                        </span>
                    )}
                </Link>

                {/* CENTER: Navigation */}
                {/* CENTER: Navigation */}
                <nav className="hidden md:flex items-center gap-1 bg-gray-100/50 p-1.5 rounded-full border border-gray-200/50">
                    {pathname.startsWith('/admin') ? (
                        <>
                            <Link
                                href="/admin"
                                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${pathname === '/admin'
                                    ? 'bg-white shadow-sm text-gray-900'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                            >
                                Vue d'ensemble
                            </Link>
                            <Link
                                href="/admin/books"
                                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${pathname.startsWith('/admin/books')
                                    ? 'bg-white shadow-sm text-gray-900'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                            >
                                Histoires
                            </Link>
                            <Link
                                href="/admin/users"
                                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${pathname.startsWith('/admin/users')
                                    ? 'bg-white shadow-sm text-gray-900'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                            >
                                Utilisateurs
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/dashboard"
                                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${isActive('/dashboard') && !pathname.includes('purchased')
                                    ? 'bg-white shadow-sm text-gray-900'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                            >
                                Mes Histoires
                            </Link>
                            <Link
                                href="/dashboard/purchased"
                                className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${isActive('/dashboard/purchased')
                                    ? 'bg-white shadow-sm text-gray-900'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                            >
                                <span>📚</span>
                                Mes PDFs
                            </Link>
                        </>
                    )}
                </nav>

                {/* RIGHT: Actions */}
                <div className="flex items-center gap-4">

                    {/* Club Logic for Buttons */}
                    {profile?.subscription_status === 'active' ? (
                        <>
                            {/* Desktop: 2 Buttons */}
                            <div className="hidden md:flex items-center gap-3">
                                <Link
                                    href="/books"
                                    className="flex items-center gap-2 bg-orange-100 text-orange-600 hover:bg-orange-200 px-4 py-2.5 rounded-full font-bold text-sm transition-all"
                                >
                                    <span>📖</span>
                                    Choisir une histoire
                                </Link>
                                <Link
                                    href="/dashboard/create"
                                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all"
                                >
                                    <span>✨</span>
                                    Créer une histoire
                                </Link>
                            </div>

                            {/* Mobile: 1 Button (Create) + Icon (Library) - HIDDEN as per user request (moved to BottomNav) */}
                        </>
                    ) : (
                        // Non-Club: Just "Choose Story" (renamed from + Nouvelle Histoire)
                        <Link
                            href="/books"
                            className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all"
                        >
                            <span>📖</span>
                            <span className="hidden md:inline">Choisir une histoire</span>
                            <span className="md:hidden">+</span>
                        </Link>
                    )}

                    <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>

                    <UserDropdown user={user} profile={profile} />
                </div>
            </div>
        </header>
    );
}
