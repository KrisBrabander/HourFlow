// Client Manager - Handles all client-related functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Client Manager initialized');
    
    // Get DOM elements
    const addClientBtn = document.getElementById('add-client-btn');
    const clientForm = document.querySelector('.client-form');
    const closeClientFormBtn = document.querySelector('.close-client-form');
    const clientFormElement = document.getElementById('client-form');
    
    // Log elements to debug
    console.log('Add Client Button:', addClientBtn);
    console.log('Client Form:', clientForm);
    console.log('Close Button:', closeClientFormBtn);
    console.log('Form Element:', clientFormElement);
    
    // Add event listener to Add Client button
    if (addClientBtn) {
        addClientBtn.addEventListener('click', function() {
            console.log('Add Client button clicked');
            if (clientForm) {
                clientForm.style.display = 'block';
            } else {
                console.error('Client form not found');
            }
        });
    } else {
        console.error('Add Client button not found');
    }
    
    // Add event listener to Close button
    if (closeClientFormBtn) {
        closeClientFormBtn.addEventListener('click', function() {
            console.log('Close button clicked');
            clientForm.style.display = 'none';
        });
    }
    
    // Add event listener to client form submission
    if (clientFormElement) {
        clientFormElement.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Form submitted');
            
            // Get form data
            const clientName = document.getElementById('client-name').value;
            const clientEmail = document.getElementById('client-email').value;
            const clientPhone = document.getElementById('client-phone').value;
            const clientAddress = document.getElementById('client-address').value;
            
            // Create new client object
            const newClient = {
                id: generateId(),
                name: clientName,
                email: clientEmail,
                phone: clientPhone,
                address: clientAddress,
                dateAdded: new Date().toISOString()
            };
            
            // Add client to state
            const clients = JSON.parse(localStorage.getItem('clients') || '[]');
            clients.push(newClient);
            
            // Save data
            localStorage.setItem('clients', JSON.stringify(clients));
            
            // Reset form
            clientFormElement.reset();
            
            // Hide form
            clientForm.style.display = 'none';
            
            // Show notification
            showNotification('Client added successfully!');
            
            // Refresh client list if on clients page
            if (document.querySelector('.clients-list')) {
                renderClientsList();
            }
        });
    }
    
    // Initial render of clients list
    if (document.querySelector('.clients-list')) {
        renderClientsList();
    }
});

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.className = 'notification show';
        
        if (type === 'error') {
            notification.classList.add('error');
        }
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Render clients list
function renderClientsList() {
    const clientsList = document.querySelector('.clients-list');
    if (!clientsList) return;
    
    // Get clients from localStorage
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    
    // Clear existing list
    clientsList.innerHTML = '';
    
    // Check if there are clients
    if (clients.length === 0) {
        clientsList.innerHTML = '<div class="empty-state">No clients added yet</div>';
        return;
    }
    
    // Render each client
    clients.forEach(client => {
        const clientCard = document.createElement('div');
        clientCard.className = 'client-card';
        clientCard.innerHTML = `
            <div class="client-card-header">
                <h3>${client.name}</h3>
                <div class="client-actions">
                    <button class="btn-icon edit-client" data-id="${client.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-client" data-id="${client.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="client-card-body">
                <p><i class="fas fa-envelope"></i> ${client.email || 'No email'}</p>
                <p><i class="fas fa-phone"></i> ${client.phone || 'No phone'}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${client.address || 'No address'}</p>
            </div>
        `;
        
        clientsList.appendChild(clientCard);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-client').forEach(btn => {
        btn.addEventListener('click', function() {
            const clientId = this.getAttribute('data-id');
            // Implement edit functionality
            console.log('Edit client:', clientId);
        });
    });
    
    document.querySelectorAll('.delete-client').forEach(btn => {
        btn.addEventListener('click', function() {
            const clientId = this.getAttribute('data-id');
            // Implement delete functionality
            if (confirm('Are you sure you want to delete this client?')) {
                const clients = JSON.parse(localStorage.getItem('clients') || '[]');
                const updatedClients = clients.filter(client => client.id !== clientId);
                localStorage.setItem('clients', JSON.stringify(updatedClients));
                renderClientsList();
                showNotification('Client deleted successfully!');
            }
        });
    });
}
