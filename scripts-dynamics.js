/* ==================================================
CHARGEMENT DES DONNÉES
================================================== */
console.log("✅ scripts-dynamics.js chargé");

async function getShows() {
const response = await fetch("data/shows.json");
return response.json();
}

/* ==================================================
PROCHAIN ÉPISODE (badge)
================================================== */
function getNextEpisodeText(airDay, airTime) {
if (!airDay || !airTime) return null;

airDay = String(airDay).trim().toLowerCase();
airTime = String(airTime).trim();

if (airDay === "weekdays") {
const day = new Date().getDay();
if (day === 0 || day === 6) return `lundi à ${airTime}`;
return `demain à ${airTime}`;
}

const daysMap = {
sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
thursday: 4, friday: 5, saturday: 6,
dimanche: 0, lundi: 1, mardi: 2, mercredi: 3,
jeudi: 4, vendredi: 5, samedi: 6,
};

const targetDay = daysMap[airDay];
if (targetDay === undefined) return null;

const now = new Date();
const [hh, mm] = airTime.split(":").map(Number);
const next = new Date(now);
next.setHours(hh, mm, 0, 0);

let diffDays = (targetDay - now.getDay() + 7) % 7;
if (diffDays === 0 && next <= now) diffDays = 7;

next.setDate(now.getDate() + diffDays);
const daysLeft = Math.ceil((next - now) / 86400000);

const label =
daysLeft === 0 ? "aujourd’hui" :
daysLeft === 1 ? "demain" :
`dans ${daysLeft} jours`;

const frDays = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
return `${label} (${frDays[targetDay]}) à ${airTime}`;
}

/* ==================================================
PAGE ÉMISSION
================================================== */
async function loadEmissionPage() {
const slug = new URLSearchParams(window.location.search).get("slug");
const shows = await getShows();
const show = shows[slug];

if (!show) {
document.getElementById("content").innerHTML = "<h2>Émission introuvable</h2>";
return;
}

document.title = show.title;

const sortedEpisodes = [...show.episodes]
.filter(e => typeof e.number === "number")
.sort((a, b) => b.number - a.number);

const latestEpisodeNumber = sortedEpisodes[0]?.number ?? null;

let html = `
<div class="container">
<h1>${show.title}</h1>

<div class="show-header">
<img class="show-cover" src="${show.image}" alt="${show.title}">
<div class="show-info">
<p>${show.description}</p>
${show.air_day && show.air_time ? `
<div class="next-episode-badge">
😎 Prochain épisode : ${getNextEpisodeText(show.air_day, show.air_time)}
</div>` : ""}
</div>
</div>

<div class="episodes-carousel">
`;

sortedEpisodes.forEach(ep => {
ep.parts.forEach((part, index) => {
const isLatest = ep.number === latestEpisodeNumber && index === 0;

html += `
<a class="episode-card"
href="episode.html?slug=${slug}&ep=${ep.number}&part=${index + 1}">
${isLatest ? `<div class="latest-badge">NOUVEAU</div>` : ""}
<img src="${part.thumbnail}" alt="">
<span>${part.title ?? `Épisode ${ep.number}`}</span>
</a>
`;
});
});

html += `</div>`;

/* Derniers ajouts */
html += `
<h2 class="section-title">Derniers ajouts ✅</h2>
<div class="last-added-carousel">
`;

Object.entries(shows).forEach(([otherSlug, otherShow]) => {
if (otherSlug === slug) return;
if (!otherShow.episodes?.length) return;

const lastEp = [...otherShow.episodes]
.filter(e => typeof e.number === "number")
.sort((a, b) => b.number - a.number)[0];

if (!lastEp?.parts?.[0]) return;

html += `
<a class="episode-card small"
href="episode.html?slug=${otherSlug}&ep=${lastEp.number}&part=1">
<img src="${lastEp.parts[0].thumbnail}" alt="">
<span>${otherShow.title}</span>
<small>${lastEp.parts[0].title ?? `Épisode ${lastEp.number}`}</small>
</a>
`;
});

html += `
</div>
<div class="back-home">
<a href="index.html" class="home-btn">🏠 Accueil</a>
</div>
</div>
`;

document.getElementById("content").innerHTML = html;
}

/* ==================================================
PAGE ÉPISODE (MULTI-LECTEURS)
================================================== */
/* ==================================================
PAGE ÉPISODE (RENDU VERTICAL)
================================================== */
async function loadEpisodePage() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    const epNumber = parseInt(params.get("ep"));
    const partNumber = parseInt(params.get("part"));

    const shows = await getShows();
    const show = shows[slug];
    if (!show) return;

    const episode = show.episodes.find(e => e.number === epNumber);
    if (!episode) return;

    const currentPart = episode.parts[partNumber - 1];
    if (!currentPart) return;

    // Gestion des lecteurs (Boutons bleus arrondis)
    let playerHtml = "";
    if (currentPart.players && currentPart.players.length > 0) {
        playerHtml = `
        <div class="player-section">
            <p class="player-label">Choisir un lecteur :</p>
            <div class="player-tabs">
                ${currentPart.players.map((p, i) => `
                    <button class="player-tab-btn ${i === 0 ? "active" : ""}" 
                            data-embed="${encodeURIComponent(p.embed)}">
                        ${p.name}
                    </button>
                `).join("")}
            </div>
            <div class="video-container" id="player-frame">
                ${currentPart.players[0].embed}
            </div>
        </div>`;
    } else {
        playerHtml = `<div class="video-container">${currentPart.embed || "<p>Lecteur indisponible</p>"}</div>`;
    }

    const html = `
    <div class="container episode-page">
        <h1 class="show-main-title">${show.title} — Épisode ${epNumber}</h1>
        
        <hr class="separator">

        ${playerHtml}

        <hr class="separator">

        <div class="vertical-nav">
            ${partNumber > 1 || show.episodes.find(e => e.number === epNumber - 1) 
                ? `<a class="nav-stack-link" href="episode.html?slug=${slug}&ep=${partNumber > 1 ? epNumber : epNumber - 1}&part=${partNumber > 1 ? partNumber - 1 : 1}">
                    ⬅️ Épisode précédent
                   </a>` 
                : ""}
            
            <a class="nav-stack-link" href="emission.html?slug=${slug}">
                📺 Retour à l'émission
            </a>

            ${partNumber < episode.parts.length || show.episodes.find(e => e.number === epNumber + 1)
                ? `<a class="nav-stack-link" href="episode.html?slug=${slug}&ep=${partNumber < episode.parts.length ? epNumber : epNumber + 1}&part=${partNumber < episode.parts.length ? partNumber + 1 : 1}">
                    Épisode suivant ➡️
                   </a>` 
                : ""}

            <a class="nav-stack-link home-btn-special" href="index.html">
                🏠 Accueil
            </a>
        </div>
    </div>
    `;

    document.getElementById("episode-content").innerHTML = html;

    // Logique Switch Lecteurs
    document.querySelectorAll(".player-tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".player-tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById("player-frame").innerHTML = decodeURIComponent(btn.dataset.embed);
        });
    });
}

/* ==================================================
AUTO LOAD
================================================== */
document.addEventListener("DOMContentLoaded", () => {
if (document.getElementById("content")) {
loadEmissionPage();
}
if (document.getElementById("episode-content")) {
loadEpisodePage();
}
});

