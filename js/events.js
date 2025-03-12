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

    static async getEventReactions(eventId) {
        return API.fetch(`/event/${eventId}/reaction`);
    }

    static async createEvent(eventData) {
        return API.fetch('/event', {
            method: 'POST',
            body: JSON.stringify(eventData),
        });
    }

    static async reactToEvent(userReaction) {
        return API.fetch('/event/reaction', {
            method: 'POST',
            body: JSON.stringify(userReaction),
        });
    }

    static async unreactToEvent(userReaction) {
        return API.fetch('/event/reaction', {
            method: 'DELETE',
            body: JSON.stringify(userReaction),
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

    static async updateAttendance(attendanceData) {
        return API.fetch('/event/attendance', {
            method: 'POST',
            body: JSON.stringify(attendanceData)
        });
    }

    static async getEventAttendance(eventId) {
        return API.fetch(`/event/${eventId}/attendance`);
    }
}
