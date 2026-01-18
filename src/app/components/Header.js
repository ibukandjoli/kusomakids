'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useBookContext } from '../context/BookContext';
import { usePathname } from 'next/navigation';
import AppHeader from './AppHeader';

import { supabase } from '@/lib/supabase';

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const { cart } = useBookContext();
    const [user, setUser] = useState(null);
    const pathname = usePathname();

    const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(pathname);
    const isPreviewPage = pathname && pathname.includes('/preview');


    const [guestCount, setGuestCount] = useState(0);
    const [totalBadgeCount, setTotalBadgeCount] = useState(0);

    useEffect(() => {
        // Scroll handler
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);

        // Auth handler
        const syncGuestBooks = async () => {
            const stored = localStorage.getItem('guest_books');
            if (!stored) return;
            try {
                const books = JSON.parse(stored);
                if (Array.isArray(books) && books.length > 0) {
                    console.log("Syncing guest books...");
                    const res = await fetch('/api/books/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ guestBooks: books })
                    });
                    if (res.ok) {
                        console.log("Sync success");
                        localStorage.removeItem('guest_books');
                        setGuestCount(0);
                        window.dispatchEvent(new Event('guest_books_updated'));
                    }
                }
            } catch (e) { console.error("Sync failed", e); }
        };

        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
            if (session?.user) syncGuestBooks();
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
            if (session?.user) syncGuestBooks();
        });

        // Unified Badge Count Logic
        const updateBadgeCounts = () => {
            try {
                if (typeof window === 'undefined') return;

                // Only count cart_items (guest_books are legacy/pre-auth, not in cart)
                const cartItems = JSON.parse(localStorage.getItem('cart_items') || '[]');
                const cartCount = Array.isArray(cartItems) ? cartItems.length : 0;

                setTotalBadgeCount(cartCount);
            } catch (e) {
                console.error("Badge Update Error:", e);
            }
        };

        updateBadgeCounts(); // Initial check

        window.addEventListener('cart_updated', updateBadgeCounts);
        window.addEventListener('guest_books_updated', updateBadgeCounts);
        window.addEventListener('storage', updateBadgeCounts);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('cart_updated', updateBadgeCounts);
            window.removeEventListener('guest_books_updated', updateBadgeCounts);
            window.removeEventListener('storage', updateBadgeCounts);
            subscription?.unsubscribe();
        };
    }, []);


    // PROFILE FETCHING (For AppHeader)
    const [profile, setProfile] = useState(null);
    useEffect(() => {
        if (user) {
            const fetchProfile = async () => {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setProfile(data);
            };
            fetchProfile();
        }
    }, [user]);

    // Hide Header on Auth Pages and Preview Page
    if (isAuthPage || isPreviewPage) return null;

    // APP HEADER STRATEGY
    if (pathname && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
        return <AppHeader user={user} profile={profile} />;
    }

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 py-3'
                : 'bg-transparent py-5'
                }`}
        >
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl transition-all duration-300 ${isScrolled ? 'bg-orange-500 text-white' : 'bg-orange-500 text-white shadow-lg'
                            }`}>
                            K
                        </div>
                        <span className={`text-xl font-bold tracking-tight transition-colors duration-300 ${isScrolled ? 'text-gray-900' : 'text-gray-900'
                            }`}>
                            Kusoma<span className="text-orange-500">Kids</span>
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <nav className="hidden md:flex items-center space-x-8">
                        {[
                            { label: 'Bibliothèque', href: '/books' },
                            { label: 'Comment ça marche', href: '/#how-it-works' },
                            { label: 'Club Kusoma', href: '/club' },
                            { label: 'FAQ', href: '/#faq' }
                        ].map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`text-sm font-medium transition-colors duration-200 ${isScrolled ? 'text-gray-600 hover:text-orange-500' : 'text-gray-900 hover:text-orange-500'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center space-x-4">
                        {/* Cart Icon - Shopping Bag */}
                        <Link href="/checkout" className={`relative p-2 rounded-full transition-colors ${isScrolled ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-900 hover:bg-gray-100'
                            }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            {totalBadgeCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full px-1">
                                    {totalBadgeCount}
                                </span>
                            )}
                        </Link>

                        {/* Auth Buttons */}
                        {user ? (
                            <Link
                                href="/dashboard"
                                className={`hidden md:inline-flex items-center justify-center px-5 py-2 text-sm font-bold rounded-full transition-all duration-300 ${isScrolled
                                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                                    : 'bg-orange-600 text-white hover:bg-orange-500 shadow-lg'
                                    }`}
                            >
                                Mon Espace
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </Link>
                        ) : (
                            <div className="hidden md:flex items-center gap-4">
                                <Link
                                    href="/login"
                                    className={`text-sm font-bold transition-colors ${isScrolled ? 'text-gray-900 hover:text-orange-500' : 'text-gray-900 hover:text-orange-500'}`}
                                >
                                    Se connecter
                                </Link>
                                <Link
                                    href="/signup"
                                    className={`inline-flex items-center justify-center px-5 py-2 text-sm font-bold rounded-full transition-all duration-300 ${isScrolled
                                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                                        : 'bg-orange-600 text-white hover:bg-orange-500 shadow-lg'
                                        }`}
                                >
                                    Rejoindre le Club
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                    </svg>
                                </Link>
                            </div>
                        )}

                        {/* Mobile Toggle */}
                        <button
                            className={`md:hidden p-2 rounded-lg ${isScrolled ? 'text-gray-900' : 'text-gray-900'}`}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-4 md:hidden shadow-xl animate-slideUp">
                        <nav className="flex flex-col space-y-4">
                            {[
                                { label: 'Bibliothèque', href: '/books' },
                                { label: 'Comment ça marche', href: '/#how-it-works' },
                                { label: 'Club Kusoma', href: '/club' },
                                { label: 'FAQ', href: '/#faq' }
                            ].map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="font-medium text-gray-600 hover:text-orange-500 block py-2"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            ))}

                            <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                                {user ? (
                                    <Link
                                        href="/dashboard"
                                        className="bg-orange-500 text-white px-4 py-3 rounded-xl text-center font-bold shadow-lg shadow-orange-500/30 flex items-center justify-center"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Mon Espace
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 ml-2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href="/login"
                                            className="text-gray-900 font-bold py-2 text-center"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Se connecter
                                        </Link>
                                        <Link
                                            href="/signup"
                                            className="bg-orange-500 text-white px-4 py-3 rounded-xl text-center font-bold shadow-lg shadow-orange-500/30 flex items-center justify-center"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Rejoindre le Club
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 ml-2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                            </svg>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
