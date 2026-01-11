'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function checkUser() {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error || !session) {
                    router.push('/login');
                    return;
                }
                setUser(session.user);
            } catch (err) {
                router.push('/login');
            } finally {
                setLoading(false);
            }
        }
        checkUser();
    }, [router]);

    if (loading) return <div className="min-h-screen bg-gray-50 pt-32 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20">
            <div className="container mx-auto px-4">

                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Mon Espace Parents</h1>
                        <p className="text-gray-600">Bienvenue, {user?.email}</p>
                    </div>
                    <Link href="/books" className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors">
                        + Nouvelle Histoire
                    </Link>
                </div>

                {/* Empty State / Content */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="text-6xl mb-6">📚</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Votre bibliothèque est vide</h2>
                    <p className="text-gray-500 max-w-md mx-auto mb-8">
                        Vous n'avez pas encore personnalisé d'histoires. Créez la première maintenant et voyez les yeux de votre enfant s'illuminer !
                    </p>
                    <Link href="/books" className="text-orange-500 font-bold hover:underline">
                        Découvrir le catalogue →
                    </Link>
                </div>

            </div>
        </div>
    );
}
