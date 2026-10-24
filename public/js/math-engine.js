// Math Engine for Jedi Academy: 
// Requirements:
// - Dodawanie / odejmowanie: od 0 do 100, dowolne składniki, odjemna i odjemnik (wyniki 0..100)
// - Mnożenie: mnożniki od 0 do 11 (wyniki 0..121)
// - Dzielenie: dzielna do 100, dzielnik do 11 (dzielenie bez reszty)

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

  // Generate a valid question based on updated curriculum specifications
  generateQuestion(optionsCount = 4) {
    const op = this.getNextOperation();
    let num1, num2, answer, symbol;
    let maxDistractorBound = 100;

    switch (op) {
      case '+': {
        symbol = '+';
        // Dodawanie: 0 do 100, dowolne składniki, suma <= 100
        num1 = this.randomInt(0, 100);
        num2 = this.randomInt(0, 100 - num1);
        answer = num1 + num2;
        maxDistractorBound = 100;
        break;
      }
      case '-': {
        symbol = '-';
        // Odejmowanie: 0 do 100, dowolna odjemna i odjemnik >= 0
        num1 = this.randomInt(0, 100);
        num2 = this.randomInt(0, num1);
        answer = num1 - num2;
        maxDistractorBound = 100;
        break;
      }
      case '*': {
        symbol = '×';
        // Mnożenie: mnożniki od 0 do 11
        num1 = this.randomInt(0, 11);
        num2 = this.randomInt(0, 11);
        answer = num1 * num2;
        maxDistractorBound = Math.max(121, answer + 10);
        break;
      }
      case '/': {
        symbol = ':';
        // Dzielenie: dzielna do 100, dzielnik do 11 (bez reszty)
        const divisor = this.randomInt(1, 11);
        const maxQuotient = Math.floor(100 / divisor);
        const quotient = this.randomInt(0, maxQuotient);
        num1 = divisor * quotient; // Dzielna <= 100
        num2 = divisor;            // Dzielnik <= 11
        answer = quotient;
        maxDistractorBound = 100;
        break;
      }
    }

    const options = this.generateOptions(answer, num1, num2, symbol, optionsCount, maxDistractorBound);

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

  // Generate smart options (1 correct + distractors)
  generateOptions(correctAnswer, num1, num2, symbol, count = 4, maxBound = 100) {
    const choices = new Set();
    choices.add(correctAnswer);

    const candidates = [];

    // Off by 1
    if (correctAnswer + 1 <= maxBound) candidates.push(correctAnswer + 1);
    if (correctAnswer - 1 >= 0) candidates.push(correctAnswer - 1);

    // Off by 10
    if (correctAnswer + 10 <= maxBound) candidates.push(correctAnswer + 10);
    if (correctAnswer - 10 >= 0) candidates.push(correctAnswer - 10);

    // Off by 2
    if (correctAnswer + 2 <= maxBound) candidates.push(correctAnswer + 2);
    if (correctAnswer - 2 >= 0) candidates.push(correctAnswer - 2);

    // Common arithmetic slips:
    if (symbol === '×' && (num1 + num2) <= maxBound && (num1 + num2) !== correctAnswer) {
      candidates.push(num1 + num2); // added instead of multiplied
    }
    if (symbol === '+' && Math.abs(num1 - num2) <= maxBound) {
      candidates.push(Math.abs(num1 - num2));
    }
    if (symbol === ':' && (num1 - num2) >= 0 && (num1 - num2) <= maxBound) {
      candidates.push(num1 - num2);
    }
    if (symbol === '×' && num1 > 0 && (num1 * (num2 + 1)) <= maxBound) {
      candidates.push(num1 * (num2 + 1));
    }
    if (symbol === '×' && num2 > 1 && (num1 * (num2 - 1)) <= maxBound) {
      candidates.push(num1 * (num2 - 1));
    }

    // Inverted digits: e.g. 42 -> 24
    if (correctAnswer >= 10 && correctAnswer <= maxBound) {
      const tens = Math.floor(correctAnswer / 10);
      const units = correctAnswer % 10;
      const inverted = units * 10 + tens;
      if (inverted <= maxBound && inverted !== correctAnswer) {
        candidates.push(inverted);
      }
    }

    // Shuffle candidate distractors
    this.shuffle(candidates);

    for (const c of candidates) {
      if (choices.size >= count) break;
      if (c >= 0 && c <= maxBound && !choices.has(c)) {
        choices.add(c);
      }
    }

    // If still less than count, generate nearby plausible numbers
    let attempts = 0;
    while (choices.size < count && attempts < 60) {
      attempts++;
      const offset = this.randomInt(-8, 8);
      const val = correctAnswer + offset;
      if (val >= 0 && val <= maxBound && !choices.has(val)) {
        choices.add(val);
      }
    }

    // Safety fallback
    while (choices.size < count) {
      const fallback = this.randomInt(0, maxBound);
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
