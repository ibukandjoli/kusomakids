import Link from 'next/link';

export default function PageLayout({ title, children }) {
    return (
        <div className="min-h-screen pt-32 pb-20 relative bg-[#FAFAF8]">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'url(/images/pattern_bg.png)', backgroundSize: '400px' }}></div>

            <div className="container mx-auto px-4 relative z-10 max-w-4xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
                </div>

                <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100/50">
                    <div className="prose prose-orange max-w-none text-gray-600 leading-relaxed">
                        {children}
                    </div>
                </div>

                <div className="text-center mt-12">
                    <Link href="/" className="text-orange-600 font-bold hover:text-orange-700 transition-colors">
                        ← Retour à l'accueil
                    </Link>
                </div>
            </div>
        </div>
    );
}
