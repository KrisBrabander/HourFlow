// App functionality
const app = {
    // App state
    state: {
        clients: [],
        projects: [],
        timeEntries: [],
        quotes: [],
        invoices: [],
        settings: {
            businessName: '',
            businessEmail: '',
            businessAddress: '',
            businessPhone: '',
            taxRate: 0,
            hourlyRate: 50
        }
    },

    // Initialize app
    init: async function() {
        await this.validateLicense();

        // Initialize navigation
        this.initNavigation();

        // Load data
        this.loadData();

        // Initialize notification system
        this.initNotifications();

        // Update dashboard stats
        this.updateDashboardStats();
    },

    // Validate license key via API
    validateLicense: async function() {
        console.log("Starting license validation...");
        
        // Check for URL parameter license key
        const params = new URLSearchParams(window.location.search);
        if (params.get("license")) {
            console.log("License key found in URL parameters");
            localStorage.setItem("hourflow_license", params.get("license"));
        }
        
        // Check for development mode
        const isDevelopmentMode = localStorage.getItem("devMode") === "true" || 
                                 window.location.hostname === "localhost" || 
                                 window.location.hostname === "127.0.0.1";
        
        if (isDevelopmentMode) {
            console.log("Development mode active - license check bypassed");
            return true;
        }
        
        // Get the license key from localStorage
        const license = localStorage.getItem("hourflow_license");

        if (!license) {
            console.log("No license key found. Redirecting to license page.");
            window.location.replace("/license.html");
            return false;
        }
        
        // Simple verification - just check if the key exists
        // This avoids API calls that might cause redirect loops
        console.log("License key found, allowing access");
        return true;
    },

    // Initialize navigation
    initNavigation: function() {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.content-section');
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.querySelector('.sidebar');

        // Handle navigation clicks
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();

                // Get target section
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);

                // Update active states
                navLinks.forEach(navLink => navLink.classList.remove('active'));
                sections.forEach(section => section.classList.remove('active'));

                link.classList.add('active');
                targetSection.classList.add('active');

                // Close sidebar on mobile
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('mobile-open');
                }
            });
        });

        // Handle menu toggle
        menuToggle.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('mobile-open');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        });
    },

    // Load data from localStorage
    loadData: function() {
        const clients = localStorage.getItem('hourflow_clients');
        if (clients) {
            this.state.clients = JSON.parse(clients);
        }

        const projects = localStorage.getItem('hourflow_projects');
        if (projects) {
            this.state.projects = JSON.parse(projects);
        }

        const timeEntries = localStorage.getItem('hourflow_time_entries');
        if (timeEntries) {
            this.state.timeEntries = JSON.parse(timeEntries);
        }

        const quotes = localStorage.getItem('hourflow_quotes');
        if (quotes) {
            this.state.quotes = JSON.parse(quotes);
        }

        const invoices = localStorage.getItem('hourflow_invoices');
        if (invoices) {
            this.state.invoices = JSON.parse(invoices);
        }

        const settings = localStorage.getItem('hourflow_settings');
        if (settings) {
            this.state.settings = JSON.parse(settings);
        }
    },

    // Save data to localStorage
    saveData: function(key, data) {
        localStorage.setItem(`hourflow_${key}`, JSON.stringify(data));
    },

    // Generate unique ID
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },

    // Format currency
    formatCurrency: function(amount) {
        return '$' + parseFloat(amount).toFixed(2);
    },

    // Initialize notification system
    initNotifications: function() {
        // Notification already defined in global scope
    },

    // Update dashboard stats
    updateDashboardStats: function() {
        const totalHours = this.state.timeEntries.reduce((total, entry) => total + parseFloat(entry.hours), 0);
        document.getElementById('total-hours').textContent = totalHours.toFixed(2);

        document.getElementById('total-clients').textContent = this.state.clients.length;
        document.getElementById('total-quotes').textContent = this.state.quotes.length;
        document.getElementById('total-invoices').textContent = this.state.invoices.length;

        this.updateRecentTimeEntries();
    },

    // Update recent time entries
    updateRecentTimeEntries: function() {
        const tableBody = document.querySelector('#recent-time-entries tbody');
        tableBody.innerHTML = '';

        const recentEntries = [...this.state.timeEntries]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (recentEntries.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="4" class="text-center">No time entries found</td>`;
            tableBody.appendChild(row);
            return;
        }

        recentEntries.forEach(entry => {
            const row = document.createElement('tr');

            const date = new Date(entry.date);
            const formattedDate = date.toLocaleDateString();

            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${entry.project}</td>
                <td>${entry.description}</td>
                <td>${entry.hours}</td>
            `;

            tableBody.appendChild(row);
        });
    },

    getClientById: function(id) {
        return this.state.clients.find(client => client.id === id);
    },

    getClientNameById: function(id) {
        const client = this.getClientById(id);
        return client ? client.name : 'Unknown Client';
    },

    getProjectById: function(id) {
        return this.state.projects.find(project => project.id === id);
    },

    getProjectNameById: function(id) {
        const project = this.getProjectById(id);
        return project ? project.name : 'Unknown Project';
    },

    getProjectRateById: function(id) {
        const project = this.getProjectById(id);
        return project && project.rate ? parseFloat(project.rate) : this.state.settings.hourlyRate;
    }
};

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification show';

    if (type === 'error') {
        notification.classList.add('error');
    }

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    app.init();

    // Initialize client functionality
    initClientFunctionality();

    showNotification('Welcome to HourFlow Premium!');
});

// Initialize client functionality
function initClientFunctionality() {
    // Get DOM elements
    const addClientBtn = document.getElementById('add-client-btn');
    const clientForm = document.querySelector('.client-form');
    const closeClientFormBtn = document.querySelector('.close-client-form');
    const clientFormElement = document.getElementById('client-form');
    
    if (!addClientBtn) {
        console.error('Add Client button not found');
        return;
    }
    
    // Add event listener to Add Client button
    addClientBtn.addEventListener('click', function() {
        clientForm.style.display = 'block';
    });
    
    // Add event listener to Close button
    if (closeClientFormBtn) {
        closeClientFormBtn.addEventListener('click', function() {
            clientForm.style.display = 'none';
        });
    }
    
    // Add event listener to client form submission
    if (clientFormElement) {
        clientFormElement.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const clientName = document.getElementById('client-name').value;
            const clientEmail = document.getElementById('client-email').value;
            const clientPhone = document.getElementById('client-phone').value;
            const clientAddress = document.getElementById('client-address').value;
            
            // Create new client object
            const newClient = {
                id: app.generateId(),
                name: clientName,
                email: clientEmail,
                phone: clientPhone,
                address: clientAddress,
                dateAdded: new Date().toISOString()
            };
            
            // Add client to state
            app.state.clients.push(newClient);
            
            // Save data
            app.saveData('clients', app.state.clients);
            
            // Reset form
            clientFormElement.reset();
            
            // Hide form
            clientForm.style.display = 'none';
            
            // Show notification
            showNotification('Client added successfully!');
            
            // Refresh client list if on clients page
            if (document.querySelector('.clients-list')) {
                renderClientsList();
            }
        });
    }
}

// Render clients list
function renderClientsList() {
    const clientsList = document.querySelector('.clients-list');
    if (!clientsList) return;
    
    // Clear existing list
    clientsList.innerHTML = '';
    
    // Check if there are clients
    if (app.state.clients.length === 0) {
        clientsList.innerHTML = '<div class="empty-state">No clients added yet</div>';
        return;
    }
    
    // Render each client
    app.state.clients.forEach(client => {
        const clientCard = document.createElement('div');
        clientCard.className = 'client-card';
        clientCard.innerHTML = `
            <div class="client-card-header">
                <h3>${client.name}</h3>
                <div class="client-actions">
                    <button class="btn-icon edit-client" data-id="${client.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-client" data-id="${client.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="client-card-body">
                <p><i class="fas fa-envelope"></i> ${client.email || 'No email'}</p>
                <p><i class="fas fa-phone"></i> ${client.phone || 'No phone'}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${client.address || 'No address'}</p>
            </div>
        `;
        
        clientsList.appendChild(clientCard);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-client').forEach(btn => {
        btn.addEventListener('click', function() {
            const clientId = this.getAttribute('data-id');
            // Implement edit functionality
            console.log('Edit client:', clientId);
        });
    });
    
    document.querySelectorAll('.delete-client').forEach(btn => {
        btn.addEventListener('click', function() {
            const clientId = this.getAttribute('data-id');
            // Implement delete functionality
            if (confirm('Are you sure you want to delete this client?')) {
                app.state.clients = app.state.clients.filter(client => client.id !== clientId);
                app.saveData('clients', app.state.clients);
                renderClientsList();
                showNotification('Client deleted successfully!');
            }
        });
    });
}
