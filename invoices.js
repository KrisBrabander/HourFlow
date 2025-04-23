// Invoices functionality
const invoiceGenerator = {
    // Initialize invoice generator
    init: function() {
        // Initialize new invoice button
        this.initNewInvoiceButton();
        
        // Render invoices
        this.renderInvoices();
        
        // Initialize clear all button
        this.initClearAllButton();
    },
    
    // Initialize new invoice button
    initNewInvoiceButton: function() {
        const newInvoiceBtn = document.getElementById('create-new-invoice');
        const invoiceForm = document.querySelector('.invoice-form');
        const closeFormBtn = document.querySelector('.close-invoice-form');
        
        newInvoiceBtn.addEventListener('click', () => {
            invoiceForm.style.display = 'block';
            this.resetInvoiceForm();
        });
        
        closeFormBtn.addEventListener('click', () => {
            invoiceForm.style.display = 'none';
        });
        
        // Initialize invoice form
        this.initInvoiceForm();
    },
    
    // Initialize invoice form
    initInvoiceForm: function() {
        const form = document.getElementById('invoice-form');
        const dateInput = document.getElementById('invoice-date');
        const dueDateInput = document.getElementById('invoice-due-date');
        const invoiceNumberInput = document.getElementById('invoice-number');
        const clientSelect = document.getElementById('invoice-client-select');
        
        // Set current date as default
        const today = new Date();
        const formattedDate = today.toISOString().substr(0, 10);
        dateInput.value = formattedDate;
        
        // Set due date (14 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);
        dueDateInput.value = dueDate.toISOString().substr(0, 10);
        
        // Generate invoice number
        invoiceNumberInput.value = this.generateInvoiceNumber();
        
        // Populate client select
        this.populateClientSelect();
        
        // Populate business info
        this.populateBusinessInfo();
        
        // Initialize invoice items
        this.initInvoiceItems();
        
        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveInvoice();
        });
        
        // Initialize PDF generation
        this.initPdfGeneration();
        
        // Initialize from time entries button
        this.initFromTimeEntriesButton();
    },
    
    // Generate invoice number
    generateInvoiceNumber: function() {
        const today = new Date();
        const year = today.getFullYear();
        
        // Get existing invoices for this year
        const yearInvoices = app.state.invoices.filter(invoice => {
            return invoice.number && invoice.number.includes(year.toString());
        });
        
        // Generate number
        const invoiceNumber = `INV-${year}-${(yearInvoices.length + 1).toString().padStart(3, '0')}`;
        
        return invoiceNumber;
    },
    
    // Populate client select
    populateClientSelect: function() {
        const clientSelect = document.getElementById('invoice-client-select');
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
        document.getElementById('invoice-business-name').value = app.state.settings.businessName;
        document.getElementById('invoice-business-email').value = app.state.settings.businessEmail;
        document.getElementById('invoice-business-address').value = app.state.settings.businessAddress;
        document.getElementById('invoice-business-phone').value = app.state.settings.businessPhone;
        document.getElementById('invoice-tax-rate').value = app.state.settings.taxRate;
    },
    
    // Initialize invoice items
    initInvoiceItems: function() {
        const addItemBtn = document.getElementById('add-invoice-item');
        
        // Add event listener to add item button
        addItemBtn.addEventListener('click', () => {
            this.addInvoiceItem();
        });
        
        // Initialize first item
        this.updateInvoiceItemEvents();
        this.updateInvoiceTotals();
    },
    
    // Add invoice item
    addInvoiceItem: function() {
        const invoiceItems = document.getElementById('invoice-items');
        const itemCount = invoiceItems.children.length + 1;
        
        const invoiceItem = document.createElement('div');
        invoiceItem.className = 'invoice-item';
        invoiceItem.innerHTML = `
            <div class="form-row">
                <div class="form-col grow">
                    <div class="form-group">
                        <label class="form-label" for="invoice-item-desc-${itemCount}">Description</label>
                        <input type="text" class="form-control" id="invoice-item-desc-${itemCount}" placeholder="Item description" required>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="form-label" for="invoice-item-qty-${itemCount}">Quantity</label>
                        <input type="number" class="form-control" id="invoice-item-qty-${itemCount}" value="1" min="1" step="0.5" required>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="form-label" for="invoice-item-rate-${itemCount}">Rate ($)</label>
                        <input type="number" class="form-control" id="invoice-item-rate-${itemCount}" placeholder="0.00" step="0.01" min="0" required>
                    </div>
                </div>
                <div class="form-col amount">
                    <div class="form-group">
                        <label class="form-label">Amount</label>
                        <div class="amount-text">$0.00</div>
                    </div>
                </div>
                <button type="button" class="btn-icon remove-invoice-item">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        invoiceItems.appendChild(invoiceItem);
        this.updateInvoiceItemEvents();
    },
    
    // Update invoice item events
    updateInvoiceItemEvents: function() {
        const invoiceItems = document.getElementById('invoice-items');
        const items = invoiceItems.querySelectorAll('.invoice-item');
        
        items.forEach((item, index) => {
            const qtyInput = item.querySelector('input[id^="invoice-item-qty"]');
            const rateInput = item.querySelector('input[id^="invoice-item-rate"]');
            const amountText = item.querySelector('.amount-text');
            const removeBtn = item.querySelector('.remove-invoice-item');
            
            // Update amount when quantity or rate changes
            qtyInput.addEventListener('input', () => {
                this.updateItemAmount(item);
                this.updateInvoiceTotals();
            });
            
            rateInput.addEventListener('input', () => {
                this.updateItemAmount(item);
                this.updateInvoiceTotals();
            });
            
            // Remove item when remove button is clicked
            removeBtn.addEventListener('click', () => {
                if (items.length > 1) {
                    item.remove();
                    this.updateInvoiceTotals();
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
        const taxRateInput = document.getElementById('invoice-tax-rate');
        const taxRateDisplayInput = document.getElementById('invoice-tax-rate-display');
        
        taxRateInput.addEventListener('input', () => {
            // Sync display field with main field
            taxRateDisplayInput.value = taxRateInput.value;
            this.updateInvoiceTotals();
        });
    },
    
    // Update item amount
    updateItemAmount: function(item) {
        const qtyInput = item.querySelector('input[id^="invoice-item-qty"]');
        const rateInput = item.querySelector('input[id^="invoice-item-rate"]');
        const amountText = item.querySelector('.amount-text');
        
        const qty = parseFloat(qtyInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        const amount = qty * rate;
        
        amountText.textContent = app.formatCurrency(amount);
    },
    
    // Update invoice totals
    updateInvoiceTotals: function() {
        const invoiceItems = document.getElementById('invoice-items');
        const items = invoiceItems.querySelectorAll('.invoice-item');
        const subtotalElement = document.getElementById('invoice-subtotal');
        const taxElement = document.getElementById('invoice-tax');
        const totalElement = document.getElementById('invoice-total');
        const taxRateInput = document.getElementById('invoice-tax-rate');
        
        let subtotal = 0;
        
        // Calculate subtotal
        items.forEach(item => {
            const qtyInput = item.querySelector('input[id^="invoice-item-qty"]');
            const rateInput = item.querySelector('input[id^="invoice-item-rate"]');
            
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
    
    // Save invoice
    saveInvoice: function() {
        // Get form values
        const client = document.getElementById('invoice-client-select').value;
        const number = document.getElementById('invoice-number').value;
        const date = document.getElementById('invoice-date').value;
        const dueDate = document.getElementById('invoice-due-date').value;
        const status = document.getElementById('invoice-status').value;
        const businessName = document.getElementById('invoice-business-name').value;
        const businessEmail = document.getElementById('invoice-business-email').value;
        const businessAddress = document.getElementById('invoice-business-address').value;
        const businessPhone = document.getElementById('invoice-business-phone').value;
        const taxRate = parseFloat(document.getElementById('invoice-tax-rate').value) || 0;
        const notes = document.getElementById('invoice-notes').value;
        
        // Get items
        const invoiceItems = document.getElementById('invoice-items');
        const items = invoiceItems.querySelectorAll('.invoice-item');
        const lineItems = [];
        
        items.forEach(item => {
            const description = item.querySelector('input[id^="invoice-item-desc"]').value;
            const quantity = parseFloat(item.querySelector('input[id^="invoice-item-qty"]').value) || 0;
            const rate = parseFloat(item.querySelector('input[id^="invoice-item-rate"]').value) || 0;
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
        
        // Create invoice object
        const invoice = {
            id: app.generateId(),
            client,
            number,
            date,
            dueDate,
            status,
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
        
        // Check if editing existing invoice
        const editId = document.getElementById('invoice-form').getAttribute('data-edit-id');
        if (editId) {
            // Find invoice index
            const index = app.state.invoices.findIndex(i => i.id === editId);
            if (index !== -1) {
                // Update invoice
                invoice.id = editId;
                app.state.invoices[index] = invoice;
            }
        } else {
            // Add to invoices
            app.state.invoices.push(invoice);
        }
        
        // Save to localStorage
        app.saveData('invoices', app.state.invoices);
        
        // Save business info to settings
        app.state.settings.businessName = businessName;
        app.state.settings.businessEmail = businessEmail;
        app.state.settings.businessAddress = businessAddress;
        app.state.settings.businessPhone = businessPhone;
        app.state.settings.taxRate = taxRate;
        app.saveData('settings', app.state.settings);
        
        // Hide form
        document.querySelector('.invoice-form').style.display = 'none';
        
        // Re-render invoices
        this.renderInvoices();
        
        // Show notification
        showNotification('Invoice saved successfully');
    },
    
    // Reset invoice form
    resetInvoiceForm: function() {
        const form = document.getElementById('invoice-form');
        
        // Reset form
        form.reset();
        
        // Remove edit id
        form.removeAttribute('data-edit-id');
        
        // Set current date
        const today = new Date();
        const formattedDate = today.toISOString().substr(0, 10);
        document.getElementById('invoice-date').value = formattedDate;
        
        // Set due date (14 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);
        document.getElementById('invoice-due-date').value = dueDate.toISOString().substr(0, 10);
        
        // Generate invoice number
        document.getElementById('invoice-number').value = this.generateInvoiceNumber();
        
        // Populate client select
        this.populateClientSelect();
        
        // Populate business info
        this.populateBusinessInfo();
        
        // Reset items
        const invoiceItems = document.getElementById('invoice-items');
        invoiceItems.innerHTML = '';
        this.addInvoiceItem();
        
        // Update totals
        this.updateInvoiceTotals();
    },
    
    // Render invoices
    renderInvoices: function() {
        const tableBody = document.querySelector('#invoices-table tbody');
        tableBody.innerHTML = '';
        
        if (app.state.invoices.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="6" class="text-center">No invoices found</td>`;
            tableBody.appendChild(row);
            return;
        }
        
        // Sort by timestamp (newest first)
        const sortedInvoices = [...app.state.invoices].sort((a, b) => b.timestamp - a.timestamp);
        
        sortedInvoices.forEach(invoice => {
            const row = document.createElement('tr');
            
            // Format date
            const date = new Date(invoice.date);
            const formattedDate = date.toLocaleDateString();
            
            // Format due date
            const dueDate = new Date(invoice.dueDate);
            const formattedDueDate = dueDate.toLocaleDateString();
            
            // Get client name
            const clientName = app.getClientNameById(invoice.client);
            
            // Format status
            const statusClass = `status-${invoice.status}`;
            const statusText = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);
            
            row.innerHTML = `
                <td>${invoice.number}</td>
                <td>${clientName}</td>
                <td>${formattedDate}</td>
                <td>${formattedDueDate}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${app.formatCurrency(invoice.total)}</td>
                <td>
                    <button class="btn-icon edit-invoice" data-id="${invoice.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-invoice" data-id="${invoice.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-icon generate-invoice-pdf" data-id="${invoice.id}">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners
        this.addInvoiceEventListeners();
        
        // Update dashboard stats
        app.updateDashboardStats();
    },
    
    // Add invoice event listeners
    addInvoiceEventListeners: function() {
        const editButtons = document.querySelectorAll('.edit-invoice');
        const deleteButtons = document.querySelectorAll('.delete-invoice');
        const pdfButtons = document.querySelectorAll('.generate-invoice-pdf');
        
        // Edit buttons
        editButtons.forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                this.editInvoice(id);
            });
        });
        
        // Delete buttons
        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                this.deleteInvoice(id);
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
    
    // Edit invoice
    editInvoice: function(id) {
        // Find invoice
        const invoice = app.state.invoices.find(invoice => invoice.id === id);
        
        if (!invoice) {
            showNotification('Invoice not found', 'error');
            return;
        }
        
        // Get form
        const form = document.getElementById('invoice-form');
        
        // Set form values
        form.setAttribute('data-edit-id', id);
        document.getElementById('invoice-client-select').value = invoice.client;
        document.getElementById('invoice-number').value = invoice.number;
        document.getElementById('invoice-date').value = invoice.date;
        document.getElementById('invoice-due-date').value = invoice.dueDate;
        document.getElementById('invoice-status').value = invoice.status;
        document.getElementById('invoice-business-name').value = invoice.businessName;
        document.getElementById('invoice-business-email').value = invoice.businessEmail;
        document.getElementById('invoice-business-address').value = invoice.businessAddress;
        document.getElementById('invoice-business-phone').value = invoice.businessPhone;
        document.getElementById('invoice-tax-rate').value = invoice.taxRate;
        document.getElementById('invoice-notes').value = invoice.notes;
        
        // Clear items
        const invoiceItems = document.getElementById('invoice-items');
        invoiceItems.innerHTML = '';
        
        // Add items
        invoice.lineItems.forEach((item, index) => {
            this.addInvoiceItem();
            
            // Get all items
            const items = invoiceItems.querySelectorAll('.invoice-item');
            const newItem = items[items.length - 1];
            
            newItem.querySelector(`input[id^="invoice-item-desc"]`).value = item.description;
            newItem.querySelector(`input[id^="invoice-item-qty"]`).value = item.quantity;
            newItem.querySelector(`input[id^="invoice-item-rate"]`).value = item.rate;
        });
        
        // Update totals
        this.updateInvoiceItemEvents();
        this.updateInvoiceTotals();
        
        // Show form
        document.querySelector('.invoice-form').style.display = 'block';
    },
    
    // Delete invoice
    deleteInvoice: function(id) {
        // Confirm delete
        if (!confirm('Are you sure you want to delete this invoice?')) {
            return;
        }
        
        // Find invoice index
        const index = app.state.invoices.findIndex(invoice => invoice.id === id);
        
        if (index === -1) {
            showNotification('Invoice not found', 'error');
            return;
        }
        
        // Remove invoice
        app.state.invoices.splice(index, 1);
        
        // Save to localStorage
        app.saveData('invoices', app.state.invoices);
        
        // Re-render invoices
        this.renderInvoices();
        
        // Show notification
        showNotification('Invoice deleted successfully');
    },
    
    // Initialize clear all button
    initClearAllButton: function() {
        const clearAllBtn = document.getElementById('clear-all-invoices');
        
        clearAllBtn.addEventListener('click', () => {
            // Confirm delete
            if (!confirm('Are you sure you want to delete all invoices? This action cannot be undone.')) {
                return;
            }
            
            // Clear invoices
            app.state.invoices = [];
            
            // Save to localStorage
            app.saveData('invoices', app.state.invoices);
            
            // Re-render invoices
            this.renderInvoices();
            
            // Show notification
            showNotification('All invoices deleted successfully');
        });
    },
    
    // Initialize PDF generation
    initPdfGeneration: function() {
        const generatePdfBtn = document.getElementById('generate-invoice-pdf');
        
        generatePdfBtn.addEventListener('click', () => {
            // Get form values
            const client = document.getElementById('invoice-client-select').value;
            const number = document.getElementById('invoice-number').value;
            const date = document.getElementById('invoice-date').value;
            const dueDate = document.getElementById('invoice-due-date').value;
            const status = document.getElementById('invoice-status').value;
            const businessName = document.getElementById('invoice-business-name').value;
            const businessEmail = document.getElementById('invoice-business-email').value;
            const businessAddress = document.getElementById('invoice-business-address').value;
            const businessPhone = document.getElementById('invoice-business-phone').value;
            const taxRate = parseFloat(document.getElementById('invoice-tax-rate').value) || 0;
            const notes = document.getElementById('invoice-notes').value;
            
            // Check if required fields are filled
            if (!client || !number || !date || !dueDate || !businessName) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            // Get items
            const invoiceItems = document.getElementById('invoice-items');
            const items = invoiceItems.querySelectorAll('.invoice-item');
            const lineItems = [];
            
            items.forEach(item => {
                const description = item.querySelector('input[id^="invoice-item-desc"]').value;
                const quantity = parseFloat(item.querySelector('input[id^="invoice-item-qty"]').value) || 0;
                const rate = parseFloat(item.querySelector('input[id^="invoice-item-rate"]').value) || 0;
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
            
            // Create invoice object
            const invoice = {
                client,
                number,
                date,
                dueDate,
                status,
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
            pdfGenerator.generateInvoicePdf(invoice);
        });
    },
    
    // Generate PDF
    generatePdf: function(id) {
        // Find invoice
        const invoice = app.state.invoices.find(invoice => invoice.id === id);
        
        if (!invoice) {
            showNotification('Invoice not found', 'error');
            return;
        }
        
        // Generate PDF
        pdfGenerator.generateInvoicePdf(invoice);
    },
    
    // Initialize from time entries button
    initFromTimeEntriesButton: function() {
        const fromTimeEntriesBtn = document.getElementById('invoice-from-time-entries');
        
        fromTimeEntriesBtn.addEventListener('click', () => {
            // Get client
            const clientId = document.getElementById('invoice-client-select').value;
            
            if (!clientId) {
                showNotification('Please select a client first', 'error');
                return;
            }
            
            // Get projects for this client
            const clientProjects = app.state.projects.filter(project => project.client === clientId);
            
            if (clientProjects.length === 0) {
                showNotification('No projects found for this client', 'error');
                return;
            }
            
            // Get project IDs
            const projectIds = clientProjects.map(project => project.id);
            
            // Get time entries for these projects
            const timeEntries = app.state.timeEntries.filter(entry => {
                return projectIds.includes(entry.project) && entry.billable === 'yes';
            });
            
            if (timeEntries.length === 0) {
                showNotification('No billable time entries found for this client', 'error');
                return;
            }
            
            // Group by project
            const entriesByProject = {};
            
            timeEntries.forEach(entry => {
                if (!entriesByProject[entry.project]) {
                    entriesByProject[entry.project] = [];
                }
                
                entriesByProject[entry.project].push(entry);
            });
            
            // Clear existing items
            const invoiceItems = document.getElementById('invoice-items');
            invoiceItems.innerHTML = '';
            
            // Add items for each project
            Object.keys(entriesByProject).forEach(projectId => {
                const project = app.state.projects.find(p => p.id === projectId);
                const entries = entriesByProject[projectId];
                
                // Calculate total hours
                let totalHours = 0;
                entries.forEach(entry => {
                    totalHours += parseFloat(entry.hours);
                });
                
                // Add item
                this.addInvoiceItem();
                
                // Get all items
                const items = invoiceItems.querySelectorAll('.invoice-item');
                const newItem = items[items.length - 1];
                
                newItem.querySelector(`input[id^="invoice-item-desc"]`).value = `${project.name} - Professional Services`;
                newItem.querySelector(`input[id^="invoice-item-qty"]`).value = totalHours.toFixed(2);
                newItem.querySelector(`input[id^="invoice-item-rate"]`).value = project.rate;
            });
            
            // Update totals
            this.updateInvoiceItemEvents();
            this.updateInvoiceTotals();
            
            // Show notification
            showNotification('Time entries added to invoice');
        });
    }
};

// Initialize invoice generator when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    invoiceGenerator.init();
});
