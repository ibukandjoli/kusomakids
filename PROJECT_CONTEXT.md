# KusomaKids - Project Context

## Current Status (January 20, 2026)

**Latest Update**: Site is Launch-Ready. Implemented Meta Pixel, SEO infrastructure (Sitemap/Robots/JSON-LD), Vercel Analytics, and resolved critical UX friction points (Signup flow, One-time payment, UI polish).

## ✅ Recent Major Accomplishments

### Launch Readiness & UX Refinements (January 20, 2026)
Final polish before public traffic:

**Marketing, SEO & Analytics**:
- **Meta Pixel**: Integrated via `src/app/components/MetaPixel.js` tracking PageViews.
- **Advanced SEO**: Dynamic `sitemap.xml` & `robots.txt` generation. Added JSON-LD Organization schema.
- **Performance**: Installed `@vercel/analytics` and `@vercel/speed-insights`.
- **Fonts**: Added 'Chewy' font for child-friendly titles in Book Reader.

**Critical UX Fixes**:
- **Signup Flow**: Detects existing users and prompts login instead of generic error.
- **One-Time Purchase**: Fixed connection between Dashboard and Payment Modal (missing `book` prop).
- **Billing Page**: "Rejoindre le Club" now opens PaymentModal instead of redirecting.
- **Personalization**: Simplified UI instructions and warnings for better clarity.
- **Reader**: Fixed text focus loss and centered cover images properly.

### PDF Delivery & Image Generation System (January 18, 2026)
Complete overhaul of PDF delivery flow with quality guarantees:

**Features Implemented**:
- **Two-Email System**: Immediate order confirmation + PDF ready notification after worker completes
- **Secure Download Tokens**: Cryptographically secure tokens with expiry (30 days) and download limits (3)
- **Worker-Based Generation**: All 10 story illustrations generated with face swap before PDF email sent
- **Ghost Account Password Setup**: Dedicated `/set-password` page with admin API for passwordless accounts
- **Landscape PDF Layout**: Side-by-side image/text layout optimized for printing
- **Cart Auto-Clear**: Shopping cart empties automatically after successful purchase
- **Preview UI Cleanup**: Fullscreen button removed from preview mode (only in streaming)

**Technical Implementation**:
- `src/lib/emails/OrderConfirmationEmail.js`: Immediate post-purchase confirmation
- `src/lib/emails/BookReadyEmail.js`: PDF download link sent after worker completion
- `src/app/api/auth/set-password/route.js`: Admin API to set password for ghost accounts
- `src/app/api/download-secure/[bookId]/route.js`: Token-based secure PDF downloads
- `src/app/api/workers/generate-book/route.js`: Generates all images, creates token, sends PDF email
- `src/app/components/BookReader.js`: Added `showFullscreen` prop for conditional display
- `migrations/create_download_tokens.sql`: Database table for secure download tokens

**Email Flow**:
1. **Immediate** (after payment): Order confirmation with "PDF arriving in 2-3 minutes"
2. **After Worker** (2-3 min): PDF download link with all 10 personalized illustrations

**Database Schema** (`download_tokens` table):
```sql
id uuid primary key
book_id uuid references generated_books(id)
token text unique not null
email text not null
downloads_remaining integer default 3
expires_at timestamp not null
created_at timestamp default now()
```

### Club Kusoma Subscription System (January 17, 2026)
Complete subscription system with monthly credits and member benefits:

**Features Implemented**:
- **Onboarding Success Page** (`/onboarding/success`): Celebration modal with falling petals animation
- **Auto-Unlock for Members**: Club members can read all stories in streaming mode (audio included)
- **Credit System**: 1 free PDF download per month for members
- **Discounted Pricing**: 50% off on additional PDFs (1500F instead of 3000F)
- **Monthly Renewal**: Automatic credit reset via Stripe webhook
- **Member Badge**: Dashboard displays "🏆 Membre du Club" with remaining credits

**Technical Implementation**:
- `src/app/onboarding/success/page.js`: Success page with Suspense boundary
- `src/app/api/webhooks/stripe/route.js`: Handles `checkout.session.completed` and `invoice.payment_succeeded`
- `src/app/api/download/[bookId]/route.js`: Credit deduction logic for PDF downloads
- `src/app/components/PaymentModal.js`: Dynamic pricing display for members
- `src/app/dashboard/page.js`: Member badge and access control

**Database Schema** (Supabase `profiles` table):
```sql
subscription_status text default 'free'  -- 'free' | 'active'
monthly_credits integer default 0
subscription_started_at timestamp
```

### Payment & Email Flow Fixes (January 2026)
- **Cart Badge**: Real-time updates after item removal
- **Magic Link**: Redirects to production URL (`https://www.kusomakids.com/dashboard/purchased`)
- **Email Templates**: Styled `MagicLinkEmail` and `BookReadyEmail` components
- **Purchase Confirmation**: Button text changed to "Télécharger le PDF 📥"
- **Checkout Success Page**: New `/checkout/success` page with clear instructions
- **Newsletter Opt-in**: Metadata passed to Stripe webhooks

### Dashboard UX Improvements
- **Mobile Navigation**: `DashboardBottomNav` component on all dashboard pages
- **Card Layout**: 4 cards per row on desktop, 2 on mobile
- **Member Badge**: Displays subscription status and remaining credits
- **Responsive Design**: Improved mobile experience across all pages

### Magic Stories: Critical Fixes & Enhancements (January 21-24, 2026)
Major stabilization of the "Create Your Own Story" feature and Premium UX upgrades:

1.  **Consistent Art Style & Character Persistence (January 24)**:
    *   **Problem**: Random seeds caused character consistency issues (different faces/styles) across pages.
    *   **Solution**: Implemented **Fixed Seed** logic in `generate-magic-book/route.js`. A unique seed is generated per book and applied to all page generations, ensuring the AI model maintains the same "artistic DNA" and character interpretation throughout the story.
    *   **Result**: Drastically improved visual coherence.

2.  **Premium AI Voice Narration (January 24)**:
    *   **Feature**: Replaced robotic browser TTS with **OpenAI TTS (`tts-1-hd`)**.
    *   **Voice**: "Nova" (Female, natural, energetic).
    *   **Architecture**:
        *   **API**: `src/app/api/audio/generate-speech/route.js` generates and caches audio.
        *   **Client**: `BookReader.js` fetches from API and handles playback with loading states.
        *   **Storage**: Audio files are cached in Supabase Storage (`book-audio` bucket) and linked in the DB (`generated_books` table) to prevent re-generation costs.

3.  **Growth & Conversion (January 24)**:
    *   **Club Promo Modal**: Created `ClubPromoModal.js` to upsell the Magic Story feature.
        *   **Design**: Glassmorphism, 3D Magic Book asset, clear value proposition.
        *   **Logic**: Appears after 5 seconds, once per session (sessionStorage).
        *   **Outcome**: Increases visibility of the 6.500 FCFA subscription.

4.  **Image Persistence Architecture Refactor**:
    *   **Problem**: Race condition between client-side text save and worker-side image save caused images to be overwritten/lost.
    *   **Solution**: Refactored `src/app/api/workers/generate-magic-book/route.js` to accept the latest text content directly from the client request. The worker now performs a single, atomic update saving both text and images, eliminating the need for a separate client-side save.
    *   **Schema Fix**: Removed erroneous `completed_at` column update in the worker which was causing silent database save failures.

5.  **Generation Quality Improvements**:
    *   **Style**: Enforced "Studio Ghibli/Anime" style in the Fal AI prompt (`src/app/api/workers/generate-magic-book/route.js`). explicitly banning "Disney/Pixar/3D" styles for a more artistic, 2D aesthetic.
    *   **Content**: Updated LLM prompt (`src/app/api/magic/generate-text/route.js`) to generate longer, richer narratives (3-4 sentences/50 words per page) instead of short captions.

6.  **UI/UX Improvements**:
    *   **PDF Revert**: Restored **Portrait** layout for PDF covers with centered title and image (user preference).
    *   **Client Fixes**: Resolved `alt` tag warnings and Facebook Pixel `fbq` reference errors.
    *   **Dashboard Titles**: Fixed logic in `src/app/dashboard/page.js` and `purchased/page.js` to prioritize the generated story title (`story_content.title`) over the fallback template title.
    *   **Reader Experience**: 
        *   Increased desktop container height (`min-h-[850px]`) in `BookReader.js` to reduce letterboxing.
        *   Fixed text centering alignment.
        *   Corrected title overlay on the cover page.
    *   **Image Loading**: Improved robustness of image URL retrieval in `BookReader.js` to handle both `image` and `image_url` property formats.

### Build & Deployment Fixes
- **Header Component**: Fixed SSR errors by moving `totalBadgeCount` state to component level
- **Fal-AI Imports**: Corrected to use namespace import (`import * as fal`)
- **Suspense Boundaries**: Added to pages using `useSearchParams`
- **404 Page**: Custom `not-found.js` to prevent prerender errors

### Face Swap & Image Generation
- **Face Swap Working**: Verified in both frontend preview and backend worker
- **Database Schema**: Aligned `pages` → `story_content` (JSONB)
- **Cover Images**: Added `cover_image_url` field
- **Worker Process**: Background generation with email notifications

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 16.1.1 (App Router)
- **Database**: Supabase (PostgreSQL + Auth)
- **Payments**: Stripe (Checkout + Subscriptions)
- **AI Images**: Fal AI (Flux Dev + Face Swap)
- **Emails**: Resend
- **PDF Generation**: @react-pdf/renderer

### Key Files & Directories
```
src/
├── app/
│   ├── api/
│   │   ├── webhooks/stripe/route.js      # Stripe webhooks (checkout + renewal)
│   │   ├── auth/set-password/route.js     # Ghost account password setup
│   │   ├── download/[bookId]/route.js    # PDF download with credit logic
│   │   ├── download-secure/[bookId]/route.js # Secure token-based PDF download
│   │   ├── workers/generate-book/route.js # Background image generation + email
│   │   ├── checkout/
│   │   │   ├── payment/route.js          # One-time payment
│   │   │   ├── subscription/route.js     # Club subscription
│   │   │   └── one-time/route.js         # Single book purchase
│   │   └── books/
│   │       └── process-purchased/route.js # Post-purchase processing
│   ├── dashboard/
│   │   ├── page.js                       # Main dashboard with member badge
│   │   ├── purchased/page.js             # PDFs page
│   │   └── profile/page.js               # User profile
│   ├── set-password/page.js           # Password setup for ghost accounts
│   ├── onboarding/success/page.js     # Club welcome page
│   ├── checkout/success/page.js       # Purchase success page (auto-clears cart)
│   └── components/
│       ├── PaymentModal.js               # Dynamic pricing modal
│       ├── BookReader.js                 # Story reader with showFullscreen prop
│       ├── DashboardBottomNav.js         # Mobile navigation
│       └── Header.js                     # Main header with cart badge
└── lib/
    ├── emails/
    │   ├── OrderConfirmationEmail.js     # Immediate order confirmation
    │   ├── BookReadyEmail.js             # PDF download link (after worker)
    │   └── WelcomeEmail.js               # Welcome email
    └── supabase.js                       # Supabase client
```

## 🔧 Configuration Required

### Supabase Dashboard
**CRITICAL - User Action Required**:
- **Redirect URLs**: `https://www.kusomakids.com/**`
- **Site URL**: `https://www.kusomakids.com`

This prevents Magic Links from redirecting to `localhost`.

### Stripe Webhooks
Configure these events in Stripe Dashboard:
- `checkout.session.completed` - New purchases and subscriptions
- `invoice.payment_succeeded` - Monthly subscription renewals

**Webhook URL**: `https://www.kusomakids.com/api/webhooks/stripe`

### Environment Variables
```env
# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_STRIPE_PRICE_ID=price_...  # Club subscription price

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# Fal AI
FAL_KEY=...

# Resend
RESEND_API_KEY=...

# App
NEXT_PUBLIC_APP_URL=https://www.kusomakids.com
```

## 📋 User Flows

### Flow 1: Guest PDF Purchase (New System)
1. User adds book to cart and checks out (3,000 FCFA)
2. Stripe payment success → Webhook creates ghost account
3. **Email 1 (Immediate)**: Order confirmation
   - "Your illustrations are being finalized..."
   - "PDF will arrive in 2-3 minutes"
   - Link to set password and create account
4. Worker generates all 10 illustrations with face swap (~2-3 min)
5. Worker creates secure download token (30 days, 3 downloads)
6. **Email 2 (After worker)**: PDF ready with download link
7. User clicks link → Downloads PDF with all 10 personalized pages
8. User sets password → Onboarding → Dashboard
9. PDF accessible in "Mes PDFs" page

### Flow 2: Club Subscription
1. User clicks "Devenir Membre" (6,500 FCFA/month)
2. Stripe checkout → Payment success
3. Webhook activates subscription:
   - `subscription_status = 'active'`
   - `monthly_credits = 1`
4. Redirect to `/onboarding/success` with celebration
5. Dashboard shows "🏆 Membre du Club" badge
6. All stories unlocked for streaming

### Flow 2: PDF Download (Club Member with Credit)
1. Member clicks "📥" on story
2. System checks: `is_unlocked`? → No
3. Checks: `subscription_status === 'active'` AND `monthly_credits > 0`? → Yes
4. Auto-unlock book + Deduct credit
5. Generate and download PDF
6. Badge updates: "0 crédit restant"

### Flow 3: Additional PDF Purchase (Member)
1. Member without credits clicks "📥"
2. `PaymentModal` shows discounted price: **1,500 FCFA** (50% off)
3. After payment → Book unlocked → PDF downloaded

### Flow 4: Monthly Renewal
1. Stripe charges monthly subscription
2. Webhook `invoice.payment_succeeded` received
3. System resets `monthly_credits = 1`
4. Member can download 1 new PDF for free

## 🐛 Known Issues & Limitations

### Minor Issues
- **Face Swap Quality**: Could be improved with parameter tuning
- **Browserslist Warning**: Data is 11 months old (cosmetic)
- **Middleware Deprecation**: Next.js recommends using "proxy" instead

### Future Enhancements
1. **Subscription Management**: Allow users to cancel/update subscription from dashboard
2. **Credit History**: Track credit usage and renewal dates
3. **Physical Book Orders**: "Commander en papier" feature (currently placeholder)
4. **Admin Panel**: Manage subscriptions and view analytics
5. **Email Preferences**: Allow users to opt-out of specific email types
6. **Multi-language Support**: Currently French only

## 🧪 Testing Checklist

### Subscription Flow
- [ ] Complete test subscription payment
- [ ] Verify profile updated (`subscription_status = 'active'`)
- [ ] Check welcome email received
- [ ] Confirm redirect to `/onboarding/success`
- [ ] Verify member badge displays in dashboard

### Credit System
- [ ] Download PDF with credit (verify deduction)
- [ ] Attempt download without credit (verify modal shows)
- [ ] Verify discounted price (1500F) for members
- [ ] Test that unlocked books don't consume credits

### Monthly Renewal
- [ ] Simulate `invoice.payment_succeeded` webhook
- [ ] Verify credits reset to 1
- [ ] Confirm subscription status remains active

### Email Delivery
- [ ] Welcome email (new users)
- [ ] Magic Link email (redirects to production)
- [ ] Purchase confirmation (correct book title)
- [ ] Club welcome email (new members)

## 📚 Development Notes

### Code Quality
- **TypeScript**: Not currently used (pure JavaScript)
- **ESLint**: Configured with Next.js defaults
- **Formatting**: Standard Next.js conventions

### Performance Considerations
- **Image Optimization**: Next.js Image component used throughout
- **PDF Generation**: Async with streaming response
- **Face Swap**: Background worker to avoid blocking UI
- **Caching**: Vercel build cache enabled

### Security
- **Authentication**: Supabase Auth with Magic Links
- **RLS**: Row Level Security on Supabase tables
- **Webhook Verification**: Stripe signature validation
- **API Routes**: Server-side only, no client exposure

## 🚀 Deployment

### Platform
- **Hosting**: Vercel
- **Database**: Supabase Cloud
- **Domain**: kusomakids.com

### Build Process
```bash
npm run build  # Next.js production build
npm start      # Production server
```

### Common Build Errors
1. **Suspense Boundary**: Wrap `useSearchParams` in Suspense
2. **Import Errors**: Use correct import style for packages
3. **SSR State**: Ensure useState is at component level, not in useEffect

## 📞 Support & Contact

**Developer Notes**:
- All webhook logs visible in Stripe Dashboard
- Supabase logs available in project dashboard
- Vercel deployment logs show build errors

**User Support Email**: hello@kusomakids.com

---

*Last Updated: January 20, 2026*
*Version: 2.2 (Launch Readiness & UX Refinements)*

