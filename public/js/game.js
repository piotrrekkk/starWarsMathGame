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
    this.elStyleBadge.textContent = level.style === 'blaster' ? '🔫 OSTRZAŁ BLASTEROWY' : '⚔️ POJEDYNEK NA MIECZE';
    this.elEnemyName.textContent = level.enemyName;
    this.elEnemySub.textContent = level.enemySub;
    this.elPhaseTitle.textContent = '⚡ ROZWIĄŻ DZIAŁANIE I ODDAJ STRZAŁ!';
    this.elPhaseTitle.className = 'phase-attack';

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

  renderPlayerAvatar(level) {
    const container = document.getElementById('player-avatar-box');
    const saberColor = this.selectedCrystal.color;
    const isSaber = level.style === 'saber';

    container.innerHTML = `
      <div class="combatant-figure player-figure ${isSaber ? 'stance-saber' : 'stance-blaster'}">
        <svg viewBox="0 0 160 220" class="hero-svg">
          <path d="M 50,110 Q 80,95 110,110 L 125,210 L 35,210 Z" fill="#3d2c1e" />
          <path d="M 60,110 L 80,180 L 100,110" stroke="#7d583b" stroke-width="4" fill="none" />
          <polygon points="65,110 80,145 95,110" fill="#ccab80" />
          <rect x="48" y="145" width="64" height="12" rx="3" fill="#20150d" />
          <rect x="74" y="143" width="12" height="16" rx="2" fill="#d4af37" />
          
          <ellipse cx="80" cy="72" rx="22" ry="26" fill="#f7c8a0" />
          <path d="M 55,68 Q 80,40 105,68 Q 98,52 80,50 Q 62,52 55,68 Z" fill="#4a2e18" />
          <circle cx="73" cy="72" r="2.5" fill="#1b120c" />
          <circle cx="87" cy="72" r="2.5" fill="#1b120c" />

          ${isSaber ? `
            <rect x="106" y="95" width="8" height="26" rx="2" fill="#888899" stroke="#333" stroke-width="1" />
            <line x1="110" y1="95" x2="135" y2="15" stroke="${saberColor}" stroke-width="6" stroke-linecap="round" class="lightsaber-blade" style="filter: drop-shadow(0 0 10px ${saberColor}) drop-shadow(0 0 20px ${saberColor});" />
            <line x1="110" y1="95" x2="135" y2="15" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
          ` : `
            <path d="M 104,115 L 130,115 L 130,122 L 122,122 L 120,135 L 112,135 L 114,122 Z" fill="#2a2e3d" stroke="#5b647d" stroke-width="1.5" />
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
      svgContent = `
        <svg viewBox="0 0 180 200" class="enemy-svg anim-hover">
          <circle cx="90" cy="100" r="42" fill="#5c6370" stroke="#282c34" stroke-width="3" />
          <circle cx="90" cy="100" r="34" fill="#3e4451" />
          <line x1="48" y1="100" x2="132" y2="100" stroke="#21252b" stroke-width="2" />
          <line x1="90" y1="58" x2="90" y2="142" stroke="#21252b" stroke-width="2" />
          <circle cx="75" cy="85" r="6" fill="#ff2a4b" style="filter: drop-shadow(0 0 8px #ff2a4b);" />
          <circle cx="105" cy="85" r="5" fill="#4deeea" />
          <circle cx="90" cy="115" r="9" fill="#00e5ff" style="filter: drop-shadow(0 0 10px #00e5ff);" />
          <circle cx="90" cy="115" r="4" fill="#ffffff" />
          <rect x="25" y="98" width="24" height="4" fill="#abb2bf" />
          <rect x="131" y="98" width="24" height="4" fill="#abb2bf" />
        </svg>
      `;
    } else if (level.enemySvg === 'droid-b1') {
      svgContent = `
        <svg viewBox="0 0 180 220" class="enemy-svg">
          <path d="M 80,45 Q 90,30 105,45 L 115,75 Q 95,85 85,80 Z" fill="#d6af79" stroke="#7d603a" stroke-width="2" />
          <circle cx="100" cy="55" r="3.5" fill="#1b120c" />
          <rect x="86" y="80" width="8" height="25" fill="#9e8055" />
          <path d="M 70,105 L 110,105 L 105,160 L 75,160 Z" fill="#d6af79" stroke="#7d603a" stroke-width="2" />
          <path d="M 70,110 L 50,140 L 80,145" stroke="#9e8055" stroke-width="5" fill="none" />
          <rect x="40" y="138" width="60" height="9" fill="#222" rx="2" />
          <rect x="30" y="140" width="15" height="5" fill="#ff4444" style="filter: drop-shadow(0 0 6px #ff4444);" />
        </svg>
      `;
    } else if (level.enemySvg === 'snowtrooper') {
      svgContent = `
        <svg viewBox="0 0 180 220" class="enemy-svg">
          <path d="M 68,55 Q 90,35 112,55 L 118,95 L 62,95 Z" fill="#f0f3f6" stroke="#9aa5b1" stroke-width="2" />
          <rect x="73" y="65" width="34" height="7" rx="2" fill="#10151a" />
          <path d="M 58,98 L 122,98 L 115,170 L 65,170 Z" fill="#e2e8f0" stroke="#718096" stroke-width="2" />
          <rect x="80" y="112" width="20" height="28" fill="#4a5568" rx="3" />
          <rect x="35" y="125" width="65" height="12" fill="#1a202c" rx="2" />
          <circle cx="32" cy="131" r="5" fill="#ff3366" style="filter: drop-shadow(0 0 8px #ff3366);" />
        </svg>
      `;
    } else if (level.enemySvg === 'inquisitor') {
      svgContent = `
        <svg viewBox="0 0 180 220" class="enemy-svg">
          <path d="M 70,50 Q 90,32 110,50 L 116,90 L 64,90 Z" fill="#1a1c23" stroke="#ff2a4b" stroke-width="1.5" />
          <line x1="72" y1="68" x2="108" y2="68" stroke="#ff0055" stroke-width="3.5" style="filter: drop-shadow(0 0 8px #ff0055);" />
          <path d="M 52,92 L 128,92 L 118,180 L 62,180 Z" fill="#12131a" stroke="#333" stroke-width="2" />
          <circle cx="90" cy="120" r="12" fill="#2d3748" stroke="#ff0055" stroke-width="1.5" />
          <circle cx="50" cy="130" r="14" fill="none" stroke="#666" stroke-width="3" />
          <line x1="50" y1="35" x2="50" y2="215" stroke="#ff1744" stroke-width="6" stroke-linecap="round" style="filter: drop-shadow(0 0 10px #ff1744) drop-shadow(0 0 20px #ff0055);" />
          <line x1="50" y1="35" x2="50" y2="215" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
        </svg>
      `;
    } else {
      svgContent = `
        <svg viewBox="0 0 180 220" class="enemy-svg">
          <path d="M 60,60 Q 90,24 120,60 L 128,95 L 52,95 Z" fill="#0f1115" stroke="#3b4252" stroke-width="2" />
          <path d="M 50,85 Q 90,75 130,85" stroke="#2e3440" stroke-width="4" fill="none" />
          <polygon points="80,88 100,88 90,102" fill="#2e3440" stroke="#4c566a" stroke-width="1.5" />
          <path d="M 50,105 L 130,105 L 125,190 L 55,190 Z" fill="#0a0c10" stroke="#2e3440" stroke-width="2" />
          <rect x="74" y="125" width="32" height="26" fill="#1b1e2b" stroke="#4c566a" stroke-width="1.5" rx="2" />
          <rect x="78" y="130" width="8" height="6" fill="#ff2a4b" />
          <rect x="90" y="130" width="8" height="6" fill="#00d0ff" />
          <rect x="78" y="140" width="20" height="4" fill="#ffffff" />
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

    if (level.style === 'blaster') {
      this.audio.playBlasterFire();
      if (this.vfx) {
        this.vfx.fireLaser(true, this.selectedCrystal.color, (hitX, hitY) => {
          this.vfx.spawnSparks(hitX, hitY, '#ffe81f', 30);
          this.audio.playDamageHit();
        });
        this.vfx.addFloatingText(`CELNY STRZAŁ! -1 ŻYCIE (+${points})`, this.vfx.width * 0.65, 170, '#ffe81f');
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

  processEnemyHit() {
    const level = GAME_DATA.levels[this.currentLevelIndex];
    // Player loses 1 life
    this.playerHp = Math.max(0, this.playerHp - 1);
    this.updateHpBars();

    if (level.style === 'blaster') {
      this.audio.playBlasterFire();
      if (this.vfx) {
        this.vfx.fireLaser(false, '#ff2a4b', (hitX, hitY) => {
          this.vfx.spawnSparks(hitX, hitY, '#ff2a4b', 30);
          this.audio.playDamageHit();
        });
        this.vfx.screenShake(16, 400);
        this.vfx.addFloatingText('BŁĄD! STRZAŁ WROGA! -1 ŻYCIE', this.vfx.width * 0.35, 170, '#ff2a4b');
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
