import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50 p-4 font-sans text-center">
            <h1 className="text-6xl font-black text-white mb-4">404</h1>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 bg-white/90 p-4 rounded-xl shadow-lg">Oups ! Cette page n'existe pas.</h2>
            <Link
                href="/"
                className="bg-white text-orange-600 px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-all hover:scale-105"
            >
                Retour à l'accueil ✨
            </Link>
        </div>
    );
}
