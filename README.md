# IMG2TXT - Conversion d'images en texte

## Aperçu

IMG2TXT est un outil simple convertit efficacement des images en texte. Il traite récursivement les dossiers, préservant la structure dans les fichiers de sortie. C'est une utilisation basique de NodeJS et de la librairie tesseract.js.

## Prérequis

Node.js (v12+)
npm

## Installation

Deux options :
- Exécutez : setup.bat
- En ligne de commande : npm install

## Utilisation

Mettez vous images à convertir dans le dossier input. Vous pouvez les mettre dans des sous-dossiers, la structure sera conservée à la sortie.

Deux options :
- Windows : Exécutez run.bat
- Tous OS : Dans le terminal, npm run start

Récupérez vos fichiers texte dans le dossier output.

*Attention !* Le dossier output est nettoyé à chaque utilisation, pensez à déplacer vos fichiers avant d'en traiter de nouveaux.

## Caractéristiques principales

Traitement récursif des dossiers
Traitement parallèle des images
Nettoyage du texte extrait

## Technologie

Basé sur tesseract.js pour la reconnaissance optique de caractères (OCR)

## Dépannage

Vérifiez les versions de Node.js et npm
Assurez-vous que toutes les dépendances sont installées
Vérifiez les permissions des dossiers

Pour toute autre question, ouvrez une issue sur le dépôt du projet.