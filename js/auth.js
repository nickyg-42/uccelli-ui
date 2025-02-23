class Auth {
    static async login(username, password) {
        try {
            const response = await API.fetch('/user/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });
            
            if (!response.token) {
                throw new Error('No token received from server');
            }
            
            // Parse and store claims from token
            const claims = this.parseJWT(response.token);
            this.setUserSession(response.token, claims);
            
            return response;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    static parseJWT(token) {
        try {
            // Get the payload part of the JWT (second part)
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Failed to parse JWT:', error);
            throw new Error('Invalid token format');
        }
    }

    static setUserSession(token, claims) {
        localStorage.setItem('token', token);
        localStorage.setItem('username', claims.username);
        localStorage.setItem('role', claims.role);
        localStorage.setItem('user_id', claims.user_id);
    }

    static getUserSession() {
        return {
            token: localStorage.getItem('token'),
            username: localStorage.getItem('username'),
            role: localStorage.getItem('role'),
            userId: parseInt(localStorage.getItem('user_id')),
        };
    }

    static clearUserSession() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        localStorage.removeItem('user_id');
    }

    static logout() {
        this.clearUserSession();
    }

    static isAuthenticated() {
        return !!localStorage.getItem('token');
    }

    static hasRole(role) {
        return localStorage.getItem('role') === role;
    }

    static async register(userData) {
        try {
            const response = await API.fetch('/user/register', {
                method: 'POST',
                body: JSON.stringify(userData),
            });
            return response;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }
}
