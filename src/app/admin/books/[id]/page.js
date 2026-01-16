'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function EditBookPage({ params }) {
    // Unwrap params using React.use()
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Pages State
    const [pages, setPages] = useState([]);

    const [form, setForm] = useState({
        title_template: '',
        theme_slug: '',
        description: '',
        cover_image_url: '',
        is_active: true
    });

    useEffect(() => {
        fetchBook();
    }, [id]);

    const fetchBook = async () => {
        try {
            const { data, error } = await supabase
                .from('story_templates')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            setForm({
                title_template: data.title_template,
                theme_slug: data.theme_slug,
                description: data.description || '',
                cover_image_url: data.cover_image_url || '',
                is_active: data.is_active
            });

            // Parse Pages
            if (data.content_json && data.content_json.pages) {
                setPages(data.content_json.pages);
            } else {
                // Fallback if empty or wrong format
                setPages(Array.from({ length: 10 }, (_, i) => ({
                    pageNumber: i + 1,
                    base_image_url: "",
                    scene_context: `Scène ${i + 1}: `
                })));
            }

        } catch (error) {
            console.error('Error fetching book:', error);
            alert('Livre introuvable');
            router.push('/admin/books');
        } finally {
            setLoading(false);
        }
    };

    const updatePage = (index, field, value) => {
        const newPages = [...pages];
        newPages[index] = { ...newPages[index], [field]: value };
        setPages(newPages);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Reconstruct JSON
            const content_json = { pages: pages };

            const { error } = await supabase
                .from('story_templates')
                .update({
                    title_template: form.title_template,
                    theme_slug: form.theme_slug,
                    description: form.description,
                    cover_image_url: form.cover_image_url,
                    content_json: content_json,
                    is_active: form.is_active
                })
                .eq('id', id);

            if (error) throw error;

            router.push('/admin/books');
        } catch (error) {
            console.error('Error updating book:', error);
            alert(`Erreur: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-32 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <Link href="/admin/books" className="text-gray-500 hover:text-orange-600 mb-6 inline-block">
                    ← Retour
                </Link>
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Éditer : {form.title_template}</h1>
                    <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded text-gray-600">{id}</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* General Info */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Titre du Template</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                    value={form.title_template}
                                    onChange={e => setForm({ ...form, title_template: e.target.value })}
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
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                            <textarea
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none h-24"
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Image de Couverture (URL)</label>
                            <input
                                type="url"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                value={form.cover_image_url}
                                onChange={e => setForm({ ...form, cover_image_url: e.target.value })}
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
                            <label htmlFor="active" className="text-gray-700 font-bold">Rendre cette histoire visible</label>
                        </div>
                    </div>

                    {/* Pages Editor */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900">Configuration des Pages</h2>
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
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contexte de la Scène (Prompt IA)</label>
                                        <textarea
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-1 focus:ring-orange-500 outline-none text-sm h-20"
                                            value={page.scene_context}
                                            onChange={e => updatePage(index, 'scene_context', e.target.value)}
                                        />
                                    </div>
                                </div>
                                {/* Preview Thumbnail */}
                                {page.base_image_url && (
                                    <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                        <img src={page.base_image_url} className="w-full h-full object-cover" alt={`Page ${page.pageNumber}`} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="sticky bottom-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 shadow-xl"
                        >
                            {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
