// 1. DÉFINITION DE L'URL DE TON SERVEUR (RENDER)
const SERVER_URL = "https://le-rat-de-wall-street-server.onrender.com";

// 2. CONNEXION UNIQUE À SOCKET.IO
// On utilise l'URL de Render explicitement
const socket = io(SERVER_URL);

// 3. CONFIGURATION DU QR CODE
// Note : Vérifie si ton URL de joueur est bien sur Railway ou si elle doit aussi être sur GitHub
const playerUrl = "https://alexandre94460vlt.github.io/Le-Rat-de-Wall-Street-Manette-/";

const qrCodeContainer = document.getElementById("qrcode");
const backgroundSlideshow = document.getElementById("background-slideshow");
const gameStatusEl = document.getElementById("game-status");
const waitingCountEl = document.getElementById("waiting-count");
const activeCountEl = document.getElementById("active-count");
const openGameButton = document.getElementById("open-game-button");
const closeGameButton = document.getElementById("close-game-button");

if (qrCodeContainer) {
  new QRCode(qrCodeContainer, {
    text: playerUrl,
    width: 300,
    height: 300,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });
}

// 4. GESTION DES BOUTONS
openGameButton.addEventListener("click", () => {
  console.log("Demande d'ouverture de partie...");
  socket.emit("admin:open-game");
  // Ouvre l'écran de jeu (doit être présent sur ton GitHub)
  window.open("screen.html", "_blank");
});

closeGameButton.addEventListener("click", () => {
  socket.emit("admin:close-game");
});

// 5. MISE À JOUR DU LOBBY (REÇU DU SERVEUR)
socket.on("lobby:update", (data) => {
  if (gameStatusEl)
    gameStatusEl.textContent = data.isGameOpen
      ? "Partie ouverte"
      : "Partie fermée";
  if (waitingCountEl) waitingCountEl.textContent = data.waitingCount;
  if (activeCountEl) activeCountEl.textContent = data.activeCount;
});

// Liste des fichiers tels qu'ils apparaissent à la racine
const LOBBY_IMAGES = [
    "rat-bureau.png",
    "rat-conference.png", // Renommez 'rat-confe||ürence..png' en 'rat-conference.png'
    "rat-metro.png"
];

function loadLobbyBackgrounds() {
    const backgroundSlideshow = document.getElementById("background-slideshow");

    if (!backgroundSlideshow) {
        console.error("L'élément #background-slideshow est introuvable dans le HTML.");
        return;
    }

    LOBBY_IMAGES.forEach((imageName, index) => {
        const slide = document.createElement("div");
        slide.className = "bg-slide";
        
        // Puisque tout est à la racine, on met juste le nom du fichier
        slide.style.backgroundImage = `url("${imageName}")`;

        if (index === 0) slide.classList.add("active");
        backgroundSlideshow.appendChild(slide);
    });

    if (LOBBY_IMAGES.length > 1 && typeof startSlideshow === "function") {
        startSlideshow();
    }
}

// Appeler la fonction au chargement
document.addEventListener("DOMContentLoaded", loadLobbyBackgrounds);

function startSlideshow() {
  const slides = document.querySelectorAll(".bg-slide");
  let currentIndex = 0;
  if (slides.length === 0) return;

  setInterval(() => {
    slides[currentIndex].classList.remove("active");
    currentIndex = (currentIndex + 1) % slides.length;
    slides[currentIndex].classList.add("active");
  }, 7000);
}

// Lancement au chargement de la page
loadLobbyBackgrounds();
