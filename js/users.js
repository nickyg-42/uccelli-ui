class UsersManager {
    static async getUser(id) {
        return API.fetch(`/user/${id}`);
    }

    static async getUserInfo(id) {
        return API.fetch(`/user/${id}/info`);
    }

    static async updateUser(userData, id) {
        return API.fetch(`/user/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(userData),
        });
    }

    static async deleteUser(id) {
        return API.fetch(`/user/${id}`, {
            method: 'DELETE',
        });
    }
}