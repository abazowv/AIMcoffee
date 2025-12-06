let currentLang = 'ru';
let bonuses = parseInt(localStorage.getItem('ayla_bonuses')) || 0;
let historyStack = [];

// === Баннеры (Акции) ===
const banners = [
    { title_ru: "4-й кофе в подарок!", title_en: "Every 4th coffee is free!", img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800" },
    { title_ru: "Скидка 20% с другом", title_en: "Bring a friend - 20% off", img: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800" },
    { title_ru: "Счастливые часы -30%", title_en: "Happy Hours -30%", img: "https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=800" },
    { title_ru: "Кофе + Десерт = -25%", title_en: "Coffee + Dessert = -25%", img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800" }
];

// === Инициализация ===
document.addEventListener('DOMContentLoaded', () => {
    updateBonusDisplay();
    toggleBackButton(false);
});

// === Исправленная функция обновления бонусов ===
function updateBonusDisplay() {
    // Ищем элемент с ID 'bonus-score' (это ID в главном меню)
    const elMain = document.getElementById('bonus-score');
    if(elMain) {
        // Убеждаемся, что значение отображается как целое число
        elMain.textContent = Math.floor(bonuses);
    }
}

function setLanguage(lang) {
    currentLang = lang;
    document.getElementById('language-screen').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');

    const isRu = lang === 'ru';
    // Переводы интерфейса
    document.querySelector('.play-text').textContent = isRu ? 'Игра' : 'Play';
    document.getElementById('game-title').textContent = isRu ? 'Dino Run' : 'Dino Run';
    document.getElementById('game-desc').innerHTML = isRu
        ? 'Тапай чтобы прыгать 🦖.<br>Избегай кактусов 🌵.'
        : 'Tap to jump 🦖.<br>Avoid the cactus 🌵.';

    // Безопасная проверка, если элемент еще не загружен
    const promoTitle = document.querySelector('.section-title');
    if(promoTitle) promoTitle.textContent = isRu ? 'Акции' : 'Promo';


    initCarousel();
    loadCategories();
}

// === КАРУСЕЛЬ (Оставлена без изменений логика) ===
let currentSlide = 0;
let carouselInterval;

function initCarousel() {
    const track = document.getElementById('carousel-track');
    const indicators = document.getElementById('carousel-indicators');
    const container = document.getElementById('carousel-container-box');
    if(!track) return;

    track.innerHTML = '';
    indicators.innerHTML = '';

    banners.forEach((banner, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.innerHTML = `
            <img src="${banner.img}" draggable="false" onerror="this.src='https://via.placeholder.com/800x400'">
            <div class="carousel-caption"><h3>${currentLang === 'ru' ? banner.title_ru : banner.title_en}</h3></div>
        `;
        track.appendChild(slide);

        const dot = document.createElement('div');
        dot.className = 'indicator' + (index === 0 ? ' active' : '');
        dot.onclick = () => { currentSlide = index; updateCarouselPosition(); };
        indicators.appendChild(dot);
    });

    let touchStartX = 0;
    let touchEndX = 0;
    container.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; clearInterval(carouselInterval); }, {passive: true});
    container.addEventListener('touchend', (e) => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); startCarouselAuto(); }, {passive: true});
    function handleSwipe() {
        if (touchEndX < touchStartX - 50) nextSlide();
        if (touchEndX > touchStartX + 50) prevSlide();
    }
    updateCarouselPosition();
    startCarouselAuto();
}
function updateCarouselPosition() {
    const track = document.getElementById('carousel-track');
    if(track) track.style.transform = `translateX(-${currentSlide * 100}%)`;
    document.querySelectorAll('.indicator').forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
}
function nextSlide() { currentSlide = (currentSlide + 1) % banners.length; updateCarouselPosition(); }
function prevSlide() { currentSlide = (currentSlide - 1 + banners.length) % banners.length; updateCarouselPosition(); }
function startCarouselAuto() { clearInterval(carouselInterval); carouselInterval = setInterval(nextSlide, 5000); }


// === МЕНЮ И НАВИГАЦИЯ (С правками) ===

async function loadCategories() {
    const container = document.getElementById('categories');
    container.classList.remove('hidden');
    document.getElementById('promo-carousel').classList.remove('hidden');
    document.getElementById('items').classList.add('hidden');

    // ИЗМЕНЕНИЕ: Скрываем кнопку "Назад" в шапке на главном экране меню
    toggleBackButton(false);
    historyStack = [];

    container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#666;">Loading...</div>';

    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        container.innerHTML = '';

        if(categories.length === 0) {
            container.innerHTML = '<p style="text-align:center; width:100%; opacity:0.6;">Нет категорий</p>';
            return;
        }

        categories.forEach((cat, index) => {
            const div = document.createElement('div');
            div.className = 'category-card';
            div.style.animationDelay = `${index * 0.1}s`;
            div.innerHTML = `
                <img src="${cat.image || 'img/placeholder.png'}" alt="${cat.name_ru}" onerror="this.src='https://via.placeholder.com/300'">
                <span class="category-title">${currentLang === 'ru' ? cat.name_ru : cat.name_en}</span>
            `;
            div.onclick = () => loadItems(cat.id, currentLang === 'ru' ? cat.name_ru : cat.name_en);
            container.appendChild(div);
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p style="color:red; text-align:center;">Ошибка подключения</p>';
    }
}

async function loadItems(catId, catName) {
    historyStack.push('categories');
    // Теперь кнопка "Назад" в шапке всегда видна, если мы не на экране выбора языка
    // toggleBackButton(true); // Убрано, т.к. мы используем кнопку внутри контента
    document.getElementById('categories').classList.add('hidden');
    document.getElementById('promo-carousel').classList.add('hidden');
    const container = document.getElementById('items');
    container.classList.remove('hidden');

    const backText = currentLang === 'ru' ? '❮ Назад' : '❮ Back';

    // ИЗМЕНЕНИЕ: Добавление кнопки "Назад" в контент
    container.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; padding: 10px 25px; max-width:900px; margin: 0 auto;">
             <button onclick="goBack()" class="inline-back-btn" style="background:none; border:1px solid var(--accent); color:var(--accent); padding:8px 16px; border-radius:15px; cursor:pointer; font-weight:600; font-size:0.9rem;">${backText}</button>
             <h2 class="section-title" style="margin:0; text-align:right;">${catName}</h2>
        </div>
        <div id="items-list" class="items-list-container"><div style="text-align:center;">Loading...</div></div>
    `;

    try {
        const response = await fetch(`/api/items?category_id=${catId}`);
        const items = await response.json();
        const list = document.getElementById('items-list');
        list.innerHTML = '';

        if(items.length === 0) {
            list.innerHTML = '<p class="empty-state" style="text-align:center; color:#666;">В этой категории пока пусто</p>';
            return;
        }

        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'item-card';
            div.style.animationDelay = `${index * 0.1}s`;
            const desc = currentLang === 'ru' ? item.description_ru : item.description_en;
            div.innerHTML = `
                <img src="${item.image || 'img/placeholder.png'}" onerror="this.src='https://via.placeholder.com/150'">
                <div class="item-details">
                    <span class="item-name">${currentLang === 'ru' ? item.name_ru : item.name_en}</span>
                    ${desc ? `<span class="item-desc">${desc}</span>` : ''}
                    <span class="item-price">${item.price} ₽</span>
                </div>`;
            list.appendChild(div);
        });
    } catch (error) {
        console.error(error);
    }
}

function goBack() {
    if (historyStack.length > 0) {
        historyStack.pop();
        document.getElementById('items').classList.add('hidden');
        document.getElementById('categories').classList.remove('hidden');
        document.getElementById('promo-carousel').classList.remove('hidden');
        // На экране категорий стрелка в шапке скрывается, т.к. есть кнопка "Игра"
        toggleBackButton(false);
    } else {
        document.getElementById('menu-screen').classList.add('hidden');
        document.getElementById('language-screen').classList.remove('hidden');
        toggleBackButton(false);
    }
}

function toggleBackButton(show) {
    const btn = document.getElementById('back-btn');
    if(btn) {
        btn.style.visibility = show ? 'visible' : 'hidden';
        btn.style.opacity = show ? '1' : '0';
    }
}


// ==========================================
// === ИГРА: DINO RUN (С ИСПРАВЛЕНИЕМ ОТРАЖЕНИЯ) ===
// ==========================================

const canvas = document.getElementById('game-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

let gameRunning = false;
let score = 0;
let frame = 0;
let animationId;
let gameSpeed = 5;

// Dino Physics
let dino = {
    x: 50,
    y: 200,
    width: 40,
    height: 40,
    dy: 0,
    jumpStrength: -12,
    gravity: 0.6,
    grounded: false,
    icon: '🦖'
};

let obstacles = [];
const groundHeight = 250; // Y позиция земли

function openGame() {
    const modal = document.getElementById('game-modal');
    modal.classList.remove('hidden');
    document.getElementById('high-score').textContent = localStorage.getItem('ayla_highscore') || 0;

    // Адаптация размера canvas
    const modalContent = document.querySelector('.modal-content');
    if(canvas && modalContent) {
        canvas.width = modalContent.clientWidth;
        canvas.height = 300; // Фиксированная высота для игры
    }

    window.addEventListener('resize', resizeCanvas);
}

function closeGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    document.getElementById('game-modal').classList.add('hidden');
    window.removeEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const modalContent = document.querySelector('.modal-content');
    if (canvas && modalContent) {
        canvas.width = modalContent.clientWidth;
    }
}

function startGame() {
    document.getElementById('game-start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');

    // Reset variables
    score = 0;
    gameSpeed = 5;
    obstacles = [];
    frame = 0;
    dino.y = groundHeight - dino.height;
    dino.dy = 0;

    gameRunning = true;
    gameLoop();
}

// Управление прыжком
function jump() {
    if (dino.grounded && gameRunning) {
        dino.dy = dino.jumpStrength;
        dino.grounded = false;
    }
}

// Слушатели событий для игры
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') jump();
});
if(canvas) {
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); jump(); }, {passive: false});
    canvas.addEventListener('mousedown', (e) => { jump(); });
}

function gameLoop() {
    if (!gameRunning) return;
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

function update() {
    frame++;

    // Ускорение игры
    if (frame % 1000 === 0) gameSpeed += 0.5;

    // Dino Physics
    dino.dy += dino.gravity;
    dino.y += dino.dy;

    // Проверка земли
    if (dino.y + dino.height > groundHeight) {
        dino.y = groundHeight - dino.height;
        dino.dy = 0;
        dino.grounded = true;
    } else {
        dino.grounded = false;
    }

    // Генерация препятствий (Кактусы)
    if (frame % 120 === 0 || (Math.random() < 0.01 && frame % 60 !== 0)) {
        let minGap = 300; // Минимальное расстояние между кактусами
        let lastObstacleX = obstacles.length > 0 ? obstacles[obstacles.length - 1].x : 0;

        if (canvas.width - lastObstacleX > minGap || obstacles.length === 0) {
            spawnObstacle();
        }
    }

    // Движение препятствий и коллизии
    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.x -= gameSpeed;

        // Коллизия (простое прямоугольное пересечение с отступом)
        let hitBoxPadding = 10;
        if (
            dino.x < obs.x + obs.width - hitBoxPadding &&
            dino.x + dino.width > obs.x + hitBoxPadding &&
            dino.y < obs.y + obs.height - hitBoxPadding &&
            dino.y + dino.height > obs.y + hitBoxPadding
        ) {
            gameOver(currentLang === 'ru' ? 'Врезался в кактус! 🌵' : 'Hit a cactus! 🌵');
            return;
        }

        // Прошел препятствие - очки
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            score++;
            i--;
        }
    }
}

function spawnObstacle() {
    const types = ['🌵', '🌲'];
    const icon = types[Math.floor(Math.random() * types.length)];
    obstacles.push({
        x: canvas.width,
        y: groundHeight - 40,
        width: 30,
        height: 40,
        icon: icon
    });
}

function draw() {
    // Очистка
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем линию земли
    ctx.beginPath();
    ctx.moveTo(0, groundHeight);
    ctx.lineTo(canvas.width, groundHeight);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.stroke();

    // === ИСПРАВЛЕНИЕ: Отражаем Динозаврика по оси X ===

    // 1. Сохраняем текущее состояние Canvas
    ctx.save();

    // 2. Сдвигаем начало координат к центру Дино (для корректного отражения)
    ctx.translate(dino.x + dino.width / 2, 0);

    // 3. Отражаем по горизонтали
    ctx.scale(-1, 1);

    // 4. Рисуем Динозаврика
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    // Эффект бега (покачивание)
    let bounce = 0;
    if(dino.grounded) {
        bounce = Math.sin(frame * 0.3) * 2;
    }

    // Рисуем текст в новых координатах. X=0 - центр отражения
    ctx.fillText(dino.icon, 0, dino.y + bounce);

    // 5. Восстанавливаем предыдущее состояние Canvas (Сброс трансформации)
    ctx.restore();

    // === Конец блока Дино ===

    // Рисуем препятствия (без изменений)
    obstacles.forEach(obs => {
        ctx.font = "40px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(obs.icon, obs.x, obs.y);
    });

    // Счет на экране (без изменений)
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText((currentLang==='ru'?"Счет: ":"Score: ") + score, 20, 30);
}

function gameOver(reason) {
    gameRunning = false;
    cancelAnimationFrame(animationId);

    let highscore = parseInt(localStorage.getItem('ayla_highscore')) || 0;
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('ayla_highscore', highscore);
    }

    // Начисляем бонусы (1 очко игры = 1 бонус)
    bonuses += score;
    localStorage.setItem('ayla_bonuses', bonuses);
    updateBonusDisplay();

    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('game-over-reason').textContent = reason;
    document.getElementById('current-score').textContent = score;
}