// Utility functions for folio-related operations
const STORAGE_KEY = 'folioAssignmentTimes';

export const clearFolioAssignmentTimes = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error('Error clearing folio assignment times:', e);
    }
};

export const loadFolioAssignmentTimes = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return {};
        
        const times = JSON.parse(saved);
        // Filter out any entries older than 24 hours
        const now = new Date().getTime();
        const filteredTimes = {};
        
        Object.entries(times).forEach(([folioId, timestamp]) => {
            const timeDiff = now - new Date(timestamp).getTime();
            // Keep times that are less than 24 hours old
            if (timeDiff < 24 * 60 * 60 * 1000) {
                filteredTimes[folioId] = timestamp;
            }
        });
        
        // Update storage with filtered times
        if (Object.keys(filteredTimes).length !== Object.keys(times).length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredTimes));
        }
        
        return filteredTimes;
    } catch (e) {
        console.error('Error loading folio assignment times:', e);
        return {};
    }
};

export const saveFolioAssignmentTime = (folioId) => {
    try {
        const times = loadFolioAssignmentTimes();
        if (!times[folioId]) {
            times[folioId] = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(times));
        }
        return times[folioId];
    } catch (e) {
        console.error('Error saving folio assignment time:', e);
        return new Date().toISOString();
    }
};
