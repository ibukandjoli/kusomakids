'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function NewBookPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    // Default JSON Structure
    const defaultPages = {
        pages: Array.from({ length: 10 }, (_, i) => ({
            pageNumber: i + 1,
            base_image_url: "",
            scene_context: `Scène ${i + 1}: `
        }))
    };

    const [form, setForm] = useState({
        title_template: '',
        theme_slug: '',
        description: '',
        cover_image_url: '',
        content_json: JSON.stringify(defaultPages, null, 2),
        is_active: true
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate JSON
            let parsedContent;
            try {
                parsedContent = JSON.parse(form.content_json);
            } catch (err) {
                alert("Le format JSON des pages est invalide.");
                setLoading(false);
                return;
            }

            const { error } = await supabase
                .from('story_templates')
                .insert([{
                    title_template: form.title_template,
                    theme_slug: form.theme_slug,
                    description: form.description,
                    cover_image_url: form.cover_image_url,
                    content_json: parsedContent,
                    is_active: form.is_active
                }]);

            if (error) throw error;

            router.push('/admin/books');
        } catch (error) {
            console.error('Error creating book:', error);
            alert(`Erreur: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20">
            <div className="container mx-auto px-4 max-w-3xl">
                <Link href="/admin/books" className="text-gray-500 hover:text-orange-600 mb-6 inline-block">
                    ← Retour
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Ajouter une Nouvelle Histoire</h1>

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Titre du Template</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                value={form.title_template}
                                onChange={e => setForm({ ...form, title_template: e.target.value })}
                                placeholder="Ex: L'Anniversaire Magique"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Slug (Unique)</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                value={form.theme_slug}
                                onChange={e => setForm({ ...form, theme_slug: e.target.value })}
                                placeholder="Ex: anniversaire-magique"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                        <textarea
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none h-24"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Description affichée sur la page d'accueil..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Image de Couverture (URL)</label>
                        <input
                            type="url"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                            value={form.cover_image_url}
                            onChange={e => setForm({ ...form, cover_image_url: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Configuration des Pages (JSON)
                            <span className="block text-xs text-gray-400 font-normal mt-1">
                                Copiez-collez ici les URLs de vos images "Master" et le contexte de scène.
                            </span>
                        </label>
                        <textarea
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none font-mono text-xs bg-gray-50 h-[400px]"
                            value={form.content_json}
                            onChange={e => setForm({ ...form, content_json: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            id="active"
                            checked={form.is_active}
                            onChange={e => setForm({ ...form, is_active: e.target.checked })}
                            className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                        />
                        <label htmlFor="active" className="text-gray-700 font-bold">Rendre cette histoire visible immédiatement</label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Création...' : 'Créer l\'histoire'}
                    </button>
                </form>
            </div>
        </div>
    );
}
