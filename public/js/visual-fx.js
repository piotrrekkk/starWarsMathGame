// Visual Effects Engine: Starfield, Laser Bolts, Saber Clashes & Particle Bursts

class VisualEffects {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.bolts = [];
    this.rings = [];
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
    this.initStars(75);
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
        size: Math.random() * 2 + 0.6,
        speed: Math.random() * 0.35 + 0.08,
        brightness: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  screenShake(intensity = 14, duration = 350) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    const arena = document.getElementById('battle-arena');
    if (arena) {
      arena.classList.add('shake-anim');
      setTimeout(() => arena.classList.remove('shake-anim'), duration);
    }
  }

  // Laser bolt animation with authentic plasma beam, glow and trail
  fireLaser(fromPlayer, color = '#ff2a4b', onHit = null) {
    const startX = fromPlayer ? this.width * 0.22 : this.width * 0.78;
    const endX = fromPlayer ? this.width * 0.76 : this.width * 0.24;
    const y = this.height * 0.44;

    this.bolts.push({
      x: startX,
      y: y + (Math.random() * 16 - 8),
      startX,
      endX,
      color,
      speed: (endX - startX) * 0.085,
      length: 55,
      fromPlayer,
      onHit,
      alive: true
    });
  }

  // Shockwave blast ring (for impact moments)
  spawnShockwave(x, y, color = '#ffe81f', maxRadius = 45) {
    this.rings.push({
      x,
      y,
      radius: 6,
      maxRadius,
      color,
      alpha: 0.9,
      lineWidth: 4
    });
  }

  // Create sparks for saber clash or laser deflection
  spawnSparks(x, y, color = '#ffe81f', count = 32) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3.5 + 1.2,
        color,
        alpha: 1,
        decay: Math.random() * 0.032 + 0.02
      });
    }
  }

  // Floating text like "+250 MOC!", "CELNY STRZAŁ!", etc.
  addFloatingText(text, x, y, color = '#ffe81f') {
    this.texts.push({
      text,
      x,
      y,
      color,
      alpha: 1,
      vy: -1.8,
      scale: 1.3
    });
  }

  triggerClash(xPercent = 0.5, yPercent = 0.45, saberColor = '#00d0ff') {
    const x = this.width * xPercent;
    const y = this.height * yPercent;
    this.spawnShockwave(x, y, saberColor, 55);
    this.spawnShockwave(x, y, '#ffffff', 35);
    this.spawnSparks(x, y, '#ffffff', 22);
    this.spawnSparks(x, y, saberColor, 28);
    this.spawnSparks(x, y, '#ff2a4b', 28);
  }

  loop() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Starfield with subtle twinkle
    for (const star of this.stars) {
      star.x -= star.speed;
      if (star.x < 0) {
        star.x = this.width;
        star.y = Math.random() * this.height;
      }
      star.twinklePhase += star.twinkleSpeed;
      const alpha = Math.max(0.2, Math.min(1, star.brightness + Math.sin(star.twinklePhase) * 0.25));

      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    // 2. Draw & update expanding shockwaves
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.radius += (r.maxRadius - r.radius) * 0.18 + 0.8;
      r.alpha -= 0.045;

      if (r.alpha <= 0 || r.radius >= r.maxRadius) {
        this.rings.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = r.alpha;
      this.ctx.strokeStyle = r.color;
      this.ctx.shadowColor = r.color;
      this.ctx.shadowBlur = 12;
      this.ctx.lineWidth = r.lineWidth;
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 3. Draw & update laser bolts
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      b.x += b.speed;

      // Spawn subtle trailing plasma ember
      if (Math.random() < 0.6) {
        this.particles.push({
          x: b.x - (b.speed > 0 ? b.length * 0.4 : -b.length * 0.4),
          y: b.y + (Math.random() * 4 - 2),
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          size: Math.random() * 2 + 1,
          color: b.color,
          alpha: 0.8,
          decay: 0.08
        });
      }

      this.ctx.save();
      // Outer intense neon plasma beam
      this.ctx.strokeStyle = b.color;
      this.ctx.lineWidth = 8;
      this.ctx.shadowColor = b.color;
      this.ctx.shadowBlur = 20;
      this.ctx.lineCap = 'round';

      this.ctx.beginPath();
      const tailX = b.x - (b.speed > 0 ? b.length : -b.length);
      this.ctx.moveTo(tailX, b.y);
      this.ctx.lineTo(b.x, b.y);
      this.ctx.stroke();

      // Inner blinding white-hot laser core
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 3.5;
      this.ctx.shadowColor = '#ffffff';
      this.ctx.shadowBlur = 6;
      this.ctx.stroke();
      this.ctx.restore();

      const reached = b.fromPlayer ? (b.x >= b.endX) : (b.x <= b.endX);
      if (reached) {
        this.spawnShockwave(b.endX, b.y, b.color, 38);
        if (b.onHit) b.onHit(b.endX, b.y);
        this.bolts.splice(i, 1);
      }
    }

    // 4. Draw & update particles (sparks)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.vy += 0.08; // subtle gravity effect
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 9;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // 5. Draw & update floating combat texts
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y += t.vy;
      t.alpha -= 0.022;

      if (t.alpha <= 0) {
        this.texts.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = t.alpha;
      this.ctx.fillStyle = t.color;
      this.ctx.shadowColor = t.color;
      this.ctx.shadowBlur = 12;
      this.ctx.font = 'bold 20px "Orbitron", -apple-system, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(t.text, t.x, t.y);
      this.ctx.restore();
    }

    requestAnimationFrame(this.loop);
  }
}

window.VisualEffects = VisualEffects;
