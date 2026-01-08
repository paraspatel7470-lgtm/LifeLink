const socket = io("http://localhost:5000");

// LifeLink Donor Dashboard JavaScript
console.log("✅ script.js loaded");
document.addEventListener("click", function (e) {
  if (e.target.closest(".accept-sos")) {
    console.log("✅ ACCEPT BUTTON CLICKED");
  }
});

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "donor") {
  window.location.href = "../../auth/login.html";
}

// ================= USER HYDRATION (SAFE) =================
function hydrateUserUI() {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return;

  let user;
  try {
    user = JSON.parse(storedUser);
  } catch {
    return;
  }

  // Navbar name
  const profileNameEl = document.querySelector(".profile-name");
  if (profileNameEl && user.name) {
    profileNameEl.textContent = user.name;
  }

  // Avatar initials
  const avatarEls = document.querySelectorAll(".avatar, .avatar-large");
  if (user.name) {
    const initials = user.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();

    avatarEls.forEach(el => (el.textContent = initials));
  }

  // Welcome text
  const welcomeHeading = document.querySelector(".welcome-content h1");
  if (welcomeHeading && user.name) {
    welcomeHeading.textContent = `Welcome back, ${user.name}!`;
  }

  // Profile form fields (SAFE)
  const nameInput = document.getElementById("profileName");
  const emailInput = document.getElementById("profileEmail");
  const phoneInput = document.getElementById("profilePhone");

  if (nameInput && user.name) nameInput.value = user.name;
  if (emailInput && user.email) emailInput.value = user.email;
  if (phoneInput && user.phone) phoneInput.value = user.phone;
}

// DOM Elements
const notificationBtn = document.getElementById("notificationBtn");
const notificationDropdown = document.querySelector(
  ".notification-dropdown-content"
);
const profileBtn = document.getElementById("profileBtn");
const profileDropdown = document.querySelector(".profile-dropdown-content");
const logoutBtn = document.getElementById("logoutBtn");
const tabButtons = document.querySelectorAll(".tab-btn");
const pages = document.querySelectorAll(".page");
const availableToggle = document.getElementById("availableToggle");
const unavailableToggle = document.getElementById("unavailableToggle");
const statusIndicator = document.getElementById("statusIndicator");
const sosBadge = document.getElementById("sosBadge");
const acceptButtons = document.querySelectorAll(".accept-sos");
const rejectButtons = document.querySelectorAll(".reject-sos");
const noAlertsMessage = document.getElementById("noAlertsMessage");
const checkAvailabilityBtn = document.getElementById("checkAvailabilityBtn");
const profileForm = document.getElementById("profileForm");
const cancelChangesBtn = document.getElementById("cancelChanges");
const refreshSOSBtn = document.getElementById("refreshSOS");
const urgencyFilter = document.getElementById("urgencyFilter");
const distanceFilter = document.getElementById("distanceFilter");
const sosRequestsList = document.querySelector(".sos-requests-list");
const noSOSRequests = document.getElementById("noSOSRequests");
const historyTableBody = document.getElementById("historyTableBody");

// State
let isAvailable = true;
let notifications = [
  {
    id: 1,
    type: "emergency",
    title: "Emergency Request",
    message: "City Hospital needs O+ blood",
    time: "10 min ago",
    read: false,
  },
  {
    id: 2,
    type: "badge",
    title: "New Badge Earned",
    message: "Hero Donor",
    time: "2 hours ago",
    read: true,
  },
  {
    id: 3,
    type: "reminder",
    title: "Donation Reminder",
    message: "You're eligible to donate again",
    time: "1 day ago",
    read: true,
  },
];

let sosRequests = [];

// 🔥 FETCH SOS FROM BACKEND (ONLY DATA FILLING)
async function fetchSOSFromBackend() {
  try {
    const res = await fetch("http://localhost:5000/api/sos/active", {
      headers: {
        Authorization: "Bearer " + token,
      },
    });
    const data = await res.json();
    console.log("✅ SOS DATA FROM BACKEND:", data);

    // ✅ Map backend SOS → existing UI structure
    sosRequests = data.map((sos) => ({
      id: sos._id,
      hospital: sos.hospitalId?.name || "Hospital",
      bloodGroup: sos.bloodGroup,
      units: sos.unitsRequired,
      urgency: sos.urgency,
      distance: 0,
      time: "Just now",
      timeWindow: "ASAP",
      accepted: false,
      rejected: false,
    }));

    // Render SOS requests after fetching
    renderSOSRequests();
  } catch (error) {
    console.error("❌ Failed to fetch SOS", error);
  }
}

// 🔔 FETCH NOTIFICATIONS FROM BACKEND
async function fetchNotificationsFromBackend() {
  try {
    const res = await fetch("http://localhost:5000/api/notifications", {
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const data = await res.json();
    console.log("✅ NOTIFICATIONS FROM BACKEND:", data);

    // Replace dummy notifications
    notifications = data.map((n) => ({
      id: n._id,
      title: n.title,
      message: n.message,
      time: new Date(n.createdAt).toLocaleString(),
      read: n.isRead,
    }));

    updateNotificationBadge();
    renderNotifications();
  } catch (err) {
    console.error("❌ Failed to fetch notifications", err);
  }
}

let donationHistory = [
  {
    id: 1,
    date: "Nov 15, 2023",
    hospital: "City General Hospital",
    units: 1,
    status: "completed",
    nextEligible: "Jan 15, 2024",
  },
  {
    id: 2,
    date: "Sep 28, 2023",
    hospital: "Metro Medical Center",
    units: 1,
    status: "completed",
    nextEligible: "Nov 28, 2023",
  },
  {
    id: 3,
    date: "Aug 10, 2023",
    hospital: "LifeLink Blood Center",
    units: 1,
    status: "completed",
    nextEligible: "Oct 10, 2023",
  },
  {
    id: 4,
    date: "Jun 22, 2023",
    hospital: "City General Hospital",
    units: 1,
    status: "completed",
    nextEligible: "Aug 22, 2023",
  },
  {
    id: 5,
    date: "May 5, 2023",
    hospital: "Saint Mary Hospital",
    units: 1,
    status: "completed",
    nextEligible: "Jul 5, 2023",
  },
];

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  // ================= LOCATION (DONOR) =================
  hydrateUserUI();

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          await fetch("http://localhost:5000/api/donors/update-location", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token,
            },
            body: JSON.stringify({ latitude, longitude }),
          });

          console.log("✅ Donor location saved");
        } catch (err) {
          console.log("❌ Failed to send donor location");
        }
      },
      () => {
        console.log("❌ Donor denied location permission");
      }
    );
  }
  // ====================================================

  // Initialize notification badge
  //   updateNotificationBadge();
  fetchNotificationsFromBackend();

  // Initialize SOS requests
  fetchSOSFromBackend();

  // Initialize donation history
  renderDonationHistory();

  // Set initial availability state
  updateAvailabilityUI();
});

// Toggle dropdowns
notificationBtn.addEventListener("click", function (e) {
  e.stopPropagation();
  notificationDropdown.classList.toggle("show");
  profileDropdown.classList.remove("show");
});

profileBtn.addEventListener("click", function (e) {
  e.stopPropagation();
  profileDropdown.classList.toggle("show");
  notificationDropdown.classList.remove("show");
});

// Close dropdowns when clicking outside
document.addEventListener("click", function (e) {
  if (
    !notificationBtn.contains(e.target) &&
    !notificationDropdown.contains(e.target)
  ) {
    notificationDropdown.classList.remove("show");
  }

  if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
    profileDropdown.classList.remove("show");
  }
});

// Logout functionality
logoutBtn.addEventListener("click", function (e) {
  e.preventDefault();
  if (confirm("Are you sure you want to logout?")) {
    // In a real app, this would clear tokens and redirect
    alert(
      "Demo: Logout successful. In a real app, this would redirect to login page."
    );
  }
});

// Tab navigation
tabButtons.forEach((button) => {
  button.addEventListener("click", function () {
    const pageId = this.dataset.page + "-page";

    // Update active tab
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    this.classList.add("active");

    // Show selected page
    pages.forEach((page) => {
      page.classList.remove("active");
      if (page.id === pageId) {
        page.classList.add("active");
      }
    });

    // If going to SOS page, refresh requests
    if (pageId === "sos-page") {
      renderSOSRequests();
    }
  });
});

// Availability toggle
availableToggle.addEventListener("click", function () {
  if (!isAvailable) {
    isAvailable = true;
    updateAvailabilityUI();
    showToast("You are now available for SOS requests", "success");
  }
});

unavailableToggle.addEventListener("click", function () {
  if (isAvailable) {
    isAvailable = false;
    updateAvailabilityUI();
    showToast("You are now unavailable for SOS requests", "warning");
  }
});

function updateAvailabilityUI() {
  if (isAvailable) {
    availableToggle.classList.add("active");
    unavailableToggle.classList.remove("active");

    // Update status indicator
    const statusDot = statusIndicator.querySelector(".status-dot");
    const statusText = statusIndicator.querySelector("h4");
    const statusDesc = statusIndicator.querySelector("p");

    statusDot.className = "status-dot available";
    statusText.textContent = "You are currently Available";
    statusDesc.textContent =
      "SOS requests will be sent to you for emergencies in your area.";

    // Show SOS alerts
    document.querySelectorAll(".sos-alert-item").forEach((item) => {
      item.style.display = "block";
    });
    if (noAlertsMessage) noAlertsMessage.style.display = "none";
  } else {
    availableToggle.classList.remove("active");
    unavailableToggle.classList.add("active");

    // Update status indicator
    const statusDot = statusIndicator.querySelector(".status-dot");
    const statusText = statusIndicator.querySelector("h4");
    const statusDesc = statusIndicator.querySelector("p");

    statusDot.className = "status-dot unavailable";
    statusText.textContent = "You are NOT Available";
    statusDesc.textContent =
      "You will not receive SOS alerts until you mark yourself as available.";

    // Hide SOS alerts
    document.querySelectorAll(".sos-alert-item").forEach((item) => {
      item.style.display = "none";
    });
    if (noAlertsMessage) noAlertsMessage.style.display = "block";
  }

  // Update SOS badge based on availability
  updateSOSBadge();
}

// Accept/Reject SOS requests
function handleSOSAction(action, alertId) {
  const alert = sosRequests.find((req) => req.id === alertId);
  if (!alert) return;

  // ✅ ACCEPT SOS → Backend + UI
  if (action === "accept") {
    fetch(`http://localhost:5000/api/sos/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ sosId: alertId }),
    })
      // .then((res) => res.json())
      // .then(() => {
      //   showToast("SOS accepted successfully", "success");
      //   // remove accepted SOS from UI list
      //   sosRequests = sosRequests.filter((req) => req.id !== alertId);
      //   renderSOSRequests();
      // })
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          showToast(data.message || "Cannot accept SOS", "warning");
          return;
        }

        showToast("SOS accepted successfully", "success");

        sosRequests = sosRequests.filter((req) => req.id !== alertId);
        renderSOSRequests();
      })

      .catch(() => {
        showToast("Failed to accept SOS", "warning");
      });
    return;
  }

  // ❌ REJECT SOS → UI only (MVP)
  if (action === "reject") {
    alert.rejected = true;
    alert.accepted = false;
    showToast("SOS request declined.", "info");
    sosRequests = sosRequests.filter((req) => req.id !== alertId);
    updateSOSBadge();
    renderSOSRequests();
  }

  // If on dashboard, update the specific alert
  const dashboardAlert = document
    .querySelector(`.sos-alert-item [data-alert="${alertId}"]`)
    ?.closest(".sos-alert-item");

  if (dashboardAlert) {
    const actionsDiv = dashboardAlert.querySelector(".sos-alert-actions");
    if (actionsDiv) {
      if (action === "accept") {
        actionsDiv.innerHTML = `
                    <button class="btn btn-success btn-sm" disabled>
                        <i class="fas fa-check"></i> Accepted
                    </button>
                `;
      } else {
        actionsDiv.innerHTML = `
                    <button class="btn btn-outline btn-sm" disabled>
                        <i class="fas fa-times"></i> Declined
                    </button>
                `;
      }
    }
  }
}

// Add event listeners to accept/reject buttons
document.addEventListener("click", function (e) {
  if (e.target.closest(".accept-sos")) {
    const alertId = e.target.closest(".accept-sos").dataset.alert.toString();
    handleSOSAction("accept", alertId);
  }

  if (e.target.closest(".reject-sos")) {
    const alertId = e.target.closest(".reject-sos").dataset.alert;
    handleSOSAction("reject", alertId);
  }
});

// Update SOS badge count
function updateSOSBadge() {
  if (!sosBadge) return;

  if (!isAvailable) {
    sosBadge.textContent = "0";
    return;
  }

  const activeRequests = sosRequests.filter(
    (req) => !req.accepted && !req.rejected
  ).length;

  sosBadge.textContent = activeRequests;

  // Hide badge if no requests
  if (activeRequests === 0) {
    sosBadge.style.display = "none";
  } else {
    sosBadge.style.display = "inline-flex";
  }
}

// Update notification badge
function updateNotificationBadge() {
  const unreadCount = notifications.filter((n) => !n.read).length;
  const badge = document.querySelector(".notification-badge");

  if (badge) {
    badge.textContent = unreadCount;
    if (unreadCount === 0) {
      badge.style.display = "none";
    } else {
      badge.style.display = "flex";
    }
  }
}

function renderNotifications() {
  const list = document.querySelector(".notification-list");
  if (!list) return;

  list.innerHTML = "";

  if (notifications.length === 0) {
    list.innerHTML = `<p style="padding:12px">No notifications</p>`;
    return;
  }

  notifications.forEach((n) => {
    const div = document.createElement("div");
    div.className = `notification-item ${n.read ? "" : "unread"}`;

    div.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-bell"></i>
            </div>
            <div class="notification-content">
                <p><strong>${n.title}</strong> - ${n.message}</p>
                <span class="notification-time">${n.time}</span>
            </div>
        `;

    list.appendChild(div);
  });
}

// Mark all notifications as read
document.querySelector(".mark-read")?.addEventListener("click", function () {
  notifications.forEach((notification) => {
    notification.read = true;
  });

  updateNotificationBadge();

  // Remove unread class from all notification items
  document.querySelectorAll(".notification-item").forEach((item) => {
    item.classList.remove("unread");
  });

  showToast("All notifications marked as read", "success");
});

// Check availability button
if (checkAvailabilityBtn) {
  checkAvailabilityBtn.addEventListener("click", function () {
    // Switch to dashboard and highlight availability section
    document.querySelector('.tab-btn[data-page="dashboard"]').click();

    // Scroll to availability card with animation
    const availabilityCard = document.querySelector(".availability-card");
    if (availabilityCard) {
      availabilityCard.style.animation = "pulse 2s";
      setTimeout(() => {
        availabilityCard.style.animation = "";
      }, 2000);
    }
  });
}

// Profile form handling
if (profileForm) {
  profileForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Get form values
    const name = document.getElementById("profileName").value;
    const bloodGroup = document.getElementById("profileBloodGroup").value;
    const email = document.getElementById("profileEmail").value;
    const phone = document.getElementById("profilePhone").value;
    const address = document.getElementById("profileAddress").value;
    const bio = document.getElementById("profileBio").value;

    // In a real app, this would send data to server
    // For demo, just show success message
    showToast("Profile updated successfully!", "success");

    // Update profile name in navbar
    const profileNameEl = document.querySelector(".profile-name");
    if (profileNameEl) {
      profileNameEl.textContent = name;
    }

    // Update avatar initials
    const avatarEls = document.querySelectorAll(".avatar, .avatar-large");
    avatarEls.forEach((avatar) => {
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
      avatar.textContent = initials;
    });
  });
}

// Cancel changes button
if (cancelChangesBtn) {
  cancelChangesBtn.addEventListener("click", function () {
    if (confirm("Discard changes?")) {
      // Reset form to original values
      profileForm.reset();
    }
  });
}

// Refresh SOS requests
if (refreshSOSBtn) {
  refreshSOSBtn.addEventListener("click", function () {
    // Show loading state
    const originalText = this.innerHTML;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    this.disabled = true;

    // Simulate API call
    setTimeout(() => {
      fetchSOSFromBackend();
      this.innerHTML = originalText;
      this.disabled = false;
      showToast("SOS requests refreshed", "success");
    }, 1000);
  });
}

// Filter SOS requests
urgencyFilter?.addEventListener("change", renderSOSRequests);
distanceFilter?.addEventListener("change", renderSOSRequests);

// Render SOS requests
function renderSOSRequests() {
  if (!sosRequestsList) return;

  // Apply filters
  let filteredRequests = [...sosRequests];
  const urgencyFilterValue = urgencyFilter?.value;
  const distanceFilterValue = distanceFilter?.value;

  if (urgencyFilterValue && urgencyFilterValue !== "all") {
    filteredRequests = filteredRequests.filter(
      (req) => req.urgency === urgencyFilterValue
    );
  }

  if (distanceFilterValue && distanceFilterValue !== "all") {
    const maxDistance = parseInt(distanceFilterValue);
    filteredRequests = filteredRequests.filter(
      (req) => req.distance <= maxDistance
    );
  }

  // Filter out accepted/rejected requests
  filteredRequests = filteredRequests.filter(
    (req) => !req.accepted && !req.rejected
  );

  // Clear current list
  sosRequestsList.innerHTML = "";

  // Show/hide empty state
  if (filteredRequests.length === 0) {
    if (noSOSRequests) noSOSRequests.style.display = "block";
    sosRequestsList.style.display = "none";
    return;
  } else {
    if (noSOSRequests) noSOSRequests.style.display = "none";
    sosRequestsList.style.display = "grid";
  }

  // Render each request
  filteredRequests.forEach((request) => {
    const urgencyClass = request.urgency;
    const urgencyText =
      request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1);

    const requestCard = document.createElement("div");
    requestCard.className = "card sos-request-card";
    requestCard.innerHTML = `
            <div class="card-body">
                <div class="sos-request-header">
                    <div class="hospital-info">
                        <div class="hospital-icon">
                            <i class="fas fa-hospital"></i>
                        </div>
                        <div>
                            <h4>${request.hospital}</h4>
                            <p class="alert-time">${request.time} • ${
      request.distance
    } km away</p>
                        </div>
                    </div>
                    <div class="urgency-level ${urgencyClass}">
                        <i class="fas fa-exclamation-triangle"></i>
                        ${urgencyText}
                    </div>
                </div>
                
                <div class="sos-request-details">
                    <div class="detail-row">
                        <div class="detail-item">
                            <span class="detail-label">Blood Group:</span>
                            <span class="detail-value blood-group">${
                              request.bloodGroup
                            }</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Units Needed:</span>
                            <span class="detail-value">${request.units} unit${
      request.units > 1 ? "s" : ""
    }</span>
                        </div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-item">
                            <span class="detail-label">Time Window:</span>
                            <span class="detail-value">Within ${
                              request.timeWindow
                            }</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Distance:</span>
                            <span class="detail-value">${
                              request.distance
                            } km</span>
                        </div>
                    </div>
                </div>
                
                <div class="sos-request-actions">
                    <button class="btn btn-primary accept-sos" data-alert="${
                      request.id
                    }">
                        <i class="fas fa-check"></i> Accept Request
                    </button>
                    <button class="btn btn-outline reject-sos" data-alert="${
                      request.id
                    }">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            </div>
        `;

    sosRequestsList.appendChild(requestCard);
  });

  // Update SOS badge
  updateSOSBadge();
}

// Render donation history
function renderDonationHistory() {
  if (!historyTableBody) return;

  // Clear current table
  historyTableBody.innerHTML = "";

  // Render each history item
  donationHistory.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${item.date}</td>
            <td>${item.hospital}</td>
            <td>${item.units} unit${item.units > 1 ? "s" : ""}</td>
            <td><span class="status-badge ${item.status}">${
      item.status
    }</span></td>
            <td>${item.nextEligible}</td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="viewDonationDetails(${
                  item.id
                })">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        `;
    historyTableBody.appendChild(row);
  });
}

// View donation details (demo function)
function viewDonationDetails(id) {
  const donation = donationHistory.find((d) => d.id === id);
  if (donation) {
    alert(
      `Donation Details:\n\nDate: ${donation.date}\nHospital: ${donation.hospital}\nUnits: ${donation.units}\nStatus: ${donation.status}\nNext Eligible: ${donation.nextEligible}`
    );
  }
}

// Show toast notification
function showToast(message, type = "info") {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll(".toast");
  existingToasts.forEach((toast) => toast.remove());

  // Create toast element
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${
              type === "success"
                ? "check-circle"
                : type === "warning"
                ? "exclamation-triangle"
                : "info-circle"
            }"></i>
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
    toast.classList.add("show");
  }, 10);

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, 5000);

  // Close button functionality
  const closeBtn = toast.querySelector(".toast-close");
  closeBtn.addEventListener("click", function () {
    toast.classList.remove("show");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  });
}

// Add toast styles dynamically
const toastStyles = document.createElement("style");
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

socket.on("sos_created", (sos) => {
  console.log("New SOS received:", sos);

  // Call your existing function that renders SOS
  // Example:
  if (typeof renderSOS === "function") {
    renderSOS(sos);
  } else {
    // fallback (safe)
    location.reload();
  }
});

socket.on("sos_fulfilled", (sosId) => {
  console.log("SOS fulfilled:", sosId);

  const sosCard = document.getElementById(`sos-${sosId}`);
  if (sosCard) {
    sosCard.remove();
  }
});

socket.on("sos_updated", (sos) => {
  const unitText = document.getElementById(`units-${sos._id}`);
  if (unitText) {
    unitText.innerText = `${sos.unitsFulfilled}/${sos.unitsRequired}`;
  }
});
