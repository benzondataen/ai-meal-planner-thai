import { Ad } from '../types';

const SPREADSHEET_ID = '10YZyFoqNMsA8CayIhJipLl_i431QqzXaN0tcCmZMiVo';
const GID = '0';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;

let cachedAds: Ad[] | null = null;

const parseCSV = (csvText: string): Ad[] => {
    const ads: Ad[] = [];
    const lines = csvText.trim().split(/\r?\n/);
    
    // Skip header row (i=1)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // This is a simple parser; it won't handle commas within quoted fields.
        // For simple URL columns, this should be sufficient.
        const columns = line.split(',');
        
        // Column D is 'link' (index 3), Column E is 'image_link' (index 4)
        if (columns.length > 4) {
            const linkUrl = columns[3]?.trim();
            const imageUrl = columns[4]?.trim();

            if (linkUrl && imageUrl && linkUrl.startsWith('http') && imageUrl.startsWith('http')) {
                ads.push({ linkUrl, imageUrl });
            }
        }
    }
    return ads;
};

export const getAds = async (): Promise<Ad[]> => {
    if (cachedAds) {
        return cachedAds;
    }

    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch ads sheet: ${response.statusText}`);
        }
        const csvText = await response.text();
        const ads = parseCSV(csvText);
        cachedAds = ads;
        return ads;
    } catch (error) {
        console.error("Error fetching or parsing ads:", error);
        return []; // Return empty array on error to prevent app crash
    }
};
