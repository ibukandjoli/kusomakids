'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');

    return (
        <div className="min-h-screen bg-[#FFF9F5] flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-lg w-full text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🎉</span>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">Commande Confirmée !</h1>
                <p className="text-lg text-gray-600 mb-8">
                    Merci pour votre commande. La magie est en train d'opérer pour créer votre histoire unique.
                </p>

                <div className="text-left bg-orange-50 p-6 rounded-xl border border-orange-100 mb-8">
                    <h3 className="font-bold text-orange-800 mb-4 flex items-center">
                        <span className="bg-orange-200 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs">📧</span>
                        Prochaines étapes :
                    </h3>
                    <ul className="space-y-4 text-sm text-gray-700">
                        <li className="flex items-start gap-3">
                            <span className="bg-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-orange-500 shadow-sm flex-shrink-0">1</span>
                            <span>
                                <strong>Consultez votre boîte mail</strong> : Vous avez reçu un email avec un lien pour télécharger votre PDF. Le lien est valable 30 jours.
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="bg-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-orange-500 shadow-sm flex-shrink-0">2</span>
                            <span>
                                <strong>Créez votre compte KusomaKids</strong> : Pour lire l'histoire en streaming (avec audio) et retrouver tous vos PDFs en un clic.
                            </span>
                        </li>
                    </ul>
                </div>

                <a
                    href="https://mail.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-orange-500 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition-transform hover:scale-105 shadow-lg shadow-orange-500/30"
                >
                    📧 Ouvrir Gmail
                </a>

                <p className="mt-6 text-xs text-gray-400">
                    Un souci ? Contactez-nous à coucou@kusomakids.com
                </p>
            </div>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
