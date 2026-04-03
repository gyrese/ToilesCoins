#!/usr/bin/env node
/**
 * Convertit automatiquement toutes les images PNG/JPG/JPEG du dossier Badges en WebP.
 * Les fichiers WebP sont créés à côté des originaux.
 * Usage : node scripts/convert-to-webp.mjs [--quality 85] [--delete-originals]
 */

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BADGES_DIR = path.join(__dirname, '..', 'Badges');

const args = process.argv.slice(2);
const qualityArg = args.indexOf('--quality');
const quality = qualityArg !== -1 ? parseInt(args[qualityArg + 1], 10) : 85;
const deleteOriginals = args.includes('--delete-originals');

const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif'];

async function convertImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) return null;

  const webpPath = filePath.replace(/\.(png|jpg|jpeg|gif)$/i, '.webp');

  if (existsSync(webpPath)) {
    if (deleteOriginals) {
      const { unlink } = await import('fs/promises');
      await unlink(filePath);
      console.log(`  🗑  Original supprimé (déjà converti) : ${path.basename(filePath)}`);
    } else {
      console.log(`  ⏭  Déjà converti : ${path.basename(webpPath)}`);
    }
    return { skipped: true };
  }

  const before = (await stat(filePath)).size;
  await sharp(filePath).webp({ quality }).toFile(webpPath);
  const after = (await stat(webpPath)).size;

  const gain = (((before - after) / before) * 100).toFixed(1);
  console.log(
    `  ✓  ${path.basename(filePath)} → ${path.basename(webpPath)} ` +
    `(${(before / 1024).toFixed(1)} Ko → ${(after / 1024).toFixed(1)} Ko, -${gain}%)`
  );

  if (deleteOriginals) {
    const { unlink } = await import('fs/promises');
    await unlink(filePath);
    console.log(`     🗑  Original supprimé : ${path.basename(filePath)}`);
  }

  return { before, after };
}

async function main() {
  console.log(`\nConversion WebP — qualité ${quality}%`);
  console.log(`Dossier : ${BADGES_DIR}\n`);

  const files = await readdir(BADGES_DIR);
  const images = files.filter(f =>
    SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase())
  );

  if (images.length === 0) {
    console.log('Aucune image à convertir.');
    return;
  }

  let totalBefore = 0;
  let totalAfter = 0;
  let converted = 0;
  let skipped = 0;

  for (const file of images) {
    const result = await convertImage(path.join(BADGES_DIR, file));
    if (result?.skipped) {
      skipped++;
    } else if (result) {
      totalBefore += result.before;
      totalAfter += result.after;
      converted++;
    }
  }

  console.log('\n--- Résumé ---');
  console.log(`Convertis : ${converted} | Ignorés (déjà WebP) : ${skipped}`);
  if (converted > 0) {
    const gainTotal = (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1);
    console.log(
      `Taille totale : ${(totalBefore / 1024).toFixed(1)} Ko → ${(totalAfter / 1024).toFixed(1)} Ko (-${gainTotal}%)`
    );
  }
}

main().catch(err => {
  console.error('Erreur :', err.message);
  process.exit(1);
});
