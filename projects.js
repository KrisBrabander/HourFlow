// Projects functionality
const projectManager = {
    // Initialize project manager
    init: function() {
        console.log('Initializing project manager');
        
        // Force reload projects from localStorage
        this.forceReloadProjects();
        
        // Initialize project form
        this.initProjectForm();
        
        // Render projects
        this.renderProjects();
        
        // Initialize clear all button
        this.initClearAllButton();
    },
    
    // Force reload projects from localStorage
    forceReloadProjects: function() {
        console.log('Force reloading projects from localStorage');
        try {
            // Get projects from localStorage
            const projects = JSON.parse(localStorage.getItem('projects') || '[]');
            
            // Update app.state
            if (window.app && app.state) {
                app.state.projects = Array.isArray(projects) ? projects : [];
                console.log('Loaded', app.state.projects.length, 'projects from localStorage');
            }
        } catch (e) {
            console.error('Error loading projects from localStorage:', e);
            if (window.app && app.state) {
                app.state.projects = [];
            }
        }
    },
    
    // Initialize project form
    initProjectForm: function() {
        const form = document.getElementById('project-form');
        const addButton = document.getElementById('add-project-btn');
        const closeButton = document.querySelector('.close-project-form');
        const projectForm = document.querySelector('.project-form');
        
        // Show form when add button is clicked
        addButton.addEventListener('click', () => {
            projectForm.style.display = 'block';
            form.removeAttribute('data-edit-id');
            form.reset();
            
            // Populate client select
            this.populateClientSelect();
        });
        
        // Hide form when close button is clicked
        closeButton.addEventListener('click', () => {
            projectForm.style.display = 'none';
        });
        
        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('project-name').value;
            const client = document.getElementById('project-client').value;
            const rate = parseFloat(document.getElementById('project-rate').value) || app.state.settings.hourlyRate;
            const status = document.getElementById('project-status').value;
            const description = document.getElementById('project-description').value;
            
            // Check if editing existing project
            const editId = form.getAttribute('data-edit-id');
            
            if (editId) {
                // Find project index
                const index = app.state.projects.findIndex(project => project.id === editId);
                
                if (index !== -1) {
                    // Update project
                    app.state.projects[index] = {
                        id: editId,
                        name,
                        client,
                        rate,
                        status,
                        description,
                        timestamp: app.state.projects[index].timestamp
                    };
                    
                    showNotification('Project updated successfully');
                }
            } else {
                // Create new project
                const newProject = {
                    id: app.generateId(),
                    name,
                    client,
                    rate,
                    status,
                    description,
                    timestamp: new Date().getTime()
                };
                
                // Add to projects
                app.state.projects.push(newProject);
                
                showNotification('Project added successfully');
            }
            
            // Save to localStorage
            app.saveData('projects', app.state.projects);
            
            // Ook direct in localStorage opslaan voor zekerheid
            try {
                localStorage.setItem('projects', JSON.stringify(app.state.projects));
                console.log('Projects saved directly to localStorage:', app.state.projects.length);
            } catch (e) {
                console.error('Error saving projects directly to localStorage:', e);
            }
            
            // Update all dropdowns in the application via central function
            if (window.app && typeof app.updateAllDropdowns === 'function') {
                app.updateAllDropdowns('projects');
                console.log('All dropdowns updated after project change');
            } else {
                // Fallback to just updating project selects
                this.updateProjectSelects();
            }
            
            // Render projects
            this.renderProjects();
            
            // Hide form
            document.querySelector('.project-form').style.display = 'none';
            
            // Reset form
            form.reset();
            form.removeAttribute('data-edit-id');
            
            // Update project selects in other forms
            this.updateProjectSelects();
            
            // Update project dropdowns in time-tracker
            if (window.timeTracker && typeof timeTracker.populateProjectSelect === 'function') {
                console.log('Updating time-tracker project dropdown');
                timeTracker.populateProjectSelect();
            }
        });
    },
    
    // Populate client select
    populateClientSelect: function() {
        const clientSelect = document.getElementById('project-client');
        const currentValue = clientSelect.value;
        
        // Clear options except first
        while (clientSelect.options.length > 1) {
            clientSelect.remove(1);
        }
        
        // Get clients from localStorage directly
        let clients = [];
        try {
            clients = JSON.parse(localStorage.getItem('clients') || '[]');
            if (!Array.isArray(clients)) clients = [];
            
            // Also update app.state.clients for consistency
            if (window.app && app.state) {
                app.state.clients = clients;
                console.log('Projects: app.state.clients bijgewerkt vanuit localStorage');
            }
        } catch (e) {
            console.error('Error parsing clients from localStorage:', e);
            clients = [];
        }
        
        // Add clients
        clients.forEach(client => {
            if (!client || !client.id || !client.name) return; // Skip invalid clients
            
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            clientSelect.appendChild(option);
        });
        
        // Restore selected value if possible
        if (currentValue && clientSelect.querySelector(`option[value="${currentValue}"]`)) {
            clientSelect.value = currentValue;
        }
        
        console.log('Client dropdown bijgewerkt met', clientSelect.options.length - 1, 'clients');
    },
    
    // Calculate total hours for a project
    calculateProjectHours: function(projectId) {
        console.log('Calculating hours for project:', projectId);
        let totalHours = 0;
        
        try {
            // Get time entries directly from localStorage
            const timeEntries = JSON.parse(localStorage.getItem('timeEntries') || '[]');
            
            if (Array.isArray(timeEntries)) {
                // Filter entries for this project and sum hours
                const projectEntries = timeEntries.filter(entry => entry.project === projectId);
                totalHours = projectEntries.reduce((sum, entry) => sum + parseFloat(entry.hours || 0), 0);
                console.log(`Project ${projectId} has ${projectEntries.length} entries totaling ${totalHours} hours`);
            }
        } catch (e) {
            console.error('Error calculating project hours:', e);
        }
        
        return totalHours;
    },
    
    // Render projects
    renderProjects: function() {
        console.log('Rendering projects');
        const tableBody = document.querySelector('#projects-table tbody');
        if (!tableBody) {
            console.error('Projects table body not found');
            return;
        }
        
        // Update table header to include hours column
        const tableHeader = document.querySelector('#projects-table thead tr');
        if (tableHeader && !tableHeader.querySelector('th[data-column="hours"]')) {
            // Add hours column if it doesn't exist
            const rateColumn = tableHeader.querySelector('th[data-column="rate"]');
            if (rateColumn) {
                const hoursHeader = document.createElement('th');
                hoursHeader.setAttribute('data-column', 'hours');
                hoursHeader.textContent = 'Total Hours';
                tableHeader.insertBefore(hoursHeader, rateColumn.nextSibling);
            }
        }
        
        tableBody.innerHTML = '';
        
        // Get projects directly from localStorage
        let projects = [];
        try {
            projects = JSON.parse(localStorage.getItem('projects') || '[]');
            if (!Array.isArray(projects)) {
                projects = [];
            }
            
            // Also update app.state
            if (window.app && app.state) {
                app.state.projects = projects;
                console.log('Updated app.state.projects with', projects.length, 'projects from localStorage');
            }
        } catch (e) {
            console.error('Error loading projects from localStorage:', e);
            projects = [];
        }
        
        if (projects.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="6" class="text-center">No projects found</td>`;
            tableBody.appendChild(row);
            return;
        }
        
        // Sort by name (alphabetically)
        const sortedProjects = [...projects].sort((a, b) => a.name.localeCompare(b.name));
        console.log('Sorted projects:', sortedProjects.length);
        
        sortedProjects.forEach(project => {
            const row = document.createElement('tr');
            
            // Get client name directly from localStorage
            let clientName = 'Unknown Client';
            try {
                const clients = JSON.parse(localStorage.getItem('clients') || '[]');
                if (Array.isArray(clients)) {
                    const client = clients.find(c => c.id === project.client);
                    if (client && client.name) {
                        clientName = client.name;
                    }
                }
            } catch (e) {
                console.error('Error getting client name for project:', e);
            }
            
            // Calculate total hours for this project
            const totalHours = this.calculateProjectHours(project.id);
            
            // Format status
            const statusClass = `status-${project.status}`;
            const statusText = project.status.charAt(0).toUpperCase() + project.status.slice(1);
            
            row.innerHTML = `
                <td>${project.name}</td>
                <td>${clientName}</td>
                <td>${app.formatCurrency(project.rate)}/hr</td>
                <td>
                    <div class="hours-info">
                        <span class="total-hours">${totalHours.toFixed(2)}</span>
                        <button class="btn-icon view-hours" data-id="${project.id}" title="View time entries">
                            <i class="fas fa-clock"></i>
                        </button>
                    </div>
                </td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn-icon edit-project" data-id="${project.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-project" data-id="${project.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners
        this.addProjectEventListeners();
    },
    
    // Add project event listeners
    addProjectEventListeners: function() {
        const editButtons = document.querySelectorAll('.edit-project');
        const deleteButtons = document.querySelectorAll('.delete-project');
        const viewHoursButtons = document.querySelectorAll('.view-hours');
        
        // Edit buttons
        editButtons.forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                this.editProject(id);
            });
        });
        
        // Delete buttons
        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                this.deleteProject(id);
            });
        });
        
        // View hours buttons
        viewHoursButtons.forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                this.viewProjectTimeEntries(id);
            });
        });
        
        // Close modal button
        const closeModalBtn = document.querySelector('#project-time-entries-modal .close-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                document.getElementById('project-time-entries-modal').style.display = 'none';
            });
        }
    },
    
    // View project time entries
    viewProjectTimeEntries: function(projectId) {
        console.log('Viewing time entries for project:', projectId);
        
        // Find project
        const project = app.state.projects.find(p => p.id === projectId);
        if (!project) {
            showNotification('Project not found', 'error');
            return;
        }
        
        // Get client name
        let clientName = 'Unknown Client';
        try {
            const clients = JSON.parse(localStorage.getItem('clients') || '[]');
            const client = clients.find(c => c.id === project.client);
            if (client && client.name) {
                clientName = client.name;
            }
        } catch (e) {
            console.error('Error getting client name:', e);
        }
        
        // Get time entries for this project
        let timeEntries = [];
        try {
            timeEntries = JSON.parse(localStorage.getItem('timeEntries') || '[]');
            timeEntries = timeEntries.filter(entry => entry.project === projectId);
        } catch (e) {
            console.error('Error getting time entries:', e);
            timeEntries = [];
        }
        
        // Calculate total hours and value
        const totalHours = timeEntries.reduce((sum, entry) => sum + parseFloat(entry.hours || 0), 0);
        const totalValue = totalHours * parseFloat(project.rate || 0);
        
        // Update modal content
        document.getElementById('modal-project-name').textContent = project.name;
        document.getElementById('modal-client-name').textContent = clientName;
        document.getElementById('modal-total-hours').textContent = totalHours.toFixed(2);
        document.getElementById('modal-total-value').textContent = app.formatCurrency(totalValue);
        
        // Render time entries in table
        const tableBody = document.querySelector('#project-time-entries-table tbody');
        tableBody.innerHTML = '';
        
        if (timeEntries.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" class="text-center">No time entries found for this project</td>`;
            tableBody.appendChild(row);
        } else {
            // Sort by date (newest first)
            const sortedEntries = [...timeEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            sortedEntries.forEach(entry => {
                const row = document.createElement('tr');
                const entryValue = parseFloat(entry.hours || 0) * parseFloat(project.rate || 0);
                
                row.innerHTML = `
                    <td>${new Date(entry.date).toLocaleDateString()}</td>
                    <td>${entry.description || 'No description'}</td>
                    <td>${parseFloat(entry.hours).toFixed(2)}</td>
                    <td>${entry.billable === 'yes' ? 'Yes' : 'No'}</td>
                    <td>${app.formatCurrency(entryValue)}</td>
                `;
                
                tableBody.appendChild(row);
            });
        }
        
        // Show modal
        document.getElementById('project-time-entries-modal').style.display = 'block';
    },
    
    // Edit project
    editProject: function(id) {
        // Find project
        const project = app.state.projects.find(project => project.id === id);
        
        if (!project) {
            showNotification('Project not found', 'error');
            return;
        }
        
        // Get form
        const form = document.getElementById('project-form');
        const projectForm = document.querySelector('.project-form');
        
        // Populate client select
        this.populateClientSelect();
        
        // Set form values
        form.setAttribute('data-edit-id', id);
        document.getElementById('project-name').value = project.name;
        document.getElementById('project-client').value = project.client;
        document.getElementById('project-rate').value = project.rate;
        document.getElementById('project-status').value = project.status;
        document.getElementById('project-description').value = project.description || '';
        
        // Show form
        projectForm.style.display = 'block';
    },
    
    // Delete project
    deleteProject: function(id) {
        // Find project index
        const index = app.state.projects.findIndex(project => project.id === id);
        
        if (index === -1) {
            showNotification('Project not found', 'error');
            return;
        }
        
        // Get project name for better confirmation message
        const projectName = app.state.projects[index].name;
        
        // Check if project is used in time entries
        const projectTimeEntries = app.state.timeEntries.filter(entry => entry.project === id);
        
        // Create appropriate confirmation message
        let confirmMessage = `Weet je zeker dat je project "${projectName}" wilt verwijderen?`;
        
        if (projectTimeEntries.length > 0) {
            confirmMessage = `Project "${projectName}" wordt gebruikt in ${projectTimeEntries.length} tijdregistratie(s). Als je dit project verwijdert, worden ook alle bijbehorende tijdregistraties verwijderd. Weet je zeker dat je door wilt gaan?`;
        }
        
        // Confirm delete
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // If there are related time entries, delete them first
        if (projectTimeEntries.length > 0) {
            // Remove time entries for this project
            app.state.timeEntries = app.state.timeEntries.filter(entry => entry.project !== id);
            
            // Save time entries
            app.saveData('timeEntries', app.state.timeEntries);
            
            // Ook direct in localStorage opslaan voor zekerheid
            try {
                localStorage.setItem('timeEntries', JSON.stringify(app.state.timeEntries));
                console.log('Time entries saved directly to localStorage after project delete');
            } catch (e) {
                console.error('Error saving time entries to localStorage:', e);
            }
        }
        
        // Remove project
        app.state.projects.splice(index, 1);
        
        // Save to localStorage
        app.saveData('projects', app.state.projects);
        
        // Ook direct in localStorage opslaan voor zekerheid
        try {
            localStorage.setItem('projects', JSON.stringify(app.state.projects));
            console.log('Projects saved directly to localStorage after delete');
        } catch (e) {
            console.error('Error saving projects to localStorage:', e);
        }
        
        // Update all dropdowns in the application via central function
        if (window.app && typeof app.updateAllDropdowns === 'function') {
            app.updateAllDropdowns('projects');
            console.log('All dropdowns updated after project deletion');
        } else {
            // Fallback to individual updates
            this.forceReloadProjects();
            this.updateProjectSelects();
            
            // Update project dropdowns in time-tracker
            if (window.timeTracker && typeof timeTracker.populateProjectSelect === 'function') {
                console.log('Updating time-tracker project dropdown after delete');
                timeTracker.populateProjectSelect();
            }
        }
        
        // Re-render projects
        this.renderProjects();
        
        // Show notification
        showNotification('Project deleted successfully');
    },
    
    // Initialize clear all button
    initClearAllButton: function() {
        const clearAllBtn = document.getElementById('clear-all-projects');
        
        clearAllBtn.addEventListener('click', () => {
            // Check if there are related time entries
            const hasTimeEntries = app.state.timeEntries.length > 0;
            
            // Create appropriate confirmation message
            let confirmMessage = 'Weet je zeker dat je alle projecten wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.';
            
            if (hasTimeEntries) {
                confirmMessage = 'Als je alle projecten verwijdert, worden ook alle bijbehorende tijdregistraties verwijderd. Weet je zeker dat je door wilt gaan?';
            }
            
            // Confirm delete
            if (!confirm(confirmMessage)) {
                return;
            }
            
            // If there are related time entries, delete them first
            if (hasTimeEntries) {
                // Clear time entries
                app.state.timeEntries = [];
                app.saveData('time_entries', app.state.timeEntries);
            }
            
            // Clear projects
            app.state.projects = [];
            
            // Save to localStorage
            app.saveData('projects', app.state.projects);
            
            // Re-render projects
            this.renderProjects();
            
            // Update project selects in other forms
            this.updateProjectSelects();
            
            // Show notification
            showNotification('Alle projecten succesvol verwijderd');
        });
    },
    
    // Update project selects in other forms
    updateProjectSelects: function() {
        const projectSelects = document.querySelectorAll('select[name="project"], select.project-select');
        
        // Get projects from localStorage directly
        let projects = [];
        try {
            projects = JSON.parse(localStorage.getItem('projects') || '[]');
            if (!Array.isArray(projects)) projects = [];
            
            // Also update app.state.projects for consistency
            if (window.app && app.state) {
                app.state.projects = projects;
                console.log('Projects: app.state.projects bijgewerkt vanuit localStorage');
            }
        } catch (e) {
            console.error('Error parsing projects from localStorage:', e);
            // Fallback to app.state
            if (window.app && app.state && Array.isArray(app.state.projects)) {
                projects = app.state.projects;
            } else {
                projects = [];
            }
        }
        
        projectSelects.forEach(select => {
            const currentValue = select.value;
            
            // Clear options except first
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Add projects
            projects.forEach(project => {
                if (!project || !project.id || !project.name) return; // Skip invalid projects
                
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                select.appendChild(option);
            });
            
            // Restore selected value if possible
            if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
                select.value = currentValue;
            }
            
            console.log('Project dropdown bijgewerkt met', select.options.length - 1, 'projects');
        });
    }
};

// Initialize project manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    projectManager.init();
});
