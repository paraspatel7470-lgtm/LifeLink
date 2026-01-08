(function () {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.replace("/auth/login.html");
  }
})();
