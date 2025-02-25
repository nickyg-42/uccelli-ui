// Base API configuration
const API = {
    BASE_URL: 'http://127.0.0.1:5000/api',
    
    // Helper method for making API calls
    async fetch(endpoint, options = {}) {
        try {
            UI.showLoading();
            const token = localStorage.getItem('token');
            
            // Check token expiration before making the request
            if (token) {
                const claims = Auth.parseJWT(token);
                const expirationTime = claims.exp * 1000; // Convert to milliseconds
                if (Date.now() >= expirationTime) {
                    // Token has expired, log out the user
                    Auth.logout();
                    UI.showLoggedOutState();
                    throw new Error('Token expired');
                }
            }

            const baseOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
            };

            const response = await fetch(`${this.BASE_URL}${endpoint}`, { ...baseOptions, ...options });

            if (!response.ok) {
                throw new Error(`HTTP error. status: ${response.status}`);
            }
            
            const text = await response.text();
            if (!text) {
                return null;
            }
            
            try {
                return JSON.parse(text);
            } catch {
                return null;
            }
        } finally {
            UI.hideLoading();
        }
    },

    // Add authentication header helper
    getAuthHeader() {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
};
