(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const WIDTH = 350;
  const HEIGHT = 600;

  const playerWidth = 40;
  const playerHeight = 40;
  const enemyWidth = 40;
  const enemyHeight = 40;
  const bulletWidth = 6;
  const bulletHeight = 12;
  const bulletSpeed = 7;
  const enemySpeedMin = 1.3;
  const enemySpeedMax = 2.5;
  const enemyBulletSpeed = 5;
  const enemyShootChancePerFrame = 0.008;

  // === Background Music ===
  const bgMusic = new Audio('music/bg-music.mp3'); // Replace with your path
  bgMusic.loop = true;
  bgMusic.volume = 0.5;

  const player = {
    x: WIDTH / 2 - playerWidth / 2,
    y: HEIGHT - playerHeight - 10,
    width: playerWidth,
    height: playerHeight,
    speed: 6,
    movingLeft: false,
    movingRight: false,
    canShoot: true,
    shootCooldown: 300,
  };

  let score = 0;
  let gameOver = false;

  const bullets = [];
  const enemies = [];
  const enemyBullets = [];

  const playerPlaneSrc = 'data:image/svg+xml;utf8,\
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="%233399ff" stroke-width="3" stroke-linejoin="round">\
<polygon points="32 4 24 24 12 24 8 40 56 40 52 24 40 24 32 4"/>\
<line x1="32" y1="4" x2="32" y2="60" stroke="%230066cc" stroke-width="2"/>\
</svg>';

  const enemyPlaneSrc = 'data:image/svg+xml;utf8,\
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="%23ff3333" stroke-width="3" stroke-linejoin="round">\
<polygon points="32 60 40 40 52 40 56 24 8 24 12 40 24 40 32 60"/>\
<line x1="32" y1="60" x2="32" y2="4" stroke="%23cc0000" stroke-width="2"/>\
</svg>';

  const playerImg = new Image();
  playerImg.src = playerPlaneSrc;

  const enemyImg = new Image();
  enemyImg.src = enemyPlaneSrc;

  class Bullet {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = bulletWidth;
      this.height = bulletHeight;
      this.speed = bulletSpeed;
      this.active = true;
    }
    update() {
      this.y -= this.speed;
      if (this.y + this.height < 0) this.active = false;
    }
    draw() {
      ctx.fillStyle = '#66bbff';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.strokeStyle = '#3388ff';
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  }

  class EnemyBullet {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = bulletWidth;
      this.height = bulletHeight;
      this.speed = enemyBulletSpeed;
      this.active = true;
    }
    update() {
      this.y += this.speed;
      if (this.y > HEIGHT) this.active = false;
    }
    draw() {
      ctx.fillStyle = '#ff6666';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.strokeStyle = '#cc3333';
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  }

  class Enemy {
    constructor(x, y, speed) {
      this.x = x;
      this.y = y;
      this.width = enemyWidth;
      this.height = enemyHeight;
      this.speed = speed;
      this.active = true;
      this.shootCooldown = Math.floor(1000 + Math.random() * 2000);
      this.lastShootTime = performance.now();
    }
    update() {
      this.y += this.speed;
      if (this.y > HEIGHT) this.active = false;
    }
    tryShoot() {
      const now = performance.now();
      if (now - this.lastShootTime > this.shootCooldown) {
        enemyBullets.push(new EnemyBullet(this.x + this.width / 2 - bulletWidth / 2, this.y + this.height));
        this.shootCooldown = Math.floor(1000 + Math.random() * 2500);
        this.lastShootTime = now;
      }
    }
    draw() {
      if (enemyImg.complete) {
        ctx.drawImage(enemyImg, this.x, this.y, this.width, this.height);
      } else {
        ctx.fillStyle = '#ff5555';
        ctx.fillRect(this.x, this.y, this.width, this.height);
      }
    }
  }

  window.addEventListener('keydown', e => {
    if (gameOver) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') player.movingLeft = true;
    if (e.key === 'ArrowRight' || e.key === 'd') player.movingRight = true;
    if (e.key === ' ' || e.key === 'ArrowUp') shoot();
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') player.movingLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd') player.movingRight = false;
  });

  let touchX = null;
  let touchActive = false;
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (gameOver) return;
    if (e.touches.length === 1) {
      touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
      touchActive = true;
      shoot();
    }
  });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!touchActive) return;
    if (e.touches.length === 1) {
      touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
    }
  });
  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    touchX = null;
    touchActive = false;
  });

  function shoot() {
    if (!player.canShoot) return;
    bullets.push(new Bullet(player.x + player.width / 2 - bulletWidth / 2, player.y));
    player.canShoot = false;
    setTimeout(() => { player.canShoot = true; }, player.shootCooldown);
  }

  let enemySpawnInterval = 1500;
  function spawnEnemy() {
    if (gameOver) return;
    const x = Math.random() * (WIDTH - enemyWidth);
    const speed = enemySpeedMin + Math.random() * (enemySpeedMax - enemySpeedMin);
    enemies.push(new Enemy(x, -enemyHeight, speed));
  }
  let enemySpawnTimer = setInterval(spawnEnemy, enemySpawnInterval);

  function update() {
    if (gameOver) return;

    if (player.movingLeft) player.x -= player.speed;
    if (player.movingRight) player.x += player.speed;
    if (touchActive && touchX !== null) {
      let targetX = touchX - player.width / 2;
      let dx = targetX - player.x;
      player.x += dx * 0.3;
    }

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > WIDTH) player.x = WIDTH - player.width;

    bullets.forEach(bullet => bullet.update());
    for (let i = bullets.length - 1; i >= 0; i--) {
      if (!bullets[i].active) bullets.splice(i, 1);
    }

    enemyBullets.forEach(bullet => bullet.update());
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      if (!enemyBullets[i].active) enemyBullets.splice(i, 1);
    }

    enemies.forEach(enemy => {
      enemy.update();
      enemy.tryShoot();
    });
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (!enemies[i].active) enemies.splice(i, 1);
    }

    bullets.forEach(bullet => {
      enemies.forEach(enemy => {
        if (isColliding(bullet, enemy) && bullet.active && enemy.active) {
          bullet.active = false;
          enemy.active = false;
          score += 10;
          updateScore();
        }
      });
    });

    enemies.forEach(enemy => {
      if (isColliding(enemy, player)) triggerGameOver();
    });

    enemyBullets.forEach(ebullet => {
      if (isColliding(ebullet, player)) triggerGameOver();
    });
  }

  function isColliding(a, b) {
    return !(
      a.x + a.width < b.x ||
      a.x > b.x + b.width ||
      a.y + a.height < b.y ||
      a.y > b.y + b.height
    );
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    if (playerImg.complete) {
      ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    } else {
      ctx.fillStyle = '#3399ff';
      ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    bullets.forEach(bullet => bullet.draw());
    enemies.forEach(enemy => enemy.draw());
    enemyBullets.forEach(ebullet => ebullet.draw());
  }

  function loop() {
    update();
    draw();
    if (!gameOver) {
      requestAnimationFrame(loop);
    }
  }

  const scoreEl = document.getElementById('scoreboard');
  function updateScore() {
    scoreEl.textContent = 'Score: ' + score;
  }

  const gameOverEl = document.getElementById('game-over');
  const restartBtn = document.getElementById('restart-button');
  function triggerGameOver() {
    gameOver = true;
    gameOverEl.style.display = 'block';
    clearInterval(enemySpawnTimer);
  }

  restartBtn.addEventListener('click', () => {
    resetGame();
  });

  function resetGame() {
    score = 0;
    updateScore();
    bullets.length = 0;
    enemyBullets.length = 0;
    enemies.length = 0;
    player.x = WIDTH / 2 - player.width / 2;
    player.movingLeft = false;
    player.movingRight = false;
    gameOver = false;
    gameOverEl.style.display = 'none';
    enemySpawnTimer = setInterval(spawnEnemy, enemySpawnInterval);
    loop();
  }

  window.onload = () => {
    updateScore();
    loop();
    // Start background music
    bgMusic.play().catch(() => {
      console.warn("Autoplay failed — waiting for user interaction");
    });
  };

  // Fallback for autoplay block
  function resumeMusic() {
    bgMusic.play();
    window.removeEventListener('click', resumeMusic);
    window.removeEventListener('touchstart', resumeMusic);
  }

  window.addEventListener('click', resumeMusic);
  window.addEventListener('touchstart', resumeMusic);
})();
