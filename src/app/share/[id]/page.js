import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
    // Await params as required by Next.js 15
    const awaitedParams = await params;
    const { id } = awaitedParams;

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: book } = await supabaseAdmin
        .from('generated_books')
        .select('title, child_name, cover_image_url, cover_url, story_content')
        .eq('id', id)
        .single();

    if (!book) return { title: 'Histoire Kusoma Kids' };

    const title = book.story_content?.title || book.title || "Voyage Magique";
    const coverUrl = book.cover_image_url || book.cover_url || book.story_content?.pages?.[0]?.image || '';

    // Safety check on title to handle null or undefined
    const safeTitle = title || '';
    const childName = book.child_name || 'votre enfant';
    const personalizedTitle = safeTitle.replace(/\[Son prénom\]/gi, childName).replace(/\{childName\}/gi, childName);

    return {
        title: `${personalizedTitle} | L'histoire magique`,
        description: `Regarde cette histoire générée par intelligence artificielle où ${childName} est le héros principal !`,
        openGraph: {
            title: `${personalizedTitle} | L'histoire magique`,
            description: `Une histoire unique générée pour ${childName} sur Kusoma Kids.`,
            images: coverUrl ? [{ url: coverUrl }] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${personalizedTitle} | L'histoire magique`,
            description: `Regarde cette histoire incroyable sur Kusoma Kids !`,
            images: coverUrl ? [coverUrl] : [],
        },
    };
}

export default async function SharedStoryPage({ params }) {
    // Await params as required by Next.js 15
    const awaitedParams = await params;
    const { id } = awaitedParams;

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: book, error } = await supabaseAdmin
        .from('generated_books')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !book) {
        notFound();
    }

    const title = book.story_content?.title || book.title || "Voyage Magique";
    const pages = Array.isArray(book.story_content?.pages) ? book.story_content.pages : [];
    const coverUrl = book.cover_image_url || book.cover_url || pages[0]?.image || '';

    const personalize = (text) => text?.replace(/\[Son prénom\]/gi, book.child_name || 'votre enfant').replace(/\{childName\}/gi, book.child_name || 'votre enfant');

    // Show Cover + First 2 Pages for Teaser
    const teaserPages = pages.slice(0, 2);

    return (
        <div className="min-h-screen bg-[#FFFDF7] font-sans pb-20">
            {/* Minimal Header */}
            <header className="bg-white p-6 flex justify-between items-center shadow-sm">
                <Link href="/" className="font-chewy text-3xl text-orange-500 hover:scale-105 transition-transform">
                    Kusoma Kids
                </Link>
                <Link href="/login" className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-full font-bold shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all">
                    Créer mon histoire gratuite
                </Link>
            </header>

            <main className="container mx-auto px-4 mt-12 max-w-4xl">
                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <span className="inline-block bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase mb-4 shadow-sm">
                        Histoire Magique Partagée ✨
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 font-chewy leading-tight drop-shadow-sm">
                        {personalize(title)}
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto italic font-medium">
                        Une aventure unique générée pour <span className="text-orange-600 font-bold px-1">{book.child_name}</span> par I.A.
                    </p>
                </div>

                {/* THE READER TEASER */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-16 animate-in fade-in zoom-in-95 duration-1000 delay-150">
                    {/* Cover */}
                    {coverUrl && (
                        <div className="relative aspect-[16/9] md:aspect-[21/9] w-full bg-gray-900 flex flex-col items-center justify-center overflow-hidden border-b-8 border-orange-50 group">
                            <Image src={coverUrl} alt="Cover" fill className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-[10s] ease-out" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>

                            <div className="relative z-10 text-center mt-auto mb-12 p-6">
                                <h2 className="text-3xl md:text-5xl text-white font-chewy drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] mb-4">
                                    {personalize(title)}
                                </h2>
                                <p className="text-white/90 font-bold bg-black/40 px-6 py-2 rounded-full backdrop-blur-md inline-block shadow-lg border border-white/10 uppercase tracking-widest text-sm">
                                    Page de couverture
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Teaser Pages */}
                    <div className="p-6 md:p-12 space-y-12 md:space-y-20 bg-[#FDFBF7]">
                        {teaserPages.map((page, idx) => (
                            <div key={idx} className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 md:gap-12 items-center group`}>
                                {/* Image */}
                                <div className="w-full md:w-1/2">
                                    <div className={`aspect-[4/3] relative rounded-[2rem] shadow-xl border-4 border-white bg-white p-2 transform transition-transform duration-500 hover:scale-105 ${idx % 2 === 0 ? 'rotate-2 hover:rotate-1' : '-rotate-2 hover:-rotate-1'}`}>
                                        {page.image ? (
                                            <div className="w-full h-full relative rounded-2xl overflow-hidden">
                                                <Image src={page.image} alt={`Illustration ${idx + 1}`} fill className="object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-2xl text-4xl">🎨</div>
                                        )}
                                    </div>
                                </div>

                                {/* Text */}
                                <div className="w-full md:w-1/2">
                                    <div className="inline-flex items-center justify-center w-auto bg-orange-100 text-orange-600 font-black rounded-lg px-3 py-1 text-sm uppercase mb-4 shadow-sm border border-orange-200">
                                        Livre - Page {idx + 1}
                                    </div>
                                    <p className="text-lg md:text-xl text-gray-700 leading-relaxed font-serif relative">
                                        <span className="text-6xl text-orange-200 absolute -top-6 -left-4 font-serif leading-none italic opacity-50 select-none">"</span>
                                        {personalize(page.text)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Cliffhanger / Call to Action */}
                    <div className="bg-gradient-to-br from-[#FF5F6D] to-[#FFC371] p-12 md:p-16 text-center text-white relative overflow-hidden">
                        {/* decorative blurs */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl -ml-20 -mb-20"></div>

                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl backdrop-blur-md border border-white/30">
                                <span className="text-5xl">🔒</span>
                            </div>
                            <h3 className="text-4xl md:text-5xl font-black mb-4 font-chewy drop-shadow-md">Et après ?</h3>
                            <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto opacity-95 drop-shadow-sm font-medium">
                                La suite de cette incroyable aventure est réservée aux parents de <strong className="text-yellow-200 italic">{book.child_name}</strong>...
                            </p>

                            <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20 max-w-xl mx-auto">
                                <p className="mb-6 font-bold text-lg text-white">Vous aussi, créez un livre dont votre enfant est le héros :</p>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-3 bg-white text-orange-600 px-10 py-5 rounded-2xl font-black text-2xl hover:bg-orange-50 transform hover:-translate-y-2 transition-all shadow-2xl hover:shadow-orange-900/40 w-full justify-center group"
                                >
                                    <span>🪄</span>
                                    <span>Moi aussi, je crée mon histoire</span>
                                    <span className="group-hover:translate-x-2 transition-transform">→</span>
                                </Link>
                                <p className="text-sm opacity-90 mt-4 font-medium italic">Inscription 100% gratuite. 1 livre offert.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Minimal Footer */}
            <footer className="text-center text-gray-400 text-sm mt-10">
                &copy; {new Date().getFullYear()} Kusoma Kids. L'intelligence artificielle au service de l'imagination.
            </footer>
        </div>
    );
}
