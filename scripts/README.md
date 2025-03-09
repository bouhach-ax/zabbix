# Scripts d'injection d'alarmes dans Zabbix

Ce dossier contient des scripts Python pour injecter des alarmes de test dans Zabbix à partir des données stockées dans Supabase.

## Prérequis

- Python 3.8+
- Accès à un serveur Zabbix via API
- Accès à une base de données Supabase contenant des alertes mock

## Installation des dépendances

```bash
pip install requests python-dotenv
```

## Configuration

Les scripts utilisent les variables d'environnement définies dans le fichier `.env` à la racine du projet :

```
VITE_ZABBIX_API_URL=https://votre-serveur-zabbix/api_jsonrpc.php
VITE_ZABBIX_USERNAME=votre_utilisateur
VITE_ZABBIX_PASSWORD=votre_mot_de_passe
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_supabase
```

## Scripts disponibles

### inject_alarms.py

Ce script récupère les alertes mock depuis Supabase et les injecte dans Zabbix en créant :
- Des groupes d'hôtes correspondant aux services
- Des hôtes correspondant aux hôtes des alertes
- Des items pour chaque alerte
- Des triggers pour chaque alerte

Usage :
```bash
python inject_alarms.py
```

### activate_alarms.py

Ce script active aléatoirement certaines des alarmes injectées dans Zabbix.

Usage :
```bash
python activate_alarms.py
```

## Fonctionnement détaillé

### Processus d'injection

1. Récupération des alertes mock depuis Supabase
2. Organisation des alertes par service et composant
3. Pour chaque service :
   - Création d'un groupe d'hôtes
   - Pour chaque composant :
     - Pour chaque hôte :
       - Création de l'hôte s'il n'existe pas
       - Création d'un item pour chaque alerte
       - Création d'un trigger pour chaque alerte

### Processus d'activation

1. Récupération des items d'alerte créés précédemment
2. Sélection aléatoire de certains items
3. Envoi d'une valeur "1" pour déclencher l'alerte

## Intégration avec l'application

Ces scripts sont intégrés à l'application via les commandes npm :

```bash
npm run inject-alarms
npm run activate-alarms
```

## Remarques

- Ces scripts sont destinés à des fins de test et de démonstration
- Ils ne doivent pas être utilisés en production sans adaptation
- L'exécution répétée du script d'injection peut créer des doublons si les identifiants des alertes changent