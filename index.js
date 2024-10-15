#!/usr/bin/env node
const path = require('path');
const { createWorker, createScheduler } = require('tesseract.js');
const fs = require("fs").promises;

const inputDir = './input';
const outputDir = './output';
const numWorkers = 2; // Nombre de workers à utiliser

function cleanText(text) {
    const paragraphs = text.split(/\n\s*\n/);
    return paragraphs.map(paragraph => {
        let cleaned = paragraph.replace(/\n/g, ' ');
        cleaned = cleaned.replace(/(\w+)-\s+(\w+)/g, '$1$2');
        cleaned = cleaned.replace(/\s+/g, ' ');
        return cleaned.trim();
    }).join('\n\n');
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
    const files = await Promise.all(entries.map(async (entry) => {
        const res = path.resolve(dir, entry.name);
        return entry.isDirectory() ? getFiles(res) : res;
    }));
    return files.flat();
}

async function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    try {
        await fs.access(dirname);
    } catch (error) {
        await fs.mkdir(dirname, { recursive: true });
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
        console.log("Nettoyage du dossier de sortie...");
        await cleanOutputDirectory(outputDir);

        const scheduler = createScheduler();
        const workers = await Promise.all(
            Array(numWorkers).fill(0).map(() => createWorker('fra'))
        );
        workers.forEach(worker => scheduler.addWorker(worker));

        const files = await getFiles(inputDir);
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

        await scheduler.terminate();
    } catch (err) {
        console.error("Une erreur est survenue :", err);
    }
})();