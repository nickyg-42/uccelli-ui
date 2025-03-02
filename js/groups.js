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

    static async refreshGroupMembers() {
        const groupSelect = document.getElementById('groupSelect');
        const membersList = document.getElementById('groupMembersList');
        const groupMembersSection = document.getElementById('groupMembersSection');
        
        if (!groupSelect || !groupSelect.value) {
            if (groupMembersSection) {
                groupMembersSection.classList.add('hidden');
            }
            return;
        }

        try {
            const members = await GroupsManager.getGroupMembers(groupSelect.value);
            let admins = [];
            try {
                admins = await GroupsManager.getAdminMembers(groupSelect.value) || [];
            } catch (adminError) {
                console.warn('Failed to fetch admin members:', adminError);
                // Continue with empty admins list
            }
            
            // Clear existing members
            membersList.innerHTML = '';
            groupMembersSection.classList.remove('hidden');

            // Create a Set of admin IDs for easy lookup
            const adminIds = new Set(admins.map(admin => admin.id));

            // Sort members with current user first, then admins, then other members
            const sortedMembers = members.sort((a, b) => {
                // Current user comes first
                if (a.id === Auth.getUserSession().userId) return -1;
                if (b.id === Auth.getUserSession().userId) return 1;

                // Then sort by admin status
                const aIsAdmin = adminIds.has(a.id);
                const bIsAdmin = adminIds.has(b.id);
                if (aIsAdmin && !bIsAdmin) return -1;
                if (!aIsAdmin && bIsAdmin) return 1;

                // Finally sort by name
                return (a.first_name + ' ' + a.last_name).localeCompare(b.first_name + ' ' + b.last_name);
            });

            const isSuperAdmin = Auth.hasRole('super_admin');
            const currentUserId = Auth.getUserSession().userId;

            // Add member cards
            sortedMembers.forEach(member => {
                const isAdmin = adminIds.has(member.id);
                const memberCard = document.createElement('div');
                memberCard.className = 'member-card';
                if (member.id === currentUserId) {
                    memberCard.classList.add('current-user');
                }
                
                let controlsHtml = '';
                // Show edit controls if user is super admin OR if it's the current user editing themselves
                if (isSuperAdmin || (!isSuperAdmin && member.id === currentUserId)) {
                    controlsHtml = `
                        <div class="member-controls">
                            <button type="button" class="edit-button" title="Edit User" data-user-id="${member.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            ${isSuperAdmin ? `
                            <button type="button" class="delete-button" title="Remove User" data-user-id="${member.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                            ` : ''}
                        </div>
                    `;
                }

                memberCard.innerHTML = `
                    ${controlsHtml}
                    <div class="member-name">${UI.capitalizeWord(member.first_name)} ${UI.capitalizeWord(member.last_name)}</div>
                    <div class="member-email">${member.email}</div>
                    <div class="member-role">${isAdmin ? 'Admin' : 'Member'}</div>
                `;

                // Add event listeners
                const editButton = memberCard.querySelector('.edit-button');
                if (editButton) {
                    editButton.addEventListener('click', () => {
                        GroupsManager.showEditUserModal(member);
                    });
                }

                // Add delete button event listener (super admin only)
                if (isSuperAdmin) {
                    const deleteButton = memberCard.querySelector('.delete-button');
                    if (deleteButton) {
                        deleteButton.addEventListener('click', async () => {
                            if (confirm(`Are you sure you want to delete ${member.first_name} ${member.last_name}?`)) {
                                try {
                                    await GroupsManager.removeUserFromGroup(groupSelect.value, member.id);
                                    await UsersManager.deleteUser(member.id);
                                    await GroupsManager.refreshGroupMembers();
                                } catch (error) {
                                    console.error('Error deleting user:', error);
                                    alert('Failed to delete user from group');
                                }
                            }
                        });
                    }
                }

                membersList.appendChild(memberCard);
            });
        } catch (error) {
            console.error('Error fetching group members:', error);
            if (membersList) {
                membersList.innerHTML = `
                    <div class="error-message">
                        Failed to load group members. Please try again later.
                    </div>
                `;
            }
        }
    }

    static async showEditUserModal(user) {
        const modal = document.getElementById('editUserModal');
        const form = document.getElementById('editUserForm');
        
        // Populate form fields
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editFirstName').value = user.first_name;
        document.getElementById('editLastName').value = user.last_name;
        document.getElementById('editEmail').value = user.email;
        document.getElementById('editUsername').value = user.username;

        // Show modal
        modal.classList.remove('hidden');

        // Handle form submission
        const handleSubmit = async (e) => {
            e.preventDefault();
            try {
                const updatedUser = {
                    first_name: document.getElementById('editFirstName').value,
                    last_name: document.getElementById('editLastName').value,
                    email: document.getElementById('editEmail').value,
                    username: document.getElementById('editUsername').value
                };

                await UsersManager.updateUser(updatedUser, document.getElementById('editUserId').value);
                modal.classList.add('hidden');
                await GroupsManager.refreshGroupMembers();
            } catch (error) {
                console.error('Error updating user:', error);
                alert('Failed to update user');
            }
        };

        // Handle close button
        const closeBtn = document.getElementById('closeEditUserModal');
        const handleClose = () => {
            modal.classList.add('hidden');
            form.removeEventListener('submit', handleSubmit);
            closeBtn.removeEventListener('click', handleClose);
        };

        form.addEventListener('submit', handleSubmit);
        closeBtn.addEventListener('click', handleClose);
    }
}

// Add event listener for group selection changes
document.addEventListener('DOMContentLoaded', () => {
    const groupSelect = document.getElementById('groupSelect');
    if (groupSelect) {
        groupSelect.addEventListener('change', async () => {
            await GroupsManager.refreshGroupMembers();
        });
    }
});
