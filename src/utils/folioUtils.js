// Utility functions for folio-related operations
const STORAGE_KEY = 'folioAssignmentTimes';

/**
 * Clears all folio assignment times from localStorage.
 */
export const clearFolioAssignmentTimes = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error('Error clearing folio assignment times from localStorage:', e);
    }
};

/**
 * Loads all folio assignment times from localStorage.
 * @returns {Object} An object mapping folio IDs to their assignment timestamps.
 */
export const loadFolioAssignmentTimes = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.error('Error loading folio assignment times from localStorage:', e);
        // In case of parsing error, clear the corrupted data.
        clearFolioAssignmentTimes();
        return {};
    }
};

/**
 * Saves a new set of assignment times to localStorage.
 * @param {Object} times - An object mapping folio IDs to their assignment timestamps.
 */
export const saveFolioAssignmentTimes = (times) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(times));
    } catch (e) {
        console.error('Error saving folio assignment times to localStorage:', e);
    }
};
