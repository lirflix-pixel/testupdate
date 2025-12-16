// Charger les données du fichier JSON
async function getShows() {
    const response = await fetch("data/shows.json");
    return response.json();
}
function getNextEpisodeText(airDay, airTime) {
  if (!airDay || !airTime) return null;

  const daysMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };

  const now = new Date();
  const targetDay = daysMap[airDay.toLowerCase()];
  if (targetDay === undefined) return null;

  const next = new Date(now);
  next.setHours(...airTime.split(":"), 0, 0);

  const diffDays =
    (targetDay - now.getDay() + 7) % 7 || 7;

  next.setDate(now.getDate() + diffDays);

  const daysLeft = Math.ceil((next - now) / (1000 * 60 * 60 * 24));

  const dayLabel =
    daysLeft === 0 ? "aujourd’hui" :
    daysLeft === 1 ? "demain" :
    `dans ${daysLeft} jours`;

  const frDays = [
    "dimanche", "lundi", "mardi", "mercredi",
    "jeudi", "vendredi", "samedi"
  ];

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

    if (!show) {
        document.getElementById("episode-content").innerHTML = "<h2>Épisode introuvable</h2>";
        return;
    }

    const episode = show.episodes.find(e => e.number === epNumber);
    const currentPart = episode.parts[partNumber - 1];

    const prevEpisode = show.episodes.find(e => e.number === epNumber - 1);
    const nextEpisode = show.episodes.find(e => e.number === epNumber + 1);

    // EMBED vidéo → tu mettras ton vrai embed dans le JSON
    const embedHtml = `
        <div class="player-box">
            <iframe src="${currentPart.url}" allowfullscreen></iframe>
        </div>
    `;

    let html = `
        <div class="container">

            <h1>${show.title} — Épisode ${epNumber} · Partie ${partNumber}</h1>

            ${embedHtml}

            <div class="nav-episodes">
    `;

    // Bouton PRÉCÉDENT (seulement si épisode > 1)
    if (prevEpisode) {
        html += `
            <a class="nav-btn" 
                href="episode.html?slug=${slug}&ep=${epNumber - 1}&part=1">
                ⬅️ Épisode précédent
            </a>`;
    }

    html += `
            <a class="nav-btn" href="emission.html?slug=${slug}">📺 Retour à l'émission</a>
    `;

    // Bouton SUIVANT
    if (nextEpisode) {
        html += `
            <a class="nav-btn" 
                href="episode.html?slug=${slug}&ep=${epNumber + 1}&part=1">
                Épisode suivant ➡️
            </a>`;
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
