import fs from 'fs';
import path from 'path';
import { getDb } from './db';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Generate a dynamic sitemap.xml file including all vehicle detail pages
 */
async function generateSitemap() {
  try {
    // Get the database instance
    const db = await getDb();
    
    // Get all vehicles from the database
    const allVehicles = await db.select().from(schema.vehicles);
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Start XML content
    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ev-india.org/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://ev-india.org/estimator</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://ev-india.org/compare</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://ev-india.org/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://ev-india.org/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>`;
    
    // Add vehicle detail pages
    for (const vehicle of allVehicles) {
      if (vehicle.slug) {
        xmlContent += `
  <url>
    <loc>https://ev-india.org/vehicle/${vehicle.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
    }
    
    // Close XML
    xmlContent += `
</urlset>`;
    
    // Write to file
    const sitemapPath = path.join(process.cwd(), 'client', 'public', 'sitemap.xml');
    fs.writeFileSync(sitemapPath, xmlContent);
    
    console.log('Sitemap generated successfully at:', sitemapPath);
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  generateSitemap().then(() => {
    console.log('Sitemap generation complete');
    process.exit(0);
  }).catch(err => {
    console.error('Sitemap generation failed:', err);
    process.exit(1);
  });
}

export { generateSitemap };
