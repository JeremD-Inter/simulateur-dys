// script.js — Version complète corrigée avec hallucination stable et tous les effets

const contenu = document.getElementById("contenu");
const wrapper = document.getElementById("contenu-wrapper");
const fenetreLecture = document.getElementById("fenetre-lecture");
const btnSuivant = document.getElementById("suivant");
const btnPrecedent = document.getElementById("precedent");
const boutonEtapeSuivante = document.getElementById("etape-suivante");
const boutonEtapePrecedente = document.getElementById("etape-precedente");

let etapeActuelle = 0;
let paragraphes = [];
let currentPage = 0;
let totalPages = 1;
const paragraphesLus = new Set();
let pageHeight = 0;

let startTime = Date.now();
let dernierChangementFlou = 0;
let flouActif = false;
let prochainGresillement = 20;
let dureeGresillement = 30;
let hallucinationPhase = "waiting";
let hallucinationStart = null;
let prochainHallucination = 30;
let microDistortionActive = false;

const fichiersTemplates = ["template1.html", "template2.html", "template3.html", "template4.html", "template5.html", "template6.html", "template7.html", "template8.html"];

window.addEventListener("DOMContentLoaded", () => {
  chargerEtape(etapeActuelle);
  requestAnimationFrame(boucleEffets);
});

function scrollToPage(pageIndex) {
  const offset = pageIndex * pageHeight;
  wrapper.style.transform = `translateY(-${offset}px)`;
}

async function chargerEtape(index) {
  if (index < 0 || index >= fichiersTemplates.length) return;

  try {
    const response = await fetch(fichiersTemplates[index]);
    if (!response.ok) throw new Error("Fichier non trouvé");
    const html = await response.text();

    const temp = document.createElement("div");
    temp.innerHTML = html;

    const template = temp.querySelector("template");
    if (template) {
      contenu.innerHTML = "";
      contenu.appendChild(template.content.cloneNode(true));
    } else {
      contenu.innerHTML = html;
    }

    paragraphes = Array.from(contenu.querySelectorAll("p"));
    pageHeight = fenetreLecture.clientHeight;
    currentPage = 0;
    startTime = Date.now();
    flouActif = false;
    contenu.style.transform = "scale(1)";
    contenu.className = "";
    contenu.style.filter = "";

    setTimeout(() => {
      // Recalcule des dimensions
      pageHeight = fenetreLecture.clientHeight;
      totalPages = Math.ceil(contenu.scrollHeight / pageHeight);
      wrapper.style.height = `${contenu.scrollHeight}px`;
      wrapper.style.transition = "transform 0.4s ease";
      scrollToPage(currentPage);

      // ✅ Sauvegarde des textes originaux après DOM rendu
      sauvegarderTexteOriginal();

      // Distorsion uniquement si effets actifs
      if (window.effetsActifs) {
        distortHiddenParagraphs();
      }

      if (contenu.querySelector(".question")) {
        activerQuizz();
      }
    }, 300);

  } catch (err) {
    contenu.innerHTML = `<p>Erreur de chargement de l'étape ${index + 1}</p>`;
    console.error(err);
  }
}

function getParagraphsHorsVue() {
  const rect = fenetreLecture.getBoundingClientRect();
  return paragraphes.filter(p => {
    const pr = p.getBoundingClientRect();
    return pr.bottom < rect.top || pr.top > rect.bottom;
  });
}

function shuffleInternalLetters(word) {
  if (word.length <= 3) return word;
  const middle = word.slice(1, -1).split('');
  for (let i = 0; i < middle.length - 1; i++) {
    if (Math.random() < 0.3) {
      [middle[i], middle[i + 1]] = [middle[i + 1], middle[i]];
    }
  }
  return word[0] + middle.join('') + word[word.length - 1];
}

function reverseSyllables(word) {
  const match = word.match(/[aeiouy]+[^aeiouy]*/gi);
  if (!match || match.length < 2) return word;
  return match.reverse().join('');
}

function substitutePhonetics(word) {
  return word
    .replace(/ph/gi, "f")
    .replace(/qu/gi, "k")
    .replace(/ou/gi, "u")
    .replace(/ai/gi, "è")
    .replace(/eau/gi, "o")
    .replace(/ch/gi, "sh");
}

function distortSentenceText(text, intensify = false) {
  let words = text.split(' ').map(word => {
    if (Math.random() < (intensify ? 0.4 : 0.15)) {
      return shuffleInternalLetters(word);
    } else if (Math.random() < (intensify ? 0.25 : 0.07)) {
      return reverseSyllables(word);
    } else if (Math.random() < (intensify ? 0.15 : 0.05)) {
      return substitutePhonetics(word);
    }
    return word;
  });

  if (intensify && Math.random() < 0.4) {
    const index = Math.floor(Math.random() * (words.length - 2));
    const segment = words.splice(index, 2);
    words.splice(index, 0, ...segment.reverse());
  }

  const parasites = ['heu', 'donc', 'alors', 'bon', 'hmm'];
  if (intensify && Math.random() < 0.3) {
    const insertAt = Math.floor(Math.random() * words.length);
    words.splice(insertAt, 0, parasites[Math.floor(Math.random() * parasites.length)]);
  }

  return words.join(' ').replace(/[,.!?;:]/g, '');
}

function distortHiddenParagraphs() {
  if (!window.effetsActifs) return;
  const horsVue = getParagraphsHorsVue();
  horsVue.forEach(p => {
    const original = p.dataset.original || p.innerText;
    p.dataset.original = original;
    const dejaLu = paragraphesLus.has(p);
    const distorted = distortSentenceText(original, dejaLu);
    p.innerText = distorted;
    p.setAttribute("data-ghost", distorted);
  });
}

function microGlitchVisibleText() {
  if (!window.effetsActifs) return;
  const rect = fenetreLecture.getBoundingClientRect();
  const visibles = paragraphes.filter(p => {
    const pr = p.getBoundingClientRect();
    return pr.top >= rect.top && pr.bottom <= rect.bottom;
  });

  visibles.forEach(p => {
    const words = p.innerText.split(" ");
    const index = Math.floor(Math.random() * words.length);
    const word = words[index];
    if (!word || word.length < 4) return;

    const glitched = shuffleInternalLetters(word);
    words[index] = glitched;
    const original = p.innerText;
    p.innerText = words.join(" ");

    setTimeout(() => {
      p.innerText = original;
    }, 600);
  });
}

function updateFlou(elapsed) {
  if (!window.effetsActifs) return;
  if (elapsed > 30 && !flouActif) {
    flouActif = true;
    contenu.classList.add("blur-fatigue", "halo-fatigue");
    dernierChangementFlou = elapsed;
  }
  if (flouActif && elapsed - dernierChangementFlou > 12) {
    const intensite = [0.6, 0.7, 0.8];
    const val = intensite[Math.floor(Math.random() * intensite.length)];
    contenu.style.filter = `blur(${val}px) contrast(1.02)`;
    dernierChangementFlou = elapsed;
  }
}

function updateGresillement(elapsed) {
  if (!window.effetsActifs) return;
  if (elapsed >= prochainGresillement) {
    contenu.classList.add("gresillement-subtil");
    setTimeout(() => contenu.classList.remove("gresillement-subtil"), dureeGresillement * 1000);
    prochainGresillement = elapsed + 30 + Math.random() * 30;
    dureeGresillement = 6 + Math.floor(Math.random() * 10);
  }
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function updateHallucination(elapsed) {
  if (!window.effetsActifs) return;
  const zoomMax = 1.01;
  const riseDuration = 60;
  const holdDuration = 10;
  const fallDuration = 60;

  if (elapsed >= prochainHallucination && hallucinationPhase === "waiting") {
    hallucinationStart = elapsed;
    hallucinationPhase = "rising";
  }

  if (hallucinationPhase === "rising") {
    const t = Math.min(1, (elapsed - hallucinationStart) / riseDuration);
    const scale = 1 + (zoomMax - 1) * easeInOutCubic(t);
    contenu.style.transform = `scale(${scale})`;

    if (t >= 1) {
      hallucinationPhase = "holding";
      hallucinationStart = elapsed;
    }
  } else if (hallucinationPhase === "holding") {
    contenu.style.transform = `scale(${zoomMax})`;
    if (elapsed - hallucinationStart >= holdDuration) {
      hallucinationPhase = "falling";
      hallucinationStart = elapsed;
    }
  } else if (hallucinationPhase === "falling") {
    const t = Math.max(0, 1 - (elapsed - hallucinationStart) / fallDuration);
    const scale = 1 + (zoomMax - 1) * easeInOutCubic(t);
    contenu.style.transform = `scale(${scale})`;

    if (t <= 0.001) {
      hallucinationPhase = "waiting";
      contenu.style.transform = "scale(1)";
      prochainHallucination = elapsed + 60 + Math.random() * 60;
    }
  }
}


function updateMicroDistortion(elapsed) {
  if (!window.effetsActifs) return;
  if (!microDistortionActive && elapsed > 45 && Math.random() < 0.01) {
    contenu.classList.add("deformation-subtile");
    microDistortionActive = true;
    setTimeout(() => {
      contenu.classList.remove("deformation-subtile");
      microDistortionActive = false;
    }, 8000 + Math.random() * 8000);
  }
}

function boucleEffets() {
  if (!window.effetsActifs) {
    requestAnimationFrame(boucleEffets);
    return;
  }

  const elapsed = (Date.now() - startTime) / 1000;
  updateFlou(elapsed);
  updateGresillement(elapsed);
  updateHallucination(elapsed);
  updateMicroDistortion(elapsed);
  if (elapsed % 10 < 0.1) microGlitchVisibleText();
  requestAnimationFrame(boucleEffets);
}

function activerQuizz() {
  const questions = document.querySelectorAll(".question");
  questions.forEach((question) => {
    const correctIndices = question.dataset.correct
      .split(",")
      .map(i => parseInt(i));
    const options = question.querySelectorAll(".option");
    let answered = false;

    options.forEach((option, index) => {
      option.addEventListener("click", () => {
        if (answered) return;
        answered = true;

        options.forEach((opt, i) => {
          if (correctIndices.includes(i)) {
            opt.classList.add("correct");
          } else if (opt === option) {
            opt.classList.add("incorrect");
          }
          opt.disabled = true;
        });
      });
    });
  });
}

function restaurerTexteOriginal() {
  if (!paragraphes.length) return;
  paragraphes.forEach(p => {
    if (p.dataset.original) {
      p.innerText = p.dataset.original;
    }
  });
}

function sauvegarderTexteOriginal() {
  paragraphes.forEach(p => {
    if (!p.dataset.original) {
      p.dataset.original = p.innerText;
    }
  });
}

// Navigation scroll
btnSuivant.addEventListener("click", () => {
  if (currentPage < totalPages - 1) {
    currentPage++;
    scrollToPage(currentPage);
    const visibles = paragraphes.filter(p => {
      const rect = p.getBoundingClientRect();
      const fenRect = fenetreLecture.getBoundingClientRect();
      return rect.top >= fenRect.top && rect.bottom <= fenRect.bottom;
    });
    visibles.forEach(p => paragraphesLus.add(p));
    setTimeout(() => distortHiddenParagraphs(), 1000);
  }
});

btnPrecedent.addEventListener("click", () => {
  if (currentPage > 0) {
    currentPage--;
    scrollToPage(currentPage);
    const visibles = paragraphes.filter(p => {
      const rect = p.getBoundingClientRect();
      const fenRect = fenetreLecture.getBoundingClientRect();
      return rect.top >= fenRect.top && rect.bottom <= fenRect.bottom;
    });
    visibles.forEach(p => paragraphesLus.add(p));
    setTimeout(() => distortHiddenParagraphs(), 1000);
  }
});

// Navigation étapes
boutonEtapeSuivante.addEventListener("click", () => {
  if (etapeActuelle < fichiersTemplates.length - 1) {
    etapeActuelle++;
    chargerEtape(etapeActuelle);
  }
});

boutonEtapePrecedente.addEventListener("click", () => {
  if (etapeActuelle > 0) {
    etapeActuelle--;
    chargerEtape(etapeActuelle);
  }
});

if (typeof window.effetsActifs === "undefined") {
  window.effetsActifs = false;
}

// Reprise automatique de la boucle si activé dynamiquement
window.addEventListener("effetsActifsChange", () => {
  if (window.effetsActifs) {
    startTime = Date.now();
    requestAnimationFrame(boucleEffets);
  } else {
    // ⛔ Stoppe les effets et restaure le texte
    contenu.className = '';
    contenu.style.filter = '';
    contenu.style.transform = 'scale(1)';
    restaurerTexteOriginal();
  }
});


