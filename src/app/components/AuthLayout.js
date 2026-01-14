import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({ children }) {
    // Use the auto-generated image if available in public folder, or a placeholder if not moved yet.
    // Since I generated it as artifact, I need to assume it is moved to public/images/auth-bg.png by the user or me.
    // I will use a relative path assuming I will move it.

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white">
            {/* Left Column: Immersion (Image + Overlay) */}
            <div className="w-full md:w-1/2 relative min-h-[300px] md:min-h-screen order-first">
                <Image
                    src="/images/auth-bg.jpg"
                    alt="Magical Storytelling"
                    fill
                    className="object-cover"
                    priority
                />
                {/* Dark Overlay - strengthened for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 flex flex-col justify-center items-center p-8 text-center backdrop-blur-[2px]">
                    <div className="max-w-md">
                        <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-6 drop-shadow-2xl">
                            "Un enfant qui lit est un adulte qui pense."
                        </h2>
                        <p className="text-lg md:text-xl text-white/95 font-medium drop-shadow-xl text-shadow-sm">
                            Offrons-leur des histoires où ils sont les héros de leur propre magie.
                        </p>
                    </div>
                </div>

                {/* Logo overlay on mobile only if needed, but usually redundant if header exists. 
            Design requested: "Colone de gauche ... Contenu" -> Desktop. 
            Mobile: "Empiler les éléments".
        */}
            </div>

            {/* Right Column: Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-orange-50/30">
                <div className="w-full max-w-md">
                    {children}

                    <div className="mt-8 text-center">
                        <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-orange-600 transition-colors gap-2 group">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Retour à l'accueil
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
