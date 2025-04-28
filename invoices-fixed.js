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
    
    // Force reload invoices from localStorage
    forceReloadInvoices: function() {
        console.log('Force reloading invoices from localStorage');
        try {
            // Get invoices from localStorage
            const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
            
            // Update app.state
            if (window.app && app.state) {
                app.state.invoices = Array.isArray(invoices) ? invoices : [];
                console.log('Loaded', app.state.invoices.length, 'invoices from localStorage');
            }
        } catch (e) {
            console.error('Error loading invoices from localStorage:', e);
            if (window.app && app.state) {
                app.state.invoices = [];
            }
        }
    },
    
    // Render invoices
    renderInvoices: function() {
        console.log('Rendering invoices');
        const tableBody = document.querySelector('#invoices-table tbody');
        if (!tableBody) {
            console.error('Invoices table body not found');
            return;
        }
        
        tableBody.innerHTML = '';
        
        // Force reload invoices from localStorage to ensure we have the latest data
        this.forceReloadInvoices();
        
        if (!app.state.invoices || app.state.invoices.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="7" class="text-center">No invoices found</td>`;
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
                <td>
                    <div class="status-dropdown">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                        <button class="btn-icon change-status" data-id="${invoice.id}" title="Change status">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                    </div>
                </td>
                <td>${app.formatCurrency(invoice.total)}</td>
                <td>
                    <button class="btn-icon edit-invoice" data-id="${invoice.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-invoice" data-id="${invoice.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-icon generate-pdf" data-id="${invoice.id}">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    ${invoice.status === 'paid' ? `
                    <button class="btn-icon add-to-revenue" data-id="${invoice.id}" title="Add to revenue">
                        <i class="fas fa-plus-circle"></i>
                    </button>
                    ` : ''}
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners
        this.addInvoiceEventListeners();
    },
