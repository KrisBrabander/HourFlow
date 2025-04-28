// Quotes functionality
const quoteGenerator = {
    // Initialize quote generator
    init: function() {
        // Initialize new quote button
        this.initNewQuoteButton();
        
        // Render quotes
        this.renderQuotes();
        
        // Initialize clear all button
        this.initClearAllButton();
    },
    
    // Initialize new quote button
    initNewQuoteButton: function() {
        const newQuoteBtn = document.getElementById('create-new-quote');
        const quoteForm = document.querySelector('.quote-form');
        const closeFormBtn = document.querySelector('.close-quote-form');
        
        newQuoteBtn.addEventListener('click', () => {
            quoteForm.style.display = 'block';
            this.resetQuoteForm();
        });
        
        closeFormBtn.addEventListener('click', () => {
            quoteForm.style.display = 'none';
        });
        
        // Initialize quote form
        this.initQuoteForm();
    },
    
    // Initialize quote form
    initQuoteForm: function() {
        const form = document.getElementById('quote-form');
        const dateInput = document.getElementById('quote-date');
        const validUntilInput = document.getElementById('quote-valid-until');
        const quoteNumberInput = document.getElementById('quote-number');
        const clientSelect = document.getElementById('quote-client-select');
        const projectSelect = document.getElementById('quote-project-select');
        const projectHoursInput = document.getElementById('quote-project-hours');
        
        // Set current date as default
        const today = new Date();
        const formattedDate = today.toISOString().substr(0, 10);
        dateInput.value = formattedDate;
        
        // Set valid until date (30 days from now)
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30);
        validUntilInput.value = validUntil.toISOString().substr(0, 10);
        
        // Generate quote number
        quoteNumberInput.value = this.generateQuoteNumber();
        
        // Populate client select
        this.populateClientSelect();
        
        // Populate project select
        this.populateProjectSelect();
        
        // Handle project selection change
        if (projectSelect) {
            projectSelect.addEventListener('change', () => {
                const selectedProjectId = projectSelect.value;
                if (selectedProjectId) {
                    this.updateQuoteFromProject(selectedProjectId);
                } else {
                    // Clear time entries section when no project is selected
                    const timeEntriesSection = document.getElementById('quote-time-entries-section');
                    if (timeEntriesSection) {
                        timeEntriesSection.innerHTML = '';
                    }
                }
            });
        }
        
        // Populate business info
        this.populateBusinessInfo();
        
        // Initialize quote items
        this.initQuoteItems();
        
        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveQuote();
        });
        
        // Initialize PDF generation
        this.initPdfGeneration();
    },
    
    // Populate project select
    populateProjectSelect: function() {
        console.log('Populating project select for quotes');
        const projectSelect = document.getElementById('quote-project-select');
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
            
            console.log('Loaded', projects.length, 'projects for quote form');
        } catch (e) {
            console.error('Error loading projects from localStorage:', e);
            projects = [];
        }
        
        // Add projects
        projects.forEach(project => {
            if (!project || !project.id || !project.name) {
                console.warn('Skipping invalid project:', project);
                return;
            }
            
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
        
        // Restore selected value if possible
        if (currentValue && projectSelect.querySelector(`option[value="${currentValue}"]`)) {
            projectSelect.value = currentValue;
        }
    },
    
    // Update quote from selected project
    updateQuoteFromProject: function(projectId) {
        console.log('Updating quote from project:', projectId);
        
        // Find project
        let project = null;
        try {
            const projects = JSON.parse(localStorage.getItem('projects') || '[]');
            project = projects.find(p => p.id === projectId);
        } catch (e) {
            console.error('Error finding project:', e);
            return;
        }
        
        if (!project) {
            console.error('Project not found:', projectId);
            return;
        }
        
        // Update client select
        const clientSelect = document.getElementById('quote-client-select');
        if (clientSelect && project.client) {
            clientSelect.value = project.client;
            console.log('Set client to:', project.client);
        }
        
        // Update project title
        const projectTitleInput = document.getElementById('quote-project-title');
        if (projectTitleInput) {
            projectTitleInput.value = project.name;
            console.log('Set project title to:', project.name);
        }
        
        // Get time entries for this project
        let timeEntries = [];
        let totalHours = 0;
        try {
            const allTimeEntries = JSON.parse(localStorage.getItem('timeEntries') || '[]');
            timeEntries = allTimeEntries.filter(entry => entry.project === projectId);
            
            // Sort by date (newest first)
            timeEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Calculate total hours
            totalHours = timeEntries.reduce((sum, entry) => sum + parseFloat(entry.hours || 0), 0);
            console.log('Project has', timeEntries.length, 'time entries totaling', totalHours, 'hours');
            
            // Display time entries in the time entries section
            this.displayTimeEntries(timeEntries, project.name);
        } catch (e) {
            console.error('Error processing time entries:', e);
        }
        
        // Update project hours
        const projectHoursInput = document.getElementById('quote-project-hours');
        if (projectHoursInput) {
            projectHoursInput.value = totalHours.toFixed(2);
            console.log('Set project hours to:', totalHours.toFixed(2));
        }
        
        // Update quote items based on time entries
        this.updateQuoteItemsFromTimeEntries(timeEntries, project);
    },
    
    // Display time entries in the time entries section
    displayTimeEntries: function(timeEntries, projectName) {
        // Create or get the time entries section
        let timeEntriesSection = document.getElementById('quote-time-entries-section');
        
        if (!timeEntriesSection) {
            // Create the section if it doesn't exist
            const quoteForm = document.querySelector('.quote-form .card-body');
            if (!quoteForm) return;
            
            // Create the time entries section
            timeEntriesSection = document.createElement('div');
            timeEntriesSection.id = 'quote-time-entries-section';
            timeEntriesSection.className = 'time-entries-section';
            
            // Create the heading
            const heading = document.createElement('h4');
            heading.textContent = 'Time Entries';
            timeEntriesSection.appendChild(heading);
            
            // Create the table container
            const tableContainer = document.createElement('div');
            tableContainer.className = 'table-container';
            timeEntriesSection.appendChild(tableContainer);
            
            // Insert the section before the quote items section
            const quoteItemsHeading = quoteForm.querySelector('h4');
            if (quoteItemsHeading) {
                quoteForm.insertBefore(timeEntriesSection, quoteItemsHeading);
            } else {
                quoteForm.appendChild(timeEntriesSection);
            }
            
            // Add styles for the time entries section
            const style = document.createElement('style');
            style.textContent = `
                .time-entries-section {
                    margin: 20px 0;
                    padding: 15px;
                    background-color: #f8f9fa;
                    border-radius: 5px;
                    border: 1px solid #e0e0e0;
                }
                .time-entries-section h4 {
                    margin-bottom: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .time-entries-section .toggle-entries {
                    font-size: 14px;
                    color: #4a6cf7;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                }
                .time-entries-section .toggle-entries i {
                    margin-right: 5px;
                }
                .time-entries-section .table-container {
                    max-height: 300px;
                    overflow-y: auto;
                    margin-bottom: 10px;
                }
                .time-entries-section table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .time-entries-section th, .time-entries-section td {
                    padding: 8px 12px;
                    text-align: left;
                    border-bottom: 1px solid #e0e0e0;
                }
                .time-entries-section th {
                    background-color: #f0f0f0;
                    font-weight: 600;
                }
                .time-entries-section .summary {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 10px;
                    font-weight: 500;
                }
                .time-entries-section .use-entries-btn {
                    background-color: #4a6cf7;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    margin-top: 10px;
                }
                .time-entries-section .use-entries-btn:hover {
                    background-color: #3a56c6;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Get the table container
        const tableContainer = timeEntriesSection.querySelector('.table-container');
        if (!tableContainer) return;
        
        // Update the heading with toggle button
        let heading = timeEntriesSection.querySelector('h4');
        if (heading) {
            heading.innerHTML = `Time Entries for ${projectName} <span class="toggle-entries" id="toggle-time-entries"><i class="fas fa-chevron-down"></i> <span id="toggle-text">Hide</span></span>`;
            
            // Add toggle functionality
            const toggleBtn = heading.querySelector('#toggle-time-entries');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', function() {
                    const tableContainer = document.querySelector('#quote-time-entries-section .table-container');
                    const toggleText = document.getElementById('toggle-text');
                    const icon = this.querySelector('i');
                    
                    if (tableContainer.style.display === 'none') {
                        tableContainer.style.display = 'block';
                        toggleText.textContent = 'Hide';
                        icon.className = 'fas fa-chevron-down';
                    } else {
                        tableContainer.style.display = 'none';
                        toggleText.textContent = 'Show';
                        icon.className = 'fas fa-chevron-right';
                    }
                });
            }
        }
        
        // Clear the table container
        tableContainer.innerHTML = '';
        
        if (timeEntries.length === 0) {
            tableContainer.innerHTML = '<p class="text-center">No time entries found for this project.</p>';
            return;
        }
        
        // Create the table
        const table = document.createElement('table');
        table.className = 'time-entries-table';
        
        // Create the table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Hours</th>
                <th>Billable</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Create the table body
        const tbody = document.createElement('tbody');
        
        // Add time entries to the table
        let billableHours = 0;
        let nonBillableHours = 0;
        
        timeEntries.forEach(entry => {
            const row = document.createElement('tr');
            
            // Format date
            const date = new Date(entry.date);
            const formattedDate = date.toLocaleDateString();
            
            // Track billable hours
            const hours = parseFloat(entry.hours || 0);
            if (entry.billable === 'yes') {
                billableHours += hours;
            } else {
                nonBillableHours += hours;
            }
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${entry.description}</td>
                <td>${hours.toFixed(2)}</td>
                <td>${entry.billable === 'yes' ? 'Yes' : 'No'}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        
        // Add summary information
        const summary = document.createElement('div');
        summary.className = 'summary';
        summary.innerHTML = `
            <div>Total Entries: ${timeEntries.length}</div>
            <div>Billable Hours: ${billableHours.toFixed(2)}</div>
            <div>Non-Billable Hours: ${nonBillableHours.toFixed(2)}</div>
            <div>Total Hours: ${(billableHours + nonBillableHours).toFixed(2)}</div>
        `;
        
        // Add a button to use time entries for quote items
        const useEntriesBtn = document.createElement('button');
        useEntriesBtn.className = 'use-entries-btn';
        useEntriesBtn.textContent = 'Use Time Entries as Quote Items';
        useEntriesBtn.addEventListener('click', () => {
            this.createQuoteItemsFromTimeEntries(timeEntries);
        });
        
        // Add the summary and button to the section
        timeEntriesSection.appendChild(summary);
        timeEntriesSection.appendChild(useEntriesBtn);
    },
    
    // Update quote items based on time entries
    updateQuoteItemsFromTimeEntries: function(timeEntries, project) {
        // Update first quote item with project info
        const descriptionInput = document.getElementById('quote-item-desc-1');
        const qtyInput = document.getElementById('quote-item-qty-1');
        const rateInput = document.getElementById('quote-item-rate-1');
        
        if (descriptionInput && qtyInput && rateInput) {
            // Calculate billable hours
            const billableHours = timeEntries
                .filter(entry => entry.billable === 'yes')
                .reduce((sum, entry) => sum + parseFloat(entry.hours || 0), 0);
            
            descriptionInput.value = `${project.name} - Professional Services`;
            qtyInput.value = billableHours > 0 ? billableHours.toFixed(2) : '1';
            rateInput.value = project.rate || app.state.settings.hourlyRate;
            
            // Trigger calculation update
            const event = new Event('input');
            rateInput.dispatchEvent(event);
            
            console.log('Updated quote item with project details');
        }
    },
    
    // Create quote items from time entries
    createQuoteItemsFromTimeEntries: function(timeEntries) {
        // Clear existing quote items except the first one
        const quoteItems = document.getElementById('quote-items');
        while (quoteItems.children.length > 1) {
            quoteItems.removeChild(quoteItems.lastChild);
        }
        
        // Group time entries by description
        const entriesByDescription = {};
        
        timeEntries.forEach(entry => {
            if (entry.billable !== 'yes') return; // Skip non-billable entries
            
            const key = entry.description;
            if (!entriesByDescription[key]) {
                entriesByDescription[key] = {
                    description: entry.description,
                    hours: 0
                };
            }
            
            entriesByDescription[key].hours += parseFloat(entry.hours || 0);
        });
        
        // Get project rate
        const projectSelect = document.getElementById('quote-project-select');
        let rate = app.state.settings.hourlyRate || 0;
        
        if (projectSelect && projectSelect.value) {
            try {
                const projects = JSON.parse(localStorage.getItem('projects') || '[]');
                const project = projects.find(p => p.id === projectSelect.value);
                if (project && project.rate) {
                    rate = project.rate;
                }
            } catch (e) {
                console.error('Error getting project rate:', e);
            }
        }
        
        // Create quote items for each description group
        let index = 1;
        Object.values(entriesByDescription).forEach((group, i) => {
            if (i === 0) {
                // Update first item
                const descInput = document.getElementById('quote-item-desc-1');
                const qtyInput = document.getElementById('quote-item-qty-1');
                const rateInput = document.getElementById('quote-item-rate-1');
                
                if (descInput && qtyInput && rateInput) {
                    descInput.value = group.description;
                    qtyInput.value = group.hours.toFixed(2);
                    rateInput.value = rate;
                    
                    // Trigger calculation update
                    const event = new Event('input');
                    rateInput.dispatchEvent(event);
                }
            } else {
                // Add new items for additional groups
                index++;
                this.addQuoteItem();
                
                setTimeout(() => {
                    const descInput = document.getElementById(`quote-item-desc-${index}`);
                    const qtyInput = document.getElementById(`quote-item-qty-${index}`);
                    const rateInput = document.getElementById(`quote-item-rate-${index}`);
                    
                    if (descInput && qtyInput && rateInput) {
                        descInput.value = group.description;
                        qtyInput.value = group.hours.toFixed(2);
                        rateInput.value = rate;
                        
                        // Trigger calculation update
                        const event = new Event('input');
                        rateInput.dispatchEvent(event);
                    }
                }, 100);
            }
        });
        
        // Update quote totals
        this.updateQuoteTotals();
        
        // Show notification
        showNotification('Quote items created from time entries');
    }
    },
    
    // Generate quote number
    generateQuoteNumber: function() {
        const today = new Date();
        const year = today.getFullYear();
        
        // Get existing quotes for this year
        const yearQuotes = app.state.quotes.filter(quote => {
            return quote.number && quote.number.includes(year.toString());
        });
        
        // Generate number
        const quoteNumber = `Q-${year}-${(yearQuotes.length + 1).toString().padStart(3, '0')}`;
        
        return quoteNumber;
    },
    
    // Populate client select
    populateClientSelect: function() {
        const clientSelect = document.getElementById('quote-client-select');
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
    
    // Populate business info
    populateBusinessInfo: function() {
        document.getElementById('quote-business-name').value = app.state.settings.businessName;
        document.getElementById('quote-business-email').value = app.state.settings.businessEmail;
        document.getElementById('quote-business-address').value = app.state.settings.businessAddress;
        document.getElementById('quote-business-phone').value = app.state.settings.businessPhone;
        document.getElementById('quote-tax-rate').value = app.state.settings.taxRate;
    },
    
    // Initialize quote items
    initQuoteItems: function() {
        const addItemBtn = document.getElementById('add-quote-item');
        
        // Add event listener to add item button
        addItemBtn.addEventListener('click', () => {
            this.addQuoteItem();
        });
        
        // Initialize first item
        this.updateQuoteItemEvents();
        this.updateQuoteTotals();
    },
    
    // Add quote item
    addQuoteItem: function() {
        const quoteItems = document.getElementById('quote-items');
        const itemCount = quoteItems.children.length + 1;
        
        const quoteItem = document.createElement('div');
        quoteItem.className = 'quote-item';
        quoteItem.innerHTML = `
            <div class="form-row">
                <div class="form-col grow">
                    <div class="form-group">
                        <label class="form-label" for="quote-item-desc-${itemCount}">Description</label>
                        <input type="text" class="form-control" id="quote-item-desc-${itemCount}" placeholder="Item description" required>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="form-label" for="quote-item-qty-${itemCount}">Quantity</label>
                        <input type="number" class="form-control" id="quote-item-qty-${itemCount}" value="1" min="1" step="0.5" required>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="form-label" for="quote-item-rate-${itemCount}">Rate ($)</label>
                        <input type="number" class="form-control" id="quote-item-rate-${itemCount}" placeholder="0.00" step="0.01" min="0" required>
                    </div>
                </div>
                <div class="form-col amount">
                    <div class="form-group">
                        <label class="form-label">Amount</label>
                        <div class="amount-text">$0.00</div>
                    </div>
                </div>
                <button type="button" class="btn-icon remove-quote-item">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        quoteItems.appendChild(quoteItem);
        this.updateQuoteItemEvents();
    },
    
    // Update quote item events
    updateQuoteItemEvents: function() {
        const quoteItems = document.getElementById('quote-items');
        const items = quoteItems.querySelectorAll('.quote-item');
        
        items.forEach((item, index) => {
            const qtyInput = item.querySelector('input[id^="quote-item-qty"]');
            const rateInput = item.querySelector('input[id^="quote-item-rate"]');
            const amountText = item.querySelector('.amount-text');
            const removeBtn = item.querySelector('.remove-quote-item');
            
            // Update amount when quantity or rate changes
            qtyInput.addEventListener('input', () => {
                this.updateItemAmount(item);
                this.updateQuoteTotals();
            });
            
            rateInput.addEventListener('input', () => {
                this.updateItemAmount(item);
                this.updateQuoteTotals();
            });
            
            // Remove item when remove button is clicked
            removeBtn.addEventListener('click', () => {
                if (items.length > 1) {
                    item.remove();
                    this.updateQuoteTotals();
                }
            });
            
            // Show/hide remove button
            if (items.length > 1) {
                removeBtn.style.visibility = 'visible';
            } else {
                removeBtn.style.visibility = 'hidden';
            }
        });
        
        // Update tax rate event
        const taxRateInput = document.getElementById('quote-tax-rate');
        taxRateInput.addEventListener('input', () => {
            this.updateQuoteTotals();
        });
    },
    
    // Update item amount
    updateItemAmount: function(item) {
        const qtyInput = item.querySelector('input[id^="quote-item-qty"]');
        const rateInput = item.querySelector('input[id^="quote-item-rate"]');
        const amountText = item.querySelector('.amount-text');
        
        const qty = parseFloat(qtyInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        const amount = qty * rate;
        
        amountText.textContent = app.formatCurrency(amount);
    },
    
    // Update quote totals
    updateQuoteTotals: function() {
        const quoteItems = document.getElementById('quote-items');
        const items = quoteItems.querySelectorAll('.quote-item');
        const subtotalElement = document.getElementById('quote-subtotal');
        const taxElement = document.getElementById('quote-tax');
        const totalElement = document.getElementById('quote-total');
        const taxRateInput = document.getElementById('quote-tax-rate');
        
        let subtotal = 0;
        
        // Calculate subtotal
        items.forEach(item => {
            const qtyInput = item.querySelector('input[id^="quote-item-qty"]');
            const rateInput = item.querySelector('input[id^="quote-item-rate"]');
            
            const qty = parseFloat(qtyInput.value) || 0;
            const rate = parseFloat(rateInput.value) || 0;
            const amount = qty * rate;
            
            subtotal += amount;
        });
        
        // Calculate tax
        const taxRate = parseFloat(taxRateInput.value) || 0;
        const tax = subtotal * (taxRate / 100);
        
        // Calculate total
        const total = subtotal + tax;
        
        // Update elements
        subtotalElement.textContent = app.formatCurrency(subtotal);
        taxElement.textContent = app.formatCurrency(tax);
        totalElement.textContent = app.formatCurrency(total);
    },
    
    // Save quote
    saveQuote: function() {
        // Get form values
        const client = document.getElementById('quote-client-select').value;
        const projectTitle = document.getElementById('quote-project-title').value;
        const number = document.getElementById('quote-number').value;
        const date = document.getElementById('quote-date').value;
        const validUntil = document.getElementById('quote-valid-until').value;
        const businessName = document.getElementById('quote-business-name').value;
        const businessEmail = document.getElementById('quote-business-email').value;
        const businessAddress = document.getElementById('quote-business-address').value;
        const businessPhone = document.getElementById('quote-business-phone').value;
        const taxRate = parseFloat(document.getElementById('quote-tax-rate').value) || 0;
        const notes = document.getElementById('quote-notes').value;
        
        // Get items
        const quoteItems = document.getElementById('quote-items');
        const items = quoteItems.querySelectorAll('.quote-item');
        const lineItems = [];
        
        items.forEach(item => {
            const description = item.querySelector('input[id^="quote-item-desc"]').value;
            const quantity = parseFloat(item.querySelector('input[id^="quote-item-qty"]').value) || 0;
            const rate = parseFloat(item.querySelector('input[id^="quote-item-rate"]').value) || 0;
            const amount = quantity * rate;
            
            lineItems.push({
                description,
                quantity,
                rate,
                amount
            });
        });
        
        // Calculate totals
        let subtotal = 0;
        lineItems.forEach(item => {
            subtotal += item.amount;
        });
        
        const tax = subtotal * (taxRate / 100);
        const total = subtotal + tax;
        
        // Create quote object
        const quote = {
            id: app.generateId(),
            client,
            projectTitle,
            number,
            date,
            validUntil,
            businessName,
            businessEmail,
            businessAddress,
            businessPhone,
            taxRate,
            lineItems,
            subtotal,
            tax,
            total,
            notes,
            timestamp: new Date().getTime()
        };
        
        // Check if editing existing quote
        const editId = document.getElementById('quote-form').getAttribute('data-edit-id');
        if (editId) {
            // Find quote index
            const index = app.state.quotes.findIndex(q => q.id === editId);
            if (index !== -1) {
                // Update quote
                quote.id = editId;
                app.state.quotes[index] = quote;
            }
        } else {
            // Add to quotes
            app.state.quotes.push(quote);
        }
        
        // Save to localStorage
        app.saveData('quotes', app.state.quotes);
        
        // Ook direct in localStorage opslaan voor zekerheid
        try {
            localStorage.setItem('quotes', JSON.stringify(app.state.quotes));
            console.log('Quotes saved directly to localStorage:', app.state.quotes.length);
        } catch (e) {
            console.error('Error saving quotes directly to localStorage:', e);
        }
        
        // Save business info to settings
        app.state.settings.businessName = businessName;
        app.state.settings.businessEmail = businessEmail;
        app.state.settings.businessAddress = businessAddress;
        app.state.settings.businessPhone = businessPhone;
        app.state.settings.taxRate = taxRate;
        app.saveData('settings', app.state.settings);
        
        // Update all dropdowns in the application via central function
        if (window.app && typeof app.updateAllDropdowns === 'function') {
            app.updateAllDropdowns('quotes');
            console.log('All dropdowns updated after quote save');
        }
        
        // Hide form
        document.querySelector('.quote-form').style.display = 'none';
        
        // Re-render quotes
        this.renderQuotes();
        
        // Show notification
        showNotification('Quote saved successfully');
    },
    
    // Reset quote form
    resetQuoteForm: function() {
        const form = document.getElementById('quote-form');
        form.reset();
        
        // Set current date as default
        const today = new Date();
        const formattedDate = today.toISOString().substr(0, 10);
        document.getElementById('quote-date').value = formattedDate;
        
        // Set valid until date (30 days from now)
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30);
        document.getElementById('quote-valid-until').value = validUntil.toISOString().substr(0, 10);
        
        // Generate quote number
        document.getElementById('quote-number').value = this.generateQuoteNumber();
        
        // Populate business info
        this.populateBusinessInfo();
        
        // Reset quote items
        const quoteItems = document.getElementById('quote-items');
        while (quoteItems.children.length > 1) {
            quoteItems.removeChild(quoteItems.lastChild);
        }
        
        // Reset first item
        const descInput = document.getElementById('quote-item-desc-1');
        const qtyInput = document.getElementById('quote-item-qty-1');
        const rateInput = document.getElementById('quote-item-rate-1');
        
        if (descInput && qtyInput && rateInput) {
            descInput.value = '';
            qtyInput.value = '1';
            rateInput.value = app.state.settings.hourlyRate || '';
        }
        
        // Clear time entries section
        const timeEntriesSection = document.getElementById('quote-time-entries-section');
        if (timeEntriesSection) {
            timeEntriesSection.innerHTML = '';
        }
        
        // Update totals
        this.updateQuoteTotals();
    },
    
    // Force reload quotes from localStorage
    forceReloadQuotes: function() {
        console.log('Force reloading quotes from localStorage');
        try {
            // Get quotes from localStorage
            const quotes = JSON.parse(localStorage.getItem('quotes') || '[]');
            
            // Update app.state
            if (window.app && app.state) {
                app.state.quotes = Array.isArray(quotes) ? quotes : [];
                console.log('Loaded', app.state.quotes.length, 'quotes from localStorage');
            }
        } catch (e) {
            console.error('Error loading quotes from localStorage:', e);
            if (window.app && app.state) {
                app.state.quotes = [];
            }
        }
    },
    
    // Render quotes
    renderQuotes: function() {
        console.log('Rendering quotes');
        const tableBody = document.querySelector('#quotes-table tbody');
        if (!tableBody) {
            console.error('Quotes table body not found');
            return;
        }
        
        tableBody.innerHTML = '';
        
        // Direct uit localStorage laden, niet via app.state
        let quotes = [];
        try {
            quotes = JSON.parse(localStorage.getItem('quotes') || '[]');
            if (!Array.isArray(quotes)) quotes = [];
            
            // Update ook app.state
            if (window.app && app.state) {
                app.state.quotes = quotes;
            }
            
            console.log('Direct loaded', quotes.length, 'quotes from localStorage');
        } catch (e) {
            console.error('Error loading quotes from localStorage:', e);
            quotes = [];
            if (window.app && app.state) {
                app.state.quotes = [];
            }
        }
        
        if (quotes.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" class="text-center">No quotes found</td>`;
            tableBody.appendChild(row);
            return;
        }
        
        // Sort by timestamp (newest first)
        const sortedQuotes = [...app.state.quotes].sort((a, b) => b.timestamp - a.timestamp);
        
        sortedQuotes.forEach(quote => {
            const row = document.createElement('tr');
            
            // Format date
            const date = new Date(quote.date);
            const formattedDate = date.toLocaleDateString();
            
            // Get client name
            const clientName = app.getClientNameById(quote.client);
            
            row.innerHTML = `
                <td>${quote.number}</td>
                <td>${clientName}</td>
                <td>${formattedDate}</td>
                <td>${app.formatCurrency(quote.total)}</td>
                <td>
                    <button class="btn-icon edit-quote" data-id="${quote.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-quote" data-id="${quote.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-icon generate-quote-pdf" data-id="${quote.id}">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners
        this.addQuoteEventListeners();
        
        // Update dashboard stats
        app.updateDashboardStats();
    },
    
    // Add quote event listeners
    addQuoteEventListeners: function() {
        const editButtons = document.querySelectorAll('.edit-quote');
        const deleteButtons = document.querySelectorAll('.delete-quote');
        const pdfButtons = document.querySelectorAll('.generate-quote-pdf');
        
        // Edit buttons
        editButtons.forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                this.editQuote(id);
            });
        });
        
        // Delete buttons
        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                this.deleteQuote(id);
            });
        });
        
        // PDF buttons
        pdfButtons.forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                this.generatePdf(id);
            });
        });
    },
    
    // Edit quote
    editQuote: function(id) {
        // Find quote
        const quote = app.state.quotes.find(quote => quote.id === id);
        
        if (!quote) {
            showNotification('Quote not found', 'error');
            return;
        }
        
        // Get form
        const form = document.getElementById('quote-form');
        
        // Set form values
        form.setAttribute('data-edit-id', id);
        document.getElementById('quote-client-select').value = quote.client;
        document.getElementById('quote-project-title').value = quote.projectTitle;
        document.getElementById('quote-number').value = quote.number;
        document.getElementById('quote-date').value = quote.date;
        document.getElementById('quote-valid-until').value = quote.validUntil;
        document.getElementById('quote-business-name').value = quote.businessName;
        document.getElementById('quote-business-email').value = quote.businessEmail;
        document.getElementById('quote-business-address').value = quote.businessAddress;
        document.getElementById('quote-business-phone').value = quote.businessPhone;
        document.getElementById('quote-tax-rate').value = quote.taxRate;
        document.getElementById('quote-notes').value = quote.notes;
        
        // Clear items
        const quoteItems = document.getElementById('quote-items');
        quoteItems.innerHTML = '';
        
        // Add items
        quote.lineItems.forEach((item, index) => {
            this.addQuoteItem();
            
            // Get all items
            const items = quoteItems.querySelectorAll('.quote-item');
            const newItem = items[items.length - 1];
            
            newItem.querySelector(`input[id^="quote-item-desc"]`).value = item.description;
            newItem.querySelector(`input[id^="quote-item-qty"]`).value = item.quantity;
            newItem.querySelector(`input[id^="quote-item-rate"]`).value = item.rate;
        });
        
        // Update totals
        this.updateQuoteItemEvents();
        this.updateQuoteTotals();
        
        // Show form
        document.querySelector('.quote-form').style.display = 'block';
    },
    
    // Delete quote
    deleteQuote: function(id) {
        // Confirm delete
        if (!confirm('Are you sure you want to delete this quote?')) {
            return;
        }
        
        // Find quote index
        const index = app.state.quotes.findIndex(quote => quote.id === id);
        
        if (index === -1) {
            showNotification('Quote not found', 'error');
            return;
        }
        
        // Remove quote
        app.state.quotes.splice(index, 1);
        
        // Save to localStorage
        app.saveData('quotes', app.state.quotes);
        
        // Ook direct in localStorage opslaan voor zekerheid
        try {
            localStorage.setItem('quotes', JSON.stringify(app.state.quotes));
            console.log('Quotes saved directly to localStorage after delete');
        } catch (e) {
            console.error('Error saving quotes to localStorage:', e);
        }
        
        // Update all dropdowns in the application via central function
        if (window.app && typeof app.updateAllDropdowns === 'function') {
            app.updateAllDropdowns('quotes');
            console.log('All dropdowns updated after quote deletion');
        } else {
            // Fallback to just reloading quotes
            this.forceReloadQuotes();
        }
        
        // Re-render quotes
        this.renderQuotes();
        
        // Show notification
        showNotification('Quote deleted successfully');
    },
    
    // Initialize clear all button
    initClearAllButton: function() {
        const clearAllBtn = document.getElementById('clear-all-quotes');
        
        clearAllBtn.addEventListener('click', () => {
            // Confirm delete
            if (!confirm('Are you sure you want to delete all quotes? This action cannot be undone.')) {
                return;
            }
            
            // Clear quotes
            app.state.quotes = [];
            
            // Save to localStorage
            app.saveData('quotes', app.state.quotes);
            
            // Re-render quotes
            this.renderQuotes();
            
            // Show notification
            showNotification('All quotes deleted successfully');
        });
    },
    
    // Initialize PDF generation
    initPdfGeneration: function() {
        const generatePdfBtn = document.getElementById('generate-quote-pdf');
        
        generatePdfBtn.addEventListener('click', () => {
            // Get form values
            const client = document.getElementById('quote-client-select').value;
            const projectTitle = document.getElementById('quote-project-title').value;
            const number = document.getElementById('quote-number').value;
            const date = document.getElementById('quote-date').value;
            const validUntil = document.getElementById('quote-valid-until').value;
            const businessName = document.getElementById('quote-business-name').value;
            const businessEmail = document.getElementById('quote-business-email').value;
            const businessAddress = document.getElementById('quote-business-address').value;
            const businessPhone = document.getElementById('quote-business-phone').value;
            const taxRate = parseFloat(document.getElementById('quote-tax-rate').value) || 0;
            const notes = document.getElementById('quote-notes').value;
            
            // Check if required fields are filled
            if (!client || !projectTitle || !number || !date || !validUntil || !businessName) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            // Get items
            const quoteItems = document.getElementById('quote-items');
            const items = quoteItems.querySelectorAll('.quote-item');
            const lineItems = [];
            
            items.forEach(item => {
                const description = item.querySelector('input[id^="quote-item-desc"]').value;
                const quantity = parseFloat(item.querySelector('input[id^="quote-item-qty"]').value) || 0;
                const rate = parseFloat(item.querySelector('input[id^="quote-item-rate"]').value) || 0;
                const amount = quantity * rate;
                
                if (!description || !quantity || !rate) {
                    showNotification('Please fill in all item fields', 'error');
                    return;
                }
                
                lineItems.push({
                    description,
                    quantity,
                    rate,
                    amount
                });
            });
            
            // Calculate totals
            let subtotal = 0;
            lineItems.forEach(item => {
                subtotal += item.amount;
            });
            
            const tax = subtotal * (taxRate / 100);
            const total = subtotal + tax;
            
            // Create quote object
            const quote = {
                client,
                projectTitle,
                number,
                date,
                validUntil,
                businessName,
                businessEmail,
                businessAddress,
                businessPhone,
                taxRate,
                lineItems,
                subtotal,
                tax,
                total,
                notes
            };
            
            // Generate PDF
            pdfGenerator.generateQuotePdf(quote);
        });
    },
    
    // Generate PDF
    generatePdf: function(id) {
        // Find quote
        const quote = app.state.quotes.find(quote => quote.id === id);
        
        if (!quote) {
            showNotification('Quote not found', 'error');
            return;
        }
        
        // Generate PDF
        pdfGenerator.generateQuotePdf(quote);
    }
};

// Initialize quote generator when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    quoteGenerator.init();
    
    // Direct quotes renderen bij laden van de pagina
    setTimeout(function() {
        console.log('Force rendering quotes on page load');
        quoteGenerator.renderQuotes();
    }, 100);
});
