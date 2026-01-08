// ================== GLOBAL STATE ==================
let selectedRole = "donor";

const roleNames = {
  donor: "Donor",
  hospital: "Hospital",
  bloodbank: "Blood Bank"
};

// ================== DOM READY ==================
document.addEventListener("DOMContentLoaded", () => {
  initRoleCards();
  showRoleForm(selectedRole);
});

// ================== ROLE SELECTION ==================
function initRoleCards() {
  document.querySelectorAll(".role-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".role-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");

      selectedRole = card.dataset.role;
     if (document.getElementById("signupForm")) {
        showRoleForm(selectedRole);
        updateSelectedRoleBadge(selectedRole);
        }
      moveToStep2();
    });
  });
}

function showRoleForm(role) {
    const roleContainer = document.getElementById(`${role}Fields`);

    // If this page doesn't have role fields (login page safety)
    if (!roleContainer) return;

    // Hide all role sections
    document.querySelectorAll('.role-fields').forEach(field => {
        field.style.display = "none";
    });

    // Show selected role
    roleContainer.style.display = "block";

    // Disable other role inputs
    if (typeof disableUnselectedRoleFields === "function") {
        disableUnselectedRoleFields(role);
    }

    // ⚠️ SAFE CALL (only if function exists)
    if (typeof updateFormLabels === "function") {
        updateFormLabels(role);
    }
}


// 🔥 MOST IMPORTANT FIX
function disableUnselectedRoleFields(selectedRole) {
  ["donor", "hospital", "bloodbank"].forEach(role => {
    document.querySelectorAll(`#${role}Fields input, #${role}Fields select`)
      .forEach(field => {
        if (role === selectedRole) {
          field.disabled = false;
          field.required = true;
        } else {
          field.disabled = true;
          field.required = false;
        }
      });
  });
}

// ================== STEP UI ==================
function moveToStep2() {
  document.getElementById("step1")?.classList.remove("active");
  document.getElementById("step2")?.classList.add("active");
}

function updateSelectedRoleBadge(role) {
  const badge = document.getElementById("selectedRoleBadge");
  if (!badge) return;
  badge.querySelector("span").textContent = roleNames[role];
}

// ================== SIGNUP SUBMIT ==================
const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const signupText = document.getElementById("signupText");
    const signupLoader = document.getElementById("signupLoader");

    signupText.style.display = "none";
    signupLoader.style.display = "inline-block";

    try {
      // ---------- USER PAYLOAD ----------
      let userPayload = { role: selectedRole };

      if (selectedRole === "donor") {
        userPayload = {
          name: donorName.value,
          email: donorEmail.value,
          phone: donorPhone.value,
          password: donorPassword.value,
          role: "donor",
          bloodGroup: document.getElementById("bloodGroup").value
        };
      }

      if (selectedRole === "hospital") {
        userPayload = {
          name: hospitalName.value,
          email: hospitalEmail.value,
          phone: hospitalPhone.value,
          password: hospitalPassword.value,
          role: "hospital"
        };
      }

      if (selectedRole === "bloodbank") {
        userPayload = {
          name: bloodbankName.value,
          email: bloodbankEmail.value,
          phone: bloodbankPhone.value,
          password: bloodbankPassword.value,
          role: "bloodbank"
        };
      }

      // ---------- CREATE USER ----------
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userPayload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const userId = data.user._id;

      // ---------- ROLE PROFILE ----------
      if (selectedRole === "donor") {
        await fetch("http://localhost:5000/api/donors/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            bloodGroup: bloodGroup.value,
            lat: 23.2599,
            lng: 77.4126,
            city: "Bhopal",
            state: "MP"
          })
        });
      }

      if (selectedRole === "hospital") {
        await fetch("http://localhost:5000/api/hospitals/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            name: hospitalName.value,
            phone: hospitalPhone.value,
            address: hospitalAddress.value,
            lat: 23.2599,
            lng: 77.4126,
            city: "Bhopal",
            state: "MP"
          })
        });
      }

      showSignupMessage("Signup successful! Redirecting...", "success");
      setTimeout(() => location.href = "login.html", 1500);

    } catch (err) {
      console.error(err);
      showSignupMessage(err.message || "Signup failed", "error");
    } finally {
      signupText.style.display = "inline";
      signupLoader.style.display = "none";
    }
  });
}

// ================== UI MESSAGE ==================
function showSignupMessage(msg, type) {
  const box = document.getElementById("signupErrorMessage");
  box.style.display = "flex";
  box.querySelector("span").textContent = msg;
  box.style.color = type === "success" ? "green" : "red";
}

function showMessage(text, type = "error") {
  let msgBox = document.getElementById("authMessage");

  // Create message box if not exists
  if (!msgBox) {
    msgBox = document.createElement("div");
    msgBox.id = "authMessage";
    msgBox.style.marginBottom = "10px";
    msgBox.style.padding = "10px";
    msgBox.style.borderRadius = "6px";
    msgBox.style.fontSize = "14px";

    const form = document.querySelector("form");
    form.prepend(msgBox);
  }

  msgBox.innerText = text;

  if (type === "success") {
    msgBox.style.background = "#e6fffa";
    msgBox.style.color = "#065f46";
    msgBox.style.border = "1px solid #34d399";
  } else {
    msgBox.style.background = "#fee2e2";
    msgBox.style.color = "#7f1d1d";
    msgBox.style.border = "1px solid #f87171";
  }
}

// ================= LOGIN SUBMIT HANDLER =================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const loginText = document.getElementById("loginText");
    const loginLoader = document.getElementById("loginLoader");

    if (loginText && loginLoader) {
      loginText.style.display = "none";
      loginLoader.style.display = "inline-block";
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message || "Login failed", "error");
        return;
      }

      // ✅ SAVE AUTH DATA
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("user", JSON.stringify(data.user));

      showMessage("Login successful! Redirecting...", "success");

      // ✅ ROLE BASED REDIRECT
      setTimeout(() => {
        window.location.href = data.dashboard;
      }, 1000);

    } catch (err) {
      console.error(err);
      showMessage("Something went wrong", "error");
    } finally {
      if (loginText && loginLoader) {
        loginText.style.display = "inline";
        loginLoader.style.display = "none";
      }
    }
  });
}
