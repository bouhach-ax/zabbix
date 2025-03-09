#!/usr/bin/env python3
import os
import json
import requests
import sys
import time
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

    def get_items(self):
        return self.api_call("item.get", {
            "output": ["itemid", "name", "key_", "hostid"],
            "search": {
                "key_": "alert."
            },
            "searchWildcardsEnabled": True,
            "selectHosts": ["hostid", "host", "name"]
        })

    def get_hosts(self):
        return self.api_call("host.get", {
            "output": ["hostid", "host", "name"]
        })

    def send_value(self, host, key, value):
        # Utiliser l'API history.create pour simuler l'envoi de valeurs
        return self.api_call("history.create", [
            {
                "itemid": key,
                "value": str(value),
                "clock": int(time.time()),
                "ns": 0
            }
        ])

def main():
    # Initialiser l'API Zabbix
    zabbix = ZabbixAPI(ZABBIX_API_URL, ZABBIX_USERNAME, ZABBIX_PASSWORD)
    
    try:
        # Se connecter à Zabbix
        zabbix.login()
        
        # Récupérer les items d'alerte
        print("Récupération des items d'alerte...")
        items = zabbix.get_items()
        print(f"Récupéré {len(items)} items")
        
        if not items:
            print("Aucun item d'alerte trouvé. Exécutez d'abord le script inject_alarms.py")
            sys.exit(1)
        
        # Récupérer les hôtes
        hosts = zabbix.get_hosts()
        host_map = {host["hostid"]: host["host"] for host in hosts}
        
        # Activer aléatoirement certaines alertes
        import random
        selected_items = random.sample(items, min(len(items), 10))
        
        for item in selected_items:
            host_name = item["hosts"][0]["host"]
            item_key = item["key_"]
            item_id = item["itemid"]
            
            print(f"Activation de l'alerte: {item['name']} sur l'hôte {host_name}")
            
            try:
                # Envoyer la valeur 1 pour déclencher l'alerte
                zabbix.send_value(host_name, item_id, 1)
                print(f"Alerte activée avec succès")
                time.sleep(1)  # Pause pour éviter de surcharger l'API
            except Exception as e:
                print(f"Erreur lors de l'activation de l'alerte: {e}")
                
                # Essayer une méthode alternative
                try:
                    print("Tentative alternative d'activation...")
                    
                    # Mettre à jour directement la valeur de l'item
                    zabbix.api_call("item.update", {
                        "itemid": item_id,
                        "lastvalue": "1",
                        "prevvalue": "0"
                    })
                    
                    print("Alerte activée avec succès (méthode alternative)")
                except Exception as alt_e:
                    print(f"Échec de l'activation alternative: {alt_e}")
        
        print("Activation des alarmes terminée avec succès!")
        
    except Exception as e:
        print(f"Erreur: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()