import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const prisma = new PrismaClient();

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function uploadToCloudinary(localPath: string, isVideo = false) {
  const fullPath = path.join(__dirname, '..', localPath.replace(/^\//, ''));
  const exists = await fileExists(fullPath);
  
  if (!exists) {
    console.log(`⚠️ Fichier introuvable localement : ${fullPath}`);
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(fullPath, {
      resource_type: isVideo ? 'video' : 'image',
      folder: 'mboa_migrated',
    });
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Erreur upload Cloudinary pour ${fullPath}:`, error);
    return null;
  }
}

async function main() {
  console.log('🚀 Démarrage de la migration vers Cloudinary...');

  // 1. SiteConfiguration
  console.log('\n--- Migration de SiteConfiguration ---');
  const heroConfig = await prisma.siteConfiguration.findUnique({
    where: { configKey: 'home_hero_images' }
  });
  if (heroConfig && heroConfig.configValue) {
    try {
      const imagesArray = JSON.parse(heroConfig.configValue);
      let configUpdated = false;
      const newArray = [];

      for (const item of imagesArray) {
        if (typeof item === 'string' && item.includes('uploads/')) {
          console.log(`⏳ Migration média config : ${item}`);
          const isVideo = item.endsWith('.mp4') || item.endsWith('.webm') || item.endsWith('.mov');
          const newUrl = await uploadToCloudinary(item, isVideo);
          if (newUrl) {
            newArray.push(newUrl);
            configUpdated = true;
          } else {
            newArray.push(item);
          }
        } else {
          newArray.push(item);
        }
      }

      if (configUpdated) {
        await prisma.siteConfiguration.update({
          where: { configKey: 'home_hero_images' },
          data: { configValue: JSON.stringify(newArray) },
        });
        console.log(`✅ SiteConfiguration home_hero_images mis à jour.`);
      }
    } catch (e) {
      console.error('Erreur parsing home_hero_images', e);
    }
  }

  console.log('\n🎉 Migration terminée !');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
