// Test suite to verify MathEngine adherence to all user requirements
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
  const q = engine.generateQuestion();
  opCounts[q.symbol]++;

  // Check 1: Range 0 to 99
  if (q.num1 < 0 || q.num1 > 99) {
    throw new Error(`num1 out of range: ${q.num1} in ${q.text}`);
  }
  if (q.num2 < 0 || q.num2 > 99) {
    throw new Error(`num2 out of range: ${q.num2} in ${q.text}`);
  }
  if (q.answer < 0 || q.answer > 99) {
    throw new Error(`answer out of range: ${q.answer} in ${q.text}`);
  }

  // Check 2: Correct arithmetic
  if (q.symbol === '+') {
    if (q.num1 + q.num2 !== q.answer) {
      throw new Error(`Incorrect addition: ${q.text} = ${q.answer}`);
    }
  } else if (q.symbol === '-') {
    if (q.num1 - q.num2 !== q.answer) {
      throw new Error(`Incorrect subtraction: ${q.text} = ${q.answer}`);
    }
  } else if (q.symbol === '×') {
    if (q.num1 * q.num2 !== q.answer) {
      throw new Error(`Incorrect multiplication: ${q.text} = ${q.answer}`);
    }
  } else if (q.symbol === ':') {
    if (q.num2 === 0) {
      throw new Error(`Division by zero: ${q.text}`);
    }
    if (q.num1 / q.num2 !== q.answer || !Number.isInteger(q.answer)) {
      throw new Error(`Incorrect or non-integer division: ${q.text} = ${q.answer}`);
    }
  }

  // Check 3: Exactly 5 unique options
  if (!Array.isArray(q.options) || q.options.length !== 5) {
    throw new Error(`Options must have 5 items, got: ${q.options.length}`);
  }
  const uniqueSet = new Set(q.options);
  if (uniqueSet.size !== 5) {
    throw new Error(`Options contain duplicates: ${q.options.join(', ')}`);
  }

  // Check 4: Answer is in options
  if (!uniqueSet.has(q.answer)) {
    throw new Error(`Options do not include answer: ${q.answer} in ${q.options.join(', ')}`);
  }

  // Check 5: All options in range [0..99]
  for (const opt of q.options) {
    if (opt < 0 || opt > 99) {
      throw new Error(`Option out of range 0..99: ${opt} in [${q.options.join(', ')}]`);
    }
  }
}

console.log('Distribution of operations:');
console.log(opCounts);
console.log('✅ ALL 10,000 MATH ENGINE CHECKS PASSED PERFECTLY!');
