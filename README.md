# Zabscaler - Zabbix Mass Provisioning & Service Monitoring

Zabscaler est une application web qui permet de gérer et surveiller les services Zabbix, ainsi que de provisionner en masse des hôtes dans Zabbix.

## Fonctionnalités

- **Monitoring de services** : Visualisation de l'état des services basée sur les alertes réelles de Zabbix
- **Gestion des alertes** : Affichage et acquittement des alertes Zabbix
- **Provisioning en masse** : Ajout rapide de multiples hôtes dans Zabbix
- **Gestion des templates**
- **Gestion des tags et groupes d'hôtes**

## Prérequis

- Node.js 18+
- Python 3.8+ (pour les scripts d'injection d'alarmes)
- Serveur Zabbix accessible via API
- Compte Supabase (pour le stockage des tags et groupes)

## Installation

1. Cloner le dépôt
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Configurer les variables d'environnement dans le fichier `.env` :
   ```
   VITE_ZABBIX_API_URL=https://votre-serveur-zabbix/api_jsonrpc.php
   VITE_ZABBIX_USERNAME=votre_utilisateur
   VITE_ZABBIX_PASSWORD=votre_mot_de_passe
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_ANON_KEY=votre_cle_supabase
   ```

## Démarrage

```bash
npm run dev
```

## Injection d'alarmes dans Zabbix

Pour injecter des alarmes de test dans Zabbix à partir des données de Supabase :

```bash
npm run inject-alarms
```

Pour activer certaines de ces alarmes :

```bash
npm run activate-alarms
```

## Structure du projet

- `src/` : Code source de l'application React
  - `components/` : Composants React réutilisables
  - `lib/` : Utilitaires et services
  - `pages/` : Pages de l'application
  - `types/` : Types TypeScript
- `scripts/` : Scripts Python pour l'injection d'alarmes
- `supabase/migrations/` : Migrations Supabase

## Fonctionnement de l'intégration avec Zabbix

### Monitoring des services basé sur les alertes

Le monitoring des services utilise les alertes réelles de Zabbix pour déterminer l'état des services. Le processus est le suivant :

1. Les services sont définis dans Zabbix avec des tags spécifiques (service, component)
2. Les hôtes et leurs triggers sont également tagués avec les mêmes tags
3. L'application récupère les alertes actives via l'API Zabbix
4. L'état des services est calculé en fonction des alertes associées par tags

### Acquittement des alertes

L'acquittement des alertes est effectué directement via l'API Zabbix :

1. L'utilisateur sélectionne une ou plusieurs alertes
2. L'application récupère les événements associés aux triggers des alertes
3. Les événements sont acquittés via l'API Zabbix

## Licence

MIT