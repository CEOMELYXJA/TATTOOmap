# Suivi de la modélisation des tatouages

Le [tableau de suivi](suivi-modelisation.csv) relie chaque photographie de tatouage à son identifiant, son sujet visible, son année de téléversement, son lien original et les codes de motifs prévus pour la représentation 3D. Il comporte **58 photographies** identifiées lors de l’examen visuel. Chaque ligne représente un fichier de l’inventaire, et une photographie peut contenir plusieurs tatouages ou recouper une autre photographie.

- **`prototype_a_affiner` — 4 lignes.** Une interprétation 3D est présente dans le prototype. Elle peut nécessiter des ajustements pour correspondre plus étroitement au tatouage et ne doit pas être considérée comme une reconstruction exacte.
- **`a_modeliser` — 54 lignes.** La photographie et les motifs ont été identifiés, mais aucune représentation dédiée n’a encore été ajoutée au prototype des quatre œuvres.

Les codes de motifs 3D, en anglais dans le logiciel, décrivent les sujets visuels prévus, par exemple `tiger` pour tigre, `flower` pour fleur et `skull` pour crâne. Plusieurs codes sur une même ligne sont séparés par ` | `. Ils servent de pistes pour construire l’objet et ne certifient pas qu’un modèle fidèle est déjà disponible. La colonne « motifs visibles » fournit la description en français.

L’année indiquée est celle du **téléversement** dans l’inventaire Wix. Elle ne confirme pas l’année de réalisation. L’histoire, la date d’exécution, l’auteur et le statut de publication doivent être documentés seulement lorsqu’ils ont été vérifiés. Les descriptions visuelles sont des interprétations de l’examen initial et peuvent être corrigées lors de la modélisation individuelle.

Ce fichier est un suivi de travail. Les photos originales restent accessibles par les liens de chaque ligne et servent de référence pour améliorer individuellement chaque objet. La présence d’un lien ne constitue pas à elle seule une preuve de publication en galerie.
