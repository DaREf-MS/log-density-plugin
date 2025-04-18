- [Guide d'utilisation de l'extension "Log Density Tool"](#guide-dutilisation-de-lextension-log-density-tool)
  - [Table des matières](#table-des-matières)
  - [1. Introduction](#1-introduction)
  - [2. Configuration](#2-configuration)
  - [3. Démarrage](#3-démarrage)
  - [4. Utilisation de l'extension](#4-utilisation-de-lextension)
    - [4.1 Créer un modèle d'apprentissage AI](#41-créer-un-modèle-dapprentissage-ai)
    - [4.2 Analyser un fichier JAVA pour obtenir la densité d’instructions de journalisation appropriée](#42-analyser-un-fichier-java-pour-obtenir-la-densité-dinstructions-de-journalisation-appropriée)
    - [4.3 Analyser plusieurs fichiers JAVA pour obtenir la densité d’instructions de journalisation appropriée](#43-analyser-plusieurs-fichiers-java-pour-obtenir-la-densité-dinstructions-de-journalisation-appropriée)
    - [4.4 Ajouter des instructions de journalisation aux endroits où il en manque](#44-ajouter-des-instructions-de-journalisation-aux-endroits-où-il-en-manque)

# Guide d'utilisation de l'extension "Log Density Tool"

## Table des matières

## 1. Introduction

Bienvenue dans le guide d'utilisation de l'extension "Log Density Tool", conçue pour suggérer la densité d’instructions de journalisation appropriée pour un fichier Java donné. Ce guide facilitera votre prise en main de l'outil.

## 2. Configuration

- Faire "npm install" dans le dossier "logdensitytool" pour être capable de lancer l'extension.

## 3. Démarrage

- Lancer l'extension en appuyant sur le bouton F5.

![L'extension démarrée](../resources/userGuide/image.png)

## 4. Utilisation de l'extension

### 4.1 Créer un modèle d'apprentissage AI

- Accéder aux commandes du menu de la barre de recherche en appuyant sur Ctrl + Shift + P.

![Commandes](../resources/userGuide/image-1.png)

- Taper "Send GitHub URL" dans la barre de recherche et sélectionnez cette option.

![Send GitHub URL](../resources/userGuide/image-2.png)

- Saisir l'URL d'un projet GitHub. Si un modèle AI a déjà été entraîné sur un même projet, l'entraînement
  ne se fera pas de nouveau et un message s'affiche à l'utilisateur pour l'avertir que le modèle a déjà été entraîné.

![Saisir l'URL](../resources/userGuide/image-3.png)

- Attendre que l'entraînement du modèle finisse. Une fois l'entraînement terminé, les fichiers du modèle entraîné se trouvent dans le sous-dossier "training_data" du dossier "services" dans l'explorateur de fichiers.

![Entraînement](../resources/userGuide/image-5.png)

![Explorateur de fichiers](../resources/userGuide/image-6.png)

### 4.2 Analyser un fichier JAVA pour obtenir la densité d’instructions de journalisation appropriée

- Ouvrir le projet qui a été entraîné en cliquant sur open folder et en allant sélectionner son dossier dans training_data.

![Ouvrir un dossier](../resources/userGuide/image-7.png)

![Sélectionner le dossier](../resources/userGuide/image-8.png)

- Ouvrir le fichier JAVA désiré en cliquant dessus depuis l'explorateur de fichier qui se trouve dans la fenêtre qui a été ouverte après avoir pesé sur F5 au début.

![Ouvrir un fichier JAVA](../resources/userGuide/image-9.png)

- Visualiser dans le fichier ouvert la densité actuelle et la densité désirée affichées sous forme de catégories une fois qu'elles apparaissent dans le fichier. L'analyse se fait automatiquement à l'ouverture du fichier. Il est possible
  de voir les fichiers ouverts dans la vue "CURRENTLY OPENED TABS" et de faire une analyse pour obtenir les densités actuelles et désirées en chiffres sur les fichiers ouverts en cliquant sur "Analyze Open Tabs".

![Analyse en catégories](../resources/userGuide/image-12.png)

![Analyse Open Tabs](../resources/userGuide/image-13.png)

![Analyse en chiffres](../resources/userGuide/image-14.png)

### 4.3 Analyser plusieurs fichiers JAVA pour obtenir la densité d’instructions de journalisation appropriée

- Ouvrir le projet qui a été entraîné en cliquant sur open folder et en allant sélectionner son dossier dans training_data.

![Ouvrir un dossier](../resources/userGuide/image-7.png)

![Sélectionner le dossier](../resources/userGuide/image-8.png)

- Sélectionner "Add File" pour choisir le(s) dossier(s) ou le(s) fichier(s) JAVA à analyser dans la vue "JAVA FILES". Si un dossier est sélectionné, tous les fichiers JAVA de ses sous-dossiers sont ajoutés également. Les dossiers ou fichiers ajouté se trouvent dans la vue "JAVA FILES TO ANALYZE".

![Add File](../resources/userGuide/image-17.png)

![JAVA FILES TO ANALYZE](../resources/userGuide/image-16.png)

- Retirer un fichier au besoin en cliquant sur "Remove File". Il est possible de retirer tous les fichiers en cliquant sur "Remove All Files".

![Remove Files](../resources/userGuide/image-18.png)

- Lancer l'analyse en cliquant sur l'icône de la flèche bleue "Send Selected Files for Analysis". Les densités, affichées en chiffres, seront visibles dans la vue "JAVA FILES". Un icône de couleur se trouve à côté des fichiers analysés. Ces couleurs varient de "Faible" à "Élevée". "Faible" est indiquée par le vert, "Moyenne" par le jaune, et "Élevée" par le rouge. Elles représentent la différence entre la densité actuelle et suggérée. Si la différence est faible entre les deux densités, la couleur est verte et la logique s'en suit pour les autres couleurs.

![Flèche Bleue](../resources/userGuide/image21.png)

![Analyse de fichiers](../resources/userGuide/image-20.png)

### 4.4 Ajouter des instructions de journalisation aux endroits où il en manque

- Ouvrir le dossier sur lequel on veut ajouter de la journalisation.
![Ouvrir dossier](../resources/userGuide/open_folder.png)

- Une fois le dossier ouvert, sélectionner le ou les fichiers qui seront la cible de l'ajout de journalisation. À noter que les fichiers peuvent être ajoutés tout d'un coup en appuyant sur "Add file" tout en haut du dossier.

![Choisir Fichiers](../resources/userGuide/select_files.png)

- Une fois les fichiers sélectionnés, appuyer sur le bouton "Send Files for Analysis and add missing logs" afin de démarrer le processus d'ajouts de journalisation.

![Ajout Logs](../resources/userGuide/add_missing_logs.png)

- Il est aussi possible de simplement ajouter de la journalisation dans les fichiers actuellement ouverts, ici.

![Ajout Logs fichiers ouverts](../resources/userGuide/add_missing_logs2.png)

- Une fois le processus lancé, simplement attendre que celui-ci soit complété en observant les informations données en bas à gauche de l'écran.

![Information sur l'ajout de logs](../resources/userGuide/add_missing_logs_info.png)

- Une fois l'ajout de journalisation terminé, il suffit de sauvegarder le fichier afin de mettre à jour l'analyse de densité de celui-ci et d'observer les changements apportés. Une instruction de journalisation ainsi qu'un commentaire expliquant le raisonnement auront été ajoutés aux endroits ayant une densité trop basse.

![ajout de logs terminé](../resources/userGuide/add_missing_logs_end.png)
