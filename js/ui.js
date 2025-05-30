class UI {
    static currentUser = null;
    static currentGroupId = null;
    static calendar = null;
    static loadingCount = 0;

    static init() {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (token) {
            this.showLoggedInState();
        } else {
            this.showLoggedOutState();
        }

        // Add event listeners
        this.setupEventListeners();
        this.setupTabs();
        this.setupViewToggle();
        this.setupPasswordResetHandlers();
        this.setupPasswordToggles();
    }

    static setupEventListeners() {
        // Auth buttons
        document.getElementById('loginBtn').addEventListener('click', () => this.showLoginForm());
        document.getElementById('signupBtn').addEventListener('click', () => this.showSignupForm());
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // Auth forms
        document.getElementById('loginFormElement').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('signupFormElement').addEventListener('submit', (e) => this.handleSignup(e));

        // Group selection
        document.getElementById('groupSelect').addEventListener('change', (e) => this.handleGroupChange(e));

        // Event modal
        document.getElementById('closeEventModal').addEventListener('click', () => this.hideAddEventModal());
        document.getElementById('addEventForm').addEventListener('submit', (e) => this.handleAddEvent(e));

        // Add click event for modal background
        document.getElementById('addEventModal').addEventListener('click', (e) => {
            if (e.target.id === 'addEventModal') {
                this.hideAddEventModal();
            }
        });

        // Add this to setupEventListeners()
        document.getElementById('sameDayEvent').addEventListener('change', (e) => {
            const endDateGroup = document.getElementById('eventEndDate').closest('.form-group');
            
            if (e.target.checked) {
                endDateGroup.classList.add('hidden');
                // Copy start date to end date
                const startDate = document.getElementById('eventStartDate').value;
                document.getElementById('eventEndDate').value = startDate;
            } else {
                endDateGroup.classList.remove('hidden');
            }
        });

        // Also add this to sync start/end dates when same-day is checked
        document.getElementById('eventStartDate').addEventListener('change', (e) => {
            const sameDayCheckbox = document.getElementById('sameDayEvent');
            const endDateInput = document.getElementById('eventEndDate');
            
            if (sameDayCheckbox.checked) {
                endDateInput.value = e.target.value;
            }
        });

        // Join group button
        document.getElementById('joinGroupBtn').addEventListener('click', () => this.showJoinGroupModal());
        document.getElementById('closeJoinGroupModal').addEventListener('click', () => this.hideJoinGroupModal());
        document.getElementById('joinGroupForm').addEventListener('submit', (e) => this.handleJoinGroup(e));

        document.getElementById('emailNotificationsToggle').addEventListener('change', async (e) => {
            e.preventDefault();
            const isEmailNotificationsEnabled = document.getElementById('emailNotificationsToggle').checked;
            try {
                const groupId = document.getElementById('groupSelect').value;
                if (groupId) {
                    await GroupsManager.updateGroupDoSendEmails(groupId, {do_send_emails: isEmailNotificationsEnabled})
                } else {
                    console.error('Please select a group first before updating do_send_emails:', error);
                    alert('Failed to update group do_send_emails: ' + error.message);
                }
            } catch (error) {
                console.error('Failed to update group do_send_emails:', error);
                alert('Failed to update group do_send_emails: ' + error.message);
            }
        });

        // Add Group form handler
        document.getElementById('addGroupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const userSession = Auth.getUserSession();
                const groupData = {
                    name: document.getElementById('groupName').value,
                    created_by_id: parseInt(userSession.userId)
                };
                
                await GroupsManager.createGroup(groupData);
                
                // Reset form and show success message
                document.getElementById('addGroupForm').reset();
                alert('Group created successfully!');
                
                // Refresh the groups list
                await this.loadUserGroups(parseInt(userSession.userId));
            } catch (error) {
                console.error('Failed to create group:', error);
                alert('Failed to create group: ' + error.message);
            }
        });

        // Add Group Member form handlers
        document.getElementById('adminGroupSelect').addEventListener('change', async (e) => {
            const groupId = e.target.value;
            const userSelect = document.getElementById('adminUserSelect');
            
            if (!groupId) {
                userSelect.innerHTML = '<option value="">Select a group first...</option>';
                userSelect.disabled = true;
                return;
            }
            
            await this.loadNonGroupMembers(groupId);
        });

        document.getElementById('addGroupMemberForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const groupId = document.getElementById('adminGroupSelect').value;
                const userId = document.getElementById('adminUserSelect').value;
                
                if (!groupId || !userId) {
                    alert('Please select both a group and a user');
                    return;
                }
                
                await GroupsManager.addUserToGroup(groupId, userId, {role_in_group: "member"});
                
                // Reset form and show success message
                document.getElementById('addGroupMemberForm').reset();
                document.getElementById('adminUserSelect').disabled = true;
                document.getElementById('adminUserSelect').innerHTML = '<option value="">Select a group first...</option>';
                alert('User added to group successfully!');
                
                // Refresh the groups list if the current user's groups are displayed
                await this.loadUserGroups(userId);
            } catch (error) {
                console.error('Failed to add user to group:', error);
                alert('Failed to add user to group: ' + error.message);
            }
        });

        // Leave group button
        document.getElementById('leaveGroupBtn').addEventListener('click', async () => this.handleLeaveGroup());

        // Add this inside setupEventListeners()
        document.getElementById('addEventBtn').addEventListener('click', () => {
            const groupId = document.getElementById('groupSelect').value;
            if (!groupId) {
                alert('Please select a group first');
                return;
            }
            this.showAddEventModal();
        });

        // Add copy button handler
        document.getElementById('copyGroupCode').addEventListener('click', async () => {
            const codeElement = document.getElementById('groupCodeDisplay');
            try {
                await navigator.clipboard.writeText(codeElement.textContent);
                const button = document.getElementById('copyGroupCode');
                button.title = 'Copied!';
                setTimeout(() => {
                    button.title = 'Copy to clipboard';
                }, 2000);
            } catch (error) {
                console.error('Failed to copy code:', error);
                alert('Failed to copy code to clipboard');
            }
        });

        // Add Group Admin form handlers
        document.getElementById('adminGroupSelectForAdmin').addEventListener('change', async (e) => {
            const groupId = e.target.value;
            const userSelect = document.getElementById('userSelectForAdmin');
            
            if (!groupId) {
                userSelect.innerHTML = '<option value="">Select a group first...</option>';
                userSelect.disabled = true;
                return;
            }
            
            await this.loadNonAdminMembers(groupId);
        });

        document.getElementById('addGroupAdminForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const groupId = document.getElementById('adminGroupSelectForAdmin').value;
                const userId = document.getElementById('userSelectForAdmin').value;
                
                if (!groupId || !userId) {
                    alert('Please select both a group and a user');
                    return;
                }
                
                await GroupsManager.addGroupAdmin(groupId, userId);
                
                // Reset form and show success message
                document.getElementById('addGroupAdminForm').reset();
                document.getElementById('userSelectForAdmin').disabled = true;
                document.getElementById('userSelectForAdmin').innerHTML = '<option value="">Select a group first...</option>';
                alert('User promoted to admin successfully!');
                
            } catch (error) {
                console.error('Failed to add admin:', error);
                alert('Failed to add admin: ' + error.message);
            }
        });

        // Remove Group Admin form handlers
        document.getElementById('adminGroupSelectForRemove').addEventListener('change', async (e) => {
            const groupId = e.target.value;
            const userSelect = document.getElementById('userSelectForRemove');
            
            if (!groupId) {
                userSelect.innerHTML = '<option value="">Select a group first...</option>';
                userSelect.disabled = true;
                return;
            }
            
            await this.loadAdminMembers(groupId);
        });

        document.getElementById('removeGroupAdminForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const groupId = document.getElementById('adminGroupSelectForRemove').value;
                const userId = document.getElementById('userSelectForRemove').value;
                
                if (!groupId || !userId) {
                    alert('Please select both a group and an admin');
                    return;
                }
                
                await GroupsManager.removeGroupAdmin(groupId, userId);
                
                // Reset form and show success message
                document.getElementById('removeGroupAdminForm').reset();
                document.getElementById('userSelectForRemove').disabled = true;
                document.getElementById('userSelectForRemove').innerHTML = '<option value="">Select a group first...</option>';
                alert('Admin role removed successfully!');
                
            } catch (error) {
                console.error('Failed to remove admin:', error);
                alert('Failed to remove admin: ' + error.message);
            }
        });
    }

    static async showLoggedInState() {
        const userSession = Auth.getUserSession();
        
        document.getElementById('loggedOutNav').classList.add('hidden');
        document.getElementById('loggedInNav').classList.remove('hidden');
        document.getElementById('authForms').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        
        // Update the username display
        //document.getElementById('userEmail').textContent = userSession.username;

        // If user is SuperAdmin, show admin controls
        if (Auth.hasRole('super_admin')) {
            this.showAdminControls();
        }

        // Load user's groups using the stored user_id
        await this.loadUserGroups(userSession.userId);
    }

    static showLoggedOutState() {
        document.getElementById('loggedOutNav').classList.remove('hidden');
        document.getElementById('loggedInNav').classList.add('hidden');
        document.getElementById('mainContent').classList.add('hidden');
        document.getElementById('authForms').classList.remove('hidden');
        this.showLoginForm();
    }

    static async handleLogin(e) {
        this.showLoading();
        e.preventDefault();
        const errorElement = document.getElementById('loginError');
        errorElement.classList.add('hidden');
        
        try {
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            const response = await Auth.login(username, password);
            
            this.hideLoading();

            if (response.token) {
                // Store the token
                localStorage.setItem('token', response.token);
                
                // Clear the form
                document.getElementById('loginFormElement').reset();
                
                // Show the main content
                this.showLoggedInState();
            } else {
                throw new Error('Invalid login response');
            }
        } catch (error) {
            this.hideLoading();
            console.error('Login failed:', error);
            errorElement.textContent = 'Invalid username or password';
            errorElement.classList.remove('hidden');
        }
    }

    static validateEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return email.length > 0 && emailRegex.test(email);
    }

    static validateName(name) {
        const nameRegex = /^[a-zA-Z]+([ '-][a-zA-Z]+)*$/;
        return name.length > 0 && name.length <= 50 && nameRegex.test(name);
    }

    static validateUsername(username) {
        const usernameRegex = /^[a-zA-Z][a-zA-Z0-9._]{2,29}$/;
        return username.length > 0 && usernameRegex.test(username);
    }

    static validatePassword(password) {
        if (password.length < 8) return false;
        
        let hasUpper = false;
        let hasLower = false;
        let hasNumber = false;
        let hasSpecial = false;
        
        for (let char of password) {
            if (/[A-Z]/.test(char)) hasUpper = true;
            if (/[a-z]/.test(char)) hasLower = true;
            if (/[0-9]/.test(char)) hasNumber = true;
            if (/[^A-Za-z0-9]/.test(char)) hasSpecial = true;
        }
        
        return hasUpper && hasLower && hasNumber && hasSpecial;
    }

    static async handleSignup(e) {
        e.preventDefault();
        const errorElement = document.getElementById('signupError');
        errorElement.textContent = '';
        errorElement.classList.add('hidden');

        const firstName = document.getElementById('signupFirstName').value;
        const lastName = document.getElementById('signupLastName').value;
        const email = document.getElementById('signupEmail').value;
        const username = document.getElementById('signupUsername').value;
        const password = document.getElementById('signupPassword').value;

        // Validate all fields
        if (!this.validateName(firstName)) {
            errorElement.textContent = 'First name must be alphabetic, less than 50 characters, and can only contain dashes or spaces between names';
            errorElement.classList.remove('hidden');
            return;
        }

        if (!this.validateName(lastName)) {
            errorElement.textContent = 'Last name must be alphabetic, less than 50 characters, and can only contain dashes or spaces between names';
            errorElement.classList.remove('hidden');
            return;
        }

        if (!this.validateEmail(email)) {
            errorElement.textContent = 'Please enter a valid email address';
            errorElement.classList.remove('hidden');
            return;
        }

        if (!this.validateUsername(username)) {
            errorElement.textContent = 'Username must start with a letter and can only contain letters, numbers, dots, and underscores (3-30 characters)';
            errorElement.classList.remove('hidden');
            return;
        }

        if (!this.validatePassword(password)) {
            errorElement.textContent = 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character';
            errorElement.classList.remove('hidden');
            return;
        }

        try {
            const userData = { 
                first_name: firstName, 
                last_name: lastName, 
                email, 
                username, 
                password 
            };

            await Auth.register(userData);
            alert('Registration successful! Please login.');
            this.showLoginForm();
        } catch (error) {
            console.error('Registration failed:', error);
            if (error.status === 401) {
                errorElement.textContent = 'Email not whitelisted. Please contact an administrator.';
            } else {
                errorElement.textContent = error.message || 'Registration failed. Please try again.';
            }
            errorElement.classList.remove('hidden');
        }
    }

    static handleLogout() {
        Auth.logout();
        this.clearCalendar();
        
        // Hide admin controls before showing logged out state
        const adminControls = document.querySelectorAll('.admin-only');
        adminControls.forEach(element => {
            element.classList.add('hidden');
            element.classList.remove('visible');
        });
        
        this.showLoggedOutState();
    }

    static async loadUserGroups(userId) {
        try {
            this.showLoading();
            const groups = await GroupsManager.getUserGroups(userId);
            const groupSelect = document.getElementById('groupSelect');
            const leaveGroupBtn = document.getElementById('leaveGroupBtn');
            const groupCodeDisplay = document.querySelector('.group-code-display');
            
            if (!groups || groups.length === 0) {
                groupSelect.innerHTML = '<option value="">No groups available, please contact an administrator.</option>';
                groupSelect.disabled = true;
                document.getElementById('addEventBtn').disabled = true;
                leaveGroupBtn.disabled = true;
                groupCodeDisplay.classList.add('hidden');
                
                const noGroupMessage = '<div class="empty-state">You are not a member of any groups. Please contact an administrator.</div>';
                
                document.getElementById('upcomingEventsList').innerHTML = noGroupMessage;
                document.getElementById('historicEventsList').innerHTML = noGroupMessage;
                document.getElementById('calendar').innerHTML = noGroupMessage;
                this.clearCalendar();
                this.hideLoading();
                return;
            }
            
            // Update section header to include refresh button
            document.querySelector('.section-header').innerHTML = `
                <h2>Events</h2>
                <div class="header-actions">
                    <button id="refreshEventsBtn" class="refresh-button" title="Refresh Events">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                        </svg>
                    </button>
                    <button id="addEventBtn">Add Event</button>
                </div>
            `;

            // Add event listener for refresh button
            document.getElementById('refreshEventsBtn').addEventListener('click', async () => {
                const currentGroupId = document.getElementById('groupSelect').value;
                if (currentGroupId) {
                    await this.loadGroupEvents(currentGroupId);
                }
            });

            // Re-attach Add Event button listener
            document.getElementById('addEventBtn').addEventListener('click', () => {
                const groupId = document.getElementById('groupSelect').value;
                if (!groupId) {
                    alert('Please select a group first');
                    return;
                }
                this.showAddEventModal();
            });
            
            // Always show leave button, but disable it if no groups
            leaveGroupBtn.classList.remove('hidden');
            
            groupSelect.disabled = false;
            document.getElementById('addEventBtn').disabled = false;
            leaveGroupBtn.disabled = false;
            
            groupSelect.innerHTML = groups.map(group => 
                `<option value="${group.id}">${group.name}</option>`
            ).join('');

            // Rest of the existing loadUserGroups code...
            const urlParams = new URLSearchParams(window.location.search);
            const groupId = urlParams.get('groupId') || groups[0].id;
            
            if (!urlParams.get('groupId')) {
                const url = new URL(window.location);
                url.searchParams.set('groupId', groupId);
                window.history.pushState({}, '', url);
            }

            groupSelect.value = groupId;
            try {
                const group = await GroupsManager.getGroup(groupId);
                if (group && group.code) {
                    document.querySelector('.group-code-display').classList.remove('hidden');
                    document.getElementById('groupCodeDisplay').textContent = group.code;
                }
            } catch (error) {
                console.error('Failed to get group details:', error);
                document.querySelector('.group-code-display').classList.add('hidden');
            }
            await this.loadGroupEvents(groupId);
            await GroupsManager.refreshGroupMembers(); // Add this line to load members on initial load
            this.hideLoading();
        } catch (error) {
            console.error('Failed to load groups:', error);
            this.hideLoading();
        }
    }

    static async loadGroupEvents(groupId) {
        try {
            this.showLoading();
            const events = await EventsManager.getGroupEvents(groupId) || [];
            const now = new Date();
            now.setHours(0, 0, 0, 0); // Set to start of today
            
            // Split events into upcoming (including today) and historic
            const upcomingEvents = events.filter(event => {
                const eventDate = new Date(event.start_time);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate >= now;
            });
            const historicEvents = events.filter(event => {
                const eventDate = new Date(event.start_time);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate < now;
            });
            
            // Sort events by start time
            upcomingEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
            historicEvents.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
            
            // Initialize pagination
            this.currentUpcomingPage = 1;
            this.currentHistoricPage = 1;
            this.eventsPerPage = 5;
            this.upcomingEvents = upcomingEvents;
            this.historicEvents = historicEvents;
            
            // Update the lists with paginated data
            await this.updateEventsList('upcoming');
            await this.updateEventsList('historic');

            // Update calendar if it exists
            if (this.calendar) {
                this.calendar.refetchEvents();
            }
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            console.error('Failed to load events:', error);
            this.handleEventsLoadError();
        }
    }

    static async updateEventsList(type) {
        const events = type === 'upcoming' ? this.upcomingEvents : this.historicEvents;
        const currentPage = type === 'upcoming' ? this.currentUpcomingPage : this.currentHistoricPage;
        const listElement = document.getElementById(`${type}EventsList`);
        
        if (!listElement) return;

        const startIndex = (currentPage - 1) * this.eventsPerPage;
        const endIndex = startIndex + this.eventsPerPage;
        const paginatedEvents = events.slice(startIndex, endIndex);
        const totalPages = Math.ceil(events.length / this.eventsPerPage);

        if (events.length === 0) {
            listElement.innerHTML = `<div class="empty-state">No ${type} events</div>`;
            return;
        }

        // Create all event cards
        const eventCardsPromises = paginatedEvents.map(event => this.createEventCard(event));
        const eventCards = await Promise.all(eventCardsPromises);

        const paginationHtml = `
            <div class="pagination">
                <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="UI.changePage('${type}', ${currentPage - 1})">←</button>
                <span class="page-info">Page ${currentPage} of ${totalPages}</span>
                <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="UI.changePage('${type}', ${currentPage + 1})">→</button>
            </div>
        `;

        listElement.innerHTML = eventCards.join('') + paginationHtml;
    }

    static async changePage(type, newPage) {
        if (type === 'upcoming') {
            this.currentUpcomingPage = newPage;
        } else {
            this.currentHistoricPage = newPage;
        }
        await this.updateEventsList(type);
    }

    static handleEventsLoadError() {
        const upcomingList = document.getElementById('upcomingEventsList');
        const historicList = document.getElementById('historicEventsList');
        
        if (upcomingList) {
            upcomingList.innerHTML = '<div class="error-state">Error loading events</div>';
        }
        if (historicList) {
            historicList.innerHTML = '<div class="error-state">Error loading events</div>';
        }
    }

    static async handleGroupChange(e) {
        const groupId = e.target.value;
        const groupCodeDisplay = document.querySelector('.group-code-display');
        const codeElement = document.getElementById('groupCodeDisplay');
        const leaveGroupBtn = document.getElementById('leaveGroupBtn');
        
        if (!groupId) {
            groupCodeDisplay.classList.add('hidden');
            return;
        }

        try {
            const group = await GroupsManager.getGroup(groupId);
            if (group && group.code) {
                groupCodeDisplay.classList.remove('hidden');
                codeElement.textContent = group.code;
            }
        } catch (error) {
            console.error('Failed to get group details:', error);
            groupCodeDisplay.classList.add('hidden');
        }

        // Show/hide leave button based on group selection
        if (groupId) {
            leaveGroupBtn.classList.remove('hidden');
        } else {
            leaveGroupBtn.classList.add('hidden');
        }
        
        // Update URL with new groupId
        const url = new URL(window.location);
        if (groupId) {
            url.searchParams.set('groupId', groupId);
        } else {
            url.searchParams.delete('groupId');
        }
        window.history.pushState({}, '', url);

        // Update current group ID and load events
        this.currentGroupId = groupId;
        if (groupId) {
            await this.loadGroupEvents(groupId);
            await this.loadAdminGroups();
        } else {
            // Clear events if no group selected
            document.getElementById('upcomingEventsList').innerHTML = '';
            document.getElementById('historicEventsList').innerHTML = '';
            if (this.calendar) {
                this.calendar.refetchEvents();
            }
        }
    }

    static validateEvent(eventData) {
        // Check event name
        if (!eventData.name.trim()) {
            return "Event name cannot be empty";
        }
        if (eventData.name.length > 255) {
            return "Event name cannot exceed 255 characters";
        }

        // Check description length if provided
        if (eventData.description && eventData.description.length > 1000) {
            return "Event description cannot exceed 1000 characters";
        }

        // Parse dates
        const startDateTime = new Date(eventData.start_time);
        const endDateTime = new Date(eventData.end_time);

        // Check if dates are valid
        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
            return "Start time and end time must be provided";
        }

        // Check if start is before end
        if (startDateTime > endDateTime) {
            return "Start time cannot be after end time";
        }

        return null;
    }

    static async handleAddEvent(e) {
        e.preventDefault();
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const groupId = urlParams.get('groupId');
            if (!groupId) {
                throw new Error('No group selected');
            }

            const userSession = Auth.getUserSession();
            if (!userSession) {
                throw new Error('User not logged in');
            }

            const name = document.getElementById('eventName').value;
            const description = document.getElementById('eventDescription').value;
            const location = document.getElementById('eventLocation').value;
            const startDate = document.getElementById('eventStartDate').value;
            const endDate = document.getElementById('eventEndDate').value;
            const startTime = document.getElementById('eventStartTime').value || '00:00';
            const endTime = document.getElementById('eventEndTime').value || '23:59';

            const startDateTime = startTime 
                ? new Date(`${startDate}T${startTime}:00`) 
                : new Date(`${startDate}T00:00:00`);
        
            let endDateTime;
            if (!endDate) {
                endDateTime = endTime 
                    ? new Date(`${startDate}T${endTime}:00`)
                    : new Date(`${startDate}T23:59:59`);
            } else {
                endDateTime = endTime 
                    ? new Date(`${endDate}T${endTime}:00`)
                    : new Date(`${endDate}T23:59:59`);
            }

            const eventData = {
                name,
                description,
                location: location || null,  // Include location if provided
                start_time: startDateTime.toISOString().split('.')[0] + 'Z',
                end_time: endDateTime.toISOString().split('.')[0] + 'Z',
                group_id: parseInt(groupId),
                created_by_id: parseInt(userSession.userId)
            };

            // Validate event data
            const validationError = this.validateEvent(eventData);
            if (validationError) {
                throw new Error(validationError);
            }

            await EventsManager.createEvent(eventData);
            
            // Refresh events list
            await this.loadGroupEvents(groupId);
            
            // Clear and hide modal
            document.getElementById('addEventForm').reset();
            this.hideAddEventModal();
        } catch (error) {
            console.error('Failed to create event:', error);
            alert('Failed to create event: ' + error.message);
        }
    }

    // UI Helper methods
    static showLoginForm() {
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('signupForm').classList.add('hidden');
    }

    static showSignupForm() {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('signupForm').classList.remove('hidden');
    }

    static showAddEventModal() {
        const modal = document.getElementById('addEventModal');
        modal.classList.remove('hidden');
        
        // Get current group name and update modal header
        const groupSelect = document.getElementById('groupSelect');
        const selectedOption = groupSelect.options[groupSelect.selectedIndex];
        const groupName = selectedOption ? selectedOption.text : '';
        document.getElementById('modalGroupName').textContent = `Group: ${groupName}`;
        
        // Hide end date field initially since same-day is checked by default
        const endDateGroup = document.getElementById('eventEndDate').closest('.form-group');
        endDateGroup.classList.add('hidden');
    }

    static hideAddEventModal() {
        const modal = document.getElementById('addEventModal');
        modal.classList.add('hidden');
        document.getElementById('addEventForm').reset();
    }

    static async showEventInfoModal(event) {
        const modal = document.getElementById('eventInfoModal');
        modal.classList.remove('hidden');
    
        // Populate event info
        document.getElementById('eventInfoTitle').textContent = event.title;
    
        // Handle location if it exists
        const locationSection = document.getElementById('eventInfoLocationSection');
        if (event.extendedProps.location) {
            locationSection.classList.remove('hidden');
            document.getElementById('eventInfoLocationText').textContent = event.extendedProps.location;
        } else {
            locationSection.classList.add('hidden');
        }
    
        // Format date/time display
        let dateTimeHTML = '';
        const startDate = event.start.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
                                
        if (event.start.getHours() !== 0 || event.start.getMinutes() !== 0) {
            const startTime = event.start.toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit'
            });
            dateTimeHTML += `${startDate} at ${startTime}`;
            
            if (event.end) {
                const endTime = event.end.toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit'
                });
                dateTimeHTML += ` - ${endTime}`;
            }
        } else {
            dateTimeHTML = startDate;
            if (event.end) {
                const endDate = event.end.toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                if (endDate !== startDate) {
                    dateTimeHTML += ` - ${endDate}`;
                }
            }
        }
        
        document.getElementById('eventInfoDateTime').innerHTML = dateTimeHTML;
        
        // Set description
        const description = event.extendedProps.description || 'No description provided';
        document.getElementById('eventInfoDescription').textContent = description;
    
        // Fetch and display attendance
        try {
            const attendance = await EventsManager.getEventAttendance(event.id) || [];
            
            // Get attendees lists
            const goingAttendees = await Promise.all(
                attendance
                    .filter(record => record.status === 'going')
                    .map(async record => await UsersManager.getUserInfo(record.user_id))
            );
    
            const notGoingAttendees = await Promise.all(
                attendance
                    .filter(record => record.status === 'not-going')
                    .map(async record => await UsersManager.getUserInfo(record.user_id))
            );
    
            // Update attendance counts
            document.getElementById('eventInfoGoingCount').textContent = `Going (${goingAttendees.length})`;
            document.getElementById('eventInfoNotGoingCount').textContent = `Not Going (${notGoingAttendees.length})`;
    
            // Populate going list
            document.getElementById('eventInfoGoingList').innerHTML = goingAttendees.map(user => `
                <div class="attendee-avatar" title="${user.first_name} ${user.last_name}">
                    ${user.first_name.charAt(0).toUpperCase()}${user.last_name.charAt(0).toUpperCase()}
                </div>
            `).join('');
    
            // Populate not going list
            document.getElementById('eventInfoNotGoingList').innerHTML = notGoingAttendees.map(user => `
                <div class="attendee-avatar not-going" title="${user.first_name} ${user.last_name}">
                    ${user.first_name.charAt(0).toUpperCase()}${user.last_name.charAt(0).toUpperCase()}
                </div>
            `).join('');
    
        } catch (error) {
            console.error('Error fetching attendance:', error);
            document.getElementById('eventInfoAttendance').innerHTML = '<p class="error-message">Failed to load attendance information</p>';
        }
    }
    

    static hideEventInfoModal() {
        const modal = document.getElementById('eventInfoModal');
        modal.classList.add('hidden');
    }

    // Optional: Add method to show admin controls
    static showAdminControls() {
        // Only show admin controls if user has super_admin role
        if (Auth.hasRole('super_admin')) {
            const adminControls = document.querySelectorAll('.admin-only');
            adminControls.forEach(element => {
                element.classList.remove('hidden');
                element.classList.add('visible');
            });
            this.loadAdminGroups();
        } else {
            const adminControls = document.querySelectorAll('.admin-only');
            adminControls.forEach(element => {
                element.classList.add('hidden');
                element.classList.remove('visible');
            });
        }
    }

    static setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(pane => 
                    pane.classList.remove('active')
                );
                
                // Add active class to clicked tab
                button.classList.add('active');
                const tabId = button.dataset.tab;
                document.getElementById(`${tabId}Events`).classList.add('active');
            });
        });
    }

    static async createEventCard(event) {
        const userSession = Auth.getUserSession();
        
        // Show delete button if user created the event or is an admin
        const canEditOrDelete = userSession && (
            event.created_by_id === userSession.userId || 
            userSession.role === 'super_admin' ||
            (this.currentGroupId && userSession.adminGroups && 
             userSession.adminGroups.includes(parseInt(this.currentGroupId)))
        );
        
        const deleteButton = canEditOrDelete 
            ? `<button class="delete-event-btn" onclick="UI.deleteEvent(${event.id})">&times;</button>`
            : '';

        const editButton = canEditOrDelete
            ? `<button class="edit-event-btn" onclick="UI.showEditEventModal(${event.id})" aria-label="Edit event">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>`
            : '';

        // Fetch creator's information
        let creatorName = 'Unknown';
        try {
            const creator = await UsersManager.getUserInfo(event.created_by_id);
            if (creator) {
                const firstName = this.capitalizeWord(creator.first_name);
                const lastName = this.capitalizeWord(creator.last_name);
                creatorName = firstName + " " + lastName || 'Unknown';
            }
        } catch (error) {
            console.error('Error fetching event creator:', error);
        }

        // Fetch event reactions
        let loveCount = 0;
        let laughCount = 0;
        let dislikeCount = 0;
        let celebrateCount = 0;
        let currentUserReaction = "";
        try {
            const reactions = await EventsManager.getEventReactions(event.id);
            if (reactions) {
                loveCount = this.getReactionCount("love", reactions);
                laughCount = this.getReactionCount("laugh", reactions);
                dislikeCount = this.getReactionCount("dislike", reactions);
                celebrateCount = this.getReactionCount("celebrate", reactions);
                currentUserReaction = this.getUserReaction(userSession.userId, reactions);
            }
        } catch (error) {
            console.error('Error fetching event reactions:', error);
        }

        const startDate = new Date(event.start_time);
        const endDate = new Date(event.end_time);
        const formatDate = (date) => {
            const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
            const month = date.toLocaleDateString('en-US', { month: 'long' });
            const day = date.getDate();
            const year = date.getFullYear();
            const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            return date.getHours() === 0 && date.getMinutes() === 0 
                ? `${weekday}, ${month} ${day}`
                : `${weekday}, ${month} ${day} at ${time}`;
        };

        var eventAttendance = [];
        try {
            eventAttendance = await EventsManager.getEventAttendance(event.id) || [];
        } catch (error) {
            console.error('Error fetching event attendance:', error);
        }

        const currentUserAttendanceRecord = eventAttendance.find(
            record => record.user_id === userSession.userId
        );

        const currentUserAttendance = currentUserAttendanceRecord ? currentUserAttendanceRecord.status : '';

        // Filter attendees by status and get their info
        const goingAttendees = await Promise.all(
            eventAttendance
            .filter(record => record.status === 'going')
            .map(async record => await UsersManager.getUserInfo(record.user_id) || {})
        );

        // Filter attendees by status and get their info
        const notGoingAttendees = await Promise.all(
            eventAttendance
            .filter(record => record.status === 'not-going')
            .map(async record => await UsersManager.getUserInfo(record.user_id) || {})
        );

        var goingCount = goingAttendees.length;
        var notGoingCount = notGoingAttendees.length;

        return `
            <div class="event-card" data-event-id="${event.id}">
                <div class="event-header">
                    <h3>${event.name}</h3>
                    <div class="event-controls">
                        ${editButton}
                        ${deleteButton}
                    </div>
                </div>
                <p class="event-creator">Author: ${creatorName}</p>
                <p class="event-card-description">${event.description}</p>
                ${event.location ? `
                    <p class="event-location">
                        <svg class="location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 21s-8-4.5-8-11a8 8 0 1 1 16 0c0 6.5-8 11-8 11z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                        ${event.location}
                    </p>
                ` : ''}
                <div class="event-times">
                    <span>${formatDate(startDate)}</span>
                    ${
                        startDate.getDate() !== endDate.getDate() 
                            ? `<span>${formatDate(endDate)}</span>` 
                            : ''
                    }
                </div>

                <div class="attendance-section">
                    <div class="attendance-buttons">
                        <button class="attendance-btn ${currentUserAttendance === 'going' ? 'active' : ''}" 
                                data-attendance="going" 
                                onclick="UI.updateAttendance(${event.id}, 'going', '${currentUserAttendance}')">
                            <svg class="attendance-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 13l4 4L19 7"></path>
                            </svg>
                            Going
                        </button>
                        <button class="attendance-btn ${currentUserAttendance === 'not-going' ? 'active' : ''}"
                                data-attendance="not-going"
                                onclick="UI.updateAttendance(${event.id}, 'not-going', '${currentUserAttendance}')">
                            <svg class="attendance-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Not Going
                        </button>
                    </div>
                    
                    <button class="attendance-list-toggle" onclick="UI.toggleAttendanceList(${event.id})">
                        <span class="attendance-count">
                            <span class="going-count">${goingCount}</span> going
                            · <span class="not-going-count">${notGoingCount}</span> not going
                        </span>
                        <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>

                    <div id="attendanceList-${event.id}" class="attendance-list hidden">
                        <div class="attendance-category">
                            <h4>Going (${goingCount})</h4>
                            <div class="attendee-avatars going-list">
                                ${goingAttendees.map(user => `
                                    <div class="attendee-avatar" title="${user.first_name} ${user.last_name}">
                                        ${user.first_name.charAt(0).toUpperCase()}${user.last_name.charAt(0).toUpperCase()}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="attendance-category">
                            <h4>Not Going (${notGoingCount})</h4>
                            <div class="attendee-avatars not-going-list">
                                ${notGoingAttendees.map(user => `
                                    <div class="attendee-avatar not-going" title="${user.first_name} ${user.last_name}">
                                        ${user.first_name.charAt(0).toUpperCase()}${user.last_name.charAt(0).toUpperCase()}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static getReactionCount(reactionType, reactions) {
        return reactions.filter(reaction => reaction.reaction === reactionType).length;
    }

    static getUserReaction(userId, reactions) {
        const reaction = reactions.find(reaction => reaction.user_id === userId);
        return reaction ? reaction : "";
    }

    static capitalizeWord(word) {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }

    static formatDateTime(date) {
        return new Date(date).toLocaleString(undefined, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
    
    static fillReactionIcon(reaction) {
        switch (reaction) {
            case "laugh":
                var icon = document.getElementById(`laugh-icon`);
                icon.src = "assets/icons/laugh-squint_filled.png"
                break;
            case "love":
                var icon = document.getElementById(`love-icon`);
                icon.src = "assets/icons/heart_filled.png"
                break;
            case "dislike":
                var icon = document.getElementById(`dislike-icon`);
                icon.src = "assets/icons/thumbs-down_filled.png"
                break;
            case "celebrate":
                var icon = document.getElementById(`celebrate-icon`);
                icon.src = "assets/icons/party-horn_filled.png"
                break;
            default:
                console.error("Invalid reaction");
        }
    }

    static unfillReactionIcon(reaction) {
        switch (reaction) {
            case "laugh":
                var icon = document.getElementById(`laugh-icon`);
                icon.src = "assets/icons/laugh-squint.png"
                break;
            case "love":
                var icon = document.getElementById(`love-icon`);
                icon.src = "assets/icons/heart.png"
                break;
            case "dislike":
                var icon = document.getElementById(`dislike-icon`);
                icon.src = "assets/icons/thumbs-down.png"
                break;
            case "celebrate":
                var icon = document.getElementById(`celebrate-icon`);
                icon.src = "assets/icons/party-horn.png"
                break;
            default:
                console.error("Invalid reaction");
        }
    }

    static async reactToEvent(userId, reaction, eventId) {
        try {
            const reactions = await EventsManager.getEventReactions(eventId);

            const currentUserReaction = reactions !== null ? reactions.find(r => r["user_id"] === userId) : null;
            const newUserReaction = {"user_id": userId, "reaction": reaction, "event_id": eventId}

            // If they are clicking a reaction they already selected, remove the reaction and return
            if (currentUserReaction && currentUserReaction["reaction"] === reaction) {
                await EventsManager.unreactToEvent(currentUserReaction);
                this.unfillReactionIcon(reaction);

                // FIXME EXTRACT ?
                // Get current group ID from URL
                const urlParams = new URLSearchParams(window.location.search);
                const groupId = urlParams.get('groupId');
                
                // Refresh events list
                await this.loadGroupEvents(groupId);

                return;
            }

            // Remove old reaction first if exists
            if (currentUserReaction) {
                await EventsManager.unreactToEvent(currentUserReaction)
                this.unfillReactionIcon(reaction);
            }

            await EventsManager.reactToEvent(newUserReaction);
            this.fillReactionIcon(reaction);

            // Get current group ID from URL
            const urlParams = new URLSearchParams(window.location.search);
            const groupId = urlParams.get('groupId');
            
            // Refresh events list
            await this.loadGroupEvents(groupId);
        } catch (error) {
            console.error('Failed to react to event:', error);
            alert('Failed to react to event. Please try again.');
        }
    }

    static async deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) {
            return;
        }

        try {
            await EventsManager.deleteEvent(eventId);

            // Get current group ID from URL
            const urlParams = new URLSearchParams(window.location.search);
            const groupId = urlParams.get('groupId');
            
            // Refresh events list
            await this.loadGroupEvents(groupId);
        } catch (error) {
            console.error('Failed to delete event:', error);
            alert('Failed to delete event. Please try again.');
        }
    }

    static async showEditEventModal(eventId) {
        try {
            const event = await EventsManager.getEvent(eventId);
            const modal = document.getElementById('editEventModal');
            const form = document.getElementById('editEventForm');
            
            // Store original UTC values for comparison
            form.dataset.originalName = event.name;
            form.dataset.originalDescription = event.description || '';
            form.dataset.originalLocation = event.location || '';
            form.dataset.originalStartTime = event.start_time;
            form.dataset.originalEndTime = event.end_time;
            
            // Populate form fields
            document.getElementById('editEventId').value = event.id;
            document.getElementById('editEventName').value = event.name;
            document.getElementById('editEventDescription').value = event.description || '';
            document.getElementById('editEventLocation').value = event.location || '';
            
            // Convert UTC dates to local time for display
            const startDate = new Date(event.start_time);
            const endDate = new Date(event.end_time);
            
            // Format local dates for input fields
            document.getElementById('editEventStartDate').value = startDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
            document.getElementById('editEventStartTime').value = startDate.toLocaleTimeString('en-GB').slice(0, 5); // HH:mm format
            document.getElementById('editEventEndDate').value = endDate.toLocaleDateString('en-CA');
            document.getElementById('editEventEndTime').value = endDate.toLocaleTimeString('en-GB').slice(0, 5);

            // Show modal
            modal.classList.remove('hidden');

            // Handle form submission
            const handleSubmit = async (e) => {
                e.preventDefault();
                
                const updatedFields = {};
                const form = e.target;
                
                // Check which fields have changed
                if (form.editEventName.value !== form.dataset.originalName) {
                    updatedFields.name = form.editEventName.value;
                }
                if (form.editEventDescription.value !== form.dataset.originalDescription) {
                    updatedFields.description = form.editEventDescription.value;
                }
                if (form.editEventLocation.value !== form.dataset.originalLocation) {
                    updatedFields.location = form.editEventLocation.value;
                }
                
                // Create dates in local time and convert to UTC for storage
                const newStartDateTime = new Date(`${form.editEventStartDate.value}T${form.editEventStartTime.value}`);
                const newEndDateTime = new Date(`${form.editEventEndDate.value}T${form.editEventEndTime.value}`);
                
                // Compare UTC timestamps without milliseconds
                const formatUTC = (date) => date.toISOString().split('.')[0] + 'Z';
                
                if (formatUTC(newStartDateTime) !== form.dataset.originalStartTime) {
                    updatedFields.start_time = formatUTC(newStartDateTime);
                }
                if (formatUTC(newEndDateTime) !== form.dataset.originalEndTime) {
                    updatedFields.end_time = formatUTC(newEndDateTime);
                }
                
                // Validate that at least one field has changed
                if (Object.keys(updatedFields).length === 0) {
                    alert('Please modify at least one field to update the event.');
                    return;
                }
                
                try {
                    await EventsManager.updateEvent(updatedFields, eventId);
                    this.hideEditEventModal();

                    // Get current group ID from URL
                    const urlParams = new URLSearchParams(window.location.search);
                    const groupId = urlParams.get('groupId');
                    await this.loadGroupEvents(groupId);
                } catch (error) {
                    console.error('Error updating event:', error);
                    alert('Failed to update event: ' + error.message);
                }
            };

            const handleClose = () => {
                this.hideEditEventModal();
                form.removeEventListener('submit', handleSubmit);
                closeBtn.removeEventListener('click', handleClose);
                cancelBtn.removeEventListener('click', handleClose);
            };

            // Handle close button
            const closeBtn = document.getElementById('closeEditEventModal');
            const cancelBtn = document.getElementById('cancelEditEventModal');

            form.addEventListener('submit', handleSubmit);
            closeBtn.addEventListener('click', handleClose);
            cancelBtn.addEventListener('click', handleClose);
        } catch (error) {
            console.error('Error showing edit event modal:', error);
            alert('Failed to load event details');
        }
    }

    static hideEditEventModal() {
        const modal = document.getElementById('editEventModal');
        const form = document.getElementById('editEventForm');
        modal.classList.add('hidden');
        form.reset();
    }

    static setupViewToggle() {
        const viewBtns = document.querySelectorAll('.view-btn');
        const views = document.querySelectorAll('.view-content');
        
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const viewType = btn.dataset.view;
                
                // Toggle active class on buttons
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Toggle active class on views
                views.forEach(v => v.classList.remove('active'));
                let targetView;
                if (viewType === 'tabs') {
                    targetView = document.getElementById('listView');
                } else {
                    targetView = document.getElementById(`${viewType}View`);
                }
                
                if (!targetView) {
                    console.error(`View element ${viewType}View not found`);
                    return;
                }
                targetView.classList.add('active');
                
                // Initialize calendar if switching to calendar view
                if (viewType === 'calendar') {
                    const calendarEl = document.getElementById('calendar');
                    if (!calendarEl) {
                        console.error('Calendar element not found');
                        return;
                    }
                    
                    if (!this.calendar) {
                        const isMobile = window.innerWidth < 768;
                        this.calendar = new FullCalendar.Calendar(calendarEl, {
                            initialView: isMobile ? 'dayGridWeek' : 'dayGridMonth',
                            headerToolbar: {
                                left: 'prev,next today',
                                center: 'title',
                                right: isMobile ? 'dayGridWeek,dayGridMonth' : 'dayGridMonth,dayGridWeek'
                            },
                            eventClick: function(info) {
                                UI.showEventInfoModal(info.event);
                            },
                            events: async function(info, successCallback, failureCallback) {
                                try {
                                    const urlParams = new URLSearchParams(window.location.search);
                                    const groupId = urlParams.get('groupId');
                                    if (!groupId) {
                                        UI.clearCalendar();
                                        successCallback([]);
                                        return;
                                    }
                                    const events = await EventsManager.getGroupEvents(groupId) || [];
                                    const formattedEvents = events.map(event => ({
                                        id: event.id,
                                        title: event.name,
                                        start: event.start_time,
                                        end: event.end_time,
                                        description: event.description,
                                        location: event.location // Add this line
                                    }));
                                    successCallback(formattedEvents);
                                } catch (error) {
                                    console.error('Error fetching calendar events:', error);
                                    UI.clearCalendar();
                                    failureCallback(error);
                                }
                            }
                        });
                        this.calendar.render();
                    } else {
                        // Just refetch events if calendar already exists
                        this.calendar.refetchEvents();
                    }
                }
            });
        });
    }

    static async getCalendarEvents(info, successCallback, failureCallback) {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const groupId = urlParams.get('groupId');
            if (!groupId) {
                this.clearCalendar();
                successCallback([]);
                return;
            }
            
            const events = await EventsManager.getGroupEvents(groupId) || [];
            const formattedEvents = this.formatEventsForCalendar(events);
            successCallback(formattedEvents);
        } catch (error) {
            console.error('Error fetching calendar events:', error);
            this.clearCalendar();
            failureCallback(error);
        }
    }

    static formatEventsForCalendar(events) {
        return events.map(event => ({
            id: event.id,
            title: event.name,
            start: event.start_time,
            end: event.end_time,
            description: `${event.description}\n\nStart: ${this.formatDateTime(event.start_time)}\nEnd: ${this.formatDateTime(event.end_time)}`
        }));
    }

    static formatDateTime(dateString) {
        const date = new Date(dateString);
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const day = date.getDate();
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedDate = `${monthNames[monthIndex]} ${day}, ${year} ${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        return formattedDate;
    }

    static showLoading() {
        this.loadingCount++;
        document.getElementById('loadingSpinner').classList.remove('hidden');
    }

    static hideLoading() {
        this.loadingCount = Math.max(0, this.loadingCount - 1);
        if (this.loadingCount === 0) {
            document.getElementById('loadingSpinner').classList.add('hidden');
        }
    }

    static clearCalendar() {
        if (this.calendar) {
            this.calendar.destroy();
            this.calendar = null;
        }
        const calendarEl = document.getElementById('calendar');
        if (calendarEl) {
            calendarEl.innerHTML = '';
        }
    }

    static showJoinGroupModal() {
        const modal = document.getElementById('joinGroupModal');
        modal.classList.remove('hidden');
    }

    static hideJoinGroupModal() {
        const modal = document.getElementById('joinGroupModal');
        modal.classList.add('hidden');
        document.getElementById('joinGroupForm').reset();
        document.getElementById('groupCodeError').classList.add('hidden');
    }

    static async handleJoinGroup(e) {
        e.preventDefault();
        const codeInput = document.getElementById('groupCode');
        const errorElement = document.getElementById('groupCodeError');
        errorElement.classList.add('hidden');
        
        // Validate format
        const code = codeInput.value.toUpperCase();
        if (!code.match(/^[A-Z0-9]{16}$/)) {
            errorElement.textContent = 'Group code must be 16 characters (letters and numbers only)';
            errorElement.classList.remove('hidden');
            return;
        }
        
        try {
            await GroupsManager.joinGroupByCode(code);
            
            // Refresh groups list
            const userSession = Auth.getUserSession();
            await this.loadUserGroups(userSession.userId);
            
            this.hideJoinGroupModal();
        } catch (error) {
            console.error('Failed to join group:', error);
            errorElement.textContent = 'Invalid group code. Please check and try again.';
            errorElement.classList.remove('hidden');
        }
    }

    static async loadAdminGroups() {
        try {
            const groups = await GroupsManager.getAllGroups();
            const groupSelect = document.getElementById('adminGroupSelect');
            const adminGroupSelectForAdmin = document.getElementById('adminGroupSelectForAdmin');
            const adminGroupSelectForRemove = document.getElementById('adminGroupSelectForRemove');
            const adminEmailNotificationToggle = document.getElementById('emailNotificationsToggle');
            
            const urlParams = new URLSearchParams(window.location.search);
            const groupId = urlParams.get('groupId');

            if (groupId) {
                const currentGroup = await GroupsManager.getGroup(groupId)
                adminEmailNotificationToggle.checked = currentGroup.do_send_emails
            }
            
            // Handle case when no groups exist
            if (!groups || groups.length === 0) {
                const noGroupsOption = '<option value="">No groups available</option>';
                groupSelect.innerHTML = noGroupsOption;
                adminGroupSelectForAdmin.innerHTML = noGroupsOption;
                adminGroupSelectForRemove.innerHTML = noGroupsOption;
                
                // Disable the selects
                groupSelect.disabled = true;
                adminGroupSelectForAdmin.disabled = true;
                adminGroupSelectForRemove.disabled = true;
                
                // Disable related user select elements
                const userSelect = document.getElementById('adminUserSelect');
                const userSelectForAdmin = document.getElementById('userSelectForAdmin');
                const userSelectForRemove = document.getElementById('userSelectForRemove');
                if (userSelect) userSelect.disabled = true;
                if (userSelectForAdmin) userSelectForAdmin.disabled = true;
                if (userSelectForRemove) userSelectForRemove.disabled = true;
                
                return;
            }
            
            // Enable the selects if we have groups
            groupSelect.disabled = false;
            adminGroupSelectForAdmin.disabled = false;
            adminGroupSelectForRemove.disabled = false;
            
            const groupsHtml = `
                <option value="">Select a group...</option>
                ${groups.map(group => `
                    <option value="${group.id}">${group.name}</option>
                `).join('')}
            `;

            groupSelect.innerHTML = groupsHtml;
            adminGroupSelectForAdmin.innerHTML = groupsHtml;
            adminGroupSelectForRemove.innerHTML = groupsHtml;
            
        } catch (error) {
            console.error('Failed to load groups:', error);
            const errorMessage = error.message || 'Failed to load groups';
            alert(errorMessage);
            
            // Set error state in the UI
            const noGroupsError = '<option value="">Error loading groups</option>';
            const selects = [
                document.getElementById('adminGroupSelect'),
                document.getElementById('adminGroupSelectForAdmin'),
                document.getElementById('adminGroupSelectForRemove')
            ];
            
            selects.forEach(select => {
                if (select) {
                    select.innerHTML = noGroupsError;
                    select.disabled = true;
                }
            });
        }
    }

    static async loadNonGroupMembers(groupId) {
        try {
            const users = await GroupsManager.getNonGroupMembers(groupId);
            const userSelect = document.getElementById('adminUserSelect');
            
            if (!users || users.length === 0) {
                userSelect.innerHTML = '<option value="">No available users</option>';
                userSelect.disabled = true;
                return;
            }

            userSelect.innerHTML = `
                <option value="">Select a user...</option>
                ${users.map(user => `
                    <option value="${user.id}">
                        ${user.username}${user.email ? ` (${user.email})` : ''}
                    </option>
                `).join('')}
            `;
            userSelect.disabled = false;
        } catch (error) {
            console.error('Failed to load users:', error);
            alert('Failed to load users');
        }
    }

    static async loadNonAdminMembers(groupId) {
        try {
            const users = await GroupsManager.getNonAdminMembers(groupId);
            const userSelect = document.getElementById('userSelectForAdmin');
            
            if (!users || users.length === 0) {
                userSelect.innerHTML = '<option value="">No available users</option>';
                userSelect.disabled = true;
                return;
            }

            userSelect.innerHTML = `
                <option value="">Select a user...</option>
                ${users.map(user => `
                    <option value="${user.id}">
                        ${user.username}${user.email ? ` (${user.email})` : ''}
                    </option>
                `).join('')}
            `;
            userSelect.disabled = false;
        } catch (error) {
            console.error('Failed to load users:', error);
            alert('Failed to load users');
        }
    }

    static async loadAdminMembers(groupId) {
        try {
            const users = await GroupsManager.getAdminMembers(groupId);
            const userSelect = document.getElementById('userSelectForRemove');
            
            if (!users || users.length === 0) {
                userSelect.innerHTML = '<option value="">No admins available</option>';
                userSelect.disabled = true;
                return;
            }

            userSelect.innerHTML = `
                <option value="">Select an admin...</option>
                ${users.map(user => `
                    <option value="${user.id}">
                        ${user.username}${user.email ? ` (${user.email})` : ''}
                    </option>
                `).join('')}
            `;
            userSelect.disabled = false;
        } catch (error) {
            console.error('Failed to load admins:', error);
            alert('Failed to load admins');
        }
    }

    static async handleLeaveGroup() {
        const userSession = Auth.getUserSession();
        const groupId = document.getElementById('groupSelect').value;
        
        if (!groupId) {
            alert('Please select a group to leave');
            return;
        }
        
        if (confirm('Are you sure you want to leave this group?')) {
            try {
                await GroupsManager.leaveGroup(groupId, userSession.userId);
                
                // Get remaining groups
                const groups = await GroupsManager.getUserGroups(userSession.userId);
                const groupSelect = document.getElementById('groupSelect');
                const groupCodeDisplay = document.querySelector('.group-code-display');
                
                // Hide group code display if no groups left
                if (!groups || groups.length === 0) {
                    groupCodeDisplay.classList.add('hidden');
                    groupSelect.innerHTML = '<option value="">No groups available, please contact an administrator.</option>';
                    groupSelect.disabled = true;
                    document.getElementById('addEventBtn').disabled = true;
                    document.getElementById('leaveGroupBtn').disabled = true;
                    
                    // Clear URL parameter
                    const url = new URL(window.location);
                    url.searchParams.delete('groupId');
                    window.history.pushState({}, '', url);
                    
                    this.currentGroupId = null;
                    
                    // Clear events display
                    document.getElementById('upcomingEventsList').innerHTML = '';
                    document.getElementById('historicEventsList').innerHTML = '';
                    if (this.calendar) {
                        this.calendar.refetchEvents();
                    }
                } else {
                    // Select first available group
                    const newGroupId = groups[0].id;
                    groupSelect.value = newGroupId;
                    this.currentGroupId = newGroupId;
                    
                    // Update URL
                    const url = new URL(window.location);
                    url.searchParams.set('groupId', newGroupId);
                    window.history.pushState({}, '', url);
                    
                    // Update group code display for new group
                    try {
                        const group = await GroupsManager.getGroupDetails(newGroupId);
                        if (group && group.code) {
                            groupCodeDisplay.classList.remove('hidden');
                            document.getElementById('groupCodeDisplay').textContent = group.code;
                        }
                    } catch (error) {
                        console.error('Failed to get group details:', error);
                        groupCodeDisplay.classList.add('hidden');
                    }
                    
                    // Load events for the new group
                    await this.loadGroupEvents(newGroupId);
                }
                
                // Refresh groups list
                await this.loadUserGroups(userSession.userId);
            } catch (error) {
                console.error('Failed to leave group:', error);
                alert('Failed to leave group: ' + error.message);
            }
        }
    }

    static showResetPasswordModal() {
        const modal = document.getElementById('resetPasswordModal');
        modal.classList.remove('hidden');
        // Show first step, hide others
        document.getElementById('resetEmailForm').classList.remove('hidden');
        document.getElementById('resetCodeForm').classList.add('hidden');
        document.getElementById('newPasswordForm').classList.add('hidden');
    }

    static hideResetPasswordModal() {
        const modal = document.getElementById('resetPasswordModal');
        modal.classList.add('hidden');
        // Reset forms
        document.getElementById('resetEmailForm').reset();
        document.getElementById('resetCodeForm').reset();
        document.getElementById('newPasswordForm').reset();
    }

    static setupPasswordResetHandlers() {
        // Forgot password link
        document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showResetPasswordModal();
        });

        // Email form submission
        document.getElementById('resetEmailForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value;
            const errorElement = document.getElementById('resetEmailError');
            
            try {
                await Auth.requestPasswordReset(email);
                // Show code verification form
                document.getElementById('resetEmailForm').classList.add('hidden');
                document.getElementById('resetCodeForm').classList.remove('hidden');
            } catch (error) {
                errorElement.textContent = error.message || 'Failed to send reset code';
                errorElement.classList.remove('hidden');
            }
        });

        // Code verification form
        document.getElementById('resetCodeForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value;
            const code = document.getElementById('resetCode').value;
            const errorElement = document.getElementById('resetCodeError');
            
            try {
                await Auth.verifyResetCode(email, code);
                // Show new password form
                document.getElementById('resetCodeForm').classList.add('hidden');
                document.getElementById('newPasswordForm').classList.remove('hidden');
            } catch (error) {
                errorElement.textContent = error.message || 'Invalid code';
                errorElement.classList.remove('hidden');
            }
        });

        // New password form
        document.getElementById('newPasswordForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value;
            const code = document.getElementById('resetCode').value;
            const password = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const errorElement = document.getElementById('newPasswordError');
            
            if (password !== confirmPassword) {
                errorElement.textContent = 'Passwords do not match';
                errorElement.classList.remove('hidden');
                return;
            }
            
            if (!this.validatePassword(password)) {
                errorElement.textContent = 'Password does not meet requirements';
                errorElement.classList.remove('hidden');
                return;
            }
            
            try {
                await Auth.resetPassword(email, code, password);
                this.hideResetPasswordModal();
                alert('Password reset successful! Please login with your new password.');
            } catch (error) {
                errorElement.textContent = error.message || 'Failed to reset password';
                errorElement.classList.remove('hidden');
            }
        });
    }

    static setupPasswordToggles() {
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const button = e.currentTarget;
                const input = button.parentElement.querySelector('input');
                const eyeOpen = button.querySelectorAll('.eye-open');
                const eyeClosed = button.querySelectorAll('.eye-closed');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    eyeOpen.forEach(el => el.classList.remove('hidden'));
                    eyeClosed.forEach(el => el.classList.add('hidden'));
                } else {
                    input.type = 'password';
                    eyeOpen.forEach(el => el.classList.add('hidden'));
                    eyeClosed.forEach(el => el.classList.remove('hidden'));
                }
            });
        });
    }

    static async updateAttendance(eventId, status, currentUserAttendance) {
        // Don't update if no change
        if (currentUserAttendance !== '' && currentUserAttendance === status) {
            status = '';
        }
        try {
            const userSession = Auth.getUserSession();
            const attendance = {
                event_id: eventId,
                user_id: userSession.userId,
                status: status
            };
            
            await EventsManager.updateAttendance(attendance);
            
            // Refresh the event card
            const groupId = new URLSearchParams(window.location.search).get('groupId');
            await this.loadGroupEvents(groupId);
        } catch (error) {
            console.error('Failed to update attendance:', error);
            alert('Failed to update attendance status');
        }
    }

    static toggleAttendanceList(eventId) {
        const list = document.getElementById(`attendanceList-${eventId}`);
        const toggle = list.previousElementSibling;
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
            list.classList.add('hidden');
            toggle.setAttribute('aria-expanded', 'false');
        } else {
            list.classList.remove('hidden');
            toggle.setAttribute('aria-expanded', 'true');
        }
    }

    static {
        document.addEventListener('DOMContentLoaded', () => {
            UI.init();
        });
    }
}
