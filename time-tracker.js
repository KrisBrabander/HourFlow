// Time tracker functionality
const timeTracker = {
    // Initialize time tracker
    init: function() {
        // Initialize time entry form
        this.initTimeEntryForm();
        
        // Render time entries
        this.renderTimeEntries();
        
        // Initialize clear all button
        this.initClearAllButton();
        
        // Initialize export button
        this.initExportButton();
    },
    
    // Initialize time entry form
    initTimeEntryForm: function() {
        const form = document.getElementById('time-entry-form');
        const addButton = document.getElementById('add-time-entry-btn');
        const cancelButton = document.getElementById('cancel-time-entry');
        const dateInput = document.getElementById('time-entry-date');
        const projectSelect = document.getElementById('time-entry-project');
        
        // Set current date as default
        const today = new Date();
        const formattedDate = today.toISOString().substr(0, 10);
        dateInput.value = formattedDate;
        
        // Populate project select
        this.populateProjectSelect();
        
        // Show form when add button is clicked
        addButton.addEventListener('click', () => {
            console.log('Add time entry button clicked');
            
            // Force reload projects from localStorage
            if (window.app && app.state) {
                try {
                    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
                    app.state.projects = projects;
                    console.log('Reloaded', projects.length, 'projects from localStorage');
                } catch (e) {
                    console.error('Error reloading projects:', e);
                }
            }
            
            // Show form and reset
            form.style.display = 'block';
            form.removeAttribute('data-edit-id');
            form.reset();
            dateInput.value = formattedDate;
            
            // Populate project select
            this.populateProjectSelect();
        });
        
        // Hide form when cancel button is clicked
        cancelButton.addEventListener('click', () => {
            form.style.display = 'none';
        });
        
        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form values
            const project = projectSelect.value;
            const date = dateInput.value;
            const description = document.getElementById('time-entry-description').value;
            const hours = parseFloat(document.getElementById('time-entry-hours').value);
            const billable = document.getElementById('time-entry-billable').value;
            
            // Check if editing existing entry
            const editId = form.getAttribute('data-edit-id');
            
            if (editId) {
                // Find entry index
                const index = app.state.timeEntries.findIndex(entry => entry.id === editId);
                
                if (index !== -1) {
                    // Update entry
                    app.state.timeEntries[index] = {
                        id: editId,
                        project,
                        date,
                        description,
                        hours,
                        billable,
                        timestamp: app.state.timeEntries[index].timestamp
                    };
                    
                    showNotification('Time entry updated successfully');
                }
            } else {
                // Create new entry
                const newEntry = {
                    id: app.generateId(),
                    project,
                    date,
                    description,
                    hours,
                    billable,
                    timestamp: new Date().getTime()
                };
                
                // Add to time entries
                app.state.timeEntries.push(newEntry);
                
                showNotification('Time entry added successfully');
            }
            
            // Save to localStorage
            app.saveData('timeEntries', app.state.timeEntries);
            
            // Reset form
            form.reset();
            dateInput.value = formattedDate;
            
            // Hide form
            form.style.display = 'none';
            
            // Re-render time entries
            this.renderTimeEntries();
            
            // Update dashboard stats
            app.updateDashboardStats();
        });
    },
    
    // Populate project select
    populateProjectSelect: function() {
        console.log('Populating project select in time-tracker.js');
        const projectSelect = document.getElementById('time-entry-project');
        if (!projectSelect) {
            console.error('Project select element not found');
            return;
        }
        
        const currentValue = projectSelect.value;
        
        // Clear options except first
        while (projectSelect.options.length > 1) {
            projectSelect.remove(1);
        }
        
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
            }
            
            console.log('Loaded', projects.length, 'projects from localStorage for time entry form');
        } catch (e) {
            console.error('Error loading projects from localStorage:', e);
            // Fallback to app.state
            if (window.app && app.state && Array.isArray(app.state.projects)) {
                projects = app.state.projects;
            } else {
                projects = [];
            }
        }
        
        // Add projects
        projects.forEach(project => {
            if (!project || !project.id || !project.name) {
                console.warn('Skipping invalid project:', project);
                return; // Skip invalid projects
            }
            
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
        
        console.log('Added', projects.length, 'project options to select');
        console.log('Project select now has', projectSelect.options.length, 'options');
        
        // Restore selected value if possible
        if (currentValue && projectSelect.querySelector(`option[value="${currentValue}"]`)) {
            projectSelect.value = currentValue;
        }
    },
    
    // Render time entries
    renderTimeEntries: function() {
        console.log('Rendering time entries');
        const tableBody = document.querySelector('#time-entries-table tbody');
        if (!tableBody) {
            console.error('Time entries table body not found');
            return;
        }
        
        tableBody.innerHTML = '';
        
        // Get time entries directly from localStorage
        let timeEntries = [];
        try {
            timeEntries = JSON.parse(localStorage.getItem('timeEntries') || '[]');
            if (!Array.isArray(timeEntries)) {
                timeEntries = [];
            }
            
            // Also update app.state
            if (window.app && app.state) {
                app.state.timeEntries = timeEntries;
            }
            
            console.log('Loaded', timeEntries.length, 'time entries from localStorage');
        } catch (e) {
            console.error('Error loading time entries:', e);
            timeEntries = [];
        }
        
        if (timeEntries.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="6" class="text-center">No time entries found</td>`;
            tableBody.appendChild(row);
            
            // Update total hours
            const totalHoursCell = document.getElementById('total-hours-cell');
            if (totalHoursCell) {
                totalHoursCell.textContent = '0';
            }
            
            return;
        }
        
        // Sort by date (newest first)
        const sortedEntries = [...timeEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
        console.log('Sorted time entries:', sortedEntries.length);
        
        let totalHours = 0;
        
        sortedEntries.forEach(entry => {
            const row = document.createElement('tr');
            
            // Format date
            const date = new Date(entry.date);
            const formattedDate = date.toLocaleDateString();
            
            // Get project name directly from localStorage
            let projectName = 'Unknown Project';
            try {
                const projects = JSON.parse(localStorage.getItem('projects') || '[]');
                const project = projects.find(p => p.id === entry.project);
                if (project && project.name) {
                    projectName = project.name;
                }
            } catch (e) {
                console.error('Error getting project name:', e);
                // Fallback to app.getProjectNameById
                if (window.app) {
                    projectName = app.getProjectNameById(entry.project);
                }
            }
            
            // Add to total hours
            totalHours += parseFloat(entry.hours);
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${projectName}</td>
                <td>${entry.description}</td>
                <td>${entry.hours}</td>
                <td>${entry.billable === 'yes' ? 'Yes' : 'No'}</td>
                <td>
                    <button class="btn-icon edit-time-entry" data-id="${entry.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-time-entry" data-id="${entry.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Update total hours
        document.getElementById('total-hours-cell').textContent = totalHours.toFixed(2);
        
        // Add event listeners
        this.addTimeEntryEventListeners();
    },
    
    // Add time entry event listeners
    addTimeEntryEventListeners: function() {
        const editButtons = document.querySelectorAll('.edit-time-entry');
        const deleteButtons = document.querySelectorAll('.delete-time-entry');
        
        // Edit buttons
        editButtons.forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                this.editTimeEntry(id);
            });
        });
        
        // Delete buttons
        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                this.deleteTimeEntry(id);
            });
        });
    },
    
    // Edit time entry
    editTimeEntry: function(id) {
        // Find entry
        const entry = app.state.timeEntries.find(entry => entry.id === id);
        
        if (!entry) {
            showNotification('Time entry not found', 'error');
            return;
        }
        
        // Get form
        const form = document.getElementById('time-entry-form');
        
        // Set form values
        form.setAttribute('data-edit-id', id);
        document.getElementById('time-entry-project').value = entry.project;
        document.getElementById('time-entry-date').value = entry.date;
        document.getElementById('time-entry-description').value = entry.description;
        document.getElementById('time-entry-hours').value = entry.hours;
        document.getElementById('time-entry-billable').value = entry.billable;
        
        // Show form
        form.style.display = 'block';
    },
    
    // Delete time entry
    deleteTimeEntry: function(id) {
        // Confirm delete
        if (!confirm('Are you sure you want to delete this time entry?')) {
            return;
        }
        
        // Find entry index
        const index = app.state.timeEntries.findIndex(entry => entry.id === id);
        
        if (index === -1) {
            showNotification('Time entry not found', 'error');
            return;
        }
        
        // Remove entry
        app.state.timeEntries.splice(index, 1);
        
        // Save to localStorage
        app.saveData('timeEntries', app.state.timeEntries);
        
        // Ook direct in localStorage opslaan voor zekerheid
        try {
            localStorage.setItem('timeEntries', JSON.stringify(app.state.timeEntries));
            console.log('Time entry deleted and saved to localStorage');
        } catch (e) {
            console.error('Error saving time entries to localStorage:', e);
        }
        
        // Re-render time entries
        this.renderTimeEntries();
        
        // Update dashboard stats
        app.updateDashboardStats();
        
        // Show notification
        showNotification('Time entry deleted successfully');
    },
    
    // Initialize clear all button
    initClearAllButton: function() {
        const clearAllBtn = document.getElementById('clear-all-time-entries');
        
        clearAllBtn.addEventListener('click', () => {
            // Confirm delete
            if (!confirm('Are you sure you want to delete all time entries? This action cannot be undone.')) {
                return;
            }
            
            // Clear time entries
            app.state.timeEntries = [];
            
            // Save to localStorage
            app.saveData('timeEntries', app.state.timeEntries);
            
            // Re-render time entries
            this.renderTimeEntries();
            
            // Update dashboard stats
            app.updateDashboardStats();
            
            // Show notification
            showNotification('All time entries deleted successfully');
        });
    },
    
    // Initialize export button
    initExportButton: function() {
        const exportBtn = document.getElementById('export-time-entries');
        
        exportBtn.addEventListener('click', () => {
            // Check if there are time entries
            if (app.state.timeEntries.length === 0) {
                showNotification('No time entries to export', 'error');
                return;
            }
            
            // Create CSV content
            let csvContent = 'Date,Project,Description,Hours,Billable\n';
            
            // Sort by date (newest first)
            const sortedEntries = [...app.state.timeEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            sortedEntries.forEach(entry => {
                // Format date
                const date = new Date(entry.date);
                const formattedDate = date.toLocaleDateString();
                
                // Get project name
                const projectName = app.getProjectNameById(entry.project);
                
                // Get client name using dataManager if available
                let clientName = 'Unknown Client';
                if (window.dataManager) {
                    clientName = dataManager.getClientNameById(entry.client);
                } else if (window.app) {
                    clientName = app.getClientNameById(entry.client);
                }
                
                // Add to CSV
                csvContent += `"${formattedDate}","${projectName}","${clientName}","${entry.description}",${entry.hours},"${entry.billable === 'yes' ? 'Yes' : 'No'}"\n`;
            });
            
            // Create download link
            const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', 'time-entries.csv');
            document.body.appendChild(link);
            
            // Trigger download
            link.click();
            
            // Clean up
            document.body.removeChild(link);
            
            // Show notification
            showNotification('Time entries exported successfully');
        });
    }
};

// Initialize time tracker when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    timeTracker.init();
});
