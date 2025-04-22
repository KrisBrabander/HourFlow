// Projects functionality
const projectManager = {
    // Initialize project manager
    init: function() {
        // Initialize project form
        this.initProjectForm();
        
        // Render projects
        this.renderProjects();
        
        // Initialize clear all button
        this.initClearAllButton();
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
            
            // Reset form
            form.reset();
            
            // Hide form
            projectForm.style.display = 'none';
            
            // Re-render projects
            this.renderProjects();
            
            // Update project selects in other forms
            this.updateProjectSelects();
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
        
        // Add clients
        app.state.clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            clientSelect.appendChild(option);
        });
        
        // Restore selected value if possible
        if (currentValue && clientSelect.querySelector(`option[value="${currentValue}"]`)) {
            clientSelect.value = currentValue;
        }
    },
    
    // Render projects
    renderProjects: function() {
        const tableBody = document.querySelector('#projects-table tbody');
        tableBody.innerHTML = '';
        
        if (app.state.projects.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" class="text-center">No projects found</td>`;
            tableBody.appendChild(row);
            return;
        }
        
        // Sort by name (alphabetically)
        const sortedProjects = [...app.state.projects].sort((a, b) => a.name.localeCompare(b.name));
        
        sortedProjects.forEach(project => {
            const row = document.createElement('tr');
            
            // Get client name
            const clientName = app.getClientNameById(project.client);
            
            // Format status
            const statusClass = `status-${project.status}`;
            const statusText = project.status.charAt(0).toUpperCase() + project.status.slice(1);
            
            row.innerHTML = `
                <td>${project.name}</td>
                <td>${clientName}</td>
                <td>${app.formatCurrency(project.rate)}/hr</td>
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
            app.saveData('time_entries', app.state.timeEntries);
        }
        
        // Remove project
        app.state.projects.splice(index, 1);
        
        // Save to localStorage
        app.saveData('projects', app.state.projects);
        
        // Re-render projects
        this.renderProjects();
        
        // Update project selects in other forms
        this.updateProjectSelects();
        
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
        // Update time entry project select
        const timeEntryProjectSelect = document.getElementById('time-entry-project');
        if (timeEntryProjectSelect) {
            const currentValue = timeEntryProjectSelect.value;
            
            // Clear options except first
            while (timeEntryProjectSelect.options.length > 1) {
                timeEntryProjectSelect.remove(1);
            }
            
            // Add projects
            app.state.projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                timeEntryProjectSelect.appendChild(option);
            });
            
            // Restore selected value if possible
            if (currentValue && timeEntryProjectSelect.querySelector(`option[value="${currentValue}"]`)) {
                timeEntryProjectSelect.value = currentValue;
            }
        }
    }
};

// Initialize project manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    projectManager.init();
});
