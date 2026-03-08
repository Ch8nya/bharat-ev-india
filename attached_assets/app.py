import os
import threading
import webbrowser
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import pandas as pd
import uvicorn

MFG_CSV = "manufacturers_final.csv"
MODELS_CSV = "models_final.csv"
VARS_CSV = "vehicles_final.csv"

# Safe loader
def load_csv(path: str) -> pd.DataFrame:
    if os.path.exists(path):
        return pd.read_csv(path, dtype=str).fillna("")
    return pd.DataFrame()

def save_csv(df: pd.DataFrame, path: str):
    df.to_csv(path, index=False)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Launch browser after a short delay
    def open_browser():
        webbrowser.open("http://127.0.0.1:8000")
    threading.Timer(1.5, open_browser).start()
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/")
async def get_index():
    return FileResponse("index.html")

@app.get("/api/data")
def get_all_data():
    return {
        "manufacturers": load_csv(MFG_CSV).to_dict(orient="records"),
        "models": load_csv(MODELS_CSV).to_dict(orient="records"),
        "variants": load_csv(VARS_CSV).to_dict(orient="records")
    }

# --- MANUFACTURERS ---
@app.post("/api/manufacturers")
def add_mfg(data: Dict[str, str]):
    df = load_csv(MFG_CSV)
    if "Manufacturer" in df.columns and data.get("Manufacturer") in df["Manufacturer"].values:
        raise HTTPException(400, "Manufacturer already exists")
    
    new_df = pd.DataFrame([data])
    df = pd.concat([df, new_df], ignore_index=True) if not df.empty else new_df
    save_csv(df, MFG_CSV)
    return {"status": "ok"}

@app.put("/api/manufacturers/{old_name}")
def edit_mfg(old_name: str, data: Dict[str, str]):
    df = load_csv(MFG_CSV)
    if df.empty or old_name not in df["Manufacturer"].values:
        raise HTTPException(404, "Not found")
    
    new_name = data.get("Manufacturer")
    if old_name != new_name and new_name in df["Manufacturer"].values:
        raise HTTPException(400, "New Manufacturer name already exists")
    
    idx = df.index[df["Manufacturer"] == old_name].tolist()[0]
    for k, v in data.items():
        if k in df.columns:
            df.at[idx, k] = str(v)
    save_csv(df, MFG_CSV)
    
    # Cascade
    if old_name != new_name:
        df_mod = load_csv(MODELS_CSV)
        if not df_mod.empty and "Manufacturer" in df_mod.columns:
            df_mod.loc[df_mod["Manufacturer"] == old_name, "Manufacturer"] = new_name
            save_csv(df_mod, MODELS_CSV)
            
        df_var = load_csv(VARS_CSV)
        if not df_var.empty and "Manufacturer Name" in df_var.columns:
            df_var.loc[df_var["Manufacturer Name"] == old_name, "Manufacturer Name"] = new_name
            save_csv(df_var, VARS_CSV)
            
    return {"status": "ok"}

@app.delete("/api/manufacturers/{name}")
def delete_mfg(name: str):
    df = load_csv(MFG_CSV)
    if not df.empty:
        df = df[df["Manufacturer"] != name]
        save_csv(df, MFG_CSV)
    
    # Cascade
    df_mod = load_csv(MODELS_CSV)
    if not df_mod.empty:
        df_mod = df_mod[df_mod["Manufacturer"] != name]
        save_csv(df_mod, MODELS_CSV)
    
    df_var = load_csv(VARS_CSV)
    if not df_var.empty:
        df_var = df_var[df_var["Manufacturer Name"] != name]
        save_csv(df_var, VARS_CSV)
        
    return {"status": "ok"}


# --- MODELS ---
class ModelEditData(BaseModel):
    old_mfg: str
    old_name: str
    data: Dict[str, str]

@app.post("/api/models")
def add_model(data: Dict[str, str]):
    df = load_csv(MODELS_CSV)
    if not df.empty and "Manufacturer" in df.columns and "Model Name" in df.columns:
        exists = df[(df["Manufacturer"] == data.get("Manufacturer")) & (df["Model Name"] == data.get("Model Name"))]
        if not exists.empty:
            raise HTTPException(400, "Model already exists")
            
    new_df = pd.DataFrame([data])
    df = pd.concat([df, new_df], ignore_index=True) if not df.empty else new_df
    save_csv(df, MODELS_CSV)
    return {"status": "ok"}

@app.put("/api/models/edit")
def edit_model(payload: ModelEditData):
    df = load_csv(MODELS_CSV)
    if df.empty: raise HTTPException(404, "Model not found")
        
    target = df[(df["Manufacturer"] == payload.old_mfg) & (df["Model Name"] == payload.old_name)]
    if target.empty:
        raise HTTPException(404, "Model not found")
        
    idx = target.index[0]
    for k, v in payload.data.items():
        if k in df.columns:
            df.at[idx, k] = str(v)
    save_csv(df, MODELS_CSV)
    
    new_mfg = payload.data.get("Manufacturer", payload.old_mfg)
    new_name = payload.data.get("Model Name", payload.old_name)
    
    # cascade
    if payload.old_name != new_name or payload.old_mfg != new_mfg:
        df_var = load_csv(VARS_CSV)
        if not df_var.empty:
            mask = (df_var["Manufacturer Name"] == payload.old_mfg) & (df_var["Model Name"] == payload.old_name)
            df_var.loc[mask, "Manufacturer Name"] = new_mfg
            df_var.loc[mask, "Model Name"] = new_name
            save_csv(df_var, VARS_CSV)
            
    return {"status": "ok"}

@app.post("/api/models/delete")
def delete_model(payload: Dict[str, str]):
    mfg = payload.get("Manufacturer")
    name = payload.get("Model Name")
    
    df = load_csv(MODELS_CSV)
    if not df.empty:
        df = df[~((df["Manufacturer"] == mfg) & (df["Model Name"] == name))]
        save_csv(df, MODELS_CSV)
    
    df_var = load_csv(VARS_CSV)
    if not df_var.empty:
        df_var = df_var[~((df_var["Manufacturer Name"] == mfg) & (df_var["Model Name"] == name))]
        save_csv(df_var, VARS_CSV)
        
    return {"status": "ok"}


# --- VARIANTS ---
class VariantEditData(BaseModel):
    old_mfg: str
    old_model: str
    old_variant: str
    data: Dict[str, str]

@app.post("/api/variants")
def add_variant(data: Dict[str, str]):
    df = load_csv(VARS_CSV)
    new_df = pd.DataFrame([data])
    df = pd.concat([df, new_df], ignore_index=True) if not df.empty else new_df
    save_csv(df, VARS_CSV)
    return {"status": "ok"}

@app.put("/api/variants/edit")
def edit_variant(payload: VariantEditData):
    df = load_csv(VARS_CSV)
    if df.empty: raise HTTPException(404, "Variant not found")
        
    target = df[(df["Manufacturer Name"] == payload.old_mfg) & 
                (df["Model Name"] == payload.old_model) &
                (df["Variant Name"] == payload.old_variant)]
    if target.empty:
        raise HTTPException(404, "Variant not found")
        
    idx = target.index[0]
    for k, v in payload.data.items():
        if k in df.columns:
            df.at[idx, k] = str(v)
    save_csv(df, VARS_CSV)
    return {"status": "ok"}

@app.post("/api/variants/delete")
def delete_variant(payload: Dict[str, str]):
    mfg = payload.get("Manufacturer Name")
    model = payload.get("Model Name")
    var = payload.get("Variant Name")
    
    df = load_csv(VARS_CSV)
    if not df.empty:
        df = df[~((df["Manufacturer Name"] == mfg) & 
                  (df["Model Name"] == model) & 
                  (df["Variant Name"] == var))]
        save_csv(df, VARS_CSV)
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
