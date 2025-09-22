// Tab functionality
function openTab(tabName) {
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    const tablinks = document.getElementsByClassName("tablink");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(tabName).style.display = "block";
    event.currentTarget.className += " active";
    
    // Refresh data when switching tabs
    if (tabName === 'orders') loadOrders();
    if (tabName === 'payments') loadPayments();
    if (tabName === 'audit') loadAuditLogs();
}

// Load orders from API
async function loadOrders() {
    try {
        const response = await fetch('http://localhost:3001/payments/orders/all');
        const orders = await response.json();
        
        const tbody = document.querySelector('#ordersTable tbody');
        tbody.innerHTML = '';
        
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.order_id}</td>
                <td>${order.customer_id}</td>
                <td>${order.total_amount}</td>
                <td>${order.status}</td>
                <td>${new Date(order.created_at).toLocaleString()}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Load payments from API
async function loadPayments() {
    try {
        const response = await fetch('http://localhost:3001/payments/payments/all');
        const payments = await response.json();
        
        const tbody = document.querySelector('#paymentsTable tbody');
        tbody.innerHTML = '';
        
        payments.forEach(payment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${payment.payment_id}</td>
                <td>${payment.order_id}</td>
                <td>${payment.amount}</td>
                <td>${payment.status}</td>
                <td>${new Date(payment.payment_date).toLocaleString()}</td>
                <td>${payment.gateway_id}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading payments:', error);
    }
}

// Load audit logs from API
async function loadAuditLogs() {
    try {
        const response = await fetch('http://localhost:3001/payments/audit-logs/all');
        const logs = await response.json();
        
        const tbody = document.querySelector('#auditTable tbody');
        tbody.innerHTML = '';
        
        logs.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${log.log_id}</td>
                <td>${log.payment_id}</td>
                <td>${log.action}</td>
                <td>${log.old_status || 'N/A'}</td>
                <td>${log.new_status}</td>
                <td>${new Date(log.log_time).toLocaleString()}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading audit logs:', error);
    }
}

// Handle webhook form submission
document.getElementById('webhookForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        order_id: document.getElementById('order_id').value,
        amount: parseFloat(document.getElementById('amount').value),
        status: document.getElementById('status').value,
        gateway_id: document.getElementById('gateway_id').value
    };
    
    try {
        const response = await fetch('http://localhost:3001/webhook/payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-payment-signature': 'simulated-signature' // Simulated signature
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        document.getElementById('webhookResult').textContent = 
            response.ok ? `Success: ${JSON.stringify(result)}` : `Error: ${JSON.stringify(result)}`;
        
        // Refresh all data
        loadOrders();
        loadPayments();
        loadAuditLogs();
        
    } catch (error) {
        document.getElementById('webhookResult').textContent = `Error: ${error.message}`;
    }
});

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    
    // Set up polling for real-time updates
    setInterval(() => {
        const activeTab = document.querySelector('.tabcontent[style="display: block"]').id;
        if (activeTab === 'orders') loadOrders();
        if (activeTab === 'payments') loadPayments();
        if (activeTab === 'audit') loadAuditLogs();
    }, 5000); // Poll every 5 seconds
});