const socket = io("http://localhost:5000");

// ===== DASHBOARD GUARD (TOP ONLY) =====
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "hospital") {
  window.location.href = "../../auth/login.html";
}

// Sample Data
const emergencyRequests = [];

const donors = [
    { name: 'John Smith', bloodGroup: 'O+', distance: '2.3 km', availability: 'available' },
    { name: 'Maria Garcia', bloodGroup: 'A-', distance: '4.1 km', availability: 'available' },
    { name: 'David Chen', bloodGroup: 'B+', distance: '1.7 km', availability: 'unavailable' },
    { name: 'Sarah Johnson', bloodGroup: 'O-', distance: '3.5 km', availability: 'available' },
    { name: 'Robert Williams', bloodGroup: 'AB+', distance: '5.2 km', availability: 'available' },
    { name: 'Lisa Brown', bloodGroup: 'A+', distance: '2.9 km', availability: 'available' },
    { name: 'Michael Davis', bloodGroup: 'B-', distance: '6.1 km', availability: 'unavailable' },
    { name: 'Emma Wilson', bloodGroup: 'O+', distance: '4.8 km', availability: 'available' }
];

const bloodInventory = [
    { group: 'A+', units: 24, status: 'adequate' },
    { group: 'A-', units: 8, status: 'low' },
    { group: 'B+', units: 15, status: 'low' },
    { group: 'B-', units: 3, status: 'critical' },
    { group: 'O+', units: 32, status: 'adequate' },
    { group: 'O-', units: 2, status: 'critical' },
    { group: 'AB+', units: 12, status: 'low' },
    { group: 'AB-', units: 1, status: 'critical' }
];

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const sosModal = document.getElementById('sos-modal');
const openSosBtn = document.getElementById('open-sos-btn');
const floatingSosBtn = document.getElementById('floating-sos-btn');
const closeSosModal = document.getElementById('close-sos-modal');
const cancelSosBtn = document.getElementById('cancel-sos');
const sosForm = document.getElementById('sos-form');
const emergencyTableBody = document.querySelector('#emergency-requests tbody');
const donorGrid = document.querySelector('.donor-grid');
const inventoryGrid = document.querySelector('.inventory-grid');
const noRequestsElement = document.getElementById('no-requests');
const bloodGroupFilter = document.getElementById('blood-group-filter');
const availabilityFilter = document.getElementById('availability-filter');
const settingsForm = document.getElementById('hospital-settings-form');
const resetSettingsBtn = document.getElementById('reset-settings');
const notificationToast = document.getElementById('notification-toast');

// Page Navigation
navItems.forEach(item => {
    if (!item.classList.contains('logout')) {
        item.addEventListener('click', () => {
            const pageId = item.getAttribute('data-page');
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Update active page
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
            
            // Update page title
            const pageTitle = document.querySelector('.page-title h1');
            const pageDesc = document.querySelector('.page-title p');
            
            switch(pageId) {
                case 'dashboard':
                    pageTitle.textContent = 'Dashboard';
                    pageDesc.textContent = 'Welcome to LifeLink Hospital Dashboard';
                    break;
                case 'emergency-requests':
                    pageTitle.textContent = 'Emergency Requests';
                    pageDesc.textContent = 'Manage incoming SOS requests from your hospital';
                    break;
                case 'donor-list':
                    pageTitle.textContent = 'Donor List';
                    pageDesc.textContent = 'Available blood donors within 15km radius';
                    break;
                case 'blood-inventory':
                    pageTitle.textContent = 'Blood Inventory';
                    pageDesc.textContent = 'Current blood stock status (read-only)';
                    break;
                case 'settings':
                    pageTitle.textContent = 'Hospital Settings';
                    pageDesc.textContent = 'Manage your hospital profile and contact information';
                    break;
            }
        });
    }
});

// Logout button
document.querySelector('.logout').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        alert('Logout successful. In a real application, you would be redirected to the login page.');
    }
});

// SOS Modal Functions
function openSosModal() {
    sosModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeSosModalFunc() {
    sosModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

openSosBtn.addEventListener('click', openSosModal);
floatingSosBtn.addEventListener('click', openSosModal);
closeSosModal.addEventListener('click', closeSosModalFunc);
cancelSosBtn.addEventListener('click', closeSosModalFunc);

// Close modal when clicking outside
sosModal.addEventListener('click', (e) => {
    if (e.target === sosModal) {
        closeSosModalFunc();
    }
});

// SOS Form Submission
// SOS Form Submission (CONNECTED TO BACKEND)
sosForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const bloodGroup = document.getElementById("blood-group").value;
  const units = document.getElementById("units-needed").value;
  const urgency = document.querySelector('input[name="urgency"]:checked').value;

  try {
    const response = await fetch("http://localhost:5000/api/sos/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        bloodGroup,
        units,
        urgency,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to send SOS");
      return;
    }

    showNotification("SOS request sent successfully!");
    closeSosModalFunc();

    // Reset form
    sosForm.reset();
    document.getElementById("blood-group").value = "";
    document.querySelector('input[name="urgency"][value="low"]').checked = true;
  } catch (error) {
    alert("Server error. Please try again.");
  }
});


// Show notification function
function showNotification(message) {
    const toastMessage = document.querySelector('.toast-message');
    toastMessage.textContent = message;
    
    notificationToast.classList.add('show');
    
    setTimeout(() => {
        notificationToast.classList.remove('show');
    }, 3000);
}

// Render Emergency Requests Table
function renderEmergencyRequests() {
    if (emergencyRequests.length === 0) {
        noRequestsElement.style.display = 'block';
        emergencyTableBody.innerHTML = '';
        return;
    }
    
    noRequestsElement.style.display = 'none';
    
    let tableHTML = '';
    
    emergencyRequests.forEach(request => {
        let statusBadge;
        switch(request.status) {
            case 'pending':
                statusBadge = '<span class="status-badge status-pending">Pending</span>';
                break;
            case 'accepted':
                statusBadge = '<span class="status-badge status-accepted">Accepted</span>';
                break;
            case 'completed':
                statusBadge = '<span class="status-badge status-completed">Completed</span>';
                break;
        }
        
        let actionButtons = '';
        if (request.status === 'pending') {
            actionButtons = `
                <button class="btn-table btn-accept" data-id="${request.id}">Accept</button>
                <button class="btn-table btn-reject" data-id="${request.id}">Reject</button>
            `;
        } else {
            actionButtons = '<span class="no-action">No action required</span>';
        }
        
        tableHTML += `
            <tr>
                <td>${request.id}</td>
                <td><span class="blood-group">${request.bloodGroup}</span></td>
                <td>${request.unitsNeeded} units</td>
                <td>${request.time}</td>
                <td>${statusBadge}</td>
                <td>${actionButtons}</td>
            </tr>
        `;
    });
    
    emergencyTableBody.innerHTML = tableHTML;
    
    // Add event listeners to action buttons
    document.querySelectorAll('.btn-accept').forEach(btn => {
        btn.addEventListener('click', function() {
            const requestId = this.getAttribute('data-id');
            updateRequestStatus(requestId, 'accepted');
        });
    });
    
    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', function() {
            const requestId = this.getAttribute('data-id');
            updateRequestStatus(requestId, 'completed');
        });
    });
}

// Update Request Status
function updateRequestStatus(requestId, newStatus) {
    const request = emergencyRequests.find(req => req.id === requestId);
    if (request) {
        request.status = newStatus;
        renderEmergencyRequests();
        
        let message = '';
        if (newStatus === 'accepted') {
            message = `Request ${requestId} accepted. Donors are being notified.`;
        } else {
            message = `Request ${requestId} marked as completed.`;
        }
        
        showNotification(message);
    }
}

// Render Donor List
function renderDonorList(filterBloodGroup = 'all', filterAvailability = 'all') {
    let filteredDonors = [...donors];
    
    // Apply blood group filter
    if (filterBloodGroup !== 'all') {
        filteredDonors = filteredDonors.filter(donor => donor.bloodGroup === filterBloodGroup);
    }
    
    // Apply availability filter
    if (filterAvailability !== 'all') {
        if (filterAvailability === 'available') {
            filteredDonors = filteredDonors.filter(donor => donor.availability === 'available');
        } else if (filterAvailability === 'soon') {
            filteredDonors = filteredDonors.filter(donor => donor.availability === 'unavailable');
        }
    }
    
    if (filteredDonors.length === 0) {
        donorGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-users"></i>
                <h3>No Donors Found</h3>
                <p>No donors match your current filter criteria.</p>
            </div>
        `;
        return;
    }
    
    let donorHTML = '';
    
    filteredDonors.forEach(donor => {
        const availabilityClass = donor.availability === 'available' ? 'available' : 'unavailable';
        const availabilityText = donor.availability === 'available' ? 'Available Now' : 'Not Available';
        
        donorHTML += `
            <div class="donor-card">
                <div class="donor-header">
                    <div class="donor-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="donor-info">
                        <h3>${donor.name}</h3>
                        <span class="blood-group">${donor.bloodGroup}</span>
                    </div>
                </div>
                
                <div class="donor-details">
                    <div class="donor-detail">
                        <span class="label">Distance</span>
                        <span class="value">${donor.distance}</span>
                    </div>
                    <div class="donor-detail">
                        <span class="label">Availability</span>
                        <span class="availability-badge ${availabilityClass}">${availabilityText}</span>
                    </div>
                </div>
                
                <button class="btn-contact" data-name="${donor.name}">
                    <i class="fas fa-phone-alt"></i> Contact Donor
                </button>
            </div>
        `;
    });
    
    donorGrid.innerHTML = donorHTML;
    
    // Add event listeners to contact buttons
    document.querySelectorAll('.btn-contact').forEach(btn => {
        btn.addEventListener('click', function() {
            const donorName = this.getAttribute('data-name');
            showNotification(`Contacting ${donorName}... In a real app, this would initiate a call or message.`);
        });
    });
}

// Render Blood Inventory
function renderBloodInventory() {
    let inventoryHTML = '';
    
    bloodInventory.forEach(item => {
        let statusClass, statusText;
        
        switch(item.status) {
            case 'adequate':
                statusClass = 'status-adequate';
                statusText = 'Adequate';
                break;
            case 'low':
                statusClass = 'status-low';
                statusText = 'Low';
                break;
            case 'critical':
                statusClass = 'status-critical';
                statusText = 'Critical';
                break;
        }
        
        inventoryHTML += `
            <div class="inventory-card">
                <div class="blood-group">${item.group}</div>
                <div class="units-count">${item.units}</div>
                <div class="inventory-status ${statusClass}">${statusText}</div>
            </div>
        `;
    });
    
    inventoryGrid.innerHTML = inventoryHTML;
}

// Settings Form
settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const hospitalName = document.getElementById('hospital-name').value;
    const hospitalAddress = document.getElementById('hospital-address').value;
    const contactNumber = document.getElementById('contact-number').value;
    const emergencyHelpline = document.getElementById('emergency-helpline').value;
    
    // Update hospital info in sidebar
    const hospitalInfoElements = document.querySelectorAll('.hospital-info p');
    hospitalInfoElements[0].innerHTML = `<i class="fas fa-hospital"></i> ${hospitalName}`;
    hospitalInfoElements[1].innerHTML = `<i class="fas fa-map-marker-alt"></i> ${hospitalAddress.split(',')[1]}, ${hospitalAddress.split(',')[2]}`;
    
    showNotification('Hospital settings updated successfully!');
});

// Reset Settings
resetSettingsBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
        document.getElementById('hospital-name').value = 'General Hospital';
        document.getElementById('hospital-address').value = '123 Medical Center Drive, San Francisco, CA 94107';
        document.getElementById('contact-number').value = '+1 (555) 123-4567';
        document.getElementById('emergency-helpline').value = '+1 (555) 911-9111';
        
        showNotification('Settings have been reset to default values.');
    }
});

// Filter Event Listeners
bloodGroupFilter.addEventListener('change', () => {
    renderDonorList(bloodGroupFilter.value, availabilityFilter.value);
});

availabilityFilter.addEventListener('change', () => {
    renderDonorList(bloodGroupFilter.value, availabilityFilter.value);
});

// View All Requests button
document.querySelector('.btn-view-all').addEventListener('click', function() {
    const page = this.getAttribute('data-page');
    document.querySelector(`.nav-item[data-page="${page}"]`).click();
});

// Initialize the dashboard
function initDashboard() {
    // renderEmergencyRequests();
    loadHospitalEmergencyRequests();
    renderDonorList();
    renderBloodInventory();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);

// ================= LOCATION (HOSPITAL) =================
if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      try {
        await fetch("http://localhost:5000/api/hospitals/update-location", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({ latitude, longitude }),
        });

        console.log("✅ Hospital location saved");
      } catch (err) {
        console.error("❌ Failed to send hospital location", err);
      }
    },
    () => {
      console.log("❌ Hospital denied location permission");
    }
  );
}
// =======================================================

async function loadHospitalEmergencyRequests() {
  const token = localStorage.getItem("token");
  const tableBody = document.querySelector("#emergency-requests tbody");
  const emptyState = document.getElementById("no-requests");

  if (!tableBody) return;

  try {
    const res = await fetch("http://localhost:5000/api/sos/hospital", {
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const sosList = await res.json();
    tableBody.innerHTML = "";

    if (!Array.isArray(sosList) || sosList.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    sosList.forEach((sos, index) => {
      let donorsHTML = "No donors yet";

      if (sos.donorsResponded && sos.donorsResponded.length > 0) {
        donorsHTML = sos.donorsResponded
          .map(
            (d) => `
              <div style="margin-bottom:6px">
                <strong>${d.donorId?.name || "Unknown"}</strong><br/>
                📞 ${d.donorId?.phone || "N/A"}
              </div>
            `
          )
          .join("");
      }

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>#SOS-${index + 1}</td>
        <td><span class="blood-group">${sos.bloodGroup}</span></td>
        <td>${sos.unitsRequired}</td>
        <td>${new Date(sos.createdAt).toLocaleTimeString()}</td>
        <td>${sos.status}</td>
        <td>${donorsHTML}</td>
      `;

      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error("Failed to load hospital SOS", err);
  }
}

socket.on("sos_updated", (sos) => {
  console.log("Hospital SOS update:", sos);

  const unitText = document.getElementById(`units-${sos._id}`);
  if (unitText) {
    unitText.innerText = `${sos.unitsFulfilled}/${sos.unitsRequired}`;
  }
});

socket.on("sos_fulfilled", (sosId) => {
  const badge = document.getElementById(`status-${sosId}`);
  if (badge) {
    badge.innerText = "Fulfilled";
    badge.style.color = "green";
  }
});
