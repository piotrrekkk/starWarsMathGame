// Visual Effects Engine: Starfield, Laser Bolts, Saber Clashes & Particle Bursts

class VisualEffects {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.bolts = [];
    this.stars = [];
    this.texts = [];
    this.width = 0;
    this.height = 0;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.hyperspace = false;

    this.init();
  }

  init() {
    if (!this.canvas || !this.ctx) return;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initStars(90);
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = this.canvas.width = rect.width;
    this.height = this.canvas.height = rect.height;
  }

  initStars(count) {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * (this.width || 800),
        y: Math.random() * (this.height || 400),
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.4 + 0.1,
        brightness: Math.random() * 0.7 + 0.3
      });
    }
  }

  screenShake(intensity = 12, duration = 300) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    const arena = document.getElementById('battle-arena');
    if (arena) {
      arena.classList.add('shake-anim');
      setTimeout(() => arena.classList.remove('shake-anim'), duration);
    }
  }

  // Laser bolt animation: from enemy to player (defense) or player to enemy (attack)
  fireLaser(fromPlayer, color = '#ff2a4b', onHit = null) {
    const startX = fromPlayer ? this.width * 0.22 : this.width * 0.78;
    const endX = fromPlayer ? this.width * 0.75 : this.width * 0.25;
    const y = this.height * 0.45;

    this.bolts.push({
      x: startX,
      y: y + (Math.random() * 20 - 10),
      startX,
      endX,
      color,
      speed: (endX - startX) * 0.08,
      length: 50,
      fromPlayer,
      onHit,
      alive: true
    });
  }

  // Create sparks for saber clash or laser deflection
  spawnSparks(x, y, color = '#ffe81f', count = 30) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3.5 + 1.5,
        color,
        alpha: 1,
        decay: Math.random() * 0.035 + 0.02
      });
    }
  }

  // Floating text like "+250 MOC!", "BLOK!", etc.
  addFloatingText(text, x, y, color = '#ffe81f') {
    this.texts.push({
      text,
      x,
      y,
      color,
      alpha: 1,
      vy: -1.6,
      scale: 1.4
    });
  }

  triggerClash(xPercent = 0.5, yPercent = 0.45, saberColor = '#00d0ff') {
    const x = this.width * xPercent;
    const y = this.height * yPercent;
    this.spawnSparks(x, y, '#ffffff', 20);
    this.spawnSparks(x, y, saberColor, 25);
    this.spawnSparks(x, y, '#ff2a4b', 25);
  }

  loop() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Starfield
    for (const star of this.stars) {
      star.x -= star.speed;
      if (star.x < 0) {
        star.x = this.width;
        star.y = Math.random() * this.height;
      }
      this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
      this.ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    // 2. Draw & update laser bolts
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      b.x += b.speed;

      this.ctx.save();
      this.ctx.strokeStyle = b.color;
      this.ctx.lineWidth = 4;
      this.ctx.shadowColor = b.color;
      this.ctx.shadowBlur = 15;
      this.ctx.lineCap = 'round';

      this.ctx.beginPath();
      this.ctx.moveTo(b.x - (b.speed > 0 ? b.length : -b.length), b.y);
      this.ctx.lineTo(b.x, b.y);
      this.ctx.stroke();

      // White hot core
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.restore();

      const reached = b.fromPlayer ? (b.x >= b.endX) : (b.x <= b.endX);
      if (reached) {
        if (b.onHit) b.onHit(b.endX, b.y);
        this.bolts.splice(i, 1);
      }
    }

    // 3. Draw & update particles (sparks)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // 4. Draw & update floating texts
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y += t.vy;
      t.alpha -= 0.02;

      if (t.alpha <= 0) {
        this.texts.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = t.alpha;
      this.ctx.fillStyle = t.color;
      this.ctx.shadowColor = t.color;
      this.ctx.shadowBlur = 10;
      this.ctx.font = 'bold 22px "Orbitron", "Montserrat", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(t.text, t.x, t.y);
      this.ctx.restore();
    }

    requestAnimationFrame(this.loop);
  }
}

window.VisualEffects = VisualEffects;
