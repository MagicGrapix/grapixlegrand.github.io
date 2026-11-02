# Portfolio

La refonte Gateway conserve le site statique et le contenu éditable. Les textes de l’accueil viennent de `content/home.md`, les cartes de `cards/*.json` et les articles de `pages/*/article.md`. Le HTML complet est généré avant publication : aucun serveur Node.js n’est nécessaire chez GitHub Pages. Les treize cartes restent présentes dans le HTML initial ; les dix fiches interactives et les trois articles conservent leurs destinations.

## Écrire et prévisualiser en local

Prérequis : Node.js 22 ou plus récent (24 en CI) et npm.

Depuis la racine du dépôt, une première fois :

```powershell
npm ci
npm run build
```

Puis une seule commande :

```powershell
npm run dev
```

Ouvrir <http://127.0.0.1:8000/>. Pour le téléphone, utiliser l’adresse `Network` correspondant au Wi-Fi du PC, sur le même réseau. Le 1 novembre 2026, cette adresse est <http://192.168.1.5:8000/> ; elle peut changer. Le PC doit rester allumé et le serveur démarré. `Ctrl+C` arrête un serveur lancé dans le terminal.

Modifier le Markdown, un template ou un JSON : le HTML est régénéré et les navigateurs ouverts se rechargent automatiquement. Les changements de styles, scripts et images rechargent aussi la page. Une erreur de génération laisse les dernières pages valides en place. Redémarrer après modification de `scripts/` ou `CNAME`. `PORT` change le port ; `HOST=127.0.0.1` limite le serveur au PC. Le serveur ne publie rien sur Internet, n’affiche pas les répertoires et ne sert pas `.git`, `node_modules` ou les sources d’édition.

`npm run watch` reste disponible pour reconstruire sans serveur. Pour arrêter le serveur lancé en arrière-plan pendant cette session : lire son identifiant dans `.dev/server.pid`, vérifier que ce processus est bien `node scripts/dev.mjs`, puis arrêter ce processus. Les journaux sont dans `.dev/`, ignoré par Git.

## Sources à modifier

- `pages/<slug>/article.md` : texte de l'article, liens, illustrations et légendes. Le Markdown accepte aussi les blocs HTML existants.
- `content/home.md` : rôles, courtes notes, biographie, parcours et compétences. Conserver les rubriques `Roles`, `Notes`, `About`, `Background`, `Toolkit` ; le texte à l’intérieur reste libre. `Roles` et `Notes` sont des listes Markdown.
- `pages/<slug>/template.html` : titre, description et structure de l'article. Le style commun vient de `assets/reader.css`. Conserver une occurrence des marqueurs `<!-- SEO -->` et `<!-- ARTICLE -->`.
- `templates/home.html` : structure de l'accueil ; conserver les marqueurs `HOME`, `CARDS`, `SEO` et `STRUCTURED_DATA`.
- `cards/*.json` : contenu et ordre des cartes. `year` affiche la date près du titre ; `action` personnalise le lien, `alt` le texte alternatif de l’image. Une propriété `link` crée un lien classique ; une propriété `detail` conserve une fiche interactive. Ajouter un projet dans `projects` puis son identifiant dans `order` : la grille s’agrandit automatiquement.
- `cards/*.html` : fiches existantes, chargées à l'ouverture de leur fenêtre.
- `style.css`, `assets/portfolio.js`, `assets/article.js` : styles et interactions.
- `assets/gateway.css`, `assets/gateway.js` : présentation et interactions de l’accueil. `assets/portrait-code.js` anime uniquement le code autour du portrait et respecte les préférences de mouvement réduit. Les polices sont hébergées dans `assets/fonts/`.
- `assets/gateway-intro.css` : présentation en deuxième écran et balayage initial du nom. `assets/refinements.css` centre la navigation, adapte About aux petits écrans et présente cinq liens de profil sur mobile. Le parcours guidé est titre ↔ présentation ↔ projets ; une présentation trop haute reste librement défilable avant le passage aux projets. Le contact seul reste à la fin.
- `assets/gateway-base.css` : palette et polices communes à toutes les pages. `assets/project-sheets.css` habille les fiches et leurs galeries ; `assets/reader.css` habille les articles et rapports.
- `cg22/report.html`, `SuperVoxel/index.html`, `SuperVoxel/SuperVoxel.html`, `shuffling/story.html` : anciens rapports HTML, édités directement. Ils partagent le style de lecture Gateway. Les visualisations scientifiques intégrées conservent leur interface d’origine.
- `CNAME` : domaine public, utilisé pour les URL canoniques et le sitemap.

Ne pas éditer manuellement les fichiers générés : `index.html`, `pages/*/index.html`, `sitemap.xml` et `robots.txt`. Ils sont versionnés pour que GitHub Pages puisse les servir directement. Les anciens `index.md` ne participent pas à la génération.

Pour ajouter un article, créer `pages/<slug>/article.md` avec exactement un H1, copier un template existant en adaptant son titre, sa description et ses informations visibles, puis ajouter un lien dans le JSON de la catégorie voulue. `npm run build` découvre automatiquement le nouvel article. Les chemins d'images restent relatifs à son dossier. Chaque image doit avoir un attribut `alt` (vide seulement si elle est décorative).

## Vérifier

```powershell
npm test
npm run check
npm run test:gateway
```

`npm test` vérifie la génération, les erreurs, les métadonnées et le contrat des cartes. `npm run check` vérifie les ressources locales référencées et échoue si les fichiers générés ne correspondent plus aux sources, sans écrire de fichiers.

Avec le serveur local démarré, les tests navigateur utilisent Edge sous Windows :

```powershell
npm run test:browser -- --functional-only
npm run test:readers
```

Sur un autre système, installer d'abord Chromium avec `npx playwright install chromium`. `SITE_URL` permet de choisir une autre adresse locale et `BROWSER_CHANNEL` un autre navigateur installé. Les tests couvrent ordinateur/mobile, les trois articles sans JavaScript, les dix fiches, les images non interactives des articles et les galeries des fiches. Les lecteurs externes YouTube/itch.io sont exclus des tests automatisés. Les captures sont dans `test-results/`, ignoré par Git.

`npm run test:gateway` couvre les allers-retours titre/présentation/projets à la molette et au clavier, le défilement libre, les flux de particules dans les deux sens, le balayage du nom, l’aberration chromatique, la progression, une fiche, le mouvement réduit et la lecture sans JavaScript. Il vérifie aussi les transitions avec des gestes tactiles simulés et la présentation mobile ajustée à un écran. `npm run test:scroll` reproduit le retour vers About après un petit défilement dans les projets, au survol de cartes liens et boutons ainsi qu’au toucher simulé. Captures : `test-results/gateway/`.

`npm run test:readers` vérifie les sept URL d’articles et rapports sur ordinateur et mobile, les ressources locales, l’absence de débordement, le comparateur CG22 et la lecture sans JavaScript. Captures : `test-results/readers/`. Le rapport Shuffling signale une illustration déjà absente de l’archive (`story_4_3.png`) ; sa légende est conservée.

La commande historique `node tests/browser.mjs --baseline` enregistre la géométrie de l’ancien design ; elle reste utile pour la migration précédente. `node tests/browser.mjs --functional-only` vérifie les articles et toutes les fiches sans comparer leur géométrie à l’ancien accueil. Ne pas remplacer les anciennes références pour masquer une régression. Les résultats historiques restent dans [docs/validation.md](docs/validation.md).

## Préparer la publication

1. Exécuter `npm run build`, `npm test` et `npm run check`.
2. Relire le résultat local et le diff, y compris les HTML générés.
3. Versionner les sources **et** les fichiers générés dans le même commit.
4. Après validation du propriétaire, pousser vers la branche utilisée par GitHub Pages.

Le déploiement observé sur GitHub utilise `master` et le workflow automatique `pages-build-deployment`. `.nojekyll` permet de servir ces fichiers statiques sans transformation Jekyll. La nouvelle CI contrôle leur cohérence ; elle ne déploie rien et ne bloque pas à elle seule le déploiement Pages existant. Aucun push ni déploiement n'est exécuté par les scripts locaux.

Le sitemap contient l'accueil, les trois articles et les trois rapports HTML publics existants. Il exclut les templates, les fragments et les sources Markdown. `robots.txt` autorise l'exploration générale et référence le sitemap ; aucune règle spécifique à l'entraînement des modèles n'a été ajoutée. Cela rend le contenu accessible, sans garantir son indexation ni sa citation par un service donné.

L’accueil ajoute des données structurées `Person`, `ProfilePage` et `WebSite` cohérentes avec le texte visible, ainsi que des métadonnées Twitter/Open Graph. Les URL canoniques restent celles de `CNAME`. Les principes SEO servent aussi la lisibilité par les moteurs génératifs : [documentation Google](https://developers.google.com/search/docs/appearance/ai-features). Le contenu détaillé des dix fiches conserve pour l’instant son affichage JavaScript ; leurs résumés sont directement lisibles dans l’accueil.

Le portrait choisi est `assets/portrait-selected.png` : photo personnelle IMG_8263, détourée et retouchée, validée dans l’aperçu. Son cadrage est défini par `assets/portrait-selected.css` et `assets/refinements.css`. Les données Person et les métadonnées de l’accueil utilisent cette même photo. Le CV reste le PDF existant.

`npm run test:mobile` vérifie les états tactiles sans survol persistant, le retour depuis un lien externe, la reprise des animations après restauration de page, le glissement sur les cartes sans ouverture, les appuis volontaires, le survol à la souris et le focus clavier. Les captures couvrent aussi About sur un écran mobile court. Ces essais utilisent une simulation tactile Chromium ; ils ne remplacent pas un essai sur iPhone physique. Les styles de survol sont limités aux appareils avec survol et pointeur fin ; le focus clavier reste indépendant.

`npm run test:motion` vérifie les flèches au même niveau sur desktop et deux tailles de téléphone, les entrées des titres et cartes sur mobile (y compris au retour), le mouvement réduit et l’absence de débordement. Captures : `test-results/platform-motion/`. Les particules sont renforcées uniquement au-dessus de 900 px avec un pointeur fin ; leurs réglages tactiles sont conservés.

`npm run test:native` vérifie le déplacement pendant un glissement du doigt, les gestes courts et longs, la reprise immédiate après les flèches, le défilement libre jusqu’au contact et les liaisons de particules (épaisseur variable, couleurs interpolées, masquage sous les points). Le mobile utilise un seul défilement natif : deux écrans d’introduction avec points d’arrêt, puis une grande zone de contenu libre. Les boutons pause/relecture ont été retirés à la demande du propriétaire ; le mouvement réduit du système reste respecté.
