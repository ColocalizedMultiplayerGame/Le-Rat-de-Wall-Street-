
// 1. DÉFINITION DE L'URL DE TON NOUVEAU SERVEUR MULTISESSION
const SERVER_URL = "https://le-rat-de-wall-street-server-ko13.onrender.com";

// 2. CONNEXION UNIQUE À SOCKET.IO
const socket = io(SERVER_URL);

// 3. GÉNÉRATION OU RÉCUPÉRATION DU CODE DE SALON (ROOM ID)
// On génère un code de 4 lettres uniques pour cette session de Lobby
function generateRoomId() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}
const roomId = generateRoomId();

// On stocke le roomId dans la session pour que screen.html puisse le récupérer
sessionStorage.setItem("current_room_id", roomId);

// Mettre à jour l'URL de la manette pour y inclure le roomId en paramètre
const playerUrl = `https://colocalizedmultiplayergame.github.io/Le-Rat-de-Wall-Street-Manette-/?room=${roomId}`;

// Affichage textuel du code sur le lobby (si tu ajoutes un élément HTML dédié)
const roomDisplayEl = document.getElementById("room-id-display");
if (roomDisplayEl) {
    roomDisplayEl.textContent = roomId;
}

const qrCodeContainer = document.getElementById("qrcode");
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

// 4. REJOINDRE LA ROOM EN TANT QU'ADMIN
socket.emit("admin:join-room", { roomId });

const gameStatusEl = document.getElementById("game-status");
const waitingCountEl = document.getElementById("waiting-count");
const activeCountEl = document.getElementById("active-count");
const openGameButton = document.getElementById("open-game-button");
const closeGameButton = document.getElementById("close-game-button");

// 5. GESTION DES BOUTONS (On envoie le roomId au serveur)
openGameButton.addEventListener("click", () => {
  console.log(`Demande d'ouverture de la partie pour la room ${roomId}...`);
  socket.emit("admin:open-game", { roomId });
  window.open("screen.html", "_blank");
});

closeGameButton.addEventListener("click", () => {
  socket.emit("admin:close-game", { roomId });
});

// 6. MISE À JOUR DU LOBBY (REÇU DU SERVEUR SPÉCIFIQUE À LA ROOM)
socket.on("lobby:update", (data) => {
  if (gameStatusEl)
    gameStatusEl.textContent = data.isGameOpen ? "Partie ouverte" : "Partie fermée";
  if (waitingCountEl) waitingCountEl.textContent = data.waitingCount;
  if (activeCountEl) activeCountEl.textContent = data.activeCount;
});

// === GESTION DU DIAPORAMA (Inchangée) ===
const LOBBY_IMAGES = ["rat-bureau.png", "rat-conference.png", "rat-metro.png"];

function loadLobbyBackgrounds() {
    const backgroundSlideshow = document.getElementById("background-slideshow");
    if (!backgroundSlideshow) return;

    // Évite de dupliquer les images si la fonction est appelée deux fois
    backgroundSlideshow.innerHTML = "";

    LOBBY_IMAGES.forEach((imageName, index) => {
        const slide = document.createElement("div");
        slide.className = "bg-slide";
        slide.style.backgroundImage = `url("${imageName}")`;
        if (index === 0) slide.classList.add("active");
        backgroundSlideshow.appendChild(slide);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadLobbyBackgrounds();
    if (LOBBY_IMAGES.length > 1) {
        startSlideshow();
    }
});

function startSlideshow() {
  const slides = document.querySelectorAll(".bg-slide");
  let currentIndex = 0;
  if (slides.length === 0) return;

  setInterval(() => {
    if(slides[currentIndex]) slides[currentIndex].classList.remove("active");
    currentIndex = (currentIndex + 1) % slides.length;
    if(slides[currentIndex]) slides[currentIndex].classList.add("active");
  }, 7000);
}
