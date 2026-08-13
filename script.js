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

let gameRunning = false;
let gamePaused = false;
let score = 0;
let recordScore = parseInt(localStorage.getItem('recordScore')) || 0;
let time = 0;
let currentBgColorIndex = 0;

const segments = [];
const initialSegmentCount = 1;
let currentSegmentCount = 1;
const segmentDistance = 8;

let speed = 4;
let directionX = 1;
let directionY = 0;
let nextDirectionX = 1;
let nextDirectionY = 0;
let moveCounter = 0;
let isAccelerating = false;
let ignoreNextContactToggle = false;

let food = {
    x: 0,
    y: 0
};

function createSegment(x, y) {
    return { x, y };
}

function resetSnakeState() {
    score = 0;
    currentSegmentCount = 1;
    currentBgColorIndex = 0;
    nextObstacleScore = 1000;
    obstacles.length = 0;
    segments.length = 0;

    for (let i = 0; i < initialSegmentCount; i++) {
        segments.push(createSegment(canvas.width / 2 - i * segmentDistance, canvas.height / 2));
    }

    directionX = 1;
    directionY = 0;
    nextDirectionX = 1;
    nextDirectionY = 0;
}

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
    const footerHeight = footerElement ? footerElement.getBoundingClientRect().height : 0;
    
    // Detecta se é tela mobile e reserva um espaço maior e real para os botões e painel de controle
    const isMobileViewport = window.innerWidth <= 900;
    const mobileControlArea = isMobileViewport ? 280 : 0; // Aumentado para 280px para caber os botões perfeitamente
    
    // Subtrai a altura da barra do navegador, do footer e da área dos botões da tela
    const availableHeight = window.innerHeight - footerHeight - mobileControlArea;

    canvas.width = window.innerWidth;
    canvas.height = Math.max(220, availableHeight); // Altura segura mínima para o jogo rodar
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
}

function closeContactWidget() {
    const contactWidget = document.querySelector('.contact-widget');
    contactWidget?.classList.remove('open');
}

function drawCircle(x, y, radius, fillStyle, strokeStyle, strokeWidth) {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = strokeWidth || 1;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
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

function drawMenu() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Título principal proporcional para telas mobile
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SKULL SNAKE', canvas.width / 2, canvas.height / 2 - 130);

    // Instruções com fontes menores e espaçamento controlado
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    
    let startY = canvas.height / 2 - 80;
    let lineHeight = 28;

    ctx.fillText('Pressione ENTER para começar', canvas.width / 2, startY);
    ctx.fillText('ENTER também pausa', canvas.width / 2, startY + lineHeight);
    ctx.fillText('Use SETAS para dirigir', canvas.width / 2, startY + (lineHeight * 2));
    ctx.fillText('Use ESPAÇO para acelerar', canvas.width / 2, startY + (lineHeight * 3));
    ctx.fillText('Colete comida para crescer', canvas.width / 2, startY + (lineHeight * 4));

    drawCircle(canvas.width / 2, startY + (lineHeight * 5) + 10, 8, '#aaa', '#777', 1.3);
    ctx.textAlign = 'left';
}

function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Título PAUSA proporcional
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 40px Arial'; // Reduzido de 60px para 40px
    ctx.textAlign = 'center';
    ctx.fillText('PAUSA', canvas.width / 2, canvas.height / 2 - 20);

    // Instrução centralizada logo abaixo
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial'; // Reduzido de 30px para 16px
    ctx.textAlign = 'center';
    ctx.fillText('Pressione ENTER para continuar', canvas.width / 2, canvas.height / 2 + 20);

    ctx.textAlign = 'left';
}

function drawFood() {
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(food.x, food.y, foodRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(food.x, food.y, foodRadius, 0, Math.PI * 2);
    ctx.stroke();
}

function drawObstacles() {
    obstacles.forEach((obs) => {
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(obs.x - obs.size / 2, obs.y - obs.size / 2, obs.size, obs.size);
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(obs.x - obs.size / 2, obs.y - obs.size / 2, obs.size, obs.size);
    });
}

function drawSnakeBody() {
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(segments[0].x, segments[0].y);
    for (let i = 1; i < segments.length; i++) {
        ctx.lineTo(segments[i].x, segments[i].y);
    }
    ctx.stroke();

    for (let i = 0; i < segments.length; i++) {
        const size = 9 * (1 - (i / segments.length) * 0.85);
        const colorValue = Math.floor(170 - (i / segments.length) * 100);
        ctx.fillStyle = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
        ctx.beginPath();
        ctx.arc(segments[i].x, segments[i].y, size, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#555';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(segments[i].x, segments[i].y, size, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawHead() {
    let bodyAngle;
    const desiredAngle = directionX !== 0 ? (directionX > 0 ? 0 : Math.PI) : (directionY > 0 ? Math.PI / 2 : -Math.PI / 2);

    if (segments.length > 1) {
        const dx = segments[1].x - segments[0].x;
        const dy = segments[1].y - segments[0].y;
        const dist = Math.hypot(dx, dy);

        if (dist > 1) {
            const dot = dx * Math.cos(desiredAngle) + dy * Math.sin(desiredAngle);
            bodyAngle = dot > 0 ? Math.atan2(dy, dx) : desiredAngle;
        } else {
            bodyAngle = desiredAngle;
        }
    } else {
        bodyAngle = desiredAngle;
    }

    drawCircle(segments[0].x, segments[0].y, 9, '#aaa', '#777', 1.3);

    const snoutX = segments[0].x + Math.cos(bodyAngle) * 11;
    const snoutY = segments[0].y + Math.sin(bodyAngle) * 11;
    drawCircle(snoutX, snoutY, 5, '#999', '#666', 1);

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
    drawCircle(eyeLeftX, eyeLeftY, 2, '#111');

    const eyeRightX = segments[0].x + Math.cos(bodyAngle - Math.PI / 5) * eyeDistance - eyeOffsetX;
    const eyeRightY = segments[0].y + Math.sin(bodyAngle - Math.PI / 5) * eyeDistance - eyeOffsetY;
    drawCircle(eyeRightX, eyeRightY, 2, '#111');
}

function drawUI() {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Score: ' + score, 20, 40);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Record: ' + recordScore, 20, 70);
}

function gameOver() {
    gameRunning = false;
    gamePaused = false;
    closeContactWidget();

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

    resetSnakeState();
    setNewFoodPosition();
}

function drawSkullSnake() {
    ctx.fillStyle = bgColors[currentBgColorIndex];
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!gameRunning) {
        drawMenu();
        return;
    }

    if (gamePaused) {
        drawPauseScreen();
        return;
    }

    drawWalls();

    directionX = nextDirectionX;
    directionY = nextDirectionY;

    const moveFrameThreshold = isAccelerating ? 1 : 3;
    moveCounter++;

    if (moveCounter >= moveFrameThreshold) {
        moveCounter = 0;

        let prevX = segments[0].x;
        let prevY = segments[0].y;

        segments[0].x += directionX * speed;
        segments[0].y += directionY * speed;

        for (let i = 1; i < segments.length; i++) {
            const tempX = segments[i].x;
            const tempY = segments[i].y;
            segments[i].x = prevX;
            segments[i].y = prevY;
            prevX = tempX;
            prevY = tempY;
        }
    }

    const distance = Math.hypot(segments[0].x - food.x, segments[0].y - food.y);

    if (distance < foodRadius + headRadius) {
        score += 10;

        if (segments.length > 0) {
            segments.push(createSegment(segments[segments.length - 1].x, segments[segments.length - 1].y));
        } else {
            segments.push(createSegment(segments[0].x, segments[0].y));
        }

        currentSegmentCount = segments.length;

        if (score >= nextObstacleScore) {
            addObstacle();
            nextObstacleScore += 1000;
        }

        if (score % 100 === 0) {
            currentBgColorIndex = (score / 100 - 1) % bgColors.length;
        }

        if (score > recordScore) {
            recordScore = score;
            localStorage.setItem('recordScore', recordScore);
        }

        setNewFoodPosition();
    }

    for (let i = 6; i < segments.length; i++) {
        const segmentDistanceToHead = Math.hypot(
            segments[0].x - segments[i].x,
            segments[0].y - segments[i].y
        );

        if (segmentDistanceToHead < 9) {
            gameOver();
            return;
        }
    }

    if (
        segments[0].x - headRadius <= wallThickness ||
        segments[0].x + headRadius >= canvas.width - wallThickness ||
        segments[0].y - headRadius <= wallThickness ||
        segments[0].y + headRadius >= canvas.height - wallThickness
    ) {
        gameOver();
        return;
    }

    if (obstacles.some((obs) => {
        const dx = Math.abs(segments[0].x - obs.x);
        const dy = Math.abs(segments[0].y - obs.y);
        const half = obs.size / 2 + headRadius;
        return dx < half && dy < half;
    })) {
        gameOver();
        return;
    }

    drawFood();
    drawObstacles();
    drawSnakeBody();
    drawHead();
    drawUI();
}

function animate() {
    drawSkullSnake();
    requestAnimationFrame(animate);
}

setNewFoodPosition();
for (let i = 0; i < initialSegmentCount; i++) {
    segments.push(createSegment(canvas.width / 2 - i * segmentDistance, canvas.height / 2));
}

updateCanvasSize();
window.addEventListener('resize', updateCanvasSize);

animate();

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        toggleGameFlow();
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

function toggleGameFlow() {
    if (!gameRunning) {
        closeContactWidget();
        ignoreNextContactToggle = true;
        const toggleBtn = document.getElementById('contact-toggle');
        toggleBtn?.blur();
        gameRunning = true;
        gamePaused = false;
        return;
    }

    gamePaused = !gamePaused;
}

function setDirectionFromInput(direction) {
    switch (direction) {
        case 'up':
            if (directionY === 0) {
                nextDirectionX = 0;
                nextDirectionY = -1;
            }
            break;
        case 'down':
            if (directionY === 0) {
                nextDirectionX = 0;
                nextDirectionY = 1;
            }
            break;
        case 'left':
            if (directionX === 0) {
                nextDirectionX = -1;
                nextDirectionY = 0;
            }
            break;
        case 'right':
            if (directionX === 0) {
                nextDirectionX = 1;
                nextDirectionY = 0;
            }
            break;
    }
}

function bindMobileControls() {
    const controlButtons = document.querySelectorAll('.control-btn');
    const boostButton = document.querySelector('.speed-btn');
    const startButton = document.querySelector('.start-btn');
    const pauseButton = document.querySelector('.pause-btn');

    controlButtons.forEach((button) => {
        const direction = button.dataset.direction;

        const activate = (event) => {
            event.preventDefault();
            setDirectionFromInput(direction);
        };

        button.addEventListener('pointerdown', activate);
        button.addEventListener('touchstart', activate, { passive: false });
    });

    if (boostButton) {
        const startBoost = (event) => {
            event.preventDefault();
            isAccelerating = true;
        };

        const stopBoost = (event) => {
            event.preventDefault();
            isAccelerating = false;
        };

        boostButton.addEventListener('pointerdown', startBoost);
        boostButton.addEventListener('pointerup', stopBoost);
        boostButton.addEventListener('pointerleave', stopBoost);
        boostButton.addEventListener('pointercancel', stopBoost);
        boostButton.addEventListener('touchstart', startBoost, { passive: false });
        boostButton.addEventListener('touchend', stopBoost, { passive: false });
    }

    if (startButton) {
        startButton.addEventListener('click', () => {
            toggleGameFlow();
        });
    }

    if (pauseButton) {
        pauseButton.addEventListener('click', () => {
            if (gameRunning) {
                gamePaused = !gamePaused;
            }
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    bindMobileControls();

    const toggleButton = document.getElementById('contact-toggle');
    const contactWidget = document.querySelector('.contact-widget');
    const shareButton = document.getElementById('share-link-btn');

    if (toggleButton && contactWidget) {
        toggleButton.addEventListener('click', () => {
            if (ignoreNextContactToggle) {
                ignoreNextContactToggle = false;
                return;
            }
            contactWidget.classList.toggle('open');
        });
    }

    if (shareButton) {
        shareButton.addEventListener('click', async () => {
            const url = 'https://skullsnake.netlify.app/';
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
