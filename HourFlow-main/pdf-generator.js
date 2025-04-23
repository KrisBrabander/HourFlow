// PDF generator functionality
const pdfGenerator = {
    // Available color themes
    colorThemes: {
        blue: {
            primary: [33, 150, 243],      // Blue
            secondary: [66, 165, 245],    // Light Blue
            accent: [3, 169, 244],        // Lighter Blue
            background: [250, 250, 250]   // Off-white
        },
        green: {
            primary: [76, 175, 80],      // Green
            secondary: [102, 187, 106],   // Light Green
            accent: [129, 199, 132],      // Lighter Green
            background: [250, 250, 250]   // Off-white
        },
        gray: {
            primary: [97, 97, 97],       // Dark Gray
            secondary: [117, 117, 117],   // Medium Gray
            accent: [158, 158, 158],      // Light Gray
            background: [250, 250, 250]   // Off-white
        },
        teal: {
            primary: [0, 150, 136],      // Teal
            secondary: [38, 166, 154],    // Light Teal
            accent: [77, 182, 172],       // Lighter Teal
            background: [250, 250, 250]   // Off-white
        },
        amber: {
            primary: [255, 152, 0],      // Amber
            secondary: [255, 167, 38],    // Light Amber
            accent: [255, 183, 77],       // Lighter Amber
            background: [250, 250, 250]   // Off-white
        }
    },
    
    // Current theme - default to blue
    currentTheme: 'blue',
    
    // Set color theme
    setColorTheme: function(themeName) {
        if (this.colorThemes[themeName]) {
            this.currentTheme = themeName;
            return true;
        }
        return false;
    },
    
    // Modern styling constants for 2025 design
    styles: {
        colors: {
            primary: [33, 150, 243],      // Blue (default)
            secondary: [66, 165, 245],    // Light Blue
            accent: [3, 169, 244],        // Lighter Blue
            text: [50, 50, 50],           // Dark gray
            lightText: [100, 100, 100],   // Medium gray
            background: [250, 250, 250],  // Off-white
            success: [46, 204, 113],      // Green
            warning: [241, 196, 15],      // Yellow
            danger: [231, 76, 60]         // Red
        },
        fonts: {
            heading: 'helvetica',
            body: 'helvetica'
        },
        fontSize: {
            title: 24,
            subtitle: 18,
            heading: 14,
            subheading: 12,
            body: 10,
            small: 8
        },
        spacing: {
            margin: 20,
            padding: 10
        }
    },
    
    // Helper functions
    helpers: {
        // Format date in modern style
        formatDate: function(dateStr) {
            const date = new Date(dateStr);
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        },
        
        // Create rounded rectangle
        roundedRect: function(doc, x, y, width, height, radius, color) {
            doc.setDrawColor(color[0], color[1], color[2]);
            doc.setFillColor(color[0], color[1], color[2]);
            
            // Draw rounded rectangle
            doc.roundedRect(x, y, width, height, radius, radius, 'F');
        },
        
        // Add modern header
        addModernHeader: function(doc, title, subtitle, color) {
            // Add colored header background
            this.roundedRect(doc, 0, 0, doc.internal.pageSize.width, 40, 0, color);
            
            // Add title
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(pdfGenerator.styles.fontSize.title);
            doc.setFont(pdfGenerator.styles.fonts.heading, 'bold');
            doc.text(title, pdfGenerator.styles.spacing.margin, 25);
            
            // Add subtitle if provided
            if (subtitle) {
                doc.setFontSize(pdfGenerator.styles.fontSize.subtitle);
                doc.setFont(pdfGenerator.styles.fonts.heading, 'normal');
                doc.text(subtitle, doc.internal.pageSize.width - pdfGenerator.styles.spacing.margin, 25, { align: 'right' });
            }
        },
        
        // Add modern footer
        addModernFooter: function(doc, text) {
            const pageCount = doc.internal.getNumberOfPages();
            
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                
                // Add subtle line
                doc.setDrawColor(200, 200, 200);
                doc.line(
                    pdfGenerator.styles.spacing.margin, 
                    doc.internal.pageSize.height - 20, 
                    doc.internal.pageSize.width - pdfGenerator.styles.spacing.margin, 
                    doc.internal.pageSize.height - 20
                );
                
                // Add footer text
                doc.setTextColor(pdfGenerator.styles.colors.lightText[0], pdfGenerator.styles.colors.lightText[1], pdfGenerator.styles.colors.lightText[2]);
                doc.setFontSize(pdfGenerator.styles.fontSize.small);
                doc.setFont(pdfGenerator.styles.fonts.body, 'normal');
                
                // Add page number
                doc.text(
                    `Page ${i} of ${pageCount}`, 
                    doc.internal.pageSize.width - pdfGenerator.styles.spacing.margin, 
                    doc.internal.pageSize.height - 10, 
                    { align: 'right' }
                );
                
                // Add text
                doc.text(
                    text, 
                    pdfGenerator.styles.spacing.margin, 
                    doc.internal.pageSize.height - 10
                );
            }
        },
        
        // Add info section
        addInfoSection: function(doc, title, content, x, y, maxWidth) {
            // Add title
            doc.setTextColor(pdfGenerator.styles.colors.primary[0], pdfGenerator.styles.colors.primary[1], pdfGenerator.styles.colors.primary[2]);
            doc.setFontSize(pdfGenerator.styles.fontSize.heading);
            doc.setFont(pdfGenerator.styles.fonts.heading, 'bold');
            doc.text(title, x, y);
            
            // Add content
            doc.setTextColor(pdfGenerator.styles.colors.text[0], pdfGenerator.styles.colors.text[1], pdfGenerator.styles.colors.text[2]);
            doc.setFontSize(pdfGenerator.styles.fontSize.body);
            doc.setFont(pdfGenerator.styles.fonts.body, 'normal');
            
            // Handle multiline content
            if (typeof content === 'string') {
                const splitContent = doc.splitTextToSize(content, maxWidth);
                doc.text(splitContent, x, y + 5);
                return y + 5 + (splitContent.length * 5);
            } else if (Array.isArray(content)) {
                let currentY = y + 5;
                content.forEach(line => {
                    doc.text(line, x, currentY);
                    currentY += 5;
                });
                return currentY;
            }
            
            return y + 5;
        },
        
        // Add status badge
        addStatusBadge: function(doc, status, x, y) {
            let color;
            switch(status.toLowerCase()) {
                case 'paid':
                case 'accepted':
                    color = pdfGenerator.styles.colors.success;
                    break;
                case 'pending':
                case 'draft':
                    color = pdfGenerator.styles.colors.warning;
                    break;
                case 'overdue':
                case 'rejected':
                    color = pdfGenerator.styles.colors.danger;
                    break;
                default:
                    color = pdfGenerator.styles.colors.secondary;
            }
            
            // Draw badge background
            const text = status.charAt(0).toUpperCase() + status.slice(1);
            const textWidth = doc.getTextWidth(text) + 10;
            
            this.roundedRect(doc, x, y - 6, textWidth, 8, 4, color);
            
            // Add text
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(pdfGenerator.styles.fontSize.small);
            doc.setFont(pdfGenerator.styles.fonts.body, 'bold');
            doc.text(text, x + 5, y);
            
            return textWidth;
        }
    },
    // Update colors based on current theme
    updateColors: function() {
        if (this.colorThemes[this.currentTheme]) {
            const theme = this.colorThemes[this.currentTheme];
            this.styles.colors.primary = theme.primary;
            this.styles.colors.secondary = theme.secondary;
            this.styles.colors.accent = theme.accent;
        }
    },
    
    // Generate quote PDF
    generateQuotePdf: function(quote) {
        // Update colors based on current theme
        this.updateColors();
        
        // Create new jsPDF instance
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Make sure autoTable is available
        if (!doc.autoTable) {
            console.error('autoTable plugin not loaded');
            showNotification('PDF generation failed: autoTable plugin not loaded', 'error');
            return;
        }
        
        // Get client name
        const clientName = app.getClientNameById(quote.client);
        
        // Add modern header
        this.helpers.addModernHeader(doc, 'QUOTE', quote.number, this.styles.colors.primary);
        
        // Set starting Y position after header
        let yPos = 50;
        
        // Add business info section
        doc.setTextColor(this.styles.colors.primary[0], this.styles.colors.primary[1], this.styles.colors.primary[2]);
        doc.setFontSize(this.styles.fontSize.heading);
        doc.setFont(this.styles.fonts.heading, 'bold');
        doc.text('FROM', this.styles.spacing.margin, yPos);
        
        // Add business details
        doc.setTextColor(this.styles.colors.text[0], this.styles.colors.text[1], this.styles.colors.text[2]);
        doc.setFontSize(this.styles.fontSize.subheading);
        doc.setFont(this.styles.fonts.body, 'bold');
        doc.text(quote.businessName, this.styles.spacing.margin, yPos + 8);
        
        // Add business address and contact info
        doc.setFontSize(this.styles.fontSize.body);
        doc.setFont(this.styles.fonts.body, 'normal');
        
        const businessAddressLines = quote.businessAddress.split('\n');
        let addressY = yPos + 13;
        
        businessAddressLines.forEach(line => {
            doc.text(line, this.styles.spacing.margin, addressY);
            addressY += 5;
        });
        
        doc.text(`Email: ${quote.businessEmail}`, this.styles.spacing.margin, addressY + 5);
        doc.text(`Phone: ${quote.businessPhone}`, this.styles.spacing.margin, addressY + 10);
        
        // Add client info section (on the right)
        const rightColumnX = doc.internal.pageSize.width / 2 + 10;
        
        doc.setTextColor(this.styles.colors.primary[0], this.styles.colors.primary[1], this.styles.colors.primary[2]);
        doc.setFontSize(this.styles.fontSize.heading);
        doc.setFont(this.styles.fonts.heading, 'bold');
        doc.text('TO', rightColumnX, yPos);
        
        // Add client details
        doc.setTextColor(this.styles.colors.text[0], this.styles.colors.text[1], this.styles.colors.text[2]);
        doc.setFontSize(this.styles.fontSize.subheading);
        doc.setFont(this.styles.fonts.body, 'bold');
        doc.text(clientName, rightColumnX, yPos + 8);
        
        // Add quote details
        doc.setFontSize(this.styles.fontSize.body);
        doc.setFont(this.styles.fonts.body, 'normal');
        
        // Format dates
        const formattedDate = this.helpers.formatDate(quote.date);
        const formattedValidUntil = this.helpers.formatDate(quote.validUntil);
        
        doc.text(`Date: ${formattedDate}`, rightColumnX, yPos + 18);
        doc.text(`Valid Until: ${formattedValidUntil}`, rightColumnX, yPos + 23);
        
        // Add project title with background
        yPos = Math.max(addressY + 20, yPos + 33); // Use the greater Y position
        
        // Add colored background for project title
        this.helpers.roundedRect(doc, this.styles.spacing.margin - 5, yPos - 5, doc.internal.pageSize.width - (this.styles.spacing.margin * 2) + 10, 12, 3, this.styles.colors.secondary);
        
        // Add project title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(this.styles.fontSize.subheading);
        doc.setFont(this.styles.fonts.heading, 'bold');
        doc.text(quote.projectTitle, this.styles.spacing.margin, yPos + 2);
        
        // Add items table
        const headers = [['Description', 'Quantity', 'Rate', 'Amount']];
        
        const data = quote.lineItems.map(item => [
            item.description,
            item.quantity.toString(),
            `$${item.rate.toFixed(2)}`,
            `$${item.amount.toFixed(2)}`
        ]);
        
        // Add table
        doc.autoTable({
            startY: yPos + 15,
            head: headers,
            body: data,
            theme: 'grid',
            headStyles: {
                fillColor: this.styles.colors.primary,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'left',
                fontSize: 10
            },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 30, halign: 'center' },
                2: { cellWidth: 30, halign: 'right' },
                3: { cellWidth: 30, halign: 'right' }
            },
            alternateRowStyles: {
                fillColor: [248, 248, 255]
            },
            foot: [
                ['', '', 'Subtotal', `$${quote.subtotal.toFixed(2)}`],
                ['', '', `Tax (${quote.taxRate}%)`, `$${quote.tax.toFixed(2)}`],
                ['', '', 'Total', `$${quote.total.toFixed(2)}`]
            ],
            footStyles: {
                fillColor: [240, 240, 250],
                textColor: this.styles.colors.text,
                fontStyle: 'bold',
                halign: 'right'
            },
            styles: {
                fontSize: 9,
                cellPadding: 5
            },
            margin: { left: this.styles.spacing.margin, right: this.styles.spacing.margin }
        });
        
        // Add notes section if available
        if (quote.notes) {
            const finalY = doc.lastAutoTable.finalY + 15;
            
            // Add notes title
            doc.setTextColor(this.styles.colors.primary[0], this.styles.colors.primary[1], this.styles.colors.primary[2]);
            doc.setFontSize(this.styles.fontSize.heading);
            doc.setFont(this.styles.fonts.heading, 'bold');
            doc.text('Notes', this.styles.spacing.margin, finalY);
            
            // Add notes content
            doc.setTextColor(this.styles.colors.text[0], this.styles.colors.text[1], this.styles.colors.text[2]);
            doc.setFontSize(this.styles.fontSize.body);
            doc.setFont(this.styles.fonts.body, 'normal');
            
            // Add light background for notes
            const splitNotes = doc.splitTextToSize(quote.notes, doc.internal.pageSize.width - (this.styles.spacing.margin * 2));
            const notesHeight = splitNotes.length * 5 + 10;
            
            this.helpers.roundedRect(
                doc, 
                this.styles.spacing.margin - 5, 
                finalY + 5, 
                doc.internal.pageSize.width - (this.styles.spacing.margin * 2) + 10, 
                notesHeight, 
                3, 
                [245, 245, 255]
            );
            
            // Add notes text
            doc.text(splitNotes, this.styles.spacing.margin, finalY + 10);
        }
        
        // Add modern footer
        this.helpers.addModernFooter(doc, `Generated with HourFlow Premium | ${new Date().toLocaleDateString()}`);
        
        // Add a QR code for digital verification (simulated in 2025)
        doc.setFillColor(0, 0, 0);
        doc.rect(doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 30, 20, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(5);
        doc.text('VERIFIED', doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 20);
        doc.text('DIGITAL', doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 15);
        doc.text('2025', doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
        
        // Save PDF
        doc.save(`Quote-${quote.number}.pdf`);
        
        // Show notification
        showNotification('Quote PDF generated successfully');
    },
    
    // Generate invoice PDF
    generateInvoicePdf: function(invoice) {
        // Update colors based on current theme
        this.updateColors();
        
        // Create new jsPDF instance
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Make sure autoTable is available
        if (!doc.autoTable) {
            console.error('autoTable plugin not loaded');
            showNotification('PDF generation failed: autoTable plugin not loaded', 'error');
            return;
        }
        
        // Get client name
        const clientName = app.getClientNameById(invoice.client);
        
        // Add modern header
        this.helpers.addModernHeader(doc, 'INVOICE', invoice.number, this.styles.colors.primary);
        
        // Set starting Y position after header
        let yPos = 50;
        
        // Add business info section
        doc.setTextColor(this.styles.colors.primary[0], this.styles.colors.primary[1], this.styles.colors.primary[2]);
        doc.setFontSize(this.styles.fontSize.heading);
        doc.setFont(this.styles.fonts.heading, 'bold');
        doc.text('FROM', this.styles.spacing.margin, yPos);
        
        // Add business details
        doc.setTextColor(this.styles.colors.text[0], this.styles.colors.text[1], this.styles.colors.text[2]);
        doc.setFontSize(this.styles.fontSize.subheading);
        doc.setFont(this.styles.fonts.body, 'bold');
        doc.text(invoice.businessName, this.styles.spacing.margin, yPos + 8);
        
        // Add business address and contact info
        doc.setFontSize(this.styles.fontSize.body);
        doc.setFont(this.styles.fonts.body, 'normal');
        
        const businessAddressLines = invoice.businessAddress.split('\n');
        let addressY = yPos + 13;
        
        businessAddressLines.forEach(line => {
            doc.text(line, this.styles.spacing.margin, addressY);
            addressY += 5;
        });
        
        doc.text(`Email: ${invoice.businessEmail}`, this.styles.spacing.margin, addressY + 5);
        doc.text(`Phone: ${invoice.businessPhone}`, this.styles.spacing.margin, addressY + 10);
        
        // Add client info section (on the right)
        const rightColumnX = doc.internal.pageSize.width / 2 + 10;
        
        doc.setTextColor(this.styles.colors.primary[0], this.styles.colors.primary[1], this.styles.colors.primary[2]);
        doc.setFontSize(this.styles.fontSize.heading);
        doc.setFont(this.styles.fonts.heading, 'bold');
        doc.text('TO', rightColumnX, yPos);
        
        // Add client details
        doc.setTextColor(this.styles.colors.text[0], this.styles.colors.text[1], this.styles.colors.text[2]);
        doc.setFontSize(this.styles.fontSize.subheading);
        doc.setFont(this.styles.fonts.body, 'bold');
        doc.text(clientName, rightColumnX, yPos + 8);
        
        // Add invoice details
        doc.setFontSize(this.styles.fontSize.body);
        doc.setFont(this.styles.fonts.body, 'normal');
        
        // Format dates
        const formattedDate = this.helpers.formatDate(invoice.date);
        const formattedDueDate = this.helpers.formatDate(invoice.dueDate);
        
        doc.text(`Date: ${formattedDate}`, rightColumnX, yPos + 18);
        doc.text(`Due Date: ${formattedDueDate}`, rightColumnX, yPos + 23);
        
        // Add status badge
        doc.text('Status:', rightColumnX, yPos + 28);
        this.helpers.addStatusBadge(doc, invoice.status, rightColumnX + 25, yPos + 28);
        
        // Add items table with modern styling
        yPos = Math.max(addressY + 20, yPos + 38); // Use the greater Y position
        
        // Add table title with background
        this.helpers.roundedRect(doc, this.styles.spacing.margin - 5, yPos - 5, doc.internal.pageSize.width - (this.styles.spacing.margin * 2) + 10, 12, 3, this.styles.colors.secondary);
        
        // Add table title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(this.styles.fontSize.subheading);
        doc.setFont(this.styles.fonts.heading, 'bold');
        doc.text('SERVICES', this.styles.spacing.margin, yPos + 2);
        
        // Add items table
        const headers = [['Description', 'Quantity', 'Rate', 'Amount']];
        
        const data = invoice.lineItems.map(item => [
            item.description,
            item.quantity.toString(),
            `$${item.rate.toFixed(2)}`,
            `$${item.amount.toFixed(2)}`
        ]);
        
        // Add table
        doc.autoTable({
            startY: yPos + 15,
            head: headers,
            body: data,
            theme: 'grid',
            headStyles: {
                fillColor: this.styles.colors.primary,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'left',
                fontSize: 10
            },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 30, halign: 'center' },
                2: { cellWidth: 30, halign: 'right' },
                3: { cellWidth: 30, halign: 'right' }
            },
            alternateRowStyles: {
                fillColor: [248, 248, 255]
            },
            foot: [
                ['', '', 'Subtotal', `$${invoice.subtotal.toFixed(2)}`],
                ['', '', `Tax (${invoice.taxRate}%)`, `$${invoice.tax.toFixed(2)}`],
                ['', '', 'Total', `$${invoice.total.toFixed(2)}`]
            ],
            footStyles: {
                fillColor: [240, 240, 250],
                textColor: this.styles.colors.text,
                fontStyle: 'bold',
                halign: 'right'
            },
            styles: {
                fontSize: 9,
                cellPadding: 5
            },
            margin: { left: this.styles.spacing.margin, right: this.styles.spacing.margin }
        });
        
        // Add payment info section
        const finalY = doc.lastAutoTable.finalY + 15;
        
        // Add payment info title
        doc.setTextColor(this.styles.colors.primary[0], this.styles.colors.primary[1], this.styles.colors.primary[2]);
        doc.setFontSize(this.styles.fontSize.heading);
        doc.setFont(this.styles.fonts.heading, 'bold');
        doc.text('Payment Information', this.styles.spacing.margin, finalY);
        
        // Add payment info content with background
        this.helpers.roundedRect(
            doc, 
            this.styles.spacing.margin - 5, 
            finalY + 5, 
            doc.internal.pageSize.width - (this.styles.spacing.margin * 2) + 10, 
            15, 
            3, 
            [245, 245, 255]
        );
        
        // Add payment text
        doc.setTextColor(this.styles.colors.text[0], this.styles.colors.text[1], this.styles.colors.text[2]);
        doc.setFontSize(this.styles.fontSize.body);
        doc.setFont(this.styles.fonts.body, 'normal');
        doc.text('Please make payment by the due date.', this.styles.spacing.margin, finalY + 13);
        
        // Add notes section if available
        if (invoice.notes) {
            const notesY = finalY + 30;
            
            // Add notes title
            doc.setTextColor(this.styles.colors.primary[0], this.styles.colors.primary[1], this.styles.colors.primary[2]);
            doc.setFontSize(this.styles.fontSize.heading);
            doc.setFont(this.styles.fonts.heading, 'bold');
            doc.text('Notes', this.styles.spacing.margin, notesY);
            
            // Add notes content
            doc.setTextColor(this.styles.colors.text[0], this.styles.colors.text[1], this.styles.colors.text[2]);
            doc.setFontSize(this.styles.fontSize.body);
            doc.setFont(this.styles.fonts.body, 'normal');
            
            // Add light background for notes
            const splitNotes = doc.splitTextToSize(invoice.notes, doc.internal.pageSize.width - (this.styles.spacing.margin * 2));
            const notesHeight = splitNotes.length * 5 + 10;
            
            this.helpers.roundedRect(
                doc, 
                this.styles.spacing.margin - 5, 
                notesY + 5, 
                doc.internal.pageSize.width - (this.styles.spacing.margin * 2) + 10, 
                notesHeight, 
                3, 
                [245, 245, 255]
            );
            
            // Add notes text
            doc.text(splitNotes, this.styles.spacing.margin, notesY + 10);
        }
        
        // Add modern footer
        this.helpers.addModernFooter(doc, `Generated with HourFlow Premium | ${new Date().toLocaleDateString()}`);
        
        // Add a QR code for digital verification (simulated in 2025)
        doc.setFillColor(0, 0, 0);
        doc.rect(doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 30, 20, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(5);
        doc.text('VERIFIED', doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 20);
        doc.text('DIGITAL', doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 15);
        doc.text('2025', doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
        
        // Save PDF
        doc.save(`Invoice-${invoice.number}.pdf`);
        
        // Show notification
        showNotification('Invoice PDF generated successfully');
    }
};
