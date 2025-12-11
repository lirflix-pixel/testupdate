// Script pour gérer le filtre de chaînes
  document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.card');

  function appliquerFiltre(chaine) {
    cards.forEach(card => {
      const match = (chaine === 'all' || card.dataset.chaine === chaine);
      if (match) {
        card.classList.remove('hide');
      } else {
        card.classList.add('hide');
      }
    });
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filtre = btn.getAttribute('data-filter');
      appliquerFiltre(filtre);
    });
  });

  // Par défaut : tout afficher
  appliquerFiltre('all');
});
// ===== Gestion des notes par étoiles =====
document.addEventListener("DOMContentLoaded", () => {
  const ratings = document.querySelectorAll(".rating");

  ratings.forEach(rating => {
    const emissionId = rating.dataset.emission;
    const stars = rating.querySelectorAll("span");

    // Charger la note sauvegardée
    const saved = localStorage.getItem("rating-" + emissionId);
    if (saved) {
      stars.forEach(star => {
        if (star.dataset.value <= saved) {
          star.classList.add("active");
        }
      });
    }

    // Clic sur une étoile
    stars.forEach(star => {
      star.addEventListener("click", () => {
        const value = star.dataset.value;

        // Enregistrer la note
        localStorage.setItem("rating-" + emissionId, value);

        // Réinitialiser
        stars.forEach(s => s.classList.remove("active"));

        // Activer les bonnes étoiles
        stars.forEach(s => {
          if (s.dataset.value <= value) {
            s.classList.add("active");
          }
        });
      });
    });
  });
});
document.addEventListener('DOMContentLoaded', () => {
  (async () => {
    if (!/^https?:$/.test(location.protocol)) {
      console.warn('Compteur: ouvre avec Live Server (http) ou en ligne, pas en file://');
      return;
    }

    const cards = Array.from(document.querySelectorAll('.card[href]'))
      .filter(card => card.hasAttribute('data-episodes'));

    for (const card of cards) {
      if (card.querySelector('.epi-badge')) continue;

      try {
        const url = new URL(card.getAttribute('href'), location.href).href;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);

        const html = await res.text();
        const doc  = new DOMParser().parseFromString(html, 'text/html');

        let count = doc.querySelectorAll('.page ul li').length;
        if (count === 0) count = doc.querySelectorAll('ul.episodes li').length;
        if (count === 0) count = doc.querySelectorAll('li a[href*="episode"]').length;

        if (count > 0) {
          card.setAttribute('data-episodes', String(count));
          const badge = document.createElement('span');
          badge.className = 'epi-badge';
          badge.textContent = `${count} épisodes`;
          card.appendChild(badge);
        } else {
          card.setAttribute('data-episodes', '');
        }
      } catch (e) {
        console.error('[Compteur] Erreur sur', card, e);
        card.setAttribute('data-episodes', '');
      }
    }
  })();
});
document.addEventListener('DOMContentLoaded', () => {
  (async () => {
    const get = (k, d=null) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
    const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

    const cards = document.querySelectorAll('.card[data-slug]');
    for (const card of cards) {
      const slug = card.getAttribute('data-slug');
      if (!slug) continue;

      try {
        // Récupérer la page détail pour compter les épisodes
        let url = new URL(card.getAttribute('href') || '#', location.href).href;
        if (!url.endsWith('.html')) url = url + '.html';
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        let count = doc.querySelectorAll('.page ul li').length;
        if (!count) count = doc.querySelectorAll('ul.episodes li').length;
        if (!count) count = doc.querySelectorAll('li a[href^="episode"]').length;

        // Affiche/MAJ le badge "X épisodes"
        if (count > 0) {
          card.setAttribute('data-episodes', String(count));
          let epi = card.querySelector('.epi-badge');
          if (!epi) {
            epi = document.createElement('span');
            epi.className = 'epi-badge';
            card.appendChild(epi);
          }
          epi.textContent = `${count} épisodes`;
        }

        // Etat persistant: combien l'utilisateur a "vu"
        const key = `episodes_seen_${slug}`;
        const lastSeen = parseInt(get(key, 0) || 0, 10);

        // Delta non lu => +N
        const delta = Math.max(0, count - lastSeen);
        renderNewBadge(card, delta);

        // Mémoriser le dernier "count" connu sur la carte (utile au clic)
        card.dataset.latestCount = String(count);

      } catch (e) {
        console.error('[Compteur] Erreur sur', slug, e);
      }
    }

    // Quand l'utilisateur ouvre la fiche 
        document.addEventListener('click', (e) => {
      const link = e.target.closest('.js-official-link, .card[data-slug]');
      if (!link) return;
      const card = link.closest('.card[data-slug]');
      const slug = card?.getAttribute('data-slug');
      if (!slug) return;

      const latest = parseInt(card?.dataset.latestCount || card?.getAttribute('data-episodes') || '0', 10);
      localStorage.setItem(`episodes_seen_${slug}`, JSON.stringify(latest));
      renderNewBadge(card, 0); 
    });

    function renderNewBadge(card, delta){
      // supprime existant
      const old = card.querySelector('.badge-new');
      if (old) old.remove();
      if (!delta) return;
      const b = document.createElement('span');
      b.className = 'badge-new';
      b.textContent = delta > 9 ? '+9' : `+${delta}`;
      card.appendChild(b);
    }
  })();
});

(function(){
  const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
  const FR = {0:'dimanche',1:'lundi',2:'mardi',3:'mercredi',4:'jeudi',5:'vendredi',6:'samedi'};

  function parseDays(s){
    if(!s) return [];
    return s.split(',').map(x=>x.trim().toLowerCase());
  }

  function pad(n){ return n<10 ? '0'+n : ''+n; }

  function nextOccurrence(daysList, timeStr, tz){
    // On se base sur l'heure locale du navigateur (ok pour Europe/Paris en majorité)
    const now = new Date();
    // Heure cible
    let [hh, mm] = (timeStr || '20:00').split(':').map(n=>parseInt(n,10)||0);

    // Construit une date candidate aujourd'hui
    let best = null;
    for(let add=0; add<14; add++){ // max 2 semaines de recherche
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate()+add, hh, mm, 0, 0);
      const dow = DAYS[d.getDay()];
      if(daysList.includes(dow)){
        // si c'est aujourd'hui mais heure déjà passée, on continue
        if(add===0 && d.getTime() <= now.getTime()) continue;
        best = d;
        break;
      }
    }
    return best;
  }

  function humanize(now, target){
    const oneDay = 24*60*60*1000;
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const diffDays = Math.round((startTarget - startToday)/oneDay);

    if(diffDays === 0){
      // aujourd'hui -> regarde l'heure
      const inMin = Math.round((target - now)/60000);
      if(inMin <= 0) return "Aujourd'hui";
      if(inMin < 60) return `Aujourd'hui (dans ${inMin} min)`;
      const h = Math.floor(inMin/60), m = inMin%60;
      return `Aujourd'hui (dans ${h}h${m?m:''})`;
    }
    if(diffDays === 1) return 'Demain';
    if(diffDays === 7) return `${FR[target.getDay()]} prochain `;
    if(diffDays < 7) return `Dans ${diffDays} jours (${FR[target.getDay()]})`;
    return `Le ${pad(target.getDate())}/${pad(target.getMonth()+1)}`;
  }

  const el = document.getElementById('next-ep');
  if(!el) return;

  const body = document.body;

  const finished = body.getAttribute('data-finished') === 'true';
  if (finished) {
    el.innerHTML = '🎉 Émission terminée';
    return; // stoppe ici, ne calcule pas de prochain épisode
  }
  
  const days = parseDays(body.getAttribute('data-air-days')); // ex: "mon,tue,wed,thu,fri"
  const time = body.getAttribute('data-air-time') || '20:00'; // "HH:MM"
  const tz   = body.getAttribute('data-timezone') || 'Europe/Paris';

  if(!days.length){
    el.textContent = ''; 
    return;
  }

  const now = new Date();
  const next = nextOccurrence(days, time, tz);
  if(!next){
    el.textContent = '';
    return;
  }

  const txt = humanize(now, next);

  el.innerHTML = `😎 Prochain épisode : <span class="small">${txt} à ${time}</span>`;
})();
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('go-latest');
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();

    // liste des épisodes
    const list = document.querySelector('.episodes-col ul');
    if (!list) return;

    const items = list.querySelectorAll('li');
    if (!items.length) return;

    // 👉 Descendre au DERNIER élément (en bas de page)
    const target = items[items.length - 1];

    // scroll smooth + petit highlight
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.classList.add('pulse-ep');
    setTimeout(() => target.classList.remove('pulse-ep'), 1200);
  });
});
