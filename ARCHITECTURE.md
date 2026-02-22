# Technical Architecture - KusomaKids

## 1. High Level Overview
KusomaKids is a **Next.js 16** application deployed on **Vercel**. It uses **Supabase** for backend services (Auth, DB, Storage) and integrates multiple AI providers (**Fal AI**, **OpenAI**) for content generation. Payments are handled by **Stripe**.

## 2. Tech Stack Setup
| Layer | Technology | Service |
| :--- | :--- | :--- |
| **Frontend** | React 19, Next.js 16 (App Router) | Vercel |
| **Styling** | Tailwind CSS | - |
| **Auth** | Supabase Auth (Email + Google OAuth) | Supabase |
| **Database** | PostgreSQL + RLS | Supabase |
| **Storage** | S3-compatible Buckets | Supabase Storage |
| **AI (Images)** | Flux Dev + Face Swap (LoRA) | Fal AI |
| **AI (Text/Audio)** | GPT-4o-mini / TTS-1-hd | OpenAI |
| **Payments** | Checkout & Subscriptions | Stripe |
| **Emails** | Transactional | Resend |

## 3. Data Flow & Core Processes

### A. Story Generation (Async)
1.  **Client**: Calls `/api/magic/generate-text` (OpenAI). Returns 10 pages of text.
2.  **Client**: Displays text immediately.
3.  **Admin/Worker**: Triggered via `/api/admin/trigger-generation` (after payment or valid creation).
    *   Calls **Fal AI** for image generation (Parallel requests).
    *   Uses `Flux Dev` with Face Swap model.
    *   Strict "Studio Ghibli" style prompt.
4.  **Database**: Updates `generated_books` with image URLs.
5.  **Email**: Sends notification when images are ready.

### B. Payment & Fulfillment
1.  **Stripe Checkout**: User pays.
2.  **Webhook** (`invoice.payment_succeeded` / `checkout.session.completed`):
    *   **Logic**: `src/app/api/webhooks/stripe/route.js`.
    *   **Action**: Unlocks book (`is_unlocked = true`).
    *   **Credit Purchase**: Detects `metadata.type === 'credit_purchase'` → Adds credits to profile.
    *   **Auth Required**: User must be logged in before checkout (guest checkout disabled).
    *   **Notification**: Sends confirmation Email.

### C. Credit & Reward System
1.  **Credit Purchase** (`/api/checkout/credits`): Stripe checkout at 1,500 FCFA/credit (Club members only).
2.  **Reward Milestones** (`/api/rewards/claim`): Grants free credits at 10/15/25 books.
3.  **Billing Portal** (`/api/billing/portal`): Stripe Customer Portal for subscription management.

### D. Audio System
1.  **Client**: Request audio play.
2.  **API** (`/api/audio/generate-speech`):
    *   Checks if `audio_url` exists in DB.
    *   If no: Calls OpenAI TTS -> Uploads to Supabase Storage -> Updates DB.
    *   If yes: Returns existing URL.
3.  **Security**: Uses **Service Role** to bypass RLS for file upload/update.

## 4. Database Schema (Key Tables)

### `generated_books`
*   `id` (UUID): Primary Key.
*   `user_id` (UUID): Owner (linked to `auth.users`).
*   `story_content` (JSONB): Array of pages `{text, image_url, audio_url}`.
*   `child_name` (Text): Metadata.
*   `is_unlocked` (Boolean): Access control.

### `profiles` (extends `auth.users`)
*   `id`: References `auth.users`.
*   `role`: User role from onboarding (parent, grandparent, uncle_aunt, other).
*   `subscription_status`: 'active', 'free', 'past_due', 'canceled'.
*   `monthly_credits`: Integer (Balance for PDF downloads).
*   `stripe_customer_id`: Text (for Billing Portal).
*   `rewards_claimed`: Text[] (badge IDs already claimed, prevents double-claiming).

### `download_tokens`
*   `token`: Secure hash for download links.
*   `expires_at`: Validity period (30 days).

## 5. Security Model (Audited Feb 2026)
*   **Row Level Security (RLS)**:
    *   `generated_books`: Owner-only access (`user_id = auth.uid()`).
    *   `profiles`: Users can read/update their own profile only.
*   **Storage Policies**:
    *   `book-audio`: **Private**. Served via authenticated proxy (`/api/audio/proxy`).
    *   `generated-images`: Public read.
*   **API Auth**:
    *   Admin endpoints: Session + admin role required.
    *   Worker endpoints: Auth + book ownership verification.
    *   `books/create`: Auth required (guest checkout disabled).
*   **Deleted** (security audit):
    *   `set-password`, `debug/tokens`, `debug/probe-schema`, `debug-book`, `seed-templates`.
