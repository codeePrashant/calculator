/* ==============================================
   CALCULATOR — script.js
   Prashant Kushwaha

   Features:
   1. Basic arithmetic  (+ - × ÷ %)
   2. Scientific functions (sin, cos, tan, log, sqrt, etc.)
   3. Live result preview while typing
   4. Calculation history (click to reuse)
   5. Keyboard support
   6. Error handling (no crash on bad input)
   7. Sign toggle (+/-)
   8. Mode switching (Basic / Scientific / History)
============================================== */

/* =============================================
   STATE VARIABLES
   — These hold the current state of the calculator
============================================= */

var expression  = '';      // What the user has typed so far
var justCalc    = false;   // Did the user just press = ?
var history     = [];      // Array of past calculations
var currentMode = 'basic'; // Which tab is active


/* =============================================
   GET HTML ELEMENTS
============================================= */
var expressionEl  = document.getElementById('expression');
var resultEl      = document.getElementById('result');
var historyEl     = document.getElementById('history');
var modeLabelEl   = document.getElementById('mode-label');
var sciBtns       = document.getElementById('sci-buttons');
var historyPanel  = document.getElementById('history-panel');
var historyList   = document.getElementById('history-list');
var basicButtons  = document.getElementById('basic-buttons');
var btnBasic      = document.getElementById('btn-basic');
var btnScientific = document.getElementById('btn-scientific');
var btnHistory    = document.getElementById('btn-history');


/* =============================================
   1. UPDATE DISPLAY
   — Called after every input to refresh the screen
============================================= */
function updateDisplay() {
  // Show the expression (replace * and / with nice symbols)
  var pretty = expression
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/Math\.sin\(/g,  'sin(')
    .replace(/Math\.cos\(/g,  'cos(')
    .replace(/Math\.tan\(/g,  'tan(')
    .replace(/Math\.log10\(/g,'log(')
    .replace(/Math\.log\(/g,  'ln(')
    .replace(/Math\.sqrt\(/g, '√(')
    .replace(/Math\.abs\(/g,  '|')
    .replace(/Math\.PI/g,     'π');

  expressionEl.textContent = pretty || '0';

  // Auto-shrink font if expression is long
  if (expression.length > 14) {
    expressionEl.style.fontSize = '1.6rem';
  } else if (expression.length > 9) {
    expressionEl.style.fontSize = '2rem';
  } else {
    expressionEl.style.fontSize = '2.6rem';
  }

  // Show live result preview while typing
  showLiveResult();
}


/* =============================================
   2. LIVE RESULT PREVIEW
   — Shows the answer in small text while typing,
     so user can see result before pressing =
============================================= */
function showLiveResult() {
  // Only show preview if expression is not empty
  if (!expression || expression.length < 2) {
    resultEl.textContent = '';
    return;
  }

  try {
    // Try to calculate current expression
    var preview = eval(expression); // eslint-disable-line no-eval

    // Only show if it's a valid number and different from expression
    if (preview !== undefined && !isNaN(preview) && isFinite(preview)) {
      var formatted = formatNumber(preview);
      // Don't show same number as what's typed
      if (formatted !== expression) {
        resultEl.textContent = '= ' + formatted;
      } else {
        resultEl.textContent = '';
      }
    } else {
      resultEl.textContent = '';
    }
  } catch (e) {
    // Expression is incomplete — that's fine, just don't show preview
    resultEl.textContent = '';
  }
}


/* =============================================
   3. INPUT A CHARACTER
   — Called when user taps a number or operator
============================================= */
function inputChar(char) {

  // If user just pressed = and now types a number,
  // start fresh. If they type an operator, continue.
  if (justCalc) {
    var operators = ['+', '-', '*', '/', '%', '**'];
    if (operators.includes(char)) {
      // Continue with the result
      justCalc = false;
    } else {
      // Start new calculation
      expression = '';
      justCalc = false;
    }
  }

  // Prevent two dots in the same number
  if (char === '.') {
    // Get the last number segment
    var parts = expression.split(/[\+\-\*\/]/);
    var lastPart = parts[parts.length - 1];
    if (lastPart.includes('.')) return; // Already has a dot
    if (lastPart === '') expression += '0'; // Add leading 0 if needed
  }

  // Prevent two operators in a row (except minus for negative)
  var lastChar = expression.slice(-1);
  var isOperator = ['+', '-', '*', '/'].includes(char);
  var lastIsOperator = ['+', '-', '*', '/'].includes(lastChar);
  if (isOperator && lastIsOperator) {
    // Replace the last operator
    expression = expression.slice(0, -1);
  }

  // Add the character
  expression += char;
  updateDisplay();
}


/* =============================================
   4. SCIENTIFIC FUNCTION INPUT
   — Called when user taps sin, cos, sqrt, etc.
============================================= */
function inputSci(func) {
  if (justCalc) {
    expression = '';
    justCalc = false;
  }
  expression += func;
  updateDisplay();
}


/* =============================================
   5. CALCULATE (press =)
============================================= */
function calculate() {
  if (!expression) return;

  try {
    // Handle percentage: replace % with /100
    var expr = expression.replace(/(\d+)%/g, '($1/100)');

    // Close any unclosed parentheses
    var openCount  = (expr.match(/\(/g) || []).length;
    var closeCount = (expr.match(/\)/g) || []).length;
    for (var i = 0; i < openCount - closeCount; i++) {
      expr += ')';
    }

    // Calculate!
    var answer = eval(expr); // eslint-disable-line no-eval

    // Check for valid answer
    if (isNaN(answer) || !isFinite(answer)) {
      showError();
      return;
    }

    // Format the answer
    var formattedAnswer = formatNumber(answer);

    // Save to history
    saveToHistory(expression, formattedAnswer);

    // Update display
    historyEl.textContent = expression
      .replace(/\*/g, '×')
      .replace(/\//g, '÷')
      .replace(/Math\.sin\(/g,  'sin(')
      .replace(/Math\.cos\(/g,  'cos(')
      .replace(/Math\.tan\(/g,  'tan(')
      .replace(/Math\.log10\(/g,'log(')
      .replace(/Math\.log\(/g,  'ln(')
      .replace(/Math\.sqrt\(/g, '√(')
      .replace(/Math\.PI/g,     'π')
      + ' =';

    expression = String(answer); // Use raw number for next calculation
    justCalc   = true;

    expressionEl.textContent = formattedAnswer;
    expressionEl.style.fontSize = formattedAnswer.length > 12 ? '1.6rem' : '2.6rem';
    resultEl.textContent = '';

  } catch (e) {
    showError();
  }
}


/* =============================================
   6. FORMAT NUMBER
   — Makes numbers look nice (no long decimals)
============================================= */
function formatNumber(num) {
  // If it's a whole number, show without decimals
  if (Number.isInteger(num)) {
    return num.toLocaleString('en-IN'); // Indian number format
  }
  // Round to 10 decimal places to avoid floating point weirdness
  // e.g. 0.1 + 0.2 = 0.30000000004 → 0.3
  var rounded = parseFloat(num.toFixed(10));
  return rounded.toString();
}


/* =============================================
   7. CLEAR ALL (AC button)
============================================= */
function clearAll() {
  expression = '';
  justCalc   = false;
  expressionEl.textContent = '0';
  resultEl.textContent     = '';
  historyEl.textContent    = '';
  expressionEl.style.fontSize = '2.6rem';
}


/* =============================================
   8. DELETE LAST CHARACTER (⌫ button)
============================================= */
function deleteLast() {
  if (justCalc) {
    // Clear everything if user backspaces after =
    clearAll();
    return;
  }

  // Handle multi-character tokens like "Math.sin("
  var tokens = ['Math.sin(', 'Math.cos(', 'Math.tan(', 'Math.log10(', 'Math.log(', 'Math.sqrt(', 'Math.abs(', 'Math.PI'];
  var deleted = false;

  tokens.forEach(function(token) {
    if (expression.endsWith(token)) {
      expression = expression.slice(0, -token.length);
      deleted = true;
    }
  });

  if (!deleted) {
    expression = expression.slice(0, -1); // Remove last character
  }

  updateDisplay();
}


/* =============================================
   9. TOGGLE SIGN (+/- button)
   — Makes positive numbers negative and vice versa
============================================= */
function toggleSign() {
  if (!expression) return;

  // Try to negate the whole expression
  if (expression.startsWith('-')) {
    expression = expression.slice(1); // Remove leading minus
  } else {
    expression = '-' + expression;
  }
  updateDisplay();
}


/* =============================================
   10. SHOW ERROR
   — Shakes the display and shows "Error"
============================================= */
function showError() {
  expressionEl.textContent = 'Error';
  expressionEl.classList.add('shake');
  resultEl.textContent = 'Invalid expression';

  // Remove shake class after animation ends
  setTimeout(function() {
    expressionEl.classList.remove('shake');
  }, 400);

  // Clear after 1.5 seconds
  setTimeout(function() {
    clearAll();
  }, 1500);
}


/* =============================================
   11. HISTORY — Save & Display
============================================= */

// Save a calculation to history array
function saveToHistory(expr, answer) {
  history.unshift({ expr: expr, answer: answer }); // Add to beginning

  // Keep only last 20 items
  if (history.length > 20) {
    history.pop();
  }

  renderHistory();
}

// Render history list in the panel
function renderHistory() {
  if (history.length === 0) {
    historyList.innerHTML = '<p class="history-empty">No history yet.</p>';
    return;
  }

  historyList.innerHTML = ''; // Clear old items

  history.forEach(function(item, index) {
    var div = document.createElement('div');
    div.className = 'history-item';

    // Pretty-print the expression
    var prettyExpr = item.expr
      .replace(/\*/g, '×')
      .replace(/\//g, '÷')
      .replace(/Math\.sin\(/g,  'sin(')
      .replace(/Math\.cos\(/g,  'cos(')
      .replace(/Math\.tan\(/g,  'tan(')
      .replace(/Math\.log10\(/g,'log(')
      .replace(/Math\.log\(/g,  'ln(')
      .replace(/Math\.sqrt\(/g, '√(')
      .replace(/Math\.PI/g,     'π');

    div.innerHTML =
      '<div class="hist-expr">' + prettyExpr + ' =</div>' +
      '<div class="hist-answer">' + item.answer + '</div>';

    // Click to reuse this result
    div.addEventListener('click', function() {
      expression = item.answer.replace(/,/g, ''); // Remove commas
      justCalc = true;
      updateDisplay();
      switchMode('basic'); // Go back to basic mode
    });

    historyList.appendChild(div);
  });
}

// Clear all history
function clearHistory() {
  history = [];
  renderHistory();
}


/* =============================================
   12. MODE SWITCHING (Basic / Scientific / History)
============================================= */
function switchMode(mode) {
  currentMode = mode;

  // Update toggle buttons
  btnBasic.classList.remove('active');
  btnScientific.classList.remove('active');
  btnHistory.classList.remove('active');

  // Hide all panels
  sciBtns.classList.remove('visible');
  historyPanel.classList.remove('visible');

  // Show the right panel
  if (mode === 'basic') {
    btnBasic.classList.add('active');
    modeLabelEl.textContent = 'Basic';
  } else if (mode === 'scientific') {
    btnScientific.classList.add('active');
    sciBtns.classList.add('visible');
    modeLabelEl.textContent = 'Scientific';
  } else if (mode === 'history') {
    btnHistory.classList.add('active');
    historyPanel.classList.add('visible');
    modeLabelEl.textContent = 'History';
    renderHistory();
  }
}


/* =============================================
   13. KEYBOARD SUPPORT
   — So users can type on a real keyboard too
============================================= */
document.addEventListener('keydown', function(event) {
  var key = event.key;

  // Number keys and operators
  if ('0123456789'.includes(key)) { inputChar(key); return; }
  if (key === '+') { inputChar('+'); return; }
  if (key === '-') { inputChar('-'); return; }
  if (key === '*') { inputChar('*'); return; }
  if (key === '/') { event.preventDefault(); inputChar('/'); return; }
  if (key === '%') { inputChar('%'); return; }
  if (key === '.') { inputChar('.'); return; }
  if (key === '(' ) { inputChar('('); return; }
  if (key === ')' ) { inputChar(')'); return; }

  // Enter or = → calculate
  if (key === 'Enter' || key === '=') { calculate(); return; }

  // Backspace → delete last
  if (key === 'Backspace') { deleteLast(); return; }

  // Escape → clear all
  if (key === 'Escape') { clearAll(); return; }
});


/* =============================================
   14. INITIALIZE
   — Set up the calculator when the page loads
============================================= */
document.addEventListener('DOMContentLoaded', function() {
  updateDisplay();
  switchMode('basic');
});
