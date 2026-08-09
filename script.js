const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const footerElement = document.querySelector('.main-footer');

const wallThickness = 12;
const headRadius = 9;
const foodRadius = 6;
const obstacleSize = foodRadius * 2;
const obstacles = [];
let nextObstacleScore = 1000;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Cores leves para o background
const bgColors = [
    '#0a0a0a',
    '#1a1510',
    '#151a15',
    '#0f151a',
    '#1a0f15',
    '#15180f',
    '#0a1215',
    '#150f10'
];

// Variáveis do jogo
let gameRunning = false;
let gamePaused = false;
let score = 0;
let recordScore = parseInt(localStorage.getItem('recordScore')) || 0;
let time = 0;
let currentBgColorIndex = 0;

// Configuração do Skull Snake
const segments = [];
const initialSegmentCount = 1;
let currentSegmentCount = 1;
const segmentDistance = 8;

// Velocidade e direção
let speed = 4;
let baseSpeed = 4;
let directionX = 1;
let directionY = 0;
let nextDirectionX = 1;
let nextDirectionY = 0;
let moveCounter = 0;
let isAccelerating = false;

// Comida
let food = {
    x: 0,
    y: 0
};

setNewFoodPosition();

// Inicializar segmentos (apenas cabeça)
for (let i = 0; i < initialSegmentCount; i++) {
    segments.push({
        x: canvas.width / 2 - i * segmentDistance,
        y: canvas.height / 2
    });
}

// Listeners de teclado
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (!gameRunning) {
            gameRunning = true;
            gamePaused = false;
        } else {
            gamePaused = !gamePaused;
        }
    } else if (e.key === ' ') {
        isAccelerating = true;
        e.preventDefault();
    } else if (gameRunning && !gamePaused) {
        switch (e.key) {
            case 'ArrowUp':
                if (directionY === 0) {
                    nextDirectionX = 0;
                    nextDirectionY = -1;
                }
                break;
            case 'ArrowDown':
                if (directionY === 0) {
                    nextDirectionX = 0;
                    nextDirectionY = 1;
                }
                break;
            case 'ArrowLeft':
                if (directionX === 0) {
                    nextDirectionX = -1;
                    nextDirectionY = 0;
                }
                break;
            case 'ArrowRight':
                if (directionX === 0) {
                    nextDirectionX = 1;
                    nextDirectionY = 0;
                }
                break;
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === ' ') {
        isAccelerating = false;
    }
});

function getRandomFieldPosition(radius) {
    const min = wallThickness + radius + 6;
    const maxX = canvas.width - wallThickness - radius - 6;
    const maxY = canvas.height - wallThickness - radius - 6;

    return {
        x: Math.random() * (maxX - min) + min,
        y: Math.random() * (maxY - min) + min
    };
}

function setNewFoodPosition() {
    let newFood = getRandomFieldPosition(foodRadius);
    let attempts = 0;

    while (
        attempts < 50 &&
        obstacles.some((obs) => Math.hypot(newFood.x - obs.x, newFood.y - obs.y) < obstacleSize + foodRadius + 12)
    ) {
        newFood = getRandomFieldPosition(foodRadius);
        attempts++;
    }

    food = newFood;
}

function addObstacle() {
    let newObstacle;
    let attempts = 0;

    do {
        newObstacle = getRandomFieldPosition(obstacleSize / 2);
        attempts++;
    } while (
        attempts < 40 &&
        Math.hypot(newObstacle.x - food.x, newObstacle.y - food.y) < obstacleSize + foodRadius + 10
    );

    obstacles.push({
        x: newObstacle.x,
        y: newObstacle.y,
        size: obstacleSize
    });
}

function updateCanvasSize() {
    const contactElement = document.querySelector('.contacts-section');
    const footerHeight = footerElement ? footerElement.getBoundingClientRect().height : 0;
    const contactHeight = contactElement ? contactElement.getBoundingClientRect().height : 0;
    const availableHeight = window.innerHeight - footerHeight - contactHeight;

    canvas.width = window.innerWidth;
    canvas.height = Math.max(260, availableHeight);
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
}

updateCanvasSize();
window.addEventListener('resize', updateCanvasSize);

// Função para desenhar uma vértebra (não mais usada)
function drawVertebra(x, y, size) {
    // Removido - agora segmentos são desenhados diretamente
}

function drawWalls() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, wallThickness);
    ctx.fillRect(0, 0, wallThickness, canvas.height);
    ctx.fillRect(canvas.width - wallThickness, 0, wallThickness, canvas.height);
    ctx.fillRect(0, canvas.height - wallThickness, canvas.width, wallThickness);

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(wallThickness / 2, wallThickness / 2, canvas.width - wallThickness, canvas.height - wallThickness);
}

// Função principal do jogo
function drawSkullSnake() {
    // Cor de fundo
    ctx.fillStyle = bgColors[currentBgColorIndex];
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!gameRunning) {
        // Desenhar menu
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SKULL SNAKE', canvas.width / 2, canvas.height / 2 - 100);
        
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.fillText('Pressione ENTER para começar', canvas.width / 2, canvas.height / 2);
        ctx.fillText('ENTER também pausa', canvas.width / 2, canvas.height / 2 + 50);
        ctx.fillText('Use SETAS para dirigir', canvas.width / 2, canvas.height / 2 + 100);
        ctx.fillText('Use ESPAÇO para acelerar', canvas.width / 2, canvas.height / 2 + 150);
        ctx.fillText('Colete comida para crescer', canvas.width / 2, canvas.height / 2 + 200);
        
        // Desenhar réptil no menu
        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2 + 250, 9, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#777';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2 + 250, 9, 0, Math.PI * 2);
        ctx.stroke();

        ctx.textAlign = 'left';
        return;
    }

    if (gamePaused) {
        // Desenhar tela de pausa
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSA', canvas.width / 2, canvas.height / 2);
        
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.fillText('Pressione ENTER para continuar', canvas.width / 2, canvas.height / 2 + 80);
        
        ctx.textAlign = 'left';
        return;
    }

    drawWalls();

    // Atualizar direção
    directionX = nextDirectionX;
    directionY = nextDirectionY;

    // Mover a cada 3 frames para controlar a velocidade (ou 1 se acelerado - dobro)
    const moveFrameThreshold = isAccelerating ? 1 : 3;
    moveCounter++;
    
    if (moveCounter >= moveFrameThreshold) {
        moveCounter = 0;
        
        // Mover cabeça
        segments[0].x += directionX * speed;
        segments[0].y += directionY * speed;

        // Mover outros segmentos (manter o tamanho correto)
        for (let i = segments.length - 1; i > 0; i--) {
            segments[i].x = segments[i - 1].x;
            segments[i].y = segments[i - 1].y;
        }
    }

    // Verificar colisão com comida
    const distance = Math.hypot(segments[0].x - food.x, segments[0].y - food.y);

    if (distance < foodRadius + headRadius) {
        score += 10;
        
        // Adicionar novo segmento (corpo cresce)
        if (segments.length < currentSegmentCount) {
            segments.push({
                x: segments[segments.length - 1].x,
                y: segments[segments.length - 1].y
            });
        }
        currentSegmentCount++;
        
        // Adicionar obstáculo a cada 1000 pontos
        if (score >= nextObstacleScore) {
            addObstacle();
            nextObstacleScore += 1000;
        }

        // Atualizar cor de fundo a cada 100 pontos
        if (score % 100 === 0) {
            currentBgColorIndex = (score / 100 - 1) % bgColors.length;
        }
        
        if (score > recordScore) {
            recordScore = score;
            localStorage.setItem('recordScore', recordScore);
        }
        
        // Nova comida
        setNewFoodPosition();
    }

    // Verificar colisão consigo mesmo (apenas a partir do segmento 6 para evitar falsos positivos)
    for (let i = 6; i < segments.length; i++) {
        const distance = Math.hypot(
            segments[0].x - segments[i].x,
            segments[0].y - segments[i].y
        );
        if (distance < 9) {
            gameOver();
            return;
        }
    }

    // Colisão com a parede
    if (
        segments[0].x - headRadius <= wallThickness ||
        segments[0].x + headRadius >= canvas.width - wallThickness ||
        segments[0].y - headRadius <= wallThickness ||
        segments[0].y + headRadius >= canvas.height - wallThickness
    ) {
        gameOver();
        return;
    }

    // Colisão com obstáculos
    if (obstacles.some((obs) => {
        const dx = Math.abs(segments[0].x - obs.x);
        const dy = Math.abs(segments[0].y - obs.y);
        const half = obs.size / 2 + headRadius;
        return dx < half && dy < half;
    })) {
        gameOver();
        return;
    }

    // Desenhar comida (menor)
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(food.x, food.y, foodRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(food.x, food.y, foodRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Desenhar obstáculos
    obstacles.forEach((obs) => {
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(obs.x - obs.size / 2, obs.y - obs.size / 2, obs.size, obs.size);
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(obs.x - obs.size / 2, obs.y - obs.size / 2, obs.size, obs.size);
    });

    // Desenhar coluna vertebral
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(segments[0].x, segments[0].y);
    for (let i = 1; i < segments.length; i++) {
        ctx.lineTo(segments[i].x, segments[i].y);
    }
    ctx.stroke();

    // Desenhar corpo (segmentos progressivos como cauda)
    for (let i = 0; i < segments.length; i++) {
        // Tamanho começa na cabeça (9) e vai afinando
        const size = 9 * (1 - (i / segments.length) * 0.85);
        
        // Cor gradualmente mais escura
        const colorValue = Math.floor(170 - (i / segments.length) * 100);
        ctx.fillStyle = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
        ctx.beginPath();
        ctx.arc(segments[i].x, segments[i].y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Borda
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(segments[i].x, segments[i].y, size, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Desenhar cabeça
    const bodyAngle = segments.length > 1 ? Math.atan2(
        segments[1].y - segments[0].y,
        segments[1].x - segments[0].x
    ) : directionX !== 0 ? (directionX > 0 ? 0 : Math.PI) : (directionY > 0 ? Math.PI / 2 : -Math.PI / 2);
    
    ctx.fillStyle = '#aaa';
    ctx.beginPath();
    ctx.arc(segments[0].x, segments[0].y, 9, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(segments[0].x, segments[0].y, 9, 0, Math.PI * 2);
    ctx.stroke();

    const snoutX = segments[0].x + Math.cos(bodyAngle) * 11;
    const snoutY = segments[0].y + Math.sin(bodyAngle) * 11;
    ctx.fillStyle = '#999';
    ctx.beginPath();
    ctx.arc(snoutX, snoutY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(snoutX, snoutY, 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#777';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(segments[0].x + Math.cos(bodyAngle) * 8, segments[0].y + Math.sin(bodyAngle) * 8);
    ctx.lineTo(snoutX, snoutY);
    ctx.stroke();

    const eyeDistance = 6;
    const eyeOffsetX = Math.cos(bodyAngle) * 2.5;
    const eyeOffsetY = Math.sin(bodyAngle) * 2.5;

    const eyeLeftX = segments[0].x + Math.cos(bodyAngle + Math.PI / 5) * eyeDistance - eyeOffsetX;
    const eyeLeftY = segments[0].y + Math.sin(bodyAngle + Math.PI / 5) * eyeDistance - eyeOffsetY;
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(eyeLeftX, eyeLeftY, 2, 0, Math.PI * 2);
    ctx.fill();
    
    const eyeRightX = segments[0].x + Math.cos(bodyAngle - Math.PI / 5) * eyeDistance - eyeOffsetX;
    const eyeRightY = segments[0].y + Math.sin(bodyAngle - Math.PI / 5) * eyeDistance - eyeOffsetY;
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(eyeRightX, eyeRightY, 2, 0, Math.PI * 2);
    ctx.fill();

    drawUI();
}

function drawUI() {
    // Score atual
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Score: ' + score, 20, 40);
    
    // Record
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Record: ' + recordScore, 20, 70);
}

function gameOver() {
    gameRunning = false;
    gamePaused = false;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 80);
    
    ctx.fillStyle = '#fff';
    ctx.font = '40px Arial';
    ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText('Record: ' + recordScore, canvas.width / 2, canvas.height / 2 + 80);
    
    ctx.fillStyle = '#00ff00';
    ctx.font = '30px Arial';
    ctx.fillText('Pressione ENTER para tentar novamente', canvas.width / 2, canvas.height / 2 + 160);
    
    ctx.textAlign = 'left';
    
    // Reset
    score = 0;
    currentSegmentCount = 1;
    currentBgColorIndex = 0;
    nextObstacleScore = 1000;
    obstacles.length = 0;
    segments.length = 0;
    for (let i = 0; i < initialSegmentCount; i++) {
        segments.push({
            x: canvas.width / 2 - i * segmentDistance,
            y: canvas.height / 2
        });
    }
    directionX = 1;
    directionY = 0;
    nextDirectionX = 1;
    nextDirectionY = 0;
    setNewFoodPosition();
}

function animate() {
    drawSkullSnake();
    requestAnimationFrame(animate);
}

animate();

window.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('contact-toggle');
    const contactWidget = document.querySelector('.contact-widget');
    const shareButton = document.getElementById('share-link-btn');

    if (toggleButton && contactWidget) {
        toggleButton.addEventListener('click', () => {
            contactWidget.classList.toggle('open');
        });
    }

    if (shareButton) {
        shareButton.addEventListener('click', async () => {
            const url = window.location.href;
            try {
                await navigator.clipboard.writeText(url);
                shareButton.textContent = 'Link copiado!';
                setTimeout(() => {
                    shareButton.textContent = 'Copiar link';
                }, 1800);
            } catch (error) {
                shareButton.textContent = 'Erro ao copiar';
                setTimeout(() => {
                    shareButton.textContent = 'Copiar link';
                }, 1800);
            }
        });
    }
});
