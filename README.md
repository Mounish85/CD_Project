# Lexical Analyzer Using LEX/FLEX and C (with Interactive Visualizer Web App)

A high-fidelity Compiler Design project implementing a fully functional **Lexical Analyzer** using **FLEX and C** for command-line compilation, accompanied by an **Interactive Visualizer Website (Lexicraft)** to visually demonstrate tokenization, symbol tables, token statistics, and Finite Automata (DFA) state transitions.

---

## ⚡ Core Compiler Concepts Covered

1. **Lexical Analysis (Scanning)**: The first phase of a compiler that reads the input source code character-by-character, groups them into meaningful character sequences called *lexemes*, and classifies them into *tokens*.
2. **Tokens**: Catagories representing syntactical units. This lexer identifies:
   - **Keywords**: `int`, `float`, `char`, `double`, `if`, `else`, `while`, `for`, `return`, `void`, `switch`, `case`, `break`, `continue`, `struct`, `class`, `const`, `static`, `sizeof`, `typedef`
   - **Operators**: Arithmetic (`+`, `-`, `*`, `/`, `%`, `++`, `--`), Relational (`==`, `!=`, `<`, `>`, `<=`, `>=`), Logical (`&&`, `||`, `!`), Assignment (`=`, `+=`, `-=`, `*=`, `/=`), Bitwise/Other.
   - **Identifiers**: Variable names, function names (`[a-zA-Z_][a-zA-Z0-9_]*`).
   - **Constants**: Integers (`10`, `0x1A`), Floating points (`20.5`, `1.2e-3`), character literals (`'A'`), and string literals (`"Hello"`).
   - **Punctuation**: `;`, `,`, `{`, `}`, `(`, `)`, `[`, `]`.
3. **Comment & Whitespace Stripper**: Eliminates whitespaces and strips single-line (`//...`) and multi-line (`/*...*/`) comments.
4. **Symbol Table**: A key data structure containing unique identifiers, tracking their type, frequency, and first occurrence line number.
5. **Finite Automata (DFA)**: Deterministic Finite Automata matching token regular expressions (visualized interactively in the web application).

---

## 📁 Repository Structure

```
CD_Project/
├── lexer.l          # FLEX scanner specification rules (regex matching)
├── lexer.h          # Header defining tokens, counts, and Symbol Table structures
├── main.c           # C CLI driver (scans inputs, outputs lists, counts, symbol table)
├── test_input.c     # Sample C code containing various tokens to test the lexer
├── Makefile         # Build file for Linux, macOS, and WSL
├── build.bat        # Auto-detecting build script for Windows systems
├── .gitignore       # Excludes binaries and build logs
└── playground/      # Interactive compiler visualizer (React + Vite Web App)
```

---

## 🛠️ CLI Local Compilation

### Windows (Native PowerShell/CMD)

If you have Winget installed, you can set up the tools automatically by running:
```powershell
winget install WinFlexBison.win_flex_bison
winget install MartinStorsjo.LLVM-MinGW.UCRT
```

1. Open a terminal and run the automatic build script:
   ```cmd
   build.bat
   ```
2. Run the generated analyzer against the test C file:
   ```cmd
   lexer.exe test_input.c
   ```

### Linux / macOS / WSL

1. Install FLEX and GCC via your package manager (e.g. `sudo apt-get install flex gcc make` on Ubuntu).
2. Compile using Make:
   ```bash
   make
   ```
3. Run the compiler:
   ```bash
   ./lexer test_input.c
   ```

---

## 🌐 Interactive Visualizer Website (Playground)

We have built a gorgeous web-based playground (**Lexicraft**) inside the `/playground` folder using React + Vite. It runs the exact lexical matching rules in the browser and provides a visual editor dashboard.

### Features:
- **IDE Code Workspace**: Paste any code or select preloaded algorithms (Bubble Sort, Calculator, Lexical Error demo).
- **Interactive Token Highlighting**: Color-codes and organizes matched tokens on the fly.
- **Dynamic Symbol Table**: Generates and lists identifiers, showing type, line occurrences, and frequencies.
- **DFA Simulator**: Visualizes the state machine node-graph transitions (SVG) for Identifiers, Int/Float numbers, and Operators step-by-step!
- **Token Analytics**: Radial/progress charts showing distribution statistics.

### Run Website Locally:
1. Navigate to the playground directory:
   ```bash
   cd playground
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite local server:
   ```bash
   npm run dev
   ```
4. Open the displayed URL (typically `http://localhost:5173/`) in your browser.

---

## 📝 Example Output (CLI)

```
Line No.   | Token Text                | Token Category      
-----------------------------------------------------------
3          | /* COMMENT */             | COMMENT (Stripped)  
7          | int                       | KEYWORD             
7          | main                      | IDENTIFIER          
7          | (                         | PUNCTUATION         
7          | )                         | PUNCTUATION         
7          | {                         | PUNCTUATION         
8          | int                       | KEYWORD             
8          | a                         | IDENTIFIER          
8          | =                         | OPERATOR            
8          | 10                        | INT CONSTANT        
8          | ;                         | PUNCTUATION         

===========================================================
                  LEXICAL ANALYSIS SUMMARY
===========================================================
 Keywords:                  8
 Identifiers:               16
 Operators:                 15
 Constants:                 8
 Punctuation:               18
 Comments (Stripped):       2
 Errors:                    2
-----------------------------------------------------------
 Total Tokens:              65
===========================================================

===========================================================
                       SYMBOL TABLE
===========================================================
S.No  | Identifier Name           | First Line   | Frequency 
-----------------------------------------------------------
1     | include                   | 1            | 1         
2     | stdio                     | 1            | 1         
3     | main                      | 7            | 1         
4     | a                         | 8            | 6         
===========================================================
```

---

## ⚖️ License
This project is licensed under the MIT License.
