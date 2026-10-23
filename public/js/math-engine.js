// Math Engine for Jedi Academy: 0 to 99 range, (+, -, ×, :)

class MathEngine {
  constructor() {
    this.operations = ['+', '-', '*', '/'];
    this.lastOpIndex = 0;
  }

  // Pick operation, ensuring good variety (cycles through all four)
  getNextOperation() {
    const op = this.operations[this.lastOpIndex % this.operations.length];
    this.lastOpIndex++;
    return op;
  }

  // Random integer inclusive between min and max
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Generate a valid question in 0..99
  generateQuestion() {
    const op = this.getNextOperation();
    let num1, num2, answer, symbol;

    switch (op) {
      case '+': {
        symbol = '+';
        // a + b <= 99
        num1 = this.randomInt(0, 99);
        num2 = this.randomInt(0, 99 - num1);
        answer = num1 + num2;
        break;
      }
      case '-': {
        symbol = '-';
        // a - b >= 0, a <= 99
        num1 = this.randomInt(0, 99);
        num2 = this.randomInt(0, num1);
        answer = num1 - num2;
        break;
      }
      case '*': {
        symbol = '×';
        // Multiplication in range 0..99
        // 9-year-olds: standard times tables (0-10 or 0-12) and friendly multiples
        const poolType = Math.random();
        if (poolType < 0.65) {
          // Standard times table: 2..10 * 2..10 (or 0, 1)
          num1 = this.randomInt(2, 10);
          num2 = this.randomInt(2, Math.floor(99 / num1));
        } else if (poolType < 0.85) {
          // 0, 1 or 11, 12 tables
          num1 = this.randomInt(0, 12);
          num2 = this.randomInt(0, Math.floor(99 / Math.max(num1, 1)));
        } else {
          // Round multiples like 10 * X, 20 * X
          const bases = [10, 20, 25, 30, 40, 50];
          num1 = bases[Math.floor(Math.random() * bases.length)];
          const maxMult = Math.floor(99 / num1);
          num2 = this.randomInt(1, Math.max(1, maxMult));
        }
        answer = num1 * num2;
        break;
      }
      case '/': {
        symbol = ':';
        // Division without remainder, result and dividend in 0..99
        // divisor b >= 1, answer c in 0..12 or clean divisor
        const divisor = this.randomInt(1, 10);
        const quotient = this.randomInt(1, Math.floor(99 / divisor));
        num1 = divisor * quotient; // dividend <= 99
        num2 = divisor;
        answer = quotient;
        break;
      }
    }

    const options = this.generateOptions(answer, num1, num2, symbol);

    return {
      num1,
      num2,
      operator: op,
      symbol,
      answer,
      text: `${num1} ${symbol} ${num2}`,
      options
    };
  }

  // Generate 5 options (1 correct + 4 smart distractors) clamped to 0..99
  generateOptions(correctAnswer, num1, num2, symbol) {
    const choices = new Set();
    choices.add(correctAnswer);

    // Potential smart distractor generators:
    const candidates = [];

    // Off by 1
    if (correctAnswer + 1 <= 99) candidates.push(correctAnswer + 1);
    if (correctAnswer - 1 >= 0) candidates.push(correctAnswer - 1);

    // Off by 10
    if (correctAnswer + 10 <= 99) candidates.push(correctAnswer + 10);
    if (correctAnswer - 10 >= 0) candidates.push(correctAnswer - 10);

    // Off by 2
    if (correctAnswer + 2 <= 99) candidates.push(correctAnswer + 2);
    if (correctAnswer - 2 >= 0) candidates.push(correctAnswer - 2);

    // Operation slips:
    if (symbol === '×' && (num1 + num2) <= 99 && (num1 + num2) !== correctAnswer) {
      candidates.push(num1 + num2); // added instead of multiplied
    }
    if (symbol === '+' && Math.abs(num1 - num2) <= 99) {
      candidates.push(Math.abs(num1 - num2));
    }
    if (symbol === ':' && (num1 - num2) >= 0 && (num1 - num2) <= 99) {
      candidates.push(num1 - num2);
    }

    // Inverted digits: e.g. 42 -> 24
    if (correctAnswer >= 10 && correctAnswer <= 99) {
      const tens = Math.floor(correctAnswer / 10);
      const units = correctAnswer % 10;
      const inverted = units * 10 + tens;
      if (inverted <= 99 && inverted !== correctAnswer) {
        candidates.push(inverted);
      }
    }

    // Shuffle candidate distractors
    this.shuffle(candidates);

    for (const c of candidates) {
      if (choices.size >= 5) break;
      if (c >= 0 && c <= 99 && !choices.has(c)) {
        choices.add(c);
      }
    }

    // If still less than 5, generate nearby plausible numbers
    let attempts = 0;
    while (choices.size < 5 && attempts < 50) {
      attempts++;
      const offset = this.randomInt(-8, 8);
      const val = correctAnswer + offset;
      if (val >= 0 && val <= 99 && !choices.has(val)) {
        choices.add(val);
      }
    }

    // Safety fallback
    while (choices.size < 5) {
      const fallback = this.randomInt(0, 99);
      choices.add(fallback);
    }

    const result = Array.from(choices);
    this.shuffle(result);
    return result;
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

window.MathEngine = MathEngine;
