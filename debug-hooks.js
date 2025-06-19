#!/usr/bin/env node

/**
 * Script de diagnostic pour identifier les problèmes de hooks React
 * Usage: node debug-hooks.js
 */

const fs = require('fs');
const path = require('path');

function findFiles(dir, extension = '.tsx') {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results = results.concat(findFiles(filePath, extension));
    } else if (file.endsWith(extension)) {
      results.push(filePath);
    }
  });
  
  return results;
}

function analyzeHooks(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  // Ignorer les fichiers firebase qui ne sont pas des composants React
  if (filePath.includes('firebase/') && !filePath.includes('components/')) {
    return []; // Les fichiers Firebase n'utilisent pas de hooks React
  }
  
  // Trouver les composants React
  let inComponent = false;
  let componentStartLine = -1;
  let firstHookLine = -1;
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Détecter le début d'un composant React
    if (line.includes('= () => {') || 
        line.includes(': React.FC') || 
        line.includes('function ') && line.includes('() {') && 
        !line.includes('const ') && !line.includes('export const')) {
      inComponent = true;
      componentStartLine = lineNum;
      firstHookLine = -1;
    }
    
    // Détecter la fin d'un composant
    if (inComponent && line.trim() === '};' && index > componentStartLine + 5) {
      inComponent = false;
    }
    
    if (!inComponent) return;
    
    // Vérifier les hooks dans le composant
    if (line.includes('useState') || line.includes('useEffect') || 
        line.includes('useCallback') || line.includes('useMemo') ||
        line.includes('useRouter') || line.includes('useFonts')) {
      
      if (firstHookLine === -1) {
        firstHookLine = lineNum;
      }
      
      // Vérifier s'il y a des déclarations de variables APRÈS le premier hook
      if (firstHookLine > 0 && lineNum > firstHookLine) {
        // Chercher dans les lignes précédentes depuis le premier hook
        for (let i = firstHookLine; i < index; i++) {
          const prevLine = lines[i];
          if (prevLine.includes('const ') && !prevLine.includes('use') && 
              !prevLine.includes('//') && !prevLine.includes('import') &&
              prevLine.includes('=') && !prevLine.includes('useState') &&
              !prevLine.includes('useEffect')) {
            issues.push({
              file: filePath,
              line: lineNum,
              type: 'HOOK_ORDER_ISSUE',
              content: line.trim(),
              description: 'Variable déclarée entre les hooks - Ordre incorrect'
            });
            break;
          }
        }
      }
    }
    
    // Vérifier les dependency arrays avec des valeurs potentiellement undefined
    if (line.includes('useEffect') || line.includes('useCallback') || line.includes('useMemo')) {
      const nextLines = lines.slice(index, index + 10).join('\n');
      
      // Chercher des patterns problématiques dans les dependency arrays
      if (nextLines.includes('], [') && nextLines.includes('?.')) {
        issues.push({
          file: filePath,
          line: lineNum,
          type: 'POTENTIAL_UNDEFINED_DEPENDENCY',
          content: line.trim(),
          description: 'Dépendance potentiellement undefined dans un hook'
        });
      }
      
      // Vérifier les dependency arrays manquants
      if (nextLines.includes('}, [') && !nextLines.includes('}, [])')) {
        const dependencyMatch = nextLines.match(/}, \[(.*?)\]/);
        if (dependencyMatch && !dependencyMatch[1].trim()) {
          issues.push({
            file: filePath,
            line: lineNum,
            type: 'EMPTY_DEPENDENCIES',
            content: line.trim(),
            description: 'Dependency array vide mais le hook utilise probablement des variables externes'
          });
        }
      }
    }
    
    // Vérifier les hooks dans des conditions (plus précis)
    if (inComponent && line.trim().startsWith('if') && line.includes('{')) {
      const nextLines = lines.slice(index, index + 3).join('\n');
      if (nextLines.includes('useState') || nextLines.includes('useEffect')) {
        issues.push({
          file: filePath,
          line: lineNum,
          type: 'CONDITIONAL_HOOK',
          content: line.trim(),
          description: 'Hook appelé conditionnellement - Violation des règles de React'
        });
      }
    }
  });
  
  return issues;
}

function main() {
  console.log('🔍 Diagnostic des hooks React...\n');
  
  const appDir = './app';
  const files = findFiles(appDir);
  let totalIssues = 0;
  
  files.forEach(file => {
    const issues = analyzeHooks(file);
    if (issues.length > 0) {
      console.log(`❌ ${file}:`);
      issues.forEach(issue => {
        console.log(`   Ligne ${issue.line}: ${issue.type}`);
        console.log(`   Code: ${issue.content}`);
        console.log(`   Description: ${issue.description}\n`);
        totalIssues++;
      });
    }
  });
  
  if (totalIssues === 0) {
    console.log('✅ Aucun problème de hook détecté!');
  } else {
    console.log(`🚨 ${totalIssues} problème(s) potentiel(s) détecté(s)`);
  }
  
  console.log('\n🔧 Recommandations:');
  console.log('1. Vérifiez que tous les hooks sont au début du composant');
  console.log('2. Assurez-vous que les dependency arrays incluent toutes les dépendances');
  console.log('3. Évitez les valeurs undefined dans les dependency arrays');
  console.log('4. N\'appelez jamais de hooks conditionnellement');
}

if (require.main === module) {
  main();
}
