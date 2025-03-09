#!/usr/bin/env python3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from zabbix_api import ZabbixAPI, ZabbixConfig
import uvicorn

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Zabbix API instance
zabbix_api = None

class ZabbixConfigModel(BaseModel):
    url: str
    username: str
    password: str
    http_proxy: Optional[str] = None
    timeout: Optional[int] = 30

class HostModel(BaseModel):
    hostname: str
    ip_address: str
    template_names: List[str]
    group_name: str
    proxy_name: Optional[str] = None
    disabled_metrics: List[str] = []
    enabled_metrics: Optional[List[str]] = None
    macros: Optional[dict] = None

@app.post("/api/configure")
async def configure_zabbix(config: ZabbixConfigModel):
    global zabbix_api
    try:
        zabbix_api = ZabbixAPI(ZabbixConfig(**config.dict()))
        zabbix_api.login()
        return {"status": "success", "message": "Connected to Zabbix API"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/templates")
async def get_templates():
    if not zabbix_api:
        raise HTTPException(status_code=400, detail="Zabbix API not configured")
    try:
        return zabbix_api.get_templates()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/items/{template_id}")
async def get_template_items(template_id: str):
    if not zabbix_api:
        raise HTTPException(status_code=400, detail="Zabbix API not configured")
    try:
        return zabbix_api.get_items(template_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/items/{item_id}/status")
async def update_item_status(item_id: str, status: int):
    if not zabbix_api:
        raise HTTPException(status_code=400, detail="Zabbix API not configured")
    try:
        return zabbix_api.update_item_status(item_id, status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/hosts")
async def create_host(host: HostModel):
    if not zabbix_api:
        raise HTTPException(status_code=400, detail="Zabbix API not configured")
    try:
        host_data = {
            "host": host.hostname,
            "interfaces": [{
                "type": 1,  # Agent
                "main": 1,
                "useip": 1,
                "ip": host.ip_address,
                "dns": "",
                "port": "10050"
            }],
            "groups": [{"name": host.group_name}],
            "templates": [{"name": name} for name in host.template_names]
        }
        
        if host.proxy_name:
            host_data["proxy_hostid"] = host.proxy_name
            
        if host.macros:
            host_data["macros"] = [
                {"macro": k, "value": v} for k, v in host.macros.items()
            ]
            
        result = zabbix_api.create_host(host_data)
        
        # Handle disabled metrics
        if host.disabled_metrics:
            template_items = []
            for template_name in host.template_names:
                template = next(t for t in zabbix_api.get_templates() if t["name"] == template_name)
                template_items.extend(zabbix_api.get_items(template["templateid"]))
                
            for item in template_items:
                if item["key_"] in host.disabled_metrics:
                    zabbix_api.update_item_status(item["itemid"], 1)
                    
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/problems")
async def get_problems():
    if not zabbix_api:
        raise HTTPException(status_code=400, detail="Zabbix API not configured")
    try:
        return zabbix_api.get_problems()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/alerts")
async def get_alerts():
    if not zabbix_api:
        raise HTTPException(status_code=400, detail="Zabbix API not configured")
    try:
        return zabbix_api.get_alerts()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/inventory")
async def get_inventory():
    if not zabbix_api:
        raise HTTPException(status_code=400, detail="Zabbix API not configured")
    try:
        return zabbix_api.get_host_inventory()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)