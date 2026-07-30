/**
 * Generates a colorful avatar with initials for users without a profile picture
 * @param {string} name - The user's name (e.g., from aliasId)
 * @param {string} anchor - The user's anchor/identifier (fallback if name is not available)
 * @returns {string} Data URL of the generated avatar SVG
 */
class LRUCache {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }

    get(key) {
        if (!this.cache.has(key)) return undefined;
        // Move accessed item to the end (most recently used)
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }

    set(key, value) {
        // If key exists, update and move to end
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // Remove the first (least recently used) entry
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }
}

const avatarCache = new LRUCache(1000); // Limit cache to 1000 entries

const generateAvatarUrl = (name, anchor) => {
    // Create cache key from inputs
    const cacheKey = `${name || ''}:${anchor || ''}`;
    const cachedResult = avatarCache.get(cacheKey);
    if (cachedResult) return cachedResult;

    // Get initials from name or anchor, sanitize to ASCII
    const displayName = name || anchor || 'U';
    const initials = displayName
        .split('')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
        .replace(/[^\x00-\x7F]/g, ''); // Remove non-ASCII characters
    
    // Color palette for avatars
    const colors = [
        '#8B5CF6', // Purple
        '#06B6D4', // Cyan
        '#10B981', // Emerald
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#EC4899', // Pink
        '#6366F1', // Indigo
        '#84CC16', // Lime
        '#F97316', // Orange
        '#14B8A6'  // Teal
    ];
    
    // Generate consistent color based on name, with fallback for empty or invalid displayName
    const colorIndex = displayName.length > 0 && !/^[^\x00-\x7F]+$/.test(displayName)
        ? (displayName.charCodeAt(0) + displayName.charCodeAt(displayName.length - 1)) % colors.length
        : 0; // Fallback to first color if displayName is empty or only non-ASCII
    
    const backgroundColor = colors[colorIndex];
    
    // Create SVG avatar
    const svg = `
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="20" fill="${backgroundColor}"/>
            <text x="20" y="20" dominant-baseline="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
                  font-size="14" font-weight="600" fill="white" text-anchor="middle">${initials || 'U'}</text>
        </svg>
    `;
    
    // Convert SVG to data URL, handling Unicode safely for browsers
    const base64 = btoa(unescape(encodeURIComponent(svg)));
    const result = `data:image/svg+xml;base64,${base64}`;
    
    // Store in cache
    avatarCache.set(cacheKey, result);
    return result;
};

export default generateAvatarUrl;