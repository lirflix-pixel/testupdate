document.addEventListener("DOMContentLoaded", () => {

    const popup = document.getElementById("alert-popup");
    const closeBtn = document.getElementById("alert-close");

    if (!popup || !closeBtn) {
        console.log("❌ Popup introuvable");
        return;
    }

    if (!sessionStorage.getItem("alertShown")) {
        popup.style.display = "flex";
        console.log("🔥 Popup affiché !");
    }

    closeBtn.addEventListener("click", () => {
        popup.style.display = "none";
        sessionStorage.setItem("alertShown", "yes");
    });

});
