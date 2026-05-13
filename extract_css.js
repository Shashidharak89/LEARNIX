/* eslint-env node */
/* global require */
const fs = require('fs');

const cssPath = 'src/app/components/styles/HeroSection.css';
let css = fs.readFileSync(cssPath, 'utf8');

// Regex to capture standard rules
const rulesToExtract = [
  /\n\.learnix-nav-card-grid\s*{[\s\S]*?\n}/,
  /\n\.learnix-nav-card\s*{[\s\S]*?\n}/,
  /\n\.learnix-nav-card:hover\s*{[\s\S]*?\n}/,
  /\n\.learnix-nav-card-icon\s*{[\s\S]*?\n}/,
  /\n\.learnix-nav-card:hover\s*\.learnix-nav-card-icon\s*{[\s\S]*?\n}/,
  /\n\.learnix-nav-card-highlight\s*{[\s\S]*?\n}/,
  /\n\.learnix-nav-card-highlight::after\s*{[\s\S]*?\n}/,
];

let extractedCSS = '';

for (const rule of rulesToExtract) {
  const match = css.match(rule);
  if (match) {
    extractedCSS += match[0].trim() + '\n\n';
    css = css.replace(match[0], '');
  }
}

// Handle the missing media query parts
// I will just use regular expressions carefully to pull them out.
const mqMedia1 = /\n\s*\.learnix-nav-card-grid\s*{[^}]*}\n\n\s*\.learnix-nav-card\s*{[^}]*}\n\n\s*\.learnix-nav-card-icon\s*{[^}]*}/  ;
const matchMedia1 = css.match(mqMedia1);
if (matchMedia1) {
  extractedCSS += '@media (max-width: 1350px) {\n' + matchMedia1[0] + '\n}\n\n';
  css = css.replace(matchMedia1[0], '');
}

const mqMedia768 = /\n\s*\.learnix-nav-card-icon\s*{[^}]*}/;
const matchMedia768 = css.match(mqMedia768);
// We might have multiple of these, we need to be careful.

