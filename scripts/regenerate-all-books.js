// Script de Régénération en Masse
// À exécuter dans la console navigateur sur kusomakids.com (connecté)

console.log('🔄 Démarrage de la régénération en masse...');

// 1. Récupérer tous les livres
fetch('/api/admin/generation-status')
    .then(r => r.json())
    .then(data => {
        const books = data.books;
        console.log(`📚 ${books.length} livres trouvés`);

        // 2. Filtrer les livres qui ont besoin de régénération
        const booksToRegenerate = books.filter(book => {
            // Régénérer si status = pending OU si pas de status (ancien livre)
            return !book.generation_status || book.generation_status === 'pending';
        });

        console.log(`🎯 ${booksToRegenerate.length} livres à régénérer`);
        console.table(booksToRegenerate.map(b => ({
            id: b.id.substring(0, 8) + '...',
            title: b.title,
            child: b.child_name,
            status: b.generation_status || 'ancien'
        })));

        // 3. Demander confirmation
        if (!confirm(`Voulez-vous régénérer ${booksToRegenerate.length} livres ?`)) {
            console.log('❌ Annulé par l\'utilisateur');
            return;
        }

        // 4. Régénérer un par un avec délai
        let completed = 0;
        let failed = 0;

        async function regenerateNext(index) {
            if (index >= booksToRegenerate.length) {
                console.log(`\n✅ TERMINÉ !`);
                console.log(`   Réussis: ${completed}`);
                console.log(`   Échoués: ${failed}`);
                return;
            }

            const book = booksToRegenerate[index];
            console.log(`\n[${index + 1}/${booksToRegenerate.length}] Génération: ${book.title}...`);

            try {
                const response = await fetch('/api/admin/trigger-generation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bookId: book.id })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    console.log(`  ✅ ${book.title} - Démarré`);
                    completed++;
                } else {
                    console.error(`  ❌ ${book.title} - Erreur:`, result.error);
                    failed++;
                }
            } catch (error) {
                console.error(`  ❌ ${book.title} - Exception:`, error);
                failed++;
            }

            // Attendre 2 secondes avant le suivant (éviter surcharge)
            setTimeout(() => regenerateNext(index + 1), 2000);
        }

        // Démarrer
        regenerateNext(0);
    })
    .catch(err => {
        console.error('❌ Erreur:', err);
    });
