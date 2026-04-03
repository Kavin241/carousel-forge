import { defineConfig } from '@canva/cli';

export default defineConfig({
  appId: process.env.CANVA_APP_ID,
  developmentUrl: 'https://localhost:8080',
  productionUrl: 'https://carousel-forge-xxx.vercel.app'  // Replace with actual Vercel URL
});
