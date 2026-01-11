'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import BookPdf from '../components/BookPdf';

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    {
        ssr: false,
        loading: () => <button className="bg-gray-400 text-white px-6 py-3 rounded-full font-bold shadow-lg">Chargement du PDF...</button>,
    }
);

export default function TestStoryPage() {
    const [formData, setFormData] = useState({
        childName: '',
        childAge: '5',
        gender: 'Garçon',
        theme: 'Voyage dans l\'espace'
    });

    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // États pour le Mode Lecture
    const [isReading, setIsReading] = useState(false);
    const [currentReadingPage, setCurrentReadingPage] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setStory(null);

        try {
            const res = await fetch('/api/generate-story', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erreur inconnue');
            }

            setStory(data.story);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Gestion de l'édition du texte
    const handleTextChange = (pageIndex, newText) => {
        const newStory = { ...story };
        newStory.pages[pageIndex].text = newText;
        setStory(newStory);
    };

    // Gestion de la lecture audio (TTS)
    const speakText = (text) => {
        if ('speechSynthesis' in window) {
            // Arrêter toute lecture en cours
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'fr-FR'; // Voix française

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);

            window.speechSynthesis.speak(utterance);
        } else {
            alert("Votre navigateur ne supporte pas la synthèse vocale.");
        }
    };

    const stopSpeaking = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    // Navigation dans le livre
    const openReader = () => {
        setCurrentReadingPage(0);
        setIsReading(true);
    };

    const closeReader = () => {
        stopSpeaking();
        setIsReading(false);
    };

    const nextPage = () => {
        stopSpeaking();
        if (currentReadingPage < story.pages.length - 1) {
            setCurrentReadingPage(prev => prev + 1);
        }
    };

    const prevPage = () => {
        stopSpeaking();
        if (currentReadingPage > 0) {
            setCurrentReadingPage(prev => prev - 1);
        }
    };

    return (
        <div className="min-h-screen bg-amber-50 p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-amber-900 mb-2">✨ Story Engine POC</h1>
                    <p className="text-amber-700">Le cerveau créatif de Kusoma Kids</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Formulaire */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-xl shadow-md border border-amber-100 sticky top-8">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">Configuration</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom de l'enfant</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.childName}
                                        onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
                                        placeholder="ex: Salif"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Âge</label>
                                        <select
                                            value={formData.childAge}
                                            onChange={(e) => setFormData({ ...formData, childAge: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
                                        >
                                            {[2, 3, 4, 5, 6, 7, 8].map(age => (
                                                <option key={age} value={age}>{age} ans</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="Garçon">Garçon</option>
                                            <option value="Fille">Fille</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Thème / Aventure</label>
                                    <select
                                        value={formData.theme}
                                        onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="L'École">🏫 L'École (Autonomie)</option>
                                        <option value="Les Cheveux">💇🏾‍♀️ Les Cheveux (Estime de soi)</option>
                                        <option value="La Panne de Courant">🔦 La Panne de Courant (Créativité)</option>
                                        <option value="La Politesse">🤝 La Politesse (Vivre ensemble)</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-4 px-4 rounded-lg font-bold text-white shadow mt-4 transition-all
                    ${loading ? 'bg-amber-200 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700'}`}
                                >
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="flex space-x-2">
                                                <div className="w-3 h-3 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                                <div className="w-3 h-3 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-3 h-3 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            </div>
                                            <span className="text-amber-800 text-sm font-medium">Écriture de l'histoire en cours...</span>
                                        </div>
                                    ) : (
                                        'Générer l\'histoire 📖'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Résultat */}
                    <div className="lg:col-span-2">
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                                <p className="text-red-700">{error}</p>
                            </div>
                        )}

                        {story ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="bg-white p-8 rounded-xl shadow-xl border border-amber-100">
                                    <h2 className="text-3xl font-bold text-amber-900 text-center mb-2">{story.title}</h2>
                                    <p className="text-center text-gray-500 italic mb-8">{story.synopsis}</p>

                                    <div className="space-y-12">
                                        {story.pages.map((page, index) => (
                                            <div key={index} className="flex flex-col md:flex-row gap-6 p-4 hover:bg-amber-50 rounded-lg transition-colors group">
                                                <div className="md:w-1/2 space-y-2">
                                                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wide">Page {page.pageNumber}</span>
                                                    {/* Zone de texte éditable */}
                                                    <textarea
                                                        value={page.text}
                                                        onChange={(e) => handleTextChange(index, e.target.value)}
                                                        className="w-full h-40 p-4 border border-gray-200 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-400 font-sans text-lg leading-relaxed text-gray-700 transition-all resize-y bg-gray-50 focus:bg-white shadow-inner"
                                                    />
                                                    <p className="text-xs text-amber-600 font-medium text-right mt-1">✏️ Modifier le texte</p>
                                                </div>
                                                <div className="md:w-1/2 bg-gray-100 p-4 rounded-lg border border-gray-200 text-sm">
                                                    <span className="block text-xs font-bold text-gray-400 uppercase mb-2">Prompt Image (IA)</span>
                                                    <code className="text-gray-600 block bg-white p-2 rounded border border-gray-200 text-xs">
                                                        {page.imagePrompt}
                                                    </code>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="text-center flex flex-col md:flex-row justify-center items-center gap-4">
                                    <button
                                        onClick={openReader}
                                        className="bg-amber-500 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-amber-600 transform hover:scale-105 transition-all flex items-center gap-2"
                                    >
                                        📖 Lire l'histoire (Aperçu)
                                    </button>

                                    <PDFDownloadLink
                                        document={<BookPdf story={story} childName={formData.childName} />}
                                        fileName={`kusoma-kids-${formData.childName}.pdf`}
                                        className="bg-green-600 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-green-700 transform hover:scale-105 transition-all flex items-center gap-2"
                                    >
                                        {({ blob, url, loading, error }) =>
                                            loading ? 'Génération du PDF...' : '📥 Télécharger mon Livre (PDF)'
                                        }
                                    </PDFDownloadLink>
                                </div>
                                <p className="text-sm text-gray-500 text-center mt-2">
                                    💡 Astuce : Modifiez le texte ci-dessus avant de télécharger le PDF !
                                </p>
                            </div>
                        ) : (
                            <div className="h-96 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border-dashed border-2 border-gray-300">
                                <div className="text-6xl mb-4">📚</div>
                                <p className="text-lg">Votre histoire apparaîtra ici...</p>
                            </div>
                        )}
                    </div>
                </div>
                {/* Modal de Lecture */}
                {/* Mode Lecture - Plein Écran Immersif */}
                {isReading && story && (
                    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-300">
                        {/* Header Minimaliste */}
                        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 pointer-events-none">
                            <div className="pointer-events-auto bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-gray-100">
                                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Page {currentReadingPage + 1} / {story.pages.length}</span>
                            </div>
                            <button
                                onClick={closeReader}
                                className="pointer-events-auto bg-white/80 backdrop-blur-md text-gray-800 hover:text-red-500 hover:bg-red-50 p-3 rounded-full transition-all shadow-sm border border-gray-100 group"
                            >
                                <span className="sr-only">Fermer</span>
                                <svg className="w-6 h-6 transform group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Contenu Principal - Split Screen */}
                        <div className="flex-1 flex flex-col md:flex-row h-full">

                            {/* Zone Image (Gauche) - 50% */}
                            <div className="w-full md:w-1/2 h-[40vh] md:h-full bg-amber-50 flex items-center justify-center p-8 relative overflow-hidden">
                                {/* Cercle décoratif */}
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-100 rounded-full opacity-50 blur-3xl"></div>

                                <div className="relative text-center max-w-md">
                                    <span className="text-6xl mb-6 block transform hover:scale-110 transition-transform cursor-pointer">🖼️</span>
                                    <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-amber-100 shadow-sm">
                                        <p className="text-xs font-bold text-amber-500 uppercase mb-2">Illustration IA</p>
                                        <p className="text-gray-500 text-sm italic leading-relaxed">
                                            "{story.pages[currentReadingPage].imagePrompt.substring(0, 150)}..."
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Zone Texte (Droite) - 50% */}
                            <div className="w-full md:w-1/2 h-[60vh] md:h-full bg-white flex flex-col justify-center items-center p-8 md:p-24 overflow-y-auto">
                                <div className="max-w-xl text-center">
                                    <h3 className="text-amber-500 text-sm font-bold uppercase tracking-widest mb-8">
                                        {story.title}
                                    </h3>

                                    <p className="text-2xl md:text-4xl font-sans font-medium leading-relaxed text-gray-800 mb-12 animate-in slide-in-from-bottom-8 duration-700 key-[currentReadingPage]">
                                        {story.pages[currentReadingPage].text}
                                    </p>

                                    {/* Contrôle Audio - Gros Bouton */}
                                    <button
                                        onClick={() => isSpeaking ? stopSpeaking() : speakText(story.pages[currentReadingPage].text)}
                                        className={`mx-auto flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg
                                        ${isSpeaking
                                                ? 'bg-red-50 text-red-500 border-2 border-red-100 hover:border-red-200'
                                                : 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-amber-200'}`}
                                    >
                                        {isSpeaking ? (
                                            <>
                                                <span className="animate-pulse">🔊</span> En lecture...
                                            </>
                                        ) : (
                                            <>
                                                <span>▶️</span> Écouter l'histoire
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer Navigation (Flottant en bas) */}
                        <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8 pointer-events-none">
                            <button
                                onClick={prevPage}
                                disabled={currentReadingPage === 0}
                                className="pointer-events-auto w-14 h-14 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-700 disabled:opacity-0 hover:bg-amber-50 hover:text-amber-600 hover:scale-110 transition-all font-bold text-xl"
                            >
                                ←
                            </button>

                            {/* Pagination Indication visuelle */}
                            <div className="bg-black/5 backdrop-blur-md rounded-full px-4 py-2 flex gap-2 pointer-events-auto">
                                {story.pages.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => { setCurrentReadingPage(idx); stopSpeaking(); }}
                                        className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentReadingPage ? 'bg-amber-600 w-8' : 'bg-gray-400/50 w-2.5 hover:bg-gray-400'}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={nextPage}
                                disabled={currentReadingPage === story.pages.length - 1}
                                className="pointer-events-auto w-14 h-14 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-700 disabled:opacity-0 hover:bg-amber-50 hover:text-amber-600 hover:scale-110 transition-all font-bold text-xl"
                            >
                                →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
