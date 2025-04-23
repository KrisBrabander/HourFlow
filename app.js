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
        // Check for development mode
        const isDevelopmentMode = localStorage.getItem("devMode") === "true" || 
                                 window.location.hostname === "localhost" || 
                                 window.location.hostname === "127.0.0.1";
        
        // Skip validation in development mode
        if (isDevelopmentMode) {
            console.log("Development mode active - license check bypassed");
            // Set a temporary development license
            localStorage.setItem("hourflow_license", "DEV-MODE-LICENSE");
            return;
        }
        
        const params = new URLSearchParams(window.location.search);
        const license = params.get("license") || localStorage.getItem("hourflow_license");

        if (!license) {
            alert("No license key found. Please purchase at Gumroad.");
            window.location.href = "https://gumroad.com/l/YOURPRODUCT";
            return;
        }

        try {
            // Add a fallback mechanism to try both API endpoints
            let response;
            let data;
            
            try {
                // First try the validate-license endpoint (GET request)
                response = await fetch(`/api/validate-license?licenseKey=${license}`);
                data = await response.json();
            } catch (error) {
                console.log('Trying fallback license verification method...');
                // If that fails, try the verify-license endpoint (POST request)
                response = await fetch('/api/verify-license', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ licenseKey: license })
                });
                data = await response.json();
            }

            if (!data.valid) {
                console.log('License validation failed:', data);
                alert("Invalid license key. Please purchase a valid license.");
                window.location.href = "https://gumroad.com/l/YOURPRODUCT";
                return;
            }

            localStorage.setItem("hourflow_license", license);
            console.log("✅ License validated. Access granted.");
        } catch (err) {
            alert("Error validating license. Please try again later.");
            window.location.href = "https://gumroad.com/l/YOURPRODUCT";
        }
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

    showNotification('Welcome to HourFlow Premium!');
});
