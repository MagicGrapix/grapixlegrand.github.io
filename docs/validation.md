# Validation de la génération statique

Contrôles réalisés le 29 octobre 2026 sur Windows, Node.js 24.11.1 et Edge piloté par Playwright. Le serveur local servait le dépôt sur `http://127.0.0.1:8001`.

## Périmètre confirmé

- Les trois articles existants sont générés depuis leurs `article.md`, aux mêmes URL.
- Les treize cartes de l'accueil sont présentes dans le HTML initial : trois liens d'articles et dix boutons.
- À la demande du propriétaire, les dix boutons continuent d'ouvrir les fiches existantes. Aucune page autonome n'a été créée pour ces fiches. Leur contenu complet nécessite toujours JavaScript ; leurs titres et résumés sont présents dans le HTML de l'accueil.
- Les JSON, fragments des fiches, Markdown des articles, images et `style.css` ne présentent aucune modification dans le diff.

## Résultats

- **Générateur : 5 tests réussis.** Conservation du HTML éditorial, des figures/légendes et des caractères spéciaux ; distinction liens/boutons ; génération reproductible ; détection des sorties périmées sans écriture ; ressources ou modèles invalides signalés avant remplacement des pages ; métadonnées du site réel.
- **Cohérence : `npm run check` réussi.** HTML, sitemap et robots correspondent aux sources. Les chemins locaux `href` et `src` des pages générées sont résolus, dont les images, CSS, scripts et PDF.
- **HTML initial :** texte complet des trois articles, un seul H1 par page, trois liens d'articles et dix boutons sur l'accueil. Aucun chargement navigateur de `article.md` ou des JSON des cartes.
- **Sans JavaScript :** à 390 px, les trois liens de cartes ouvrent leurs articles ; texte et figures sont présents sans message de chargement.
- **Avec JavaScript :** les trois articles, les dix fiches et leur fermeture ont été testés à 1440 et 390 px. Les fiches gardent l'URL de l'accueil. Agrandissement des images des articles et retour du focus vérifiés ; galerie de peintures et navigation des galeries Backrooms/The Village testées.
- **Comparaison avant/après :** même texte, type d'élément, position et dimensions (tolérance de 1 px) pour les cartes et les blocs des articles aux deux largeurs. Le texte des dix fiches correspond exactement à la référence. Captures inspectées pour l'accueil mobile, l'article Minecraft sur ordinateur et la fiche du mémoire.
- **Erreurs navigateur :** aucune exception JavaScript ni réponse HTTP locale en erreur détectée durant ces parcours, hors favicon optionnel. Aucune image locale cassée ni débordement horizontal des pages testées.
- **Écriture locale :** démarrage du watcher, modification temporaire d'un Markdown, régénération automatique observée, restauration du fichier source à l'octet près et régénération du HTML initial vérifiées.
- **SEO :** titres et descriptions distincts, hiérarchie H1/H2/H3 sans saut observé, canoniques et Open Graph absolus sur `www.quentinguignard.com`. Les images de contenu ont un `alt`. Le sitemap contient sept URL publiques ; `robots.txt` le référence sans blocage ajouté ni règle spécifique à l'entraînement.

Les captures et mesures avant/après se trouvent dans `test-results/before/` et `test-results/after/`, ignorés par Git. La comparaison géométrique porte sur les cartes et les blocs des articles, pas sur chaque pixel des vidéos ou des animations.

## Publication et limites

Le site public a été contrôlé avant la migration : HTTP 200 sur l'accueil et les trois articles ; HTTP 301 du domaine sans `www` vers `www` ; `robots.txt` et `sitemap.xml` absents (404). Les articles publics contenaient encore le message de chargement dans leur HTML initial. Aucun en-tête `X-Robots-Tag` n'a été observé sur ces quatre pages.

L'exécution GitHub Actions consultée utilise `pages-build-deployment` sur `master` avec construction Jekyll et déploiement Pages. Les sorties HTML sont conservées dans le dépôt et `.nojekyll` a été ajouté. Le nouveau workflow contrôle la cohérence ; son exécution distante et l'effet de `.nojekyll` seront à vérifier après le push autorisé. Ce contrôle indépendant ne constitue pas un verrou du déploiement automatique existant.

Aucun push ni déploiement n'a été effectué. Les réponses HTTP du futur site publié, l'exploration par un véritable robot OpenAI et l'indexation restent donc à vérifier après publication. Les lecteurs YouTube/itch.io externes sont exclus des tests automatisés ; leur lecture effective et les performances d'indexation ne sont pas validées. Aucun changement n'a été apporté à leurs intégrations.

Après publication validée : vérifier les quatre pages publiques sans exécuter JavaScript, les réponses 200 du sitemap et de robots, les canoniques, la redirection vers `www` et les interactions dans un navigateur.
