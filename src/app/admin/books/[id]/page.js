'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function EditBookPage({ params }) {
    // Unwrap params using React.use()
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        title_template: '',
        theme_slug: '',
        description: '',
        cover_image_url: '',
        content_json: '',
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
                content_json: JSON.stringify(data.content_json, null, 2),
                is_active: data.is_active
            });
        } catch (error) {
            console.error('Error fetching book:', error);
            alert('Livre introuvable');
            router.push('/admin/books');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            let parsedContent;
            try {
                parsedContent = JSON.parse(form.content_json);
            } catch (err) {
                alert("Le format JSON des pages est invalide.");
                setSaving(false);
                return;
            }

            const { error } = await supabase
                .from('story_templates')
                .update({
                    title_template: form.title_template,
                    theme_slug: form.theme_slug,
                    description: form.description,
                    cover_image_url: form.cover_image_url,
                    content_json: parsedContent,
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
            <div className="container mx-auto px-4 max-w-3xl">
                <Link href="/admin/books" className="text-gray-500 hover:text-orange-600 mb-6 inline-block">
                    ← Retour
                </Link>
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Éditer : {form.title_template}</h1>
                    <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded text-gray-600">{id}</span>
                </div>

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

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Configuration des Pages (JSON)
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
                        <label htmlFor="active" className="text-gray-700 font-bold">Rendre cette histoire visible</label>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
