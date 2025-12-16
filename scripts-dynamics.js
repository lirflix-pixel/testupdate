// Charger les données du fichier JSON
async function getShows() {
    const response = await fetch("data/shows.json");
    return response.json();
}
function getNextEpisodeText(airDay, airTime) {
  if (!airDay || !airTime) return null;

  // Nettoyage (super important si y'a des espaces)
  airDay = String(airDay).trim().toLowerCase();
  airTime = String(airTime).trim();

  const daysMap = {
    // EN
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
    // FR
    dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6,
  };

  const targetDay = daysMap[airDay];
  if (targetDay === undefined) return null;

  const now = new Date();

  // Sécurité sur l'heure "15:00"
  const [hh, mm] = airTime.split(":").map(x => parseInt(x, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;

  const next = new Date(now);
  next.setHours(hh, mm, 0, 0);

  let diffDays = (targetDay - now.getDay() + 7) % 7;

  // Si c'est aujourd'hui mais l'heure est déjà passée -> semaine suivante
  if (diffDays === 0 && next <= now) diffDays = 7;

  next.setDate(now.getDate() + diffDays);

  const daysLeft = Math.ceil((next - now) / (1000 * 60 * 60 * 24));

  const dayLabel =
    daysLeft === 0 ? "aujourd’hui" :
    daysLeft === 1 ? "demain" :
    `dans ${daysLeft} jours`;

  const frDays = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];

  return `${dayLabel} (${frDays[targetDay]}) à ${airTime}`;
}

/* --------------------------------------------------
   PAGE ÉMISSION (emission.html)
-------------------------------------------------- */
async function loadEmissionPage() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");

    const shows = await getShows();
    const show = shows[slug];

    if (!show) {
        document.getElementById("content").innerHTML = "<h2>Émission introuvable</h2>";
        return;
    }

    // Changer le titre de la page
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
` : ``}
      </div>
    </div>

    <div class="episodes-grid">
`;
    // Génération automatique des cards épisodes
    show.episodes.forEach(ep => {
        ep.parts.forEach((part, index) => {
            const epNumber = ep.number;
            const partNumber = index + 1;

            html += `
                <a class="episode-card" 
                    href="episode.html?slug=${slug}&ep=${epNumber}&part=${partNumber}">
                    
                    <img src="${part.thumbnail}" alt="">
                    <span>Épisode ${epNumber} — Partie ${partNumber}</span>
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

/* --------------------------------------------------
   PAGE ÉPISODE (episode.html)
-------------------------------------------------- */
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

  // 🔗 lien externe → redirection directe
  if (currentPart.url.startsWith("http")) {
    window.location.href = currentPart.url;
    return;
  }
let embedHtml = "";

if (currentPart.embed) {
  // embed fourni par le site (hglink, dood, streamtape…)
  embedHtml = `
    <div class="player-box">
      ${currentPart.embed}
    </div>
  `;
} 
else if (currentPart.url) {
  // ancien cas : lien externe simple
  window.location.href = currentPart.url;
  return;
} 
else {
  embedHtml = "<p>Lecteur indisponible</p>";
}


  const prevEpisode = show.episodes.find(e => e.number === epNumber - 1);
  const nextEpisode = show.episodes.find(e => e.number === epNumber + 1);

  if (prevEpisode) {
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

  if (nextEpisode) {
    html += `
      <a class="nav-btn" href="episode.html?slug=${slug}&ep=${epNumber + 1}&part=1">
        Épisode suivant ➡️
      </a>
    `;
  }

  html += `
      </div>
    </div>
  `;
    html += `
            </div>

            <div class="back-home">
                <a href="index.html" class="home-btn">🏠 Accueil</a>
            </div>

        </div>
    `;

    document.getElementById("episode-content").innerHTML = html;
}
