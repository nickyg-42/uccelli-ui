// Base API configuration
const API = {
    BASE_URL: 'http://127.0.0.1:5000/api',
    //BASE_URL: 'https://uccelliapp.duckdns.org/api', // Change this to your Go backend URL
    
    // Helper method for making API calls
    async fetch(endpoint, options = {}) {
        const token = localStorage.getItem('token');
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
    },

    // Add authentication header helper
    getAuthHeader() {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
};
