export default function sitemap() {
    const baseUrl = 'https://www.kusomakids.com';

    // Static routes
    const routes = [
        '',
        '/club',
        '/login',
        '/signup',
        '/faq',
        '/support',
        '/privacy',
        '/terms',
        '/legal',
        '/books',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.8,
    }));

    return [...routes];
}
