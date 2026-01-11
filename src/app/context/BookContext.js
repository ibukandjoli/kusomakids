// src/app/context/BookContext.js
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

// Création du contexte
const BookContext = createContext(null);

// Hook personnalisé pour accéder au contexte
export const useBookContext = () => {
  const context = useContext(BookContext);
  if (!context) {
    throw new Error('useBookContext doit être utilisé dans un BookProvider');
  }
  return context;
};

// Provider qui encapsulera notre application
export const BookProvider = ({ children }) => {
  // État initial pour la personnalisation du livre
  const [bookPersonalization, setBookPersonalization] = useState({
    bookId: null,
    childName: '',
    childAge: '',
    photo: null,
    photoUrl: null, // URL pour la prévisualisation
    processedPhotoUrl: null, // URL de la photo traitée par l'IA
  });

  // État pour le panier
  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    shipping: 3000,
    total: 0,
  });

  // État pour le suivi de progression
  const [orderProgress, setOrderProgress] = useState({
    step: 1, // 1: sélection, 2: personnalisation, 3: prévisualisation, 4: paiement
    completed: [false, false, false, false]
  });

  // Méthodes pour manipuler l'état
  const updatePersonalization = (data) => {
    setBookPersonalization(prev => ({
      ...prev,
      ...data
    }));
  };

  const updatePhoto = (file) => {
    // Si un fichier a été fourni
    if (file) {
      // Créer une URL pour la prévisualisation
      const fileUrl = URL.createObjectURL(file);
      
      setBookPersonalization(prev => ({
        ...prev,
        photo: file,
        photoUrl: fileUrl
      }));

      // Ici, vous pourriez appeler votre API pour traiter l'image
      // processPhotoWithAI(file).then(processedUrl => {
      //   setBookPersonalization(prev => ({
      //     ...prev,
      //     processedPhotoUrl: processedUrl
      //   }));
      // });
    }
  };

  const resetPersonalization = () => {
    setBookPersonalization({
      bookId: null,
      childName: '',
      childAge: '',
      photo: null,
      photoUrl: null,
      processedPhotoUrl: null,
    });
  };

  const addToCart = (book) => {
    // Vérifier si tous les champs requis sont remplis
    if (!bookPersonalization.childName || !bookPersonalization.childAge || !bookPersonalization.photo) {
      throw new Error('Veuillez remplir tous les champs de personnalisation');
    }

    const newItem = {
      id: Date.now(), // ID temporaire pour l'item du panier
      bookId: book.id,
      title: book.title.replace('Buur', bookPersonalization.childName),
      price: book.price,
      personalization: {
        childName: bookPersonalization.childName,
        childAge: bookPersonalization.childAge,
        photoUrl: bookPersonalization.photoUrl
      }
    };

    // Mettre à jour le panier
    setCart(prev => {
      const updatedItems = [...prev.items, newItem];
      const subtotal = updatedItems.reduce((total, item) => total + item.price, 0);
      return {
        items: updatedItems,
        subtotal,
        shipping: prev.shipping,
        total: subtotal + prev.shipping
      };
    });

    // Mettre à jour la progression
    setOrderProgress(prev => ({
      ...prev,
      step: 3, // Avancer à l'étape de prévisualisation
      completed: [true, true, false, false]
    }));
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const updatedItems = prev.items.filter(item => item.id !== itemId);
      const subtotal = updatedItems.reduce((total, item) => total + item.price, 0);
      return {
        items: updatedItems,
        subtotal,
        shipping: prev.shipping,
        total: subtotal + prev.shipping
      };
    });
  };

  const clearCart = () => {
    setCart({
      items: [],
      subtotal: 0,
      shipping: 3000,
      total: 0
    });
  };

  const goToStep = (step) => {
    setOrderProgress(prev => {
      const newCompleted = [...prev.completed];
      // Marquer toutes les étapes précédentes comme terminées
      for (let i = 0; i < step - 1; i++) {
        newCompleted[i] = true;
      }
      return {
        step,
        completed: newCompleted
      };
    });
  };

  // Nettoyer les URLs d'objet lors du démontage du composant
  useEffect(() => {
    return () => {
      if (bookPersonalization.photoUrl) {
        URL.revokeObjectURL(bookPersonalization.photoUrl);
      }
    };
  }, [bookPersonalization.photoUrl]);

  // Valeurs exposées par le contexte
  const value = {
    bookPersonalization,
    cart,
    orderProgress,
    updatePersonalization,
    updatePhoto,
    resetPersonalization,
    addToCart,
    removeFromCart,
    clearCart,
    goToStep
  };

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
};