'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function UserDropdown({ user, profile }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const router = useRouter();

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push('/');
    };

    // Get Avatar or Initials
    const initials = (profile?.full_name || user?.email || 'U').substring(0, 2).toUpperCase();
    const avatarUrl = profile?.avatar_url;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1 pr-3 rounded-full border border-gray-200 hover:shadow-md transition-all bg-white"
            >
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold overflow-hidden border-2 border-white">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <span>{initials}</span>
                    )}
                </div>
                <div className="hidden md:block text-left">
                    <p className="text-xs font-bold text-gray-900 leading-none">{profile?.full_name || 'Mon Compte'}</p>
                    <p className="text-[10px] text-gray-500 leading-none mt-1">Gérer</p>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 transform origin-top-right transition-all">

                    {/* Header in Dropdown */}
                    <div className="px-4 py-3 border-b border-gray-100 mb-2">
                        <p className="font-bold text-gray-900 truncate">{profile?.full_name || 'Utilisateur'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>

                    <Link href="/dashboard/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                        <span className="text-lg">👤</span>
                        Mon Profil
                    </Link>

                    <Link href="/dashboard/billing" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                        <span className="text-lg">💳</span>
                        Facturation & Crédits
                        {profile?.credits > 0 && (
                            <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">{profile.credits} crédits</span>
                        )}
                    </Link>

                    <Link href="/dashboard/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                        <span className="text-lg">⚙️</span>
                        Paramètres
                    </Link>

                    {/* Admin Link - Only visible to admins/viewers OR specific email */}
                    {(profile?.role === 'admin' || profile?.role === 'viewer' || user?.email === 'ibuka.ndjoli@gmail.com') && (
                        <>
                            <div className="h-px bg-gray-100 my-2"></div>
                            <Link href="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors font-bold">
                                <span className="text-lg">⚡️</span>
                                Administration
                            </Link>
                        </>
                    )}

                    <div className="h-px bg-gray-100 my-2"></div>

                    <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <span className="text-lg">🚪</span>
                        Se déconnecter
                    </button>
                </div>
            )}
        </div>
    );
}
