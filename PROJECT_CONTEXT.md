# KusomaKids - Project Context

## Current Status (January 17, 2026)

**Goal**: Fix Face Swap, Payment Flow, and PDF Delivery.

### ✅ Recent Accomplishments
*   **Face Swap Fixed**: Face swap is now working correctly in both Frontend Preview and Backend Worker. (Verified by User).
*   **Database Schema Aligned**:
    *   Mapped `pages` -> `story_content` (JSONB).
    *   Added `cover_image_url`.
    *   Added `title` column (Fixing 500 error).
*   **Checkout Improvements**:
    *   Added "Remove Item" button.
    *   Removed duplicate price display.

### 🚨 Critical Bugs & Pending Tasks
1.  **Payment Update Failure**:
    *   **Issue**: Books remain "Locked" after payment.
    *   **Cause**: Stripe Webhook attempts to update a non-existent `status` column, causing the query to fail before `is_unlocked: true` is applied.
    *   **Fix**: Remove `status` from the update query.

2.  **Checkout Title Variable**:
    *   **Issue**: Payment page shows `Phanuel et {childName} Brave la Nuit`.
    *   **Cause**: The `{childName}` variable is not replaced before sending the title to the Stripe/Payment API.
    *   **Fix**: Apply replacement logic in `checkout/page.js` before API call.

3.  **PDF Delivery Missing**:
    *   **Issue**: User cannot find "Mes PDFs" page or download the PDF after purchase. `/api/download` endpoint appears to be missing.
    *   **Expectation**:
        *   **One-off Purchase**: Unlocks book in "Mes Histoires" AND allows download in "Mes PDFs".
        *   **Club**: 1 Free PDF/month. Additional PDFs at 50% off.
    *   **Action**:
        *   Create `/api/download/[bookId]` endpoint to generate valid PDF from `story_content`.
        *   Create `src/app/my-pdfs/page.js` (or relevant page).
        *   Implement access logic (Purchase vs Club Credit).

4.  **Face Swap Quality**:
    *   **Request**: "Renforcer davantage" (Make it stronger/more resembling).
    *   **Action**: Investigate `fal-ai/face-swap` parameters or alternative models (lower priority than functional bugs).

## Architecture Notes
*   **Frontend**: Next.js 16 (App Router).
*   **Backend**: Supabase (PostgreSQL), Fal AI (Images), Stripe (Payments).
*   **PDF**: `@react-pdf/renderer`.
