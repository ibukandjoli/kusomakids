# KusomaKids - Project Context

## Current Status (January 17, 2026)

**Latest Update**: Club Kusoma subscription system fully implemented with auto-unlock, credit management, and discounted pricing.

## ✅ Recent Major Accomplishments

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
│   │   ├── download/[bookId]/route.js    # PDF download with credit logic
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
│   ├── onboarding/success/page.js        # Club welcome page
│   ├── checkout/success/page.js          # Purchase success page
│   └── components/
│       ├── PaymentModal.js               # Dynamic pricing modal
│       ├── DashboardBottomNav.js         # Mobile navigation
│       └── Header.js                     # Main header with cart badge
└── lib/
    ├── emails/
    │   ├── MagicLinkEmail.js             # Styled magic link email
    │   ├── BookReadyEmail.js             # Purchase confirmation
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

### Flow 1: Club Subscription
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

*Last Updated: January 17, 2026*
*Version: 2.0 (Club Kusoma Launch)*
