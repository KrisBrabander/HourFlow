const revenueManager = {
    // Initialize revenue manager
    init: function() {
        console.log('Initializing revenue manager...');
        
        // Initialize revenue chart
        this.initRevenueChart();
        
        // Update revenue stats
        this.updateRevenueStats();
        
        console.log('Revenue manager initialized successfully');
    },
    
    // Initialize revenue chart
    initRevenueChart: function() {
        // Get the current year
        const currentYear = new Date().getFullYear();
        
        // Populate year select
        const yearSelect = document.getElementById('revenue-year-select');
        if (yearSelect) {
            // Clear existing options
            yearSelect.innerHTML = '';
            
            // Add options for the last 5 years
            for (let i = 0; i < 5; i++) {
                const year = currentYear - i;
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            }
            
            // Add event listener
            yearSelect.addEventListener('change', () => {
                this.renderRevenueChart(yearSelect.value);
            });
        }
        
        // Render chart for current year
        this.renderRevenueChart(currentYear);
    },
    
    // Render revenue chart
    renderRevenueChart: function(year) {
        // Get revenue data
        const revenueData = this.getRevenueDataByYear(year);
        
        // Get chart container
        const chartContainer = document.getElementById('revenue-chart');
        if (!chartContainer) return;
        
        // Clear chart container
        chartContainer.innerHTML = '';
        
        // If no data, show message
        if (revenueData.every(item => item.amount === 0)) {
            chartContainer.innerHTML = '<div class="no-data">No revenue data available for ' + year + '</div>';
            chartContainer.style.display = 'flex';
            chartContainer.style.justifyContent = 'center';
            chartContainer.style.alignItems = 'center';
            chartContainer.style.height = '300px';
            chartContainer.style.color = 'var(--medium)';
            chartContainer.style.fontSize = '1.2rem';
            return;
        }
        
        // Create chart elements
        const chartSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        chartSvg.setAttribute('width', '100%');
        chartSvg.setAttribute('height', '100%');
        chartSvg.style.overflow = 'visible';
        chartContainer.appendChild(chartSvg);
        
        // Chart dimensions
        const margin = { top: 30, right: 30, bottom: 50, left: 60 };
        const width = chartContainer.clientWidth - margin.left - margin.right;
        const height = chartContainer.clientHeight - margin.top - margin.bottom;
        
        // Create chart group
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${margin.left},${margin.top})`);
        chartSvg.appendChild(g);
        
        // X scale
        const xScale = this.createXScale(revenueData, width);
        
        // Y scale
        const maxRevenue = Math.max(...revenueData.map(d => d.amount));
        const yScale = this.createYScale(maxRevenue, height);
        
        // Create axes
        this.createXAxis(g, xScale, height);
        this.createYAxis(g, yScale);
        
        // Create bars
        this.createBars(g, revenueData, xScale, yScale, height);
        
        // Create line
        this.createLine(g, revenueData, xScale, yScale);
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.display = 'none';
        tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '8px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '12px';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '100';
        chartContainer.appendChild(tooltip);
        
        // Add tooltip event listeners
        const bars = g.querySelectorAll('.bar');
        bars.forEach((bar, i) => {
            bar.addEventListener('mouseover', (e) => {
                const data = revenueData[i];
                tooltip.innerHTML = `
                    <div><strong>${data.month}</strong></div>
                    <div>Revenue: ${this.formatCurrency(data.amount)}</div>
                `;
                tooltip.style.display = 'block';
                tooltip.style.left = `${e.pageX - chartContainer.getBoundingClientRect().left}px`;
                tooltip.style.top = `${e.pageY - chartContainer.getBoundingClientRect().top - 40}px`;
                
                // Highlight bar
                bar.style.opacity = '0.8';
            });
            
            bar.addEventListener('mousemove', (e) => {
                tooltip.style.left = `${e.pageX - chartContainer.getBoundingClientRect().left}px`;
                tooltip.style.top = `${e.pageY - chartContainer.getBoundingClientRect().top - 40}px`;
            });
            
            bar.addEventListener('mouseout', () => {
                tooltip.style.display = 'none';
                bar.style.opacity = '0.6';
            });
        });
    },
    
    // Create X scale
    createXScale: function(data, width) {
        const months = data.map(d => d.month);
        const xScale = {};
        xScale.domain = months;
        xScale.range = [0, width];
        xScale.bandwidth = width / months.length;
        xScale.scale = function(month) {
            return xScale.range[0] + xScale.domain.indexOf(month) * xScale.bandwidth + xScale.bandwidth / 2;
        };
        return xScale;
    },
    
    // Create Y scale
    createYScale: function(maxValue, height) {
        const yScale = {};
        yScale.domain = [0, maxValue * 1.1]; // Add 10% padding
        yScale.range = [height, 0];
        yScale.scale = function(value) {
            return yScale.range[0] - (value / yScale.domain[1]) * (yScale.range[0] - yScale.range[1]);
        };
        return yScale;
    },
    
    // Create X axis
    createXAxis: function(g, xScale, height) {
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        xAxis.setAttribute('transform', `translate(0,${height})`);
        g.appendChild(xAxis);
        
        // Add axis line
        const axisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        axisLine.setAttribute('x1', 0);
        axisLine.setAttribute('y1', 0);
        axisLine.setAttribute('x2', xScale.range[1]);
        axisLine.setAttribute('y2', 0);
        axisLine.setAttribute('stroke', '#ccc');
        xAxis.appendChild(axisLine);
        
        // Add ticks and labels
        xScale.domain.forEach((month, i) => {
            const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            const x = i * xScale.bandwidth + xScale.bandwidth / 2;
            tick.setAttribute('x1', x);
            tick.setAttribute('y1', 0);
            tick.setAttribute('x2', x);
            tick.setAttribute('y2', 6);
            tick.setAttribute('stroke', '#ccc');
            xAxis.appendChild(tick);
            
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', x);
            label.setAttribute('y', 20);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('font-size', '12px');
            label.setAttribute('fill', '#666');
            label.textContent = month.substring(0, 3); // Abbreviate month names
            xAxis.appendChild(label);
        });
    },
    
    // Create Y axis
    createYAxis: function(g, yScale) {
        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.appendChild(yAxis);
        
        // Add axis line
        const axisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        axisLine.setAttribute('x1', 0);
        axisLine.setAttribute('y1', 0);
        axisLine.setAttribute('x2', 0);
        axisLine.setAttribute('y2', yScale.range[0]);
        axisLine.setAttribute('stroke', '#ccc');
        yAxis.appendChild(axisLine);
        
        // Add ticks and labels
        const numTicks = 5;
        for (let i = 0; i <= numTicks; i++) {
            const value = (yScale.domain[1] / numTicks) * i;
            const y = yScale.scale(value);
            
            const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tick.setAttribute('x1', 0);
            tick.setAttribute('y1', y);
            tick.setAttribute('x2', -6);
            tick.setAttribute('y2', y);
            tick.setAttribute('stroke', '#ccc');
            yAxis.appendChild(tick);
            
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', -10);
            label.setAttribute('y', y + 4);
            label.setAttribute('text-anchor', 'end');
            label.setAttribute('font-size', '12px');
            label.setAttribute('fill', '#666');
            label.textContent = this.formatCurrency(value);
            yAxis.appendChild(label);
            
            // Add grid line
            const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            gridLine.setAttribute('x1', 0);
            gridLine.setAttribute('y1', y);
            gridLine.setAttribute('x2', xScale.range[1]);
            gridLine.setAttribute('y2', y);
            gridLine.setAttribute('stroke', '#eee');
            gridLine.setAttribute('stroke-dasharray', '3,3');
            yAxis.appendChild(gridLine);
        }
    },
    
    // Create bars
    createBars: function(g, data, xScale, yScale, height) {
        data.forEach((d, i) => {
            const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bar.setAttribute('class', 'bar');
            bar.setAttribute('x', i * xScale.bandwidth + xScale.bandwidth * 0.2);
            bar.setAttribute('y', yScale.scale(d.amount));
            bar.setAttribute('width', xScale.bandwidth * 0.6);
            bar.setAttribute('height', height - yScale.scale(d.amount));
            bar.setAttribute('fill', 'var(--primary-light)');
            bar.setAttribute('opacity', '0.6');
            bar.setAttribute('rx', '4');
            g.appendChild(bar);
        });
    },
    
    // Create line
    createLine: function(g, data, xScale, yScale) {
        let pathData = '';
        
        data.forEach((d, i) => {
            const x = i * xScale.bandwidth + xScale.bandwidth / 2;
            const y = yScale.scale(d.amount);
            
            if (i === 0) {
                pathData += `M ${x} ${y}`;
            } else {
                pathData += ` L ${x} ${y}`;
            }
            
            // Add circle at each data point
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', 4);
            circle.setAttribute('fill', 'var(--primary)');
            g.appendChild(circle);
        });
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'var(--primary)');
        path.setAttribute('stroke-width', 2);
        g.appendChild(path);
    },
    
    // Get revenue data by year
    getRevenueDataByYear: function(year) {
        // Get revenue data from user-specific storage
        let revenue = [];
        try {
            // Use userStorage instead of direct localStorage
            revenue = userStorage.getJSON('revenue', []);
            if (!Array.isArray(revenue)) revenue = [];
        } catch (e) {
            console.error('Error loading revenue from user storage:', e);
            revenue = [];
        }
        
        // Filter revenue by year
        const filteredRevenue = revenue.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate.getFullYear() === parseInt(year);
        });
        
        // Create monthly data
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const monthlyData = months.map(month => {
            return {
                month: month,
                amount: 0
            };
        });
        
        // Aggregate revenue by month
        filteredRevenue.forEach(item => {
            const itemDate = new Date(item.date);
            const monthIndex = itemDate.getMonth();
            monthlyData[monthIndex].amount += parseFloat(item.amount);
        });
        
        return monthlyData;
    },
    
    // Update revenue stats
    updateRevenueStats: function() {
        console.log('Updating revenue stats...');
        
        // Get revenue data from localStorage
        let revenue = [];
        try {
            revenue = JSON.parse(localStorage.getItem('revenue') || '[]');
            if (!Array.isArray(revenue)) revenue = [];
        } catch (e) {
            console.error('Error loading revenue from localStorage:', e);
            revenue = [];
        }
        
        console.log('Revenue data loaded:', revenue);
        
        // Calculate total revenue
        const totalRevenue = revenue.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        console.log('Total revenue calculated:', totalRevenue);
        
        // Update total revenue in dashboard
        const totalRevenueElement = document.getElementById('total-revenue');
        if (totalRevenueElement) {
            totalRevenueElement.textContent = this.formatCurrency(totalRevenue);
            console.log('Total revenue updated in dashboard:', this.formatCurrency(totalRevenue));
        } else {
            console.error('Total revenue element not found in dashboard');
        }
    },
    
    // Format currency
    formatCurrency: function(amount) {
        // Gebruik app.formatCurrency als het beschikbaar is, anders eigen implementatie
        if (window.app && typeof app.formatCurrency === 'function') {
            return app.formatCurrency(amount);
        }
        // Fallback naar eigen implementatie
        return '$' + parseFloat(amount || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    },
    
    // Add revenue
    addRevenue: function(invoiceId, amount, date) {
        console.log('Adding revenue for invoice:', invoiceId, 'amount:', amount);
        
        // Get revenue data from user-specific storage
        let revenue = [];
        try {
            // Use userStorage instead of direct localStorage
            revenue = userStorage.getJSON('revenue', []);
            if (!Array.isArray(revenue)) revenue = [];
        } catch (e) {
            console.error('Error loading revenue from user storage:', e);
            revenue = [];
        }
        
        // Ensure amount is a valid number
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) {
            console.error('Invalid amount:', amount);
            return null;
        }
        
        // Create new revenue item
        const newRevenue = {
            id: this.generateId(),
            invoiceId: invoiceId,
            amount: parsedAmount,
            date: date || new Date().toISOString(),
            timestamp: Date.now()
        };
        
        console.log('New revenue item created:', newRevenue);
        
        // Add to revenue array
        revenue.push(newRevenue);
        
        // Save to user-specific storage
        try {
            // Use userStorage instead of direct localStorage
            userStorage.setJSON('revenue', revenue);
            console.log('Revenue saved to user storage successfully');
        } catch (e) {
            console.error('Error saving revenue to user storage:', e);
        }
        
        // Update revenue stats
        this.updateRevenueStats();
        
        // Update revenue chart
        const currentYear = new Date().getFullYear();
        this.renderRevenueChart(currentYear);
        
        return newRevenue;
    },
    
    // Generate ID
    generateId: function() {
        return 'rev_' + Math.random().toString(36).substr(2, 9);
    }
};

// Initialize revenue manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a short time to ensure all other scripts are loaded
    setTimeout(function() {
        // Check if we need to migrate existing revenue data
        if (typeof userStorage !== 'undefined') {
            // Migrate revenue data from global to user-specific storage
            userStorage.migrateData(['revenue']);
        } else {
            console.error('userStorage module not found, cannot migrate revenue data');
        }
        
        console.log('Revenue manager initializing from DOMContentLoaded event');
        if (typeof revenueManager !== 'undefined') {
            revenueManager.init();
        } else {
            console.error('Revenue manager is not defined');
        }
    }, 500);
});

// Zorg ervoor dat de revenue manager ook wordt geïnitialiseerd als de pagina al is geladen
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
        console.log('Revenue manager initializing immediately (page already loaded)');
        if (typeof revenueManager !== 'undefined') {
            revenueManager.init();
        } else {
            console.error('Revenue manager is not defined');
        }
    }, 300);
}
