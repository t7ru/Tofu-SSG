import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap";

function setTheme(theme: "light" | "dark") {
  const body = document.body;
  const lightRadio = document.getElementById(
    "theme-light",
  ) as HTMLInputElement | null;
  const darkRadio = document.getElementById(
    "theme-dark",
  ) as HTMLInputElement | null;

  if (theme === "dark") {
    body.classList.add("dark-theme");
    darkRadio && (darkRadio.checked = true);
    lightRadio && (lightRadio.checked = false);
  } else {
    body.classList.remove("dark-theme");
    lightRadio && (lightRadio.checked = true);
    darkRadio && (darkRadio.checked = false);
  }
  localStorage.setItem("theme", theme);
}

const saved = (localStorage.getItem("theme") as "light" | "dark") || "light";
setTheme(saved);

function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    loadingScreen.style.opacity = "0";
    setTimeout(() => {
      loadingScreen.style.display = "none";
    }, 300);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(hideLoadingScreen, 100);
});

(window as any).setTheme = setTheme;
