// 1. DÉFINITION DE L'URL DE TON SERVEUR (RENDER)
const SERVER_URL = "https://le-rat-de-wall-street-server.onrender.com";

// 2. CONNEXION UNIQUE À SOCKET.IO
// On utilise l'URL de Render explicitement
const socket = io(SERVER_URL);

// 3. CONFIGURATION DU QR CODE
// Note : Vérifie si ton URL de joueur est bien sur Railway ou si elle doit aussi être sur GitHub
const playerUrl = "https://wallstreet.up.railway.app/player.html";

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

// 6. CHARGEMENT DES IMAGES DEPUIS LE SERVEUR
async function loadLobbyBackgrounds() {
  try {
    const response = await fetch(`${SERVER_URL}/api/lobby-backgrounds`);
    const images = await response.json();

    if (!Array.isArray(images) || images.length === 0) {
      backgroundSlideshow.classList.add("background-fallback");
      return;
    }

    images.forEach((imageUrl, index) => {
      const slide = document.createElement("div");
      slide.className = "bg-slide";
      // On ajoute l'URL de Render car les images sont stockées là-bas
      slide.style.backgroundImage = `url("${SERVER_URL}${imageUrl}")`;

      if (index === 0) slide.classList.add("active");
      backgroundSlideshow.appendChild(slide);
    });

    if (images.length > 1) startSlideshow();
  } catch (error) {
    console.error("Erreur de chargement des images :", error);
    backgroundSlideshow.classList.add("background-fallback");
  }
}

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
