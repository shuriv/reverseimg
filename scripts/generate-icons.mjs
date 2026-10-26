import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const iconsDir = path.join(root, "public", "icons");
fs.mkdirSync(iconsDir, { recursive: true });

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="lens" x1="26" y1="24" x2="84" y2="88" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ff8d73"/>
      <stop offset="1" stop-color="#e4573d"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="#1c1b1f"/>
  <circle cx="55" cy="55" r="27" fill="none" stroke="url(#lens)" stroke-width="12"/>
  <path d="M74.5 74.5 99 99" fill="none" stroke="#f6f4ef" stroke-width="12" stroke-linecap="round"/>
  <path d="M84 31a31 31 0 0 1 13 13" fill="none" stroke="#f6f4ef" stroke-width="7" stroke-linecap="round"/>
  <path d="M97 25v14H83" fill="none" stroke="#f6f4ef" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

fs.writeFileSync(path.join(iconsDir, "icon.svg"), svg, "utf8");

for (const size of [16, 32, 48, 96, 128]) {
  const output = path.join(iconsDir, `icon-${size}.png`);
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(output);
  console.log(`Wrote ${path.relative(root, output)}`);
}
