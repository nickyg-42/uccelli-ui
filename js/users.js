class UsersManager {
    static async getUser(id) {
        return API.fetch(`/user/${id}`);
    }

    static async getUserInfo(id) {
        return API.fetch(`/user/${id}/info`);
    }

    static async updateUser(id, field, value) {
        return API.fetch(`/user/${id}/${field}`, {
            method: 'PATCH',
            body: JSON.stringify({ value }),
        });
    }

    static async deleteUser(id) {
        return API.fetch(`/user/${id}`, {
            method: 'DELETE',
        });
    }
} 