
import { supabase } from '@/lib/supabase';
import BookDetailClient from '@/app/components/BookDetailClient';
import { formatTitle } from '@/utils/format';

// 1. Generate Dynamic Metadata for SEO
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  if (!id) return {};

  const { data: book } = await supabase
    .from('story_templates')
    .select('title, description, cover_url, theme_slug')
    .eq('id', id)
    .single();

  if (!book) {
    return {
      title: 'Livre introuvable | KusomaKids',
    };
  }

  const title = formatTitle(book.title);
  const description = book.description || `Découvrez ${title}, une histoire personnalisée unique.`;
  const coverUrl = book.cover_url || '/images/og-default.jpg';

  return {
    title: `${title} - Livre Personnalisé`,
    description: description,
    openGraph: {
      title: `${title} - Le héros c'est votre enfant`,
      description: description,
      url: `https://kusomakids.com/book/${id}`,
      images: [
        {
          url: coverUrl,
          width: 800,
          height: 800,
          alt: title,
        },
      ],
      type: 'book',
    },
  };
}

// 2. Server Component fetches data and passes to Client Component
export default async function BookDetailPage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  if (!id) return <BookDetailClient initialBook={null} />;

  // Fetch Book Details
  const { data: book } = await supabase
    .from('story_templates')
    .select('*')
    .eq('id', id)
    .single();

  // Fetch Related Books
  let relatedBooks = [];
  if (book) {
    const { data: related } = await supabase
      .from('story_templates')
      .select('id, title, cover_url, theme_slug, age_range')
      .neq('id', id)
      .limit(4);

    relatedBooks = related || [];
  }

  return <BookDetailClient initialBook={book} initialRelatedBooks={relatedBooks} />;
}