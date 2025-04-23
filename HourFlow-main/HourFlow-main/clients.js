// Clients functionality
const clientManager = {
    // Initialize client manager
    init: function() {
        // Initialize client form
        this.initClientForm();
        
        // Render clients
        this.renderClients();
        
        // Initialize clear all button
        this.initClearAllButton();
    },
    
    // Initialize client form
    initClientForm: function() {
        const form = document.getElementById('client-form');
        const addButton = document.getElementById('add-client-btn');
        const closeButton = document.querySelector('.close-client-form');
        const clientForm = document.querySelector('.client-form');
        
        // Show form when add button is clicked
        addButton.addEventListener('click', () => {
            clientForm.style.display = 'block';
            form.removeAttribute('data-edit-id');
            form.reset();
        });
        
        // Hide form when close button is clicked
        closeButton.addEventListener('click', () => {
            clientForm.style.display = 'none';
        });
        
        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('client-name').value;
            const contact = document.getElementById('client-contact').value;
            const email = document.getElementById('client-email').value;
            const phone = document.getElementById('client-phone').value;
            const address = document.getElementById('client-address').value;
            
            // Check if editing existing client
            const editId = form.getAttribute('data-edit-id');
            
            if (editId) {
                // Find client index
                const index = app.state.clients.findIndex(client => client.id === editId);
                
                if (index !== -1) {
                    // Update client
                    app.state.clients[index] = {
                        id: editId,
                        name,
                        contact,
                        email,
                        phone,
                        address,
                        timestamp: app.state.clients[index].timestamp
                    };
                    
                    showNotification('Client updated successfully');
                }
            } else {
                // Create new client
                const newClient = {
                    id: app.generateId(),
                    name,
                    contact,
                    email,
                    phone,
                    address,
                    timestamp: new Date().getTime()
                };
                
                // Add to clients
                app.state.clients.push(newClient);
                
                showNotification('Client added successfully');
            }
            
            // Save to localStorage
            app.saveData('clients', app.state.clients);
            
            // Reset form
            form.reset();
            
            // Hide form
            clientForm.style.display = 'none';
            
            // Re-render clients
            this.renderClients();
            
            // Update dashboard stats
            app.updateDashboardStats();
            
            // Update client selects in other forms
            this.updateClientSelects();
        });
    },
    
    // Render clients
    renderClients: function() {
        const tableBody = document.querySelector('#clients-table tbody');
        tableBody.innerHTML = '';
        
        if (app.state.clients.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" class="text-center">No clients found</td>`;
            tableBody.appendChild(row);
            return;
        }
        
        // Sort by name (alphabetically)
        const sortedClients = [...app.state.clients].sort((a, b) => a.name.localeCompare(b.name));
        
        sortedClients.forEach(client => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${client.name}</td>
                <td>${client.contact || '-'}</td>
                <td>${client.email || '-'}</td>
                <td>${client.phone || '-'}</td>
                <td>
                    <button class="btn-icon edit-client" data-id="${client.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-client" data-id="${client.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners
        this.addClientEventListeners();
    },
    
    // Add client event listeners
    addClientEventListeners: function() {
        const editButtons = document.querySelectorAll('.edit-client');
        const deleteButtons = document.querySelectorAll('.delete-client');
        
        // Edit buttons
        editButtons.forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                this.editClient(id);
            });
        });
        
        // Delete buttons
        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                this.deleteClient(id);
            });
        });
    },
    
    // Edit client
    editClient: function(id) {
        // Find client
        const client = app.state.clients.find(client => client.id === id);
        
        if (!client) {
            showNotification('Client not found', 'error');
            return;
        }
        
        // Get form
        const form = document.getElementById('client-form');
        const clientForm = document.querySelector('.client-form');
        
        // Set form values
        form.setAttribute('data-edit-id', id);
        document.getElementById('client-name').value = client.name;
        document.getElementById('client-contact').value = client.contact || '';
        document.getElementById('client-email').value = client.email || '';
        document.getElementById('client-phone').value = client.phone || '';
        document.getElementById('client-address').value = client.address || '';
        
        // Show form
        clientForm.style.display = 'block';
    },
    
    // Delete client
    deleteClient: function(id) {
        // Check if client is used in projects
        const clientProjects = app.state.projects.filter(project => project.client === id);
        
        // Find client index
        const index = app.state.clients.findIndex(client => client.id === id);
        
        if (index === -1) {
            showNotification('Client not found', 'error');
            return;
        }
        
        // Get client name for better confirmation message
        const clientName = app.state.clients[index].name;
        
        // Confirm delete with appropriate message
        let confirmMessage = `Weet je zeker dat je klant "${clientName}" wilt verwijderen?`;
        
        if (clientProjects.length > 0) {
            confirmMessage = `Klant "${clientName}" wordt gebruikt in ${clientProjects.length} project(en). Als je deze klant verwijdert, worden ook alle bijbehorende projecten verwijderd. Weet je zeker dat je door wilt gaan?`;
        }
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // If there are related projects, delete them first
        if (clientProjects.length > 0) {
            // Get project IDs
            const projectIds = clientProjects.map(project => project.id);
            
            // Check if any projects are used in time entries
            const relatedTimeEntries = app.state.timeEntries.filter(entry => projectIds.includes(entry.project));
            
            // Delete related time entries if any
            if (relatedTimeEntries.length > 0) {
                // Filter out time entries related to the projects
                app.state.timeEntries = app.state.timeEntries.filter(entry => !projectIds.includes(entry.project));
                
                // Save time entries
                app.saveData('time_entries', app.state.timeEntries);
            }
            
            // Remove projects
            app.state.projects = app.state.projects.filter(project => project.client !== id);
            
            // Save projects
            app.saveData('projects', app.state.projects);
        }
        
        // Remove client
        app.state.clients.splice(index, 1);
        
        // Save to localStorage
        app.saveData('clients', app.state.clients);
        
        // Re-render clients
        this.renderClients();
        
        // Update dashboard stats
        app.updateDashboardStats();
        
        // Update client selects in other forms
        this.updateClientSelects();
        
        // Show notification
        showNotification('Client deleted successfully');
    },
    
    // Initialize clear all button
    initClearAllButton: function() {
        const clearAllBtn = document.getElementById('clear-all-clients');
        
        clearAllBtn.addEventListener('click', () => {
            // Check if there are related projects
            const hasProjects = app.state.projects.length > 0;
            
            // Create appropriate confirmation message
            let confirmMessage = 'Weet je zeker dat je alle klanten wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.';
            
            if (hasProjects) {
                confirmMessage = 'Als je alle klanten verwijdert, worden ook alle projecten en bijbehorende tijdregistraties verwijderd. Weet je zeker dat je door wilt gaan?';
            }
            
            // Confirm delete
            if (!confirm(confirmMessage)) {
                return;
            }
            
            // If there are related projects, delete them first
            if (hasProjects) {
                // Check if any projects are used in time entries
                const hasTimeEntries = app.state.timeEntries.length > 0;
                
                // Clear time entries if any
                if (hasTimeEntries) {
                    app.state.timeEntries = [];
                    app.saveData('time_entries', app.state.timeEntries);
                }
                
                // Clear projects
                app.state.projects = [];
                app.saveData('projects', app.state.projects);
            }
            
            // Clear clients
            app.state.clients = [];
            
            // Save to localStorage
            app.saveData('clients', app.state.clients);
            
            // Re-render clients
            this.renderClients();
            
            // Update dashboard stats
            app.updateDashboardStats();
            
            // Update client selects in other forms
            this.updateClientSelects();
            
            // Show notification
            showNotification('Alle klanten succesvol verwijderd');
        });
    },
    
    // Update client selects in other forms
    updateClientSelects: function() {
        // Update project client select
        const projectClientSelect = document.getElementById('project-client');
        if (projectClientSelect) {
            const currentValue = projectClientSelect.value;
            
            // Clear options except first
            while (projectClientSelect.options.length > 1) {
                projectClientSelect.remove(1);
            }
            
            // Add clients
            app.state.clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.name;
                projectClientSelect.appendChild(option);
            });
            
            // Restore selected value if possible
            if (currentValue && projectClientSelect.querySelector(`option[value="${currentValue}"]`)) {
                projectClientSelect.value = currentValue;
            }
        }
        
        // Update quote client select
        const quoteClientSelect = document.getElementById('quote-client-select');
        if (quoteClientSelect) {
            const currentValue = quoteClientSelect.value;
            
            // Clear options except first
            while (quoteClientSelect.options.length > 1) {
                quoteClientSelect.remove(1);
            }
            
            // Add clients
            app.state.clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.name;
                quoteClientSelect.appendChild(option);
            });
            
            // Restore selected value if possible
            if (currentValue && quoteClientSelect.querySelector(`option[value="${currentValue}"]`)) {
                quoteClientSelect.value = currentValue;
            }
        }
        
        // Update invoice client select
        const invoiceClientSelect = document.getElementById('invoice-client-select');
        if (invoiceClientSelect) {
            const currentValue = invoiceClientSelect.value;
            
            // Clear options except first
            while (invoiceClientSelect.options.length > 1) {
                invoiceClientSelect.remove(1);
            }
            
            // Add clients
            app.state.clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.name;
                invoiceClientSelect.appendChild(option);
            });
            
            // Restore selected value if possible
            if (currentValue && invoiceClientSelect.querySelector(`option[value="${currentValue}"]`)) {
                invoiceClientSelect.value = currentValue;
            }
        }
    }
};

// Initialize client manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    clientManager.init();
});
