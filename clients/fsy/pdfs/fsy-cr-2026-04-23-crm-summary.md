# 04-23 Rendez-vous: CRM unifié, migrations Circle/Stripe et automatisations Brevo–Circle–Stripe

# Plan Stratégique et Opérationnel pour la Collaboration et le Projet Face Soul Yoga

[image]


Cette discussion établit le cadre de collaboration entre Catherine Selosse et son nouveau COO, en définissant les rôles, les aspects financiers et la vision stratégique. Elle se concentre ensuite sur les actions prioritaires pour le client Face Soul Yoga (FSY), notamment la migration de la plateforme de formation de Uscreen vers Circle, la mise en place du suivi UTM, et la finalisation des nouvelles automatisations, tout en soulignant l'importance critique de la sécurité et de la documentation pour une gestion autonome par le client à l'avenir.
------------
## Contexte Métier et Structuration de la Collaboration

Cette section détaille la situation commerciale actuelle de Catherine Selosse, marquée par une forte croissance avec l'arrivée de nouveaux clients et prospects, ce qui nécessite une meilleure structuration opérationnelle. En interne, Catherine a entamé la migration de ses fichiers de travail ("Claude Code") vers Google Drive, un processus qu'elle souhaite finaliser proprement avant de partager les accès. La discussion officialise la collaboration avec son nouveau partenaire, présenté aux clients comme son Chief Operational Officer (COO) et considéré comme son "bras droit". Ce dernier souligne l'importance de la sécurité, ayant identifié des failles potentielles dans les liens HTML publics actuellement utilisés, et a déjà préparé un guide de bonnes pratiques. Les termes financiers de la collaboration sont également fixés : une rémunération de 1000 € pour le premier mois, avec une garantie minimale de 500 € mensuels par la suite, ajustable selon la charge de travail. Catherine met l'accent sur la complémentarité de leurs rôles : elle se concentre sur la stratégie et la relation client, tandis que son COO est le référent pour l'exécution technique, la qualité, la sécurité et la faisabilité des projets.

------------
## Audit et Planification pour le Projet Face Soul Yoga (FSY)

Cette section est dédiée à l'analyse de l'écosystème technique du client Face Soul Yoga (FSY) et à la planification des interventions. Le COO a déjà réalisé une cartographie des automatisations existantes sur N8N, notant qu'elles reposent sur du code JavaScript personnalisé plutôt que sur des modules standards, ce qui a nécessité une analyse approfondie pour en comprendre le fonctionnement. L'objectif principal est la mise en place d'un suivi de performance marketing efficace via les UTM fournis par le client. Deux approches complémentaires sont envisagées : premièrement, l'intégration de champs cachés dans les formulaires Elementor du site web pour capturer automatiquement les informations UTM lorsqu'un prospect s'inscrit ; deuxièmement, l'utilisation de Google Analytics et du Google Tag pour suivre tous les clics et interactions, y compris ceux qui ne mènent pas directement à un formulaire. Cette double stratégie permettra de collecter des données précises sur l'origine des prospects et l'efficacité des différentes campagnes.

------------
## Stratégie de Migration de Uscreen vers Circle

Cette section détaille le plan d'action pour la tâche la plus urgente concernant FSY : la migration complète de leur plateforme de formation de Uscreen vers Circle. La plateforme Uscreen étant jugée peu fonctionnelle, la migration ne pourra pas être automatisée par l'outil. Le processus commencera par l'export des données de tous les utilisateurs (actifs et inactifs) via un fichier CSV depuis Uscreen, qui contient des informations clés comme les dates d'abonnement et la source UTM. Une campagne de communication sera ensuite lancée via Brevo pour informer les utilisateurs de la transition. Le plan prévoit de laisser un accès à l'ancienne plateforme Uscreen pendant un mois pour permettre aux utilisateurs de sauvegarder leurs informations. Un point de vigilance majeur concerne la migration des abonnements gérés par Stripe. Il est crucial de s'assurer que l'historique de paiement et les cycles d'abonnement (notamment annuels à 139 €) sont correctement transférés pour éviter toute interruption de service ou erreur de facturation. Cette opération délicate sera menée en collaboration directe avec la cliente.

------------
## Finalisation et Déploiement des Nouvelles Automatisations

Cette section porte sur la mise en production des workflows d'automatisation pour les nouvelles offres de FSY hébergées sur Circle. Les "squelettes" des automatisations sont déjà créés sur N8N, mais les différentes applications (Stripe, Circle, Brevo, et la solution e-signature) doivent encore être connectées. Ces automatisations gèreront l'intégralité du parcours client pour deux offres distinctes : "FSY the Studio", une offre B2C, et "Master the Method" (MTM), une offre B2B qui inclut une étape supplémentaire de génération de facture via l'outil e-signature. Un enjeu majeur de cette mission est de rendre le client autonome à long terme. Pour ce faire, une documentation détaillée ("pas à pas") sera créée. Elle permettra à la future assistante d'Aurélia (la dirigeante de FSY) de gérer le système, notamment pour ajouter de nouvelles formations ou des lead magnets, et de diagnostiquer les éventuelles alertes sans dépendre d'une intervention extérieure. L'objectif est de livrer un système robuste et facile à maintenir.

------------
## Actions à Réaliser

**@Catherine SELOSSE**
- [ ] Finaliser la migration de tous les fichiers "Claude Code" vers Google Drive de manière propre - [TBD]
- [ ] Partager l'accès au Google Drive une fois la migration terminée - [TBD]
- [ ] Mettre en place le suivi des UTM dans la plateforme Brevo - [TBD]
- [ ] Exporter le fichier CSV de tous les utilisateurs (actifs et inactifs) depuis Uscreen - [TBD]
- [ ] Rédiger le contenu des emails pour la campagne de migration informant les utilisateurs du passage de Uscreen à Circle - [TBD]
- [ ] Organiser et participer à un appel avec la cliente (Laurie) pour effectuer la bascule du compte Stripe de Uscreen vers Circle - [TBD]
- [ ] Connecter les différentes applications (Stripe, Circle, Brevo, e-signature) aux workflows d'automatisation en utilisant les accès partagés dans OnePassword - [TBD]
- [ ] Créer une documentation détaillée (tutoriel "pas à pas") pour la future assistante de FSY afin de garantir son autonomie dans la gestion du système - [TBD]

**@Speaker 2 (COO)**
- [ ] Cartographier le fonctionnement du CRM et du funnel de vente proposés pour validation interne - [TBD]
- [ ] Mettre en place la collecte des UTM sur le site FSY via des champs cachés dans les formulaires Elementor et un script JavaScript dans le header - [TBD]
- [ ] Configurer Google Analytics avec le Google Tag pour assurer le suivi des clics sur les liens UTM, en particulier ceux ne menant pas à un formulaire - [TBD]
- [ ] Élaborer et envoyer un email récapitulant le plan d'action pour la migration de la plateforme FSY - [TBD]
- [ ] Créer la campagne de migration dans Brevo pour les utilisateurs actifs et inactifs - [TBD]
- [ ] Finaliser et mettre en production les workflows d'automatisation pour les nouvelles formations sur Circle après la migration - [TBD]
- [ ] Examiner les liens HTML générés pour les clients et mettre en place des mesures de sécurité pour empêcher l'accès public aux informations sensibles - [TBD]