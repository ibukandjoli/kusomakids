
import { supabase } from '@/lib/supabase';
import BookDetailClient from '@/app/components/BookDetailClient';
import { formatTitle } from '@/utils/format';

// 1. Generate Dynamic Metadata for SEO
// Helper to check UUID
const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// 1. Generate Dynamic Metadata for SEO
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  if (!slug) return {};

  let query = supabase.from('story_templates').select('title, description, cover_image_url, theme_slug').single();

  if (isUUID(slug)) {
    query = query.eq('id', slug);
  } else {
    query = query.eq('theme_slug', slug);
  }

  const { data: book } = await query;

  if (!book) {
    return {
      title: 'Livre introuvable | KusomaKids',
    };
  }

  const title = formatTitle(book.title);
  const description = book.description || `Découvrez ${title}, une histoire personnalisée unique.`;
  const coverUrl = book.cover_image_url || '/images/og-default.jpg';

  return {
    title: `${title} - Livre Personnalisé`,
    description: description,
    openGraph: {
      title: `${title} - Le héros c'est votre enfant`,
      description: description,
      url: `https://kusomakids.com/book/${slug}`,
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
  const slug = resolvedParams?.slug;

  if (!slug) return <BookDetailClient initialBook={null} />;

  // Fetch Book Details
  let query = supabase.from('story_templates').select('*').single();

  if (isUUID(slug)) {
    query = query.eq('id', slug);
  } else {
    query = query.eq('theme_slug', slug);
  }

  const { data: book } = await query;

  // Fetch Related Books
  let relatedBooks = [];
  if (book) {
    const { data: related } = await supabase
      .from('story_templates')
      .select('id, title, cover_image_url, theme_slug, age_range')
      .neq('id', book.id)
      .limit(4);

    relatedBooks = related || [];
  }

  return <BookDetailClient initialBook={book} initialRelatedBooks={relatedBooks} />;
}