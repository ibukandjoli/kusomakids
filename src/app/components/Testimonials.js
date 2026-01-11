'use client';

import { useState, useEffect } from 'react';

const testimonials = [
    {
        id: 1,
        name: "Aminata D.",
        role: "Maman de 2 enfants",
        text: "J'ai pleuré en voyant la réaction de mon fils. Il n'en revenait pas d'être le héros. C'est bien plus qu'un livre, c'est un souvenir pour la vie.",
        stars: 5,
        avatar: "👩🏾"
    },
    {
        id: 2,
        name: "Marc L.",
        role: "Papa de Lucas",
        text: "Une qualité incroyable et une histoire qui a vraiment captivé mon fils. Il demande à le lire tous les soirs !",
        stars: 5,
        avatar: "👨🏿"
    },
    {
        id: 3,
        name: "Sophie T.",
        role: "Marraine gaga",
        text: "Le cadeau parfait pour l'anniversaire de ma nièce. Elle a adoré se voir en princesse africaine.",
        stars: 5,
        avatar: "👩🏽"
    }
];

export default function Testimonials({ darkMode = false }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        }, 5000); // Change every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const current = testimonials[currentIndex];

    return (
        <div className="w-full max-w-4xl mx-auto px-4 text-center">
            <div className="relative min-h-[300px] flex flex-col items-center justify-center animate-fadeIn transition-all duration-500">

                {/* Quote Icon */}
                <div className={`text-6xl font-serif mb-6 ${darkMode ? 'text-orange-500' : 'text-orange-300'}`}>"</div>

                {/* Text */}
                <p className={`text-xl md:text-3xl font-medium leading-relaxed mb-8 italic ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {current.text}
                </p>

                {/* Author */}
                <div className="flex items-center justify-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg ${darkMode ? 'bg-gray-800 border-2 border-orange-500' : 'bg-white border-2 border-orange-200'}`}>
                        {current.avatar}
                    </div>
                    <div className="text-left">
                        <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{current.name}</p>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{current.role}</span>
                            <div className="flex text-yellow-400 text-xs">{"★".repeat(current.stars)}</div>
                        </div>
                    </div>
                </div>

                {/* Dots Indicators */}
                <div className="flex justify-center gap-3 mt-10">
                    {testimonials.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-orange-500 w-8' : (darkMode ? 'bg-gray-700' : 'bg-gray-300')}`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>

            </div>
        </div>
    );
}
