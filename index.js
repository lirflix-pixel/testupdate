import { auth } from "./firebase-init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const welcomeEl = document.getElementById("welcome");
const logoutBtn = document.getElementById("logout-btn");

onAuthStateChanged(auth, (user) => {
  if (user) {
    const name = user.displayName || user.email;
    welcomeEl.textContent = `Bonjour ${name} 👋🏼`;
  } else {
    welcomeEl.textContent = "";
  }
});

logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "/login.html";
});

document.addEventListener("DOMContentLoaded", () => {

    const popup = document.getElementById("poll-popup");
    if (!popup) return;

    // Ne l'afficher qu'une fois
    if (!localStorage.getItem("popupDone")) {
        popup.style.display = "flex";
    }

    // Gestion des clics
    popup.querySelectorAll(".poll-btn").forEach(btn => {
        btn.addEventListener("click", () => {

            const choice = btn.dataset.vote;

            fetch("https://script.google.com/macros/s/AKfycbzsLlHXS0tyJ6cYTl0Q32oTcH-lVZQNz5euJHWpX2XnfAY2Ks7UzeVVH1QORVJDW7m09/exec", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vote: choice })
            })
            .then(() => {
                localStorage.setItem("popupDone", "yes");
                popup.style.display = "none";
                alert("Merci pour ton vote ❤️");
            })
            .catch(() => alert("Erreur, réessaie."));
        });
    });

});
document.addEventListener("DOMContentLoaded", () => {
  
    // popup session unique
    if (!sessionStorage.getItem("alertShown")) {
        document.getElementById("alert-popup").style.display = "flex";
    }

    // bouton fermer
    document.getElementById("alert-close").addEventListener("click", () => {
        document.getElementById("alert-popup").style.display = "none";
        sessionStorage.setItem("alertShown", "yes");
    });

});


