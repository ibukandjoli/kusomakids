// src/app/preview/[id]/page.js
'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useBookContext } from '../../context/BookContext';
import { bookService } from '../../services/bookService';

export default function PreviewPage({ params }) {
  // Déballer correctement les paramètres
  const { id } = use(params);
  const router = useRouter();
  const { 
    bookPersonalization, 
    cart, 
    addToCart, 
    goToStep 
  } = useBookContext();
  
  const [book, setBook] = useState(null);
  const [preview, setPreview] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [error, setError] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  
  useEffect(() => {
    // Test pour voir si le contexte est accessible
    console.log("Personnalisation:", bookPersonalization);

    // Vérifier que la personnalisation est complète
    if (!bookPersonalization || !bookPersonalization.childName || !bookPersonalization.childAge) {
      console.log("Mode démo activé: personnalisation incomplète");
      setDemoMode(true);
      
      // Utiliser des données de test pour la démo
      const testData = {
        bookId: id,
        childName: "Salif",
        childAge: 5,
        photo: null,
        photoUrl: `/images/books/salif-metiers/main.png`
      };
      
      loadBookAndPreview(testData);
    } else if (bookPersonalization.bookId !== id) {
      // Si l'ID du livre ne correspond pas, rediriger vers la page de personnalisation
      console.log("Redirection: ID du livre incorrect");
      router.push(`/personalize/${id}`);
    } else {
      // Personnalisation complète et ID correct
      loadBookAndPreview(bookPersonalization);
    }
  }, [id, bookPersonalization]);
  
  // Charger les détails du livre et générer la prévisualisation
  const loadBookAndPreview = async (personalizationData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Chargement du livre:", id);
      // Charger les détails du livre
      const bookData = await bookService.getBookById(id);
      setBook(bookData);
      
      console.log("Génération de la prévisualisation");
      // Générer la prévisualisation personnalisée
      const previewData = await bookService.generatePreview(id, personalizationData);
      
      console.log("Prévisualisation générée:", previewData);
      setPreview(previewData);
      
      // Avancer à l'étape 3 (prévisualisation)
      if (!demoMode) {
        goToStep(3);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de la prévisualisation:', err);
      setError('Nous avons rencontré un problème lors de la génération de la prévisualisation.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Gérer la navigation dans les pages du livre
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (preview && currentPage < preview.pages.length) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // Ajouter au panier et continuer vers le paiement
  const handleContinueToCheckout = async () => {
    setIsAddingToCart(true);
    
    try {
      if (demoMode) {
        // En mode démo, simplement rediriger vers la personnalisation
        router.push(`/personalize/${id}`);
        return;
      }
      
      // Ajouter au panier
      addToCart({
        id: id,
        title: book.title,
        price: book.price,
        pages: book.pages
      });
      
      // Rediriger vers le paiement
      router.push('/checkout');
    } catch (err) {
      console.error('Erreur lors de l\'ajout au panier:', err);
      setError('Nous avons rencontré un problème lors de l\'ajout au panier.');
    } finally {
      setIsAddingToCart(false);
    }
  };
  
  // Afficher l'état de chargement
  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-700">Génération de votre livre personnalisé...</p>
        </div>
      </main>
    );
  }
  
  // Afficher les erreurs
  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Une erreur est survenue</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href={`/personalize/${id}`}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-full transition"
            >
              Retour à la personnalisation
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-lg transition"
            >
              Réessayer
            </button>
          </div>
        </div>
      </main>
    );
  }
  
  // Si aucune prévisualisation n'est disponible
  if (!preview) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="text-orange-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Prévisualisation non disponible</h2>
          <p className="text-gray-700 mb-6">Veuillez compléter la personnalisation de votre livre.</p>
          <Link 
            href={`/personalize/${id}`}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-lg transition"
          >
            Retour à la personnalisation
          </Link>
        </div>
      </main>
    );
  }
  
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Barre de progression */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
              3
            </div>
            <h2 className="text-xl font-semibold">Prévisualisez votre livre</h2>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded">
            <div className="h-1 bg-orange-500 rounded" style={{ width: '66%' }}></div>
          </div>
        </div>
        
        {/* Prévisualisation du livre */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          {/* En-tête de la prévisualisation */}
          <div className="bg-orange-500 text-white py-4 px-6 flex justify-between items-center">
            <h3 className="text-xl font-bold">{preview.title}</h3>
            <div className="text-sm">
              Page {currentPage} sur {preview.pages.length}
            </div>
          </div>
          
          {/* Contenu du livre */}
          <div className="p-6">
            <div className="aspect-[4/3] bg-gray-100 rounded-lg mb-6 overflow-hidden">
              {/* Image de la page */}
              <div className="relative w-full h-full">
                {preview.pages && preview.pages[currentPage - 1] && (
                  <div className="w-full h-full relative">
                    <Image
                      src={preview.pages[currentPage - 1].personalizedImage}
                      alt={`Page ${currentPage}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Texte de la page */}
            <div className="bg-gray-50 rounded-lg p-6 text-lg">
              {preview.pages && preview.pages[currentPage - 1] && preview.pages[currentPage - 1].text}
            </div>
            
            {/* Boutons de navigation */}
            <div className="flex justify-between mt-6">
              <button 
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 flex items-center rounded-full transition ${
                  currentPage === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-orange-500 hover:bg-orange-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Page précédente
              </button>
              
              <button 
                onClick={handleNextPage}
                disabled={currentPage === preview.pages.length}
                className={`px-4 py-2 flex items-center rounded-full transition ${
                  currentPage === preview.pages.length 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-orange-500 hover:bg-orange-50'
                }`}
              >
                Page suivante
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Indicateurs de page */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-center space-x-2">
            {preview.pages && Array.from({ length: preview.pages.length }).map((_, index) => (
              <button 
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`w-3 h-3 rounded-full transition ${
                  currentPage === index + 1 ? 'bg-orange-500' : 'bg-gray-200 hover:bg-gray-300'
                }`}
                aria-label={`Aller à la page ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        {/* Résumé de la commande */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Résumé de la commande</h3>
          
          <div className="flex justify-between items-center border-b border-gray-100 py-4">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gray-100 rounded mr-4 overflow-hidden relative">
                {preview.pages && preview.pages[0] && (
                  <Image
                    src={preview.pages[0].personalizedImage}
                    alt="Couverture du livre"
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div>
                <h4 className="font-semibold">{preview.title}</h4>
                <p className="text-gray-600">Livre personnalisé, {book?.pages || 24} pages</p>
                <p className="text-gray-600">Pour {demoMode ? "Salif" : bookPersonalization.childName}, {demoMode ? "5" : bookPersonalization.childAge} ans</p>
              </div>
            </div>
            <div className="font-semibold">
              {preview.price.toLocaleString()} FCFA
            </div>
          </div>
          
          <div className="py-4 border-b border-gray-100">
            <div className="flex justify-between mb-2">
              <span>Sous-total</span>
              <span>{preview.price.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Frais de livraison</span>
              <span>3 000 FCFA</span>
            </div>
          </div>
          
          <div className="flex justify-between py-4 font-bold text-lg">
            <span>Total</span>
            <span>{(preview.price + 3000).toLocaleString()} FCFA</span>
          </div>
        </div>
        
        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Link 
            href={`/personalize/${id}`}
            className="px-6 py-3 border border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-50 text-center transition"
          >
            Modifier la personnalisation
          </Link>
          
          <button
            onClick={handleContinueToCheckout}
            disabled={isAddingToCart}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-lg transform transition hover:scale-105 disabled:opacity-70 disabled:transform-none disabled:hover:bg-orange-500 text-center"
          >
            {isAddingToCart ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Traitement...
              </span>
            ) : (
              demoMode ? 'Créer votre propre livre' : 'Continuer vers le paiement'
            )}
          </button>
        </div>
      </div>
    </main>
  );
}