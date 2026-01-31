// FILE: scripts/generate_context.cjs
const fs = require('fs');
const path = require('path');

// --- CONFIGURATIE ---
const OUTPUT_FILE = '_PROJECT_CONTEXT_SCANNER.txt';
const ROOT_DIR = path.resolve(__dirname, '..'); // De root van je extensie
const SRC_DIR = path.join(ROOT_DIR, 'src');

// Pad naar de "Moeder App" (BetEdgePro) voor type syncing
const BEP_ROOT = path.resolve(ROOT_DIR, '../../BetEdgePro/BetEdgePro'); 
const PRO_TYPES_PATH = path.join(BEP_ROOT, 'src/types.ts');
const LOCAL_TYPES_PATH = path.join(SRC_DIR, 'types.ts');

// Welke extensies willen we uit 'src' hebben?
const ALLOWED_EXTENSIONS = ['.ts', '.tsx', '.css', '.json'];

// Welke bestanden/mappen moeten we ALTIJD negeren?
const IGNORE_PATTERNS = [
  'vite-env.d.ts', 
  'node_modules',
  'dist',
  '.DS_Store'
];

// Welke specifieke bestanden uit de ROOT moeten erbij?
const ROOT_FILES_TO_INCLUDE = [
  '.cursorrules',
  '_ECOSYSTEM.md',
  '_BES_ARCHITECTUUR.md',
  '_BES_ROADMAP.md',
  'package.json',
  'tsconfig.json',
  'vite.config.ts'
];

// DE SYSTEM PROMPT
const SYSTEM_PROMPT = `
================================================================================
!!! SYSTEEM INSTRUCTIE VOOR AI STUDIO / GEMINI !!!
================================================================================

ROL & PERSONA:
Je bent de **Senior Lead Architect** van de "BetEdge Scanner" (Extensie).
Je assisteert Johan, een visueel ingestelde "Flow Coder".

CONTEXT & DOEL:
Dit bestand bevat de actuele code van de Scanner EN de gedeelde definities 
met de hoofd-app (BetEdge Pro). 

HIERARCHIE VAN WAARHEID:
1. **_ECOSYSTEM.md**: Leidend voor Database Schema's & Relaties.
2. **src/types.ts**: Leidend voor Datastructuren (Gesynct van Pro App).
3. **_BES_ARCHITECTUUR.md**: Leidend voor Extensie-specifieke techniek.

⚠️ BELANGRIJK: 
- De Scanner is de "Slaaf", de Web App is de "Meester". Wij volgen de configuratie.
- Gebruik Manifest V3 regels (geen persistente variabelen in background).

--- EINDE INSTRUCTIE, HIERONDER VOLGT DE CODEBASE ---
`;

// --- HULPFUNCTIES ---

// Functie om recursief bestanden te zoeken
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    
    // Check of we dit moeten negeren
    if (IGNORE_PATTERNS.includes(file)) return;

    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      // Check extensie
      const ext = path.extname(file);
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

function readFileContent(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    return `[⚠️ Bestand niet gevonden: ${path.relative(ROOT_DIR, filePath)}]`;
  } catch (error) {
    return `[❌ Fout bij lezen: ${error.message}]`;
  }
}

// --- STAP 1: TYPES SYNCHRONISEREN ---
function syncTypes() {
  try {
    console.log('🔄 Types synchroniseren...');
    if (fs.existsSync(PRO_TYPES_PATH)) {
      const content = fs.readFileSync(PRO_TYPES_PATH, 'utf8');
      fs.writeFileSync(LOCAL_TYPES_PATH, content);
      console.log(`✅ Gesynct: ${path.relative(ROOT_DIR, LOCAL_TYPES_PATH)}`);
    } else {
      console.warn(`⚠️  LET OP: Kan bron-types niet vinden op: ${PRO_TYPES_PATH}`);
      console.warn('   (Dit is geen ramp als je lokaal werkt, maar check je paden)');
    }
  } catch (err) {
    console.error('❌ Fout bij synchroniseren types:', err.message);
  }
}

// --- STAP 2: CONTEXT GENEREREN ---
function generateContext() {
  console.log('📂 Context bestand genereren...');
  
  let output = `--- START OF FILE ${OUTPUT_FILE} ---\n\n`;
  output += SYSTEM_PROMPT;
  output += `\n\n`;

  // 1. Verzamel Root Files
  const rootFilePaths = ROOT_FILES_TO_INCLUDE.map(f => path.join(ROOT_DIR, f));

  // 2. Verzamel Src Files (Recursief)
  const srcFilePaths = getAllFiles(SRC_DIR);

  // 3. Combineer en sorteer
  const allFiles = [...rootFilePaths, ...srcFilePaths];

  let fileCount = 0;

  allFiles.forEach(fullPath => {
    // Relatief pad maken voor leesbaarheid (bijv: src/background/index.ts)
    const relativePath = path.relative(ROOT_DIR, fullPath);
    
    // Header toevoegen
    output += `==================================================\n`;
    output += `FILE: ${relativePath}\n`;
    output += `==================================================\n`;
    
    // Inhoud toevoegen
    output += readFileContent(fullPath);
    output += `\n\n`;
    fileCount++;
  });

  const outputPath = path.join(ROOT_DIR, OUTPUT_FILE);
  fs.writeFileSync(outputPath, output);
  
  console.log('================================================================');
  console.log(`✅ KLAAR! ${fileCount} bestanden gebundeld in: ${OUTPUT_FILE}`);
  console.log('================================================================');
}

// --- UITVOEREN ---
syncTypes();
generateContext();