# Portfolio

La refonte Gateway conserve le site statique et le contenu éditable. Les textes de l’accueil viennent de `content/home.md`, les cartes de `cards/*.json` et les articles de `pages/*/article.md`. Le HTML complet est généré avant publication : aucun serveur Node.js n’est nécessaire chez GitHub Pages. Les treize cartes de l’accueil restent présentes dans le HTML initial, dont les six projets sélectionnés inchangés. Les dix fiches interactives et les trois articles existants conservent leurs destinations. Le lien « More Projects », sous les six projets sélectionnés, mène à `/projects/` et à un quatrième article sur la super-résolution.

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

Modifier le Markdown, un template ou un JSON : le HTML est régénéré et les navigateurs ouverts se rechargent automatiquement. Les changements de styles, scripts et images sous `assets/` ou `resources/`, ainsi que `style.css` et les fiches HTML, rechargent aussi la page. Une modification d’image seule sous `pages/<slug>/images/` demande encore un rechargement manuel du navigateur. Une erreur de génération laisse les dernières pages valides en place. Redémarrer après modification de `scripts/` ou `CNAME`. `PORT` change le port ; `HOST=127.0.0.1` limite le serveur au PC. Le serveur ne publie rien sur Internet, n’affiche pas les répertoires et ne sert pas `.git`, `node_modules` ou les sources d’édition.

`npm run watch` reste disponible pour reconstruire sans serveur. Pour arrêter le serveur lancé en arrière-plan pendant cette session : lire son identifiant dans `.dev/server.pid`, vérifier que ce processus est bien `node scripts/dev.mjs`, puis arrêter ce processus. Les journaux sont dans `.dev/`, ignoré par Git.

## Sources à modifier

- `pages/<slug>/article.md` : texte de l'article, liens, illustrations et légendes. Le Markdown accepte aussi les blocs HTML existants.
- `content/home.md` : rôles, courtes notes, biographie, parcours et compétences. Conserver les rubriques `Roles`, `Notes`, `About`, `Background`, `Toolkit` ; le texte à l’intérieur reste libre. `Roles` et `Notes` sont des listes Markdown.
- `pages/<slug>/template.html` : titre, description et structure de l'article. Le style commun vient de `assets/reader.css`. Conserver une occurrence des marqueurs `<!-- SEO -->` et `<!-- ARTICLE -->`.
- `templates/home.html` : structure de l'accueil ; conserver les marqueurs `HOME`, `CARDS`, `SEO` et `STRUCTURED_DATA`.
- `templates/projects.html` et `cards/more-projects.json` : structure, contenu et ordre de l’archive `/projects/`. Utiliser des liens d’articles et des images relatifs à la racine (`/pages/...`) ; conserver les marqueurs `SEO` et `CARDS:more-projects`. Cette archive ajoute des articles sans modifier les six projets sélectionnés de l’accueil.
- `cards/*.json` : contenu et ordre des cartes. `year` affiche la date près du titre ; `action` personnalise le lien, `alt` le texte alternatif de l’image. Une propriété `link` crée un lien classique ; une propriété `detail` conserve une fiche interactive. Ajouter un projet dans `projects` puis son identifiant dans `order` : la grille s’agrandit automatiquement.
- `cards/*.html` : fiches existantes, chargées à l'ouverture de leur fenêtre.
- `style.css`, `assets/portfolio.js`, `assets/article.js` : styles et interactions.
- `assets/gateway.css`, `assets/gateway.js` : présentation et interactions de l’accueil. `assets/portrait-code.js` anime uniquement le code autour du portrait et respecte les préférences de mouvement réduit. Les polices sont hébergées dans `assets/fonts/`.
- `assets/gateway-intro.css` : présentation en deuxième écran et balayage initial du nom. `assets/refinements.css` centre la navigation, adapte About aux petits écrans et présente cinq liens de profil sur mobile. Le parcours guidé est titre ↔ présentation ↔ projets ; une présentation trop haute reste librement défilable avant le passage aux projets. Le contact seul reste à la fin.
- `assets/projects.css` : archive et lien « More Projects ». `assets/super-resolution.css` et `assets/image-compare.js` : figures de l’article et comparaisons interactives, avec deux images visibles sans JavaScript.
- `assets/gateway-base.css` : palette et polices communes à toutes les pages. `assets/project-sheets.css` habille les fiches et leurs galeries ; `assets/reader.css` habille les articles et rapports.
- `cg22/report.html`, `SuperVoxel/index.html`, `SuperVoxel/SuperVoxel.html`, `shuffling/story.html` : anciens rapports HTML, édités directement. Ils partagent le style de lecture Gateway. Les visualisations scientifiques intégrées conservent leur interface d’origine.
- `CNAME` : domaine public, utilisé pour les URL canoniques et le sitemap.

Ne pas éditer manuellement les fichiers générés : `index.html`, `projects/index.html`, `pages/*/index.html`, `sitemap.xml` et `robots.txt`. Ils sont versionnés pour que GitHub Pages puisse les servir directement. Les anciens `index.md` ne participent pas à la génération.

Pour ajouter un article, créer `pages/<slug>/article.md` avec exactement un H1, copier un template existant en adaptant son titre, sa description et ses informations visibles, puis ajouter un lien dans le JSON de la catégorie voulue. `npm run build` découvre automatiquement le nouvel article. Les chemins d'images restent relatifs à son dossier. Chaque image doit avoir un attribut `alt` (vide seulement si elle est décorative). Pour un article supplémentaire, ajouter sa carte dans `cards/more-projects.json` : `build`, `watch` et `dev` prennent déjà en charge cette archive et les nouveaux articles. Les dix images de super-résolution proviennent du rapport original ; leur provenance, leurs recadrages et leurs dimensions sont consignés dans `pages/image-super-resolution/images/sources.json` et les sidecars `*.webp.json`. Voir [le brief](docs/super-resolution-brief.md) et [les sources](docs/super-resolution-sources.md).

## Vérifier

```powershell
npm test
npm run check
npm run test:gateway
```

`npm test` vérifie la génération, les erreurs, les métadonnées et le contrat des cartes : treize cartes d’accueil, dont six projets sélectionnés, dix fiches, quatre articles générés, une carte d’archive, deux comparateurs et neuf URL dans le sitemap. `npm run check` vérifie les ressources locales référencées et échoue si les fichiers générés ne correspondent plus aux sources, sans écrire de fichiers.

Avec le serveur local démarré, les tests navigateur utilisent Edge sous Windows :

```powershell
npm run test:browser -- --functional-only
npm run test:readers
```

Sur un autre système, installer d'abord Chromium avec `npx playwright install chromium`. `SITE_URL` permet de choisir une autre adresse locale et `BROWSER_CHANNEL` un autre navigateur installé. Cette suite historique couvre ordinateur/mobile, les trois articles préexistants sans JavaScript, les dix fiches, les images non interactives des articles et les galeries des fiches. Les lecteurs externes YouTube/itch.io sont exclus des tests automatisés. Les captures sont dans `test-results/`, ignoré par Git.

`npm run test:gateway` couvre les allers-retours titre/présentation/projets à la molette et au clavier, le défilement libre, les flux de particules dans les deux sens, le balayage du nom, l’aberration chromatique, la progression, une fiche, le mouvement réduit et la lecture sans JavaScript. Il vérifie aussi les transitions avec des gestes tactiles simulés et la présentation mobile ajustée à un écran. `npm run test:scroll` reproduit le retour vers About après un petit défilement dans les projets, au survol de cartes liens et boutons ainsi qu’au toucher simulé. Captures : `test-results/gateway/`.

`npm run test:readers` vérifie les sept URL historiques d’articles et rapports sur ordinateur et mobile, les ressources locales, l’absence de débordement, le comparateur CG22 et la lecture sans JavaScript. Captures : `test-results/readers/`. Le rapport Shuffling signale une illustration déjà absente de l’archive (`story_4_3.png`) ; sa légende est conservée.

La commande historique `node tests/browser.mjs --baseline` enregistre la géométrie de l’ancien design ; elle reste utile pour la migration précédente. `node tests/browser.mjs --functional-only` vérifie les articles et toutes les fiches sans comparer leur géométrie à l’ancien accueil. Ne pas remplacer les anciennes références pour masquer une régression. Les résultats historiques restent dans [docs/validation.md](docs/validation.md).

## Préparer la publication

1. Exécuter `npm run build`, `npm test` et `npm run check`.
2. Relire le résultat local et le diff, y compris les HTML générés.
3. Versionner les sources **et** les fichiers générés dans le même commit.
4. Après validation du propriétaire, pousser vers la branche utilisée par GitHub Pages.

Le déploiement observé sur GitHub utilise `master` et le workflow automatique `pages-build-deployment`. `.nojekyll` permet de servir ces fichiers statiques sans transformation Jekyll. La nouvelle CI contrôle leur cohérence ; elle ne déploie rien et ne bloque pas à elle seule le déploiement Pages existant. Aucun push ni déploiement n'est exécuté par les scripts locaux.

Le sitemap contient neuf URL : l’accueil, l’archive `/projects/`, les quatre articles Markdown et les trois rapports HTML publics existants. Il exclut les templates, les fragments et les sources Markdown. `robots.txt` autorise l'exploration générale et référence le sitemap ; aucune règle spécifique à l'entraînement des modèles n'a été ajoutée. Cela rend le contenu accessible, sans garantir son indexation ni sa citation par un service donné.

L’accueil ajoute des données structurées `Person`, `ProfilePage` et `WebSite` cohérentes avec le texte visible, ainsi que des métadonnées Twitter/Open Graph. Les URL canoniques restent celles de `CNAME`. Les principes SEO servent aussi la lisibilité par les moteurs génératifs : [documentation Google](https://developers.google.com/search/docs/appearance/ai-features). Le contenu détaillé des dix fiches conserve pour l’instant son affichage JavaScript ; leurs résumés sont directement lisibles dans l’accueil.

Le portrait choisi est `assets/portrait-selected.png` : photo personnelle IMG_8263, détourée et retouchée, validée dans l’aperçu. Son cadrage est défini par `assets/portrait-selected.css` et `assets/refinements.css`. Les données Person et les métadonnées de l’accueil utilisent cette même photo. Le CV reste le PDF existant.

`npm run test:mobile` vérifie les états tactiles sans survol persistant, le retour depuis un lien externe, la reprise des animations après restauration de page, le glissement sur les cartes sans ouverture, les appuis volontaires, le survol à la souris et le focus clavier. Les captures couvrent aussi About sur un écran mobile court. Ces essais utilisent une simulation tactile Chromium ; ils ne remplacent pas un essai sur iPhone physique. Les styles de survol sont limités aux appareils avec survol et pointeur fin ; le focus clavier reste indépendant.

`npm run test:motion` vérifie les flèches au même niveau sur desktop et deux tailles de téléphone, les entrées des titres et cartes sur mobile (y compris au retour), le mouvement réduit et l’absence de débordement. Captures : `test-results/platform-motion/`. Les particules sont renforcées uniquement au-dessus de 900 px avec un pointeur fin ; leurs réglages tactiles sont conservés.

`npm run test:native` vérifie le déplacement pendant un glissement du doigt, les gestes courts et longs, la reprise immédiate après les flèches, le défilement libre jusqu’au contact et les liaisons de particules (épaisseur variable, couleurs interpolées, masquage sous les points). Le mobile suit le doigt nativement. Le snap CSS est actif uniquement dans l’introduction ; dès Projects, il est désactivé. Il n’y a ni destination tactile en attente, ni repositionnement différé à la fin d’un geste. Les boutons pause/relecture ont été retirés à la demande du propriétaire ; le mouvement réduit du système reste respecté.

`npm run test:stability` vérifie le maintien en bas de page, les changements de hauteur, les flèches pendant une remontée rapide, les clics successifs et l’annulation d’une transition dans WebKit et Chromium. WebKit se prépare avec `npx playwright install webkit`. Les gestes tactiles directs restent couverts par `test:native` et `test:gateway` ; WebKit utilise ici des navigations et interruptions programmatiques, sans reproduire tout le comportement matériel d’un iPhone.

`npm run test:progress` compare les pixels de la ligne du header pendant le survol du CV, puis vérifie que la progression suit le retour en haut sans animation résiduelle. Les contrôles tournent dans Chromium et WebKit. La largeur de la barre est mise à jour directement, dans une zone de rendu indépendante de la bordure du header et de l’animation du CV.

`npm run test:intro` couvre le passage introduction → bas de page, les flèches successives, les interruptions, leur visibilité et le retour à une progression nulle. Chromium utilise de vrais gestes du moteur via CDP ; WebKit utilise des déplacements programmatiques et des événements de cycle de vie. Les deux moteurs vérifient aussi un retard simulé de livraison des positions par le compositeur. Captures : `test-results/mobile-intro/`.

La navigation mobile par flèche envoie une seule demande native `scrollTo({ behavior: "smooth" })`. Le snap reste désactivé jusqu’à l’arrivée observée, puis reprend seulement si la position est dans l’introduction. Une nouvelle entrée utilisateur annule le trajet en cours. L’ancienne animation par frame et son garde comparant positions demandées/observées ont échoué sur iPhone et ont été retirés ; le timer desktop de 1 200 ms libère seulement un verrou. La progression vaut zéro à 3 px ou moins du haut et pendant le geste de rafraîchissement. La visibilité des flèches empêche celle de l’écran précédent de réapparaître. Voir [le brief Gateway](docs/gateway-brief.md).

`npm run test:super-resolution` couvre l’archive et le nouvel article sur ordinateur et mobile dans Chromium et WebKit : navigation, deux comparateurs, clavier, souris, absence de débordement, erreurs JavaScript et lecture sans JavaScript. Les gestes CDP Chromium vérifient la comparaison horizontale, un glissement diagonal rapide sortant du cadre puis revenant en sens inverse, et le défilement vertical sur l’image. Cette suite passe dans les deux moteurs, sur ordinateur et mobile ; `npm test` et `npm run check` passent également. Captures : `test-results/super-resolution/`. Pour ces deux nouvelles commandes, l’adresse par défaut est `http://127.0.0.1:8002` ; avec `npm run dev` sur son port habituel, définir `$env:SITE_URL = "http://127.0.0.1:8000"` avant les tests.

Après un nouvel essai sur iPhone, le propriétaire indique que le défilement est meilleur, juge cette version publiable et autorise explicitement sa publication le 5 novembre 2026. Le déploiement reste à effectuer et à vérifier au moment de cette mise à jour documentaire. La revue visuelle en lecture seule a approuvé l’intégration au système Gateway ; les tests moteur complètent le retour matériel, sans s’y substituer. `DESIGN.md` et `.impeccable/design.json` sont conservés avec leur historique : les nouvelles pages prolongent le système existant.

Le comparateur utilise directement sa poignée de 48 px sur toute la hauteur, avec `role="slider"` et commandes clavier ; le contrôle range supplémentaire sous l’image est supprimé. La capture du pointeur commence dès l’appui pour conserver les gestes rapides hors du cadre. La poignée réserve le geste au comparateur (`touch-action: none`) ; le reste de l’image garde le défilement vertical et le zoom. Dans la première comparaison, les boutons « Bicubic » et « Low resolution » (`aria-pressed`) changent uniquement l’image de gauche ; le résultat CNN reste à droite.
