/**
 * FLUX PuLID Optimized Test - Anti-Disney Eyes
 * 
 * Test: Insert Soraya's face into family soccer scene
 * Goal: Natural facial resemblance WITHOUT Disney/Pixar eyes
 */

import * as fal from "@fal-ai/serverless-client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

fal.config({
    credentials: process.env.FAL_KEY,
});

async function uploadImage(imagePath) {
    console.log(`📤 Uploading: ${path.basename(imagePath)}`);
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = 'image/jpeg';
    return `data:${mimeType};base64,${base64Image}`;
}

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

async function runOptimizedTest() {
    console.log("🎯 FLUX PuLID Optimized Test - Anti-Disney Eyes");
    console.log("=".repeat(60));
    console.log("Goal: Natural facial resemblance in KusomaKids style\n");

    const referenceImagePath = "/Users/tekkigroup/.gemini/antigravity/brain/8c1d2d0a-a857-4537-81ff-47a46a3785dc/uploaded_image_0_1768750397771.jpg";
    const outputDir = path.join(__dirname, "test-results");

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        const referenceImageUrl = await uploadImage(referenceImagePath);
        console.log("✅ Reference image ready (Soraya)\n");

        // Optimized prompt for family soccer scene
        const optimizedPrompt = `A young African girl in the foreground wearing a green Senegal soccer jersey with Puma logo, celebrating excitedly with raised fists and face paint in Senegal colors. Her family is cheering in the background in a modern living room. Photorealistic children's book illustration style, natural facial proportions, realistic eyes, warm lighting, professional quality, detailed and lifelike.`;

        // CRITICAL: Negative prompt to avoid Disney/Pixar eyes
        const negativePrompt = "disney eyes, pixar style, cartoon eyes, oversized eyes, anime eyes, big eyes, exaggerated features, 3d animation style, dreamworks style";

        console.log("📝 Optimized Configuration:");
        console.log("  Model: fal-ai/flux-pulid");
        console.log("  Guidance Scale: 3.5 (reduced for realism)");
        console.log("  ID Weight: 1.0 (maximum)");
        console.log("  Inference Steps: 35 (higher quality)");
        console.log("  ✨ Negative Prompt: Anti-Disney/Pixar");
        console.log("  Target: Natural eyes, strong facial resemblance\n");

        console.log("🚀 Starting optimized generation...\n");
        const startTime = Date.now();

        const result = await fal.subscribe("fal-ai/flux-pulid", {
            input: {
                prompt: optimizedPrompt,
                negative_prompt: negativePrompt,
                reference_image_url: referenceImageUrl,
                num_inference_steps: 35,
                guidance_scale: 3.5,
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

        console.log("\n✅ Optimized Generation Complete!");
        console.log(`⏱️  Duration: ${duration}s`);
        console.log(`💰 Cost: $${(0.0333).toFixed(4)}`);

        const outputPath = path.join(outputDir, `pulid-optimized-${Date.now()}.png`);
        await downloadImage(result.images[0].url, outputPath);
        console.log(`💾 Saved: ${outputPath}\n`);

        console.log("📊 EVALUATION CHECKLIST:");
        console.log("=".repeat(60));
        console.log("Compare with KusomaKids style requirements:\n");
        console.log("  [ ] 👁️  Eyes: Natural size (NOT Disney/Pixar)?");
        console.log("  [ ] 👧 Face: Strong resemblance to Soraya?");
        console.log("  [ ] 💡 Lighting: Photorealistic and coherent?");
        console.log("  [ ] 🎨 Style: Matches KusomaKids illustrations?");
        console.log("  [ ] 🎭 Integration: Natural (no sticker effect)?");
        console.log("  [ ] ✅ Overall: Production-ready quality?\n");

        console.log("🔗 Results:");
        console.log(`   Remote: ${result.images[0].url}`);
        console.log(`   Local:  ${outputPath}\n`);

        console.log("📸 Reference:");
        console.log(`   Input:  ${referenceImagePath}`);
        console.log(`   Target Scene: Family watching soccer\n`);

        return {
            success: true,
            duration,
            outputPath,
            remoteUrl: result.images[0].url
        };

    } catch (error) {
        console.error("\n❌ Optimized Test Failed:");
        console.error(`   Error: ${error.message}`);
        if (error.body) {
            console.error(`   Details: ${JSON.stringify(error.body, null, 2)}`);
        }
        throw error;
    }
}

console.log("\n");
runOptimizedTest()
    .then((result) => {
        console.log("=".repeat(60));
        console.log("✨ OPTIMIZED TEST COMPLETED!");
        console.log("=".repeat(60));
        console.log("\n📋 Decision Point:");
        console.log("  ✅ If eyes are natural → Implement FLUX PuLID");
        console.log("  ❌ If eyes still too large → Explore alternatives\n");
        process.exit(0);
    })
    .catch((error) => {
        console.log("=".repeat(60));
        console.log("💥 TEST FAILED");
        console.log("=".repeat(60));
        process.exit(1);
    });
