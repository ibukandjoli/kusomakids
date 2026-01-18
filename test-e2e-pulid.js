/**
 * End-to-End Test for FLUX PuLID Implementation
 * 
 * This script simulates a complete book generation workflow:
 * 1. Creates a test book in database
 * 2. Triggers worker to generate all pages with FLUX PuLID
 * 3. Validates results
 * 4. Cleans up test data
 */

import { createClient } from '@supabase/supabase-js';
import * as fal from '@fal-ai/serverless-client';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FAL_KEY = process.env.FAL_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !FAL_KEY) {
    console.error("❌ Missing environment variables");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
fal.config({ credentials: FAL_KEY });

// Test data
const TEST_CHILD_PHOTO = "/Users/tekkigroup/.gemini/antigravity/brain/8c1d2d0a-a857-4537-81ff-47a46a3785dc/uploaded_image_0_1768750397771.jpg";
const TEST_EMAIL = "test@kusomakids.com";

async function uploadTestPhoto() {
    console.log("📤 Uploading test child photo...");
    const fs = require('fs');
    const imageBuffer = fs.readFileSync(TEST_CHILD_PHOTO);
    const base64Image = imageBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64Image}`;
}

async function createTestBook(photoUrl) {
    console.log("📚 Creating test book in database...");

    const testBook = {
        title: "Test Book - FLUX PuLID",
        child_name: "Soraya",
        child_age: 5,
        child_gender: "Fille",
        child_photo_url: photoUrl,
        email: TEST_EMAIL,
        is_unlocked: true,
        story_content: {
            pages: [
                {
                    text: "Soraya découvre un jardin magique rempli de fleurs colorées.",
                    scene_description: "A young African girl discovering a magical garden with colorful flowers, butterflies, and sunshine"
                },
                {
                    text: "Elle rencontre un papillon géant qui lui propose une aventure.",
                    scene_description: "A young African girl talking to a giant friendly butterfly in a magical garden"
                },
                {
                    text: "Ensemble, ils explorent la forêt enchantée.",
                    scene_description: "A young African girl and a giant butterfly flying through an enchanted forest with magical trees"
                }
            ]
        }
    };

    const { data, error } = await supabase
        .from('generated_books')
        .insert(testBook)
        .select()
        .single();

    if (error) {
        console.error("❌ Failed to create test book:", error);
        throw error;
    }

    console.log(`✅ Test book created with ID: ${data.id}`);
    return data;
}

async function triggerWorker(bookId) {
    console.log("\n🚀 Triggering FLUX PuLID worker...");
    console.log("⏳ This will take ~1-2 minutes for 3 pages...\n");

    const response = await fetch('http://localhost:3000/api/workers/generate-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Worker failed: ${error}`);
    }

    const result = await response.json();
    console.log("✅ Worker completed:", result);
    return result;
}

async function validateResults(bookId) {
    console.log("\n🔍 Validating results...");

    const { data: book, error } = await supabase
        .from('generated_books')
        .select('*')
        .eq('id', bookId)
        .single();

    if (error) {
        console.error("❌ Failed to fetch book:", error);
        return false;
    }

    const pages = book.story_content?.pages || [];

    console.log("\n📊 Validation Results:");
    console.log("=".repeat(60));

    let allValid = true;

    // Check cover
    if (book.cover_image_url && book.cover_image_url.includes('fal.media')) {
        console.log("✅ Cover: Generated with FLUX PuLID");
    } else {
        console.log("❌ Cover: Not generated or invalid");
        allValid = false;
    }

    // Check pages
    pages.forEach((page, index) => {
        if (page.image && page.image.includes('fal.media')) {
            console.log(`✅ Page ${index + 1}: Generated with FLUX PuLID`);
        } else {
            console.log(`❌ Page ${index + 1}: Not generated or invalid`);
            allValid = false;
        }
    });

    console.log("\n📸 Sample Image URLs:");
    if (book.cover_image_url) {
        console.log(`Cover: ${book.cover_image_url}`);
    }
    if (pages[0]?.image) {
        console.log(`Page 1: ${pages[0].image}`);
    }

    return allValid;
}

async function cleanup(bookId) {
    console.log("\n🧹 Cleaning up test data...");

    const { error } = await supabase
        .from('generated_books')
        .delete()
        .eq('id', bookId);

    if (error) {
        console.error("⚠️ Cleanup failed:", error);
    } else {
        console.log("✅ Test book deleted");
    }
}

async function runTest() {
    console.log("🧪 FLUX PuLID End-to-End Test");
    console.log("=".repeat(60));
    console.log("Testing complete book generation workflow\n");

    let bookId = null;

    try {
        // Step 1: Upload photo
        const photoUrl = await uploadTestPhoto();

        // Step 2: Create test book
        const book = await createTestBook(photoUrl);
        bookId = book.id;

        // Step 3: Trigger worker
        await triggerWorker(bookId);

        // Step 4: Validate results
        const isValid = await validateResults(bookId);

        // Step 5: Report
        console.log("\n" + "=".repeat(60));
        if (isValid) {
            console.log("✅ TEST PASSED - All images generated successfully!");
            console.log("=".repeat(60));
            console.log("\n📋 Next Steps:");
            console.log("  1. Manually review generated images for quality");
            console.log("  2. Check eyes are natural (not Disney/Pixar)");
            console.log("  3. Verify facial resemblance to Soraya");
            console.log("  4. If all good → Ready for production deployment\n");
        } else {
            console.log("❌ TEST FAILED - Some images not generated");
            console.log("=".repeat(60));
            console.log("\nCheck worker logs for errors\n");
        }

        // Step 6: Cleanup
        if (bookId) {
            await cleanup(bookId);
        }

        process.exit(isValid ? 0 : 1);

    } catch (error) {
        console.error("\n💥 TEST FAILED WITH ERROR:");
        console.error(error);

        if (bookId) {
            await cleanup(bookId);
        }

        process.exit(1);
    }
}

// Run test
runTest();
