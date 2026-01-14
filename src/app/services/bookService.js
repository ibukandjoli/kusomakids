'use client';

import { supabase } from '@/lib/supabase';
import { booksData, fetchBooksGeneric } from './bookShared';

export const bookService = {
  /**
   * Récupère tous les livres disponibles
   * @param {Object} filters - Filtres optionnels (âge, genre, etc.)
   * @returns {Promise<Array>} Liste des livres
   */
  async getBooks(filters = {}) {
    return fetchBooksGeneric(supabase, filters);
  },

  /**
   * Récupère les détails d'un livre spécifique
   * @param {string} id - ID du livre
   * @returns {Promise<Object>} Détails du livre
   */
  async getBookById(id) {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 200));

    // Pour l'instant, on utilise toujours les données mockées pour le détail 
    // car la DB ne contient peut-être pas tout le contenu JSON complet nécessaire pour la génération
    // OU on pourrait faire fetchBooksGeneric et find?
    // Gardons la logique existante : booksData est la source de vérité pour le contenu complet des templates par défaut

    // TODO: Si on stocke tout en DB, remplacer par un select single
    const book = booksData.find(book => book.id === id);

    if (!book) {
      // Fallback on DB fetch if not in static list?
      // Just simpler to throw for now if not found in static list
      // But wait, getBooks fetches from DB. If DB has ID 4, but booksData doesn't...
      // Ideally getBookById should also try DB.
      // Let's keep it simple for now to avoid breaking existing flow.
      throw new Error('Livre non trouvé');
    }

    return book;
  },

  /**
   * Génère une prévisualisation du livre personnalisé
   * @param {string} bookId - ID du livre
   * @param {Object} personalization - Données de personnalisation
   * @returns {Promise<Object>} Pages prévisualisées
   */
  async generatePreview(bookId, personalization) {
    const { childName, childAge, photoUrl } = personalization;

    // Récupérer le livre
    const book = await this.getBookById(bookId);

    // Simuler un délai pour le "traitement"
    await new Promise(resolve => setTimeout(resolve, 800));

    // Déterminer le genre pour les accords
    const isBoy = !childName.toLowerCase().endsWith('a') && !childName.toLowerCase().endsWith('e'); // Logique simple à affiner
    const gender = isBoy ? '' : 'e';
    const pronoun = isBoy ? 'il' : 'elle';
    const genderNoun = isBoy ? 'garçon' : 'fille';

    // Personnaliser le contenu des pages
    const previewPages = book.previewPages.map(page => {
      // Remplacer les variables dans le texte
      let personalizedText = page.text
        .replace(/\{childName\}/g, childName)
        .replace(/\{childAge\}/g, childAge)
        .replace(/\{gender\}/g, gender)
        .replace(/\{il\/elle\}/g, pronoun)
        .replace(/\{Il\/Elle\}/g, pronoun.charAt(0).toUpperCase() + pronoun.slice(1))
        .replace(/\{garçon\/fille\}/g, genderNoun);

      return {
        ...page,
        text: personalizedText,
        // En production, vous auriez une vraie image personnalisée ici
        personalizedImage: page.image
      };
    });

    let titleReplacement = book.title;

    // Adapter le titre selon le livre
    if (book.id === "1") {
      titleReplacement = book.title.replace('Salif', childName);
    } else if (book.id === "2") {
      titleReplacement = book.title.replace('Soso', childName);
    } else if (book.id === "3") {
      titleReplacement = book.title.replace('Lina', childName);
    }

    return {
      title: titleReplacement,
      pages: previewPages,
      price: book.price
    };
  }
};