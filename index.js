#!/usr/bin/env node
const path = require('path');
const { createWorker, createScheduler } = require('tesseract.js');
const fs = require('fs').promises;

const inputDir = './input';
const outputDir = './output';
const numWorkers = 4;

function cleanText(text) {
    return text
        .split(/\n\s*\n/)
        .map(paragraph => paragraph.replace(/\n/g, ' ')
            .replace(/(\w+)-\s+(\w+)/g, '$1$2')
            .replace(/\s+/g, ' ').trim())
        .join('\n\n');
}

async function processFile(scheduler, filePath, outputPath) {
    try {
        const { data: { text } } = await scheduler.addJob('recognize', filePath);
        const cleanedText = cleanText(text);
        await fs.writeFile(outputPath, cleanedText);
        console.log(`Résultat nettoyé et enregistré dans ${outputPath}`);
    } catch (error) {
        console.error(`Erreur lors du traitement de ${filePath}:`, error);
    }
}

async function getFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.reduce(async (filesPromise, entry) => {
        const files = await filesPromise;
        const res = path.join(dir, entry.name);
        return entry.isDirectory() ? [...files, ...(await getFiles(res))] : [...files, res];
    }, Promise.resolve([]));
}

async function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    try {
        await fs.access(dirname);
    } catch {
        await fs.mkdir(dirname, { recursive: true });
    }
}

async function ensureInputDirectoryExists() {
    try {
        await fs.access(inputDir);
        console.log(`Le dossier ${inputDir} existe.`);
    } catch {
        console.log(`Le dossier ${inputDir} n'existe pas, création en cours...`);
        await fs.mkdir(inputDir, { recursive: true });
    }
}

async function cleanOutputDirectory(dir) {
    try {
        await fs.rm(dir, { recursive: true, force: true });
        console.log(`Dossier de sortie nettoyé : ${dir}`);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error(`Erreur lors du nettoyage du dossier de sortie : ${error}`);
        }
    }
    await fs.mkdir(dir, { recursive: true });
}

(async () => {
    try {
        console.log("Vérification du dossier input...");
        await ensureInputDirectoryExists();

        console.log("Nettoyage du dossier de sortie...");
        const cleanOutputDirPromise = cleanOutputDirectory(outputDir);

        // Création des workers en parallèle du nettoyage
        const scheduler = createScheduler();
        const workerPromises = Array.from({ length: numWorkers }, () => createWorker('fra'));
        const filesPromise = getFiles(inputDir);

        // Nettoyage du dossier output
        await cleanOutputDirPromise;

        // Ajout des workers à mesure qu'ils sont prêts
        (await Promise.all(workerPromises)).forEach(worker => scheduler.addWorker(worker));

        const files = await filesPromise;
        console.log("\nTraitement des fichiers dans le dossier input et ses sous-dossiers:");

        const jobs = files.map(async (filePath) => {
            if (path.extname(filePath).match(/\.(jpg|jpeg|png|gif|bmp|tiff)$/i)) {
                const relativePath = path.relative(inputDir, filePath);
                const outputPath = path.join(outputDir, relativePath.replace(/\.[^/.]+$/, ".txt"));
                await ensureDirectoryExistence(outputPath);
                return processFile(scheduler, filePath, outputPath);
            }
        });

        await Promise.all(jobs);

        // Terminer les workers
        await scheduler.terminate();
    } catch (err) {
        console.error("Une erreur est survenue :", err);
    }
})();
