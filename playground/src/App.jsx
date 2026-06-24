import React, { useState, useEffect, useRef } from 'react';
import { 
  Code, 
  Table, 
  Cpu, 
  FileCode, 
  BarChart3, 
  Play, 
  RefreshCw, 
  Info, 
  Terminal, 
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import './App.css';

// Sample code templates
const TEMPLATES = {
  bubblesort: `// Bubble Sort implementation in C
void bubbleSort(int arr[], int n) {
    int i, j, temp;
    for (i = 0; i < n - 1; i++) {
        for (j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // swap elements
                temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`,
  calculator: `/* Simple calculator program */
int main() {
    char operator = '+';
    double num1 = 12.5, num2 = 4.0;
    double result = 0.0;

    if (operator == '+') {
        result = num1 + num2;
    } else if (operator == '-') {
        result = num1 - num2;
    } else {
        result = 0.0; // Unsupported operator
    }
    return 0;
}`,
  lexicalErrors: `// Demonstration of lexical error recovery
int main() {
    int count = 100;
    float $value = 5.25;  // $ is an invalid character in C
    char @symbol = '#';   // @ is an invalid character in C
    
    int finalVal = count * 2;
    return 0;
}`
};

// LEX raw file contents
const RAW_LEX_FILE = `%{
#include "lexer.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Global counts
int count_keywords = 0;
int count_identifiers = 0;
int count_operators = 0;
int count_constants = 0;
int count_punctuation = 0;
int count_comments = 0;
int count_errors = 0;
int total_tokens = 0;
%}

%option noyywrap
%option yylineno

/* Regular Expression Definitions */
DIGIT           [0-9]
HEXDIGIT        [0-9a-fA-F]
LETTER          [a-zA-Z_]
IDENTIFIER      {LETTER}({LETTER}|{DIGIT})*
INT_CONST       {DIGIT}+|0[xX]{HEXDIGIT}+
FLOAT_CONST     {DIGIT}+\\.{DIGIT}+([eE][+-]?{DIGIT}+)?|{DIGIT}+[eE][+-]?{DIGIT}+
CHAR_CONST      '([^'\\\\\\n]|\\\\.)'
STRING_CONST    \\"([^\\"\\\\\\n]|\\\\.)*\\"
SINGLE_COMMENT  \\\\/\\\\/.*
MULTI_COMMENT   \\\\/\\\\*([^*]|\\\\*+[^*/])*\\\\*+\\\\/
OPERATOR        "++"|"--"|"+="|"-="|"*="|"/="|"%="|"=="|"!="|"<="|">="|"&&"|"||"|"<<"|">>"|"+"|"-"|"*"|"/"|"%"|"="|"<"|">"|"!"|"&"|"|"|"^"|"~"
PUNCTUATION     ";"|","|"{"|"}"|"("|")"|"["|"]"
WHITESPACE      [ \\\\t\\\\r\\\\n]+

%%
{WHITESPACE}      { /* Ignore whitespaces */ }
{SINGLE_COMMENT}  { count_comments++; return TOKEN_COMMENT; }
{MULTI_COMMENT}   { count_comments++; return TOKEN_COMMENT; }

"int"|"float"|"char"|"double"|"if"|"else"|"while"|"for"|"return"|"void"|"switch"|"case"|"break"|"continue"|"struct"|"class"|"const"|"static"|"sizeof"|"typedef" {
    count_keywords++;
    total_tokens++;
    return TOKEN_KEYWORD;
}

{IDENTIFIER}      {
    count_identifiers++;
    total_tokens++;
    insert_symbol(yytext, "Identifier", yylineno);
    return TOKEN_IDENTIFIER;
}
{OPERATOR}        {
    count_operators++;
    total_tokens++;
    return TOKEN_OPERATOR;
}
{INT_CONST}       {
    count_constants++;
    total_tokens++;
    return TOKEN_CONSTANT_INT;
}
{FLOAT_CONST}     {
    count_constants++;
    total_tokens++;
    return TOKEN_CONSTANT_FLOAT;
}
{CHAR_CONST}      {
    count_constants++;
    total_tokens++;
    return TOKEN_CONSTANT_CHAR;
}
{STRING_CONST}    {
    count_constants++;
    total_tokens++;
    return TOKEN_CONSTANT_STRING;
}
{PUNCTUATION}     {
    count_punctuation++;
    total_tokens++;
    return TOKEN_PUNCTUATION;
}
.                 {
    count_errors++;
    return TOKEN_ERROR;
}
%%`;

// Token rules for JS-based scanner matching the LEX rules
const TOKEN_RULES = [
  { type: 'comment', regex: /^\/\/.*|^\/\*[\s\S]*?\*\// },
  { type: 'keyword', regex: /^(?:int|float|char|double|if|else|while|for|return|void|switch|case|break|continue|struct|class|const|static|sizeof|typedef)\b/ },
  { type: 'operator', regex: /^(?:\+\+|--|\+=|-=|\*=|\/=|%=|==|!=|<=|>=|&&|\|\||<<|>>|\+|-|\*|\/|%|=|<|>|!|&|\||\^|~)/ },
  { type: 'identifier', regex: /^[a-zA-Z_][a-zA-Z0-9_]*/ },
  { type: 'constant_float', regex: /^(?:\d+\.\d+(?:[eE][+-]?\d+)?|\d+[eE][+-]?\d+)/ },
  { type: 'constant_int', regex: /^(?:0[xX][0-9a-fA-F]+|\d+)/ },
  { type: 'constant_char', regex: /^'([^'\\\n]|\\.)'/ },
  { type: 'constant_string', regex: /^"([^"\\\n]|\\.)*"/ },
  { type: 'punctuation', regex: /^(?:;|,|\{|\}|\(|\)|\[|\])/ },
  { type: 'whitespace', regex: /^\s+/ }
];

// DFA Definitions for Simulation
const DFAS = {
  identifier: {
    title: 'Identifier DFA',
    description: 'Matches [a-zA-Z_][a-zA-Z0-9_]*',
    nodes: [
      { id: 'q0', x: 80, y: 150, label: 'Start (q0)', type: 'start' },
      { id: 'q1', x: 260, y: 150, label: 'Accept (q1)', type: 'accept' },
      { id: 'qe', x: 170, y: 270, label: 'Trap (qe)', type: 'trap' }
    ],
    links: [
      { source: 'q0', target: 'q1', label: 'a-z, A-Z, _', curvature: 0 },
      { source: 'q0', target: 'qe', label: '0-9, other', curvature: 0 },
      { source: 'q1', target: 'q1', label: 'a-z, A-Z, 0-9, _', curvature: -50 },
      { source: 'q1', target: 'qe', label: 'other symbol', curvature: 0 },
      { source: 'qe', target: 'qe', label: 'any character', curvature: 50 }
    ],
    getTransitions: (input) => {
      const transitions = [];
      let currentState = 'q0';
      
      for (let i = 0; i < input.length; i++) {
        const char = input[i];
        const prev = currentState;
        
        if (currentState === 'q0') {
          if (/[a-zA-Z_]/.test(char)) {
            currentState = 'q1';
            transitions.push({ from: prev, to: 'q1', char, linkIndex: 0 });
          } else {
            currentState = 'qe';
            transitions.push({ from: prev, to: 'qe', char, linkIndex: 1 });
          }
        } else if (currentState === 'q1') {
          if (/[a-zA-Z0-9_]/.test(char)) {
            currentState = 'q1';
            transitions.push({ from: prev, to: 'q1', char, linkIndex: 2 });
          } else {
            currentState = 'qe';
            transitions.push({ from: prev, to: 'qe', char, linkIndex: 3 });
          }
        } else if (currentState === 'qe') {
          transitions.push({ from: prev, to: 'qe', char, linkIndex: 4 });
        }
      }
      return { path: ['q0', ...transitions.map(t => t.to)], steps: transitions, success: currentState === 'q1' };
    }
  },
  number: {
    title: 'Integer / Decimal DFA',
    description: 'Matches Digits & Decimals (e.g. 10, 20.5)',
    nodes: [
      { id: 'q0', x: 60, y: 150, label: 'Start (q0)', type: 'start' },
      { id: 'q1', x: 200, y: 150, label: 'Int (q1)', type: 'accept' },
      { id: 'q2', x: 320, y: 150, label: 'Dot (q2)', type: 'normal' },
      { id: 'q3', x: 450, y: 150, label: 'Float (q3)', type: 'accept' },
      { id: 'qe', x: 260, y: 270, label: 'Trap (qe)', type: 'trap' }
    ],
    links: [
      { source: 'q0', target: 'q1', label: '0-9', curvature: 0 },
      { source: 'q0', target: 'qe', label: 'other', curvature: 0 },
      { source: 'q1', target: 'q1', label: '0-9', curvature: -40 },
      { source: 'q1', target: 'q2', label: '.', curvature: 0 },
      { source: 'q1', target: 'qe', label: 'other', curvature: 0 },
      { source: 'q2', target: 'q3', label: '0-9', curvature: 0 },
      { source: 'q2', target: 'qe', label: 'other', curvature: 0 },
      { source: 'q3', target: 'q3', label: '0-9', curvature: -40 },
      { source: 'q3', target: 'qe', label: 'other', curvature: 0 },
      { source: 'qe', target: 'qe', label: 'any', curvature: 40 }
    ],
    getTransitions: (input) => {
      const transitions = [];
      let currentState = 'q0';
      
      for (let i = 0; i < input.length; i++) {
        const char = input[i];
        const prev = currentState;
        
        if (currentState === 'q0') {
          if (/[0-9]/.test(char)) {
            currentState = 'q1';
            transitions.push({ from: prev, to: 'q1', char, linkIndex: 0 });
          } else {
            currentState = 'qe';
            transitions.push({ from: prev, to: 'qe', char, linkIndex: 1 });
          }
        } else if (currentState === 'q1') {
          if (/[0-9]/.test(char)) {
            currentState = 'q1';
            transitions.push({ from: prev, to: 'q1', char, linkIndex: 2 });
          } else if (char === '.') {
            currentState = 'q2';
            transitions.push({ from: prev, to: 'q2', char, linkIndex: 3 });
          } else {
            currentState = 'qe';
            transitions.push({ from: prev, to: 'qe', char, linkIndex: 4 });
          }
        } else if (currentState === 'q2') {
          if (/[0-9]/.test(char)) {
            currentState = 'q3';
            transitions.push({ from: prev, to: 'q3', char, linkIndex: 5 });
          } else {
            currentState = 'qe';
            transitions.push({ from: prev, to: 'qe', char, linkIndex: 6 });
          }
        } else if (currentState === 'q3') {
          if (/[0-9]/.test(char)) {
            currentState = 'q3';
            transitions.push({ from: prev, to: 'q3', char, linkIndex: 7 });
          } else {
            currentState = 'qe';
            transitions.push({ from: prev, to: 'qe', char, linkIndex: 8 });
          }
        } else if (currentState === 'qe') {
          transitions.push({ from: prev, to: 'qe', char, linkIndex: 9 });
        }
      }
      return { path: ['q0', ...transitions.map(t => t.to)], steps: transitions, success: currentState === 'q1' || currentState === 'q3' };
    }
  },
  operator_plus: {
    title: 'Operator "+" DFA',
    description: 'Matches +, ++, += operators',
    nodes: [
      { id: 'q0', x: 80, y: 150, label: 'Start (q0)', type: 'start' },
      { id: 'q1', x: 240, y: 150, label: '+ (q1)', type: 'accept' },
      { id: 'q2', x: 400, y: 80, label: '++ (q2)', type: 'accept' },
      { id: 'q3', x: 400, y: 220, label: '+= (q3)', type: 'accept' },
      { id: 'qe', x: 240, y: 270, label: 'Trap (qe)', type: 'trap' }
    ],
    links: [
      { source: 'q0', target: 'q1', label: '+', curvature: 0 },
      { source: 'q0', target: 'qe', label: 'other', curvature: 0 },
      { source: 'q1', target: 'q2', label: '+', curvature: -10 },
      { source: 'q1', target: 'q3', label: '=', curvature: 10 },
      { source: 'q1', target: 'qe', label: 'other', curvature: 0 },
      { source: 'q2', target: 'qe', label: 'any', curvature: 0 },
      { source: 'q3', target: 'qe', label: 'any', curvature: 0 },
      { source: 'qe', target: 'qe', label: 'any', curvature: 40 }
    ],
    getTransitions: (input) => {
      const transitions = [];
      let currentState = 'q0';
      
      for (let i = 0; i < input.length; i++) {
        const char = input[i];
        const prev = currentState;
        
        if (currentState === 'q0') {
          if (char === '+') {
            currentState = 'q1';
            transitions.push({ from: prev, to: 'q1', char, linkIndex: 0 });
          } else {
            currentState = 'qe';
            transitions.push({ from: prev, to: 'qe', char, linkIndex: 1 });
          }
        } else if (currentState === 'q1') {
          if (char === '+') {
            currentState = 'q2';
            transitions.push({ from: prev, to: 'q2', char, linkIndex: 2 });
          } else if (char === '=') {
            currentState = 'q3';
            transitions.push({ from: prev, to: 'q3', char, linkIndex: 3 });
          } else {
            currentState = 'qe';
            transitions.push({ from: prev, to: 'qe', char, linkIndex: 4 });
          }
        } else if (currentState === 'q2') {
          currentState = 'qe';
          transitions.push({ from: prev, to: 'qe', char, linkIndex: 5 });
        } else if (currentState === 'q3') {
          currentState = 'qe';
          transitions.push({ from: prev, to: 'qe', char, linkIndex: 6 });
        } else if (currentState === 'qe') {
          transitions.push({ from: prev, to: 'qe', char, linkIndex: 7 });
        }
      }
      return { path: ['q0', ...transitions.map(t => t.to)], steps: transitions, success: currentState === 'q1' || currentState === 'q2' || currentState === 'q3' };
    }
  }
};

export default function App() {
  const [code, setCode] = useState(TEMPLATES.bubblesort);
  const [activeTemplate, setActiveTemplate] = useState('bubblesort');
  const [activeTab, setActiveTab] = useState('tokens');
  const [tokens, setTokens] = useState([]);
  const [symbolTable, setSymbolTable] = useState([]);
  const [tokenCounts, setTokenCounts] = useState({});
  const [selectedToken, setSelectedToken] = useState(null);
  
  // DFA Simulation states
  const [dfaType, setDfaType] = useState('identifier');
  const [dfaInput, setDfaInput] = useState('count');
  const [dfaStep, setDfaStep] = useState(-1);
  const [dfaActiveNode, setDfaActiveNode] = useState('q0');
  const [dfaActiveLink, setDfaActiveLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const animationTimerRef = useRef(null);

  // Perform Lexical Analysis when code changes
  useEffect(() => {
    let currentText = code;
    let index = 0;
    let currentLine = 1;
    const extractedTokens = [];
    const counts = {
      keyword: 0,
      identifier: 0,
      operator: 0,
      constant_int: 0,
      constant_float: 0,
      constant_char: 0,
      constant_string: 0,
      punctuation: 0,
      comment: 0,
      error: 0
    };
    
    const symbols = new Map();

    while (index < currentText.length) {
      const remainingText = currentText.substring(index);
      let matched = false;

      for (const rule of TOKEN_RULES) {
        const match = remainingText.match(rule.regex);
        if (match) {
          const value = match[0];
          
          // Count line numbers in match
          const newlines = (value.match(/\n/g) || []).length;
          
          if (rule.type !== 'whitespace') {
            const tokenObj = {
              id: extractedTokens.length,
              type: rule.type,
              value: value,
              line: currentLine,
              start: index,
              end: index + value.length
            };
            extractedTokens.push(tokenObj);
            
            // Increment statistics
            counts[rule.type] = (counts[rule.type] || 0) + 1;
            
            // Build Symbol Table (only track unique identifiers)
            if (rule.type === 'identifier') {
              if (symbols.has(value)) {
                const sym = symbols.get(value);
                sym.count += 1;
              } else {
                symbols.set(value, {
                  name: value,
                  type: 'Identifier',
                  firstLine: currentLine,
                  count: 1
                });
              }
            }
          }
          
          index += value.length;
          currentLine += newlines;
          matched = true;
          break;
        }
      }

      // If no rule matches, take the single character as an error token (Lexical Error)
      if (!matched) {
        const errorVal = currentText[index];
        const errorToken = {
          id: extractedTokens.length,
          type: 'error',
          value: errorVal,
          line: currentLine,
          start: index,
          end: index + 1
        };
        extractedTokens.push(errorToken);
        counts.error = (counts.error || 0) + 1;
        
        index += 1;
      }
    }

    setTokens(extractedTokens);
    setTokenCounts(counts);
    setSymbolTable(Array.from(symbols.values()));
  }, [code]);

  // Handle template selection
  const selectTemplate = (key) => {
    setActiveTemplate(key);
    setCode(TEMPLATES[key]);
    setSelectedToken(null);
  };

  // Run DFA simulation step-by-step
  const startDfaSimulation = (inputVal, typeVal) => {
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
    }
    
    const dfa = DFAS[typeVal || dfaType];
    const { steps } = dfa.getTransitions(inputVal || dfaInput);
    
    setDfaStep(-1);
    setDfaActiveNode('q0');
    setDfaActiveLink(null);

    let step = 0;
    animationTimerRef.current = setInterval(() => {
      if (step < steps.length) {
        const currentTransition = steps[step];
        setDfaActiveLink(currentTransition.linkIndex);
        setDfaActiveNode(currentTransition.to);
        setDfaStep(step);
        step++;
      } else {
        clearInterval(animationTimerRef.current);
      }
    }, 1000);
  };

  // Trigger DFA simulation from selecting/clicking a token in the list
  const handleTokenClick = (token) => {
    setSelectedToken(token);
    
    // Auto switch to appropriate DFA tab if we can simulate the token type
    let targetDfa = null;
    let sanitizedVal = token.value;
    
    if (token.type === 'identifier') {
      targetDfa = 'identifier';
    } else if (token.type === 'constant_int' || token.type === 'constant_float') {
      targetDfa = 'number';
    } else if (token.type === 'operator' && (token.value.startsWith('+') || token.value === '=')) {
      targetDfa = 'operator_plus';
      // normalize input for simulator
      if (token.value === '=') sanitizedVal = '+'; // mock representation or select first transition
    }
    
    if (targetDfa) {
      setDfaType(targetDfa);
      setDfaInput(sanitizedVal);
      setActiveTab('dfa');
      startDfaSimulation(sanitizedVal, targetDfa);
    }
  };

  // Copy raw LEX code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(RAW_LEX_FILE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate SVG elements dynamically for current DFA
  const renderDfaGraph = () => {
    const dfa = DFAS[dfaType];
    
    return (
      <svg className="dfa-svg" viewBox="0 0 540 330">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155" />
          </marker>
          <marker id="arrow-active" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-cyan-light)" />
          </marker>
        </defs>

        {/* Start indicator arrow */}
        <path d="M 20 150 L 68 150" stroke="#475569" strokeWidth="2" markerEnd="url(#arrow)" />
        <text x="30" y="140" fill="#64748b" fontSize="10">Start</text>

        {/* Draw Edges */}
        {dfa.links.map((link, idx) => {
          const fromNode = dfa.nodes.find(n => n.id === link.source);
          const toNode = dfa.nodes.find(n => n.id === link.target);
          const isActive = dfaActiveLink === idx;

          // Self-loop links
          if (link.source === link.target) {
            const cx = fromNode.x;
            const cy = fromNode.y - 25;
            const r = 20;
            const pathData = `M ${cx - 5} ${cy} A ${r} ${r} 0 1 1 ${cx + 5} ${cy}`;
            return (
              <g key={`link-${idx}`} className={`dfa-edge ${isActive ? 'active' : ''}`}>
                <path d={pathData} markerEnd={isActive ? "url(#arrow-active)" : "url(#arrow)"} />
                <text x={cx} y={cy - 25} textAnchor="middle">{link.label}</text>
              </g>
            );
          }

          // Curved or straight links
          const dx = toNode.x - fromNode.x;
          const dy = toNode.y - fromNode.y;
          const dr = Math.sqrt(dx * dx + dy * dy);
          
          let pathData;
          if (link.curvature !== 0) {
            // Curved link
            pathData = `M ${fromNode.x} ${fromNode.y} A ${dr + link.curvature} ${dr + link.curvature} 0 0 1 ${toNode.x} ${toNode.y}`;
          } else {
            // Straight link
            pathData = `M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`;
          }

          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2 + (link.curvature ? link.curvature / 3 : -10);

          return (
            <g key={`link-${idx}`} className={`dfa-edge ${isActive ? 'active' : ''}`}>
              <path d={pathData} markerEnd={isActive ? "url(#arrow-active)" : "url(#arrow)"} />
              <text x={midX} y={midY} textAnchor="middle">{link.label}</text>
            </g>
          );
        })}

        {/* Draw Nodes */}
        {dfa.nodes.map((node) => {
          const isActive = dfaActiveNode === node.id;
          return (
            <g key={node.id} className={`dfa-node node-${node.type} ${isActive ? 'active' : ''}`} transform={`translate(${node.x},${node.y})`}>
              <circle r="22" />
              {node.type === 'accept' && <circle r="17" fill="none" stroke={isActive ? "var(--primary-light)" : "#475569"} strokeWidth="1.5" />}
              <text textAnchor="middle" dy="4">{node.id}</text>
              <text textAnchor="middle" dy="38" fontSize="10" fill="#64748b">{node.label.split(' ')[0]}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Get total token count
  const totalExtractedTokens = tokens.length;

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header glass-panel">
        <div className="logo-container">
          <div className="logo-icon">L</div>
          <div className="logo-text">
            <h1>LEXICRAFT</h1>
            <p>Interactive Lexical Analyzer & DFA Visualizer</p>
          </div>
        </div>
        <div className="header-actions">
          <a href="https://github.com/Mounish85/CD_Project" target="_blank" rel="noreferrer" className="btn-github">
            <svg height="18" width="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub Repo
          </a>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="dashboard-grid">
        
        {/* Left Side: Code Editor Workspace */}
        <section className="glass-panel editor-container">
          <div className="panel-header">
            <div className="panel-title">
              <Code size={18} className="text-violet-400" />
              <span>Source Code Workspace</span>
            </div>
            <span className="panel-subtitle">Write C code to tokenize</span>
          </div>

          {/* Code Template Selector Toolbar */}
          <div className="editor-toolbar">
            <span className="toolbar-label">Templates:</span>
            <button 
              className={`btn-template ${activeTemplate === 'bubblesort' ? 'active' : ''}`}
              onClick={() => selectTemplate('bubblesort')}
            >
              Bubble Sort
            </button>
            <button 
              className={`btn-template ${activeTemplate === 'calculator' ? 'active' : ''}`}
              onClick={() => selectTemplate('calculator')}
            >
              Calculator
            </button>
            <button 
              className={`btn-template ${activeTemplate === 'lexicalErrors' ? 'active' : ''}`}
              onClick={() => selectTemplate('lexicalErrors')}
            >
              Error Recovery
            </button>
          </div>

          {/* IDE-like Workspace */}
          <div className="editor-workspace">
            <div className="line-numbers code-font">
              {code.split('\n').map((_, idx) => (
                <div key={idx}>{idx + 1}</div>
              ))}
            </div>
            <textarea
              className="code-textarea code-font"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setActiveTemplate('');
              }}
              spellCheck="false"
              placeholder="Paste or write C-like source code here..."
            />
          </div>
        </section>

        {/* Right Side: Visual Output Tabs */}
        <section className="glass-panel tabs-container">
          
          {/* Tabs Navigation */}
          <nav className="tabs-header">
            <button 
              className={`tab-btn ${activeTab === 'tokens' ? 'active' : ''}`}
              onClick={() => setActiveTab('tokens')}
            >
              <Cpu size={16} />
              Tokens
            </button>
            <button 
              className={`tab-btn ${activeTab === 'symbolTable' ? 'active' : ''}`}
              onClick={() => setActiveTab('symbolTable')}
            >
              <Table size={16} />
              Symbol Table
            </button>
            <button 
              className={`tab-btn ${activeTab === 'dfa' ? 'active' : ''}`}
              onClick={() => setActiveTab('dfa')}
            >
              <Sparkles size={16} />
              DFA Simulator
            </button>
            <button 
              className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 size={16} />
              Analytics
            </button>
            <button 
              className={`tab-btn ${activeTab === 'lexcode' ? 'active' : ''}`}
              onClick={() => setActiveTab('lexcode')}
            >
              <FileCode size={16} />
              FLEX Specification (.l)
            </button>
          </nav>

          {/* Tab Panes */}
          <div className="tab-content">
            
            {/* Tab: Tokens Stream */}
            {activeTab === 'tokens' && (
              <div className="token-stream-container animate-fade-in">
                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-label">Total Tokens</span>
                    <span className="stat-value">{totalExtractedTokens}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Unique Identifiers</span>
                    <span className="stat-value">{symbolTable.length}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Stripped Comments</span>
                    <span className="stat-value">{tokenCounts.comment || 0}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Lexical Errors</span>
                    <span className="stat-value" style={{ color: tokenCounts.error > 0 ? 'var(--accent-red-light)' : '#f1f5f9' }}>
                      {tokenCounts.error || 0}
                    </span>
                  </div>
                </div>

                <p className="token-stream-helper">
                  <Info size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  Click any token below to simulate its state transition inside the DFA graph!
                </p>

                <div className="token-grid code-font">
                  {tokens.map((token) => (
                    <span 
                      key={token.id}
                      className={`token-pill token-${token.type} ${selectedToken?.id === token.id ? 'active-token' : ''}`}
                      onClick={() => handleTokenClick(token)}
                      title={`Line ${token.line} | Category: ${token.type.toUpperCase()}`}
                    >
                      {token.value}
                    </span>
                  ))}
                  {tokens.length === 0 && (
                    <span className="no-symbols">No tokens detected. Type some code to begin!</span>
                  )}
                </div>

                {/* Token Details Panel */}
                {selectedToken && (
                  <div className="token-details-card">
                    <div className="token-details-left">
                      <span className="token-details-label">Selected Token Info</span>
                      <span className="token-details-val code-font">"{selectedToken.value}"</span>
                    </div>
                    <div className="token-details-left">
                      <span className="token-details-label">Category</span>
                      <span className="token-details-val" style={{ color: 'var(--primary-light)' }}>
                        {selectedToken.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="token-details-left">
                      <span className="token-details-label">Line Occurred</span>
                      <span className="token-details-val">{selectedToken.line}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Symbol Table */}
            {activeTab === 'symbolTable' && (
              <div className="table-wrapper animate-fade-in">
                {symbolTable.length > 0 ? (
                  <table className="symbol-table">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>Identifier Name</th>
                        <th>Type</th>
                        <th>First Line</th>
                        <th>Frequency</th>
                      </tr>
                    </thead>
                    <tbody className="code-font">
                      {symbolTable.map((symbol, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td style={{ color: 'var(--accent-blue-light)', fontWeight: 600 }}>{symbol.name}</td>
                          <td>{symbol.type}</td>
                          <td>{symbol.firstLine}</td>
                          <td>{symbol.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-symbols">
                    No identifiers found in the symbol table. Define some variables (e.g. <code>int a;</code>) to populate it.
                  </div>
                )}
              </div>
            )}

            {/* Tab: DFA State Machine Simulator */}
            {activeTab === 'dfa' && (
              <div className="dfa-simulator-layout animate-fade-in">
                <div className="dfa-selector">
                  <span className="toolbar-label">Target Regex DFA:</span>
                  <button 
                    className={`btn-template ${dfaType === 'identifier' ? 'active' : ''}`}
                    onClick={() => { setDfaType('identifier'); setDfaInput('count'); }}
                  >
                    Identifier
                  </button>
                  <button 
                    className={`btn-template ${dfaType === 'number' ? 'active' : ''}`}
                    onClick={() => { setDfaType('number'); setDfaInput('20.5'); }}
                  >
                    Int / Float
                  </button>
                  <button 
                    className={`btn-template ${dfaType === 'operator_plus' ? 'active' : ''}`}
                    onClick={() => { setDfaType('operator_plus'); setDfaInput('++'); }}
                  >
                    Operator (+)
                  </button>
                </div>

                <div className="editor-toolbar" style={{ borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span className="toolbar-label">Test Input:</span>
                  <input
                    type="text"
                    className="code-font"
                    value={dfaInput}
                    onChange={(e) => setDfaInput(e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-color)',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      outline: 'none',
                      flex: 1,
                      marginRight: '0.5rem'
                    }}
                  />
                  <button 
                    className="btn-template active" 
                    onClick={() => startDfaSimulation(dfaInput, dfaType)}
                    style={{ background: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Play size={14} />
                    Run DFA
                  </button>
                </div>

                <div className="dfa-viewport">
                  {renderDfaGraph()}
                </div>

                <div className="dfa-legend">
                  <div className="legend-item">
                    <div className="legend-dot start" />
                    <span>Start State</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot accept" />
                    <span>Accept State</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot active" />
                    <span>Current Active State</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
                  {dfaStep >= 0 ? (
                    <div>
                      Step {dfaStep + 1}: Character <strong>'{dfaInput[dfaStep]}'</strong> transitioned state to <strong>{dfaActiveNode}</strong>.
                    </div>
                  ) : (
                    <div>Click "Run DFA" or select a token in the list to watch the state transitions.</div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Analytics Chart */}
            {activeTab === 'analytics' && (
              <div className="analytics-layout animate-fade-in">
                <h3>Token Distribution Analysis</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                  {[
                    { label: 'Keywords', type: 'keyword', color: 'var(--primary)' },
                    { label: 'Identifiers', type: 'identifier', color: 'var(--accent-blue-light)' },
                    { label: 'Operators', type: 'operator', color: 'var(--accent-warning-light)' },
                    { label: 'Constants (Int/Float)', type: 'constant', count: (tokenCounts.constant_int || 0) + (tokenCounts.constant_float || 0), color: 'var(--accent-green-light)' },
                    { label: 'Strings & Chars', type: 'strings', count: (tokenCounts.constant_string || 0) + (tokenCounts.constant_char || 0), color: 'var(--accent-cyan-light)' },
                    { label: 'Punctuations', type: 'punctuation', color: '#94a3b8' },
                    { label: 'Comments', type: 'comment', color: '#475569' }
                  ].map((item, idx) => {
                    const count = item.count !== undefined ? item.count : (tokenCounts[item.type] || 0);
                    const percentage = totalExtractedTokens > 0 ? (count / totalExtractedTokens) * 100 : 0;
                    return (
                      <div key={idx} className="chart-bar-container">
                        <div className="chart-bar-header">
                          <span className="chart-bar-label">{item.label}</span>
                          <span className="chart-bar-value">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="chart-bar-track">
                          <div 
                            className="chart-bar-fill" 
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: item.color,
                              boxShadow: `0 0 8px ${item.color}`
                            }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab: Raw FLEX specification code */}
            {activeTab === 'lexcode' && (
              <div className="lex-raw-container animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>lexer.l FLEX specification source code</span>
                  <button 
                    onClick={handleCopyCode}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color)',
                      color: 'white',
                      fontSize: '0.8rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
                <pre className="lex-raw-code code-font">
                  <code>{RAW_LEX_FILE}</code>
                </pre>
              </div>
            )}

          </div>
        </section>

      </main>

      {/* Compiler Information Summary / Help Card */}
      <footer className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
          <Terminal size={16} style={{ color: 'var(--primary-light)' }} />
          About this Compiler Design Project
        </h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
          This project implements a complete **Lexical Analyzer** using standard compiler construction concepts.
          The core scanning rules are defined using regular expressions. In a real-world compiler pipeline, the Lexical Analyzer (Scanner) reads input source code and converts it into a stream of structured **Tokens**, stripping comments and whitespaces. It inserts unique identifiers into the **Symbol Table**, which is later used by the Syntax and Semantic Analyzer. Lexical errors are isolated and reported, allowing the scanner to recover and continue scanning the file.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            💼 <strong>Features:</strong> Keywords/Operators/Identifiers recognition, Symbol Table generation, Comment Stripper, error reporting.
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            🛠️ <strong>FLEX compiler:</strong> Compile locally with: <code>make</code> or <code>build.bat</code>.
          </div>
        </div>
      </footer>

      <footer className="app-footer">
        <p>Created as a compiler design learning platform. Open Source under MIT License.</p>
        <p style={{ marginTop: '0.25rem' }}>
          <a href="https://github.com/Mounish85/CD_Project" target="_blank" rel="noreferrer">
            https://github.com/Mounish85/CD_Project
          </a>
        </p>
      </footer>
    </div>
  );
}
