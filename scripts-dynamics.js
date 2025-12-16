/* ==================================================
   CHARGEMENT DES DONNÉES
================================================== */
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
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  const shows = await getShows();
  const show = shows[slug];

  if (!show) {
    document.getElementById("content").innerHTML = "<h2>Émission introuvable</h2>";
    return;
  }

  document.title = show.title;

  let html = `
    <div class="container">
      <h1>${show.title}</h1>

      <div class="show-header">
        <img class="show-cover" src="${show.image}" alt="${show.title}">
        <div class="show-info">
          <p class="show-description">${show.description}</p>

          ${show.air_day && show.air_time ? `
            <div class="next-episode-badge">
              😎 Prochain épisode : ${getNextEpisodeText(show.air_day, show.air_time)}
            </div>
          ` : ""}
        </div>
      </div>

      <div class="episodes-grid">
  `;

  show.episodes.forEach(ep => {
    ep.parts.forEach((part, index) => {
      html += `
        <a class="episode-card"
           href="episode.html?slug=${slug}&ep=${ep.number}&part=${index + 1}">
          <img src="${part.thumbnail}" alt="">
          <span>Épisode ${ep.number} — Partie ${index + 1}</span>
        </a>
      `;
    });
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
      <h1>${show.title} — Épisode ${epNumber} · Partie ${partNumber}</h1>
      ${embedHtml}
      <div class="nav-episodes">
  `;

  if (show.episodes.find(e => e.number === epNumber - 1)) {
    html += `
      <a class="nav-btn" href="episode.html?slug=${slug}&ep=${epNumber - 1}&part=1">
        ⬅️ Épisode précédent
      </a>
    `;
  }

  html += `
      <a class="nav-btn" href="emission.html?slug=${slug}">
        📺 Retour à l’émission
      </a>
  `;

  if (show.episodes.find(e => e.number === epNumber + 1)) {
    html += `
      <a class="nav-btn" href="episode.html?slug=${slug}&ep=${epNumber + 1}&part=1">
        Épisode suivant ➡️
      </a>
    `;
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

