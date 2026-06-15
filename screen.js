let leaderboardHistory = [];

const socket = io("https://le-rat-de-wall-street-server.onrender.com");

// RÉCUPÉRATION DU ROOM ID DEPUIS LE SESSION STORAGE
const roomId = sessionStorage.getItem("current_room_id");

if (roomId) {
    // On informe le serveur que cet écran écoute la room spécifique
    socket.emit("screen:join-room", { roomId });
} else {
    alert("Erreur : Aucun salon détecté. Veuillez repasser par le Lobby.");
}

const alertBox = document.getElementById("alert-box");
const timerValue = document.getElementById("timer-value");
const leaderboardContainer = document.getElementById("leaderboard-container");
const canvas = document.getElementById("market-chart");

const colors = ["#ea9c0b", "#3fe047", "#f00000", "#1e33a8", "#25c76a"];
const FIXED_HISTORY_LENGTH = 50;

let countdownSeconds = 5 * 60; 
let timerInterval = null;
let gameAlreadyStarted = false; 

const newsItemWrapper = document.getElementById("news-item-wrapper");
const newsIconContainer = document.getElementById("news-icon-container");
const newsIcon = document.getElementById("news-icon");

// --- INLINE LEGEND PLUGIN (Inchangé) ---
const inlineLegendPlugin = {
    id: 'inlineLegend',
    afterDatasetsDraw(chart) {
        const ctx = chart.ctx;
        ctx.save();
        ctx.font = 'bold 20px "Lilita One", Arial, sans-serif';
        ctx.textBaseline = 'middle';
        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            if (!meta.hidden && dataset.data.length > 0) {
                const lastPointIndex = dataset.data.length - 1;
                const lastPoint = meta.data[lastPointIndex];
                if (lastPoint) {
                    ctx.fillStyle = dataset.borderColor; 
                    ctx.fillText(dataset.label, lastPoint.x + 10, lastPoint.y);
                }
            }
        });
        ctx.restore();
    }
};

// --- INITIALISATION DU GRAPHIQUE (Inchangé) ---
let chart = new Chart(canvas, {
    type: "line",
    data: {
        labels: Array.from({ length: FIXED_HISTORY_LENGTH }, (_, i) => i + 1),
        datasets: []
    },
    plugins: [inlineLegendPlugin],
    options: {
        layout: { padding: { right: 120 } },
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false } },
        scales: {
            x: {
                ticks: {
                    color: "#666",
                    callback: (val, index) => (index + 1) % 5 === 0 ? 'T' + (index + 1) : null
                },
                grid: { color: "#ddd" }
            },
            y: { ticks: { color: "#666" }, grid: { color: "#ddd" } }
        }
    }
});

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function startCountdown() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
        countdownSeconds--;
        timerValue.textContent = formatTime(countdownSeconds);

        if (countdownSeconds <= 60) {
            timerValue.classList.add('timer-stress');
        }

        if (countdownSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            // On envoie le signal de fin avec le roomId
            socket.emit("admin:close-game", { roomId });
        }
    }, 1000);
}

function resetCountdown() {
    clearInterval(timerInterval);
    timerInterval = null;
    countdownSeconds = 5 * 60;
    timerValue.textContent = "STOP";
    timerValue.classList.remove('timer-stress');
    gameAlreadyStarted = false;
}

// --- ÉCOUTE DE L'ÉVÉNEMENT DU SALON ---
socket.on("game:update", data => {
    if (!data.isGameOpen && data.endStats) {
        resetCountdown();
        sessionStorage.setItem("wallstreet_endStats", JSON.stringify(data.endStats));
        window.location.href = "endscreen.html";
        return;
    }

    if (data.isGameOpen) {
        if (!gameAlreadyStarted) {
            gameAlreadyStarted = true;
            startCountdown();
        }
    } else {
        resetCountdown();
    }

    // Gestion des News
    if (data.newsEvent && data.newsEvent.text) {
        alertBox.textContent = data.newsEvent.text;
        if (data.newsEvent.type === "positive") {
            alertBox.style.borderColor = "#28a745"; 
            alertBox.style.backgroundColor = "#beffbe";
            newsIcon.src = "positif.png";
        } else if (data.newsEvent.type === "negative") {
            alertBox.style.borderColor = "#dc3545"; 
            alertBox.style.backgroundColor = "#ffe6e6";
            newsIcon.src = "danger.webp";
        } else {
            alertBox.style.borderColor = "#ffaa00"; 
            alertBox.style.backgroundColor = "#ffecc7";
            newsIcon.src = "neutre.png";
        }
    }

    if (!gameAlreadyStarted && alertBox.textContent.trim() === "") {
        alertBox.textContent = "LIVE NEWS — En attente d'un événement marché...";
        alertBox.style.borderColor = "#ffaa00";
        newsIcon.src = "neutre.png";
    }

    // Classement / Leaderboard
    if (data.leaderboard) {
        leaderboardHistory.push(data.leaderboard);
        if (leaderboardHistory.length > 30) {
            leaderboardHistory.shift();
        }
        const pastLeaderboard = leaderboardHistory[0];
        leaderboardContainer.innerHTML = "";

        data.leaderboard.forEach((player, index) => {
            const currentRank = index + 1;
            let trendIcon = '=';
            let trendClass = 'trend-eq';

            const pastIndex = pastLeaderboard.findIndex(p => p.id === player.id);
            if (pastIndex !== -1) {
                const pastRank = pastIndex + 1;
                if (currentRank < pastRank) {
                    trendIcon = '▲'; trendClass = 'trend-up';
                } else if (currentRank > pastRank) {
                    trendIcon = '▼'; trendClass = 'trend-down';
                }
            } else {
                trendIcon = '▲'; trendClass = 'trend-up';
            }

            const rankDisplay = currentRank === 1
                ? `<span class="crown">👑</span> 1`
                : `<span class="${trendClass}">${trendIcon}</span> ${currentRank}`;

            const formattedScore = Math.round(player.totalValue).toLocaleString('fr-FR');

            const row = document.createElement("div");
            row.className = "lb-row";
            row.innerHTML = `
                <div class="lb-rank">${rankDisplay}</div>
                <div class="lb-name">${player.name}</div>
                <div class="lb-score">${formattedScore} €</div>
            `;
            leaderboardContainer.appendChild(row);
        });
    }

    // Graphique de la bourse
    if (data.actions && data.actions.length > 0) {
        chart.data.datasets = data.actions.map((action, index) => ({
            label: action.name,
            data: action.history || [],
            borderColor: colors[index % colors.length],
            backgroundColor: "transparent",
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 4
        }));
        chart.update("none");
    }
});
