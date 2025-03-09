#!/usr/bin/env python3
import json
import requests
from typing import Dict, List, Optional, Union
from dataclasses import dataclass

@dataclass
class ZabbixConfig:
    url: str
    username: str
    password: str
    http_proxy: Optional[str] = None
    timeout: int = 30

class ZabbixAPI:
    def __init__(self, config: ZabbixConfig):
        self.config = config
        self.token = None
        self.session = requests.Session()
        if config.http_proxy:
            self.session.proxies = {
                'http': config.http_proxy,
                'https': config.http_proxy
            }

    def _request(self, method: str, params: Dict = None) -> Dict:
        if params is None:
            params = {}

        headers = {'Content-Type': 'application/json-rpc'}
        
        data = {
            'jsonrpc': '2.0',
            'method': method,
            'params': {
                **params,
                **({"auth": self.token} if self.token else {})
            },
            'id': 1
        }

        response = self.session.post(
            self.config.url,
            headers=headers,
            data=json.dumps(data),
            timeout=self.config.timeout
        )
        
        result = response.json()
        
        if 'error' in result:
            raise Exception(f"Zabbix API error: {result['error']}")
            
        return result['result']

    def login(self) -> str:
        result = self._request('user.login', {
            'user': self.config.username,
            'password': self.config.password
        })
        self.token = result
        return result

    def get_templates(self) -> List[Dict]:
        return self._request('template.get', {
            'output': ['templateid', 'name', 'description'],
            'selectItems': ['itemid', 'name', 'key_', 'status']
        })

    def get_items(self, template_id: str) -> List[Dict]:
        return self._request('item.get', {
            'output': ['itemid', 'name', 'key_', 'status'],
            'templateids': [template_id]
        })

    def update_item_status(self, item_id: str, status: int) -> Dict:
        return self._request('item.update', {
            'itemid': item_id,
            'status': status  # 0 = enabled, 1 = disabled
        })

    def create_host(self, host_data: Dict) -> Dict:
        return self._request('host.create', host_data)

    def get_problems(self) -> List[Dict]:
        return self._request('problem.get', {
            'output': 'extend',
            'selectAcknowledges': 'extend',
            'recent': True,
            'sortfield': ['eventid'],
            'sortorder': 'DESC'
        })

    def get_alerts(self) -> List[Dict]:
        return self._request('trigger.get', {
            'output': ['triggerid', 'description', 'priority', 'value', 'lastchange'],
            'selectHosts': ['hostid', 'name'],
            'selectItems': ['itemid', 'name'],
            'filter': {
                'value': 1  # Only active problems
            },
            'sortfield': 'lastchange',
            'sortorder': 'DESC',
            'limit': 100
        })

    def get_host_inventory(self) -> List[Dict]:
        return self._request('host.get', {
            'output': ['hostid', 'name', 'status'],
            'selectInventory': True,
            'selectInterfaces': True
        })