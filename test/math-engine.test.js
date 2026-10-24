// Test suite to verify MathEngine adherence to updated curriculum specifications:
// - dodawanie/odejmowanie od 0 do 100, dowolne składniki, odjemna, odjemnik
// - mnożenie - mnożniki od 0 do 11
// - dzielenie - dzielna do 100, dzielnik do 11
const fs = require('fs');
const path = require('path');

// Mock window
global.window = {};
require(path.join(__dirname, '../public/js/math-engine.js'));

const MathEngine = global.window.MathEngine;
const engine = new MathEngine();

console.log('--- Testing Math Engine Generation (10,000 runs) ---');

const opCounts = { '+': 0, '-': 0, '×': 0, ':': 0 };

for (let i = 0; i < 10000; i++) {
  // Test with 4 options (standard for gamepad/controller A,B,X,Y) and 5 options alternating
  const optionsCount = (i % 2 === 0) ? 4 : 5;
  const q = engine.generateQuestion(optionsCount);
  opCounts[q.symbol]++;

  // Check 1: General sanity
  if (q.num1 < 0 || q.num2 < 0 || q.answer < 0) {
    throw new Error(`Negative value in question: ${q.text} = ${q.answer}`);
  }

  // Check 2: Specific operation rules
  if (q.symbol === '+') {
    if (q.num1 > 100 || q.num2 > 100 || q.answer > 100) {
      throw new Error(`Addition exceeds 100: ${q.text} = ${q.answer}`);
    }
    if (q.num1 + q.num2 !== q.answer) {
      throw new Error(`Incorrect addition: ${q.text} = ${q.answer}`);
    }
  } else if (q.symbol === '-') {
    if (q.num1 > 100 || q.num2 > 100 || q.answer > 100) {
      throw new Error(`Subtraction term exceeds 100: ${q.text} = ${q.answer}`);
    }
    if (q.num1 - q.num2 !== q.answer) {
      throw new Error(`Incorrect subtraction: ${q.text} = ${q.answer}`);
    }
  } else if (q.symbol === '×') {
    if (q.num1 > 11 || q.num2 > 11) {
      throw new Error(`Multiplication factor exceeds 11: ${q.text} = ${q.answer}`);
    }
    if (q.num1 * q.num2 !== q.answer) {
      throw new Error(`Incorrect multiplication: ${q.text} = ${q.answer}`);
    }
  } else if (q.symbol === ':') {
    if (q.num2 < 1 || q.num2 > 11) {
      throw new Error(`Divisor must be 1..11, got: ${q.num2} in ${q.text}`);
    }
    if (q.num1 > 100) {
      throw new Error(`Dividend must be <= 100, got: ${q.num1} in ${q.text}`);
    }
    if (q.num1 / q.num2 !== q.answer || !Number.isInteger(q.answer)) {
      throw new Error(`Incorrect or non-integer division: ${q.text} = ${q.answer}`);
    }
  }

  // Check 3: Exactly optionsCount unique options
  if (!Array.isArray(q.options) || q.options.length !== optionsCount) {
    throw new Error(`Options count mismatch, expected ${optionsCount}, got: ${q.options.length}`);
  }
  const uniqueSet = new Set(q.options);
  if (uniqueSet.size !== optionsCount) {
    throw new Error(`Options contain duplicates: ${q.options.join(', ')}`);
  }

  // Check 4: Answer is in options
  if (!uniqueSet.has(q.answer)) {
    throw new Error(`Options do not include answer: ${q.answer} in ${q.options.join(', ')}`);
  }
}

console.log('Distribution of operations:');
console.log(opCounts);
console.log('✅ ALL 10,000 UPDATED MATH ENGINE CHECKS PASSED PERFECTLY!');
