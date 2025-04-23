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
        
        // Save business info to settings
        app.state.settings.businessName = businessName;
        app.state.settings.businessEmail = businessEmail;
        app.state.settings.businessAddress = businessAddress;
        app.state.settings.businessPhone = businessPhone;
        app.state.settings.taxRate = taxRate;
        app.saveData('settings', app.state.settings);
        
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
        
        // Reset form
        form.reset();
        
        // Remove edit id
        form.removeAttribute('data-edit-id');
        
        // Set current date
        const today = new Date();
        const formattedDate = today.toISOString().substr(0, 10);
        document.getElementById('quote-date').value = formattedDate;
        
        // Set valid until date (30 days from now)
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30);
        document.getElementById('quote-valid-until').value = validUntil.toISOString().substr(0, 10);
        
        // Generate quote number
        document.getElementById('quote-number').value = this.generateQuoteNumber();
        
        // Populate client select
        this.populateClientSelect();
        
        // Populate business info
        this.populateBusinessInfo();
        
        // Reset items
        const quoteItems = document.getElementById('quote-items');
        quoteItems.innerHTML = '';
        this.addQuoteItem();
        
        // Update totals
        this.updateQuoteTotals();
    },
    
    // Render quotes
    renderQuotes: function() {
        const tableBody = document.querySelector('#quotes-table tbody');
        tableBody.innerHTML = '';
        
        if (app.state.quotes.length === 0) {
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
});
