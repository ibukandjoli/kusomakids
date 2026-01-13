'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cartItem, setCartItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [draftBook, setDraftBook] = useState(null); // The actual story content

  // Checkout States
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [credits, setCredits] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Get User
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user);
      if (session?.user?.email) setEmail(session.user.email);

      // Load specific cart data (Story content)
      const storedItem = localStorage.getItem('cart_item');
      let parsedDraft = null;
      if (storedItem) {
        parsedDraft = JSON.parse(storedItem);
        setDraftBook(parsedDraft);
      }

      // Check Plan
      const plan = searchParams.get('plan');
      const bookId = searchParams.get('book_id') || searchParams.get('redirect_book_id'); // Template ID

      if (plan === 'club') {
        // CLUB MODE
        setCartItem({
          type: 'club',
          price: 6500,
          bookTitle: "Adhésion Club Kusoma",
          coverUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z5eXAzZ3Z5eXAzZ3Z5eXAzZ3Z5eXAzZ3Z5eXAzZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyM/giphy.gif",
          personalization: { childName: 'Membre VIP' },
          targetBookId: bookId
        });
      } else {
        // NORMAL CART MODE
        if (parsedDraft) {
          setCartItem(parsedDraft);
        }
      }
      setLoading(false);
    };
    init();
  }, [router, searchParams]);

  const handlePayment = async () => {
    setProcessing(true);

    // 1. SAVE DRAFT IF EXISTS (Club or One-Time)
    // We must ensure the book exists in DB before payment to attach ID.
    let createdBookId = null;

    if (draftBook && draftBook.finalizedPages) {
      try {
        const saveRes = await fetch('/api/books/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: draftBook.bookTitle,
            childName: draftBook.personalization?.childName,
            childAge: draftBook.personalization?.age,
            childGender: draftBook.personalization?.gender,
            childPhotoUrl: draftBook.personalization?.photoUrl,
            content_json: draftBook.finalizedPages,
            coverUrl: draftBook.coverUrl,
            templateId: draftBook.bookId // The original template ID
          })
        });
        const saveData = await saveRes.json();
        if (saveData.success) {
          createdBookId = saveData.bookId;
          console.log("✅ Draft Book Saved:", createdBookId);
        } else {
          console.error("Failed to save draft:", saveData.error);
          // Proceeding without ID? No, we need it.
          // Alert user?
          alert("Erreur de sauvegarde du livre. Veuillez réessayer.");
          setProcessing(false);
          return;
        }
      } catch (e) {
        console.error("Save Draft Error:", e);
        alert("Erreur technique (Sauvegarde).");
        setProcessing(false);
        return;
      }
    }

    const targetId = createdBookId || cartItem?.targetBookId; // Fallback to template ID if save failed (shouldn't happen if logic strict)

    // CLUB SUBSCRIPTION FLOW
    if (cartItem?.type === 'club') {
      try {
        const res = await fetch('/api/checkout/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            email: email,
            target_book_id: targetId,
            priceId: 'price_1Q...' // Replace with env var in real app
          })
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert("Erreur Stripe: " + data.error);
          setProcessing(false);
        }
      } catch (error) {
        console.error("Payment Error:", error);
        alert("Erreur de connexion paiement.");
        setProcessing(false);
      }
      return;
    }

    // NORMAL CART FLOW (Simulation for now)
    setTimeout(() => {
      setProcessing(false);
      alert("Paiement simulé réussi ! Votre livre est en cours de génération.");
      localStorage.removeItem('cart_item');
      router.push('/');
    }, 2000);
  };

  if (loading) return <div className="min-h-screen pt-32 text-center">Chargement...</div>;

  if (!cartItem) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 text-center px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Votre panier est vide</h1>
          <p className="text-gray-600 mb-8">Il semble que vous n'ayez pas encore personnalisé d'histoire.</p>
          <Link href="/books" className="inline-block bg-orange-500 text-white font-bold py-3 px-8 rounded-full hover:bg-orange-600 transition">
            Découvrir nos histoires
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Finaliser votre commande</h1>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* LEFT: Checkout Steps */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. Contact Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">1</span>
                Informations de contact
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse Email (pour recevoir le livre)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="newsletter" className="rounded text-orange-500 focus:ring-orange-500" />
                  <label htmlFor="newsletter" className="text-sm text-gray-600">M'inscrire au Club Kusoma pour des histoires gratuites.</label>
                </div>
              </div>
            </div>

            {/* 2. Payment Method */}
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">2</span>
                Paiement sécurisé
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="h-8 w-auto relative flex items-center justify-center">
                    <img src="/images/payment/visa.svg" alt="Visa" className="h-full object-contain" />
                  </div>
                  <span className="font-bold text-sm">Carte Bancaire</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('mobile')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'mobile' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="h-8 w-auto relative flex items-center justify-center">
                    <img src="/images/payment/wave.svg" alt="Wave" className="h-full object-contain" />
                  </div>
                  <span className="font-bold text-sm">Wave</span>
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                Vous pouvez payer avec votre carte Wave, Djamo, Orange Money, Yas, Visa ou Mastercard.
              </p>

              {credits > 0 && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎁</span>
                    <div>
                      <p className="font-bold text-green-800">Utiliser un crédit Club</p>
                      <p className="text-xs text-green-600">Vous avez {credits} crédits disponibles.</p>
                    </div>
                  </div>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Appliquer (-3000F)</button>
                </div>
              )}

            </div>

          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-lg sticky top-32">
              <h3 className="font-bold text-gray-900 mb-6 text-lg">Récapitulatif</h3>

              <div className="flex gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className="w-16 h-20 bg-gray-200 rounded-lg flex-shrink-0 bg-cover bg-center overflow-hidden relative">
                  {cartItem.coverUrl ? (
                    <img src={cartItem.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-orange-100 flex items-center justify-center text-xs text-orange-400">?</div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900 line-clamp-2">{cartItem.bookTitle}</p>
                  <p className="text-sm text-gray-500 mt-1">Pour {cartItem.personalization.childName}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Livre Personnalisé PDF</span>
                  <span>{cartItem.price} F</span>
                </div>
                <div className="text-xs text-green-600 font-bold flex items-center gap-1">
                  <span>✨</span> Inclus : PDF Haute Définition (A conserver à vie)
                </div>
                {/* Audio line removed as requested */}
                <div className="flex justify-between text-xl font-bold text-gray-900 border-t border-gray-100 pt-4">
                  <span>Total</span>
                  <span>{cartItem.price} FCFA</span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={processing || !email}
                className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all ${processing || !email
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 hover:shadow-orange-500/30'
                  }`}
              >
                {processing ? 'Traitement...' : 'Payer et Télécharger'}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-gray-400 text-xs grayscale opacity-70">
                <span>🔒 Paiement SSL Sécurisé</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}