#!/usr/bin/env python3
import os
import json
import requests
import sys
import time
import random
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Configuration Zabbix
ZABBIX_API_URL = os.getenv('VITE_ZABBIX_API_URL')
ZABBIX_USERNAME = os.getenv('VITE_ZABBIX_USERNAME')
ZABBIX_PASSWORD = os.getenv('VITE_ZABBIX_PASSWORD')

if not all([ZABBIX_API_URL, ZABBIX_USERNAME, ZABBIX_PASSWORD]):
    print("Erreur: Variables d'environnement manquantes. Vérifiez votre fichier .env")
    sys.exit(1)

class ZabbixAPI:
    def __init__(self, api_url, username, password):
        self.api_url = api_url
        self.username = username
        self.password = password
        self.auth_token = None
        self.request_id = 1

    def login(self):
        data = {
            "jsonrpc": "2.0",
            "method": "user.login",
            "params": {
                "user": self.username,
                "password": self.password
            },
            "id": self.request_id
        }
        response = requests.post(self.api_url, json=data)
        result = response.json()
        
        if "error" in result:
            raise Exception(f"Erreur de connexion à Zabbix: {result['error']['data']}")
        
        self.auth_token = result["result"]
        print(f"Connecté à Zabbix avec succès. Token: {self.auth_token[:5]}...")
        return self.auth_token

    def api_call(self, method, params=None):
        if not self.auth_token:
            self.login()
            
        self.request_id += 1
        data = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params or {},
            "auth": self.auth_token,
            "id": self.request_id
        }
        
        response = requests.post(self.api_url, json=data)
        result = response.json()
        
        if "error" in result:
            raise Exception(f"Erreur API Zabbix ({method}): {result['error']['data']}")
        
        return result["result"]

    def get_host_groups(self):
        return self.api_call("hostgroup.get", {
            "output": ["groupid", "name"]
        })

    def create_host_group(self, name):
        return self.api_call("hostgroup.create", {
            "name": name
        })

    def get_hosts(self):
        return self.api_call("host.get", {
            "output": ["hostid", "host", "name"]
        })

    def create_host(self, host_data):
        return self.api_call("host.create", host_data)

    def create_item(self, item_data):
        return self.api_call("item.create", item_data)

    def create_trigger(self, trigger_data):
        return self.api_call("trigger.create", trigger_data)

def main():
    # Initialiser l'API Zabbix
    zabbix = ZabbixAPI(ZABBIX_API_URL, ZABBIX_USERNAME, ZABBIX_PASSWORD)
    
    try:
        # Se connecter à Zabbix
        zabbix.login()
        
        # Définir les alertes mock
        mock_alerts = [
            {
                "description": "High response time on product catalog pages",
                "priority": 3,
                "host_name": "ecom-front-01",
                "host_ip": "192.168.10.10",
                "alert_type": "application",
                "tags": {
                    "service": "E-Commerce",
                    "component": "Frontend",
                    "impact": "high",
                    "category": "performance"
                }
            },
            {
                "description": "JavaScript errors on checkout page",
                "priority": 4,
                "host_name": "ecom-front-02",
                "host_ip": "192.168.10.11",
                "alert_type": "application",
                "tags": {
                    "service": "E-Commerce",
                    "component": "Frontend",
                    "impact": "critical",
                    "category": "functionality"
                }
            },
            {
                "description": "Payment gateway timeout",
                "priority": 4,
                "host_name": "ecom-api-01",
                "host_ip": "192.168.10.20",
                "alert_type": "application",
                "tags": {
                    "service": "E-Commerce",
                    "component": "Backend API",
                    "impact": "critical",
                    "category": "availability"
                }
            },
            {
                "description": "Web interface session handling errors",
                "priority": 4,
                "host_name": "crm-web-01",
                "host_ip": "192.168.20.10",
                "alert_type": "application",
                "tags": {
                    "service": "CRM",
                    "component": "Web Interface",
                    "impact": "critical",
                    "category": "functionality"
                }
            },
            {
                "description": "BGP session down on edge router",
                "priority": 4,
                "host_name": "router-edge-01",
                "host_ip": "192.168.1.1",
                "alert_type": "network",
                "tags": {
                    "service": "Network Backbone",
                    "component": "Edge Routers",
                    "impact": "critical",
                    "category": "connectivity"
                }
            }
        ]
        
        # Récupérer les groupes d'hôtes existants
        host_groups = zabbix.get_host_groups()
        host_group_names = {group["name"]: group["groupid"] for group in host_groups}
        
        # Récupérer les hôtes existants
        hosts = zabbix.get_hosts()
        host_names = {host["host"]: host["hostid"] for host in hosts}
        
        # Organiser les alertes par service et composant
        services = {}
        for alert in mock_alerts:
            tags = alert.get("tags", {})
            service = tags.get("service", "Unknown Service")
            component = tags.get("component", "Unknown Component")
            
            if service not in services:
                services[service] = {}
            
            if component not in services[service]:
                services[service][component] = []
            
            services[service][component].append(alert)
        
        # Créer les groupes d'hôtes, hôtes, items et triggers
        for service_name, components in services.items():
            # Créer ou récupérer le groupe d'hôtes pour le service
            group_name = f"{service_name} Service"
            if group_name not in host_group_names:
                print(f"Création du groupe d'hôtes: {group_name}")
                result = zabbix.create_host_group(group_name)
                group_id = result["groupids"][0]
                host_group_names[group_name] = group_id
            else:
                group_id = host_group_names[group_name]
            
            for component_name, alerts in components.items():
                # Regrouper les alertes par hôte
                hosts_alerts = {}
                for alert in alerts:
                    host_name = alert.get("host_name", "unknown-host")
                    if host_name not in hosts_alerts:
                        hosts_alerts[host_name] = []
                    hosts_alerts[host_name].append(alert)
                
                for host_name, host_alerts in hosts_alerts.items():
                    # Vérifier si l'hôte existe déjà
                    if host_name in host_names:
                        host_id = host_names[host_name]
                        print(f"Hôte existant: {host_name} (ID: {host_id})")
                    else:
                        # Créer l'hôte
                        host_ip = host_alerts[0].get("host_ip", "127.0.0.1")
                        print(f"Création de l'hôte: {host_name}...")
                        
                        # Préparer les tags pour l'hôte
                        host_tags = []
                        if isinstance(host_alerts[0].get("tags"), dict):
                            for key, value in host_alerts[0]["tags"].items():
                                host_tags.append({"tag": key, "value": value})
                        else:
                            # Tags par défaut si aucun n'est fourni
                            host_tags = [
                                {"tag": "service", "value": service_name},
                                {"tag": "component", "value": component_name}
                            ]
                        
                        host_data = {
                            "host": host_name,
                            "name": f"{host_name} ({component_name})",
                            "interfaces": [
                                {
                                    "type": 1,  # Agent
                                    "main": 1,
                                    "useip": 1,
                                    "ip": host_ip,
                                    "dns": "",
                                    "port": "10050"
                                }
                            ],
                            "groups": [
                                {"groupid": group_id}
                            ],
                            "tags": host_tags
                        }
                        
                        result = zabbix.create_host(host_data)
                        host_id = result["hostids"][0]
                        host_names[host_name] = host_id
                        print(f"Hôte créé avec succès: {host_name} (ID: {host_id})")
                    
                    # Créer un item pour chaque alerte
                    for alert in host_alerts:
                        # Utiliser un format de clé qui sera facilement identifiable
                        timestamp = int(time.time())
                        random_suffix = int(random.random() * 1000)
                        item_key = f"alert.{timestamp}.{random_suffix}"
                        item_name = f"Alert: {alert['description']}"
                        
                        print(f"Création de l'item pour l'alerte: {alert['description']}...")
                        item_data = {
                            "name": item_name,
                            "key_": item_key,
                            "hostid": host_id,
                            "type": 2,  # Zabbix trapper
                            "value_type": 3,  # Numeric unsigned
                            "delay": 0  # Utiliser 0 pour les items de type trapper
                        }
                        
                        try:
                            item_result = zabbix.create_item(item_data)
                            item_id = item_result["itemids"][0]
                            print(f"Item créé avec succès: {item_id}")
                            
                            # Créer un trigger pour l'item
                            trigger_name = alert["description"]
                            # Utiliser le format d'expression corrigé pour Zabbix 6.0+
                            trigger_expression = f"{host_name}:{item_key}.last()=1"
                            trigger_priority = int(alert.get("priority", 3))
                            
                            print(f"Création du trigger pour l'alerte: {trigger_name}...")
                            
                            # Préparer les tags pour le trigger
                            trigger_tags = []
                            if isinstance(alert.get("tags"), dict):
                                for key, value in alert["tags"].items():
                                    trigger_tags.append({"tag": key, "value": value})
                            else:
                                # Tags par défaut si aucun n'est fourni
                                trigger_tags = [
                                    {"tag": "service", "value": service_name},
                                    {"tag": "component", "value": component_name}
                                ]
                            
                            trigger_data = {
                                "description": trigger_name,
                                "expression": trigger_expression,
                                "priority": trigger_priority,
                                "tags": trigger_tags
                            }
                            
                            trigger_result = zabbix.create_trigger(trigger_data)
                            print(f"Trigger créé avec succès: {trigger_result['triggerids'][0]}")
                            
                        except Exception as e:
                            print(f"Erreur lors de la création de l'item/trigger: {e}")
                            continue
        
        print("Injection des alarmes terminée avec succès!")
        
    except Exception as e:
        print(f"Erreur: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()