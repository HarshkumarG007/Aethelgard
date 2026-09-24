import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

async function generateSampleMedia() {
  const dir = path.resolve(process.cwd(), ".dev-media/dev");
  await fs.mkdir(dir, { recursive: true });

  const svg = `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="sky" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#1a1e36"/>
        <stop offset="60%" stop-color="#0a0c16"/>
        <stop offset="100%" stop-color="#040508"/>
      </radialGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#D4AF37"/>
        <stop offset="100%" stop-color="#8C7322"/>
      </linearGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(#sky)"/>
    <circle cx="300" cy="200" r="2" fill="#ffffff" opacity="0.8"/>
    <circle cx="600" cy="150" r="1.5" fill="#ffffff" opacity="0.9"/>
    <circle cx="950" cy="280" r="2.5" fill="#E5C158" opacity="0.95"/>
    <circle cx="1200" cy="180" r="2" fill="#ffffff" opacity="0.7"/>
    <circle cx="1550" cy="220" r="1.5" fill="#ffffff" opacity="0.85"/>
    <circle cx="450" cy="350" r="1" fill="#ffffff" opacity="0.6"/>
    <circle cx="1400" cy="380" r="2" fill="#ffffff" opacity="0.75"/>
    <circle cx="960" cy="540" r="280" stroke="url(#gold)" stroke-width="2" fill="none" opacity="0.4"/>
    <circle cx="960" cy="540" r="200" stroke="url(#gold)" stroke-width="1.5" fill="none" opacity="0.5"/>
    <circle cx="960" cy="540" r="120" stroke="url(#gold)" stroke-width="1" fill="none" opacity="0.6"/>
    <text x="960" y="530" font-family="serif" font-size="38" fill="#E5C158" text-anchor="middle" letter-spacing="8">THE STARLIGHT OBSERVATORY</text>
    <text x="960" y="575" font-family="sans-serif" font-size="16" fill="#A0A5B5" text-anchor="middle" letter-spacing="4">ARCHIVAL EXPEDITION MANUSCRIPT</text>
  </svg>`;

  const buf = Buffer.from(svg);
  await sharp(buf).jpeg({ quality: 90 }).toFile(path.join(dir, "sample-observatory.jpg"));
  await sharp(buf).resize(800, 450).jpeg({ quality: 85 }).toFile(path.join(dir, "sample-observatory-med.jpg"));
  await sharp(buf).resize(400, 225).jpeg({ quality: 80 }).toFile(path.join(dir, "sample-observatory-small.jpg"));
  await sharp(buf).resize(200, 113).jpeg({ quality: 75 }).toFile(path.join(dir, "sample-observatory-thumb.jpg"));

  console.log("[DEV-MEDIA] Synthetic placeholder variants created at .dev-media/dev/");
}

generateSampleMedia().catch((err) => {
  console.error("Error generating sample media:", err);
  process.exit(1);
});
