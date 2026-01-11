'use client';

import { useState } from 'react';
import { fal } from '@fal-ai/client';

fal.config({
    proxyUrl: '/api/fal/proxy',
});

// ID du modèle : Nous utilisons ici Flux Dev qui est excellent. 
// Pour une préservation parfaite du visage (InstantID), nous pourrions changer pour 'fal-ai/fast-sdxl-instant-id'
// ou un workflow ComfyUI spécifique hébergé sur Fal.
const MODEL_ID = 'fal-ai/flux/dev';

export default function TestFacePage() {
    const [photo, setPhoto] = useState(null);
    const [prompt, setPrompt] = useState("A cute child astronaut floating in colorful space, pixar style, high quality");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [status, setStatus] = useState("idle"); // idle, uploading, generating, error, success

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setPhoto(e.target.files[0]);
        }
    };

    const generateImage = async () => {
        if (!photo) {
            alert("Veuillez d'abord sélectionner une photo !");
            return;
        }

        setLoading(true);
        setStatus("uploading");
        setLogs([]);
        setResult(null);

        try {
            // 1. Upload de l'image (Stockage temporaire Fal)
            addLog("Envoi de la photo vers le cloud...");
            const uploadedUrl = await fal.storage.upload(photo);
            addLog(`Photo uploadée : ${uploadedUrl}`);

            // 2. Génération
            setStatus("generating");
            addLog(`Démarrage de la génération avec ${MODEL_ID}...`);

            const result = await fal.subscribe(MODEL_ID, {
                input: {
                    prompt: prompt,
                    // Utilisation de l'image comme référence (Image-to-Image)
                    // Note: Pour du vrai "InstantID", le paramètre s'appelle souvent 'face_image_url' ou similaire selon le modèle
                    image_url: uploadedUrl,
                    image_strength: 0.5, // Force de l'image originale (à ajuster)
                    num_inference_steps: 28,
                    guidance_scale: 3.5,
                    enable_safety_checker: false
                },
                logs: true,
                onQueueUpdate: (update) => {
                    if (update.status === 'IN_QUEUE') {
                        addLog(`En file d'attente (position ${update.queue_position})...`);
                    } else if (update.status === 'IN_PROGRESS') {
                        // Pour Flux/Dev, les logs détaillés peuvent être verbeux, on simplifie
                        if (update.logs && update.logs.length > 0) {
                            const lastLog = update.logs[update.logs.length - 1];
                            addLog(`Traitement: ${lastLog.message}`);
                        }
                    }
                },
            });

            // 3. Résultat
            setStatus("success");
            addLog("Génération terminée !");
            if (result.images && result.images.length > 0) {
                setResult(result.images[0].url);
            } else if (result.image) {
                setResult(result.image.url); // Certains modèles retournent 'image' au singulier
            }

        } catch (error) {
            console.error(error);
            setStatus("error");
            addLog(`Erreur: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const addLog = (message) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <header className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                    <h1 className="text-3xl font-bold">Kusoma Kids - Face Engine POC</h1>
                    <p className="opacity-90 mt-2">Test d'intégration Flux + Fal.ai</p>
                </header>

                <main className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Colonne de gauche : Contrôles */}
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <label className="block text-sm font-medium text-blue-900 mb-2">
                                1. Photo de l'enfant
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-700
                "
                            />
                            {photo && (
                                <div className="mt-2 text-xs text-green-600 font-medium">
                                    {photo.name} sélectionné
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                2. Scénario (Prompt)
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={4}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Décrivez l'image..."
                            />
                        </div>

                        <button
                            onClick={generateImage}
                            disabled={loading || !photo}
                            className={`w-full py-4 px-6 rounded-lg font-bold text-white shadow transition-all
                ${loading || !photo
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Génération en cours...
                                </span>
                            ) : (
                                "Lancer la génération (Magic)"
                            )}
                        </button>

                        {/* Logs Console */}
                        <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 h-48 overflow-y-auto">
                            <div className="text-gray-500 mb-2 border-b border-gray-700 pb-1">System Logs</div>
                            {logs.length === 0 && <span className="text-gray-600">En attente d'actions...</span>}
                            {logs.map((log, i) => (
                                <div key={i} className="mb-1">{log}</div>
                            ))}
                        </div>
                    </div>

                    {/* Colonne de droite : Résultat */}
                    <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                        {result ? (
                            <div className="relative w-full h-full p-2 animate-in fade-in zoom-in duration-500">
                                <img
                                    src={result}
                                    alt="Résultat généré"
                                    className="rounded-lg shadow-xl w-full h-auto object-cover max-h-[600px]"
                                />
                                <a
                                    href={result}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-block bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-semibold shadow hover:bg-gray-50"
                                    download
                                >
                                    Télécharger HD
                                </a>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 p-8">
                                <div className="mb-4">
                                    <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p>Le résultat apparaîtra ici</p>
                                <p className="text-xs mt-2">Temps estimé : ~15-30 secondes</p>
                            </div>
                        )}
                    </div>

                </main>
            </div>
        </div>
    );
}
