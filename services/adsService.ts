import { Ad } from '../types';

// The public URL to export the Google Sheet as a CSV file.
const CSV_URL = 'https://docs.google.com/spreadsheets/d/10YZyFoqNMsA8CayIhJipLl_i431QqzXaN0tcCmZMiVo/export?format=csv&gid=1074598749';

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
    // Clean up whitespace and enclosing quotes from all fields
    return result.map(field => field.trim().replace(/^"|"$/g, ''));
};


/**
 * Parses raw CSV text into an array of Ad objects.
 * It handles URLs that might be enclosed in double quotes and fields containing commas.
 * @param csvText The raw CSV string data.
 * @returns An array of valid Ad objects.
 */
const parseCSV = (csvText: string): Ad[] => {
    console.log("Starting CSV parsing...");
    const ads: Ad[] = [];
    // Split into rows, remove carriage returns, and skip the header row
    const rows = csvText.replace(/\r/g, "").split('\n').slice(1);
    console.log(`Found ${rows.length} data rows in CSV.`);

    for (const row of rows) {
        if (!row.trim()) continue; // Skip empty rows
        
        // Use a more robust CSV row parser that handles quoted commas
        const columns = parseCsvRow(row);
        
        // The URL is in the 4th column (index 3) based on the logs
        if (columns.length >= 4) {
            const linkUrl = (columns[3] || '').trim();
            console.log(`Processing row: "${row.trim()}" -> Extracted linkUrl from column 4: "${linkUrl}"`);

            // Validate that the URL is non-empty and starts with http
            if (linkUrl.startsWith('http')) {
                // Set imageUrl to empty string as it's not used for display anymore
                ads.push({ linkUrl, imageUrl: '' });
            } else {
                console.warn(`Skipping invalid URL: "${linkUrl}" from row: "${row}"`);
            }
        } else {
            console.warn(`Skipping row with insufficient columns: "${row}"`);
        }
    }
    console.log("Finished CSV parsing. Parsed ads:", ads);
    return ads;
};


export const getAds = async (): Promise<Ad[]> => {
    if (cachedAds) {
        console.log("Returning cached ads.");
        return cachedAds;
    }

    try {
        console.log("Fetching ads from CSV_URL:", CSV_URL);
        const response = await fetch(CSV_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch ads CSV: ${response.status} ${response.statusText}`);
        }
        const csvText = await response.text();
        console.log("Successfully fetched raw CSV text.");
        
        const ads = parseCSV(csvText);
        
        cachedAds = ads;
        return ads;
    } catch (error) {
        console.error("Detailed error in getAds:", error);
        // Return an empty array so the app can continue without ads on failure.
        return [];
    }
};