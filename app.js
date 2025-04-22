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
    init: function() {
        // Initialize navigation
        this.initNavigation();
        
        // Load data
        this.loadData();
        
        // Initialize notification system
        this.initNotifications();
        
        // Update dashboard stats
        this.updateDashboardStats();
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
        // Load clients
        const clients = localStorage.getItem('hourflow_clients');
        if (clients) {
            this.state.clients = JSON.parse(clients);
        }
        
        // Load projects
        const projects = localStorage.getItem('hourflow_projects');
        if (projects) {
            this.state.projects = JSON.parse(projects);
        }
        
        // Load time entries
        const timeEntries = localStorage.getItem('hourflow_time_entries');
        if (timeEntries) {
            this.state.timeEntries = JSON.parse(timeEntries);
        }
        
        // Load quotes
        const quotes = localStorage.getItem('hourflow_quotes');
        if (quotes) {
            this.state.quotes = JSON.parse(quotes);
        }
        
        // Load invoices
        const invoices = localStorage.getItem('hourflow_invoices');
        if (invoices) {
            this.state.invoices = JSON.parse(invoices);
        }
        
        // Load settings
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
        // Update total hours
        const totalHours = this.state.timeEntries.reduce((total, entry) => total + parseFloat(entry.hours), 0);
        document.getElementById('total-hours').textContent = totalHours.toFixed(2);
        
        // Update total clients
        document.getElementById('total-clients').textContent = this.state.clients.length;
        
        // Update total quotes
        document.getElementById('total-quotes').textContent = this.state.quotes.length;
        
        // Update total invoices
        document.getElementById('total-invoices').textContent = this.state.invoices.length;
        
        // Update recent time entries
        this.updateRecentTimeEntries();
    },
    
    // Update recent time entries
    updateRecentTimeEntries: function() {
        const tableBody = document.querySelector('#recent-time-entries tbody');
        tableBody.innerHTML = '';
        
        // Sort by date (newest first) and take top 5
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
            
            // Format date
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
    
    // Get client by ID
    getClientById: function(id) {
        return this.state.clients.find(client => client.id === id);
    },
    
    // Get client name by ID
    getClientNameById: function(id) {
        const client = this.getClientById(id);
        return client ? client.name : 'Unknown Client';
    },
    
    // Get project by ID
    getProjectById: function(id) {
        return this.state.projects.find(project => project.id === id);
    },
    
    // Get project name by ID
    getProjectNameById: function(id) {
        const project = this.getProjectById(id);
        return project ? project.name : 'Unknown Project';
    },
    
    // Get project rate by ID
    getProjectRateById: function(id) {
        const project = this.getProjectById(id);
        return project && project.rate ? parseFloat(project.rate) : this.state.settings.hourlyRate;
    }
};

// Show notification
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

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    app.init();
    
    // Show welcome message
    showNotification('Welcome to HourFlow Premium!');
});
