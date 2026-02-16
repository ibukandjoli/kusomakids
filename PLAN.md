# Project Plan - KusomaKids

## 📍 Current Phase: V3.0 Launch (Ready)
**Status**: Stable, Feature Complete for Public Release.
**Focus**: Monitoring, SEO, and initial user feedback.

## 📅 Roadmap

### Short Term (V3.1 - Post-Launch Optimization)
*   [ ] **Abandoned Cart Recovery**: Email sequence for users who create a story but don't buy.
*   [ ] **Social Sharing**: "Share my generic preview" button (Facebook/WhatsApp) with OpenGraph tags.
*   [ ] **Review System**: Allow users to rate their story (Social Proof).
*   [ ] **Performance**: Cache optimization for Next.js images (`next/image`).

### Medium Term (V3.2 - Engagement)
*   [ ] **Multi-Child Profiles**: Allow a parent to manage multiple children (names/photos) easily.
*   [ ] **Library Filtering**: Search/Filter by Child Name in Dashboard.
*   [ ] **Gamification**: "Reading Streak" badges for kids.

### Long Term (V4.0 - Physical)
*   [ ] **Print on Demand (POD)**: API integration to order a physical hardcover book.
*   [ ] **Gift Cards**: Mechanism to buy credits for others.
*   [ ] **Mobile App**: React Native wrapper (if web traffic justifies it).

## 🛠 Technical Debt / Maintenance
*   **Refactor**: Cleanup `src/app/api/workers/` to unify generation logic (Magic Book vs Regular Book).
*   **Testing**: Add E2E tests (Playwright) for the Checkout Flow.
*   **Types**: Migrate critical components to TypeScript (gradually).
*   **Dependency Audit**: Review used packages in `package.json` and remove unused ones.

## 🐛 Known Issues (Backlog)
*   **Face Swap**: Sometimes produces artifacts with glasses or complex hairstyles. Tuning needed.
*   **Safari Audio**: Autoplay policies on iOS sometimes block the first audio read.
