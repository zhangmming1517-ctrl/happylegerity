#!/usr/bin/env node

/**
 * 生成 PWA 所需的图标
 * 使用 sharp 库从一个源 SVG 或 PNG 生成不同尺寸的图标
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

// 确保 public 目录存在
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 创建一个简单的绿色渐变图标（如果你有 SVG 或 PNG，可以替换这里）
const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#grad)" rx="100"/>
  <text x="256" y="300" font-size="180" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
    食
  </text>
</svg>
`;

// 生成图标的尺寸
const sizes = [192, 512];

async function generateIcons() {
  try {
    console.log('生成 PWA 图标...');

    // 从 SVG 生成 PNG 图标
    for (const size of sizes) {
      const buffer = await sharp(Buffer.from(iconSvg))
        .resize(size, size, {
          fit: 'cover',
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .png()
        .toBuffer();

      fs.writeFileSync(path.join(publicDir, `icon-${size}.png`), buffer);
      console.log(`✓ 生成 icon-${size}.png`);

      // 生成 maskable 图标（用于 PWA 自适应显示）
      const maskableBuffer = await sharp(Buffer.from(iconSvg))
        .resize(size, size, {
          fit: 'contain',
          background: { r: 16, g: 185, b: 129, alpha: 1 },
        })
        .png()
        .toBuffer();

      fs.writeFileSync(path.join(publicDir, `icon-${size}-maskable.png`), maskableBuffer);
      console.log(`✓ 生成 icon-${size}-maskable.png`);
    }

    // 生成截图
    const screenhotSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 720">
  <defs>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="540" height="720" fill="url(#grad2)"/>
  <text x="270" y="360" font-size="80" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
    极简饮食
  </text>
</svg>
    `;

    const screenshot1 = await sharp(Buffer.from(screenhotSvg))
      .resize(540, 720, { fit: 'cover' })
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(publicDir, 'screenshot-540x720.png'), screenshot1);
    console.log('✓ 生成 screenshot-540x720.png');

    const wideScreenshotSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#grad3)"/>
  <text x="640" y="360" font-size="80" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
    极简饮食 - AI 规划助手
  </text>
</svg>
    `;

    const screenshot2 = await sharp(Buffer.from(wideScreenshotSvg))
      .resize(1280, 720, { fit: 'cover' })
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(publicDir, 'screenshot-1280x720.png'), screenshot2);
    console.log('✓ 生成 screenshot-1280x720.png');

    console.log('\n所有图标生成完成！图标已保存到 public/');
  } catch (err) {
    console.error('生成图标出错:', err);
    process.exit(1);
  }
}

generateIcons();
