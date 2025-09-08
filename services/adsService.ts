import { Ad } from '../types';

// The public URL to export the Google Sheet as a CSV file.
const CSV_URL = 'https://docs.google.com/spreadsheets/d/10YZyFoqNMsA8CayIhJipLl_i431QqzXaN0tcCmZMiVo/export?format=csv&gid=1074598749';
// A CORS proxy to bypass browser restrictions when fetching metadata from ad links.
const CORS_PROXY_URL = 'https://corsproxy.io/?';


let cachedAds: Ad[] | null = null;

/**
 * Parses a single row of a CSV string, respecting quoted fields that may contain commas.
 * @param row The string for a single CSV row.
 * @returns An array of strings representing the columns.
 */
const parseCsvRow = (row: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current); // Add the last field
    return result.map(field => field.trim().replace(/^"|"$/g, ''));
};


/**
 * Parses raw CSV text into an array of Ad objects containing only the linkUrl.
 * @param csvText The raw CSV string data.
 * @returns An array of partial Ad objects.
 */
const parseCSV = (csvText: string): Partial<Ad>[] => {
    const ads: Partial<Ad>[] = [];
    const rows = csvText.replace(/\r/g, "").split('\n').slice(1);

    for (const row of rows) {
        if (!row.trim()) continue;
        const columns = parseCsvRow(row);
        
        if (columns.length >= 4) {
            const linkUrl = (columns[3] || '').trim();
            if (linkUrl.startsWith('http')) {
                ads.push({ linkUrl });
            }
        }
    }
    return ads;
};

/**
 * Fetches the HTML of a given URL (via a CORS proxy) and parses it for metadata.
 * It looks for Open Graph (og:) tags and falls back to standard meta tags.
 * @param url The URL to fetch metadata from.
 * @returns A promise that resolves to an object with title, description, and imageUrl.
 */
const fetchLinkMetadata = async (url: string): Promise<Partial<Ad>> => {
    try {
        const response = await fetch(`${CORS_PROXY_URL}${encodeURIComponent(url)}`);
        if (!response.ok) {
            console.warn(`Failed to fetch metadata for ${url}: Status ${response.status}`);
            return {};
        }
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        const getMetaContent = (prop: string, name?: string): string => {
            const propSelector = `meta[property="${prop}"]`;
            const nameSelector = name ? `, meta[name="${name}"]` : '';
            return doc.querySelector(propSelector + nameSelector)?.getAttribute('content') || '';
        };

        const title = getMetaContent('og:title') || doc.querySelector('title')?.innerText || '';
        const description = getMetaContent('og:description', 'description');
        const imageUrl = getMetaContent('og:image', 'twitter:image');

        return { title, description, imageUrl };
    } catch (error) {
        console.error(`Error fetching metadata for ${url}:`, error);
        return {}; // Return empty object on failure
    }
}


export const getAds = async (): Promise<Ad[]> => {
    if (cachedAds) {
        return cachedAds;
    }

    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error(`Failed to fetch ads CSV: ${response.status}`);
        
        const csvText = await response.text();
        const parsedAds = parseCSV(csvText);

        // Enrich ads with metadata by fetching each link
        const enrichedAdsPromises = parsedAds.map(async (ad) => {
            if (!ad.linkUrl) return null;
            const metadata = await fetchLinkMetadata(ad.linkUrl);
            return {
                linkUrl: ad.linkUrl,
                imageUrl: metadata.imageUrl || '',
                title: metadata.title || ad.linkUrl, // Fallback title to URL
                description: metadata.description || ''
            };
        });
        
        const resolvedAds = await Promise.all(enrichedAdsPromises);
        const finalAds = resolvedAds.filter((ad): ad is Ad => ad !== null);
        
        cachedAds = finalAds;
        return finalAds;
    } catch (error) {
        console.error("Detailed error in getAds:", error);
        return [];
    }
};