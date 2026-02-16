# Product Requirements Document (PRD) - KusomaKids

## 1. Vision & Value Proposition
**KusomaKids** empowers children to become the heroes of their own stories. We use AI to generate personalized african-centric tales where the child's name and face are integrated into magical illustrations.

*   **Problem**: Lack of representation in children's literature; generic stories don't engage kids deeply.
*   **Solution**: A "Magic Story Engine" that turns a photo and a name into a full 10-page illustrated book in minutes.
*   **Value**:
    *   **Representation**: "Héros qui me ressemble".
    *   **Magic**: Instant creation.
    *   **Education**: Promotes reading through profound engagement.

## 2. User Personas
### A. The Parent (Buyer)
*   **Profile**: Tech-savvy parent, uncle/aunt, or grandparent. Values education and culture.
*   **Goal**: Give a unique, meaningful gift. Create a reading routine.
*   **Pain Points**: Tired of standard Disney books. Wants something "local" yet premium.

### B. The Explorer (Child User)
*   **Profile**: Age 3-10. Loves stories, visual learner.
*   **Experience**: Sees their face on screen. Hears their name in the audio story.

## 3. Product Features (V3.0 Launch Scope)

### Core Features
1.  **Magic Story Creation**:
    *   Upload 1 photo (Face Swap).
    *   Enter Name & Gender.
    *   Choose a Theme/Moral.
    *   AI Generation (Text + Images).
2.  **Interactive Reader**:
    *   Flipbook style.
    *   **Audio Narration** (OpenAI TTS "Nova").
    *   Fullscreen mode.
3.  **PDF Download (Monetization)**:
    *   High-quality printable PDF (Landscape, side-by-side).
    *   Secure token-based download link.
4.  **Club Subscription (Retention)**:
    *   Monthly credits.
    *   Streaming access to all books.
    *   Discounts on extra PDFs.

### User Flows
1.  **Guest Purchase (Low Friction)**:
    *   Create -> Preview (Watermarked) -> Buy PDF -> Email delivery (Account created in background).
2.  **Member Journey**:
    *   Subscribe -> Get Credits -> Create -> Unlock with Credit -> Archive in Dashboard.

## 4. Success Metrics (KPIs)
*   **Conversion Rate**: Visitor -> Story Creator.
*   **Sales Conversion**: Creator -> PDF Buyer.
*   **Retention**: Subscriber Churn Rate.
*   **Engagement**: Books created per user.

## 5. Technical Constraints
*   **Latency**: Generation must happen within reasonable time (Text < 30s, Images background async 2-3 min).
*   **Cost Control**:
    *   Reuse Fal AI seeds where possible.
    *   Cache Audio files (do not regenerate).
    *   Strict limits on free tier generation.
