'use client';

import { useState } from 'react';

export default function SettingsPage() {
    const [notifications, setNotifications] = useState({
        email_news: true,
        email_books: true
    });

    const handleToggle = (key) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
        // API call to save preferences would go here
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20">
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900 border-l-8 border-orange-500 pl-4 py-1">
                        Paramètres
                    </h1>
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 mb-8">
                    <h2 className="font-bold text-xl text-gray-900 mb-6">Notifications Email</h2>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-800">Nouveautés KusomaKids</h3>
                                <p className="text-sm text-gray-500">Recevoir des nouvelles sur les nouvelles histoires et fonctionnalités.</p>
                            </div>
                            <button
                                onClick={() => handleToggle('email_news')}
                                className={`w-12 h-7 rounded-full transition-colors relative ${notifications.email_news ? 'bg-orange-500' : 'bg-gray-200'}`}
                            >
                                <span className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transition-transform ${notifications.email_news ? 'translate-x-5' : ''}`}></span>
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-800">Rappels d'Histoires</h3>
                                <p className="text-sm text-gray-500">Recevoir un rappel quand votre crédit mensuel est disponible.</p>
                            </div>
                            <button
                                onClick={() => handleToggle('email_books')}
                                className={`w-12 h-7 rounded-full transition-colors relative ${notifications.email_books ? 'bg-orange-500' : 'bg-gray-200'}`}
                            >
                                <span className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transition-transform ${notifications.email_books ? 'translate-x-5' : ''}`}></span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Privacy & Danger Zone */}
                <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100">
                    <h2 className="font-bold text-xl text-gray-900 mb-6">Confidentialité & Sécurité</h2>

                    <button className="w-full text-left py-4 border-b border-gray-100 text-gray-700 hover:text-orange-600 font-medium transition-colors">
                        Changer de mot de passe
                    </button>

                    <div className="pt-6 mt-2">
                        <h3 className="font-bold text-red-600 mb-2">Zone de danger</h3>
                        <p className="text-sm text-gray-500 mb-4">La suppression de votre compte est irréversible. Toutes vos histoires seront perdues.</p>
                        <button
                            className="bg-red-50 text-red-600 border border-red-200 px-6 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors"
                            onClick={() => alert("Merci de contacter le support à hello@kusomakids.com pour supprimer votre compte.")}
                        >
                            Supprimer mon compte
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
