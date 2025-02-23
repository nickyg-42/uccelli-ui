class EventsManager {
    static async getEvent(id) {
        return API.fetch(`/event/${id}`);
    }

    static async getUserEvents(userId) {
        return API.fetch(`/user/${userId}/event`);
    }

    static async getGroupEvents(groupId) {
        return API.fetch(`/group/${groupId}/event`);
    }

    static async createEvent(eventData) {
        return API.fetch('/event', {
            method: 'POST',
            body: JSON.stringify(eventData),
        });
    }

    static async updateEvent(id, field, value) {
        return API.fetch(`/event/${id}/${field}`, {
            method: 'PATCH',
            body: JSON.stringify({ value }),
        });
    }

    static async deleteEvent(id) {
        return API.fetch(`/event/${id}`, {
            method: 'DELETE',
        });
    }
}
