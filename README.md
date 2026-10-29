# Portfolio

Les trois articles sont générés en HTML depuis leur `article.md`. L'accueil contient directement ses treize cartes : trois liens vers les articles et dix boutons ouvrant les fiches existantes. Ces fiches conservent leur fonctionnement avec JavaScript. Les articles et leurs liens restent lisibles sans JavaScript.

## Écrire et prévisualiser en local

Prérequis : Node.js 22 ou plus récent (24 en CI), npm et Python pour le serveur local.

Depuis la racine du dépôt, une première fois :

```powershell
npm ci
npm run build
```

Puis, dans deux terminaux :

```powershell
npm run watch
```

```powershell
py -m http.server 8000 --bind 127.0.0.1
```

Ouvrir <http://127.0.0.1:8000/>. Modifier un `article.md`, puis actualiser le navigateur : le watcher régénère automatiquement le HTML. Il surveille aussi les templates et les JSON des cartes. Il affiche les erreurs sans remplacer les pages si la validation échoue. Redémarrer le watcher après une modification du générateur ou de `CNAME`. Les modifications de CSS, scripts, images et fiches HTML sont servies directement ; actualiser le navigateur suffit.

## Sources à modifier

- `pages/<slug>/article.md` : texte de l'article, liens, illustrations et légendes. Le Markdown accepte aussi les blocs HTML existants.
- `pages/<slug>/template.html` : titre, description, présentation et styles propres à l'article. Conserver une occurrence des marqueurs `<!-- SEO -->` et `<!-- ARTICLE -->`.
- `templates/home.html` : structure de l'accueil ; conserver les marqueurs de cartes et de métadonnées.
- `cards/*.json` : contenu et ordre des cartes. Une propriété `link` crée un lien classique ; une propriété `detail` conserve une fiche interactive.
- `cards/*.html` : fiches existantes, chargées à l'ouverture de leur fenêtre.
- `style.css`, `assets/portfolio.js`, `assets/article.js` : styles et interactions.
- `CNAME` : domaine public, utilisé pour les URL canoniques et le sitemap.

Ne pas éditer manuellement les fichiers générés : `index.html`, `pages/*/index.html`, `sitemap.xml` et `robots.txt`. Ils sont versionnés pour que GitHub Pages puisse les servir directement. Les anciens `index.md` ne participent pas à la génération.

Pour ajouter un article, créer `pages/<slug>/article.md` avec exactement un H1, copier un template existant en adaptant son titre, sa description et ses informations visibles, puis ajouter un lien dans le JSON de la catégorie voulue. `npm run build` découvre automatiquement le nouvel article. Les chemins d'images restent relatifs à son dossier. Chaque image doit avoir un attribut `alt` (vide seulement si elle est décorative).

## Vérifier

```powershell
npm test
npm run check
```

`npm test` vérifie la génération, les erreurs, les métadonnées et le contrat des cartes. `npm run check` vérifie les ressources locales référencées et échoue si les fichiers générés ne correspondent plus aux sources, sans écrire de fichiers.

Avec le serveur local démarré, les tests navigateur utilisent Edge sous Windows :

```powershell
npm run test:browser
```

Sur un autre système, installer d'abord Chromium avec `npx playwright install chromium`. `SITE_URL` permet de choisir une autre adresse locale et `BROWSER_CHANNEL` un autre navigateur installé. Les tests couvrent ordinateur/mobile, les trois articles sans JavaScript, les dix fiches, les agrandissements et les galeries. Les lecteurs externes YouTube/itch.io sont exclus des tests automatisés. Les captures sont dans `test-results/`, ignoré par Git.

La commande `node tests/browser.mjs --baseline` enregistre une référence avant modification ; une exécution normale compare ensuite les textes et les dimensions si cette référence existe. Ne pas régénérer la référence pour masquer une régression. Les résultats de cette migration sont dans [docs/validation.md](docs/validation.md).

## Préparer la publication

1. Exécuter `npm run build`, `npm test` et `npm run check`.
2. Relire le résultat local et le diff, y compris les HTML générés.
3. Versionner les sources **et** les fichiers générés dans le même commit.
4. Après validation du propriétaire, pousser vers la branche utilisée par GitHub Pages.

Le déploiement observé sur GitHub utilise `master` et le workflow automatique `pages-build-deployment`. `.nojekyll` permet de servir ces fichiers statiques sans transformation Jekyll. La nouvelle CI contrôle leur cohérence ; elle ne déploie rien et ne bloque pas à elle seule le déploiement Pages existant. Aucun push ni déploiement n'est exécuté par les scripts locaux.

Le sitemap contient l'accueil, les trois articles et les trois rapports HTML publics existants. Il exclut les templates, les fragments et les sources Markdown. `robots.txt` autorise l'exploration générale et référence le sitemap ; aucune règle spécifique à l'entraînement des modèles n'a été ajoutée. Cela rend le contenu accessible, sans garantir son indexation ni sa citation par un service donné.
