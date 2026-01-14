import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AuthLayout({ children, title, subtitle }) {
    // 1. Array of images
    const backgroundImages = [
        '/images/auth-bg.jpg',   // Maman & Fille
        '/images/auth-bg-2.jpg'  // Papa & Fils
    ];

    // 2. Client-side random selection
    const [currentImage, setCurrentImage] = useState(backgroundImages[0]);

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * backgroundImages.length);
        setCurrentImage(backgroundImages[randomIndex]);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fff8f1] p-4 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'url(/images/pattern_bg.png)', backgroundSize: '400px' }}></div>

            <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10 min-h-[600px]">

                {/* Left Side: Image & Brand */}
                <div className="hidden md:block w-1/2 relative bg-orange-100">
                    <Image
                        src={currentImage}
                        alt="KusomaKids Moment"
                        fill
                        className="object-cover transition-opacity duration-1000"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-12 text-white">
                        <Link href="/" className="inline-block mb-4">
                            <span className="text-3xl font-bold tracking-tight">KusomaKids.</span>
                        </Link>
                        <p className="text-lg font-medium leading-relaxed opacity-90">
                            "L'héritage le plus précieux que vous pouvez donner à votre enfant, c'est la fierté de son identité."
                        </p>
                    </div>
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
        </div>
    );
}
