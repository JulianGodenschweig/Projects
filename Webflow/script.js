document.addEventListener('DOMContentLoaded', function() {
  // ========== INITIALIZATION ========== //
  
  // Simulate loading screen
  const loadingOverlay = document.querySelector('.loading-overlay');
  setTimeout(() => {
    loadingOverlay.classList.add('hidden');
  }, 1500);

  // Initialize client data from localStorage or empty array
  let clients = JSON.parse(localStorage.getItem('clients')) || [];
  
  // DOM Elements
  const sidebar = document.querySelector('.sidebar');
  const menuToggle = document.querySelector('.menu-toggle');
  const menuItems = document.querySelectorAll('.menu-item');
  const pageContents = document.querySelectorAll('.page-content');
  const newClientBtn = document.getElementById('new-client-btn');
  const emptyAddClientBtn = document.getElementById('empty-add-client');
  const tableAddClientBtn = document.getElementById('table-add-client');
  const clientModal = document.getElementById('client-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const cancelClientBtn = document.getElementById('cancel-client');
  const clientForm = document.getElementById('client-form');
  const clientSearch = document.getElementById('client-search');
  const clientsTableBody = document.getElementById('clients-table-body');
  const recentClientsList = document.getElementById('recent-clients-list');
  const totalClientsEl = document.getElementById('total-clients');
  const activeClientsEl = document.getElementById('active-clients');
  const totalValueEl = document.getElementById('total-value');

  // ========== SIDEBAR & NAVIGATION ========== //

  // Toggle sidebar on mobile
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });

  // Switch between dashboard pages
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const page = item.getAttribute('data-page');
      
      // Update active menu item
      menuItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      // Update page title
      document.querySelector('.page-title').textContent = 
        page.charAt(0).toUpperCase() + page.slice(1);
      
      // Show corresponding page with animation
      pageContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${page}-page`) {
          setTimeout(() => {
            content.classList.add('active');
          }, 50);
        }
      });
      
      // If going to clients page, refresh the list
      if (page === 'clients') {
        renderClients();
      }
    });
  });

  // ========== CLIENT MODAL ========== //

  // Open client modal from various buttons
  [newClientBtn, emptyAddClientBtn, tableAddClientBtn].forEach(btn => {
    btn.addEventListener('click', () => {
      clientModal.classList.add('active');
      document.getElementById('client-name').focus();
    });
  });

  // Close client modal
  [closeModalBtn, cancelClientBtn].forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      clientModal.classList.remove('active');
      clientForm.reset();
    });
  });

  // Close modal when clicking outside
  clientModal.addEventListener('click', (e) => {
    if (e.target === clientModal) {
      clientModal.classList.remove('active');
      clientForm.reset();
    }
  });

  // ========== CLIENT FORM ========== //

  // Handle form submission
  clientForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Show loading state
    const submitBtn = clientForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    // Simulate API call delay
    setTimeout(() => {
      // Get form values
      const newClient = {
        id: Date.now().toString(),
        name: document.getElementById('client-name').value.trim(),
        company: document.getElementById('client-company').value.trim(),
        email: document.getElementById('client-email').value.trim(),
        phone: document.getElementById('client-phone').value.trim(),
        status: document.getElementById('client-status').value,
        value: document.getElementById('client-value').value ? 
               parseInt(document.getElementById('client-value').value) : 0,
        notes: document.getElementById('client-notes').value.trim(),
        createdAt: new Date().toISOString()
      };
      
      // Add to clients array
      clients.unshift(newClient);
      saveClients();
      
      // Close modal and reset form
      clientModal.classList.remove('active');
      clientForm.reset();
      
      // Reset button state
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      
      // Update UI
      renderClients();
      renderRecentClients();
      updateStats();
      
      // Show success notification
      showNotification('Client added successfully!', 'success');
    }, 1000);
  });

  // ========== CLIENT SEARCH ========== //

  // Search clients with debounce
  let searchTimeout;
  clientSearch.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      renderClients();
    }, 300);
  });

  // ========== CLIENT MANAGEMENT ========== //

  // Save clients to localStorage
  function saveClients() {
    localStorage.setItem('clients', JSON.stringify(clients));
  }

  // Render clients table
  function renderClients() {
    const searchTerm = clientSearch.value.toLowerCase();
    const filteredClients = clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm) ||
      (client.company && client.company.toLowerCase().includes(searchTerm)) ||
      client.email.toLowerCase().includes(searchTerm)
    );
    
    if (filteredClients.length === 0) {
      clientsTableBody.innerHTML = `
        <tr class="empty-row">
          <td colspan="6">
            <div class="empty-state">
              <i class="fas fa-user-plus"></i>
              <p>No clients found</p>
              <button class="primary-btn" id="table-add-client">
                <i class="fas fa-plus"></i>
                Add New Client
              </button>
            </div>
          </td>
        </tr>
      `;
      // Re-add event listener to the new button
      document.getElementById('table-add-client').addEventListener('click', () => {
        clientModal.classList.add('active');
      });
      return;
    }
    
    clientsTableBody.innerHTML = filteredClients.map(client => `
      <tr class="animate__animated animate__fadeIn">
        <td>
          <div class="client-name">
            <strong>${client.name}</strong>
          </div>
        </td>
        <td>${client.company || '-'}</td>
        <td><a href="mailto:${client.email}">${client.email}</a></td>
        <td>${client.phone || '-'}</td>
        <td>
          <span class="status-badge status-${client.status}">
            ${client.status.charAt(0).toUpperCase() + client.status.slice(1)}
          </span>
        </td>
        <td>
          <div class="actions">
            <button class="action-btn view-btn" data-id="${client.id}">
              <i class="fas fa-eye"></i>
            </button>
            <button class="action-btn edit-btn" data-id="${client.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn" data-id="${client.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    
    // Add event listeners to action buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-id');
        viewClient(clientId);
      });
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-id');
        editClient(clientId);
      });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.currentTarget.getAttribute('data-id');
        deleteClient(clientId);
      });
    });
  }

  // Render recent clients in dashboard
  function renderRecentClients() {
    const recentClients = clients.slice(0, 5); // Get 5 most recent
    
    if (recentClients.length === 0) {
      recentClientsList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-user-plus"></i>
          <p>No clients added yet</p>
          <button class="primary-btn" id="empty-add-client">
            <i class="fas fa-plus"></i>
            Add Your First Client
          </button>
        </div>
      `;
      // Re-add event listener to the new button
      document.getElementById('empty-add-client').addEventListener('click', () => {
        clientModal.classList.add('active');
      });
      return;
    }
    
    recentClientsList.innerHTML = recentClients.map(client => `
      <div class="client-item animate__animated animate__fadeIn">
        <div class="client-avatar">
          ${client.name.charAt(0).toUpperCase()}
        </div>
        <div class="client-info">
          <h4>${client.name}</h4>
          <p>${client.company || 'No company'}</p>
        </div>
        <div class="client-status">
          <span class="status-badge status-${client.status}">
            ${client.status.charAt(0).toUpperCase() + client.status.slice(1)}
          </span>
        </div>
        <div class="client-value">
          $${client.value.toLocaleString() || '0'}
        </div>
      </div>
    `).join('');
  }

  // Update dashboard statistics
  function updateStats() {
    totalClientsEl.textContent = clients.length;
    
    const activeClients = clients.filter(client => client.status === 'active').length;
    activeClientsEl.textContent = activeClients;
    
    const totalValue = clients.reduce((sum, client) => sum + (client.value || 0), 0);
    totalValueEl.textContent = `$${totalValue.toLocaleString()}`;
  }

  // View client details
  function viewClient(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    // In a real app, this would open a detailed view modal
    showNotification(`Viewing ${client.name}`, 'info');
  }

  // Edit client
  function editClient(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    // Fill form with client data
    document.getElementById('client-name').value = client.name;
    document.getElementById('client-company').value = client.company || '';
    document.getElementById('client-email').value = client.email;
    document.getElementById('client-phone').value = client.phone || '';
    document.getElementById('client-status').value = client.status;
    document.getElementById('client-value').value = client.value || '';
    document.getElementById('client-notes').value = client.notes || '';
    
    // Open modal
    clientModal.classList.add('active');
    
    // Change form to edit mode
    const formHeader = document.querySelector('.modal-header h3');
    formHeader.textContent = 'Edit Client';
    
    // Update form submit handler
    clientForm.removeEventListener('submit', handleEditSubmit);
    clientForm.addEventListener('submit', handleEditSubmit);
    
    function handleEditSubmit(e) {
      e.preventDefault();
      
      // Show loading state
      const submitBtn = clientForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
      submitBtn.disabled = true;
      
      setTimeout(() => {
        // Update client data
        client.name = document.getElementById('client-name').value.trim();
        client.company = document.getElementById('client-company').value.trim();
        client.email = document.getElementById('client-email').value.trim();
        client.phone = document.getElementById('client-phone').value.trim();
        client.status = document.getElementById('client-status').value;
        client.value = document.getElementById('client-value').value ? 
                      parseInt(document.getElementById('client-value').value) : 0;
        client.notes = document.getElementById('client-notes').value.trim();
        
        saveClients();
        
        // Close modal and reset form
        clientModal.classList.remove('active');
        clientForm.reset();
        
        // Reset button state
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        
        // Reset form header
        formHeader.textContent = 'Create New Client';
        
        // Update UI
        renderClients();
        renderRecentClients();
        updateStats();
        
        // Show success notification
        showNotification('Client updated successfully!', 'success');
        
        // Remove the edit handler
        clientForm.removeEventListener('submit', handleEditSubmit);
      }, 1000);
    }
  }

  // Delete client
  function deleteClient(clientId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this client?')) return;
    
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    // Show loading on the delete button
    const deleteBtn = document.querySelector(`.delete-btn[data-id="${clientId}"]`);
    const originalBtnHTML = deleteBtn.innerHTML;
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    deleteBtn.disabled = true;
    
    setTimeout(() => {
      // Remove client from array
      clients = clients.filter(c => c.id !== clientId);
      saveClients();
      
      // Update UI
      renderClients();
      renderRecentClients();
      updateStats();
      
      // Show success notification
      showNotification('Client deleted successfully!', 'danger');
    }, 800);
  }

  // ========== NOTIFICATIONS ========== //

  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} animate__animated animate__fadeInRight`;
    notification.innerHTML = `
      <div class="notification-icon">
        ${type === 'success' ? '<i class="fas fa-check-circle"></i>' : 
         type === 'danger' ? '<i class="fas fa-exclamation-circle"></i>' : 
         '<i class="fas fa-info-circle"></i>'}
      </div>
      <div class="notification-message">${message}</div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('animate__fadeOutRight');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 5000);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.classList.add('animate__fadeOutRight');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
  }

  // ========== INITIAL RENDER ========== //

  // Initial render of all components
  renderClients();
  renderRecentClients();
  updateStats();
});

// ========== ANALYTICS FUNCTIONS ========== //

// Initialize analytics page
function initAnalytics() {
  renderTeamPresence();
  renderActivityChart();
  renderRecentMessages();
}

// Render team presence list
function renderTeamPresence() {
  const teamList = document.getElementById('team-list');
  const onlineCount = document.getElementById('online-count');
  
  // Simulated team data - in a real app, this would come from your backend
  const teamMembers = [
    { id: '1', name: 'Alex Johnson', role: 'Developer', status: 'active', initials: 'AJ' },
    { id: '2', name: 'Sarah Williams', role: 'Designer', status: 'online', initials: 'SW' },
    { id: '3', name: 'Michael Brown', role: 'Manager', status: 'away', initials: 'MB' },
    { id: '4', name: 'Emily Davis', role: 'Marketing', status: 'offline', initials: 'ED' }
  ];
  
  const onlineMembers = teamMembers.filter(member => member.status !== 'offline');
  
  if (onlineMembers.length === 0) {
    teamList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-user-clock"></i>
        <p>No team members online</p>
      </div>
    `;
    onlineCount.textContent = '0';
    return;
  }
  
  teamList.innerHTML = onlineMembers.map(member => `
    <div class="team-member animate__animated animate__fadeIn">
      <div class="team-avatar">
        ${member.initials}
        <span class="status-indicator status-${member.status}"></span>
      </div>
      <div class="team-info">
        <div class="team-name">${member.name}</div>
        <div class="team-role">${member.role}</div>
      </div>
      <button class="action-btn chat-btn" data-id="${member.id}">
        <i class="fas fa-comment-dots"></i>
      </button>
    </div>
  `).join('');
  
  onlineCount.textContent = onlineMembers.length;
  
  // Add event listeners to chat buttons
  document.querySelectorAll('.chat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const memberId = e.currentTarget.getAttribute('data-id');
      const member = teamMembers.find(m => m.id === memberId);
      if (member) {
        showNotification(`Opening chat with ${member.name}`, 'info');
      }
    });
  });
}

// Render activity chart
function renderActivityChart() {
  const ctx = document.getElementById('activity-chart').getContext('2d');
  
  // Simulated chart data - in a real app, this would come from your backend
  const chartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [
      {
        label: 'Online',
        data: [5, 8, 12, 15, 10, 7],
        backgroundColor: 'rgba(76, 201, 240, 0.2)',
        borderColor: 'rgba(76, 201, 240, 1)',
        borderWidth: 2,
        tension: 0.4
      },
      {
        label: 'Active',
        data: [2, 5, 8, 10, 7, 4],
        backgroundColor: 'rgba(67, 97, 238, 0.2)',
        borderColor: 'rgba(67, 97, 238, 1)',
        borderWidth: 2,
        tension: 0.4
      },
      {
        label: 'Away',
        data: [1, 2, 3, 2, 3, 2],
        backgroundColor: 'rgba(248, 150, 30, 0.2)',
        borderColor: 'rgba(248, 150, 30, 1)',
        borderWidth: 2,
        tension: 0.4
      }
    ]
  };
  
  new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
        },
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
        }
      },
      elements: {
        point: {
          radius: 0,
          hoverRadius: 6
        }
      }
    }
  });
}

// Render recent messages
function renderRecentMessages() {
  const messagesList = document.getElementById('messages-list');
  
  // Simulated messages - in a real app, this would come from your backend
  const messages = [
    {
      id: '1',
      sender: 'Alex Johnson',
      time: '10:30 AM',
      text: 'Hey team, just pushed the latest updates to the staging server.',
      initials: 'AJ'
    },
    {
      id: '2',
      sender: 'Sarah Williams',
      time: '10:32 AM',
      text: 'Thanks Alex! I\'ll review the design changes now.',
      initials: 'SW'
    },
    {
      id: '3',
      sender: 'Michael Brown',
      time: '10:45 AM',
      text: 'Client meeting at 2PM today. Please have your updates ready.',
      initials: 'MB'
    }
  ];
  
  if (messages.length === 0) {
    messagesList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-comment-alt"></i>
        <p>No recent messages</p>
      </div>
    `;
    return;
  }
  
  messagesList.innerHTML = messages.map(msg => `
    <div class="message-item animate__animated animate__fadeIn">
      <div class="message-avatar">${msg.initials}</div>
      <div class="message-content">
        <div class="message-header">
          <span class="message-sender">${msg.sender}</span>
          <span class="message-time">${msg.time}</span>
        </div>
        <div class="message-text">${msg.text}</div>
      </div>
    </div>
  `).join('');
}

// Update the initialization to include analytics
document.addEventListener('DOMContentLoaded', function() {
  // ... (previous initialization code)

  // Add analytics initialization
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      // ... (previous code)
      
      // If going to analytics page, initialize it
      if (page === 'analytics') {
        initAnalytics();
      }
    });
  });

  // Initialize analytics if that's the current page
  if (document.querySelector('.menu-item[data-page="analytics"].active')) {
    initAnalytics();
  }
});