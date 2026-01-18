/**
 * FLUX PuLID Complete Test Script
 * 
 * This script:
 * 1. Uploads Soraya's reference photo to Fal.ai
 * 2. Runs FLUX PuLID generation
 * 3. Downloads and saves the result for comparison
 */

import * as fal from "@fal-ai/serverless-client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure FAL client
fal.config({
    credentials: process.env.FAL_KEY,
});

/**
 * Upload local image to Fal.ai storage
 */
async function uploadImage(imagePath) {
    console.log(`📤 Uploading reference image: ${imagePath}`);

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = 'image/jpeg';
    const dataUri = `data:${mimeType};base64,${base64Image}`;

    // Fal.ai accepts data URIs directly
    return dataUri;
}

/**
 * Download generated image
 */
async function downloadImage(url, outputPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(outputPath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(outputPath);
            });
        }).on('error', (err) => {
            fs.unlink(outputPath, () => { });
            reject(err);
        });
    });
}

async function runPuLIDTest() {
    console.log("🧪 FLUX PuLID Identity Preservation Test");
    console.log("=".repeat(50));
    console.log("Target: Nano Banana Quality Standard\n");

    // Paths
    const referenceImagePath = "/Users/tekkigroup/.gemini/antigravity/brain/8c1d2d0a-a857-4537-81ff-47a46a3785dc/uploaded_image_2_1768746554314.jpg";
    const outputDir = path.join(__dirname, "test-results");

    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        // Step 1: Upload reference image
        const referenceImageUrl = await uploadImage(referenceImagePath);
        console.log("✅ Reference image ready\n");

        // Step 2: Test prompt (based on classroom template)
        const testPrompt = `A young African girl in a bright, colorful classroom, holding a children's drawing with stick figures. She is wearing a white t-shirt with polka dot pattern and a navy blue skirt with white dots. The classroom has educational posters on green and blue walls, wooden shelves with colorful books and supplies, and natural warm lighting from a window. Professional children's book illustration style, warm and inviting atmosphere, high quality digital art, detailed and photorealistic, vibrant colors.`;

        console.log("📝 Test Configuration:");
        console.log("  Model: fal-ai/flux-pulid");
        console.log("  Identity Weight: 1.0 (maximum)");
        console.log("  Inference Steps: 28 (high quality)");
        console.log("  Guidance Scale: 4.0");
        console.log("  Expected: Braids + beads preserved\n");

        // Step 3: Run FLUX PuLID
        console.log("🚀 Starting generation...\n");
        const startTime = Date.now();

        const result = await fal.subscribe("fal-ai/flux-pulid", {
            input: {
                prompt: testPrompt,
                reference_image_url: referenceImageUrl,
                num_inference_steps: 28,
                guidance_scale: 4.0,
                id_weight: 1.0,
                num_images: 1,
                enable_safety_checker: false,
                output_format: "png",
                image_size: {
                    width: 1024,
                    height: 1024
                }
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    const logs = update.logs?.map(log => log.message).join('\n');
                    if (logs) console.log(`⏳ ${logs}`);
                }
            },
        });

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log("\n✅ Generation Complete!");
        console.log(`⏱️  Duration: ${duration}s`);
        console.log(`💰 Estimated cost: $${(0.0333).toFixed(4)}`);

        // Step 4: Download result
        const outputPath = path.join(outputDir, `pulid-test-${Date.now()}.png`);
        await downloadImage(result.images[0].url, outputPath);
        console.log(`💾 Saved to: ${outputPath}\n`);

        // Step 5: Quality checklist
        console.log("📊 QUALITY EVALUATION CHECKLIST:");
        console.log("=".repeat(50));
        console.log("Compare with Nano Banana standard (Image 4):\n");
        console.log("  [ ] ✨ Braids preserved from reference photo?");
        console.log("  [ ] 🎨 Colorful beads visible on braids?");
        console.log("  [ ] 👧 Facial features match Soraya?");
        console.log("  [ ] 💡 Lighting coherent with classroom scene?");
        console.log("  [ ] 🎭 Natural integration (no 'sticker' effect)?");
        console.log("  [ ] 🏆 Overall quality matches Nano Banana?\n");

        console.log("🔗 Generated Image:");
        console.log(`   Remote: ${result.images[0].url}`);
        console.log(`   Local:  ${outputPath}\n`);

        console.log("📸 Reference Images:");
        console.log(`   Soraya (Input):  ${referenceImagePath}`);
        console.log(`   Nano Banana (Target): uploaded_image_3_1768746554314.jpg\n`);

        return {
            success: true,
            duration,
            outputPath,
            remoteUrl: result.images[0].url
        };

    } catch (error) {
        console.error("\n❌ Test Failed:");
        console.error(`   Error: ${error.message}`);
        if (error.body) {
            console.error(`   Details: ${JSON.stringify(error.body, null, 2)}`);
        }
        throw error;
    }
}

// Run test
console.log("\n");
runPuLIDTest()
    .then((result) => {
        console.log("=".repeat(50));
        console.log("✨ TEST COMPLETED SUCCESSFULLY!");
        console.log("=".repeat(50));
        console.log("\n📋 Next Steps:");
        console.log("  1. Open the generated image");
        console.log("  2. Compare with Nano Banana standard");
        console.log("  3. If quality is acceptable → Proceed to implementation");
        console.log("  4. If not → Tune parameters and re-test\n");
        process.exit(0);
    })
    .catch((error) => {
        console.log("=".repeat(50));
        console.log("💥 TEST FAILED");
        console.log("=".repeat(50));
        process.exit(1);
    });
