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
  const now = new Date();
  const day = now.getDay(); // 0 = dimanche, 6 = samedi

  // Si samedi → lundi
  if (day === 6) {
    return `lundi à ${airTime}`;
  }

  // Si dimanche → lundi
  if (day === 0) {
    return `lundi à ${airTime}`;
  }

  // Sinon → demain
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
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;

  const next = new Date(now);
  next.setHours(hh, mm, 0, 0);

  let diffDays = (targetDay - now.getDay() + 7) % 7;
  if (diffDays === 0 && next <= now) diffDays = 7;

  next.setDate(now.getDate() + diffDays);

  const daysLeft = Math.ceil((next - now) / (1000 * 60 * 60 * 24));

  const label =
    daysLeft === 0 ? "aujourd’hui" :
    daysLeft === 1 ? "demain" :
    `dans ${daysLeft} jours`;

  const frDays = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];

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

  // 🔥 Trier les épisodes du plus récent au plus ancien
  const sortedEpisodes = [...show.episodes]
    .filter(e => typeof e.number === "number")
    .sort((a, b) => b.number - a.number);

  const latestEpisodeNumber = sortedEpisodes.length
    ? sortedEpisodes[0].number
    : null;

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
            </div>
            ` : ""}
        </div>
      </div>

      <div class="episodes-carousel">
  `;

  sortedEpisodes.forEach(ep => {
  ep.parts.forEach((part, index) => {

    const isLatest =
      ep.number === latestEpisodeNumber && index === 0;

    const showPartLabel = ep.parts.length > 1;

    html += `
      <a class="episode-card"
         href="episode.html?slug=${slug}&ep=${ep.number}&part=${index + 1}">

        ${isLatest ? `<div class="latest-badge">NOUVEAU</div>` : ``}

        <img src="${part.thumbnail}" alt="">

        <span>${part.title ?? `Épisode ${ep.number}`}</span>

      </a>
    `;
  });
});
html += `
    </div>
  `;

    html += `
      <h2 class="section-title">Derniers ajouts ✅</h2>
      <div class="last-added-carousel">
`;
Object.entries(shows).forEach(([otherSlug, otherShow]) => {

  // ❌ ignorer l’émission en cours
  if (otherSlug === slug) return;

  if (!otherShow.episodes || otherShow.episodes.length === 0) return;

  const sortedEpisodes = [...otherShow.episodes]
    .filter(e => typeof e.number === "number")
    .sort((a, b) => b.number - a.number);

  if (!sortedEpisodes.length) return;

  const lastEp = sortedEpisodes[0];
  const firstPart = lastEp.parts?.[0];
  if (!firstPart) return;

  html += `
    <a class="episode-card small"
       href="episode.html?slug=${otherSlug}&ep=${lastEp.number}&part=1">
      <img src="${firstPart.thumbnail}" alt="">
      <span>${otherShow.title}</span>
      <small>${firstPart.title ?? `Épisode ${lastEp.number}`}</small>
    </a>
  `;
});

html += `</div>`;

  html += `
      </div>
      <div class="back-home">
        <a href="index.html" class="home-btn">🏠 Accueil</a>
      </div>
    </div>
  `;

console.log("📦 HTML FINAL:", html);

  document.getElementById("content").innerHTML = html;
}

/* ==================================================
   PAGE ÉPISODE
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

  let html = "";

  /* ---- EMBED / REDIRECTION ---- */
  let embedHtml = "";

  if (currentPart.embed) {
    embedHtml = `
      <div class="player-box">
        ${currentPart.embed}
      </div>
    `;
  } else if (currentPart.url) {
    window.location.href = currentPart.url;
    return;
  } else {
    embedHtml = "<p>Lecteur indisponible</p>";
  }

  html += `
    <div class="container">
      <h1>${show.title} — Épisode ${epNumber}
      ${episode.parts.length > 1 ? `· Partie ${partNumber} `: ``}</h1>
      ${embedHtml}
      <div class="nav-episodes">
  `;

// ⬅️ PRÉCÉDENT
if (partNumber > 1) {
  // Partie précédente du même épisode
  html += `
    <a class="nav-btn" href="episode.html?slug=${slug}&ep=${epNumber}&part=${partNumber - 1}">
      ⬅️ Épisode précédent
    </a>
  `;
} else {
  // Dernière partie de l’épisode précédent
  const prevEpisode = show.episodes.find(e => e.number === epNumber - 1);
  if (prevEpisode) {
    const lastPart = prevEpisode.parts.length;
    html += `
      <a class="nav-btn" href="episode.html?slug=${slug}&ep=${epNumber - 1}&part=${lastPart}">
        ⬅️ Épisode précédent
      </a>
    `;
  }
}
  html += `
      <a class="nav-btn" href="emission.html?slug=${slug}">
        📺 Retour à l’émission
      </a>
  `;

// ➡️ SUIVANT
if (partNumber < episode.parts.length) {
  // Partie suivante du même épisode
  html += `
    <a class="nav-btn" href="episode.html?slug=${slug}&ep=${epNumber}&part=${partNumber + 1}">
      Épisode suivant ➡️
    </a>
  `;
} else {
  // Première partie de l’épisode suivant
  const nextEpisode = show.episodes.find(e => e.number === epNumber + 1);
  if (nextEpisode) {
    html += `
      <a class="nav-btn" href="episode.html?slug=${slug}&ep=${epNumber + 1}&part=1">
        Épisode suivant ➡️
      </a>
    `;
  }
}

  html += `
      </div>

      <div class="back-home">
        <a href="index.html" class="home-btn">🏠 Accueil</a>
      </div>
    </div>
  `;

  document.getElementById("episode-content").innerHTML = html;
}
console.log("📌 script arrivé en bas");

if (document.getElementById("content")) {
  console.log("📌 content trouvé → appel loadEmissionPage()");
  loadEmissionPage();
} else {
  console.log("❌ content introuvable");
}
