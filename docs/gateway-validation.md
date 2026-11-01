# Gateway — validation du 1 novembre 2026

Branche locale `design/gateway`. Aucun commit, push ou déploiement effectué. Le serveur de développement reste ouvert pour les itérations du propriétaire.

## Vérifications réalisées

- `npm test` : 7 tests réussis, dont génération Markdown, cartes, sorties reproductibles, validation des ressources, texte d’accueil et identité structurée.
- `npm run check` : sources et HTML générés cohérents, ressources locales présentes.
- `npm run test:gateway` : passages répétés intro → projets → intro, défilement libre sous l’intro, aberration chromatique du titre About, pause, progression aux extrémités, ouverture/fermeture d’une fiche, images, lecture mobile et sans JavaScript.
- `node tests/browser.mjs --functional-only` : trois articles, dix fiches interactives, agrandissements et galeries à 1440 et 390 pixels. La géométrie de l’ancien design n’est pas utilisée comme référence pour cette refonte.
- `npm run test:dev` : ressources publiques accessibles, sources privées non servies, modification temporaire du Markdown reconstruite, événement de rechargement reçu et fichier original restauré à l’octet près.
- `git diff --check` : aucun défaut d’espacement.
- Réponses HTTP 200 sur `http://127.0.0.1:8000/` et `http://192.168.1.5:8000/`. Le propriétaire a confirmé que la page s’ouvre depuis son téléphone sur le même Wi-Fi.

Edge a été utilisé pour les contrôles navigateur. Captures dans `test-results/gateway/` : accueil/projets/About sur ordinateur et mobile, page mobile complète. Le constructeur et un relecteur Impeccable indépendant les ont inspectées. Les tests de mouvement utilisent le mode normal sur ordinateur ; le contrôle mobile automatisé couvre notamment la préférence de mouvement réduit.

Les premiers lancements ont nécessité de sortir le serveur de l’environnement isolé et de lancer Edge avec les permissions adaptées. Une vérification a été interrompue par un rechargement après modification ; les exécutions stables ultérieures ont réussi.

## Publication et limites

La sortie reste statique : HTML, CSS, JavaScript et ressources. Le serveur Node ne sert qu’au développement. GitHub Pages peut conserver le mode existant ; `.nojekyll`, le domaine et les URL des articles n’ont pas changé. Référence : [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

Le texte visible, les liens, canoniques, Open Graph, Twitter et le graphe Person/ProfilePage/WebSite sont présents dans le HTML. `robots.txt` et le sitemap conservent leurs routes. Cette base suit les [recommandations Google pour les fonctions IA](https://developers.google.com/search/docs/appearance/ai-features), sans promesse d’indexation, de position ou de citation. Les dix fiches conservent leur comportement JavaScript ; leurs résumés sont directement dans l’accueil.

Le ressenti des animations, les gestes et les performances sur le téléphone réel restent à apprécier par le propriétaire. Les lecteurs vidéo externes ne sont pas validés par les tests. Remplacer le portrait de démonstration avant publication ; le CV est le fichier existant. La relecture valide l’itération locale, pas une autorisation de mise en production.
