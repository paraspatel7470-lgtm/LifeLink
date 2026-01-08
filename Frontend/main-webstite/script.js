// Mobile Navigation Toggle
const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("navMenu");
const navLinks = document.querySelectorAll(".nav-link");

// Toggle mobile menu
hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  navMenu.classList.toggle("active");

  // Toggle body scroll when menu is open
  if (navMenu.classList.contains("active")) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }
});

// Close mobile menu when clicking a link
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
    document.body.style.overflow = "auto";

    // Update active link
    navLinks.forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();

    const targetId = this.getAttribute("href");
    if (targetId === "#") return;

    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 80,
        behavior: "smooth",
      });
    }
  });
});

// Login/Signup button functionality (demo only)
document.getElementById("loginBtn").addEventListener("click", () => {
  alert("Signup Successful! Please login.");
  window.location.href = "../User authentication page/login.html";
  window.location.href = "../User authentication page/signup.html";
});

document.getElementById("signupBtn").addEventListener("click", () => {
  alert("Sign Up functionality would open here in a real application.");
});

// Animated counters for impact section
function animateCounter(element, target, duration) {
  let start = 0;
  const increment = target / (duration / 16); // 60fps
  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      element.textContent = target.toLocaleString();
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(start).toLocaleString();
    }
  }, 16);
}

// Initialize counters when section is in view
function initCounters() {
  const counters = document.querySelectorAll(".impact-number");

  counters.forEach((counter) => {
    const target = parseInt(counter.getAttribute("data-count"));
    animateCounter(counter, target, 1500);
  });
}

// Check if impact section is in viewport
function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top <=
      (window.innerHeight || document.documentElement.clientHeight) * 0.8 &&
    rect.bottom >= 0
  );
}

// Initialize counters when impact section is visible
let countersInitialized = false;

function checkCounters() {
  const impactSection = document.getElementById("impact");

  if (isElementInViewport(impactSection) && !countersInitialized) {
    initCounters();
    countersInitialized = true;
  }
}

// Check on scroll and load
window.addEventListener("scroll", checkCounters);
window.addEventListener("load", checkCounters);

// Sticky navigation background on scroll
window.addEventListener("scroll", () => {
  const header = document.querySelector(".header");
  if (window.scrollY > 50) {
    header.style.boxShadow = "0 5px 20px rgba(0, 0, 0, 0.1)";
    header.style.backgroundColor = "rgba(255, 255, 255, 0.98)";
  } else {
    header.style.boxShadow = "0 2px 20px rgba(0, 0, 0, 0.05)";
    header.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
  }
});

// Update active nav link based on scroll position
function updateActiveNavLink() {
  const sections = document.querySelectorAll("section[id]");
  const scrollPosition = window.scrollY + 100;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute("id");

    if (
      scrollPosition >= sectionTop &&
      scrollPosition < sectionTop + sectionHeight
    ) {
      document
        .querySelector(`.nav-link[href="#${sectionId}"]`)
        ?.classList.add("active");
    } else {
      document
        .querySelector(`.nav-link[href="#${sectionId}"]`)
        ?.classList.remove("active");
    }
  });
}

window.addEventListener("scroll", updateActiveNavLink);

// Button click handlers for demo
document
  .querySelectorAll(".btn-primary, .btn-secondary, .btn-outline")
  .forEach((button) => {
    if (
      button.textContent.includes("Become a Donor") ||
      button.textContent.includes("Register Hospital") ||
      button.textContent.includes("Join Network") ||
      button.textContent.includes("Join Leaderboard")
    ) {
      button.addEventListener("click", () => {
        alert(
          `Thank you for your interest! This would open a registration form in a real application.`
        );
      });
    }

    if (button.textContent.includes("Request Emergency Help")) {
      button.addEventListener("click", () => {
        alert(
          "Emergency help request would be initiated here. This is a demo only."
        );
      });
    }
  });

// for leaderboard

// Blood group → CSS class mapping (for leaderboard pills)
const bgClassMap = {
  "O-": "o-negative",
  "O+": "o-positive",
  "A-": "a-negative",
  "A+": "a-positive",
  "B-": "b-negative",
  "B+": "b-positive",
  "AB-": "ab-negative",
  "AB+": "ab-positive",
};

async function loadLeaderboard() {
  try {
    const res = await fetch("http://localhost:5000/api/leaderboard");
    const data = await res.json();

    const leaderboard = document.querySelector(".leaderboard");
    if (!leaderboard) return;

    leaderboard.innerHTML = "";

    data.forEach((donor, index) => {
      let rankClass = "";
      let badgeText = "";
      let badgeClass = "";
      let iconHTML = `<i class="fas fa-heart"></i>`;

      if (index === 0) {
        rankClass = "first";
        badgeText = "Lifesaver";
        badgeClass = "gold";
        iconHTML = `<i class="fas fa-crown"></i>`;
      } else if (index === 1) {
        rankClass = "second";
        badgeText = "Hero";
        badgeClass = "silver";
        iconHTML = `<i class="fas fa-star"></i>`;
      } else if (index === 2) {
        rankClass = "third";
        badgeText = "Champion";
        badgeClass = "bronze";
        iconHTML = `<i class="fas fa-star"></i>`;
      } else if (index === 3) {
        badgeText = "Guardian";
      } else if (index === 4) {
        badgeText = "Protector";
      }
      const bloodClass = bgClassMap[donor.bloodGroup] || "";
      const bloodExtraClass =
      index === 0 && donor.bloodGroup?.includes("-") ? "dark-text" : "";

      leaderboard.innerHTML += `
        <div class="leaderboard-item ${rankClass}">
          <div class="rank">#${index + 1}</div>

          <div class="donor-info">
            <div class="donor-avatar">
              ${iconHTML}
            </div>

            <div class="donor-details">
              <h4 class="donor-name">${donor.name}</h4>
              <div class="badges">
                <span class="badge ${badgeClass}">
                  <i class="fas fa-medal"></i> ${badgeText}
                </span>
              </div>
            </div>
          </div>

          <div class="points">${donor.donationsCount * 10}</div>

         <div class="blood-group">
            <span class="blood-type ${bloodClass} ${bloodExtraClass}">
                ${donor.bloodGroup || "-"}
            </span>
        </div>

      `;
    });
  } catch (err) {
    console.error("Leaderboard load failed", err);
  }
}

window.addEventListener("load", loadLeaderboard);
