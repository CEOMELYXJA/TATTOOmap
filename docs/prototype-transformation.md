# Prototype de transformation des tatouages

Les quatre œuvres représentées sont « Tigre et fleurs » (2026-035), « Rose rouge » (2026-062), « Papillon en fleurs » (2025-027) et « Crânes et flammes » (2026-065). Les années sont celles du téléversement. Le [suivi des 58 photographies](suivi-modelisation.csv) relie les identifiants, photos et motifs, et indique l'état de chaque modèle.

Les objets sont des géométries tridimensionnelles procédurales. Les ailes, la rose, le tigre et les flammes bougent, avec une réaction à proximité. Chaque objet ouvre la photo d'origine. Ces modèles stylisés sont des interprétations et ne reproduisent pas fidèlement tous les détails des tatouages. Quatre œuvres sont modélisées en première version ; les 54 autres restent à réaliser individuellement.

Dans `captures-prototype/`, les captures montrent le monde et chaque motif sous deux angles. Un test Chrome automatisé sous Windows a vérifié les quatre recherches, les fiches et les liens des photos. Les volumes et animations ont également été vérifiés numériquement. Le test téléphone était une simulation ; les performances réelles sur GPU et téléphone restent à vérifier. L'import conserve les données localement, mais les œuvres importées ne sont pas encore représentées dans ce prototype.
