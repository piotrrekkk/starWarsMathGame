// Jedi Adventure: Interactive Star Wars Maze Saga (Episodes I - VI)
// Supports GameSir G8 Plus & all Gamepad API controllers, PC Keyboard, and On-Screen Translucent Touch Controls.

class JediMazeGame {
  constructor(mathEngine, audio) {
    this.mathEngine = mathEngine || new MathEngine();
    this.audio = audio || window.soundFX;

    this.currentEpisodeIndex = 0;
    this.episodes = window.MAZE_EPISODES || [];
    this.currentEpisode = this.episodes[0];

    // Canvas & Rendering
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    this.tileSize = 48; // Base tile size in pixels
    this.camera = { x: 0, y: 0 };

    // Player state
    this.player = {
      x: 1.5,
      y: 1.5,
      radius: 0.38, // in tiles
      speed: 3.8,   // tiles per second
      angle: 0,     // facing angle in radians
      vx: 0,
      vy: 0,
      hp: 5,
      maxHp: 5,
      isAttacking: false,
      attackTimer: 0,
      attackDuration: 0.22, // seconds
      invulnerableTimer: 0,
      score: 0,
      crystalsCollected: 0,
      gatesUnlocked: 0,
      totalGates: 0
    };

    this.selectedCrystal = {
      id: 'blue',
      name: 'Błękitny Kyber',
      color: '#00d0ff',
      glow: 'rgba(0, 208, 255, 0.8)'
    };

    // Level dynamic entities
    this.walls = [];
    this.gates = [];
    this.pickups = [];
    this.terminals = [];
    this.lasers = [];
    this.enemies = [];
    this.exitPortal = null;
    this.particles = [];

    // Timing & animation
    this.lastTime = 0;
    this.animFrameId = null;
    this.isRunning = false;
    this.isPaused = false;
    this.activePuzzle = null;

    // Input States
    this.keys = {};
    this.touchJoystick = {
      active: false,
      startX: 0,
      startY: 0,
      currX: 0,
      currY: 0,
      dx: 0,
      dy: 0,
      maxRadius: 45
    };
    this.gamepadConnected = false;
    this.gamepadName = 'Brak';
    this.prevGamepadButtons = [];

    this.initDOM();
  }

  initDOM() {
    this.screenMaze = document.getElementById('screen-maze');
    this.canvas = document.getElementById('maze-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }

    // HUD Elements
    this.hudEpisode = document.getElementById('maze-hud-episode');
    this.hudMission = document.getElementById('maze-hud-mission');
    this.hudHearts = document.getElementById('maze-hud-hearts');
    this.hudScore = document.getElementById('maze-hud-score');
    this.hudCrystals = document.getElementById('maze-hud-crystals');
    this.hudGamepad = document.getElementById('maze-hud-gamepad');
    this.hudPrompt = document.getElementById('maze-interaction-prompt');

    // Controls Buttons
    this.btnBackToSaga = document.getElementById('btn-maze-back');
    this.btnAttackTouch = document.getElementById('touch-btn-attack');
    this.btnActionTouch = document.getElementById('touch-btn-action');
    this.touchControlsOverlay = document.getElementById('maze-touch-controls');
    this.touchJoystickElem = document.getElementById('touch-joystick-zone');
    this.touchJoystickKnob = document.getElementById('touch-joystick-knob');

    // Puzzle Hologram Modal
    this.puzzleModal = document.getElementById('maze-puzzle-modal');
    this.puzzleLore = document.getElementById('maze-puzzle-lore');
    this.puzzleQuestion = document.getElementById('maze-puzzle-question');
    this.puzzleChoicesContainer = document.getElementById('maze-puzzle-choices');
    this.puzzleFeedback = document.getElementById('maze-puzzle-feedback');

    // Episode Completed & Game Over Modals
    this.modalVictory = document.getElementById('maze-modal-victory');
    this.btnNextEpisode = document.getElementById('btn-maze-next-episode');
    this.btnReplayEpisode = document.getElementById('btn-maze-replay');
    this.modalGameOver = document.getElementById('maze-modal-gameover');
    this.btnRetryMaze = document.getElementById('btn-maze-retry');

    this.bindEvents();
  }

  bindEvents() {
    // Window resize & orientation change
    window.addEventListener('resize', () => this.resizeCanvas());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resizeCanvas(), 150));

    // Keyboard events
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    // Gamepad connection events
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadConnected = true;
      this.gamepadName = e.gamepad.id || 'GameSir / Gamepad';
      this.updateGamepadHUD(true);
    });

    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadConnected = false;
      this.gamepadName = 'Brak';
      this.updateGamepadHUD(false);
    });

    // Touch controls for mobile / tablet
    if (this.touchJoystickElem) {
      this.touchJoystickElem.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
      this.touchJoystickElem.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
      this.touchJoystickElem.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
      this.touchJoystickElem.addEventListener('touchcancel', (e) => this.onTouchEnd(e), { passive: false });
    }

    if (this.btnAttackTouch) {
      this.btnAttackTouch.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.performAttack();
      }, { passive: false });
      this.btnAttackTouch.addEventListener('click', () => this.performAttack());
    }

    if (this.btnActionTouch) {
      this.btnActionTouch.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.performAction();
      }, { passive: false });
      this.btnActionTouch.addEventListener('click', () => this.performAction());
    }

    if (this.btnBackToSaga) {
      this.btnBackToSaga.addEventListener('click', () => {
        this.stop();
        if (window.jediGame) {
          window.jediGame.showScreen('level-select');
        } else if (window.gameInstance) {
          window.gameInstance.showScreen('level-select');
        }
      });
    }

    if (this.btnNextEpisode) {
      this.btnNextEpisode.addEventListener('click', () => {
        this.modalVictory.classList.add('hidden');
        const nextIdx = (this.currentEpisodeIndex + 1) % this.episodes.length;
        this.loadEpisode(nextIdx);
        this.start();
      });
    }

    if (this.btnReplayEpisode) {
      this.btnReplayEpisode.addEventListener('click', () => {
        this.modalVictory.classList.add('hidden');
        this.loadEpisode(this.currentEpisodeIndex);
        this.start();
      });
    }

    if (this.btnRetryMaze) {
      this.modalGameOver.classList.add('hidden');
      this.loadEpisode(this.currentEpisodeIndex);
      this.start();
    }
  }

  playSound(name) {
    if (!this.audio) return;
    if (typeof this.audio[name] === 'function') {
      try {
        this.audio[name]();
      } catch (err) {
        console.warn('Audio play error:', err);
      }
    }
  }

  setKyberCrystal(crystal) {
    if (crystal) {
      this.selectedCrystal = crystal;
    }
  }

  resizeCanvas() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = this.canvas.width = rect.width;
    this.height = this.canvas.height = rect.height;
    
    // Scale tile size appropriately for screen
    if (this.height <= 460) {
      // Mobile Landscape (Pixel 9 Pro, Pixel 7a, etc.)
      this.tileSize = Math.max(34, Math.min(Math.floor(this.height / 7.2), 44));
    } else if (this.width < 600) {
      this.tileSize = 42;
    } else if (this.width < 1000) {
      this.tileSize = 52;
    } else {
      this.tileSize = 60;
    }
  }

  updateGamepadHUD(connected) {
    if (!this.hudGamepad) return;
    if (connected) {
      let displayName = 'GameSir G8+ / Pad';
      if (this.gamepadName.toLowerCase().includes('gamesir')) displayName = 'GameSir G8 Plus';
      else if (this.gamepadName.toLowerCase().includes('xbox')) displayName = 'Xbox Pad';
      else if (this.gamepadName.toLowerCase().includes('dualsense') || this.gamepadName.toLowerCase().includes('wireless controller')) displayName = 'PlayStation Pad';

      this.hudGamepad.innerHTML = `🎮 <span class="pad-status on"></span> ${displayName}`;
      this.hudGamepad.classList.add('connected');
    } else {
      this.hudGamepad.innerHTML = `🎮 <span class="pad-status off"></span> Klawiatura / Dotyk`;
      this.hudGamepad.classList.remove('connected');
    }
  }

  vibrate(duration = 100, strong = 0.5, weak = 0.5) {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of gamepads) {
      if (gp && gp.vibrationActuator && gp.vibrationActuator.playEffect) {
        gp.vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration: duration,
          strongMagnitude: strong,
          weakMagnitude: weak
        }).catch(() => {});
      }
    }
  }

  // --- INPUT HANDLING ---
  onKeyDown(e) {
    this.keys[e.key.toLowerCase()] = true;
    this.keys[e.code] = true;

    // Direct puzzle answering via keyboard (1, 2, 3, 4 or Q, W, E, R)
    if (this.activePuzzle) {
      if (e.key === '1' || e.key.toLowerCase() === 'a') this.submitPuzzleChoice(0);
      else if (e.key === '2' || e.key.toLowerCase() === 'b') this.submitPuzzleChoice(1);
      else if (e.key === '3' || e.key.toLowerCase() === 'x') this.submitPuzzleChoice(2);
      else if (e.key === '4' || e.key.toLowerCase() === 'y') this.submitPuzzleChoice(3);
      return;
    }

    if (e.code === 'Space' || e.key.toLowerCase() === 'f') {
      e.preventDefault();
      this.performAttack();
    } else if (e.key.toLowerCase() === 'e' || e.code === 'Enter') {
      e.preventDefault();
      this.performAction();
    }
  }

  onKeyUp(e) {
    this.keys[e.key.toLowerCase()] = false;
    this.keys[e.code] = false;
  }

  onTouchStart(e) {
    e.preventDefault();
    const touch = e.targetTouches[0];
    const rect = this.touchJoystickElem.getBoundingClientRect();
    this.touchJoystick.active = true;
    this.touchJoystick.startX = rect.left + rect.width / 2;
    this.touchJoystick.startY = rect.top + rect.height / 2;
    this.updateJoystickTouch(touch.clientX, touch.clientY);
  }

  onTouchMove(e) {
    e.preventDefault();
    if (!this.touchJoystick.active) return;
    const touch = e.targetTouches[0];
    this.updateJoystickTouch(touch.clientX, touch.clientY);
  }

  onTouchEnd(e) {
    e.preventDefault();
    this.touchJoystick.active = false;
    this.touchJoystick.dx = 0;
    this.touchJoystick.dy = 0;
    if (this.touchJoystickKnob) {
      this.touchJoystickKnob.style.transform = `translate(0px, 0px)`;
    }
  }

  updateJoystickTouch(clientX, clientY) {
    let diffX = clientX - this.touchJoystick.startX;
    let diffY = clientY - this.touchJoystick.startY;
    const dist = Math.hypot(diffX, diffY);
    const maxR = this.touchJoystick.maxRadius;

    if (dist > maxR) {
      diffX = (diffX / dist) * maxR;
      diffY = (diffY / dist) * maxR;
    }

    this.touchJoystick.dx = diffX / maxR;
    this.touchJoystick.dy = diffY / maxR;

    if (this.touchJoystickKnob) {
      this.touchJoystickKnob.style.transform = `translate(${diffX}px, ${diffY}px)`;
    }
  }

  pollGamepad() {
    if (!navigator.getGamepads) return { moveX: 0, moveY: 0, attack: false, action: false };

    const gamepads = navigator.getGamepads();
    let moveX = 0;
    let moveY = 0;
    let attack = false;
    let action = false;

    let gpActive = false;

    for (const gp of gamepads) {
      if (!gp || !gp.connected) continue;
      gpActive = true;

      // Analog stick with deadzone 0.18
      const deadzone = 0.18;
      const ax0 = gp.axes[0] || 0;
      const ax1 = gp.axes[1] || 0;

      if (Math.abs(ax0) > deadzone) moveX = ax0;
      if (Math.abs(ax1) > deadzone) moveY = ax1;

      // D-Pad buttons (standard mapping: 12 up, 13 down, 14 left, 15 right)
      if (gp.buttons[12] && gp.buttons[12].pressed) moveY = -1;
      if (gp.buttons[13] && gp.buttons[13].pressed) moveY = 1;
      if (gp.buttons[14] && gp.buttons[14].pressed) moveX = -1;
      if (gp.buttons[15] && gp.buttons[15].pressed) moveX = 1;

      // Action Buttons:
      // A (0), B (1), X (2), Y (3)
      const btnA = gp.buttons[0] && gp.buttons[0].pressed;
      const btnB = gp.buttons[1] && gp.buttons[1].pressed;
      const btnX = gp.buttons[2] && gp.buttons[2].pressed;
      const btnY = gp.buttons[3] && gp.buttons[3].pressed;
      const btnRB = gp.buttons[5] && gp.buttons[5].pressed;

      // When puzzle is open, GameSir face buttons map directly to choices!
      if (this.activePuzzle) {
        if (btnA && !this.prevGamepadButtons[0]) this.submitPuzzleChoice(0);
        else if (btnB && !this.prevGamepadButtons[1]) this.submitPuzzleChoice(1);
        else if (btnX && !this.prevGamepadButtons[2]) this.submitPuzzleChoice(2);
        else if (btnY && !this.prevGamepadButtons[3]) this.submitPuzzleChoice(3);
      } else {
        if ((btnA || btnRB) && !this.prevGamepadButtons[0]) {
          // If near a gate or terminal, A acts as interact, otherwise attack!
          const nearInteractable = this.checkNearbyInteractable();
          if (nearInteractable) {
            action = true;
          } else {
            attack = true;
          }
        }
        if (btnX && !this.prevGamepadButtons[2]) {
          attack = true;
        }
        if (btnY && !this.prevGamepadButtons[3]) {
          action = true;
        }
      }

      this.prevGamepadButtons = [btnA, btnB, btnX, btnY];
      break; // Primary gamepad processed
    }

    if (gpActive !== this.gamepadConnected) {
      this.gamepadConnected = gpActive;
      this.updateGamepadHUD(gpActive);
    }

    return { moveX, moveY, attack, action };
  }

  // --- ACTIONS ---
  performAttack() {
    if (this.player.isAttacking || this.isPaused || this.activePuzzle) return;
    this.player.isAttacking = true;
    this.player.attackTimer = this.player.attackDuration;
    this.playSound('playSaberSwing');
    this.vibrate(60, 0.4, 0.2);

    // Check hit against enemies within swing arc in front of player
    const swingRange = 1.35;
    const pX = this.player.x;
    const pY = this.player.y;
    const pAng = this.player.angle;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const en = this.enemies[i];
      if (!en.alive) continue;

      const dist = Math.hypot(en.x - pX, en.y - pY);
      if (dist <= swingRange) {
        const angleToEn = Math.atan2(en.y - pY, en.x - pX);
        let diff = Math.abs(angleToEn - pAng);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;

        if (diff < Math.PI * 0.55) {
          // Hit enemy!
          en.alive = false;
          this.playSound('playSaberClash');
          this.playSound('playExplosion');
          this.vibrate(180, 0.8, 0.6);
          this.spawnSparks(en.x, en.y, '#ff9d00', 25);
          this.player.score += 250;
          this.updateHUD();
        }
      }
    }
  }

  performAction() {
    if (this.isPaused || this.activePuzzle) return;
    const target = this.checkNearbyInteractable();
    if (target) {
      if (target.type === 'gate') {
        this.openMathPuzzle(target);
      } else if (target.type === 'terminal') {
        this.openTerminalPuzzle(target);
      }
    }
  }

  checkNearbyInteractable() {
    const pX = this.player.x;
    const pY = this.player.y;
    const interactDist = 1.25;

    // Check gates
    for (const gate of this.gates) {
      if (!gate.unlocked) {
        const dist = Math.hypot(gate.x + 0.5 - pX, gate.y + 0.5 - pY);
        if (dist <= interactDist) {
          return { type: 'gate', item: gate };
        }
      }
    }

    // Check terminals
    for (const term of this.terminals) {
      if (!term.hacked) {
        const dist = Math.hypot(term.x + 0.5 - pX, term.y + 0.5 - pY);
        if (dist <= interactDist) {
          return { type: 'terminal', item: term };
        }
      }
    }

    return null;
  }

  // --- PUZZLE INTERFACE ---
  openMathPuzzle(target) {
    this.isPaused = true;
    this.activePuzzle = {
      target,
      question: this.mathEngine.generateQuestion(4)
    };

    const q = this.activePuzzle.question;
    this.puzzleLore.textContent = `🔒 ŚLUZA BEZPIECZEŃSTWA - POZIOM ZABEZPIECZENIA MOCY`;
    this.puzzleQuestion.innerHTML = `Wprowadź kod dekodujący:<br><span class="puzzle-math-formula">${q.text} = ?</span>`;
    this.puzzleFeedback.innerHTML = `Wybierz odpowiedź przyciskiem na padzie, klawiaturą lub dotykiem:`;

    // Render 4 GameSir-styled choice buttons
    const btnBadges = [
      { key: 'A', num: '1', color: '#25f252', bg: 'rgba(37, 242, 82, 0.2)' },
      { key: 'B', num: '2', color: '#ff2a4b', bg: 'rgba(255, 42, 75, 0.2)' },
      { key: 'X', num: '3', color: '#00d0ff', bg: 'rgba(0, 208, 255, 0.2)' },
      { key: 'Y', num: '4', color: '#ffea29', bg: 'rgba(255, 234, 41, 0.2)' }
    ];

    this.puzzleChoicesContainer.innerHTML = '';
    q.options.forEach((opt, idx) => {
      const b = btnBadges[idx];
      const btn = document.createElement('button');
      btn.className = 'btn-puzzle-choice';
      btn.style.borderColor = b.color;
      btn.innerHTML = `
        <span class="choice-badge" style="background:${b.bg}; color:${b.color}; border: 1px solid ${b.color}">[${b.key}]</span>
        <span class="choice-value">${opt}</span>
      `;
      btn.addEventListener('click', () => this.submitPuzzleChoice(idx));
      this.puzzleChoicesContainer.appendChild(btn);
    });

    this.puzzleModal.classList.remove('hidden');
    this.playSound('playForceHum');
  }

  openTerminalPuzzle(target) {
    this.isPaused = true;
    this.activePuzzle = {
      target,
      question: this.mathEngine.generateQuestion(4)
    };

    const q = this.activePuzzle.question;
    this.puzzleLore.textContent = `💻 TERMINAL SYSTEMOWY DROIDÓW`;
    this.puzzleQuestion.innerHTML = `Zhakuj procedurę awaryjną:<br><span class="puzzle-math-formula">${q.text} = ?</span>`;
    this.puzzleFeedback.innerHTML = `Poprawne rozwiązanie zregeneruje 1 życie i da bonus punktowy!`;

    const btnBadges = [
      { key: 'A', num: '1', color: '#25f252', bg: 'rgba(37, 242, 82, 0.2)' },
      { key: 'B', num: '2', color: '#ff2a4b', bg: 'rgba(255, 42, 75, 0.2)' },
      { key: 'X', num: '3', color: '#00d0ff', bg: 'rgba(0, 208, 255, 0.2)' },
      { key: 'Y', num: '4', color: '#ffea29', bg: 'rgba(255, 234, 41, 0.2)' }
    ];

    this.puzzleChoicesContainer.innerHTML = '';
    q.options.forEach((opt, idx) => {
      const b = btnBadges[idx];
      const btn = document.createElement('button');
      btn.className = 'btn-puzzle-choice';
      btn.style.borderColor = b.color;
      btn.innerHTML = `
        <span class="choice-badge" style="background:${b.bg}; color:${b.color}; border: 1px solid ${b.color}">[${b.key}]</span>
        <span class="choice-value">${opt}</span>
      `;
      btn.addEventListener('click', () => this.submitPuzzleChoice(idx));
      this.puzzleChoicesContainer.appendChild(btn);
    });

    this.puzzleModal.classList.remove('hidden');
  }

  submitPuzzleChoice(choiceIndex) {
    if (!this.activePuzzle) return;
    const q = this.activePuzzle.question;
    const chosenVal = q.options[choiceIndex];

    if (chosenVal === q.answer) {
      // SUCCESS!
      this.playSound('playCorrect');
      this.vibrate(200, 0.4, 0.8);
      this.puzzleFeedback.innerHTML = `<span class="feedback-success">✅ DOSKONALE! Kod zaakceptowany!</span>`;

      if (this.activePuzzle.target.type === 'gate') {
        const gate = this.activePuzzle.target.item;
        gate.unlocked = true;
        this.player.gatesUnlocked++;
        this.player.score += 500;
        this.spawnSparks(gate.x + 0.5, gate.y + 0.5, '#00d0ff', 40);
      } else if (this.activePuzzle.target.type === 'terminal') {
        const term = this.activePuzzle.target.item;
        term.hacked = true;
        this.player.score += 350;
        if (this.player.hp < this.player.maxHp) this.player.hp++;
        this.spawnSparks(term.x + 0.5, term.y + 0.5, '#25f252', 30);
      }

      this.updateHUD();

      setTimeout(() => {
        this.puzzleModal.classList.add('hidden');
        this.activePuzzle = null;
        this.isPaused = false;
      }, 700);

    } else {
      // WRONG ANSWER
      this.playSound('playWrong');
      this.vibrate(300, 0.9, 0.7);
      this.player.hp--;
      this.updateHUD();

      this.puzzleFeedback.innerHTML = `<span class="feedback-error">❌ BŁĘDNY KOD! Bezpiecznik razi prądem (-1 ❤️). Spróbuj ponownie!</span>`;

      if (this.player.hp <= 0) {
        setTimeout(() => {
          this.puzzleModal.classList.add('hidden');
          this.activePuzzle = null;
          this.gameOver();
        }, 1200);
      }
    }
  }

  // --- LEVEL MANAGEMENT ---
  loadEpisode(episodeIndex) {
    this.currentEpisodeIndex = episodeIndex;
    this.currentEpisode = this.episodes[episodeIndex];

    const ep = this.currentEpisode;
    this.walls = [];
    this.gates = [];
    this.pickups = [];
    this.terminals = [];
    this.lasers = [];
    this.enemies = [];
    this.particles = [];

    // Parse layout
    const layout = ep.layout;
    for (let r = 0; r < layout.length; r++) {
      for (let c = 0; c < layout[r].length; c++) {
        const cell = layout[r][c];
        if (cell === 1) {
          this.walls.push({ x: c, y: r });
        } else if (cell === 2) {
          this.gates.push({ x: c, y: r, unlocked: false });
        } else if (cell === 3) {
          this.pickups.push({ x: c, y: r, collected: false, type: 'crystal' });
        } else if (cell === 4) {
          this.terminals.push({ x: c, y: r, hacked: false });
        } else if (cell === 5) {
          this.lasers.push({
            x: c,
            y: r,
            active: true,
            timer: Math.random() * 2.8,
            period: 2.8,
            onDuration: 1.4
          });
        } else if (cell === 6) {
          this.enemies.push({
            x: c + 0.5,
            y: r + 0.5,
            originX: c + 0.5,
            originY: r + 0.5,
            radius: 0.35,
            patrolAxis: (r % 2 === 0) ? 'x' : 'y',
            patrolDist: 2.2,
            dir: 1,
            speed: 1.3,
            alive: true
          });
        } else if (cell === 9) {
          this.exitPortal = { x: c, y: r };
        }
      }
    }

    // Set player position
    this.player.x = ep.playerStart.x + 0.5;
    this.player.y = ep.playerStart.y + 0.5;
    this.player.hp = this.player.maxHp;
    this.player.angle = 0;
    this.player.isAttacking = false;
    this.player.attackTimer = 0;
    this.player.invulnerableTimer = 0;
    this.player.gatesUnlocked = 0;
    this.player.totalGates = this.gates.length;

    this.updateHUD();
    this.resizeCanvas();
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.resizeCanvas();

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.loop = this.loop.bind(this);
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  // --- GAME LOOP ---
  loop(currentTime) {
    if (!this.isRunning) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (!this.isPaused) {
      this.update(dt);
    }
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  }

  // --- UPDATE ---
  update(dt) {
    // 1. Gather Input (Gamepad > Touch Joystick > Keyboard)
    const gp = this.pollGamepad();
    let moveX = gp.moveX;
    let moveY = gp.moveY;

    if (gp.attack) this.performAttack();
    if (gp.action) this.performAction();

    // Touch Joystick input
    if (this.touchJoystick.active) {
      moveX = this.touchJoystick.dx;
      moveY = this.touchJoystick.dy;
    }

    // Keyboard Input
    if (this.keys['arrowleft'] || this.keys['keya'] || this.keys['a']) moveX -= 1;
    if (this.keys['arrowright'] || this.keys['keyd'] || this.keys['d']) moveX += 1;
    if (this.keys['arrowup'] || this.keys['keyw'] || this.keys['w']) moveY -= 1;
    if (this.keys['arrowdown'] || this.keys['keys'] || this.keys['s']) moveY += 1;

    // Normalize movement vector
    const mag = Math.hypot(moveX, moveY);
    if (mag > 0.05) {
      const norm = Math.min(mag, 1);
      const dirX = (moveX / mag) * norm;
      const dirY = (moveY / mag) * norm;

      this.player.angle = Math.atan2(dirY, dirX);

      // Move with collision resolution
      const targetSpeed = this.player.speed * norm;
      this.movePlayerWithCollision(dirX * targetSpeed * dt, dirY * targetSpeed * dt);
    }

    // Attack cooldown
    if (this.player.isAttacking) {
      this.player.attackTimer -= dt;
      if (this.player.attackTimer <= 0) {
        this.player.isAttacking = false;
      }
    }

    // Invulnerability timer
    if (this.player.invulnerableTimer > 0) {
      this.player.invulnerableTimer -= dt;
    }

    // Update enemies
    for (const en of this.enemies) {
      if (!en.alive) continue;

      if (en.patrolAxis === 'x') {
        en.x += en.dir * en.speed * dt;
        if (Math.abs(en.x - en.originX) > en.patrolDist) {
          en.dir *= -1;
        }
      } else {
        en.y += en.dir * en.speed * dt;
        if (Math.abs(en.y - en.originY) > en.patrolDist) {
          en.dir *= -1;
        }
      }

      // Check collision with player
      if (this.player.invulnerableTimer <= 0) {
        const dist = Math.hypot(en.x - this.player.x, en.y - this.player.y);
        if (dist < (en.radius + this.player.radius)) {
          this.hitPlayer(1, 'droid');
        }
      }
    }

    // Update timed lasers
    for (const laser of this.lasers) {
      laser.timer = (laser.timer + dt) % laser.period;
      laser.active = laser.timer < laser.onDuration;

      if (laser.active && this.player.invulnerableTimer <= 0) {
        // Laser occupies tile center
        const lx = laser.x + 0.5;
        const ly = laser.y + 0.5;
        const dist = Math.hypot(lx - this.player.x, ly - this.player.y);
        if (dist < 0.6) {
          this.hitPlayer(1, 'laser');
        }
      }
    }

    // Check pickups
    for (const pick of this.pickups) {
      if (!pick.collected) {
        const dist = Math.hypot(pick.x + 0.5 - this.player.x, pick.y + 0.5 - this.player.y);
        if (dist < 0.65) {
          pick.collected = true;
          this.player.crystalsCollected++;
          this.player.score += 150;
          if (this.player.hp < this.player.maxHp) this.player.hp++;
          this.playSound('playSaberIgnite');
          this.spawnSparks(pick.x + 0.5, pick.y + 0.5, this.selectedCrystal.color, 25);
          this.updateHUD();
        }
      }
    }

    // Check exit portal
    if (this.exitPortal) {
      const dist = Math.hypot(this.exitPortal.x + 0.5 - this.player.x, this.exitPortal.y + 0.5 - this.player.y);
      if (dist < 0.75) {
        if (this.player.gatesUnlocked >= this.player.totalGates) {
          this.completeEpisode();
        }
      }
    }

    // Update interaction prompt
    const target = this.checkNearbyInteractable();
    if (target && this.hudPrompt) {
      const keyHint = this.gamepadConnected ? '[A] / [Y]' : '[E] lub [Spacja]';
      const label = target.type === 'gate' ? 'ŚLUZA ZAMKNIĘTA' : 'TERMINAL DROIDÓW';
      this.hudPrompt.innerHTML = `⚡ ${label} &bull; Wciśnij ${keyHint} aby otworzyć`;
      this.hudPrompt.classList.remove('hidden');
    } else if (this.hudPrompt) {
      this.hudPrompt.classList.add('hidden');
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update camera smoothly centered on player
    const targetCamX = this.player.x * this.tileSize - this.width / 2;
    const targetCamY = this.player.y * this.tileSize - this.height / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.12;
    this.camera.y += (targetCamY - this.camera.y) * 0.12;
  }

  movePlayerWithCollision(dx, dy) {
    // X-axis collision
    const newX = this.player.x + dx;
    if (!this.checkCollision(newX, this.player.y)) {
      this.player.x = newX;
    }

    // Y-axis collision
    const newY = this.player.y + dy;
    if (!this.checkCollision(this.player.x, newY)) {
      this.player.y = newY;
    }
  }

  checkCollision(x, y) {
    const r = this.player.radius;

    // Check walls
    for (const w of this.walls) {
      if (x + r > w.x && x - r < w.x + 1 && y + r > w.y && y - r < w.y + 1) {
        return true;
      }
    }

    // Check locked gates
    for (const g of this.gates) {
      if (!g.unlocked) {
        if (x + r > g.x && x - r < g.x + 1 && y + r > g.y && y - r < g.y + 1) {
          return true;
        }
      }
    }

    return false;
  }

  hitPlayer(amount, reason) {
    this.player.hp -= amount;
    this.player.invulnerableTimer = 1.2;
    this.playSound('playWrong');
    this.vibrate(250, 0.8, 0.8);
    this.spawnSparks(this.player.x, this.player.y, '#ff2a4b', 20);
    this.updateHUD();

    if (this.player.hp <= 0) {
      this.gameOver();
    }
  }

  spawnSparks(worldX, worldY, color, count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.particles.push({
        x: worldX,
        y: worldY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 1.5,
        life: Math.random() * 0.4 + 0.2
      });
    }
  }

  // --- RENDER ---
  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const ts = this.tileSize;
    const camX = this.camera.x;
    const camY = this.camera.y;

    // Clear background
    ctx.fillStyle = this.currentEpisode.floorColor;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(-camX, -camY);

    const ep = this.currentEpisode;

    // 1. Draw floor grid tiles
    for (let r = 0; r < ep.layout.length; r++) {
      for (let c = 0; c < ep.layout[r].length; c++) {
        const cell = ep.layout[r][c];
        if (cell !== 1) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.lineWidth = 1;
          ctx.strokeRect(c * ts, r * ts, ts, ts);
        }
      }
    }

    // 2. Draw Walls with 3D metallic edges
    for (const w of this.walls) {
      ctx.fillStyle = ep.wallColor;
      ctx.fillRect(w.x * ts, w.y * ts, ts, ts);

      ctx.strokeStyle = ep.wallBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(w.x * ts + 1, w.y * ts + 1, ts - 2, ts - 2);

      // Inner tech lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w.x * ts + 6, w.y * ts + 6);
      ctx.lineTo((w.x + 1) * ts - 6, (w.y + 1) * ts - 6);
      ctx.stroke();
    }

    // 3. Draw Forcefield Gates
    for (const g of this.gates) {
      const gx = g.x * ts;
      const gy = g.y * ts;

      if (!g.unlocked) {
        // Glowing laser barrier
        ctx.fillStyle = 'rgba(255, 42, 75, 0.25)';
        ctx.fillRect(gx, gy, ts, ts);

        ctx.shadowColor = '#ff2a4b';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#ff2a4b';
        ctx.lineWidth = 3;
        ctx.strokeRect(gx + 4, gy + 4, ts - 8, ts - 8);

        // Security lock icon
        ctx.shadowBlur = 0;
        ctx.font = `${Math.floor(ts * 0.45)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔒', gx + ts / 2, gy + ts / 2);
      } else {
        // Deactivated gate
        ctx.strokeStyle = 'rgba(0, 208, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(gx + 2, gy + 2, ts - 4, ts - 4);
      }
    }

    // 4. Draw Terminals
    for (const term of this.terminals) {
      const tx = term.x * ts;
      const ty = term.y * ts;

      ctx.fillStyle = term.hacked ? '#1a3320' : '#14223d';
      ctx.fillRect(tx + 6, ty + 6, ts - 12, ts - 12);
      ctx.strokeStyle = term.hacked ? '#25f252' : '#00d0ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(tx + 6, ty + 6, ts - 12, ts - 12);

      ctx.font = `${Math.floor(ts * 0.4)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(term.hacked ? '✔️' : '💻', tx + ts / 2, ty + ts / 2);
    }

    // 5. Draw Timed Lasers
    for (const l of this.lasers) {
      const lx = l.x * ts;
      const ly = l.y * ts;

      if (l.active) {
        ctx.shadowColor = '#ff2a4b';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#ff2a4b';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(lx, ly + ts / 2);
        ctx.lineTo(lx + ts, ly + ts / 2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Safe emitter sparks
        ctx.fillStyle = 'rgba(255, 42, 75, 0.3)';
        ctx.fillRect(lx + ts / 2 - 4, ly + ts / 2 - 4, 8, 8);
      }
    }

    // 6. Draw Kyber Crystals (Pickups)
    for (const pick of this.pickups) {
      if (!pick.collected) {
        const px = (pick.x + 0.5) * ts;
        const py = (pick.y + 0.5) * ts;

        ctx.save();
        ctx.translate(px, py);
        ctx.shadowColor = this.selectedCrystal.color;
        ctx.shadowBlur = 14;

        ctx.fillStyle = this.selectedCrystal.color;
        ctx.beginPath();
        ctx.moveTo(0, -ts * 0.25);
        ctx.lineTo(ts * 0.18, 0);
        ctx.lineTo(0, ts * 0.25);
        ctx.lineTo(-ts * 0.18, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
    }

    // 7. Draw Exit Portal
    if (this.exitPortal) {
      const ex = (this.exitPortal.x + 0.5) * ts;
      const ey = (this.exitPortal.y + 0.5) * ts;
      const ready = this.player.gatesUnlocked >= this.player.totalGates;

      ctx.save();
      ctx.translate(ex, ey);
      ctx.shadowColor = ready ? '#25f252' : '#ffea29';
      ctx.shadowBlur = 20;

      ctx.strokeStyle = ready ? '#25f252' : '#ffea29';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, ts * 0.42, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = `${Math.floor(ts * 0.4)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ready ? '🚀' : '⏳', 0, 0);

      ctx.restore();
    }

    // 8. Draw Patrol Droids
    for (const en of this.enemies) {
      if (!en.alive) continue;
      const ex = en.x * ts;
      const ey = en.y * ts;

      ctx.save();
      ctx.translate(ex, ey);

      // Droid body
      ctx.shadowColor = '#ff2a4b';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#b37436'; // B1 Battle Droid color
      ctx.beginPath();
      ctx.arc(0, 0, en.radius * ts, 0, Math.PI * 2);
      ctx.fill();

      // Red sensor eye
      ctx.fillStyle = '#ff2a4b';
      ctx.beginPath();
      ctx.arc(en.dir * (en.radius * ts * 0.4), 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 9. Draw Player (Jedi Knight)
    const px = this.player.x * ts;
    const py = this.player.y * ts;
    const pr = this.player.radius * ts;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(this.player.angle);

    // Invulnerability flashing
    if (this.player.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Robe / Body
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#6b4f3b'; // Jedi tunic brown
    ctx.beginPath();
    ctx.arc(0, 0, pr, 0, Math.PI * 2);
    ctx.fill();

    // Belt and shoulders
    ctx.fillStyle = '#3a271d';
    ctx.fillRect(-pr * 0.4, -pr * 0.8, pr * 0.8, pr * 1.6);

    // Jedi Head
    ctx.fillStyle = '#f5cba7';
    ctx.beginPath();
    ctx.arc(0, 0, pr * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Lightsaber Blade
    const saberColor = this.selectedCrystal.color;
    ctx.shadowColor = saberColor;
    ctx.shadowBlur = 18;

    if (this.player.isAttacking) {
      // Slashing arc animation
      const attackProgress = 1 - (this.player.attackTimer / this.player.attackDuration);
      const arcAngle = -Math.PI * 0.6 + attackProgress * Math.PI * 1.2;

      ctx.strokeStyle = saberColor;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, pr * 2.2, arcAngle - 0.4, arcAngle + 0.4);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Idle held saber
      ctx.strokeStyle = saberColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pr * 0.5, pr * 0.5);
      ctx.lineTo(pr * 1.8, pr * 0.5);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    ctx.restore();

    // 10. Draw Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x * ts, p.y * ts, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- HUD & STATE ---
  updateHUD() {
    if (this.hudEpisode) this.hudEpisode.textContent = `${this.currentEpisode.episode}: ${this.currentEpisode.title}`;
    if (this.hudMission) this.hudMission.textContent = `📍 ${this.currentEpisode.missionName} (Bramy: ${this.player.gatesUnlocked}/${this.player.totalGates})`;
    if (this.hudScore) this.hudScore.textContent = this.player.score;
    if (this.hudCrystals) this.hudCrystals.textContent = this.player.crystalsCollected;

    // Render Hearts
    if (this.hudHearts) {
      this.hudHearts.innerHTML = '';
      for (let i = 0; i < this.player.maxHp; i++) {
        const heart = document.createElement('span');
        heart.className = `maze-heart ${i < this.player.hp ? 'heart-full' : 'heart-empty'}`;
        heart.textContent = i < this.player.hp ? '❤️' : '🖤';
        this.hudHearts.appendChild(heart);
      }
    }
  }

  completeEpisode() {
    this.stop();
    this.playSound('playVictoryFanfare');
    this.vibrate(500, 0.7, 0.7);

    const elTitle = document.getElementById('maze-victory-title');
    const elLore = document.getElementById('maze-victory-lore');
    const elScore = document.getElementById('maze-victory-score');

    if (elTitle) elTitle.textContent = `MISJA ${this.currentEpisode.episode} UKOŃCZONA!`;
    if (elLore) elLore.textContent = `Ocaliłeś Galaktykę w misji "${this.currentEpisode.missionName}"! Wszystkie kody bezpieczeństwa złamane!`;
    if (elScore) elScore.textContent = this.player.score;

    if (this.modalVictory) this.modalVictory.classList.remove('hidden');
  }

  gameOver() {
    this.stop();
    this.playSound('playDefeat');
    this.vibrate(600, 1.0, 1.0);

    const elLore = document.getElementById('maze-gameover-lore');
    if (elLore) elLore.textContent = `Twoje siły wyczerpały się w misji ${this.currentEpisode.title}. Skup się na Mocy i spróbuj ponownie!`;

    if (this.modalGameOver) this.modalGameOver.classList.remove('hidden');
  }
}

window.JediMazeGame = JediMazeGame;