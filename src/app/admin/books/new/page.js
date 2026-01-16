'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function NewBookPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Initial State: 10 Empty Pages
    const [pages, setPages] = useState(
        Array.from({ length: 10 }, (_, i) => ({
            pageNumber: i + 1,
            base_image_url: "",
            scene_context: `Scène ${i + 1}: `
        }))
    );

    const [form, setForm] = useState({
        title_template: '',
        theme_slug: '',
        description: '',
        cover_image_url: '',
        is_active: true
    });

    // Helper to update a specific page
    const updatePage = (index, field, value) => {
        const newPages = [...pages];
        newPages[index] = { ...newPages[index], [field]: value };
        setPages(newPages);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Construct the final JSON
            const content_json = { pages: pages };

            const { error } = await supabase
                .from('story_templates')
                .insert([{
                    title_template: form.title_template,
                    theme_slug: form.theme_slug,
                    description: form.description,
                    cover_image_url: form.cover_image_url,
                    content_json: content_json,
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
            <div className="container mx-auto px-4 max-w-4xl">
                <Link href="/admin/books" className="text-gray-500 hover:text-orange-600 mb-6 inline-block">
                    ← Retour
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Ajouter une Nouvelle Histoire</h1>

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* General Info Card */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                        <h2 className="text-xl font-bold text-gray-900">Information Générales</h2>
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
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none font-mono text-sm"
                                value={form.cover_image_url}
                                onChange={e => setForm({ ...form, cover_image_url: e.target.value })}
                                placeholder="https://..."
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
                    </div>

                    {/* Pages Editor */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900">Configuration des 10 Pages</h2>
                        {pages.map((page, index) => (
                            <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex gap-6 items-start">
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-700 font-bold text-xl flex-shrink-0">
                                    {page.pageNumber}
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL de l'image (Master)</label>
                                        <input
                                            type="url"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-1 focus:ring-orange-500 outline-none font-mono text-sm"
                                            value={page.base_image_url}
                                            onChange={e => updatePage(index, 'base_image_url', e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Texte de l'Histoire (Master Script)</label>
                                        <div className="text-xs text-gray-400 mb-2">Variables: {'{childName}'}, {'{childAge}'}, {'{gender}'}, {'{city}'}</div>
                                        <textarea
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-1 focus:ring-orange-500 outline-none text-sm h-32 font-medium text-gray-800"
                                            value={page.text_template || ''}
                                            onChange={e => updatePage(index, 'text_template', e.target.value)}
                                            placeholder="Ce matin-là, {childName}..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contexte de la Scène (Prompt IA - Optionnel)</label>
                                        <textarea
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-1 focus:ring-orange-500 outline-none text-sm h-20 text-gray-500"
                                            value={page.scene_context}
                                            onChange={e => updatePage(index, 'scene_context', e.target.value)}
                                            placeholder="Décrivez la scène..."
                                        />
                                    </div>
                                </div>
                                {/* Preview Thumbnail if URL exists */}
                                {page.base_image_url && (
                                    <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 relative group">
                                        <img src={page.base_image_url} className="w-full h-full object-cover" alt={`Page ${page.pageNumber}`} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="sticky bottom-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 shadow-xl"
                        >
                            {loading ? 'Création en cours...' : 'Sauvegarder l\'Histoire'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
