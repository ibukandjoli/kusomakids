// src/app/personalize/[id]/page.js
'use client';

import { useState, useEffect, use } from 'react'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import { useBookContext } from '../../context/BookContext';
import { bookService } from '../../services/bookService';
import { photoProcessingService } from '../../services/photoProcessingService';

export default function PersonalizePage({ params }) {
  // Utilisez React.use() pour déballer la promesse
  const { id } = use(params);
  const router = useRouter();
  const { 
    bookPersonalization, 
    updatePersonalization, 
    updatePhoto, 
    goToStep 
  } = useBookContext();
  
  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [photoValidationState, setPhotoValidationState] = useState({
    validating: false,
    validated: false,
    message: '',
    isValid: false
  });
  
  // Charger les détails du livre
  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        const bookData = await bookService.getBookById(id);
        setBook(bookData);
        
        // Mettre à jour le contexte avec l'ID du livre
        updatePersonalization({ bookId: id });
        
        // Avancer à l'étape 2 (personnalisation)
        goToStep(2);
      } catch (error) {
        console.error('Erreur lors du chargement des détails du livre:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookDetails();
  }, [id, updatePersonalization, goToStep]);
  
  // Configuration de la dropzone pour l'upload de photo
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxSize: 5242880, // 5MB
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        
        // Mettre à jour l'UI
        setPhotoValidationState({
          validating: true,
          validated: false,
          message: 'Validation de la photo en cours...',
          isValid: false
        });
        
        try {
          // Valider la photo
          const validationResult = await photoProcessingService.validatePhoto(file);
          
          if (validationResult.isValid) {
            // Mettre à jour le contexte avec la photo
            updatePhoto(file);
            
            // Mettre à jour l'état de validation
            setPhotoValidationState({
              validating: false,
              validated: true,
              message: 'Photo validée avec succès',
              isValid: true
            });
            
            // Effacer l'erreur de formulaire si elle existe
            if (formErrors.photo) {
              setFormErrors(prev => ({ ...prev, photo: null }));
            }
          } else {
            // Mettre à jour l'état de validation avec l'erreur
            setPhotoValidationState({
              validating: false,
              validated: true,
              message: validationResult.message,
              isValid: false
            });
            
            // Définir l'erreur de formulaire
            setFormErrors(prev => ({ ...prev, photo: validationResult.message }));
          }
        } catch (error) {
          console.error('Erreur lors de la validation de la photo:', error);
          
          // Mettre à jour l'état de validation avec l'erreur
          setPhotoValidationState({
            validating: false,
            validated: true,
            message: 'Une erreur est survenue lors de la validation',
            isValid: false
          });
          
          // Définir l'erreur de formulaire
          setFormErrors(prev => ({ ...prev, photo: 'Une erreur est survenue lors de la validation' }));
        }
      }
    }
  });
  
  // Gérer les changements dans les champs du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Mettre à jour le contexte
    updatePersonalization({ [name]: value });
    
    // Valider le champ
    validateField(name, value);
  };
  
  // Valider un champ spécifique
  const validateField = (name, value) => {
    let errors = { ...formErrors };
    
    if (name === 'childName') {
      if (!value.trim()) {
        errors.childName = 'Le prénom est requis';
      } else if (value.trim().length < 2) {
        errors.childName = 'Le prénom doit contenir au moins 2 caractères';
      } else {
        delete errors.childName;
      }
    }
    
    if (name === 'childAge') {
      if (!value) {
        errors.childAge = 'L\'âge est requis';
      } else if (value < 2 || value > 12) {
        errors.childAge = 'L\'âge doit être entre 2 et 12 ans';
      } else {
        delete errors.childAge;
      }
    }
    
    setFormErrors(errors);
  };
  
  // Valider tout le formulaire
  const validateForm = () => {
    const errors = {};
    
    if (!bookPersonalization.childName || bookPersonalization.childName.trim().length < 2) {
      errors.childName = 'Le prénom doit contenir au moins 2 caractères';
    }
    
    if (!bookPersonalization.childAge) {
      errors.childAge = 'L\'âge est requis';
    } else if (bookPersonalization.childAge < 2 || bookPersonalization.childAge > 12) {
      errors.childAge = 'L\'âge doit être entre 2 et 12 ans';
    }
    
    if (!bookPersonalization.photo) {
      errors.photo = 'Une photo est requise';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsProcessing(true);
      
      try {
        // Ici, vous pourriez effectuer des traitements supplémentaires
        // Par exemple, traiter la photo avec l'IA
        // await photoProcessingService.processPhoto(bookPersonalization.photo, book.folder);
        
        // Rediriger vers la page de prévisualisation
        router.push(`/preview/${id}`);
      } catch (error) {
        console.error('Erreur lors de la soumission du formulaire:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };
  
  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-700">Chargement des détails du livre...</p>
        </div>
      </main>
    );
  }
  
  if (!book) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center py-12">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Livre non trouvé</h2>
          <p className="text-gray-700 mb-6">Nous n'avons pas pu trouver le livre que vous cherchez.</p>
          <Link 
            href="/books" 
            className="inline-block bg-orange-500 text-white font-bold py-2 px-6 rounded-full hover:bg-orange-600"
          >
            Parcourir nos livres
          </Link>
        </div>
      </main>
    );
  }
  
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Barre de progression */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
              2
            </div>
            <h2 className="text-xl font-semibold">Personnalisation du livre</h2>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded">
            <div className="h-1 bg-orange-500 rounded" style={{ width: '33%' }}></div>
          </div>
        </div>
        
        {/* Formulaire de personnalisation */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSubmit}>
            {/* Photo Upload */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Photo de votre enfant</h3>
              
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                          ${isDragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300'}
                          ${formErrors.photo ? 'border-red-500' : ''}
                          ${photoValidationState.isValid ? 'border-green-500' : ''}`}
              >
                <input {...getInputProps()} />
                
                {photoValidationState.validating ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div>
                    <p className="text-gray-600">Validation de votre photo...</p>
                  </div>
                ) : bookPersonalization.photoUrl ? (
                  <div className="flex flex-col items-center">
                    <img 
                      src={bookPersonalization.photoUrl} 
                      alt="Aperçu" 
                      className="h-48 object-contain mb-4 rounded" 
                    />
                    {photoValidationState.validated && (
                      <div className={`text-sm mb-2 ${photoValidationState.isValid ? 'text-green-600' : 'text-red-600'}`}>
                        {photoValidationState.message}
                      </div>
                    )}
                    <p className="text-gray-600">Cliquez ou glissez-déposez pour changer de photo</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-600 mb-2">Cliquez ou glissez-déposez une photo ici</p>
                    <p className="text-gray-500 text-sm">JPG ou PNG, max 5MB</p>
                  </div>
                )}
              </div>
              
              {formErrors.photo && !photoValidationState.validating && (
                <p className="mt-2 text-red-600 text-sm">{formErrors.photo}</p>
              )}
              
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <div className="bg-gray-100 rounded-full p-3 mx-auto w-12 h-12 flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600">Solo, face visible</p>
                </div>
                <div className="text-center">
                  <div className="bg-gray-100 rounded-full p-3 mx-auto w-12 h-12 flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600">Bonne luminosité</p>
                </div>
                <div className="text-center">
                  <div className="bg-gray-100 rounded-full p-3 mx-auto w-12 h-12 flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600">Pas de chapeau</p>
                </div>
                <div className="text-center">
                  <div className="bg-gray-100 rounded-full p-3 mx-auto w-12 h-12 flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600">Visage entier</p>
                </div>
              </div>
            </div>
            
            {/* Child Info */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Informations sur votre enfant</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="childName" className="block text-gray-700 mb-2">
                    Prénom de l'enfant *
                  </label>
                  <input 
                    type="text" 
                    id="childName"
                    name="childName"
                    value={bookPersonalization.childName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition
                              ${formErrors.childName ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Ex: Kofi, Amina, etc."
                    maxLength={20}
                  />
                  {formErrors.childName && (
                    <p className="mt-2 text-red-600 text-sm">{formErrors.childName}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="childAge" className="block text-gray-700 mb-2">
                    Âge de l'enfant *
                  </label>
                  <input 
                    type="number" 
                    id="childAge"
                    name="childAge"
                    value={bookPersonalization.childAge}
                    onChange={handleInputChange}
                    min="2"
                    max="12"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition
                              ${formErrors.childAge ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Entre 2 et 12 ans"
                  />
                  {formErrors.childAge && (
                    <p className="mt-2 text-red-600 text-sm">{formErrors.childAge}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <Link 
                href={`/book/${id}`}
                className="px-6 py-3 border border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-50 text-center transition"
              >
                Retour
              </Link>
              
              <button
                type="submit"
                disabled={isProcessing}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-lg transform transition hover:scale-105 disabled:opacity-70 disabled:transform-none disabled:hover:bg-orange-500"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Traitement en cours...
                  </span>
                ) : (
                  'Prévisualiser le livre'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}