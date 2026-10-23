// Core Game Controller & Turn-based Battle Loop
// Rules: Player answers without timer. Correct = Player shoots (-1 Enemy life). Wrong = Enemy shoots (-1 Player life).
// Player has 5 lives, Enemy has 10 lives.

class JediMathGame {
  constructor() {
    this.mathEngine = new MathEngine();
    this.vfx = null;
    this.currentLevelIndex = 0;
    this.selectedCrystal = GAME_DATA.crystals[0];
    
    // Lives (Player: 5, Enemy: 10)
    this.playerMaxHp = 5;
    this.playerHp = 5;
    this.enemyMaxHp = 10;
    this.enemyHp = 10;
    
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.correctAnswers = 0;
    this.totalQuestions = 0;

    this.currentQuestion = null;
    this.inputBuffer = '';
    this.activeInputMode = 'choices'; // 'choices' or 'keyboard'
    this.isAnsweringLocked = false;

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
    this.elPlayerHearts = document.getElementById('player-hearts-container');
    this.elEnemyHpBar = document.getElementById('enemy-hp-bar');
    this.elEnemyHpText = document.getElementById('enemy-hp-text');
    this.elEnemyHearts = document.getElementById('enemy-hearts-container');

    this.elEnemyName = document.getElementById('enemy-name-display');
    this.elEnemySub = document.getElementById('enemy-sub-display');
    this.elPlanetBadge = document.getElementById('planet-badge');
    this.elStyleBadge = document.getElementById('style-badge');
    this.elScore = document.getElementById('score-display');
    this.elCombo = document.getElementById('combo-display');
    this.elPhaseTitle = document.getElementById('phase-title');
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
      if (this.screenBattle.classList.contains('hidden') || this.isAnsweringLocked) return;

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
      btn.addEventListener('click', () => {
        if (this.isAnsweringLocked) return;
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
      blade.setAttribute('stroke', this.selectedCrystal.color);
      blade.style.filter = `url(#hero-saber-glow) drop-shadow(0 0 16px ${this.selectedCrystal.color}) drop-shadow(0 0 28px ${this.selectedCrystal.color})`;
    });
    if (this.screenBattle && !this.screenBattle.classList.contains('hidden') && GAME_DATA.levels[this.currentLevelIndex]) {
      this.renderPlayerAvatar(GAME_DATA.levels[this.currentLevelIndex]);
    }
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

      const icon = lvl.style === 'ship' ? '🚀 MYŚLIWIEC X-WING' : (lvl.style === 'blaster' ? '🔫 BLASTER' : '⚔️ MIECZ ŚWIETLNY');

      card.innerHTML = `
        <div class="level-badge">POZIOM ${lvl.id}</div>
        <div class="level-planet">${lvl.planet}</div>
        <div class="level-title">${lvl.title}</div>
        <div class="level-enemy">Wróg: <strong>${lvl.enemyName}</strong></div>
        <div class="level-style">${icon} • Twoje życia: 5 | Życia wroga: 10</div>
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

    // Reset battle stats - exactly 5 lives for player, 10 for enemy
    this.playerMaxHp = 5;
    this.playerHp = 5;
    this.enemyMaxHp = 10;
    this.enemyHp = 10;
    
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.correctAnswers = 0;
    this.totalQuestions = 0;
    this.isAnsweringLocked = false;
    this.activeInputMode = level.defaultInputMode;

    // Setup Arena UI
    this.elPlanetBadge.textContent = `🪐 ${level.planet} - ${level.location}`;
    if (level.style === 'ship') {
      this.elStyleBadge.textContent = '🚀 WALKA MYŚLIWCÓW: X-WING';
      const playerHpName = document.querySelector('.player-pod .hp-name');
      if (playerHpName) playerHpName.textContent = '🚀 TWÓJ X-WING';
    } else {
      this.elStyleBadge.textContent = level.style === 'blaster' ? '🔫 OSTRZAŁ BLASTEROWY' : '⚔️ POJEDYNEK NA MIECZE';
      const playerHpName = document.querySelector('.player-pod .hp-name');
      if (playerHpName) playerHpName.textContent = '🛡️ TWÓJ JEDI';
    }
    this.elEnemyName.textContent = level.enemyName;
    this.elEnemySub.textContent = level.enemySub;
    this.elPhaseTitle.textContent = level.style === 'ship'
      ? '⚡ ROZWIĄŻ DZIAŁANIE I ODPAL LASERY X-WINGA!'
      : '⚡ ROZWIĄŻ DZIAŁANIE I ODDAJ STRZAŁ!';
    this.elPhaseTitle.className = 'phase-attack';

    // Apply planet background class & render backdrop scenery
    const arenaEl = document.getElementById('battle-arena');
    if (arenaEl) {
      arenaEl.className = `arena-stage ${level.backgroundClass || 'bg-coruscant'}`;
    }
    this.renderPlanetBackdrop(level);

    // Render Characters
    this.renderEnemyAvatar(level);
    this.renderPlayerAvatar(level);

    this.updateHpBars();
    this.updateScoreDisplay();
    this.applyInputMode();

    this.showScreen('battle');
    this.audio.playSaberIgnite();

    // Start with the first question
    this.newQuestion();
  }

  renderPlanetBackdrop(level) {
    const backdropEl = document.getElementById('arena-backdrop');
    if (!backdropEl) return;

    if (level.backgroundClass === 'bg-coruscant') {
      backdropEl.innerHTML = this.renderCoruscantBackdrop();
    } else if (level.backgroundClass === 'bg-tatooine') {
      backdropEl.innerHTML = this.renderTatooineBackdrop();
    } else if (level.backgroundClass === 'bg-hoth') {
      backdropEl.innerHTML = this.renderHothBackdrop();
    } else if (level.backgroundClass === 'bg-bespin') {
      backdropEl.innerHTML = this.renderBespinBackdrop();
    } else if (level.backgroundClass === 'bg-deathstar') {
      backdropEl.innerHTML = this.renderDeathStarBackdrop();
    } else {
      backdropEl.innerHTML = this.renderCoruscantBackdrop();
    }
  }

  renderCoruscantBackdrop() {
    return `
      <svg viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid slice" class="backdrop-svg">
        <defs>
          <linearGradient id="coruscant-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#050713" />
            <stop offset="55%" stop-color="#121835" />
            <stop offset="100%" stop-color="#2c1f4e" />
          </linearGradient>
          <linearGradient id="temple-beam" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#00d0ff" stop-opacity="0.6" />
            <stop offset="70%" stop-color="#00d0ff" stop-opacity="0.15" />
            <stop offset="100%" stop-color="#00d0ff" stop-opacity="0" />
          </linearGradient>
          <linearGradient id="neon-haze" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#ff3366" stop-opacity="0.25" />
            <stop offset="50%" stop-color="#4deeea" stop-opacity="0.1" />
            <stop offset="100%" stop-color="transparent" />
          </linearGradient>
        </defs>
        <rect width="1000" height="400" fill="url(#coruscant-sky)" />
        
        <!-- Distant Coruscant Moon & Stars -->
        <circle cx="820" cy="70" r="28" fill="#e2e8f8" opacity="0.4" style="filter: drop-shadow(0 0 15px rgba(226,232,248,0.5));" />
        <circle cx="826" cy="66" r="24" fill="#0c1026" />
        
        <!-- Far Spire Silhouettes -->
        <path d="M0,280 L40,240 L55,240 L70,280 L120,280 L140,210 L160,210 L175,280 L230,280 L250,180 L265,180 L280,280 L350,280 L370,160 L385,160 L400,280 L460,280 L480,220 L500,220 L515,280 L590,280 L610,170 L630,170 L645,280 L720,280 L740,200 L760,200 L775,280 L840,280 L860,190 L880,190 L895,280 L1000,280 L1000,400 L0,400 Z" fill="#0d122b" opacity="0.6" />
        
        <!-- Flying Speeder Traffic Streams -->
        <line x1="0" y1="230" x2="1000" y2="230" stroke="#ffb703" stroke-width="1.8" stroke-dasharray="8 36" opacity="0.75" />
        <line x1="0" y1="250" x2="1000" y2="250" stroke="#00e5ff" stroke-width="1.6" stroke-dasharray="14 45" opacity="0.7" />
        <line x1="0" y1="210" x2="1000" y2="210" stroke="#ff385c" stroke-width="1.5" stroke-dasharray="6 50" opacity="0.6" />

        <!-- Mid-ground Metropolis Towers with Windows -->
        <g fill="#141a3d">
          <rect x="30" y="190" width="65" height="210" rx="3" />
          <rect x="110" y="150" width="80" height="250" rx="4" />
          <line x1="150" y1="150" x2="150" y2="105" stroke="#4a5578" stroke-width="2" />
          <circle cx="150" cy="103" r="3" fill="#ff2a4b" />
          
          <rect x="220" y="170" width="75" height="230" rx="3" />
          
          <!-- Jedi Temple Centerpiece -->
          <polygon points="440,320 460,200 480,200 485,320" fill="#1b234f" />
          <polygon points="515,320 520,200 540,200 560,320" fill="#1b234f" />
          <polygon points="475,320 490,165 510,165 525,320" fill="#202a5c" />
          <polygon points="460,320 500,210 540,320" fill="#26326d" />
          <polygon points="492,165 500,90 508,165" fill="#2e3c82" />
          
          <rect x="710" y="140" width="85" height="260" rx="4" />
          <line x1="752" y1="140" x2="752" y2="95" stroke="#4a5578" stroke-width="2" />
          <circle cx="752" cy="93" r="3" fill="#00d0ff" />
          <rect x="825" y="175" width="70" height="225" rx="3" />
          <rect x="915" y="130" width="75" height="270" rx="4" />
        </g>
        
        <!-- Jedi Temple Blue Force Beacon Beams -->
        <polygon points="496,90 470,0 530,0 504,90" fill="url(#temple-beam)" />

        <!-- Illuminated Tower Windows -->
        <g fill="#ffd000" opacity="0.65">
          <circle cx="130" cy="180" r="1.5" /><circle cx="150" cy="180" r="1.5" /><circle cx="170" cy="180" r="1.5" />
          <circle cx="130" cy="205" r="1.5" /><circle cx="150" cy="205" r="1.5" /><circle cx="170" cy="205" r="1.5" />
          <circle cx="130" cy="230" r="1.5" /><circle cx="150" cy="230" r="1.5" /><circle cx="170" cy="230" r="1.5" />
          <circle cx="730" cy="170" r="1.5" /><circle cx="750" cy="170" r="1.5" /><circle cx="770" cy="170" r="1.5" />
          <circle cx="730" cy="195" r="1.5" /><circle cx="750" cy="195" r="1.5" /><circle cx="770" cy="195" r="1.5" />
          <circle cx="935" cy="160" r="1.5" /><circle cx="955" cy="160" r="1.5" /><circle cx="975" cy="160" r="1.5" />
        </g>
        <g fill="#00e5ff" opacity="0.6">
          <circle cx="50" cy="210" r="1.5" /><circle cx="70" cy="210" r="1.5" />
          <circle cx="240" cy="195" r="1.5" /><circle cx="260" cy="195" r="1.5" />
          <circle cx="845" cy="200" r="1.5" /><circle cx="865" cy="200" r="1.5" />
        </g>
        
        <!-- Neon Lower Atmosphere Glow -->
        <rect y="270" width="1000" height="130" fill="url(#neon-haze)" />
      </svg>
    `;
  }

  renderTatooineBackdrop() {
    return `
      <svg viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid slice" class="backdrop-svg">
        <defs>
          <linearGradient id="tatooine-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1d0a28" />
            <stop offset="35%" stop-color="#561734" />
            <stop offset="68%" stop-color="#b6441b" />
            <stop offset="88%" stop-color="#f3922c" />
            <stop offset="100%" stop-color="#ffd568" />
          </linearGradient>
          <linearGradient id="dune-1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#df7e32" />
            <stop offset="100%" stop-color="#7e3217" />
          </linearGradient>
          <linearGradient id="dune-2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#b45923" />
            <stop offset="100%" stop-color="#541b0b" />
          </linearGradient>
        </defs>
        <rect width="1000" height="400" fill="url(#tatooine-sky)" />

        <!-- Twin Suns of Tatooine -->
        <!-- Primary Sun: Tatoo I (bright golden white) -->
        <circle cx="720" cy="100" r="34" fill="#fffcee" style="filter: drop-shadow(0 0 24px rgba(255, 230, 120, 0.95)) drop-shadow(0 0 50px rgba(255, 180, 50, 0.6));" />
        <!-- Secondary Sun: Tatoo II (reddish orange) -->
        <circle cx="805" cy="150" r="22" fill="#ff4d29" style="filter: drop-shadow(0 0 18px rgba(255, 77, 41, 0.85)) drop-shadow(0 0 35px rgba(255, 40, 20, 0.5));" />

        <!-- Distant Rocky Canyon Mesas -->
        <polygon points="0,270 90,230 160,230 210,270" fill="#6d2426" opacity="0.75" />
        <polygon points="180,270 250,210 360,210 420,270" fill="#7d2827" opacity="0.7" />
        <polygon points="560,280 640,225 740,225 810,280" fill="#6d2426" opacity="0.65" />
        <polygon points="850,280 920,240 990,240 1000,270" fill="#601e25" opacity="0.7" />

        <!-- Sandcrawler Silhouette on Horizon -->
        <polygon points="340,252 385,250 395,257 395,263 335,263 335,257" fill="#3a1312" opacity="0.8" />
        <circle cx="342" cy="255" r="1.5" fill="#ffd000" opacity="0.8" />

        <!-- Sweeping Sand Dunes Layer 1 -->
        <path d="M-50,300 Q200,230 450,290 T950,270 L1050,400 L-50,400 Z" fill="url(#dune-1)" />

        <!-- Moisture Vaporators Silhouettes -->
        <g stroke="#3a140d" stroke-width="2.5" fill="none">
          <line x1="160" y1="300" x2="160" y2="245" />
          <line x1="152" y1="255" x2="168" y2="255" />
          <line x1="154" y1="270" x2="166" y2="270" />
          <circle cx="160" cy="242" r="3" fill="#3a140d" />

          <line x1="880" y1="310" x2="880" y2="260" />
          <line x1="873" y1="270" x2="887" y2="270" />
          <circle cx="880" cy="258" r="2.5" fill="#3a140d" />
        </g>

        <!-- Foreground Dunes Layer 2 -->
        <path d="M-20,340 Q300,280 650,350 T1050,320 L1050,400 L-20,400 Z" fill="url(#dune-2)" />
      </svg>
    `;
  }

  renderHothBackdrop() {
    return `
      <svg viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid slice" class="backdrop-svg">
        <defs>
          <linearGradient id="hoth-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#020914" />
            <stop offset="50%" stop-color="#091f35" />
            <stop offset="100%" stop-color="#0f3453" />
          </linearGradient>
          <linearGradient id="aurora" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#00ffd5" stop-opacity="0" />
            <stop offset="30%" stop-color="#00ffd5" stop-opacity="0.5" />
            <stop offset="55%" stop-color="#25f252" stop-opacity="0.6" />
            <stop offset="80%" stop-color="#00b4d8" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#00ffd5" stop-opacity="0" />
          </linearGradient>
          <linearGradient id="glacier-ice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#c6ecff" />
            <stop offset="40%" stop-color="#5ea8d4" />
            <stop offset="100%" stop-color="#16395b" />
          </linearGradient>
        </defs>
        <rect width="1000" height="400" fill="url(#hoth-sky)" />

        <!-- Twinkling Arctic Stars -->
        <g fill="#ffffff">
          <circle cx="120" cy="50" r="1.5" opacity="0.8" /><circle cx="280" cy="35" r="1" opacity="0.6" />
          <circle cx="450" cy="65" r="1.5" opacity="0.9" /><circle cx="680" cy="40" r="1" opacity="0.7" />
          <circle cx="890" cy="55" r="1.5" opacity="0.8" /><circle cx="940" cy="85" r="1" opacity="0.5" />
        </g>

        <!-- Ethereal Aurora Borealis Waves -->
        <path d="M0,80 Q250,30 500,75 T1000,45 L1000,140 Q750,90 500,135 T0,110 Z" fill="url(#aurora)" filter="blur(16px)" opacity="0.75" />
        <path d="M0,60 Q300,105 600,50 T1000,80 L1000,120 Q700,90 400,130 T0,90 Z" fill="url(#aurora)" filter="blur(10px)" opacity="0.6" />

        <!-- Distant Jagged Glaciers -->
        <polygon points="0,260 70,165 140,260" fill="#1b456e" opacity="0.7" />
        <polygon points="110,260 210,140 310,260" fill="#255887" opacity="0.75" />
        <polygon points="280,260 400,120 520,260" fill="#2d689e" opacity="0.8" />
        <polygon points="490,260 590,150 700,260" fill="#255887" opacity="0.75" />
        <polygon points="660,260 770,130 890,260" fill="#2d689e" opacity="0.8" />
        <polygon points="850,260 930,175 1000,260" fill="#1b456e" opacity="0.7" />

        <!-- Snow Mountain Crest Highlights -->
        <polygon points="380,140 400,120 420,140 400,148" fill="#e6f7ff" />
        <polygon points="755,148 770,130 785,148 770,155" fill="#e6f7ff" />
        <polygon points="198,155 210,140 222,155 210,162" fill="#e6f7ff" />

        <!-- Echo Base Ion Cannon / Radar Crest on right ridge -->
        <path d="M860,245 Q880,225 900,245 Z" fill="#0b1e33" />
        <line x1="880" y1="225" x2="895" y2="200" stroke="#0b1e33" stroke-width="3" />

        <!-- Mid-ground Snow Drifts & Ice Trench -->
        <path d="M-30,290 Q220,230 520,285 T1030,265 L1030,400 L-30,400 Z" fill="url(#glacier-ice)" />
        <!-- Frosty Foreground Shelf -->
        <path d="M-20,340 Q350,295 720,350 T1040,325 L1040,400 L-20,400 Z" fill="#0d2640" />

        <!-- Frost Crystals and Cold Mist -->
        <ellipse cx="500" cy="385" rx="480" ry="25" fill="#70d6ff" opacity="0.12" filter="blur(15px)" />
      </svg>
    `;
  }

  renderBespinBackdrop() {
    return `
      <svg viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid slice" class="backdrop-svg">
        <defs>
          <linearGradient id="bespin-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#170932" />
            <stop offset="30%" stop-color="#4d165c" />
            <stop offset="62%" stop-color="#9a296b" />
            <stop offset="85%" stop-color="#dc6451" />
            <stop offset="100%" stop-color="#fcb068" />
          </linearGradient>
          <linearGradient id="city-metallic" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#f0f4f8" />
            <stop offset="45%" stop-color="#c4d1de" />
            <stop offset="100%" stop-color="#738699" />
          </linearGradient>
          <linearGradient id="cloud-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffd285" stop-opacity="0.5" />
            <stop offset="100%" stop-color="#731f4a" stop-opacity="0.9" />
          </linearGradient>
        </defs>
        <rect width="1000" height="400" fill="url(#bespin-sky)" />

        <!-- Deep Atmospheric Cloud Layers (Multi-tiered) -->
        <ellipse cx="150" cy="240" rx="260" ry="65" fill="#581a4e" opacity="0.7" />
        <ellipse cx="850" cy="220" rx="300" ry="75" fill="#581a4e" opacity="0.65" />
        <ellipse cx="500" cy="270" rx="360" ry="85" fill="#75225a" opacity="0.6" />

        <!-- Cloud City Floating Spire (Centerpiece) -->
        <g transform="translate(430, 70)">
          <!-- Cloud City Saucer Disc -->
          <ellipse cx="70" cy="90" rx="90" ry="16" fill="url(#city-metallic)" style="filter: drop-shadow(0 15px 25px rgba(0,0,0,0.5));" />
          <ellipse cx="70" cy="85" rx="72" ry="11" fill="#f8fafc" />
          <!-- Upper Spire Towers & Domes -->
          <ellipse cx="70" cy="81" rx="40" ry="6" fill="#e2e8f0" />
          <rect x="67" y="42" width="6" height="40" fill="#cbd5e1" />
          <circle cx="70" cy="40" r="5" fill="#f8fafc" />
          <line x1="70" y1="40" x2="70" y2="18" stroke="#ffffff" stroke-width="2" />
          <circle cx="70" cy="16" r="2.5" fill="#ff4d4d" />
          
          <!-- Lower Central Vane / Core Spire extending down -->
          <polygon points="62,104 78,104 72,210 68,210" fill="#4a5568" />
          <polygon points="68,104 72,104 71,240 69,240" fill="#2d3748" />

          <!-- Lit Windows in the Saucer Perimeter -->
          <g fill="#ffea79">
            <circle cx="20" cy="91" r="1.5" /><circle cx="35" cy="93" r="1.5" /><circle cx="50" cy="94" r="1.5" />
            <circle cx="70" cy="95" r="1.5" />
            <circle cx="90" cy="94" r="1.5" /><circle cx="105" cy="93" r="1.5" /><circle cx="120" cy="91" r="1.5" />
          </g>

          <!-- Repulsor Engine Exhaust Glow beneath City -->
          <ellipse cx="70" cy="115" rx="35" ry="8" fill="#ff7b00" opacity="0.75" filter="blur(6px)" />
        </g>

        <!-- Twin-Pod Cloud Cars Flying in Distance -->
        <g fill="#df482b" opacity="0.85">
          <ellipse cx="230" cy="160" rx="10" ry="4" /><ellipse cx="244" cy="160" rx="10" ry="4" />
          <rect x="236" y="158" width="4" height="4" fill="#ffdd66" />
        </g>
        <g fill="#df482b" opacity="0.6">
          <ellipse cx="780" cy="140" rx="7" ry="3" /><ellipse cx="790" cy="140" rx="7" ry="3" />
        </g>

        <!-- Billowy Sunset Cloud Banks in Foreground -->
        <path d="M-50,300 Q150,250 350,290 Q550,240 750,295 Q900,260 1050,300 L1050,400 L-50,400 Z" fill="url(#cloud-gold)" />
        <ellipse cx="300" cy="330" rx="220" ry="50" fill="#ffaa5e" opacity="0.4" filter="blur(14px)" />
        <ellipse cx="750" cy="330" rx="250" ry="55" fill="#ffaa5e" opacity="0.35" filter="blur(16px)" />
      </svg>
    `;
  }

  renderDeathStarBackdrop() {
    return `
      <svg viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid slice" class="backdrop-svg">
        <defs>
          <radialGradient id="space-viewport" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stop-color="#0e172a" />
            <stop offset="45%" stop-color="#070c18" />
            <stop offset="100%" stop-color="#030408" />
          </radialGradient>
          <linearGradient id="imperial-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2a303c" />
            <stop offset="50%" stop-color="#171b23" />
            <stop offset="100%" stop-color="#0f1117" />
          </linearGradient>
          <linearGradient id="reactor-core-glow" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#25f252" stop-opacity="0.35" />
            <stop offset="60%" stop-color="#00ffd5" stop-opacity="0.1" />
            <stop offset="100%" stop-color="transparent" />
          </linearGradient>
        </defs>

        <!-- Outer Imperial Bulkhead Frame -->
        <rect width="1000" height="400" fill="#090c12" />

        <!-- Deep Space View Through Center Viewport -->
        <circle cx="500" cy="180" r="170" fill="url(#space-viewport)" />

        <!-- Stars & Distant Green Superlaser / Endor in Viewport -->
        <circle cx="430" cy="130" r="30" fill="#144b44" opacity="0.6" style="filter: drop-shadow(0 0 15px rgba(20,75,68,0.8));" />
        <g fill="#ffffff">
          <circle cx="390" cy="90" r="1.5" opacity="0.9" /><circle cx="580" cy="110" r="1.2" opacity="0.8" />
          <circle cx="480" cy="70" r="1" opacity="0.6" /><circle cx="540" cy="160" r="1.5" opacity="0.9" />
          <circle cx="430" cy="210" r="1" opacity="0.7" /><circle cx="600" cy="220" r="1.2" opacity="0.8" />
        </g>

        <!-- Iconic Throne Room Webbed Viewport Struts (Imperial Radial Architecture) -->
        <g stroke="#262d3d" stroke-width="6" fill="none">
          <!-- Viewport Outer Circle -->
          <circle cx="500" cy="180" r="170" stroke="#374151" stroke-width="8" />
          <circle cx="500" cy="180" r="115" stroke="#1f2937" stroke-width="4" />
          <circle cx="500" cy="180" r="55" stroke="#1f2937" stroke-width="3" />
          <!-- Radial Web Spokes -->
          <line x1="500" y1="10" x2="500" y2="350" />
          <line x1="330" y1="180" x2="670" y2="180" />
          <line x1="380" y1="60" x2="620" y2="300" />
          <line x1="380" y1="300" x2="620" y2="60" />
        </g>

        <!-- Flanking Imperial Walls with Classic Pill Light Panels -->
        <!-- Left Wall -->
        <rect x="0" y="0" width="220" height="400" fill="url(#imperial-wall)" />
        <line x1="220" y1="0" x2="220" y2="400" stroke="#3a4454" stroke-width="4" />
        <!-- Left Classic Imperial Pill Lights -->
        <g fill="#e2e8f0" style="filter: drop-shadow(0 0 8px rgba(255,255,255,0.7));">
          <rect x="60" y="60" width="18" height="38" rx="9" />
          <rect x="60" y="115" width="18" height="38" rx="9" />
          <rect x="60" y="170" width="18" height="38" rx="9" />
          <rect x="60" y="225" width="18" height="38" rx="9" />
          <rect x="110" y="90" width="16" height="34" rx="8" />
          <rect x="110" y="145" width="16" height="34" rx="8" />
          <rect x="110" y="200" width="16" height="34" rx="8" />
        </g>
        <!-- Left Red Alert Console Light -->
        <rect x="160" y="140" width="14" height="28" rx="7" fill="#ff2a4b" style="filter: drop-shadow(0 0 10px #ff2a4b);" />

        <!-- Right Wall -->
        <rect x="780" y="0" width="220" height="400" fill="url(#imperial-wall)" />
        <line x1="780" y1="0" x2="780" y2="400" stroke="#3a4454" stroke-width="4" />
        <!-- Right Classic Imperial Pill Lights -->
        <g fill="#e2e8f0" style="filter: drop-shadow(0 0 8px rgba(255,255,255,0.7));">
          <rect x="920" y="60" width="18" height="38" rx="9" />
          <rect x="920" y="115" width="18" height="38" rx="9" />
          <rect x="920" y="170" width="18" height="38" rx="9" />
          <rect x="920" y="225" width="18" height="38" rx="9" />
          <rect x="870" y="90" width="16" height="34" rx="8" />
          <rect x="870" y="145" width="16" height="34" rx="8" />
          <rect x="870" y="200" width="16" height="34" rx="8" />
        </g>
        <!-- Right Red Alert Console Light -->
        <rect x="825" y="140" width="14" height="28" rx="7" fill="#ff2a4b" style="filter: drop-shadow(0 0 10px #ff2a4b);" />

        <!-- Green Superlaser Reactor Shaft Glow in Lower Floor -->
        <rect y="290" width="1000" height="110" fill="url(#reactor-core-glow)" />
      </svg>
    `;
  }

  renderPlayerAvatar(level) {
    const container = document.getElementById('player-avatar-box');
    const saberColor = this.selectedCrystal.color;

    if (level.style === 'ship') {
      container.innerHTML = `
        <div class="combatant-figure player-figure stance-ship anim-hover">
          <svg viewBox="0 0 210 220" class="hero-svg">
            <defs>
              <linearGradient id="xwing-hull" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffffff" />
                <stop offset="50%" stop-color="#e2e8f0" />
                <stop offset="100%" stop-color="#94a3b8" />
              </linearGradient>
              <linearGradient id="engine-glow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#ff0055" />
                <stop offset="50%" stop-color="#ff7b00" />
                <stop offset="100%" stop-color="#ffee55" />
              </linearGradient>
            </defs>

            <!-- Sublight Engine Thrust Flame Trails -->
            <polygon points="12,78 38,82 12,86" fill="url(#engine-glow)" style="filter: drop-shadow(0 0 8px #ff7b00);" />
            <polygon points="12,138 38,142 12,146" fill="url(#engine-glow)" style="filter: drop-shadow(0 0 8px #ff7b00);" />

            <!-- UPPER STARBOARD S-FOIL WING -->
            <polygon points="45,80 120,40 120,55 50,92" fill="#cbd5e1" stroke="#64748b" stroke-width="1.5" />
            <!-- Red Five Squadron Stripe on Upper Wing -->
            <polygon points="80,58 95,50 97,55 82,63" fill="#ff2a4b" />
            <polygon points="102,46 112,42 114,46 104,50" fill="#ff2a4b" />
            <!-- Upper Wing Laser Cannon -->
            <rect x="35" y="42" width="135" height="4" rx="2" fill="#475569" />
            <rect x="165" y="40" width="10" height="8" rx="2" fill="#1e293b" />
            <!-- Laser Tip Charge Glow -->
            <circle cx="176" cy="44" r="3.5" fill="#ff2a4b" style="filter: drop-shadow(0 0 6px #ff2a4b);" />

            <!-- LOWER STARBOARD S-FOIL WING -->
            <polygon points="45,145 120,185 120,170 50,133" fill="#cbd5e1" stroke="#64748b" stroke-width="1.5" />
            <!-- Red Five Squadron Stripe on Lower Wing -->
            <polygon points="80,167 95,175 97,170 82,162" fill="#ff2a4b" />
            <polygon points="102,179 112,183 114,179 104,175" fill="#ff2a4b" />
            <!-- Lower Wing Laser Cannon -->
            <rect x="35" y="178" width="135" height="4" rx="2" fill="#475569" />
            <rect x="165" y="176" width="10" height="8" rx="2" fill="#1e293b" />
            <!-- Laser Tip Charge Glow -->
            <circle cx="176" cy="180" r="3.5" fill="#ff2a4b" style="filter: drop-shadow(0 0 6px #ff2a4b);" />

            <!-- Incom 4L4 Sublight Engine Cylinders -->
            <rect x="32" y="75" width="45" height="15" rx="4" fill="#334155" stroke="#1e293b" stroke-width="1.5" />
            <circle cx="32" cy="82.5" r="5.5" fill="#ff0055" style="filter: drop-shadow(0 0 6px #ff0055);" />
            
            <rect x="32" y="135" width="45" height="15" rx="4" fill="#334155" stroke="#1e293b" stroke-width="1.5" />
            <circle cx="32" cy="142.5" r="5.5" fill="#ff0055" style="filter: drop-shadow(0 0 6px #ff0055);" />

            <!-- MAIN FUSELAGE -->
            <polygon points="40,92 125,94 125,130 40,132" fill="url(#xwing-hull)" stroke="#64748b" stroke-width="1.5" />
            
            <!-- Astromech Droid R2-D2 Socket -->
            <rect x="86" y="86" width="14" height="8" fill="#1e293b" />
            <ellipse cx="93" cy="86" rx="6" ry="6" fill="#cbd5e1" stroke="#0066cc" stroke-width="1.5" />
            <rect x="90" y="83" width="3" height="3" fill="#0066cc" />
            <circle cx="95" cy="85" r="1.2" fill="#ff2a4b" style="filter: drop-shadow(0 0 2px #ff2a4b);" />

            <!-- Cockpit Canopy -->
            <polygon points="108,94 140,98 140,126 108,130" fill="#0f172a" stroke="#475569" stroke-width="1.5" />
            <polygon points="112,96 136,100 136,110 112,108" fill="#1e293b" />
            <line x1="114" y1="99" x2="134" y2="103" stroke="#38bdf8" stroke-width="1.5" />

            <!-- Tapered Nose Section -->
            <polygon points="125,94 186,108 186,116 125,130" fill="url(#xwing-hull)" stroke="#64748b" stroke-width="1.5" />
            <polygon points="186,108 198,111 198,113 186,116" fill="#334155" />
            <polygon points="145,100 162,104 160,110 143,106" fill="#ff2a4b" />
            <rect x="168" y="106" width="10" height="4" fill="#ffea29" />
            
            <line x1="160" y1="112" x2="195" y2="112" stroke="#ff2a4b" stroke-width="2" style="filter: drop-shadow(0 0 8px #ff2a4b);" />
          </svg>
        </div>
      `;
      return;
    }

    const isSaber = level.style === 'saber';

    container.innerHTML = `
      <div class="combatant-figure player-figure ${isSaber ? 'stance-saber' : 'stance-blaster'}">
        <svg viewBox="0 0 180 230" class="hero-svg">
          <defs>
            <filter id="hero-saber-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="cloak-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#4a2e1b" />
              <stop offset="60%" stop-color="#341e10" />
              <stop offset="100%" stop-color="#221309" />
            </linearGradient>
            <linearGradient id="tunic-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ebe0c8" />
              <stop offset="100%" stop-color="#c1ae8d" />
            </linearGradient>
            <linearGradient id="skin-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ffdfc4" />
              <stop offset="100%" stop-color="#f2be9b" />
            </linearGradient>
            <linearGradient id="hair-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#6a3e20" />
              <stop offset="50%" stop-color="#492913" />
              <stop offset="100%" stop-color="#2e1808" />
            </linearGradient>
            <linearGradient id="hilt-metal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#8a95a5" />
              <stop offset="50%" stop-color="#d0d7de" />
              <stop offset="100%" stop-color="#555d69" />
            </linearGradient>
            <linearGradient id="blaster-metal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#3e4451" />
              <stop offset="100%" stop-color="#1e222b" />
            </linearGradient>
          </defs>

          <!-- Outer Jedi Cloak Drapery -->
          <path d="M 42,105 Q 85,88 128,105 L 146,215 Q 85,225 24,215 Z" fill="url(#cloak-grad)" />
          <!-- Cloak Inner Shoulder Folds -->
          <path d="M 50,110 L 32,205 L 55,212 Z" fill="#221309" opacity="0.6" />
          <path d="M 120,110 L 138,205 L 115,212 Z" fill="#221309" opacity="0.6" />

          <!-- Inner Jedi Crossing Tunic -->
          <path d="M 56,108 L 85,175 L 114,108 Z" fill="url(#tunic-grad)" />
          <path d="M 64,108 L 85,152 L 106,108" stroke="#a49171" stroke-width="2" fill="none" />
          <!-- Under-collar / Tabard -->
          <polygon points="72,108 85,130 98,108" fill="#5c381e" />

          <!-- Jedi Leather Utility Belt -->
          <rect x="48" y="146" width="74" height="15" rx="3" fill="#23140a" />
          <line x1="48" y1="153" x2="122" y2="153" stroke="#3a2213" stroke-width="1.5" />
          <!-- Belt Buckle -->
          <rect x="77" y="144" width="16" height="19" rx="3" fill="#d4af37" stroke="#aa8c2c" stroke-width="1" />
          <circle cx="85" cy="153.5" r="3.5" fill="#23140a" />
          <!-- Food/Energy Silver Capsules on Belt -->
          <rect x="54" y="148" width="4" height="11" rx="1.5" fill="#c0c7d0" />
          <rect x="62" y="148" width="4" height="11" rx="1.5" fill="#c0c7d0" />
          <rect x="104" y="148" width="4" height="11" rx="1.5" fill="#c0c7d0" />
          <rect x="112" y="148" width="4" height="11" rx="1.5" fill="#c0c7d0" />

          <!-- Lower Robes / Boots -->
          <path d="M 60,161 L 54,222 L 78,222 L 82,161 Z" fill="#2c1a0e" />
          <path d="M 88,161 L 92,222 L 116,222 L 110,161 Z" fill="#2c1a0e" />
          <rect x="52" y="212" width="28" height="10" rx="3" fill="#180e08" />
          <rect x="90" y="212" width="28" height="10" rx="3" fill="#180e08" />

          <!-- Neck -->
          <rect x="77" y="90" width="16" height="20" rx="4" fill="url(#skin-grad)" />

          <!-- Head & Face -->
          <ellipse cx="85" cy="74" rx="23" ry="26" fill="url(#skin-grad)" />
          
          <!-- Heroic Eyebrows -->
          <path d="M 68,64 Q 77,60 81,63" stroke="#492913" stroke-width="2.5" stroke-linecap="round" fill="none" />
          <path d="M 89,63 Q 93,60 102,64" stroke="#492913" stroke-width="2.5" stroke-linecap="round" fill="none" />

          <!-- Expressive Eyes -->
          <ellipse cx="75" cy="72" rx="4.5" ry="5.5" fill="#ffffff" />
          <circle cx="75.5" cy="72.5" r="3.5" fill="#1b120c" />
          <circle cx="74" cy="70.5" r="1.3" fill="#ffffff" />

          <ellipse cx="95" cy="72" rx="4.5" ry="5.5" fill="#ffffff" />
          <circle cx="94.5" cy="72.5" r="3.5" fill="#1b120c" />
          <circle cx="93" cy="70.5" r="1.3" fill="#ffffff" />

          <!-- Nose & Smile -->
          <path d="M 84,77 Q 85,81 86,81" stroke="#d49b77" stroke-width="1.8" fill="none" stroke-linecap="round" />
          <path d="M 78,87 Q 85,93 92,87" stroke="#9e583c" stroke-width="2" fill="none" stroke-linecap="round" />
          
          <!-- Cheeks blush -->
          <circle cx="68" cy="78" r="4" fill="#ff7675" opacity="0.3" />
          <circle cx="102" cy="78" r="4" fill="#ff7675" opacity="0.3" />

          <!-- Jedi Padawan Hair with Highlights -->
          <path d="M 58,68 C 55,42 75,32 85,32 C 95,32 115,42 112,68 C 108,52 95,45 85,46 C 75,45 62,52 58,68 Z" fill="url(#hair-grad)" />
          <path d="M 62,62 Q 78,44 88,48 Q 98,44 108,62 Q 95,50 85,51 Q 75,50 62,62 Z" fill="#784928" opacity="0.7" />
          <!-- Padawan Braid -->
          <path d="M 106,75 Q 112,90 108,108 Q 112,112 110,118" stroke="#492913" stroke-width="3" fill="none" stroke-linecap="round" />
          <circle cx="110" cy="118" r="2" fill="#d4af37" />

          <!-- WEAPON: LIGHTSABER OR BLASTER -->
          ${isSaber ? `
            <!-- Left Hand holding base -->
            <ellipse cx="114" cy="120" rx="6" ry="7" fill="url(#skin-grad)" />
            <!-- Right Hand holding hilt -->
            <ellipse cx="120" cy="108" rx="7" ry="8" fill="url(#skin-grad)" />

            <!-- Lightsaber Hilt -->
            <g transform="rotate(-15, 122, 110)">
              <!-- Hilt Body -->
              <rect x="117" y="92" width="10" height="34" rx="2" fill="url(#hilt-metal)" stroke="#2b313a" stroke-width="1" />
              <!-- Black Grip Ribs -->
              <line x1="117" y1="106" x2="127" y2="106" stroke="#1a1e24" stroke-width="2" />
              <line x1="117" y1="111" x2="127" y2="111" stroke="#1a1e24" stroke-width="2" />
              <line x1="117" y1="116" x2="127" y2="116" stroke="#1a1e24" stroke-width="2" />
              <line x1="117" y1="121" x2="127" y2="121" stroke="#1a1e24" stroke-width="2" />
              <!-- Activation Switch Box -->
              <rect x="115" y="100" width="4" height="6" fill="#d4af37" />
              <circle cx="117" cy="103" r="1" fill="#ff2a4b" />
              <!-- Emitter Shroud -->
              <polygon points="115,92 129,92 126,84 118,84" fill="#bcc5cf" stroke="#333" stroke-width="1" />
              
              <!-- GLOWING LIGHTSABER BLADE -->
              <line x1="122" y1="84" x2="152" y2="6" stroke="${saberColor}" stroke-width="10" stroke-linecap="round" class="lightsaber-blade" style="filter: url(#hero-saber-glow) drop-shadow(0 0 16px ${saberColor}) drop-shadow(0 0 28px ${saberColor});" />
              <line x1="122" y1="84" x2="152" y2="6" stroke="${saberColor}" stroke-width="6" stroke-linecap="round" />
              <line x1="122" y1="84" x2="152" y2="6" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" />
            </g>
          ` : `
            <!-- Hand gripping blaster -->
            <ellipse cx="118" cy="118" rx="8" ry="7" fill="url(#skin-grad)" />
            <!-- DL-44 Heavy Blaster Pistol -->
            <g transform="translate(112, 102)">
              <!-- Handle Grip -->
              <rect x="0" y="14" width="8" height="18" rx="2" fill="#4a2e1b" transform="rotate(-15, 4, 20)" stroke="#1a120c" stroke-width="1" />
              <!-- Receiver Body -->
              <rect x="2" y="8" width="30" height="12" rx="2" fill="url(#blaster-metal)" stroke="#111317" stroke-width="1" />
              <!-- Scope Mount & Optical Scope -->
              <rect x="6" y="2" width="22" height="5" rx="2" fill="#555d69" />
              <circle cx="28" cy="4.5" r="3" fill="#00d0ff" style="filter: drop-shadow(0 0 4px #00d0ff);" />
              <!-- Barrel and Flash Suppressor Muzzle -->
              <rect x="32" y="11" width="16" height="6" fill="#8a95a5" />
              <polygon points="48,9 56,8 56,19 48,18" fill="#555d69" />
              <!-- Power Pack Glow / Muzzle Tip -->
              <circle cx="20" cy="14" r="3" fill="#00d0ff" opacity="0.8" />
              <circle cx="56" cy="13.5" r="3.5" fill="#00d0ff" style="filter: drop-shadow(0 0 8px #00d0ff) drop-shadow(0 0 14px #00d0ff);" />
              <circle cx="56" cy="13.5" r="1.5" fill="#ffffff" />
            </g>
          `}
        </svg>
      </div>
    `;
  }

  renderEnemyAvatar(level) {
    const container = document.getElementById('enemy-avatar-box');
    let svgContent = '';

    if (level.enemySvg === 'tie-fighter') {
      svgContent = `
        <svg viewBox="0 0 210 220" class="enemy-svg anim-hover">
          <defs>
            <linearGradient id="tie-panel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#1e242c" />
              <stop offset="50%" stop-color="#0f1318" />
              <stop offset="100%" stop-color="#05070a" />
            </linearGradient>
            <linearGradient id="tie-hull" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#717c8d" />
              <stop offset="50%" stop-color="#475161" />
              <stop offset="100%" stop-color="#282f3a" />
            </linearGradient>
          </defs>

          <!-- REAR ION ENGINE THRUSTER (Right) -->
          <circle cx="140" cy="110" r="8" fill="#ff2a4b" opacity="0.8" style="filter: drop-shadow(0 0 10px #ff2a4b);" />
          <circle cx="140" cy="110" r="4" fill="#ffffff" />

          <!-- HEXAGONAL SOLAR COLLECTOR WING (Facing towards player in perspective) -->
          <polygon points="65,18 120,18 145,110 120,202 65,202 40,110" fill="url(#tie-panel)" stroke="#475161" stroke-width="3" />
          
          <!-- Inner Solar Cell Structural Spokes -->
          <line x1="92" y1="110" x2="65" y2="18" stroke="#5d6878" stroke-width="2" />
          <line x1="92" y1="110" x2="120" y2="18" stroke="#5d6878" stroke-width="2" />
          <line x1="92" y1="110" x2="145" y2="110" stroke="#5d6878" stroke-width="2" />
          <line x1="92" y1="110" x2="120" y2="202" stroke="#5d6878" stroke-width="2" />
          <line x1="92" y1="110" x2="65" y2="202" stroke="#5d6878" stroke-width="2" />
          <line x1="92" y1="110" x2="40" y2="110" stroke="#5d6878" stroke-width="2" />

          <!-- Center Wing Hub -->
          <polygon points="80,102 104,102 110,110 104,118 80,118 74,110" fill="#2d3542" stroke="#5d6878" stroke-width="1.5" />

          <!-- PYLON BRACKET TO COCKPIT -->
          <rect x="92" y="104" width="38" height="12" fill="url(#tie-hull)" stroke="#1a1e26" stroke-width="1.5" />

          <!-- SPHERICAL COMMAND COCKPIT POD -->
          <circle cx="122" cy="110" r="34" fill="url(#tie-hull)" stroke="#181c22" stroke-width="2" />
          <circle cx="122" cy="110" r="28" fill="#1e232b" />

          <!-- OCTAGONAL VIEWPORT WINDOW -->
          <polygon points="106,102 114,94 126,94 134,102 134,118 126,126 114,126 106,118" fill="#0a0d12" stroke="#64748b" stroke-width="1.5" />
          <circle cx="120" cy="110" r="6" fill="#1e293b" stroke="#38bdf8" stroke-width="1" />
          <line x1="120" y1="94" x2="120" y2="126" stroke="#475569" stroke-width="1.5" />
          <line x1="106" y1="110" x2="134" y2="110" stroke="#475569" stroke-width="1.5" />
          <line x1="110" y1="100" x2="130" y2="120" stroke="#475569" stroke-width="1.5" />
          <line x1="110" y1="120" x2="130" y2="100" stroke="#475569" stroke-width="1.5" />
          <path d="M 112,102 Q 120,96 128,102" stroke="#38bdf8" stroke-width="1.5" fill="none" opacity="0.8" />

          <!-- TWIN CHIN LASER CANNONS -->
          <circle cx="106" cy="132" r="3.5" fill="#222" stroke="#555" stroke-width="1" />
          <circle cx="114" cy="134" r="3.5" fill="#222" stroke="#555" stroke-width="1" />
          <!-- Emerald Green Laser Charge Glow -->
          <circle cx="106" cy="132" r="4.5" fill="#25f252" style="filter: drop-shadow(0 0 8px #25f252);" />
          <circle cx="106" cy="132" r="2" fill="#ffffff" />
          <circle cx="114" cy="134" r="4.5" fill="#25f252" style="filter: drop-shadow(0 0 8px #25f252);" />
          <circle cx="114" cy="134" r="2" fill="#ffffff" />
        </svg>
      `;
    } else if (level.enemySvg === 'droid-training') {
      svgContent = `
        <svg viewBox="0 0 190 220" class="enemy-svg anim-hover">
          <defs>
            <radialGradient id="droid-metal" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stop-color="#9da7b8" />
              <stop offset="45%" stop-color="#555e6d" />
              <stop offset="85%" stop-color="#2d333d" />
              <stop offset="100%" stop-color="#191d24" />
            </radialGradient>
            <radialGradient id="lens-cyan" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="35%" stop-color="#00f2fe" />
              <stop offset="70%" stop-color="#0099cc" />
              <stop offset="100%" stop-color="#003355" />
            </radialGradient>
          </defs>

          <!-- Floating Repulsorlift Ion Ring underneath -->
          <ellipse cx="95" cy="180" rx="38" ry="10" fill="none" stroke="#00d0ff" stroke-width="3" opacity="0.85" style="filter: drop-shadow(0 0 8px #00d0ff);" />
          <ellipse cx="95" cy="180" rx="20" ry="5" fill="#00d0ff" opacity="0.4" style="filter: blur(4px);" />

          <!-- Main Spherical Droid Body -->
          <circle cx="95" cy="100" r="50" fill="url(#droid-metal)" stroke="#1a1e24" stroke-width="2" />
          
          <!-- Equatorial Groove Seam -->
          <path d="M 46,98 C 65,108 125,108 144,98 C 125,103 65,103 46,98 Z" fill="#13171c" />
          <path d="M 45,100 C 65,110 125,110 145,100" stroke="#717c8d" stroke-width="1.5" fill="none" />

          <!-- Surface Rivets & Hex Panel Details -->
          <circle cx="65" cy="72" r="2" fill="#adb5c2" /><circle cx="125" cy="72" r="2" fill="#adb5c2" />
          <circle cx="65" cy="128" r="2" fill="#adb5c2" /><circle cx="125" cy="128" r="2" fill="#adb5c2" />
          <circle cx="95" cy="55" r="2" fill="#adb5c2" />

          <!-- Primary Large Optical Photoreceptor Lens -->
          <circle cx="95" cy="98" r="18" fill="#10141a" stroke="#4a5361" stroke-width="2" />
          <circle cx="95" cy="98" r="14" fill="url(#lens-cyan)" style="filter: drop-shadow(0 0 10px #00e5ff);" />
          <circle cx="91" cy="94" r="3.5" fill="#ffffff" opacity="0.85" />

          <!-- Secondary Sensors -->
          <!-- Red Targeting Laser Node -->
          <circle cx="70" cy="80" r="6.5" fill="#200508" stroke="#555" stroke-width="1" />
          <circle cx="70" cy="80" r="4.5" fill="#ff2a4b" style="filter: drop-shadow(0 0 8px #ff2a4b);" />
          <circle cx="68.5" cy="78.5" r="1.5" fill="#ffffff" />

          <!-- Amber Scanner Aperture -->
          <circle cx="118" cy="80" r="5" fill="#ffb703" style="filter: drop-shadow(0 0 6px #ffb703);" />

          <!-- Green Status LED -->
          <circle cx="95" cy="128" r="4" fill="#25f252" style="filter: drop-shadow(0 0 6px #25f252);" />

          <!-- Mini Antenna Spire -->
          <line x1="95" y1="50" x2="95" y2="28" stroke="#8a95a5" stroke-width="2.5" />
          <circle cx="95" cy="26" r="3" fill="#ff2a4b" style="filter: drop-shadow(0 0 5px #ff2a4b);" />

          <!-- Left & Right Blaster Nozzle Barrels -->
          <rect x="22" y="96" width="24" height="8" rx="2" fill="#3a404d" stroke="#1f232b" stroke-width="1" />
          <circle cx="21" cy="100" r="3" fill="#ff2a4b" style="filter: drop-shadow(0 0 6px #ff2a4b);" />
          <rect x="144" y="96" width="24" height="8" rx="2" fill="#3a404d" stroke="#1f232b" stroke-width="1" />
          <circle cx="169" cy="100" r="3" fill="#ff2a4b" style="filter: drop-shadow(0 0 6px #ff2a4b);" />
        </svg>
      `;
    } else if (level.enemySvg === 'droid-b1') {
      svgContent = `
        <svg viewBox="0 0 190 230" class="enemy-svg">
          <defs>
            <linearGradient id="b1-tan" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#edd2a4" />
              <stop offset="45%" stop-color="#d4af78" />
              <stop offset="100%" stop-color="#8a673c" />
            </linearGradient>
            <linearGradient id="b1-joint" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#555d69" />
              <stop offset="100%" stop-color="#2d333b" />
            </linearGradient>
          </defs>

          <!-- Back Antenna Spire -->
          <line x1="120" y1="85" x2="135" y2="25" stroke="#7d603a" stroke-width="3" />
          <circle cx="136" cy="24" r="3" fill="#ff4444" style="filter: drop-shadow(0 0 5px #ff4444);" />

          <!-- Back Comm Unit Backpack -->
          <rect x="105" y="88" width="24" height="42" rx="4" fill="#a48152" stroke="#5d4323" stroke-width="1.5" />

          <!-- Elongated B1 Droid Skull -->
          <path d="M 72,40 C 72,25 106,20 114,35 C 122,50 118,72 108,76 C 96,80 72,65 72,40 Z" fill="url(#b1-tan)" stroke="#5d4323" stroke-width="2" />
          <!-- Snout Extension -->
          <path d="M 68,44 L 54,52 L 66,58 Z" fill="#d4af78" stroke="#5d4323" stroke-width="1.5" />
          <!-- Photoreceptor Sensor Eyes -->
          <circle cx="82" cy="46" r="4.5" fill="#1b120c" />
          <circle cx="82" cy="46" r="2" fill="#ffd000" opacity="0.8" />
          <circle cx="100" cy="44" r="4" fill="#1b120c" />
          <circle cx="100" cy="44" r="1.8" fill="#ffd000" opacity="0.8" />

          <!-- Neck Pistons & Articulated Spine -->
          <rect x="90" y="74" width="7" height="24" rx="2" fill="url(#b1-joint)" />
          <line x1="86" y1="78" x2="86" y2="96" stroke="#444" stroke-width="2" />

          <!-- Torso Chest Chassis -->
          <path d="M 72,98 L 115,98 L 108,145 L 78,145 Z" fill="url(#b1-tan)" stroke="#5d4323" stroke-width="2" />
          <line x1="93" y1="98" x2="93" y2="145" stroke="#6b4c27" stroke-width="2" />
          <rect x="80" y="106" width="26" height="6" rx="2" fill="#6b4c27" />

          <!-- Hip & Pelvis Unit -->
          <polygon points="76,145 110,145 104,165 82,165" fill="url(#b1-joint)" />

          <!-- Skeletal Legs -->
          <line x1="84" y1="165" x2="78" y2="215" stroke="#a48152" stroke-width="6" stroke-linecap="round" />
          <line x1="102" y1="165" x2="108" y2="215" stroke="#a48152" stroke-width="6" stroke-linecap="round" />
          <polygon points="68,222 88,222 82,213 72,213" fill="#6b4c27" />
          <polygon points="100,222 120,222 114,213 104,213" fill="#6b4c27" />

          <!-- Arms & E-11 Blaster Rifle in Aim Stance -->
          <g transform="translate(15, 10)">
            <!-- Left Arm -->
            <path d="M 60,98 L 45,128 L 70,135" stroke="#a48152" stroke-width="6" stroke-linecap="round" fill="none" />
            <!-- E-11 Blaster Carbine -->
            <rect x="25" y="128" width="68" height="11" rx="2" fill="#1b1e24" stroke="#333a45" stroke-width="1.5" />
            <rect x="42" y="122" width="22" height="6" rx="1.5" fill="#333a45" />
            <rect x="20" y="130" width="8" height="7" fill="#555d69" />
            <!-- Red Blaster Muzzle Charge -->
            <circle cx="18" cy="133.5" r="4" fill="#ff2a4b" style="filter: drop-shadow(0 0 8px #ff2a4b);" />
            <circle cx="18" cy="133.5" r="1.5" fill="#ffffff" />
          </g>
        </svg>
      `;
    } else if (level.enemySvg === 'snowtrooper') {
      svgContent = `
        <svg viewBox="0 0 190 230" class="enemy-svg">
          <defs>
            <linearGradient id="snow-armor" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="60%" stop-color="#e2e8f0" />
              <stop offset="100%" stop-color="#a0aec0" />
            </linearGradient>
            <linearGradient id="snow-cowl" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#f8fafc" />
              <stop offset="50%" stop-color="#e2e8f0" />
              <stop offset="100%" stop-color="#94a3b8" />
            </linearGradient>
          </defs>

          <!-- Snowtrooper Helmet Dome -->
          <path d="M 64,52 C 64,28 126,28 126,52 L 128,78 L 62,78 Z" fill="url(#snow-armor)" stroke="#718096" stroke-width="2" />
          <path d="M 72,42 Q 95,34 118,42" stroke="#ffffff" stroke-width="3" fill="none" />

          <!-- Distinctive Cold-Assault Fabric Facemask / Cowl -->
          <path d="M 60,74 L 130,74 L 138,125 Q 95,135 52,125 Z" fill="url(#snow-cowl)" stroke="#64748b" stroke-width="2" />
          <!-- Cowl Fabric Folds -->
          <path d="M 75,76 L 70,122" stroke="#cbd5e1" stroke-width="2" />
          <path d="M 115,76 L 120,122" stroke="#cbd5e1" stroke-width="2" />

          <!-- Dark Horizontal Visor Slit -->
          <rect x="70" y="62" width="50" height="9" rx="2.5" fill="#0f172a" />
          <line x1="72" y1="65" x2="116" y2="65" stroke="#ffffff" stroke-width="1.5" opacity="0.8" />

          <!-- Hard Molded Chest Armor Unit -->
          <path d="M 54,124 L 136,124 L 128,182 L 62,182 Z" fill="url(#snow-armor)" stroke="#64748b" stroke-width="2" />
          <!-- Central Environmental Regulator Chest Box -->
          <rect x="78" y="134" width="34" height="36" rx="4" fill="#334155" stroke="#1e293b" stroke-width="1.5" />
          <!-- Regulator Control Buttons (Imperial Rank Status) -->
          <circle cx="87" cy="144" r="3" fill="#ff2a4b" style="filter: drop-shadow(0 0 4px #ff2a4b);" />
          <circle cx="103" cy="144" r="3" fill="#00d0ff" style="filter: drop-shadow(0 0 4px #00d0ff);" />
          <rect x="83" y="156" width="24" height="6" rx="2" fill="#e2e8f0" />

          <!-- Snow Kama (Insulated Combat Skirt) & Boots -->
          <path d="M 60,182 L 52,224 L 138,224 L 130,182 Z" fill="#94a3b8" />
          <rect x="58" y="214" width="28" height="12" rx="3" fill="#475569" />
          <rect x="104" y="214" width="28" height="12" rx="3" fill="#475569" />

          <!-- Aimed Heavy Blaster Rifle -->
          <g transform="translate(10, 20)">
            <rect x="22" y="125" width="70" height="14" rx="3" fill="#1e293b" stroke="#0f172a" stroke-width="2" />
            <rect x="38" y="117" width="28" height="8" rx="2" fill="#475569" />
            <line x1="42" y1="120" x2="62" y2="120" stroke="#00e5ff" stroke-width="2" />
            <circle cx="18" cy="132" r="5" fill="#ff2a4b" style="filter: drop-shadow(0 0 10px #ff2a4b) drop-shadow(0 0 16px #ff2a4b);" />
            <circle cx="18" cy="132" r="2" fill="#ffffff" />
          </g>
        </svg>
      `;
    } else if (level.enemySvg === 'inquisitor') {
      svgContent = `
        <svg viewBox="0 0 190 230" class="enemy-svg">
          <defs>
            <linearGradient id="inq-armor" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#2c323f" />
              <stop offset="50%" stop-color="#181b22" />
              <stop offset="100%" stop-color="#0a0c10" />
            </linearGradient>
            <filter id="inq-saber-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- Sith Cape with Deep Crimson Inner Satin Lining -->
          <path d="M 40,85 L 14,215 Q 95,230 176,215 L 150,85 Z" fill="#0d0f14" />
          <path d="M 45,95 L 32,210 L 65,215 Z" fill="#88081c" opacity="0.9" />
          <path d="M 145,95 L 158,210 L 125,215 Z" fill="#88081c" opacity="0.9" />

          <!-- Armored Pauldrons with Red Edge Piping -->
          <polygon points="36,92 68,82 72,118 32,114" fill="url(#inq-armor)" stroke="#ff2a4b" stroke-width="1.5" />
          <polygon points="154,92 122,82 118,118 158,114" fill="url(#inq-armor)" stroke="#ff2a4b" stroke-width="1.5" />

          <!-- Inquisitor Armored Helmet -->
          <path d="M 64,48 C 64,24 126,24 126,48 L 132,92 L 95,104 L 58,92 Z" fill="url(#inq-armor)" stroke="#ff2a4b" stroke-width="1.5" />
          <!-- Sinister Angular Brow -->
          <path d="M 68,54 L 95,66 L 122,54" stroke="#3e4759" stroke-width="3" fill="none" />

          <!-- Glowing Crimson Visor Slit -->
          <polygon points="68,64 95,73 122,64 122,70 95,78 68,70" fill="#ff0044" style="filter: drop-shadow(0 0 10px #ff0044) drop-shadow(0 0 18px #ff0044);" />
          <line x1="72" y1="67" x2="118" y2="67" stroke="#ffffff" stroke-width="1.5" />

          <!-- Sharp Mouth Grille / Respirator Plate -->
          <polygon points="86,84 104,84 95,96" fill="#111" stroke="#ff2a4b" stroke-width="1" />

          <!-- Armored Torso with Red Rank Lights -->
          <path d="M 62,106 L 128,106 L 120,172 L 70,172 Z" fill="url(#inq-armor)" stroke="#333b47" stroke-width="2" />
          <!-- Imperial Crimson Rank Insignia -->
          <rect x="80" y="122" width="30" height="8" rx="2" fill="#1a1e27" stroke="#444" stroke-width="1" />
          <rect x="83" y="124" width="7" height="4" fill="#ff2a4b" style="filter: drop-shadow(0 0 5px #ff2a4b);" />
          <rect x="92" y="124" width="7" height="4" fill="#ff2a4b" style="filter: drop-shadow(0 0 5px #ff2a4b);" />
          <rect x="101" y="124" width="7" height="4" fill="#ff2a4b" style="filter: drop-shadow(0 0 5px #ff2a4b);" />

          <!-- Armored Greaves / Boots -->
          <rect x="68" y="172" width="22" height="48" rx="4" fill="#12151c" />
          <rect x="100" y="172" width="22" height="48" rx="4" fill="#12151c" />

          <!-- DOUBLE-BLADED SPINNING INQUISITOR LIGHTSABER -->
          <g transform="translate(38, 120)">
            <!-- Circular Handguard Ring Hilt -->
            <circle cx="0" cy="0" r="16" fill="none" stroke="#717c8d" stroke-width="3.5" />
            <circle cx="0" cy="0" r="16" fill="none" stroke="#ff2a4b" stroke-width="1" />
            <rect x="-4" y="-12" width="8" height="24" rx="2" fill="#1f232b" stroke="#717c8d" stroke-width="1" />
            
            <!-- UPPER RED BLADE -->
            <line x1="0" y1="-16" x2="0" y2="-115" stroke="#ff0044" stroke-width="9" stroke-linecap="round" style="filter: url(#inq-saber-glow) drop-shadow(0 0 14px #ff0044) drop-shadow(0 0 24px #ff0044);" />
            <line x1="0" y1="-16" x2="0" y2="-115" stroke="#ff4d6d" stroke-width="5" stroke-linecap="round" />
            <line x1="0" y1="-16" x2="0" y2="-115" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />

            <!-- LOWER RED BLADE -->
            <line x1="0" y1="16" x2="0" y2="105" stroke="#ff0044" stroke-width="9" stroke-linecap="round" style="filter: url(#inq-saber-glow) drop-shadow(0 0 14px #ff0044) drop-shadow(0 0 24px #ff0044);" />
            <line x1="0" y1="16" x2="0" y2="105" stroke="#ff4d6d" stroke-width="5" stroke-linecap="round" />
            <line x1="0" y1="16" x2="0" y2="105" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
          </g>
        </svg>
      `;
    } else {
      // DARTH VADER (Lord Vader)
      svgContent = `
        <svg viewBox="0 0 190 230" class="enemy-svg">
          <defs>
            <linearGradient id="vader-helmet" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#2a2e39" />
              <stop offset="45%" stop-color="#14171f" />
              <stop offset="100%" stop-color="#050608" />
            </linearGradient>
            <linearGradient id="vader-cape" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#1c1f26" />
              <stop offset="60%" stop-color="#0c0e12" />
              <stop offset="100%" stop-color="#020305" />
            </linearGradient>
            <filter id="vader-saber-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- Massive Billowing Sith Lord Cape -->
          <path d="M 40,78 L 10,224 Q 95,235 180,224 L 150,78 Z" fill="url(#vader-cape)" />
          <path d="M 45,85 L 26,220 L 60,224 Z" fill="#000000" opacity="0.6" />
          <path d="M 145,85 L 164,220 L 130,224 Z" fill="#000000" opacity="0.6" />

          <!-- Flared Obsidian Helmet Dome -->
          <path d="M 54,58 C 54,20 136,20 136,58 L 144,90 Q 95,98 46,90 Z" fill="url(#vader-helmet)" stroke="#3a4050" stroke-width="1.8" />
          <!-- Helmet Top Specular Reflection Arc -->
          <path d="M 68,40 Q 95,26 122,40" stroke="#6b778d" stroke-width="2.5" fill="none" opacity="0.8" />
          <line x1="95" y1="28" x2="95" y2="60" stroke="#4a5366" stroke-width="2" />

          <!-- Menacing Eye Lenses with Dark Ruby Glint -->
          <path d="M 64,68 Q 78,64 88,72 Q 78,80 64,76 Z" fill="#0a0c10" stroke="#222" stroke-width="1" />
          <circle cx="76" cy="71" r="2" fill="#ff1744" opacity="0.75" style="filter: drop-shadow(0 0 4px #ff1744);" />

          <path d="M 126,68 Q 112,64 102,72 Q 112,80 126,76 Z" fill="#0a0c10" stroke="#222" stroke-width="1" />
          <circle cx="114" cy="71" r="2" fill="#ff1744" opacity="0.75" style="filter: drop-shadow(0 0 4px #ff1744);" />

          <!-- Triangular Lower Respirator Grille with Slats -->
          <polygon points="82,78 108,78 95,99" fill="#14171f" stroke="#525d73" stroke-width="1.5" />
          <line x1="86" y1="84" x2="104" y2="84" stroke="#333" stroke-width="1.5" />
          <line x1="89" y1="89" x2="101" y2="89" stroke="#333" stroke-width="1.5" />
          <line x1="92" y1="94" x2="98" y2="94" stroke="#333" stroke-width="1.5" />
          <!-- Atmospheric Chin Tusks -->
          <circle cx="82" cy="98" r="3" fill="#cbd5e1" stroke="#333" stroke-width="1" />
          <circle cx="108" cy="98" r="3" fill="#cbd5e1" stroke="#333" stroke-width="1" />

          <!-- Shoulder Armor with Alternating Black and Silver Ribs -->
          <path d="M 46,94 L 144,94 L 138,125 L 52,125 Z" fill="#11141a" stroke="#2e3544" stroke-width="1.5" />
          <line x1="62" y1="94" x2="65" y2="125" stroke="#717c8d" stroke-width="2" />
          <line x1="76" y1="94" x2="78" y2="125" stroke="#717c8d" stroke-width="2" />
          <line x1="114" y1="94" x2="112" y2="125" stroke="#717c8d" stroke-width="2" />
          <line x1="128" y1="94" x2="125" y2="125" stroke="#717c8d" stroke-width="2" />

          <!-- Chest Life Support Box -->
          <rect x="74" y="128" width="42" height="32" rx="3" fill="#161922" stroke="#64748b" stroke-width="2" />
          <!-- Indicator Rocker Switches -->
          <rect x="78" y="133" width="9" height="7" rx="1.5" fill="#ff2a4b" style="filter: drop-shadow(0 0 5px #ff2a4b);" />
          <rect x="91" y="133" width="9" height="7" rx="1.5" fill="#25f252" style="filter: drop-shadow(0 0 5px #25f252);" />
          <rect x="103" y="133" width="9" height="7" rx="1.5" fill="#00d0ff" style="filter: drop-shadow(0 0 5px #00d0ff);" />
          <!-- Status display slot bars -->
          <rect x="79" y="145" width="32" height="4" fill="#ffffff" opacity="0.9" />
          <rect x="79" y="152" width="14" height="3" fill="#ff2a4b" />
          <rect x="97" y="152" width="14" height="3" fill="#25f252" />

          <!-- Combat Belt with Utility Boxes -->
          <rect x="56" y="165" width="78" height="15" fill="#0b0d12" stroke="#222" stroke-width="1" />
          <rect x="86" y="163" width="18" height="19" rx="2" fill="#94a3b8" stroke="#333" stroke-width="1" />
          <rect x="62" y="166" width="14" height="13" rx="2" fill="#1f242e" stroke="#64748b" stroke-width="1" />
          <circle cx="69" cy="172.5" r="2" fill="#25f252" />
          <rect x="114" y="166" width="14" height="13" rx="2" fill="#1f242e" stroke="#64748b" stroke-width="1" />
          <circle cx="121" cy="172.5" r="2" fill="#ff2a4b" />

          <!-- Armored Boots -->
          <rect x="65" y="180" width="26" height="44" rx="4" fill="#090b0e" stroke="#222" stroke-width="1" />
          <rect x="99" y="180" width="26" height="44" rx="4" fill="#090b0e" stroke="#222" stroke-width="1" />

          <!-- DARTH VADER'S ICONIC LIGHTSABER -->
          <g transform="translate(34, 125) rotate(15)">
            <!-- Hilt -->
            <rect x="0" y="0" width="10" height="36" rx="2" fill="#94a3b8" stroke="#111" stroke-width="1" />
            <!-- Black Rubber Grips -->
            <line x1="0" y1="14" x2="10" y2="14" stroke="#111" stroke-width="2" />
            <line x1="0" y1="19" x2="10" y2="19" stroke="#111" stroke-width="2" />
            <line x1="0" y1="24" x2="10" y2="24" stroke="#111" stroke-width="2" />
            <line x1="0" y1="29" x2="10" y2="29" stroke="#111" stroke-width="2" />
            <!-- Emitter Shroud -->
            <polygon points="-2,0 12,0 9,-8 1,-8" fill="#1e222b" stroke="#475569" stroke-width="1" />

            <!-- BRILLIANT SITH RED LIGHTSABER BLADE -->
            <line x1="5" y1="-8" x2="5" y2="-120" stroke="#ff002a" stroke-width="11" stroke-linecap="round" style="filter: url(#vader-saber-glow) drop-shadow(0 0 16px #ff002a) drop-shadow(0 0 32px #ff0000);" />
            <line x1="5" y1="-8" x2="5" y2="-120" stroke="#ff385c" stroke-width="6.5" stroke-linecap="round" />
            <line x1="5" y1="-8" x2="5" y2="-120" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
          </g>
        </svg>
      `;
    }

    container.innerHTML = `<div class="combatant-figure enemy-figure">${svgContent}</div>`;
  }

  updateHpBars() {
    const pPercent = Math.max(0, Math.min(100, (this.playerHp / this.playerMaxHp) * 100));
    const ePercent = Math.max(0, Math.min(100, (this.enemyHp / this.enemyMaxHp) * 100));

    this.elPlayerHpBar.style.width = `${pPercent}%`;
    this.elPlayerHpText.textContent = `${this.playerHp} / ${this.playerMaxHp} ŻYĆ`;

    this.elEnemyHpBar.style.width = `${ePercent}%`;
    this.elEnemyHpText.textContent = `${this.enemyHp} / ${this.enemyMaxHp} ŻYĆ`;

    // Render Hearts/Lives icons
    if (this.elPlayerHearts) {
      let pHearts = '';
      for (let i = 0; i < this.playerMaxHp; i++) {
        pHearts += i < this.playerHp ? '<span class="heart-icon active">💙</span>' : '<span class="heart-icon lost">🖤</span>';
      }
      this.elPlayerHearts.innerHTML = pHearts;
    }

    if (this.elEnemyHearts) {
      let eHearts = '';
      for (let i = 0; i < this.enemyMaxHp; i++) {
        eHearts += i < this.enemyHp ? '<span class="heart-icon enemy-heart active">❤️</span>' : '<span class="heart-icon lost">🖤</span>';
      }
      this.elEnemyHearts.innerHTML = eHearts;
    }
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

  newQuestion() {
    this.isAnsweringLocked = false;
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
  }

  // --- NUMPAD HANDLERS ---

  handleNumpadDigit(digit) {
    if (this.isAnsweringLocked) return;
    if (this.inputBuffer.length < 3) {
      this.inputBuffer += digit;
      this.updateNumpadDisplay();
    }
  }

  handleNumpadBackspace() {
    if (this.isAnsweringLocked) return;
    this.inputBuffer = this.inputBuffer.slice(0, -1);
    this.updateNumpadDisplay();
  }

  handleNumpadSubmit() {
    if (this.isAnsweringLocked || this.inputBuffer.trim() === '') return;
    const answer = parseInt(this.inputBuffer, 10);
    this.handleAnswer(answer, null);
  }

  updateNumpadDisplay() {
    this.elNumpadInput.textContent = this.inputBuffer === '' ? '?' : this.inputBuffer;
  }

  // --- ANSWER PROCESSING (TURN-BASED) ---

  handleAnswer(selectedVal, clickedBtn) {
    if (this.isAnsweringLocked) return;
    this.isAnsweringLocked = true;

    this.totalQuestions++;
    const isCorrect = selectedVal === this.currentQuestion.answer;

    if (isCorrect) {
      this.correctAnswers++;
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      const comboBonus = this.combo * 20;
      const points = 100 + comboBonus;
      this.score += points;
      this.updateScoreDisplay();

      if (clickedBtn) {
        clickedBtn.classList.add('choice-correct');
      }

      // PLAYER SHOOTS ENEMY! Enemy loses 1 life!
      this.processPlayerHit(points);
    } else {
      this.combo = 0;
      this.updateScoreDisplay();

      if (clickedBtn) {
        clickedBtn.classList.add('choice-wrong');
      }
      this.highlightAnswerError();

      // ENEMY SHOOTS PLAYER! Player loses 1 life!
      this.processEnemyHit();
    }
  }

  highlightAnswerError() {
    this.elQuestionText.innerHTML = `${this.currentQuestion.text} = <span style="color:#25f252; font-weight:bold">${this.currentQuestion.answer}</span>`;
    const correctBtn = document.querySelector(`.choice-btn[data-val="${this.currentQuestion.answer}"]`);
    if (correctBtn) {
      correctBtn.classList.add('choice-highlight');
    }
  }

  processPlayerHit(points) {
    const level = GAME_DATA.levels[this.currentLevelIndex];
    // Enemy loses 1 life
    this.enemyHp = Math.max(0, this.enemyHp - 1);
    this.updateHpBars();

    if (level.style === 'blaster' || level.style === 'ship') {
      this.audio.playBlasterFire();
      if (this.vfx) {
        const laserColor = level.style === 'ship' ? '#ff3344' : this.selectedCrystal.color;
        this.vfx.fireLaser(true, laserColor, (hitX, hitY) => {
          this.vfx.spawnSparks(hitX, hitY, '#ffe81f', 32);
          this.audio.playDamageHit();
        });
        const hitMsg = level.style === 'ship' ? `SALWA X-WINGA! -1 ŻYCIE (+${points})` : `CELNY STRZAŁ! -1 ŻYCIE (+${points})`;
        this.vfx.addFloatingText(hitMsg, this.vfx.width * 0.65, 170, '#ffe81f');
      }
    } else {
      this.audio.playSaberSwing();
      setTimeout(() => this.audio.playSaberClash(), 200);

      const playerBox = document.getElementById('player-avatar-box');
      if (playerBox) playerBox.classList.add('player-lunge');
      setTimeout(() => { if (playerBox) playerBox.classList.remove('player-lunge'); }, 600);

      if (this.vfx) {
        this.vfx.triggerClash(0.68, 0.45, this.selectedCrystal.color);
        this.vfx.addFloatingText(`CIĘCIE MIECZEM! -1 ŻYCIE (+${points})`, this.vfx.width * 0.65, 170, this.selectedCrystal.color);
      }
    }

    const enemyBox = document.getElementById('enemy-avatar-box');
    if (enemyBox) enemyBox.classList.add('enemy-hit');
    setTimeout(() => { if (enemyBox) enemyBox.classList.remove('enemy-hit'); }, 500);

    if (this.enemyHp <= 0) {
      setTimeout(() => this.triggerVictory(), 1300);
      return;
    }

    setTimeout(() => {
      this.newQuestion();
    }, 1300);
  }

  vibrateDamage() {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        // Wibracja przy błędnej odpowiedzi i strzale wroga (np. na Androidzie)
        // Wzorzec: 100ms wibracji, 60ms przerwy, 200ms wibracji
        navigator.vibrate([100, 60, 200]);
      }
    } catch (e) {
      // Bezpieczne wyciszenie błędów przy braku uprawnień lub blokadach systemowych
    }
  }

  processEnemyHit() {
    const level = GAME_DATA.levels[this.currentLevelIndex];
    // Player loses 1 life
    this.playerHp = Math.max(0, this.playerHp - 1);
    this.updateHpBars();

    // Wibracje na urządzeniu mobilnym (Android PWA) przy trafieniu przez przeciwnika
    this.vibrateDamage();

    if (level.style === 'blaster' || level.style === 'ship') {
      this.audio.playBlasterFire();
      if (this.vfx) {
        const enemyLaser = level.style === 'ship' ? '#25f252' : '#ff2a4b';
        this.vfx.fireLaser(false, enemyLaser, (hitX, hitY) => {
          this.vfx.spawnSparks(hitX, hitY, enemyLaser, 32);
          this.audio.playDamageHit();
        });
        this.vfx.screenShake(16, 400);
        const errText = level.style === 'ship' ? 'BŁĄD! OSTRZAŁ TIE FIGHTERA! -1 ŻYCIE' : 'BŁĄD! STRZAŁ WROGA! -1 ŻYCIE';
        this.vfx.addFloatingText(errText, this.vfx.width * 0.35, 170, '#ff2a4b');
      }
    } else {
      this.audio.playSaberSwing();
      const enemyBox = document.getElementById('enemy-avatar-box');
      if (enemyBox) enemyBox.classList.add('enemy-lunge');
      setTimeout(() => { if (enemyBox) enemyBox.classList.remove('enemy-lunge'); }, 600);

      setTimeout(() => {
        this.audio.playDamageHit();
        if (this.vfx) {
          this.vfx.triggerClash(0.35, 0.45, '#ff2a4b');
          this.vfx.screenShake(16, 400);
          this.vfx.addFloatingText('BŁĄD! TRAFIENIE! -1 ŻYCIE', this.vfx.width * 0.35, 170, '#ff2a4b');
        }
      }, 200);
    }

    if (this.playerHp <= 0) {
      setTimeout(() => this.triggerDefeat(), 1400);
      return;
    }

    setTimeout(() => {
      this.newQuestion();
    }, 1500);
  }

  // --- END OF BATTLE ---

  triggerVictory() {
    this.audio.playLevelWin();
    const level = GAME_DATA.levels[this.currentLevelIndex];

    const currentUnlocked = parseInt(localStorage.getItem('jedi_unlocked_level') || '1', 10);
    if (this.currentLevelIndex + 2 > currentUnlocked) {
      localStorage.setItem('jedi_unlocked_level', (this.currentLevelIndex + 2).toString());
    }

    const acc = this.totalQuestions > 0 ? Math.round((this.correctAnswers / this.totalQuestions) * 100) : 100;
    let stars = 1;
    if (this.playerHp >= 3) stars = 2;
    if (this.playerHp === 5) stars = 3;

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
    document.getElementById('defeat-tip').textContent = `Straciłeś wszystkie 5 żyć! Nie spiesz się – nie ma limitu czasu. Zastanów się spokojnie nad każdym działaniem.`;

    this.modalDefeat.classList.remove('hidden');
  }
}

// Instantiate game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.jediGame = new JediMathGame();
});
