# KusomaKids - Project Context

## Current Status (February 19, 2026)

**Latest Update**: Comprehensive security audit completed. Deleted 5 dangerous endpoints (debug, set-password, seed-templates), secured admin/worker routes with authentication, disabled guest checkout, applied RLS hardening on `generated_books`, and made `book-audio` bucket private.

## ✅ Recent Major Accomplishments

### Security Audit & Hardening (February 19, 2026)
10 vulnerabilities identified and remediated:

**Files Deleted** (unauthenticated endpoints exposing service_role):
- `src/app/api/auth/set-password/route.js` — Account takeover (any email)
- `src/app/api/debug/tokens/route.js` — Download token leak
- `src/app/api/debug/probe-schema/route.js` — DB data injection
- `src/app/api/debug-book/route.js` — Book data leak
- `src/app/api/admin/seed-templates/route.js` — Unauthenticated template seeding

**Endpoints Secured**:
- `admin/trigger-generation` — Added admin session + role check
- `workers/generate-magic-book` — Added auth + book ownership verification
- `admin/users/update-role` — Uses `service_role` client for RLS compatibility
- `books/create` — Guest checkout disabled (was creating verified accounts for arbitrary emails)
- `audio/proxy` — Auth + ownership check (IDOR protection)

**Database Hardening**:
- RLS enabled on `generated_books` (owner-only access)
- `book-audio` bucket set to private (via Supabase console)
- `generate-speech` API creates private buckets by default

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
- **Landscape PDF Layout**: Side-by-side image/text layout optimized for printing
- **Cart Auto-Clear**: Shopping cart empties automatically after successful purchase
- **Preview UI Cleanup**: Fullscreen button removed from preview mode (only in streaming)

**Technical Implementation**:
- `src/lib/emails/OrderConfirmationEmail.js`: Immediate post-purchase confirmation
- `src/lib/emails/BookReadyEmail.js`: PDF download link sent after worker completion
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

### Magic Stories: Critical Fixes & Enhancements (January 21-25, 2026)
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

3.  **Growth & Conversion (January 24-25)**:
    *   **Club Promo Modal**: Created `ClubPromoModal.js` to upsell the Magic Story feature.
        *   **Design**: Glassmorphism, 3D Magic Book asset, clear value proposition.
        *   **Logic**: Appears after 5 seconds, once per session (sessionStorage).
        *   **Mobile Optimization**: Image hidden on mobile for better fit/reduced height.
        *   **Frictionless Flow**: Button redirects directly to Payment (if logged in) or Signup (if guest), removing intermediate landing page steps.
        *   **Outcome**: Increases visibility of the 6.500 FCFA subscription with optimized conversion path.

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
    *   **Immersive Reader**: 
        *   Added "Karaoke" style word highlighting using proportional audio-timestamp heuristic.
        *   Added Ambient Background Music toggle (🎵) with loop and volume control.
        *   Added slow CSS parallax (`framer-motion` scale animation) to desktop images for micro-interaction.
    *   **Gamification**:
        *   Added "Passeport de Lecture" to the Dashboard (progress bar, 4 dynamic badges based on generated books).
        *   Implemented "Séries & Univers" in `dashboard/create`: Extracts past generated characters (where a reference image was used) and allows reusing that same image as a seed for a new story, ensuring character continuity.
    *   **Viral Loop (Growth)**:
        *   Created new `/share/[id]` public route acting as a "Teaser". It displays the book Cover + the first 2 pages, and ends with a cliffhanger + CTA to create a free account to read the rest.
        *   Added SEO metadata (`generateMetadata`) to the share page for beautiful link previews (WhatsApp, Twitter, OpenGraph) using the book's cover image and personalized title.
        *   Added a "Share" icon (🔗) button on Dashboard book cards and in the Reader UI (top right) that dynamically copies the share URL to the user's clipboard. 
    *   **Reader Experience**: 
        *   Increased desktop container height (`min-h-[850px]`) in `BookReader.js` to reduce letterboxing.
        *   Fixed text centering alignment.
        *   Corrected title overlay on the cover page.
    *   **Image Loading**: Improved robustness of image URL retrieval in `BookReader.js` to handle both `image` and `image_url` property formats.
    *   **Audio API Fix**: Resolved "Book not found" (404) error in `generate-speech/route.js` by using Supabase Admin Client (Service Role) to bypass RLS restrictions during audio generation and caching.

### Build & Deployment Fixes
- **Header Component**: Fixed SSR errors by moving `totalBadgeCount` state to component level
- **Fal-AI Imports**: Corrected to use namespace import (`import * as fal`)
- **Suspense Boundaries**: Added to pages using `useSearchParams`
- **404 Page**: Custom `not-found.js` to prevent prerender errors

### Subscription Renewal System (January 25, 2026)
- **Automated Notifications**: Implemented emails for subscription renewal success and payment failure.
- **Payment Failure Handling**: Automatically downgrades status to `past_due` and prompts user to update payment method.
- **Cancellation Handling**: Updates status to `canceled` upon Stripe subscription deletion.


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
│   │   ├── webhooks/stripe/route.js        # Stripe webhooks (checkout + renewal)
│   │   ├── admin/
│   │   │   ├── stats/route.js              # Admin stats (auth + role check)
│   │   │   ├── trigger-generation/route.js # Manual generation (auth + admin)
│   │   │   └── users/
│   │   │       ├── list/route.js            # User listing (auth + role check)
│   │   │       └── update-role/route.js     # Role update (auth + service_role)
│   │   ├── audio/
│   │   │   ├── generate-speech/route.js     # TTS generation (OpenAI)
│   │   │   └── proxy/route.js              # Audio streaming (auth + ownership)
│   │   ├── books/
│   │   │   ├── create/route.js             # Book creation (auth required)
│   │   │   └── process-purchased/route.js  # Post-purchase processing
│   │   ├── checkout/
│   │   │   ├── payment/route.js            # One-time payment
│   │   │   ├── subscription/route.js       # Club subscription
│   │   │   └── one-time/route.js           # Single book purchase
│   │   ├── download/[bookId]/route.js      # PDF download with credit logic
│   │   ├── download-secure/[bookId]/route.js # Secure token-based PDF download
│   │   └── workers/
│   │       ├── generate-book/route.js      # Background image gen + email
│   │       └── generate-magic-book/route.js # Magic story gen (auth + ownership)
│   ├── dashboard/
│   │   ├── page.js                         # Main dashboard with member badge
│   │   ├── purchased/page.js               # PDFs page
│   │   └── profile/page.js                 # User profile
│   ├── onboarding/success/page.js          # Club welcome page
│   ├── checkout/success/page.js            # Purchase success page
│   └── components/
│       ├── PaymentModal.js                 # Dynamic pricing modal
│       ├── BookReader.js                   # Story reader with audio
│       ├── DashboardBottomNav.js           # Mobile navigation
│       ├── ClubPromoModal.js               # Upsell modal
│       └── Header.js                       # Main header with cart badge
├── middleware.js                            # Auth guard (dashboard/read/onboarding)
└── lib/
    ├── emails/
    │   ├── OrderConfirmationEmail.js       # Immediate order confirmation
    │   ├── BookReadyEmail.js               # PDF download link (after worker)
    │   ├── WelcomeEmail.js                 # Welcome email
    │   ├── SubscriptionSuccessEmail.js     # Monthly renewal success
    │   └── SubscriptionFailedEmail.js      # Payment failure notification
    ├── supabase.js                         # Client-side Supabase client
    └── supabase-server.js                  # Server-side Supabase client
```

## 🔧 Configuration Required

### Supabase Dashboard
**CRITICAL - User Action Required**:
- **Google OAuth**: Enable provider with Client ID/Secret.
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

### Flow 1: Authenticated Book Creation
1. User browses stories on `/books` (public, no auth required)
2. User clicks to personalize → `/personalize/[id]` (public, no auth required)
3. User fills in child name, age, uploads photo → preview
4. User clicks "Create" → `books/create` API **requires authentication**
5. If not logged in → Redirected to `/login` or `/signup`
6. After auth → Book creation proceeds
7. **Email 1 (Immediate)**: Order confirmation
8. Worker generates all 10 illustrations (~2-3 min)
9. Worker creates secure download token (30 days, 3 downloads)
10. **Email 2 (After worker)**: PDF ready with download link

> **Note**: Guest checkout (auto-account creation via email) was disabled in the Feb 2026 security audit due to account takeover risks. Users must now sign up/login before creating a book.

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
3. **Email**: "Votre abonnement est renouvelé" (+1 crédit)
4. System resets `monthly_credits = 1`

### Flow 5: Renewal Failure
1. Stripe payment fails
2. Webhook `invoice.payment_failed` received
3. System updates `subscription_status = 'past_due'`
4. **Email**: "Action requise" (Lien pour mettre à jour paiement)


## 🐛 Known Issues & Limitations

### Minor Issues
- **Google Auth**: Consent screen shows `supabase.co` URL (requires Custom Domain to fix).
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

### Security (Audited February 19, 2026)
- **Authentication**: Supabase Auth (Email + Google OAuth)
- **RLS**: Row Level Security on `generated_books` (owner-only) and `profiles`
- **Webhook Verification**: Stripe signature validation (`constructEvent`)
- **Admin Routes**: Session + role check on all admin endpoints
- **Worker Routes**: Auth + book ownership verification
- **Storage**: `book-audio` bucket is private, audio served via authenticated proxy
- **Middleware**: Protects `/dashboard`, `/read`, `/onboarding` routes
- **Deleted**: All debug endpoints, set-password API, seed-templates

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

*Last Updated: February 19, 2026*
*Version: 4.0 (Security Audit & Hardening)*
