/**
 * Performs a simple fuzzy search to find a query string within a list of items.
 * The search is case-insensitive and matches if all characters of the query
 * appear in the item string in the correct order, but not necessarily consecutively.
 *
 * @param query The search string.
 * @param items The array of strings to search through.
 * @returns A filtered array of matching strings, limited to 10 results.
 */
export const fuzzySearch = (query: string, items: string[]): string[] => {
    if (!query) {
        // Return a slice to avoid mutating the original suggestions array and limit initial results
        return items.slice(0, 10);
    }

    const lowerCaseQuery = query.toLowerCase();

    return items.filter(item => {
        const lowerCaseItem = item.toLowerCase();
        let queryIndex = 0;
        let itemIndex = 0;

        while (queryIndex < lowerCaseQuery.length && itemIndex < lowerCaseItem.length) {
            if (lowerCaseQuery[queryIndex] === lowerCaseItem[itemIndex]) {
                queryIndex++;
            }
            itemIndex++;
        }

        // If we found all characters of the query in order
        return queryIndex === lowerCaseQuery.length;
    }).slice(0, 10); // Limit search results for performance and UI clarity
};
