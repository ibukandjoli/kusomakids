'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatTitle } from '@/utils/format';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Checkout States
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [credits, setCredits] = useState(0);
  const [processing, setProcessing] = useState(false);

  // Helper to format title with Child Name
  const getDisplayTitle = (title, childName) => {
    if (!title) return "Livre Personnalisé";
    const cleanTitle = formatTitle(title); // Handles other format quirks if any
    // Explicitly replace {childName} with the actual name if present
    // Note: formatTitle might have replaced it with [Son prénom]. 
    // If formatTitle is simplistic, we might need to handle raw title.
    // Let's assume title comes with placeholder.
    return title.replace(/\{childName\}/gi, childName || 'votre enfant');
  };

  useEffect(() => {
    const init = async () => {
      // Get User
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user);
      if (session?.user?.email) setEmail(session.user.email);

      // Load Cart Data (Multi-item support)
      let items = [];
      try {
        const storedList = localStorage.getItem('cart_items');
        if (storedList) {
          items = JSON.parse(storedList);
        } else {
          // Fallback to single item legacy
          const storedSingle = localStorage.getItem('cart_item');
          if (storedSingle) {
            items = [JSON.parse(storedSingle)];
          }
        }
      } catch (e) {
        console.error("Cart Load Error:", e);
      }

      // Check Plan (Club Subscription)
      const plan = searchParams.get('plan');
      const bookId = searchParams.get('book_id') || searchParams.get('redirect_book_id');

      if (plan === 'club') {
        // CLUB MODE - Override cart? Or append?
        // Usually checkout for Club is specific. Let's start with JUST Club if plan is set.
        setCartItems([{
          type: 'club',
          price: 6500,
          bookTitle: "Adhésion Club Kusoma",
          coverUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z5eXAzZ3Z5eXAzZ3Z5eXAzZ3Z5eXAzZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyM/giphy.gif",
          personalization: { childName: 'Membre VIP' },
          targetBookId: bookId
        }]);
      } else {
        // NORMAL CART MODE
        if (Array.isArray(items) && items.length > 0) {
          setCartItems(items);
        }
      }
      setLoading(false);
    };
    init();
  }, [router, searchParams]);

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price || 3000), 0);
  const discount = credits > 0 ? 3000 * Math.min(credits, cartItems.length) : 0; // Simple discount logic
  const total = Math.max(0, subtotal - discount);

  const handlePayment = async () => {
    setProcessing(true);

    const processedBookIds = [];

    // 1. ITERATE AND SAVE EACH BOOK IF NEEDED
    // We update cartItems with bookId as we go, but local state might not reflect immediately.
    // We use a temp array.

    for (const item of cartItems) {
      if (item.type === 'club') continue; // Handle separate

      let bookId = item.bookId;

      // If draft not saved yet
      if (!bookId) {
        try {
          console.log(`💾 Saving Book: ${item.bookTitle}`);
          const contentToSave = item.content || { pages: item.finalizedPages };

          const saveRes = await fetch('/api/books/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email, // Guest checkout support
              title: item.bookTitle,
              childName: item.personalization?.childName,
              childAge: item.personalization?.age,
              childGender: item.personalization?.gender,
              childPhotoUrl: item.personalization?.photoUrl,
              content_json: contentToSave,
              coverUrl: item.coverImage || item.coverUrl,
              templateId: item.templateId
            })
          });

          const saveData = await saveRes.json();
          if (!saveRes.ok) throw new Error(saveData.error || "Erreur sauvegarde de l'histoire");
          bookId = saveData.bookId;
          console.log(`✅ Saved: ${bookId}`);

        } catch (err) {
          console.error("Save Error:", err);
          alert(`Erreur lors de la sauvegarde de l'histoire "${item.bookTitle}". Veuillez réessayer.`);
          setProcessing(false);
          return; // Stop flow
        }
      }

      if (bookId) processedBookIds.push(bookId);
    }

    // 2. TRIGGER STRIPE PAYMENT
    try {
      // We currently handle Single Item Checkout primarily for the flow
      // If multiple items, we might need a cart implementation in Stripe or loop.
      // MVP: Pay for the FIRST book in the list (most common case: 1 book).
      const itemToPay = cartItems[0];
      const targetBookId = processedBookIds[0] || itemToPay.bookId;

      const res = await fetch('/api/checkout/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          email: email,
          bookId: targetBookId,
          bookTitle: itemToPay.bookTitle,
          childName: itemToPay.personalization?.childName,
          coverUrl: itemToPay.coverImage || itemToPay.coverUrl
        })
      });

      const data = await res.json();

      if (data.url) {
        // Redirect to Stripe
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Erreur lors de l'initialisation du paiement");
      }

    } catch (error) {
      console.error("Payment Error:", error);
      alert("Erreur de paiement: " + error.message);
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen pt-32 text-center">Chargement...</div>;

  if (cartItems.length === 0) {
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
    <div className="min-h-screen pt-32 pb-20 relative bg-[#FAFAF8]">
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'url(/images/pattern_bg.png)', backgroundSize: '400px' }}></div>

      <div className="container mx-auto px-4 max-w-5xl relative z-10">
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
                  <label htmlFor="newsletter" className="text-sm text-gray-600">M'inscrire au Club Kusoma pour lire en ligne en illimité (audio inclus).</label>
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
                <button onClick={() => setPaymentMethod('card')} className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}>
                  <div className="h-8 w-auto relative"><img src="/images/payment/visa.svg" alt="Visa" className="h-full object-contain" /></div>
                  <span className="font-bold text-sm">Carte Bancaire</span>
                </button>
                <button onClick={() => setPaymentMethod('mobile')} className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all overflow-hidden relative h-24 ${paymentMethod === 'mobile' ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}>
                  {/* Wave Card Image as Cover */}
                  <div className="absolute inset-2">
                    <img src="/images/payment/wave-card.png" alt="Carte Wave Visa" className="w-full h-full object-contain" />
                  </div>
                  {/* Overlay for selection state if needed, or just label below? Layout is tricky if image is bg. lets keep simplified card look */}
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                Vous pouvez payer avec votre carte Wave, Djamo, Orange Money, Yas, Visa ou Mastercard.
              </p>
            </div>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-lg sticky top-32">
              <h3 className="font-bold text-gray-900 mb-6 text-lg">Récapitulatif ({cartItems.length})</h3>

              <div className="space-y-6 mb-6 pb-6 border-b border-gray-100 max-h-[400px] overflow-y-auto">
                {cartItems.map((item, idx) => (
                  <div key={item.cartId || idx} className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 bg-cover bg-center overflow-hidden border border-gray-200">
                      {item.coverUrl || item.coverImage ? (
                        <img src={item.coverUrl || item.coverImage} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-orange-100 flex items-center justify-center text-xs text-orange-400">?</div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm line-clamp-2">
                        {getDisplayTitle(item.bookTitle, item.personalization?.childName)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Pour {item.personalization?.childName}</p>
                      <p className="text-sm font-bold text-orange-600 mt-1">{item.price || 3000} F</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>Sous-total</span>
                  <span>{subtotal} FCFA</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Réduction</span>
                    <span>-{discount} FCFA</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900 border-t border-gray-100 pt-4">
                  <span>Total</span>
                  <span>{total} FCFA</span>
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
                {processing ? 'Traitement...' : `Payer ${total} FCFA`}
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

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 text-center">Chargement de la commande...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}