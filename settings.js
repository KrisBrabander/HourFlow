// Settings functionality
const settingsManager = {
    // Initialize settings
    init: function() {
        // Initialize business info form
        this.initBusinessInfoForm();
        
        // Initialize color theme selector
        this.initColorThemeSelector();
        
        // Initialize sample PDF generator
        this.initSamplePdfGenerator();
    },
    
    // Initialize business info form
    initBusinessInfoForm: function() {
        const form = document.getElementById('business-info-form');
        
        // Populate form with current settings
        document.getElementById('business-name').value = app.state.settings.businessName;
        document.getElementById('business-email').value = app.state.settings.businessEmail;
        document.getElementById('business-address').value = app.state.settings.businessAddress;
        document.getElementById('business-phone').value = app.state.settings.businessPhone;
        document.getElementById('default-hourly-rate').value = app.state.settings.hourlyRate;
        document.getElementById('default-tax-rate').value = app.state.settings.taxRate;
        
        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form values
            const businessName = document.getElementById('business-name').value;
            const businessEmail = document.getElementById('business-email').value;
            const businessAddress = document.getElementById('business-address').value;
            const businessPhone = document.getElementById('business-phone').value;
            const hourlyRate = parseFloat(document.getElementById('default-hourly-rate').value) || 50;
            const taxRate = parseFloat(document.getElementById('default-tax-rate').value) || 0;
            
            // Update settings
            app.state.settings.businessName = businessName;
            app.state.settings.businessEmail = businessEmail;
            app.state.settings.businessAddress = businessAddress;
            app.state.settings.businessPhone = businessPhone;
            app.state.settings.hourlyRate = hourlyRate;
            app.state.settings.taxRate = taxRate;
            
            // Save settings
            app.saveData('settings', app.state.settings);
            
            // Show notification
            showNotification('Business information saved successfully');
        });
    },
    
    // Initialize color theme selector
    initColorThemeSelector: function() {
        const themeOptions = document.querySelectorAll('.color-theme-option');
        
        // Get current theme from localStorage or use default
        const currentTheme = localStorage.getItem('hourflow_pdf_theme') || 'blue';
        
        // Set current theme in pdfGenerator
        pdfGenerator.setColorTheme(currentTheme);
        
        // Mark active theme
        themeOptions.forEach(option => {
            const theme = option.getAttribute('data-theme');
            
            if (theme === currentTheme) {
                option.classList.add('active');
            }
            
            // Add click event
            option.addEventListener('click', () => {
                // Remove active class from all options
                themeOptions.forEach(opt => opt.classList.remove('active'));
                
                // Add active class to clicked option
                option.classList.add('active');
                
                // Set theme in pdfGenerator
                pdfGenerator.setColorTheme(theme);
                
                // Save theme to localStorage
                localStorage.setItem('hourflow_pdf_theme', theme);
                
                // Show notification
                showNotification(`PDF theme changed to ${theme}`);
            });
        });
    },
    
    // Initialize sample PDF generator
    initSamplePdfGenerator: function() {
        const sampleButton = document.getElementById('generate-sample-pdf');
        
        sampleButton.addEventListener('click', () => {
            // Create sample quote
            const sampleQuote = {
                id: 'sample',
                client: 'sample',
                projectTitle: 'Sample Project',
                number: 'SAMPLE-2025-001',
                date: new Date().toISOString().substr(0, 10),
                validUntil: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().substr(0, 10),
                businessName: app.state.settings.businessName || 'Your Business Name',
                businessEmail: app.state.settings.businessEmail || 'your@email.com',
                businessAddress: app.state.settings.businessAddress || 'Your Address\nCity, Country',
                businessPhone: app.state.settings.businessPhone || '123-456-7890',
                taxRate: app.state.settings.taxRate || 0,
                lineItems: [
                    {
                        description: 'Web Design',
                        quantity: 1,
                        rate: 1000,
                        amount: 1000
                    },
                    {
                        description: 'Development',
                        quantity: 20,
                        rate: 100,
                        amount: 2000
                    },
                    {
                        description: 'Content Creation',
                        quantity: 5,
                        rate: 200,
                        amount: 1000
                    }
                ],
                subtotal: 4000,
                tax: 4000 * (app.state.settings.taxRate || 0) / 100,
                total: 4000 + (4000 * (app.state.settings.taxRate || 0) / 100),
                notes: 'This is a sample quote to preview the PDF theme. You can change the theme in the settings.'
            };
            
            // Generate PDF
            pdfGenerator.generateQuotePdf(sampleQuote);
        });
    }
};

// Initialize settings when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    settingsManager.init();
});
