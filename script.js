let countdownTime = 49;
let timerId = null;
let gameLoopId = null;
let currentGameId = 1;
let selectedCards = [];
let calledNumbers = [];
let isMuted = true; // የሴት ድምፅ በራሱ ጠፍቷል (Profile ውስጥ ማብራት ይቻላል)

const cardPool = {};

document.addEventListener("DOMContentLoaded", () => {
    generateCardSelectionGrid();
    generateScoreboardGrid();
    preGenerateBingoCards();
    startCountdown();
});

// 1. የ 1-600 ካርቴላ መምረጫ ሳጥኖችን በንጹሕ ቁጥሮች ማመንጨት
function generateCardSelectionGrid() {
    const grid = document.getElementById("cards-grid");
    if (!grid) return;
    grid.innerHTML = "";
    for (let i = 1; i <= 600; i++) {
        const box = document.createElement("div");
        box.className = "card-box";
        box.innerText = i;
        box.onclick = () => selectCard(i, box);
        grid.appendChild(box);
    }
}

// 2. የ 1-75 የቢንጎ ማስተር ቦርድ ሰሌዳ ማመንጨት
function generateScoreboardGrid() {
    const ranges = [
        { id: "board-b", start: 1, end: 15 },
        { id: "board-i", start: 16, end: 30 },
        { id: "board-n", start: 31, end: 45 },
        { id: "board-g", start: 46, end: 60 },
        { id: "board-o", start: 61, end: 75 }
    ];
    ranges.forEach(range => {
        const col = document.getElementById(range.id);
        if (!col) return;
        col.innerHTML = "";
        for (let i = range.start; i <= range.end; i++) {
            const cell = document.createElement("div");
            cell.className = "board-num-cell";
            cell.id = `score-cell-${i}`;
            cell.innerText = i;
            col.appendChild(cell);
        }
    });
}

function preGenerateBingoCards() {
    for (let c = 1; c <= 600; c++) {
        cardPool[c] = createBingoMatrix();
    }
}

function createBingoMatrix() {
    const columns = [
        getRandomNumbers(1, 15, 5),
        getRandomNumbers(16, 30, 5),
        getRandomNumbers(31, 45, 5),
        getRandomNumbers(46, 60, 5),
        getRandomNumbers(61, 75, 5)
    ];
    let matrix = [];
    for (let r = 0; r < 5; r++) {
        matrix[r] = [];
        for (let c = 0; c < 5; c++) {
            matrix[r][c] = columns[c][r];
        }
    }
    matrix[2][2] = "FREE"; // መሃል ሳጥን FREE ናት
    return matrix;
}

function getRandomNumbers(min, max, count) {
    let arr = [];
    while (arr.length < count) {
        let r = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!arr.includes(r)) arr.push(r);
    }
    return arr.sort((a, b) => a - b);
}

function selectCard(num, element) {
    if (element.classList.contains("selected")) {
        element.classList.remove("selected");
        selectedCards = selectedCards.filter(id => id !== num);
    } else {
        if (selectedCards.length >= 3) return; // ማክሲመም 3 ካርቴላ ብቻ
        element.classList.add("selected");
        selectedCards.push(num);
    }
}

// 3. መደበኛ የ 49 ሰከንድ መቁጠሪያ ታይመር
function startCountdown() {
    countdownTime = 49;
    document.getElementById("timer-sec").innerText = countdownTime;
    
    if (timerId) clearInterval(timerId);
    
    timerId = setInterval(() => {
        countdownTime--;
        document.getElementById("timer-sec").innerText = countdownTime;
        if (countdownTime <= 0) {
            clearInterval(timerId);
            launchMatchPlay(); // 0 ሲሆን ጨዋታ ይጀምራል
        }
    }, 1000);
}

// 4. ጨዋታውን በይፋ ማስጀመር (0 ሰከንድ ሲሆን)
function launchMatchPlay() {
    // የላይኛውን ስታክ እና ዋሌት አለመደበቅ (ልክ እርስዎ ኤችቲኤምኤል ላይ እንዳለው ቋሚ ነው)
    document.getElementById("selection-screen").classList.add("hidden");
    document.getElementById("gameplay-screen").classList.remove("hidden");
    
    const gameIdField = document.getElementById("game-id-display");
    gameIdField.innerText = `ID: ${String(currentGameId).padStart(4, '0')}`;
    gameIdField.classList.remove("hidden");
    
    document.getElementById("selected-count-top").innerText = selectedCards.length;
    document.getElementById("derash-amount").innerText = selectedCards.length * 8;
    document.getElementById("live-stats").classList.remove("hidden");
    
    renderSelectedCardsOnScreen();
    calledNumbers = [];
    startCallingNumbersLoop();
}

function renderSelectedCardsOnScreen() {
    const listContainer = document.getElementById("player-cards-list");
    if (!listContainer) return;
    listContainer.innerHTML = "";
    
    if (selectedCards.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center;width:100%;color:#8fa0c4;font-size:12px;">የተመረጠ ካርቴላ የለም።</div>`;
        return;
    }
    
    selectedCards.forEach(cardId => {
        const matrix = cardPool[cardId];
        const cardDiv = document.createElement("div");
        cardDiv.className = "mini-card";
        cardDiv.innerHTML = `<div class="card-title-header">ካርቴላ #${cardId}</div>`;
        
        const grid = document.createElement("div");
        grid.className = "grid-5x5";
        
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const val = matrix[r][c];
                const cell = document.createElement("div");
                if (val === "FREE") {
                    cell.className = "cell-5x5 free-space marked";
                    cell.innerText = "FREE";
                } else {
                    cell.className = "cell-5x5";
                    cell.id = `cell-${cardId}-${val}`;
                    cell.innerText = val;
                }
                grid.appendChild(cell);
            }
        }
        cardDiv.appendChild(grid);
        listContainer.appendChild(cardDiv);
    });
}

// 5. የቢንጎ ቁጥሮችን በየ 4 ሰከንዱ የመጥራት ዑደት
function startCallingNumbersLoop() {
    let pool75 = Array.from({ length: 75 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    
    if (gameLoopId) clearInterval(gameLoopId);
    
    gameLoopId = setInterval(() => {
        if (pool75.length === 0) { clearInterval(gameLoopId); return; }
        
        let ball = pool75.pop();
        calledNumbers.push(ball);
        
        let letter = "", colorClass = "";
        if (ball <= 15) { letter = "B"; colorClass = "hit-B"; }
        else if (ball <= 30) { letter = "I"; colorClass = "hit-I"; }
        else if (ball <= 45) { letter = "N"; colorClass = "hit-N"; }
        else if (ball <= 60) { letter = "G"; colorClass = "hit-G"; }
        else { letter = "O"; colorClass = "hit-O"; }
        
        const displayBox = document.getElementById("called-ball-display");
        if (displayBox) {
            displayBox.className = colorClass;
            displayBox.innerText = `${letter}-${ball}`;
        }
        
        const scoreCell = document.getElementById(`score-cell-${ball}`);
        if (scoreCell) scoreCell.classList.add(colorClass);
        
        selectedCards.forEach(cardId => {
            const cell = document.getElementById(`cell-${cardId}-${ball}`);
            if (cell) cell.classList.add("marked");
        });
        
        if (!isMuted) { announceNumberSpeech(letter + " " + ball); }

        // አውቶማቲክ አሸናፊ መፈለግ
        let winnerCardId = checkRealBingoWinner();
        if (winnerCardId) { 
            clearInterval(gameLoopId);
            triggerWinnerSequence(winnerCardId);
        }
    }, 4000);
}

function checkRealBingoWinner() {
    for (let cardId of selectedCards) {
        const matrix = cardPool[cardId];
        let markedMatrix = [];
        for (let r = 0; r < 5; r++) {
            markedMatrix[r] = [];
            for (let c = 0; c < 5; c++) {
                let val = matrix[r][c];
                markedMatrix[r][c] = (val === "FREE" || calledNumbers.includes(val));
            }
        }
        for (let r = 0; r < 5; r++) {
            if (markedMatrix[r][0] && markedMatrix[r][1] && markedMatrix[r][2] && markedMatrix[r][3] && markedMatrix[r][4]) return cardId;
        }
        for (let c = 0; c < 5; c++) {
            if (markedMatrix[0][c] && markedMatrix[1][c] && markedMatrix[2][c] && markedMatrix[3][c] && markedMatrix[4][c]) return cardId;
        }
        if (markedMatrix[0][0] && markedMatrix[1][1] && markedMatrix[2][2] && markedMatrix[3][3] && markedMatrix[4][4]) return cardId;
        if (markedMatrix[0][4] && markedMatrix[1][3] && markedMatrix[2][2] && markedMatrix[3][1] && markedMatrix[4][0]) return cardId;
    }
    return null;
}

function announceNumberSpeech(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'en-US';
    window.speechSynthesis.speak(speech);
}

function triggerWinnerSequence(cardId) {
    document.getElementById("winner-tg-name").innerText = `ካርቴላ #${cardId} አሸንፏል!`;
    document.getElementById("winner-modal").classList.remove("hidden");
    
    // 🌟 ልክ በ 4 ሰከንድ ውስጥ በግዴታ ወደ ኋላ 1-600 መመለሻ ዑደት
    setTimeout(() => { resetAndRestartLobbyLoop(); }, 4000);
}

// 6. ጨዋታው አልቆ ወደ መጀመሪያው የካርቴላ ምርጫ ገጽ በግዴታ መመለሻ
function resetAndRestartLobbyLoop() {
    document.getElementById("winner-modal").classList.add("hidden");
    document.getElementById("live-stats").classList.add("hidden");
    document.getElementById("game-id-display").classList.add("hidden");
    
    selectedCards = []; 
    calledNumbers = []; 
    currentGameId++;
    
    document.querySelectorAll(".board-num-cell").forEach(cell => cell.className = "board-num-cell");
    document.getElementById("called-ball-display").className = "called-ball-empty";
    document.getElementById("called-ball-display").innerText = "-";
    
    generateCardSelectionGrid();
    document.getElementById("gameplay-screen").classList.add("hidden");
    document.getElementById("selection-screen").classList.remove("hidden"); // 👈 ቀጥታ ወደ 1-600 ይመለሳል
    
    startCountdown();
}

// 7. የታችኛው የናቪጌሽን ባር ገጽ መቀያየሪያ (ሙሉ በሙሉ የተከፈተ)
window.switchTab = function(tabId, navBtn) {
    document.querySelectorAll(".tab-view").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(btn => btn.classList.remove("active"));
    
    document.getElementById(tabId).classList.add("active");
