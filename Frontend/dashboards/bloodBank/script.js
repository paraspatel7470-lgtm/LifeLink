// LifeLink Blood Bank Dashboard JavaScript
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
if (!token || role !== "bloodbank") {
  window.location.href = "../../auth/login.html";
}



// DOM Elements
const notificationBtn = document.getElementById('notificationBtn');
const notificationDropdown = document.querySelector('.notification-dropdown-content');
const profileBtn = document.getElementById('profileBtn');
const profileDropdown = document.querySelector('.profile-dropdown-content');
const logoutBtn = document.getElementById('logoutBtn');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navRight = document.querySelector('.nav-right');
const tabButtons = document.querySelectorAll('.tab-btn');
const pages = document.querySelectorAll('.page');
const inventoryBadge = document.getElementById('inventoryBadge');
const sosBadge = document.getElementById('sosBadge');
const bloodCardsGrid = document.getElementById('bloodCardsGrid');
const inventoryTableBody = document.getElementById('inventoryTableBody');
const sosTableBody = document.getElementById('sosTableBody');
const dispatchList = document.getElementById('dispatchList');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseFilesBtn = document.getElementById('browseFilesBtn');
const profileForm = document.getElementById('profileForm');
const resetFormBtn = document.getElementById('resetFormBtn');
const modal = document.getElementById('bloodUnitModal');
const modalClose = document.getElementById('modalClose');
const cancelUpdateBtn = document.getElementById('cancelUpdateBtn');

// State
let currentBloodGroup = null;
let bloodInventory = [
    { group: 'A+', units: 32, minRequired: 20, status: 'adequate', lastUpdated: '2 hours ago' },
    { group: 'A-', units: 8, minRequired: 15, status: 'critical', lastUpdated: '1 hour ago' },
    { group: 'B+', units: 25, minRequired: 20, status: 'adequate', lastUpdated: '3 hours ago' },
    { group: 'B-', units: 12, minRequired: 15, status: 'low', lastUpdated: '4 hours ago' },
    { group: 'O+', units: 45, minRequired: 30, status: 'adequate', lastUpdated: '30 min ago' },
    { group: 'O-', units: 5, minRequired: 20, status: 'critical', lastUpdated: '10 min ago' },
    { group: 'AB+', units: 15, minRequired: 10, status: 'adequate', lastUpdated: '5 hours ago' },
    { group: 'AB-', units: 3, minRequired: 8, status: 'critical', lastUpdated: '2 hours ago' }
];

let sosRequests = [
    {
        id: 'SOS-2023-001',
        hospital: 'City General Hospital',
        bloodGroup: 'O-',
        units: 2,
        urgency: 'critical',
        time: '10 min ago',
        status: 'pending'
    },
    {
        id: 'SOS-2023-002',
        hospital: 'Metro Medical Center',
        bloodGroup: 'A-',
        units: 3,
        urgency: 'high',
        time: '25 min ago',
        status: 'pending'
    },
    {
        id: 'SOS-2023-003',
        hospital: 'Saint Mary Hospital',
        bloodGroup: 'B+',
        units: 2,
        urgency: 'medium',
        time: '1 hour ago',
        status: 'confirmed'
    },
    {
        id: 'SOS-2023-004',
        hospital: 'Children Medical Institute',
        bloodGroup: 'AB+',
        units: 1,
        urgency: 'low',
        time: '2 hours ago',
        status: 'confirmed'
    }
];

let dispatchItems = [
    {
        id: 'SOS-2023-003',
        hospital: 'Saint Mary Hospital',
        bloodGroup: 'B+',
        units: 2,
        status: 'preparing'
    },
    {
        id: 'SOS-2023-004',
        hospital: 'Children Medical Institute',
        bloodGroup: 'AB+',
        units: 1,
        status: 'ready'
    }
];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Initialize blood inventory
    renderBloodCards();
    renderInventoryTable();
    updateInventoryBadge();
    
    // Initialize SOS requests
    renderSOSTable();
    updateSOSBadge();
    
    // Initialize dispatch items
    renderDispatchList();
    
    // Initialize critical alerts
    renderCriticalAlerts();
    
    // Initialize blood status grid
    renderBloodStatusGrid();
    
    // Initialize recent SOS requests
    renderRecentSOS();
});

// Mobile Menu Toggle
mobileMenuBtn.addEventListener('click', function() {
    navRight.classList.toggle('mobile-show');
    this.classList.toggle('active');
});

// Close mobile menu when clicking outside
document.addEventListener('click', function(e) {
    if (!mobileMenuBtn.contains(e.target) && !navRight.contains(e.target)) {
        navRight.classList.remove('mobile-show');
        mobileMenuBtn.classList.remove('active');
    }
});

// Toggle dropdowns
notificationBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    notificationDropdown.classList.toggle('show');
    profileDropdown.classList.remove('show');
});

profileBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    profileDropdown.classList.toggle('show');
    notificationDropdown.classList.remove('show');
});

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
        notificationDropdown.classList.remove('show');
    }
    
    if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
        profileDropdown.classList.remove('show');
    }
});

// Logout functionality
logoutBtn.addEventListener('click', function(e) {
    e.preventDefault();
    if (confirm('Are you sure you want to logout?')) {
        showToast('Logout successful. Redirecting to login...', 'success');
        // In real app: window.location.href = 'login.html';
    }
});

// Tab navigation
tabButtons.forEach(button => {
    button.addEventListener('click', function() {
        const pageId = this.dataset.page + '-page';
        
        // Update active tab
        tabButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Show selected page
        pages.forEach(page => {
            page.classList.remove('active');
            if (page.id === pageId) {
                page.classList.add('active');
            }
        });
    });
});

// Mark all notifications as read
document.querySelector('.mark-read')?.addEventListener('click', function() {
    const unreadItems = document.querySelectorAll('.notification-item.unread');
    unreadItems.forEach(item => item.classList.remove('unread'));
    
    // Update notification badge
    const badge = document.querySelector('.notification-badge');
    badge.textContent = '0';
    badge.style.display = 'none';
    
    showToast('All notifications marked as read', 'success');
});

// Update inventory badge based on critical levels
function updateInventoryBadge() {
    if (!inventoryBadge) return;
    
    const criticalCount = bloodInventory.filter(item => item.status === 'critical').length;
    inventoryBadge.textContent = criticalCount;
    
    if (criticalCount === 0) {
        inventoryBadge.classList.remove('critical');
        inventoryBadge.style.display = 'none';
    } else {
        inventoryBadge.classList.add('critical');
        inventoryBadge.style.display = 'inline-flex';
    }
}

// Update SOS badge
function updateSOSBadge() {
    if (!sosBadge) return;
    
    const pendingCount = sosRequests.filter(req => req.status === 'pending').length;
    sosBadge.textContent = pendingCount;
    
    if (pendingCount === 0) {
        sosBadge.style.display = 'none';
    } else {
        sosBadge.style.display = 'inline-flex';
    }
}

// Render blood cards
function renderBloodCards() {
    if (!bloodCardsGrid) return;
    
    bloodCardsGrid.innerHTML = '';
    
    bloodInventory.forEach(item => {
        const card = document.createElement('div');
        card.className = `blood-card ${item.status}`;
        card.innerHTML = `
            <div class="blood-card-header">
                <div class="blood-card-group">${item.group}</div>
                <div class="status-badge ${item.status}">${item.status}</div>
            </div>
            <div class="blood-card-units">
                <div class="units-value">${item.units}</div>
                <div class="units-label">Units Available</div>
            </div>
            <div class="blood-card-actions">
                <button class="action-btn remove-btn" data-group="${item.group}">
                    <i class="fas fa-minus"></i> Remove
                </button>
                <button class="action-btn add-btn" data-group="${item.group}">
                    <i class="fas fa-plus"></i> Add
                </button>
            </div>
            <div class="blood-card-updated">
                Updated ${item.lastUpdated}
            </div>
        `;
        
        bloodCardsGrid.appendChild(card);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const group = this.dataset.group;
            const isAdd = this.classList.contains('add-btn');
            openBloodModal(group, isAdd);
        });
    });
}

// Render inventory table
function renderInventoryTable() {
    if (!inventoryTableBody) return;
    
    inventoryTableBody.innerHTML = '';
    
    bloodInventory.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${item.group}</strong></td>
            <td>${item.units} units</td>
            <td>${item.minRequired} units</td>
            <td><span class="status-badge ${item.status}">${item.status}</span></td>
            <td>${item.lastUpdated}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-outline btn-sm" data-group="${item.group}" data-action="add">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-outline btn-sm" data-group="${item.group}" data-action="remove">
                        <i class="fas fa-minus"></i>
                    </button>
                </div>
            </td>
        `;
        
        inventoryTableBody.appendChild(row);
    });
    
    // Add event listeners to table action buttons
    document.querySelectorAll('.table-actions button').forEach(btn => {
        btn.addEventListener('click', function() {
            const group = this.dataset.group;
            const action = this.dataset.action;
            openBloodModal(group, action === 'add');
        });
    });
}

// Render critical alerts
function renderCriticalAlerts() {
    const alertsList = document.getElementById('criticalAlertsList');
    const noAlerts = document.getElementById('noCriticalAlerts');
    
    if (!alertsList) return;
    
    const criticalItems = bloodInventory.filter(item => item.status === 'critical');
    
    if (criticalItems.length === 0) {
        alertsList.style.display = 'none';
        noAlerts.style.display = 'block';
        return;
    }
    
    alertsList.style.display = 'flex';
    noAlerts.style.display = 'none';
    alertsList.innerHTML = '';
    
    criticalItems.forEach(item => {
        const alert = document.createElement('div');
        alert.className = 'alert-item';
        alert.innerHTML = `
            <div class="alert-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="alert-content">
                <h4>${item.group} Blood Level Critical</h4>
                <p>Only ${item.units} units available (minimum required: ${item.minRequired})</p>
            </div>
            <div class="alert-action">
                <button class="btn btn-primary btn-sm" data-group="${item.group}" data-action="add">
                    Add Units
                </button>
            </div>
        `;
        
        alertsList.appendChild(alert);
    });
    
    // Add event listeners to alert action buttons
    document.querySelectorAll('.alert-action button').forEach(btn => {
        btn.addEventListener('click', function() {
            const group = this.dataset.group;
            openBloodModal(group, true);
        });
    });
}

// Render blood status grid
function renderBloodStatusGrid() {
    const grid = document.getElementById('bloodStatusGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    bloodInventory.forEach(item => {
        const statusItem = document.createElement('div');
        statusItem.className = 'blood-status-item';
        statusItem.innerHTML = `
            <div class="blood-group-header">
                <div class="blood-group">${item.group}</div>
                <div class="blood-status ${item.status}">${item.status}</div>
            </div>
            <div class="blood-units">${item.units}</div>
            <div class="blood-update-time">Updated ${item.lastUpdated}</div>
        `;
        
        grid.appendChild(statusItem);
    });
}

// Render recent SOS requests
function renderRecentSOS() {
    const list = document.querySelector('.sos-requests-list');
    if (!list) return;
    
    // Get recent SOS requests (last 3)
    const recentRequests = [...sosRequests]
        .sort((a, b) => {
            const timeA = parseInt(a.time);
            const timeB = parseInt(b.time);
            return timeA - timeB;
        })
        .slice(0, 3);
    
    list.innerHTML = '';
    
    recentRequests.forEach(request => {
        const item = document.createElement('div');
        item.className = 'sos-request-item';
        item.innerHTML = `
            <div class="sos-request-header">
                <div>
                    <h4>${request.hospital}</h4>
                    <p class="sos-request-time">${request.time}</p>
                </div>
                <div class="sos-urgency ${request.urgency}">${request.urgency}</div>
            </div>
            <div class="sos-request-details">
                <div class="detail-item">
                    <span class="detail-label">Blood Group:</span>
                    <span class="detail-value blood-group-badge">${request.bloodGroup}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Units:</span>
                    <span class="detail-value">${request.units}</span>
                </div>
            </div>
            <div class="sos-request-actions">
                ${request.status === 'pending' ? `
                    <button class="btn btn-primary btn-sm" data-id="${request.id}" data-action="confirm">
                        Confirm
                    </button>
                    <button class="btn btn-outline btn-sm" data-id="${request.id}" data-action="reject">
                        Reject
                    </button>
                ` : `
                    <button class="btn btn-success btn-sm" disabled>
                        ${request.status === 'confirmed' ? 'Confirmed' : 'Rejected'}
                    </button>
                `}
            </div>
        `;
        
        list.appendChild(item);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.sos-request-actions button').forEach(btn => {
        btn.addEventListener('click', function() {
            const requestId = this.dataset.id;
            const action = this.dataset.action;
            
            if (action === 'confirm') {
                confirmSOSRequest(requestId);
            } else if (action === 'reject') {
                rejectSOSRequest(requestId);
            }
        });
    });
}

// Render SOS table
function renderSOSTable() {
    if (!sosTableBody) return;
    
    sosTableBody.innerHTML = '';
    
    sosRequests.forEach(request => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${request.id}</strong></td>
            <td>${request.hospital}</td>
            <td><span class="blood-group-badge">${request.bloodGroup}</span></td>
            <td>${request.units} units</td>
            <td><span class="sos-urgency ${request.urgency}">${request.urgency}</span></td>
            <td>${request.time}</td>
            <td>
                <span class="status-badge ${request.status === 'confirmed' ? 'adequate' : request.status === 'rejected' ? 'critical' : 'pending'}">
                    ${request.status}
                </span>
            </td>
            <td>
                ${request.status === 'pending' ? `
                    <div class="table-actions">
                        <button class="btn btn-primary btn-sm" data-id="${request.id}" data-action="confirm">
                            Confirm
                        </button>
                        <button class="btn btn-outline btn-sm" data-id="${request.id}" data-action="reject">
                            Reject
                        </button>
                    </div>
                ` : request.status === 'confirmed' ? `
                    <button class="btn btn-success btn-sm" disabled>Confirmed</button>
                ` : `
                    <button class="btn btn-danger btn-sm" disabled>Rejected</button>
                `}
            </td>
        `;
        
        sosTableBody.appendChild(row);
    });
    
    // Update empty state
    const emptyState = document.getElementById('noSOSRequests');
    if (sosRequests.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
    }
    
    // Add event listeners to action buttons
    document.querySelectorAll('.table-actions button').forEach(btn => {
        btn.addEventListener('click', function() {
            const requestId = this.dataset.id;
            const action = this.dataset.action;
            
            if (action === 'confirm') {
                confirmSOSRequest(requestId);
            } else if (action === 'reject') {
                rejectSOSRequest(requestId);
            }
        });
    });
}

// Confirm SOS request
function confirmSOSRequest(requestId) {
    const request = sosRequests.find(req => req.id === requestId);
    if (!request) return;
    
    request.status = 'confirmed';
    
    // Check if already in dispatch list
    const existingDispatch = dispatchItems.find(item => item.id === requestId);
    if (!existingDispatch) {
        dispatchItems.push({
            id: requestId,
            hospital: request.hospital,
            bloodGroup: request.bloodGroup,
            units: request.units,
            status: 'preparing'
        });
    }
    
    // Update UI
    renderSOSTable();
    renderDispatchList();
    updateSOSBadge();
    renderRecentSOS();
    
    showToast(`SOS request ${requestId} confirmed successfully`, 'success');
}

// Reject SOS request
function rejectSOSRequest(requestId) {
    const request = sosRequests.find(req => req.id === requestId);
    if (!request) return;
    
    request.status = 'rejected';
    
    // Remove from dispatch list if exists
    dispatchItems = dispatchItems.filter(item => item.id !== requestId);
    
    // Update UI with animation
    const row = document.querySelector(`[data-id="${requestId}"]`)?.closest('tr');
    if (row) {
        row.style.opacity = '0.5';
        row.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            renderSOSTable();
            renderDispatchList();
            updateSOSBadge();
            renderRecentSOS();
        }, 300);
    } else {
        renderSOSTable();
        renderDispatchList();
        updateSOSBadge();
        renderRecentSOS();
    }
    
    showToast(`SOS request ${requestId} rejected`, 'warning');
}

// Render dispatch list
function renderDispatchList() {
    if (!dispatchList) return;
    
    dispatchList.innerHTML = '';
    
    if (dispatchItems.length === 0) {
        document.getElementById('noDispatch').style.display = 'block';
        dispatchList.style.display = 'none';
        return;
    }
    
    document.getElementById('noDispatch').style.display = 'none';
    dispatchList.style.display = 'flex';
    
    dispatchItems.forEach(item => {
        const dispatchItem = document.createElement('div');
        dispatchItem.className = 'dispatch-item';
        dispatchItem.innerHTML = `
            <div class="dispatch-info">
                <div class="dispatch-id">${item.id}</div>
                <div class="dispatch-hospital">${item.hospital}</div>
                <div class="dispatch-blood">${item.bloodGroup} (${item.units} units)</div>
            </div>
            <select class="dispatch-status-select ${item.status}" data-id="${item.id}">
                <option value="preparing" ${item.status === 'preparing' ? 'selected' : ''}>Preparing Units</option>
                <option value="ready" ${item.status === 'ready' ? 'selected' : ''}>Ready for Pickup</option>
                <option value="collected" ${item.status === 'collected' ? 'selected' : ''}>Collected</option>
                <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
        `;
        
        dispatchList.appendChild(dispatchItem);
    });
    
    // Add event listeners to status selects
    document.querySelectorAll('.dispatch-status-select').forEach(select => {
        select.addEventListener('change', function() {
            const dispatchId = this.dataset.id;
            const newStatus = this.value;
            
            const dispatchItem = dispatchItems.find(item => item.id === dispatchId);
            if (dispatchItem) {
                dispatchItem.status = newStatus;
                this.className = `dispatch-status-select ${newStatus}`;
                
                showToast(`Dispatch status updated to ${newStatus}`, 'success');
                
                // If completed, remove from dispatch list after delay
                if (newStatus === 'completed') {
                    setTimeout(() => {
                        dispatchItems = dispatchItems.filter(item => item.id !== dispatchId);
                        renderDispatchList();
                    }, 2000);
                }
            }
        });
    });
}

// Open blood unit modal
function openBloodModal(group, isAdd) {
    const item = bloodInventory.find(item => item.group === group);
    if (!item) return;
    
    currentBloodGroup = group;
    
    // Update modal content
    document.getElementById('modalTitle').textContent = `Update ${group} Blood Units`;
    document.getElementById('modalBloodGroup').innerHTML = `
        <div class="modal-blood-group">${group}</div>
        <div class="modal-blood-status status-badge ${item.status}">${item.status}</div>
    `;
    
    document.getElementById('currentUnits').textContent = item.units;
    document.getElementById('unitInput').value = item.units;
    
    // Show modal
    modal.classList.add('show');
}

// Close modal
function closeModal() {
    modal.classList.remove('show');
    currentBloodGroup = null;
}

// Modal event listeners
modalClose.addEventListener('click', closeModal);
cancelUpdateBtn.addEventListener('click', closeModal);

// Add unit button
document.getElementById('addUnitBtn').addEventListener('click', function() {
    const item = bloodInventory.find(item => item.group === currentBloodGroup);
    if (item) {
        item.units += 1;
        updateBloodItem(item);
    }
});

// Remove unit button
document.getElementById('removeUnitBtn').addEventListener('click', function() {
    const item = bloodInventory.find(item => item.group === currentBloodGroup);
    if (item && item.units > 0) {
        item.units -= 1;
        updateBloodItem(item);
    }
});

// Unit input change
document.getElementById('unitInput').addEventListener('input', function() {
    const value = parseInt(this.value) || 0;
    document.getElementById('currentUnits').textContent = value;
});

// Save units
document.getElementById('saveUnitsBtn').addEventListener('click', function() {
    const item = bloodInventory.find(item => item.group === currentBloodGroup);
    if (item) {
        const newUnits = parseInt(document.getElementById('unitInput').value) || 0;
        item.units = Math.max(0, newUnits);
        item.lastUpdated = 'Just now';
        
        // Update status based on units
        if (item.units >= item.minRequired) {
            item.status = 'adequate';
        } else if (item.units >= item.minRequired * 0.5) {
            item.status = 'low';
        } else {
            item.status = 'critical';
        }
        
        updateBloodItem(item);
        closeModal();
        showToast(`${currentBloodGroup} units updated to ${item.units}`, 'success');
    }
});

// Update blood item and refresh UI
function updateBloodItem(item) {
    // Update all UI components
    renderBloodCards();
    renderInventoryTable();
    renderCriticalAlerts();
    renderBloodStatusGrid();
    updateInventoryBadge();
}

// File upload functionality
if (browseFilesBtn) {
    browseFilesBtn.addEventListener('click', function() {
        fileInput.click();
    });
}

if (fileInput) {
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFileUpload(this.files);
        }
    });
}

// Drag and drop functionality
if (uploadArea) {
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', function() {
        this.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
        }
    });
}

// Handle file upload
function handleFileUpload(files) {
    const fileNames = Array.from(files).map(file => file.name).join(', ');
    
    showToast(`Uploaded ${files.length} file(s): ${fileNames}`, 'success');
    
    // In a real app, you would upload to server here
    // For demo, just show success message
    
    // Reset file input
    fileInput.value = '';
}

// Profile form handling
if (profileForm) {
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const bankName = document.getElementById('bankName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        
        // In a real app, this would send data to server
        // For demo, just show success message
        showToast('Profile updated successfully!', 'success');
        
        // Update profile name in navbar
        const profileNameEl = document.querySelector('.profile-name');
        if (profileNameEl) {
            profileNameEl.textContent = bankName;
        }
        
        // Update avatar initials
        const avatarEls = document.querySelectorAll('.avatar, .avatar-large');
        avatarEls.forEach(avatar => {
            const initials = bankName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            avatar.textContent = initials;
        });
    });
}

// Reset form button
if (resetFormBtn) {
    resetFormBtn.addEventListener('click', function() {
        if (confirm('Reset all changes to original values?')) {
            profileForm.reset();
            showToast('Form reset to original values', 'info');
        }
    });
}

// Quick actions
document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const action = this.dataset.action;
        
        switch(action) {
            case 'add-blood':
                openBloodModal('O+', true);
                break;
            case 'emergency-request':
                showToast('Emergency SOS feature would open here', 'info');
                break;
            case 'schedule-pickup':
                showToast('Schedule pickup feature would open here', 'info');
                break;
            case 'generate-report':
                showToast('Generating report... This would download a PDF in real app', 'success');
                break;
        }
    });
});

// Show toast notification
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        </div>
        <div class="toast-message">${message}</div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 5000);
    
    // Close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', function() {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    });
}

// Add toast styles dynamically
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .toast {
        position: fixed;
        top: 100px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        padding: 15px 20px;
        display: flex;
        align-items: center;
        gap: 15px;
        min-width: 300px;
        max-width: 400px;
        z-index: 9999;
        transform: translateX(150%);
        transition: transform 0.3s ease;
        border-left: 4px solid #ddd;
    }
    
    .toast.show {
        transform: translateX(0);
    }
    
    .toast-success {
        border-left-color: #2A9D8F;
    }
    
    .toast-warning {
        border-left-color: #E9C46A;
    }
    
    .toast-info {
        border-left-color: #457B9D;
    }
    
    .toast-icon {
        font-size: 1.5rem;
    }
    
    .toast-success .toast-icon {
        color: #2A9D8F;
    }
    
    .toast-warning .toast-icon {
        color: #E9C46A;
    }
    
    .toast-info .toast-icon {
        color: #457B9D;
    }
    
    .toast-message {
        flex: 1;
        font-size: 0.95rem;
        color: #333;
    }
    
    .toast-close {
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        font-size: 1rem;
        padding: 5px;
    }
    
    .toast-close:hover {
        color: #333;
    }
`;

document.head.appendChild(toastStyles);