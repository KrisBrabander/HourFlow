// Invoice Revenue Connector
// Deze module verbindt de invoice functionaliteit met de revenue manager

// Functie om een factuur toe te voegen aan revenue wanneer deze betaald is
function addInvoiceToRevenue(invoiceId, amount, date) {
    console.log('Adding invoice to revenue:', invoiceId, amount, date);
    
    // Controleer of revenueManager beschikbaar is
    if (typeof revenueManager === 'undefined' || !revenueManager.addRevenue) {
        console.error('Revenue manager not available');
        showNotification('Error: Revenue manager not available', 'error');
        return false;
    }
    
    try {
        // Voeg toe aan revenue via revenueManager
        revenueManager.addRevenue(invoiceId, amount, date);
        
        // Toon notificatie
        showNotification('Invoice added to revenue successfully!');
        return true;
    } catch (e) {
        console.error('Error adding invoice to revenue:', e);
        showNotification('Error adding invoice to revenue', 'error');
        return false;
    }
}

// Initialiseer event listeners voor revenue knoppen
function initRevenueButtons() {
    console.log('Initializing revenue buttons');
    
    // Event listeners voor "Add to Revenue" knoppen
    document.querySelectorAll('.add-to-revenue').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Haal invoice ID op
            const invoiceId = this.getAttribute('data-id');
            if (!invoiceId) {
                console.error('No invoice ID found');
                return;
            }
            
            // Zoek de invoice in de app state
            if (!window.app || !app.state || !app.state.invoices) {
                console.error('App state or invoices not found');
                return;
            }
            
            const invoice = app.state.invoices.find(inv => inv.id === invoiceId);
            if (!invoice) {
                console.error('Invoice not found:', invoiceId);
                return;
            }
            
            // Voeg toe aan revenue
            addInvoiceToRevenue(invoiceId, invoice.total, invoice.date);
        });
    });
}

// Voeg de initRevenueButtons functie toe aan de window.onload event
window.addEventListener('DOMContentLoaded', function() {
    // Wacht even om er zeker van te zijn dat andere scripts geladen zijn
    setTimeout(function() {
        initRevenueButtons();
        
        // Voeg een observer toe om nieuwe knoppen te detecteren
        const invoicesTable = document.getElementById('invoices-table');
        if (invoicesTable) {
            const observer = new MutationObserver(function() {
                initRevenueButtons();
            });
            
            observer.observe(invoicesTable, { childList: true, subtree: true });
        }
    }, 1000);
});
