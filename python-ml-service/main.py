from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler

app = FastAPI()

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
    """
    Closed-form Ridge Regression: β̂ = (XᵀX + λI)⁻¹ Xᵀy
    Returns (coefficients, intercept).
    Assumes X is already standardized.
    """
    n, p = X.shape
    # Add intercept by centering y (since X is standardized, mean is 0)
    y_mean = np.mean(y)
    y_centered = y - y_mean

    # β̂ = (XᵀX + λI)⁻¹ Xᵀy
    XtX = X.T @ X                        # (p x p)
    regularization = lam * np.eye(p)     # λI (p x p)
    Xty = X.T @ y_centered               # (p x 1)
    beta = np.linalg.solve(XtX + regularization, Xty)  # More stable than inverse

    intercept = y_mean  # Since X is centered (standardized), intercept = mean(y)
    return beta, intercept


def ridge_predict(X: np.ndarray, beta: np.ndarray, intercept: float):
    """Predict using Ridge coefficients."""
    return X @ beta + intercept


def cross_validate_lambda(X: np.ndarray, y: np.ndarray, lambdas: list, k: int = 5):
    """
    K-fold cross-validation to select the best λ.
    Returns the λ with the lowest average MSE across folds.
    """
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


@app.get("/")
def read_root():
    return {"status": "ok", "service": "stock-predictor-ml"}

@app.post("/train-and-predict")
def train_and_predict(request: PredictionRequest):
    try:
        # 1. Prepare Data
        df = pd.DataFrame([vars(d) for d in request.training_data])
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date').reset_index(drop=True)

        # Feature Engineering: Log Returns & Lagged Features
        # Log Return = ln(price_t / price_{t-1})
        df['log_return'] = np.log(df['close'] / df['close'].shift(1))

        # Lagged Returns (Momentum)
        # We use PAST returns to predict FUTURE returns
        df['ret_1d'] = df['log_return'].shift(1)
        df['ret_5d'] = df['log_return'].rolling(5).sum().shift(1)
        df['ret_10d'] = df['log_return'].rolling(10).sum().shift(1)
        df['ret_20d'] = df['log_return'].rolling(20).sum().shift(1)

        # Target: Log Return over 'days_ahead' period
        # target = ln(price_{t+days_ahead} / price_t)
        df['target_return'] = np.log(df['close'].shift(-request.days_ahead) / df['close'])

        # Drop NaN values created by shifting/rolling
        df = df.dropna()

        if len(df) < 50:
            raise HTTPException(status_code=400, detail="Insufficient training data after feature engineering")

        feature_cols = ['ret_1d', 'ret_5d', 'ret_10d', 'ret_20d', 'volume', 'volatility', 'fed_funds', 'cpi']

        X_raw = df[feature_cols].values
        y_raw = df['target_return'].values

        # 2. Train/Test Split (80/20)
        split_idx = int(len(X_raw) * 0.8)
        X_train_raw, X_test_raw = X_raw[:split_idx], X_raw[split_idx:]
        y_train, y_test = y_raw[:split_idx], y_raw[split_idx:]

        # 3. Standardization
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train_raw)
        X_test_scaled = scaler.transform(X_test_raw)

        # 4. Cross-validate & Train (Closed-Form Ridge)
        lambdas = [0.001, 0.01, 0.1, 1.0, 10.0, 100.0, 1000.0]
        best_lam = cross_validate_lambda(X_train_scaled, y_train, lambdas, k=5)
        beta_train, intercept_train = ridge_closed_form(X_train_scaled, y_train, best_lam)

        # 5. Metrics (on Test Set)
        # R² on Log Returns (Honest)
        y_pred_test = ridge_predict(X_test_scaled, beta_train, intercept_train)
        ss_res = np.sum((y_test - y_pred_test) ** 2)
        ss_tot = np.sum((y_test - np.mean(y_test)) ** 2)
        r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0.0

        # Hit Rate (Directional Accuracy)
        # Actual direction is sign of target_return
        # Predicted direction is sign of predicted_return
        actual_dir = np.sign(y_test)
        pred_dir = np.sign(y_pred_test)
        non_flat = actual_dir != 0
        if non_flat.sum() > 0:
            hit_rate = float(np.mean(actual_dir[non_flat] == pred_dir[non_flat]))
        else:
            hit_rate = 0.0

        # 6. Re-fit on ALL data for Final Prediction
        X_all_scaled = scaler.fit_transform(X_raw)
        best_lam_final = cross_validate_lambda(X_all_scaled, y_raw, lambdas, k=5)
        beta_final, intercept_final = ridge_closed_form(X_all_scaled, y_raw, best_lam_final)

        # 7. Predict Next Interval
        # Construct current features vector from request
        # We need to compute the lagged features from the provided training data history
        # simpler approach: use the LAST row of the dataframe we just built
        # effectively predicting for the "next" unknown day
        last_row = df.iloc[-1]
        
        # We need to construct the input based on the *latest* available data
        # The request.current_features has raw values, but we need derived features (lags)
        # We can calculate them from the end of the dataframe
        
        # But wait - we technically need the features for "today" to predict "today + days_ahead"
        # The dataframe 'df' ends at the last day where we have a target (days_ahead ago)?
        # No, we dropped NaNs. The dataframe ends where we have both input AND target.
        # To predict for "tomorrow", we need inputs from "today".
        
        # Re-construct features for the "current" moment using the raw training data list + current_features
        # Append current_features to the end of the data list to compute rolling stats
        
        full_data = [vars(d) for d in request.training_data]
        # Create a temp df to compute features for the latest point
        # We add the "current" point as the last row
        current_date_row = {
            'date': '2100-01-01', # dummy date, doesn't matter
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
        
        # Compute lags for the very last row (the current moment)
        current_ret_1d = df_full['log_return'].iloc[-1] # This is return from T-1 to T (today)
        # Actually ret_1d meant return of previous day.
        # If we are at T, we want return T-1. 
        # The shift(1) in main df meant: at row T, use return from T-1.
        # So yes, we want the return that just happened.
        
        # Let's be precise:
        # ret_1d at row T = log_return at T-1
        # log_return at T = ln(Close_T / Close_T-1)
        # So we need features available at time T.
        # The latest log return we know is ln(CurrentPrice / YesterdayPrice).
        # This is df_full['log_return'].iloc[-1].
        
        # Wait, if `ret_1d = shift(1)`, then at row T, it uses log_return from T-1.
        # log_return at T-1 is ln(P_{T-1} / P_{T-2}).
        # So we need the return *prior* to today?
        # Typically "Momentum 1D" means "How much did it move today?".
        # If we treat "current_features" as end-of-day T, we know return T.
        # So we should use that.
        
        # In the training logic:
        # df['ret_1d'] = df['log_return'].shift(1)
        # This means at time T, we see the return from T-1.
        # So we are predicting T -> T+k using returns up to T-1.
        # That seems like we are missing the most recent day's info?
        # Usually you use data up to T to predict T+k.
        # If 'log_return' column at index T is ln(P_T / P_{T-1}),
        # then we want to use that.
        # If we shift(1), we use ln(P_{T-1} / P_{T-2}).
        
        # Let's adjust the training logic to use current returns (no shift, or shift=0 relative to 'today')
        # If X[t] predicts y[t], and y[t] is return T->T+k.
        # X[t] should include info known at T.
        # log_return[t] is known at T.
        # So we should probably NOT shift(1) for the main momentum feature if we want "today's return".
        # But let's stick to the code flow:
        # If we used shift(1) in training, we must use shift(1) for inference.
        
        # Let's calculate the exact values needed for the "current" input vector consistent with training
        # We need the last available values from the sequence.
        
        # Calculate trailing features on full history
        last_idx = len(df_full) - 1
        
        # We need values that WOULD BE at df['ret_XX'].iloc[-1] if we hadn't dropped NaNs
        # In training: ret_1d = log_return.shift(1).
        # So at the "current" prediction time (future T+1 target), we use log_return at T.
        # T is the last row of df_full.
        
        # Current Log Return (today's return)
        curr_log_ret = df_full['log_return'].iloc[-1]
        
        # 5D Return (sum of last 5 log returns)
        curr_ret_5d = df_full['log_return'].rolling(5).sum().iloc[-1]
        curr_ret_10d = df_full['log_return'].rolling(10).sum().iloc[-1]
        curr_ret_20d = df_full['log_return'].rolling(20).sum().iloc[-1]
        
        current_feats_vec = np.array([[
            curr_log_ret,       # ret_1d (latest return)
            curr_ret_5d,        # ret_5d
            curr_ret_10d,       # ret_10d
            curr_ret_20d,       # ret_20d
            request.current_features['volume'],
            request.current_features['volatility'],
            request.current_features['fed_funds'],
            request.current_features['cpi']
        ]])
        
        # Predict Log Return
        current_scaled = scaler.transform(current_feats_vec)
        pred_log_return = ridge_predict(current_scaled, beta_final, intercept_final)[0]
        
        # Convert to Price: P_future = P_current * exp(pred_log_ret)
        current_price = request.current_features['close']
        predicted_price = current_price * np.exp(pred_log_return)

        # 8. Feature Importance
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

