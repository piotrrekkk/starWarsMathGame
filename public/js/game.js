// Core Game Controller & Battle Loop

class JediMathGame {
  constructor() {
    this.mathEngine = new MathEngine();
    this.vfx = null;
    this.currentLevelIndex = 0;
    this.currentPhase = 'IDLE'; // 'DEFENSE' or 'ATTACK'
    this.selectedCrystal = GAME_DATA.crystals[0];
    
    // Player & Enemy Battle State
    this.playerMaxHp = 100;
    this.playerHp = 100;
    this.enemyMaxHp = 100;
    this.enemyHp = 100;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.correctAnswers = 0;
    this.totalQuestions = 0;

    // Timer state
    this.timerInterval = null;
    this.timeLeft = 0;
    this.totalTime = 16;
    this.currentQuestion = null;
    this.inputBuffer = '';
    this.activeInputMode = 'choices'; // 'choices' or 'keyboard'

    // Sound FX ref
    this.audio = window.soundFX;

    this.initDOM();
  }

  initDOM() {
    // Buttons
    this.btnStart = document.getElementById('btn-start-game');
    this.btnHowToPlay = document.getElementById('btn-how-to-play');
    this.btnCloseModal = document.getElementById('btn-close-modal');
    this.btnSoundToggle = document.getElementById('btn-sound-toggle');
    this.btnBackToMenu = document.getElementById('btn-back-menu');
    this.btnNextLevel = document.getElementById('btn-next-level');
    this.btnRetry = document.getElementById('btn-retry');
    this.btnToggleInputMode = document.getElementById('btn-toggle-input-mode');

    // Containers & screens
    this.screenStart = document.getElementById('screen-start');
    this.screenLevelSelect = document.getElementById('screen-level-select');
    this.screenBattle = document.getElementById('screen-battle');
    this.modalHowTo = document.getElementById('modal-how-to');
    this.modalVictory = document.getElementById('modal-victory');
    this.modalDefeat = document.getElementById('modal-defeat');

    // Battle HUD elements
    this.elPlayerHpBar = document.getElementById('player-hp-bar');
    this.elPlayerHpText = document.getElementById('player-hp-text');
    this.elEnemyHpBar = document.getElementById('enemy-hp-bar');
    this.elEnemyHpText = document.getElementById('enemy-hp-text');
    this.elEnemyName = document.getElementById('enemy-name-display');
    this.elEnemySub = document.getElementById('enemy-sub-display');
    this.elPlanetBadge = document.getElementById('planet-badge');
    this.elStyleBadge = document.getElementById('style-badge');
    this.elScore = document.getElementById('score-display');
    this.elCombo = document.getElementById('combo-display');
    this.elTimerBar = document.getElementById('timer-bar-fill');
    this.elTimerText = document.getElementById('timer-text');
    this.elPhaseTitle = document.getElementById('phase-title');
    this.elPhaseBadge = document.getElementById('phase-badge');
    this.elQuestionText = document.getElementById('question-text');
    this.elChoicesContainer = document.getElementById('choices-container');
    this.elNumpadContainer = document.getElementById('numpad-container');
    this.elNumpadInput = document.getElementById('numpad-display-value');

    // Bind event listeners
    this.bindEvents();
    this.renderCrystals();
    this.renderLevelMap();
    this.updateSoundButtonState();
  }

  bindEvents() {
    this.btnStart.addEventListener('click', () => {
      this.audio.playSaberIgnite();
      this.showScreen('level-select');
    });

    this.btnHowToPlay.addEventListener('click', () => {
      this.modalHowTo.classList.remove('hidden');
    });

    this.btnCloseModal.addEventListener('click', () => {
      this.modalHowTo.classList.add('hidden');
    });

    this.btnSoundToggle.addEventListener('click', () => {
      const isMuted = this.audio.toggleMute();
      this.updateSoundButtonState();
    });

    this.btnBackToMenu.addEventListener('click', () => {
      this.stopTimer();
      this.showScreen('level-select');
    });

    this.btnNextLevel.addEventListener('click', () => {
      this.modalVictory.classList.add('hidden');
      if (this.currentLevelIndex < GAME_DATA.levels.length - 1) {
        this.startLevel(this.currentLevelIndex + 1);
      } else {
        this.showScreen('level-select');
      }
    });

    this.btnRetry.addEventListener('click', () => {
      this.modalDefeat.classList.add('hidden');
      this.startLevel(this.currentLevelIndex);
    });

    this.btnToggleInputMode.addEventListener('click', () => {
      this.activeInputMode = this.activeInputMode === 'choices' ? 'keyboard' : 'choices';
      this.applyInputMode();
    });

    // Keyboard support (0-9, Backspace, Enter)
    window.addEventListener('keydown', (e) => {
      if (this.screenBattle.classList.contains('hidden')) return;

      // In choices mode: keys 1-5 select options
      if (this.activeInputMode === 'choices') {
        const keyNum = parseInt(e.key, 10);
        if (keyNum >= 1 && keyNum <= 5) {
          const btn = document.querySelector(`.choice-btn[data-index="${keyNum - 1}"]`);
          if (btn) btn.click();
        }
      }

      // In keyboard mode
      if (this.activeInputMode === 'keyboard') {
        if (e.key >= '0' && e.key <= '9') {
          this.handleNumpadDigit(e.key);
        } else if (e.key === 'Backspace') {
          this.handleNumpadBackspace();
        } else if (e.key === 'Enter') {
          this.handleNumpadSubmit();
        }
      }
    });

    // Virtual numpad buttons
    document.querySelectorAll('.numpad-key').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = btn.getAttribute('data-val');
        if (val === 'backspace') {
          this.handleNumpadBackspace();
        } else if (val === 'enter') {
          this.handleNumpadSubmit();
        } else if (val !== null) {
          this.handleNumpadDigit(val);
        }
      });
    });
  }

  updateSoundButtonState() {
    const isMuted = this.audio.isMuted();
    this.btnSoundToggle.innerHTML = isMuted ? '🔇 Dźwięk: Wył.' : '🔊 Dźwięk: Wł.';
    this.btnSoundToggle.setAttribute('aria-label', isMuted ? 'Włącz dźwięk' : 'Wycisz dźwięk');
  }

  showScreen(screenName) {
    this.screenStart.classList.add('hidden');
    this.screenLevelSelect.classList.add('hidden');
    this.screenBattle.classList.add('hidden');

    if (screenName === 'start') {
      this.screenStart.classList.remove('hidden');
    } else if (screenName === 'level-select') {
      this.renderLevelMap();
      this.screenLevelSelect.classList.remove('hidden');
    } else if (screenName === 'battle') {
      this.screenBattle.classList.remove('hidden');
      if (!this.vfx) {
        this.vfx = new VisualEffects('fx-canvas');
      } else {
        this.vfx.resize();
      }
    }
  }

  renderCrystals() {
    const container = document.getElementById('crystal-selector');
    if (!container) return;
    container.innerHTML = '';

    GAME_DATA.crystals.forEach(c => {
      const item = document.createElement('div');
      item.className = `crystal-card ${c.id === this.selectedCrystal.id ? 'active' : ''}`;
      item.innerHTML = `
        <div class="crystal-icon" style="background: radial-gradient(circle, ${c.color} 30%, transparent 70%); box-shadow: 0 0 15px ${c.glow}">
          <svg viewBox="0 0 24 24" class="crystal-svg">
            <polygon points="12,2 20,9 17,22 7,22 4,9" fill="${c.color}" stroke="#fff" stroke-width="1.5" />
          </svg>
        </div>
        <div class="crystal-label">${c.name}</div>
        <div class="crystal-sub">${c.title}</div>
      `;
      item.addEventListener('click', () => {
        this.selectedCrystal = c;
        this.audio.playSaberSwing();
        this.renderCrystals();
        this.updateSaberColor();
      });
      container.appendChild(item);
    });
  }

  updateSaberColor() {
    const blades = document.querySelectorAll('.lightsaber-blade');
    blades.forEach(blade => {
      blade.style.setProperty('--blade-color', this.selectedCrystal.color);
      blade.style.boxShadow = `0 0 12px ${this.selectedCrystal.color}, 0 0 28px ${this.selectedCrystal.color}`;
    });
  }

  renderLevelMap() {
    const container = document.getElementById('levels-grid');
    if (!container) return;
    container.innerHTML = '';

    const unlockedLevel = parseInt(localStorage.getItem('jedi_unlocked_level') || '1', 10);

    GAME_DATA.levels.forEach((lvl, idx) => {
      const isUnlocked = lvl.id <= unlockedLevel;
      const card = document.createElement('div');
      card.className = `level-card ${isUnlocked ? 'unlocked' : 'locked'}`;

      const icon = lvl.style === 'blaster' ? '🔫 BLASTER' : '⚔️ MIECZ ŚWIETLNY';

      card.innerHTML = `
        <div class="level-badge">POZIOM ${lvl.id}</div>
        <div class="level-planet">${lvl.planet}</div>
        <div class="level-title">${lvl.title}</div>
        <div class="level-enemy">Wróg: <strong>${lvl.enemyName}</strong></div>
        <div class="level-style">${icon}</div>
        <div class="level-desc">${lvl.description}</div>
        <div class="level-action">
          ${isUnlocked 
            ? `<button class="btn-primary btn-play-level">Rozpocznij misję &rarr;</button>` 
            : `<span class="locked-label">🔒 Zablokowane</span>`}
        </div>
      `;

      if (isUnlocked) {
        card.querySelector('.btn-play-level').addEventListener('click', () => {
          this.startLevel(idx);
        });
      }

      container.appendChild(card);
    });
  }

  startLevel(index) {
    this.currentLevelIndex = index;
    const level = GAME_DATA.levels[index];

    // Reset battle stats
    this.playerMaxHp = 100;
    this.playerHp = 100;
    this.enemyMaxHp = level.enemyHp;
    this.enemyHp = level.enemyHp;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.correctAnswers = 0;
    this.totalQuestions = 0;
    this.activeInputMode = level.defaultInputMode;

    // Setup Arena UI
    this.elPlanetBadge.textContent = `🪐 ${level.planet} - ${level.location}`;
    this.elStyleBadge.textContent = level.style === 'blaster' ? '🔫 OSTRZAŁ BLASTEROWY' : '⚔️ POJEDYNEK NA MIECZE';
    this.elEnemyName.textContent = level.enemyName;
    this.elEnemySub.textContent = level.enemySub;

    // Render Enemy Figure
    this.renderEnemyAvatar(level);
    this.renderPlayerAvatar(level);

    this.updateHpBars();
    this.updateScoreDisplay();
    this.applyInputMode();

    this.showScreen('battle');
    this.audio.playSaberIgnite();

    // Start with DEFENSE phase (enemy strikes first, player must block!)
    setTimeout(() => {
      this.triggerDefensePhase();
    }, 1200);
  }

  renderPlayerAvatar(level) {
    const container = document.getElementById('player-avatar-box');
    const saberColor = this.selectedCrystal.color;
    const isSaber = level.style === 'saber';

    container.innerHTML = `
      <div class="combatant-figure player-figure ${isSaber ? 'stance-saber' : 'stance-blaster'}">
        <svg viewBox="0 0 160 220" class="hero-svg">
          <!-- Jedi Robe / Body -->
          <path d="M 50,110 Q 80,95 110,110 L 125,210 L 35,210 Z" fill="#3d2c1e" />
          <path d="M 60,110 L 80,180 L 100,110" stroke="#7d583b" stroke-width="4" fill="none" />
          <polygon points="65,110 80,145 95,110" fill="#ccab80" />
          <!-- Belt with Buckle -->
          <rect x="48" y="145" width="64" height="12" rx="3" fill="#20150d" />
          <rect x="74" y="143" width="12" height="16" rx="2" fill="#d4af37" />
          
          <!-- Head / Hair -->
          <ellipse cx="80" cy="72" rx="22" ry="26" fill="#f7c8a0" />
          <path d="M 55,68 Q 80,40 105,68 Q 98,52 80,50 Q 62,52 55,68 Z" fill="#4a2e18" />
          <!-- Eyes -->
          <circle cx="73" cy="72" r="2.5" fill="#1b120c" />
          <circle cx="87" cy="72" r="2.5" fill="#1b120c" />

          <!-- Weapon in Hand -->
          ${isSaber ? `
            <!-- Lightsaber Hilt -->
            <rect x="106" y="95" width="8" height="26" rx="2" fill="#888899" stroke="#333" stroke-width="1" />
            <!-- Lightsaber Blade with Kyber Glow -->
            <line x1="110" y1="95" x2="135" y2="15" stroke="${saberColor}" stroke-width="6" stroke-linecap="round" class="lightsaber-blade" style="filter: drop-shadow(0 0 10px ${saberColor}) drop-shadow(0 0 20px ${saberColor});" />
            <line x1="110" y1="95" x2="135" y2="15" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
          ` : `
            <!-- Blaster Pistol -->
            <path d="M 104,115 L 130,115 L 130,122 L 122,122 L 120,135 L 112,135 L 114,122 Z" fill="#2a2e3d" stroke="#5b647d" stroke-width="1.5" />
            <!-- Blaster Glow tip -->
            <circle cx="132" cy="118.5" r="3" fill="#00d0ff" style="filter: drop-shadow(0 0 6px #00d0ff);" />
          `}
        </svg>
      </div>
    `;
  }

  renderEnemyAvatar(level) {
    const container = document.getElementById('enemy-avatar-box');
    let svgContent = '';

    if (level.enemySvg === 'droid-training') {
      // Training Marksman-H Remote
      svgContent = `
        <svg viewBox="0 0 180 200" class="enemy-svg anim-hover">
          <!-- Spherical Remote Body -->
          <circle cx="90" cy="100" r="42" fill="#5c6370" stroke="#282c34" stroke-width="3" />
          <circle cx="90" cy="100" r="34" fill="#3e4451" />
          <line x1="48" y1="100" x2="132" y2="100" stroke="#21252b" stroke-width="2" />
          <line x1="90" y1="58" x2="90" y2="142" stroke="#21252b" stroke-width="2" />
          <!-- Laser lenses / sensors -->
          <circle cx="75" cy="85" r="6" fill="#ff2a4b" style="filter: drop-shadow(0 0 8px #ff2a4b);" />
          <circle cx="105" cy="85" r="5" fill="#4deeea" />
          <circle cx="90" cy="115" r="9" fill="#00e5ff" style="filter: drop-shadow(0 0 10px #00e5ff);" />
          <circle cx="90" cy="115" r="4" fill="#ffffff" />
          <!-- Blaster emitter needles -->
          <rect x="25" y="98" width="24" height="4" fill="#abb2bf" />
          <rect x="131" y="98" width="24" height="4" fill="#abb2bf" />
        </svg>
      `;
    } else if (level.enemySvg === 'droid-b1') {
      // Battle Droid B1
      svgContent = `
        <svg viewBox="0 0 180 220" class="enemy-svg">
          <!-- B1 Head -->
          <path d="M 80,45 Q 90,30 105,45 L 115,75 Q 95,85 85,80 Z" fill="#d6af79" stroke="#7d603a" stroke-width="2" />
          <circle cx="100" cy="55" r="3.5" fill="#1b120c" />
          <!-- Neck & Torso -->
          <rect x="86" y="80" width="8" height="25" fill="#9e8055" />
          <path d="M 70,105 L 110,105 L 105,160 L 75,160 Z" fill="#d6af79" stroke="#7d603a" stroke-width="2" />
          <!-- Arms holding Blaster E-5 -->
          <path d="M 70,110 L 50,140 L 80,145" stroke="#9e8055" stroke-width="5" fill="none" />
          <!-- Blaster rifle -->
          <rect x="40" y="138" width="60" height="9" fill="#222" rx="2" />
          <rect x="30" y="140" width="15" height="5" fill="#ff4444" style="filter: drop-shadow(0 0 6px #ff4444);" />
        </svg>
      `;
    } else if (level.enemySvg === 'snowtrooper') {
      // Snowtrooper
      svgContent = `
        <svg viewBox="0 0 180 220" class="enemy-svg">
          <!-- Cowl / Helmet -->
          <path d="M 68,55 Q 90,35 112,55 L 118,95 L 62,95 Z" fill="#f0f3f6" stroke="#9aa5b1" stroke-width="2" />
          <!-- Visor slit -->
          <rect x="73" y="65" width="34" height="7" rx="2" fill="#10151a" />
          <!-- Chestplate with straps -->
          <path d="M 58,98 L 122,98 L 115,170 L 65,170 Z" fill="#e2e8f0" stroke="#718096" stroke-width="2" />
          <rect x="80" y="112" width="20" height="28" fill="#4a5568" rx="3" />
          <!-- Heavy Blaster Rifle -->
          <rect x="35" y="125" width="65" height="12" fill="#1a202c" rx="2" />
          <circle cx="32" cy="131" r="5" fill="#ff3366" style="filter: drop-shadow(0 0 8px #ff3366);" />
        </svg>
      `;
    } else if (level.enemySvg === 'inquisitor') {
      // Imperial Inquisitor with Double Red Saber
      svgContent = `
        <svg viewBox="0 0 180 220" class="enemy-svg">
          <!-- Inquisitor Helmet / Face -->
          <path d="M 70,50 Q 90,32 110,50 L 116,90 L 64,90 Z" fill="#1a1c23" stroke="#ff2a4b" stroke-width="1.5" />
          <!-- Red Visor lines -->
          <line x1="72" y1="68" x2="108" y2="68" stroke="#ff0055" stroke-width="3.5" style="filter: drop-shadow(0 0 8px #ff0055);" />
          <!-- Armor -->
          <path d="M 52,92 L 128,92 L 118,180 L 62,180 Z" fill="#12131a" stroke="#333" stroke-width="2" />
          <circle cx="90" cy="120" r="12" fill="#2d3748" stroke="#ff0055" stroke-width="1.5" />
          <!-- Ring Hilt & Double Red Saber -->
          <circle cx="50" cy="130" r="14" fill="none" stroke="#666" stroke-width="3" />
          <line x1="50" y1="35" x2="50" y2="215" stroke="#ff1744" stroke-width="6" stroke-linecap="round" style="filter: drop-shadow(0 0 10px #ff1744) drop-shadow(0 0 20px #ff0055);" />
          <line x1="50" y1="35" x2="50" y2="215" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
        </svg>
      `;
    } else {
      // Lord Vader
      svgContent = `
        <svg viewBox="0 0 180 220" class="enemy-svg">
          <!-- Iconic Helmet -->
          <path d="M 60,60 Q 90,24 120,60 L 128,95 L 52,95 Z" fill="#0f1115" stroke="#3b4252" stroke-width="2" />
          <path d="M 50,85 Q 90,75 130,85" stroke="#2e3440" stroke-width="4" fill="none" />
          <!-- Triangular Respirator Grille -->
          <polygon points="80,88 100,88 90,102" fill="#2e3440" stroke="#4c566a" stroke-width="1.5" />
          <!-- Chestplate with Control Box -->
          <path d="M 50,105 L 130,105 L 125,190 L 55,190 Z" fill="#0a0c10" stroke="#2e3440" stroke-width="2" />
          <!-- Vader Chest Box Buttons -->
          <rect x="74" y="125" width="32" height="26" fill="#1b1e2b" stroke="#4c566a" stroke-width="1.5" rx="2" />
          <rect x="78" y="130" width="8" height="6" fill="#ff2a4b" />
          <rect x="90" y="130" width="8" height="6" fill="#00d0ff" />
          <rect x="78" y="140" width="20" height="4" fill="#ffffff" />
          <!-- Red Saber -->
          <rect x="42" y="115" width="8" height="26" fill="#444" rx="2" />
          <line x1="46" y1="115" x2="25" y2="20" stroke="#ff0033" stroke-width="6.5" stroke-linecap="round" style="filter: drop-shadow(0 0 12px #ff0033) drop-shadow(0 0 24px #ff0000);" />
          <line x1="46" y1="115" x2="25" y2="20" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
        </svg>
      `;
    }

    container.innerHTML = `<div class="combatant-figure enemy-figure">${svgContent}</div>`;
  }

  updateHpBars() {
    const pPercent = Math.max(0, Math.min(100, (this.playerHp / this.playerMaxHp) * 100));
    const ePercent = Math.max(0, Math.min(100, (this.enemyHp / this.enemyMaxHp) * 100));

    this.elPlayerHpBar.style.width = `${pPercent}%`;
    this.elPlayerHpText.textContent = `${this.playerHp} / ${this.playerMaxHp} HP`;

    this.elEnemyHpBar.style.width = `${ePercent}%`;
    this.elEnemyHpText.textContent = `${this.enemyHp} / ${this.enemyMaxHp} HP`;
  }

  updateScoreDisplay() {
    this.elScore.textContent = this.score;
    this.elCombo.textContent = `x${this.combo}`;
  }

  applyInputMode() {
    this.btnToggleInputMode.textContent = this.activeInputMode === 'choices' 
      ? '⌨️ Przełącz na: Klawiatura' 
      : '🎴 Przełącz na: 5 Kart';

    if (this.activeInputMode === 'choices') {
      this.elChoicesContainer.classList.remove('hidden');
      this.elNumpadContainer.classList.add('hidden');
    } else {
      this.elChoicesContainer.classList.add('hidden');
      this.elNumpadContainer.classList.remove('hidden');
      this.inputBuffer = '';
      this.updateNumpadDisplay();
    }
  }

  // --- BATTLE PHASES ---

  triggerDefensePhase() {
    if (this.playerHp <= 0 || this.enemyHp <= 0) return;
    this.currentPhase = 'DEFENSE';

    const level = GAME_DATA.levels[this.currentLevelIndex];
    this.totalTime = level.timePerQuestion;
    this.timeLeft = this.totalTime;

    this.elPhaseTitle.textContent = '🛡️ WRÓG ATAKUJE! ZABLOKUJ CIOS!';
    this.elPhaseTitle.className = 'phase-defense';
    this.elPhaseBadge.textContent = 'FAZA: OBRONA';
    this.elPhaseBadge.className = 'badge-defense';

    // Play warning sound & telegraph laser or saber swing
    if (level.style === 'blaster') {
      this.audio.playBlasterFire();
      if (this.vfx) this.vfx.fireLaser(false, '#ff2a4b');
    } else {
      this.audio.playSaberSwing();
      const enemyBox = document.getElementById('enemy-avatar-box');
      if (enemyBox) enemyBox.classList.add('enemy-lunge');
      setTimeout(() => { if (enemyBox) enemyBox.classList.remove('enemy-lunge'); }, 600);
    }

    this.newQuestion();
  }

  triggerAttackPhase() {
    if (this.playerHp <= 0 || this.enemyHp <= 0) return;
    this.currentPhase = 'ATTACK';

    const level = GAME_DATA.levels[this.currentLevelIndex];
    this.totalTime = level.timePerQuestion;
    this.timeLeft = this.totalTime;

    this.elPhaseTitle.textContent = '⚔️ TWOJA KOLEJ! ROZWIĄŻ I ATAKUJ!';
    this.elPhaseTitle.className = 'phase-attack';
    this.elPhaseBadge.textContent = 'FAZA: TWÓJ ATAK';
    this.elPhaseBadge.className = 'badge-attack';

    this.newQuestion();
  }

  newQuestion() {
    this.currentQuestion = this.mathEngine.generateQuestion();
    this.elQuestionText.textContent = `${this.currentQuestion.text} = ?`;

    // Render 5 choices
    this.elChoicesContainer.innerHTML = '';
    this.currentQuestion.options.forEach((val, idx) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.setAttribute('data-index', idx);
      btn.setAttribute('data-val', val);
      btn.innerHTML = `<span class="choice-num">${idx + 1}</span> <span class="choice-val">${val}</span>`;
      btn.addEventListener('click', () => this.handleAnswer(val, btn));
      this.elChoicesContainer.appendChild(btn);
    });

    // Reset numpad buffer
    this.inputBuffer = '';
    this.updateNumpadDisplay();

    // Start timer
    this.startTimer();
  }

  startTimer() {
    this.stopTimer();
    this.updateTimerBar();

    const intervalMs = 100;
    this.timerInterval = setInterval(() => {
      this.timeLeft -= (intervalMs / 1000);
      
      // Low time tick sound for final 3 seconds
      if (this.timeLeft <= 3 && this.timeLeft > 0 && Math.floor(this.timeLeft * 10) % 10 === 0) {
        this.audio.playTick();
      }

      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.updateTimerBar();
        this.stopTimer();
        this.handleTimeout();
      } else {
        this.updateTimerBar();
      }
    }, intervalMs);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerBar() {
    const percent = Math.max(0, (this.timeLeft / this.totalTime) * 100);
    this.elTimerBar.style.width = `${percent}%`;
    this.elTimerText.textContent = `${this.timeLeft.toFixed(1)}s`;

    if (percent < 25) {
      this.elTimerBar.style.background = 'linear-gradient(90deg, #ff0055, #ff2a4b)';
    } else if (percent < 55) {
      this.elTimerBar.style.background = 'linear-gradient(90deg, #ff9d00, #ffea29)';
    } else {
      this.elTimerBar.style.background = 'linear-gradient(90deg, #00d0ff, #25f252)';
    }
  }

  // --- NUMPAD HANDLERS ---

  handleNumpadDigit(digit) {
    if (this.inputBuffer.length < 3) { // 0..99 is at most 2 digits, allow 3 just in case
      this.inputBuffer += digit;
      this.updateNumpadDisplay();
    }
  }

  handleNumpadBackspace() {
    this.inputBuffer = this.inputBuffer.slice(0, -1);
    this.updateNumpadDisplay();
  }

  handleNumpadSubmit() {
    if (this.inputBuffer.trim() === '') return;
    const answer = parseInt(this.inputBuffer, 10);
    this.handleAnswer(answer, null);
  }

  updateNumpadDisplay() {
    this.elNumpadInput.textContent = this.inputBuffer === '' ? '?' : this.inputBuffer;
  }

  // --- ANSWER PROCESSING ---

  handleTimeout() {
    this.totalQuestions++;
    this.combo = 0;
    this.updateScoreDisplay();

    if (this.currentPhase === 'DEFENSE') {
      // Player failed to block in time! Enemy hit!
      const level = GAME_DATA.levels[this.currentLevelIndex];
      this.playerHp = Math.max(0, this.playerHp - level.enemyDamage);
      this.updateHpBars();
      this.audio.playDamageHit();
      if (this.vfx) {
        this.vfx.screenShake(14, 400);
        this.vfx.addFloatingText('CZAS MINĄŁ! TRAFIENIE!', window.innerWidth * 0.35, 180, '#ff2a4b');
      }

      this.highlightAnswerError();

      if (this.playerHp <= 0) {
        setTimeout(() => this.triggerDefeat(), 1200);
        return;
      }
    } else {
      // Player failed to attack in time! Enemy parries
      this.audio.playWrong();
      if (this.vfx) {
        this.vfx.addFloatingText('CZAS MINĄŁ! PUDŁO!', window.innerWidth * 0.5, 180, '#ff9d00');
      }
      this.highlightAnswerError();
    }

    setTimeout(() => {
      if (this.currentPhase === 'DEFENSE') {
        this.triggerAttackPhase();
      } else {
        this.triggerDefensePhase();
      }
    }, 1500);
  }

  handleAnswer(selectedVal, clickedBtn) {
    this.stopTimer();
    this.totalQuestions++;
    const isCorrect = selectedVal === this.currentQuestion.answer;

    if (isCorrect) {
      this.correctAnswers++;
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      const timeBonus = Math.floor(this.timeLeft * 10);
      const comboBonus = this.combo * 25;
      const points = 100 + timeBonus + comboBonus;
      this.score += points;
      this.updateScoreDisplay();

      if (clickedBtn) {
        clickedBtn.classList.add('choice-correct');
      }

      if (this.currentPhase === 'DEFENSE') {
        this.processSuccessfulDefense(points);
      } else {
        this.processSuccessfulAttack(points);
      }
    } else {
      this.combo = 0;
      this.updateScoreDisplay();

      if (clickedBtn) {
        clickedBtn.classList.add('choice-wrong');
      }
      this.highlightAnswerError();

      if (this.currentPhase === 'DEFENSE') {
        this.processFailedDefense();
      } else {
        this.processFailedAttack();
      }
    }
  }

  highlightAnswerError() {
    // Show correct answer on screen
    this.elQuestionText.innerHTML = `${this.currentQuestion.text} = <span style="color:#25f252; font-weight:bold">${this.currentQuestion.answer}</span>`;
    // Highlight correct button if in choices mode
    const correctBtn = document.querySelector(`.choice-btn[data-val="${this.currentQuestion.answer}"]`);
    if (correctBtn) {
      correctBtn.classList.add('choice-highlight');
    }
  }

  processSuccessfulDefense(points) {
    const level = GAME_DATA.levels[this.currentLevelIndex];

    if (level.style === 'blaster') {
      this.audio.playBlasterDeflect();
      if (this.vfx) {
        this.vfx.spawnSparks(this.vfx.width * 0.28, this.vfx.height * 0.45, this.selectedCrystal.color, 35);
        this.vfx.addFloatingText(`IDEALNY BLOK! +${points}`, this.vfx.width * 0.35, 170, '#00d0ff');
      }
    } else {
      this.audio.playSaberClash();
      if (this.vfx) {
        this.vfx.triggerClash(0.42, 0.45, this.selectedCrystal.color);
        this.vfx.addFloatingText(`PAROWANIE CIĘCIA! +${points}`, this.vfx.width * 0.45, 170, '#25f252');
      }
    }

    setTimeout(() => {
      this.triggerAttackPhase();
    }, 1400);
  }

  processFailedDefense() {
    const level = GAME_DATA.levels[this.currentLevelIndex];
    this.playerHp = Math.max(0, this.playerHp - level.enemyDamage);
    this.updateHpBars();
    this.audio.playDamageHit();

    if (this.vfx) {
      this.vfx.screenShake(16, 400);
      this.vfx.addFloatingText('BLOK PRZEŁAMANY! -20 HP', this.vfx.width * 0.32, 170, '#ff2a4b');
    }

    if (this.playerHp <= 0) {
      setTimeout(() => this.triggerDefeat(), 1400);
      return;
    }

    setTimeout(() => {
      this.triggerAttackPhase();
    }, 1500);
  }

  processSuccessfulAttack(points) {
    const level = GAME_DATA.levels[this.currentLevelIndex];
    this.enemyHp = Math.max(0, this.enemyHp - level.playerDamage);
    this.updateHpBars();

    if (level.style === 'blaster') {
      this.audio.playBlasterFire();
      if (this.vfx) {
        this.vfx.fireLaser(true, this.selectedCrystal.color, (hitX, hitY) => {
          this.vfx.spawnSparks(hitX, hitY, '#ffe81f', 30);
          this.audio.playDamageHit();
        });
        this.vfx.addFloatingText(`CELNY STRZAŁ! -${level.playerDamage} HP`, this.vfx.width * 0.65, 170, '#ffe81f');
      }
    } else {
      this.audio.playSaberSwing();
      setTimeout(() => this.audio.playSaberClash(), 200);

      const playerBox = document.getElementById('player-avatar-box');
      if (playerBox) playerBox.classList.add('player-lunge');
      setTimeout(() => { if (playerBox) playerBox.classList.remove('player-lunge'); }, 600);

      if (this.vfx) {
        this.vfx.triggerClash(0.68, 0.45, this.selectedCrystal.color);
        this.vfx.addFloatingText(`CIĘCIE MIECZEM! -${level.playerDamage} HP`, this.vfx.width * 0.65, 170, this.selectedCrystal.color);
      }
    }

    const enemyBox = document.getElementById('enemy-avatar-box');
    if (enemyBox) enemyBox.classList.add('enemy-hit');
    setTimeout(() => { if (enemyBox) enemyBox.classList.remove('enemy-hit'); }, 500);

    if (this.enemyHp <= 0) {
      setTimeout(() => this.triggerVictory(), 1400);
      return;
    }

    setTimeout(() => {
      this.triggerDefensePhase();
    }, 1400);
  }

  processFailedAttack() {
    this.audio.playWrong();
    if (this.vfx) {
      this.vfx.addFloatingText('PUDŁO! Wróg uniknął ciosu!', this.vfx.width * 0.55, 170, '#ff9d00');
    }

    setTimeout(() => {
      this.triggerDefensePhase();
    }, 1400);
  }

  // --- END OF BATTLE ---

  triggerVictory() {
    this.audio.playLevelWin();
    const level = GAME_DATA.levels[this.currentLevelIndex];

    // Unlock next level
    const currentUnlocked = parseInt(localStorage.getItem('jedi_unlocked_level') || '1', 10);
    if (this.currentLevelIndex + 2 > currentUnlocked) {
      localStorage.setItem('jedi_unlocked_level', (this.currentLevelIndex + 2).toString());
    }

    // Calculate accuracy & stars
    const acc = this.totalQuestions > 0 ? Math.round((this.correctAnswers / this.totalQuestions) * 100) : 100;
    let stars = 1;
    if (acc >= 75 && this.playerHp >= 40) stars = 2;
    if (acc >= 90 && this.playerHp >= 60) stars = 3;

    const starsHtml = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

    document.getElementById('victory-planet-name').textContent = level.planet;
    document.getElementById('victory-stars').innerHTML = starsHtml;
    document.getElementById('victory-score').textContent = this.score;
    document.getElementById('victory-accuracy').textContent = `${acc}% (${this.correctAnswers}/${this.totalQuestions})`;
    document.getElementById('victory-combo').textContent = this.maxCombo;

    this.modalVictory.classList.remove('hidden');
  }

  triggerDefeat() {
    this.audio.playGameOver();
    const level = GAME_DATA.levels[this.currentLevelIndex];

    document.getElementById('defeat-planet-name').textContent = level.planet;
    document.getElementById('defeat-tip').textContent = `Moc powraca z treningiem! Pamiętaj: w każdej misji ćwiczysz dodawanie, odejmowanie, mnożenie i dzielenie od 0 do 99.`;

    this.modalDefeat.classList.remove('hidden');
  }
}

// Instantiate game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.jediGame = new JediMathGame();
});
