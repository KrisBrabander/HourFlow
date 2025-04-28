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
        // Forceer licentievalidatie bij elke app start
        const isLicensed = await this.validateLicense();
        
        // Als er geen geldige licentie is, stop de initialisatie
        if (!isLicensed) {
            console.log("Geen geldige licentie gevonden. App initialisatie gestopt.");
            return;
        }

        // Initialize navigation
        this.initNavigation();

        // Load data
        this.loadData();

        // Initialize notification system
        this.initNotifications();

        // Initialize logout functionality
        this.initLogout();

        // Update dashboard stats
        this.updateDashboardStats();
    },

    // Valideer licentie
    validateLicense: async function() {
        console.log("Start licentievalidatie...");
        
        // Als we op de licentiepagina zijn, validatie overslaan
        if (window.location.pathname.includes('license.html')) {
            console.log("Op licentiepagina, validatie overgeslagen");
            return true;
        }
        
        // Controleer op URL parameter licentie
        const params = new URLSearchParams(window.location.search);
        if (params.get("license")) {
            console.log("Licentie gevonden in URL parameters");
            localStorage.setItem("hourflow_license", params.get("license"));
            // Verwijder licentie uit URL om problemen te voorkomen bij vernieuwen
            if (window.history && window.history.replaceState) {
                const newUrl = window.location.pathname + 
                               (window.location.search ? window.location.search.replace(/[&?]license=[^&]+/, '') : '') + 
                               window.location.hash;
                window.history.replaceState({}, document.title, newUrl);
            }
        }
        
        // Controleer op development mode - ALLEEN VOOR LOKALE ONTWIKKELING
        const isDevelopmentMode = localStorage.getItem("devMode") === "true" && 
                                (window.location.hostname === "localhost" || 
                                 window.location.hostname === "127.0.0.1");
        
        if (isDevelopmentMode) {
            console.log("Development mode actief - licentiecontrole overgeslagen");
            return true;
        }
        
        // Haal de licentie op uit localStorage
        const license = localStorage.getItem("hourflow_license");

        if (!license) {
            console.log("Geen licentiesleutel gevonden. Doorsturen naar licentiepagina.");
            // Reset redirect teller als we handmatig naar de app navigeren zonder licentie
            sessionStorage.removeItem('license_redirect_count');
            window.location.href = "/license.html";
            return false;
        }
        
        // Valideer de licentie via de API
        try {
            const response = await fetch('/api/verify-license', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ licenseKey: license })
            });
            
            if (!response.ok) {
                throw new Error(`API fout: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.valid) {
                console.log("Licentiesleutel geverifieerd, toegang toegestaan");
                return true;
            } else {
                console.log("Ongeldige licentiesleutel. Doorsturen naar licentiepagina.");
                localStorage.removeItem("hourflow_license");
                window.location.href = "/license.html";
                return false;
            }
        } catch (error) {
            console.error("Fout bij licentievalidatie:", error);
            
            // Fallback validatie als API niet beschikbaar is
            const testKeys = ['DEMO-KEY-1234', 'TEST-KEY-5678'];
            const isValidFormat = license.length >= 8 || testKeys.includes(license);
            
            if (isValidFormat) {
                console.log("Licentie lokaal gevalideerd, toegang toegestaan");
                return true;
            } else {
                console.log("Ongeldige licentiesleutel. Doorsturen naar licentiepagina.");
                localStorage.removeItem("hourflow_license");
                window.location.href = "/license.html";
                return false;
            }
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
                
                // Update dropdowns based on target section
                if (targetId === '#projects-section') {
                    console.log('Navigating to Projects tab, updating client dropdowns');
                    this.updateClientDropdowns();
                } else if (targetId === '#time-tracker-section') {
                    console.log('Navigating to Time Tracker tab, updating project and client dropdowns');
                    this.updateProjectDropdowns();
                    this.updateClientDropdowns();
                } else if (targetId === '#quotes-section') {
                    console.log('Navigating to Quotes tab, updating client and project dropdowns');
                    this.updateClientDropdowns();
                    this.updateProjectDropdowns();
                    
                    // Direct quotes renderen bij navigatie naar quotes tab
                    if (window.quoteGenerator && typeof quoteGenerator.renderQuotes === 'function') {
                        console.log('Directly rendering quotes when navigating to quotes tab');
                        quoteGenerator.renderQuotes();
                    }
                } else if (targetId === '#invoices-section') {
                    console.log('Navigating to Invoices tab, updating client and project dropdowns');
                    this.updateClientDropdowns();
                    this.updateProjectDropdowns();
                    
                    // Direct invoices renderen bij navigatie naar invoices tab
                    if (window.invoiceGenerator && typeof invoiceGenerator.renderInvoices === 'function') {
                        console.log('Directly rendering invoices when navigating to invoices tab');
                        invoiceGenerator.renderInvoices();
                    }
                }

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
        try {
            // Load clients
            try {
                const clients = JSON.parse(localStorage.getItem('clients') || '[]');
                this.state.clients = Array.isArray(clients) ? clients : [];
                console.log('Loaded', this.state.clients.length, 'clients');
                // Zorg ervoor dat clients altijd in localStorage staan
                localStorage.setItem('clients', JSON.stringify(this.state.clients));
            } catch (e) {
                console.error('Error loading clients:', e);
                this.state.clients = [];
                localStorage.setItem('clients', '[]');
            }
            
            // Load projects
            try {
                const projects = JSON.parse(localStorage.getItem('projects') || '[]');
                this.state.projects = Array.isArray(projects) ? projects : [];
                console.log('Loaded', this.state.projects.length, 'projects');
                // Zorg ervoor dat projects altijd in localStorage staan
                localStorage.setItem('projects', JSON.stringify(this.state.projects));
            } catch (e) {
                console.error('Error loading projects:', e);
                this.state.projects = [];
                localStorage.setItem('projects', '[]');
            }
            
            // Load time entries
            try {
                const timeEntries = JSON.parse(localStorage.getItem('timeEntries') || '[]');
                this.state.timeEntries = Array.isArray(timeEntries) ? timeEntries : [];
                console.log('Loaded', this.state.timeEntries.length, 'time entries');
                // Zorg ervoor dat timeEntries altijd in localStorage staan
                localStorage.setItem('timeEntries', JSON.stringify(this.state.timeEntries));
            } catch (e) {
                console.error('Error loading time entries:', e);
                this.state.timeEntries = [];
                localStorage.setItem('timeEntries', '[]');
            }
            
            // Load quotes
            try {
                const quotes = JSON.parse(localStorage.getItem('quotes') || '[]');
                this.state.quotes = Array.isArray(quotes) ? quotes : [];
                console.log('Loaded', this.state.quotes.length, 'quotes');
                // Zorg ervoor dat quotes altijd in localStorage staan
                localStorage.setItem('quotes', JSON.stringify(this.state.quotes));
            } catch (e) {
                console.error('Error loading quotes:', e);
                this.state.quotes = [];
                localStorage.setItem('quotes', '[]');
            }
            
            // Load invoices
            try {
                const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
                this.state.invoices = Array.isArray(invoices) ? invoices : [];
                console.log('Loaded', this.state.invoices.length, 'invoices');
                // Zorg ervoor dat invoices altijd in localStorage staan
                localStorage.setItem('invoices', JSON.stringify(this.state.invoices));
            } catch (e) {
                console.error('Error loading invoices:', e);
                this.state.invoices = [];
                localStorage.setItem('invoices', '[]');
            }
            
            // Load settings
            try {
                const settings = JSON.parse(localStorage.getItem('settings') || '{}');
                this.state.settings = settings && typeof settings === 'object' ? settings : {
                    businessName: '',
                    businessEmail: '',
                    businessAddress: '',
                    businessPhone: '',
                    taxRate: 0,
                    hourlyRate: 50
                };
                console.log('Loaded settings');
                // Zorg ervoor dat settings altijd in localStorage staan
                localStorage.setItem('settings', JSON.stringify(this.state.settings));
            } catch (e) {
                console.error('Error loading settings:', e);
                this.state.settings = {
                    businessName: '',
                    businessEmail: '',
                    businessAddress: '',
                    businessPhone: '',
                    taxRate: 0,
                    hourlyRate: 50
                };
                localStorage.setItem('settings', JSON.stringify(this.state.settings));
            }
            
            // Update all dropdowns
            this.updateAllDropdowns();
        } catch (e) {
            console.error('Error loading data:', e);
        }
    },
    
    // Update all dropdowns in the application
    updateAllDropdowns: function() {
        console.log('Updating all dropdowns');
        
        // Update client dropdowns
        this.updateClientDropdowns();
        
        // Update project dropdowns
        this.updateProjectDropdowns();
    },
    
    // Update all client dropdowns
    updateClientDropdowns: function() {
        console.log('Updating client dropdowns');
        
        // Find all client dropdowns
        const clientDropdowns = document.querySelectorAll('select[name="client"], select.client-select');
        
        if (clientDropdowns.length === 0) {
            console.log('No client dropdowns found');
            return;
        }
        
        console.log('Found', clientDropdowns.length, 'client dropdowns');
        
        // Update each dropdown
        clientDropdowns.forEach(dropdown => {
            // Save current selection
            const currentValue = dropdown.value;
            
            // Clear options except first (placeholder)
            const firstOption = dropdown.querySelector('option:first-child');
            dropdown.innerHTML = '';
            
            if (firstOption) {
                dropdown.appendChild(firstOption);
            }
            
            // Add clients
            this.state.clients.forEach(client => {
                if (!client || !client.id || !client.name) return; // Skip invalid clients
                
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.name;
                dropdown.appendChild(option);
            });
            
            // Restore selection if possible
            if (currentValue && dropdown.querySelector(`option[value="${currentValue}"]`)) {
                dropdown.value = currentValue;
            }
        });
    },
    
    // Update all project dropdowns
    updateProjectDropdowns: function() {
        console.log('Updating project dropdowns');
        
        // Find all project dropdowns
        const projectDropdowns = document.querySelectorAll('select[name="project"], select.project-select');
        
        if (projectDropdowns.length === 0) {
            console.log('No project dropdowns found');
            return;
        }
        
        console.log('Found', projectDropdowns.length, 'project dropdowns');
        
        // Update each dropdown
        projectDropdowns.forEach(dropdown => {
            // Save current selection
            const currentValue = dropdown.value;
            
            // Clear options except first (placeholder)
            const firstOption = dropdown.querySelector('option:first-child');
            dropdown.innerHTML = '';
            
            if (firstOption) {
                dropdown.appendChild(firstOption);
            }
            
            // Add projects
            this.state.projects.forEach(project => {
                if (!project || !project.id || !project.name) return; // Skip invalid projects
                
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                dropdown.appendChild(option);
            });
            
            // Restore selection if possible
            if (currentValue && dropdown.querySelector(`option[value="${currentValue}"]`)) {
                dropdown.value = currentValue;
            }
        });
    },

    // Save data to localStorage
    saveData: function(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
        console.log('Saved data:', key, data.length || 'object');
        
        // Update all dropdowns after saving to ensure real-time updates
        this.updateAllDropdowns(key);
    },
    
    // Update all dropdowns in the application
    updateAllDropdowns: function(changedDataType) {
        console.log('Updating all dropdowns after change in:', changedDataType);
        
        // Update client dropdowns if clients were changed or if requested to update all
        if (changedDataType === 'clients' || changedDataType === 'all') {
            this.updateClientDropdowns();
            
            // If we have the clients.js module loaded, use its more comprehensive update function
            if (window.clientManager && typeof clientManager.updateAllClientDropdowns === 'function') {
                clientManager.updateAllClientDropdowns();
            }
        }
        
        // Update project dropdowns if projects were changed or if requested to update all
        if (changedDataType === 'projects' || changedDataType === 'all') {
            this.updateProjectDropdowns();
            
            // If we have the projects.js module loaded, use its more comprehensive update function
            if (window.projectManager && typeof projectManager.updateProjectSelects === 'function') {
                projectManager.updateProjectSelects();
            }
        }
        
        // Update time entries related dropdowns if needed
        if (changedDataType === 'timeEntries' || changedDataType === 'all') {
            if (window.timeTracker && typeof timeTracker.populateProjectSelect === 'function') {
                timeTracker.populateProjectSelect();
            }
        }
        
        // Update quotes related dropdowns if needed
        if (changedDataType === 'quotes' || changedDataType === 'all') {
            if (window.quoteGenerator && typeof quoteGenerator.populateClientSelect === 'function') {
                quoteGenerator.populateClientSelect();
            }
            if (window.quoteGenerator && typeof quoteGenerator.populateProjectSelect === 'function') {
                quoteGenerator.populateProjectSelect();
            }
        }
        
        // Update invoices related dropdowns if needed
        if (changedDataType === 'invoices' || changedDataType === 'all') {
            if (window.invoiceGenerator && typeof invoiceGenerator.populateClientSelect === 'function') {
                invoiceGenerator.populateClientSelect();
            }
            if (window.invoiceGenerator && typeof invoiceGenerator.populateProjectSelect === 'function') {
                invoiceGenerator.populateProjectSelect();
            }
        }
        
        // Update dashboard stats
        if (window.clientManager && typeof clientManager.updateDashboardStats === 'function') {
            clientManager.updateDashboardStats();
        }
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
    
    // Initialize logout functionality
    initLogout: function() {
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                // Check if Firebase is available
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    // Sign out from Firebase
                    firebase.auth().signOut().then(() => {
                        console.log('User signed out successfully');
                        // Clear user data from localStorage
                        localStorage.removeItem('currentUser');
                        // Redirect to login page
                        window.location.href = 'login.html';
                    }).catch((error) => {
                        console.error('Error signing out:', error);
                        showNotification('Error signing out. Please try again.', 'error');
                    });
                } else {
                    console.log('Firebase not available, redirecting to login page');
                    // Redirect to login page anyway
                    window.location.href = 'login.html';
                }
            });
        }
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
