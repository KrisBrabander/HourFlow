// Force reload invoices from localStorage
function forceReloadInvoices() {
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
}

// Export the function
window.forceReloadInvoices = forceReloadInvoices;
