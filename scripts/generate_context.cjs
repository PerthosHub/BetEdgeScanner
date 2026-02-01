// FILE: scripts/generate_context.cjs

/**
 * 🛠️ PROJECT CONTEXT GENERATOR (Versie 3.0 - Linked Edition)
 * 
 * WAT DOET DIT SCRIPT?
 * Dit script verzamelt alle verspreide bestanden van je project en bundelt ze 
 * in één groot tekstbestand: '_PROJECT_CONTEXT_SCANNER.txt'.
 * 
 * WAAROM IS DIT SLIM?
 * In plaats van 20 losse bestanden te uploaden naar AI Studio, upload je er nu 
 * nog maar één. De AI heeft direct het volledige overzicht van je code, 
 * je database-regels en je planning.
 */

const fs = require('fs');
const path = require('path');

// --- 1. CONFIGURATIE ---
const OUTPUT_FILE = '_PROJECT_CONTEXT_SCANNER.txt';
const ROOT_DIR    = path.resolve(__dirname, '..'); 
const SRC_DIR     = path.join(ROOT_DIR, 'src');

// Welke bestandstypen moet de AI kunnen lezen?
const ALLOWED_EXTENSIONS = ['.ts', '.tsx', '.css', '.json', '.md'];

// Bestanden die we NIET naar de AI sturen (om de chat "schoon" te houden)
const IGNORE_PATTERNS = [
  'vite-env.d.ts', 
  'node_modules',
  'dist',
  '.DS_Store',
  '_PROJECT_CONTEXT_SCANNER.txt' // Voorkomt dat het script zichzelf inleest
];

/**
 * 📂 ROOT FILES: De belangrijkste documenten buiten de 'src' map.
 * Hier leggen we aan de AI uit WAAROM deze bestanden belangrijk zijn.
 */
const ROOT_FILES_TO_INCLUDE = [
  '_ECOSYSTEM.md',     // De "Grondwet": Bevat de database velden en business rules.
  '_BES_ROADMAP.md',   // De "Routekaart": Vertelt de AI wat we al gedaan hebben en wat nog moet.
  'package.json',      // De "Gereedschapskist": Laat zien welke bibliotheken (libraries) we gebruiken.
  'tsconfig.json',     // De "Taalregels": Vertelt de computer hoe hij TypeScript moet begrijpen.
  'vite.config.ts'     // De "Blauwdruk": Bevat de permissies en instellingen van de extensie.
];

// --- 2. HULPFUNCTIES (De motor) ---

/**
 * Zoekt alle bestanden in de mappen, behalve de negeer-lijst.
 */
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    
    if (IGNORE_PATTERNS.includes(file)) return;

    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      const ext = path.extname(file);
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

/**
 * Leest de tekst uit een bestand veilig uit.
 */
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

// --- 3. UITVOERING ---

function generateContext() {
  console.log('📂 Context bestand voor AI Studio opbouwen...');
  
  // We beginnen de bundel met een duidelijke start-markering
  let output = `--- START OF CONTEXT BUNDLE: ${OUTPUT_FILE} ---\n`;
  output += `Gegenereerd op: ${new Date().toLocaleString()}\n`;
  output += `Info: types.ts en _ECOSYSTEM.md zijn via Hard Links gesynct met BEP.\n\n`;

  // A. Bestanden uit de hoofdmap verzamelen
  const rootFilePaths = ROOT_FILES_TO_INCLUDE.map(f => path.join(ROOT_DIR, f));

  // B. Alle broncode uit de 'src' map verzamelen
  const srcFilePaths = getAllFiles(SRC_DIR);

  // C. De lijsten samenvoegen
  const allFiles = [...rootFilePaths, ...srcFilePaths];

  let fileCount = 0;

  allFiles.forEach(fullPath => {
    const relativePath = path.relative(ROOT_DIR, fullPath);
    
    // Visuele scheiding per bestand zodat de AI weet waar een nieuw bestand begint
    output += `==================================================\n`;
    output += `FILE: ${relativePath}\n`;
    output += `==================================================\n`;
    
    output += readFileContent(fullPath);
    output += `\n\n`;
    fileCount++;
  });

  const outputPath = path.join(ROOT_DIR, OUTPUT_FILE);
  fs.writeFileSync(outputPath, output);
  
  console.log('================================================================');
  console.log(`✅ KLAAR! ${fileCount} bestanden gebundeld voor AI Studio.`);
  console.log(`👉 Bestand: ${OUTPUT_FILE}`);
   console.log(`✅ Structured Outputs = screenshot feitelijk(JSON) in kunnen lezen`);
   console.log(`✅ Code Execution = bijvoorbeeld wiskund of regels tellen`);
   console.log(`❌ Function calling = niet handig voor nu. bv Supabase direct aansturen`);
   console.log(`✅ Google search = Aanzetten`);
   console.log(`☑️ URL Context = handig om bijvoorbeeld toto website te kunnen lezen`);
   console.log(`👉 Pro vs Flash = Je kan in een chat wisselen, maar gebruik pro voor complexe vragen en code`);
  console.log('================================================================');
}

// Start het proces
generateContext();