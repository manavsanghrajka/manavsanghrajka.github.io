import os
import time
import pandas as pd
import numpy as np
import yfinance as yf
import pandas_ta as ta
from supabase import create_client, Client
from datetime import datetime, timedelta
import logging
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LassoCV

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")

supabase: Client = create_client(url, key)

TABLE_PREDICTIONS = "predictions"
TABLE_WEIGHTS = "model_weights"

# Top 50 S&P 500 companies by market cap
TOP_50_TICKERS = [
    'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'BRK-B', 'LLY', 'AVGO', 'V',
    'JPM', 'TSLA', 'WMT', 'UNH', 'MA', 'PG', 'JNJ', 'XOM', 'HD', 'MRK',
    'COST', 'ABBV', 'ORCL', 'CVX', 'CRM', 'AMD', 'BAC', 'PEP', 'KO', 'NFLX',
    'TMO', 'WFC', 'ADBE', 'LIN', 'DIS', 'MCD', 'ABT', 'CSCO', 'INTC', 'CMCSA',
    'IBM', 'QCOM', 'CAT', 'DHR', 'PFE', 'AMAT', 'NOW', 'GE', 'TXN', 'AXP'
]

def fetch_history(ticker):
    """Fetch last 2 years of data for a ticker to compute features and train."""
    try:
        hist = yf.download(ticker, period="2y", interval="1d", progress=False)
        if hist.empty:
            return None
        
        if isinstance(hist.columns, pd.MultiIndex):
            hist.columns = hist.columns.get_level_values(0)
            
        hist = hist.rename(columns={
            "Close": "close", 
            "Volume": "volume", 
            "Open": "open", 
            "High": "high", 
            "Low": "low"
        })
        
        hist.index = pd.to_datetime(hist.index).tz_localize(None)
        return hist
    except Exception as e:
        logging.error(f"Error fetching data for {ticker}: {e}")
        return None

def compute_features(df):
    """Compute features using pandas-ta."""
    df = df.copy()
    
    # Technical Indicators
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
    
    # Returns and volatility
    df['log_ret'] = np.log(df['close'] / df['close'].shift(1))
    df['volatility_20'] = df['log_ret'].rolling(window=20).std()
    
    df['ret_1d'] = df['log_ret']
    df['ret_5d'] = df['log_ret'].rolling(window=5).sum()
    df['ret_10d'] = df['log_ret'].rolling(window=10).sum()
    df['ret_20d'] = df['log_ret'].rolling(window=20).sum()
    
    return df

def run_evaluation():
    """Phase 1: Evaluate yesterday's predictions"""
    try:
        today_str = datetime.now().strftime('%Y-%m-%d')
        logging.info(f"Phase 1: Evaluating predictions for {today_str}...")
        
        res = supabase.table(TABLE_PREDICTIONS).select("*").eq("predicted_date", today_str).is_("actual_log_return", "null").execute()
        
        if not res.data:
            logging.info("No unevaluated predictions for today.")
            return

        evaluated_count = 0
        for row in res.data:
            ticker = row['ticker']
            pred_id = row['id']
            pred_direction = row['predicted_direction']

            hist = fetch_history(ticker)
            if hist is None or len(hist) < 2:
                continue
                
            today_data = hist.loc[hist.index <= today_str]
            if len(today_data) < 2:
                continue
            
            latest = today_data.iloc[-1]
            prev = today_data.iloc[-2]
            
            actual_log_return = np.log(float(latest['close']) / float(prev['close']))
            actual_direction = 1 if actual_log_return > 0 else -1
            is_correct = (pred_direction == actual_direction)

            supabase.table(TABLE_PREDICTIONS).update({
                "actual_log_return": actual_log_return,
                "actual_direction": actual_direction,
                "is_correct": is_correct
            }).eq("id", pred_id).execute()
            
            evaluated_count += 1
            
        logging.info(f"Evaluated {evaluated_count} predictions for {today_str}.")
    except Exception as e:
        logging.error(f"Error in phase 1 evaluation: {e}")

def run_training_and_prediction():
    """Phase 2 & 3: Train Global Model and Predict for Tomorrow"""
    logging.info("Phase 2 & 3: Training Global Model & Making Predictions...")
    today_str = datetime.now().strftime('%Y-%m-%d')
    next_day_str = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')

    all_data = []
    current_features_dict = {}

    features = [
        'rsi_14', 'sma_20', 'sma_50', 'macd', 'macd_hist', 'macd_signal',
        'bb_lower', 'bb_mid', 'bb_upper', 'bb_bandwidth', 'atr_14',
        'volatility_20', 'ret_1d', 'ret_5d', 'ret_10d', 'ret_20d', 'volume'
    ]
    
    # Gather Data
    for ticker in TOP_50_TICKERS:
        df = fetch_history(ticker)
        if df is None or len(df) < 100:
            continue
            
        df = compute_features(df)
        df['target'] = np.log(df['close'].shift(-1) / df['close']) # Next day return
        
        current_row = df.iloc[-1].copy()
        current_features_dict[ticker] = current_row
        
        train_df = df.dropna(subset=features + ['target']).copy()
        all_data.append(train_df)
        
        time.sleep(1) # Be polite to Yahoo Finance

    if not all_data:
        logging.error("No data gathered for training.")
        return

    combined_df = pd.concat(all_data)
    
    X = combined_df[features].values
    y = combined_df['target'].values
    
    # Train Global Model
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    logging.info(f"Training LassoCV on {len(X_scaled)} combined samples...")
    model = LassoCV(cv=5, random_state=42, max_iter=10000)
    model.fit(X_scaled, y)
    
    # Save Weights to Supabase
    coefficients = model.coef_
    intercept = model.intercept_
    
    logging.info(f"Global Model Intercept: {intercept}")
    for f, c in zip(features, coefficients):
        if abs(c) > 1e-6:
            logging.info(f"Selected Feature {f}: {c}")
            data = {
                "created_date": today_str,
                "model_type": "lasso_global",
                "variable_name": f,
                "weight": float(c)
            }
            try:
                supabase.table(TABLE_WEIGHTS).upsert(data, on_conflict="created_date,model_type,variable_name").execute()
            except Exception as e:
                logging.error(f"Error saving weight: {e}")

    # Save scaling params
    for i, f in enumerate(features):
        try:
            supabase.table(TABLE_WEIGHTS).upsert({"created_date": today_str, "model_type": "lasso_global_mean", "variable_name": f, "weight": float(scaler.mean_[i])}, on_conflict="created_date,model_type,variable_name").execute()
            supabase.table(TABLE_WEIGHTS).upsert({"created_date": today_str, "model_type": "lasso_global_scale", "variable_name": f, "weight": float(scaler.scale_[i])}, on_conflict="created_date,model_type,variable_name").execute()
        except: pass
            
    try:
        supabase.table(TABLE_WEIGHTS).upsert({"created_date": today_str, "model_type": "lasso_global", "variable_name": "INTERCEPT", "weight": float(intercept)}, on_conflict="created_date,model_type,variable_name").execute()
    except: pass

    # Predict Next Day
    preds_made = 0
    for ticker, current_row in current_features_dict.items():
        try:
            # Check for NaNs
            curr_vals = current_row[features].values.astype(float)
            if np.isnan(curr_vals).any():
                continue
                
            curr_X = curr_vals.reshape(1, -1)
            curr_X_scaled = scaler.transform(curr_X)
            
            pred_log_ret = model.predict(curr_X_scaled)[0]
            direction = 1 if pred_log_ret > 0 else -1
            
            data = {
                "ticker": ticker,
                "predicted_date": next_day_str,
                "predicted_log_return": float(pred_log_ret),
                "predicted_direction": direction
            }
            # Use upsert to avoid duplicate row errors if run multiple times
            supabase.table(TABLE_PREDICTIONS).upsert(data, on_conflict="ticker,predicted_date").execute()
            preds_made += 1
        except Exception as e:
            logging.error(f"Error predicting for {ticker}: {e}")
            
    logging.info(f"Made {preds_made} predictions for {next_day_str}.")

def run():
    logging.info("--- Starting Daily Prediction Job ---")
    run_evaluation()
    run_training_and_prediction()
    logging.info("--- Daily Job Complete ---")

if __name__ == "__main__":
    run()
