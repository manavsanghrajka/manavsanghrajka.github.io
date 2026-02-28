from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import yfinance as yf
import pandas_ta as ta
import os
from supabase import create_client, Client
from datetime import datetime

# Initialize FastAPI
app = FastAPI()

# Supabase Initialization
url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_KEY", "")

supabase: Optional[Client] = None
if url and key:
    supabase = create_client(url, key)

@app.get("/")
def read_root():
    return {"status": "ok", "service": "stock-predictor-ml"}

# --- NEW GLOBAL MODEL ENDPOINTS ---

@app.get("/global-weights")
def get_global_weights():
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured.")
        
    res = supabase.table("model_weights").select("*").eq("model_type", "lasso_global").order("created_date", desc=True).limit(50).execute()
    
    if not res.data:
        return {"weights": {}, "intercept": 0.0, "date": None}
        
    latest_date = res.data[0]['created_date']
    weights = {}
    intercept = 0.0
    
    for row in res.data:
        if row['created_date'] != latest_date:
            continue
        if row['variable_name'] == 'INTERCEPT':
            intercept = row['weight']
        else:
            weights[row['variable_name']] = row['weight']
            
    return {"weights": weights, "intercept": intercept, "date": latest_date}


class OnDemandPredictionResponse(BaseModel):
    ticker: str
    predicted_log_return: float
    predicted_price: float
    current_price: float
    direction: str
    active_variables: Dict[str, float]


@app.get("/predict-on-demand", response_model=OnDemandPredictionResponse)
def predict_on_demand(ticker: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured.")

    # 1. Fetch Global Model Data from Supabase
    res_weights = supabase.table("model_weights").select("*").in_("model_type", ["lasso_global", "lasso_global_mean", "lasso_global_scale"]).order("created_date", desc=True).limit(200).execute()
    
    if not res_weights.data:
         raise HTTPException(status_code=404, detail="No global model weights found. Wait for the daily job to run.")
         
    latest_date = res_weights.data[0]['created_date']
    
    weights = {}
    means = {}
    scales = {}
    intercept = 0.0
    
    for row in res_weights.data:
        if row['created_date'] != latest_date: continue
        var_name = row['variable_name']
        val = row['weight']
        m_type = row['model_type']
        
        if m_type == "lasso_global":
            if var_name == "INTERCEPT": intercept = val
            else: weights[var_name] = val
        elif m_type == "lasso_global_mean": means[var_name] = val
        elif m_type == "lasso_global_scale": scales[var_name] = val

    if not weights:
         raise HTTPException(status_code=500, detail="Model weights are empty.")

    # 2. Fetch Ticker Data (6mo to ensure plenty of data for 50-day moving average)
    try:
        hist = yf.download(ticker, period="6mo", interval="1d", progress=False)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Failed to fetch data from Yahoo Finance: {str(e)}")

    if hist.empty:
        raise HTTPException(status_code=404, detail=f"No data found for ticker {ticker}")
        
    if isinstance(hist.columns, pd.MultiIndex):
        hist.columns = hist.columns.get_level_values(0)
    hist = hist.rename(columns={"Close": "close", "Volume": "volume", "Open": "open", "High": "high", "Low": "low"})
    hist.index = pd.to_datetime(hist.index).tz_localize(None)

    # 3. Compute Features (Same as daily_job.py)
    df = hist.copy()
    try:
        df['rsi_14'] = df.ta.rsi(length=14)
        df['sma_20'] = df.ta.sma(length=20)
        df['sma_50'] = df.ta.sma(length=50)
        
        macd = df.ta.macd()
        if macd is not None and not macd.empty:
            df['macd'] = macd.iloc[:, 0]
            df['macd_hist'] = macd.iloc[:, 1]
            df['macd_signal'] = macd.iloc[:, 2]
        
        bbands = df.ta.bbands()
        if bbands is not None and not bbands.empty:
            df['bb_lower'] = bbands.iloc[:, 0]
            df['bb_mid'] = bbands.iloc[:, 1]
            df['bb_upper'] = bbands.iloc[:, 2]
            df['bb_bandwidth'] = bbands.iloc[:, 3]
        
        df['atr_14'] = df.ta.atr(length=14)
        
        df['log_ret'] = np.log(df['close'] / df['close'].shift(1))
        df['volatility_20'] = df['log_ret'].rolling(window=20).std()
        
        df['ret_1d'] = df['log_ret']
        df['ret_5d'] = df['log_ret'].rolling(window=5).sum()
        df['ret_10d'] = df['log_ret'].rolling(window=10).sum()
        df['ret_20d'] = df['log_ret'].rolling(window=20).sum()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing technical indicators: {str(e)}")
        
    # 4. Extract Last Row
    last_row = df.iloc[-1].copy()
    
    features_ordered = list(weights.keys())
    for f in features_ordered:
        if f not in last_row or pd.isna(last_row[f]):
            last_row[f] = 0.0 # fallback for NaNs
            
    # 5. Scale and Predict
    prediction = intercept
    for f in features_ordered:
        val = last_row[f]
        mean_val = means.get(f, 0.0)
        scale_val = scales.get(f, 1.0)
        if scale_val == 0: scale_val = 1.0
        
        scaled_val = (val - mean_val) / scale_val
        prediction += scaled_val * weights[f]
        
    current_price = float(last_row['close'])
    predicted_price = current_price * np.exp(prediction)
    direction = "UP" if prediction > 0 else "DOWN"

    return OnDemandPredictionResponse(
        ticker=ticker.upper(),
        predicted_log_return=float(prediction),
        predicted_price=float(predicted_price),
        current_price=float(current_price),
        direction=direction,
        active_variables=weights
    )

# --- LEGACY LOCAL PREDICTION ENDPOINT (For Compatibility) ---

class TrainingData(BaseModel):
    date: str
    close: float
    volume: float
    sma_20: float
    volatility: float
    fed_funds: float
    cpi: float

class PredictionRequest(BaseModel):
    training_data: List[TrainingData]
    current_features: Dict[str, float]
    days_ahead: int

def ridge_closed_form(X: np.ndarray, y: np.ndarray, lam: float):
    n, p = X.shape
    y_mean = np.mean(y)
    y_centered = y - y_mean
    XtX = X.T @ X
    regularization = lam * np.eye(p)
    Xty = X.T @ y_centered
    beta = np.linalg.solve(XtX + regularization, Xty)
    intercept = y_mean
    return beta, intercept

def ridge_predict(X: np.ndarray, beta: np.ndarray, intercept: float):
    return X @ beta + intercept

def cross_validate_lambda(X: np.ndarray, y: np.ndarray, lambdas: list, k: int = 5):
    n = len(y)
    indices = np.arange(n)
    fold_size = n // k
    best_lam = lambdas[0]
    best_mse = float('inf')

    for lam in lambdas:
        mse_folds = []
        for fold in range(k):
            val_start = fold * fold_size
            val_end = val_start + fold_size if fold < k - 1 else n
            val_idx = indices[val_start:val_end]
            train_idx = np.concatenate([indices[:val_start], indices[val_end:]])

            X_tr, X_val = X[train_idx], X[val_idx]
            y_tr, y_val = y[train_idx], y[val_idx]

            beta, intercept = ridge_closed_form(X_tr, y_tr, lam)
            y_pred = ridge_predict(X_val, beta, intercept)
            mse = np.mean((y_val - y_pred) ** 2)
            mse_folds.append(mse)

        avg_mse = np.mean(mse_folds)
        if avg_mse < best_mse:
            best_mse = avg_mse
            best_lam = lam

    return best_lam

@app.post("/train-and-predict")
def train_and_predict(request: PredictionRequest):
    try:
        df = pd.DataFrame([vars(d) for d in request.training_data])
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date').reset_index(drop=True)

        df['log_return'] = np.log(df['close'] / df['close'].shift(1))
        df['ret_1d'] = df['log_return'].shift(1)
        df['ret_5d'] = df['log_return'].rolling(5).sum().shift(1)
        df['ret_10d'] = df['log_return'].rolling(10).sum().shift(1)
        df['ret_20d'] = df['log_return'].rolling(20).sum().shift(1)

        df['target_return'] = np.log(df['close'].shift(-request.days_ahead) / df['close'])
        df = df.dropna()

        if len(df) < 50:
            raise HTTPException(status_code=400, detail="Insufficient training data")

        feature_cols = ['ret_1d', 'ret_5d', 'ret_10d', 'ret_20d', 'volume', 'volatility', 'fed_funds', 'cpi']

        X_raw = df[feature_cols].values
        y_raw = df['target_return'].values

        split_idx = int(len(X_raw) * 0.8)
        X_train_raw, X_test_raw = X_raw[:split_idx], X_raw[split_idx:]
        y_train, y_test = y_raw[:split_idx], y_raw[split_idx:]

        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train_raw)
        X_test_scaled = scaler.transform(X_test_raw)

        lambdas = [0.001, 0.01, 0.1, 1.0, 10.0, 100.0, 1000.0]
        best_lam = cross_validate_lambda(X_train_scaled, y_train, lambdas, k=5)
        beta_train, intercept_train = ridge_closed_form(X_train_scaled, y_train, best_lam)

        y_pred_test = ridge_predict(X_test_scaled, beta_train, intercept_train)
        ss_res = np.sum((y_test - y_pred_test) ** 2)
        ss_tot = np.sum((y_test - np.mean(y_test)) ** 2)
        r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0.0

        actual_dir = np.sign(y_test)
        pred_dir = np.sign(y_pred_test)
        non_flat = actual_dir != 0
        hit_rate = float(np.mean(actual_dir[non_flat] == pred_dir[non_flat])) if non_flat.sum() > 0 else 0.0

        X_all_scaled = scaler.fit_transform(X_raw)
        best_lam_final = cross_validate_lambda(X_all_scaled, y_raw, lambdas, k=5)
        beta_final, intercept_final = ridge_closed_form(X_all_scaled, y_raw, best_lam_final)

        full_data = [vars(d) for d in request.training_data]
        current_date_row = {
            'date': '2100-01-01',
            'close': request.current_features['close'],
            'volume': request.current_features['volume'],
            'sma_20': request.current_features['sma_20'],
            'volatility': request.current_features['volatility'],
            'fed_funds': request.current_features['fed_funds'],
            'cpi': request.current_features['cpi']
        }
        full_data.append(current_date_row)
        
        df_full = pd.DataFrame(full_data)
        df_full['log_return'] = np.log(df_full['close'] / df_full['close'].shift(1))
        
        curr_log_ret = df_full['log_return'].iloc[-1]
        curr_ret_5d = df_full['log_return'].rolling(5).sum().iloc[-1]
        curr_ret_10d = df_full['log_return'].rolling(10).sum().iloc[-1]
        curr_ret_20d = df_full['log_return'].rolling(20).sum().iloc[-1]
        
        current_feats_vec = np.array([[
            curr_log_ret, curr_ret_5d, curr_ret_10d, curr_ret_20d,
            request.current_features['volume'],
            request.current_features['volatility'],
            request.current_features['fed_funds'],
            request.current_features['cpi']
        ]])
        
        current_scaled = scaler.transform(current_feats_vec)
        pred_log_return = ridge_predict(current_scaled, beta_final, intercept_final)[0]
        
        current_price = request.current_features['close']
        predicted_price = current_price * np.exp(pred_log_return)

        importance = np.abs(beta_final)
        total_importance = importance.sum()
        importance_pct = (importance / total_importance) * 100 if total_importance > 0 else importance

        feature_importance_dict = {
            "Momentum_1D": float(importance_pct[0]),
            "Momentum_5D": float(importance_pct[1]),
            "Momentum_10D": float(importance_pct[2]),
            "Momentum_20D": float(importance_pct[3]),
            "Volume": float(importance_pct[4]),
            "Volatility": float(importance_pct[5]),
            "Fed Funds": float(importance_pct[6]),
            "CPI": float(importance_pct[7])
        }

        return {
            "predicted_price": float(predicted_price),
            "r_squared": float(r_squared),
            "hit_rate": float(hit_rate),
            "feature_importance": feature_importance_dict,
            "lambda_selected": float(best_lam_final)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
