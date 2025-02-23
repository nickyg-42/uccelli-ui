class GroupsManager {
    static async getGroup(id) {
        return API.fetch(`/group/${id}`);
    }

    static async getUserGroups(userId) {
        return API.fetch(`/group/user/${userId}`);
    }

    static async getGroupMembers(groupId) {
        return API.fetch(`/group/${groupId}/user`);
    }

    static async createGroup(groupData) {
        return API.fetch('/group', {
            method: 'POST',
            body: JSON.stringify(groupData),
        });
    }

    static async addUserToGroup(groupId, userId, roleInGroup) {
        return API.fetch(`/group/${groupId}/user/${userId}`, {
            method: 'POST',
            body: JSON.stringify(roleInGroup),
        });
    }

    static async removeUserFromGroup(groupId, userId) {
        return API.fetch(`/group/${groupId}/user/${userId}`, {
            method: 'DELETE',
        });
    }

    static async leaveGroup(groupId) {
        return API.fetch(`/group/${groupId}/user`, {
            method: 'DELETE',
        });
    }

    static async updateGroupName(groupId, name) {
        return API.fetch(`/group/${groupId}/name`, {
            method: 'PATCH',
            body: JSON.stringify({ name }),
        });
    }

    static async deleteGroup(id) {
        return API.fetch(`/group/${id}`, {
            method: 'DELETE',
        });
    }

    // Super Admin only methods
    static async addGroupAdmin(groupId, userId) {
        return API.fetch(`/group/${groupId}/admin/add/${userId}`, {
            method: 'PATCH',
        });
    }

    static async removeGroupAdmin(groupId, userId) {
        return API.fetch(`/group/${groupId}/admin/remove/${userId}`, {
            method: 'PATCH',
        });
    }

    static async joinGroupByCode(code) {
        return API.fetch(`/group/join/${code}`, {
            method: 'POST',
        });
    }

    static async getAllGroups() {
        return API.fetch('/group/all');
    }

    static async getNonGroupMembers(groupId) {
        return API.fetch(`/group/${groupId}/non-members`);
    }

    static async getNonAdminMembers(groupId) {
        return API.fetch(`/group/${groupId}/non-admins`);
    }

    static async getAdminMembers(groupId) {
        return API.fetch(`/group/${groupId}/admins`);
    }
}
