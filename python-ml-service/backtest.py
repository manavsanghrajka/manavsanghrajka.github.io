import pandas as pd
import numpy as np
import yfinance as yf
import pandas_ta as ta
import logging
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LassoCV
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO, format='%(message)s')

TOP_50_TICKERS = [
    'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'BRK-B', 'LLY', 'AVGO', 'V',
    'JPM', 'TSLA', 'WMT', 'UNH', 'MA', 'PG', 'JNJ', 'XOM', 'HD', 'MRK',
    'COST', 'ABBV', 'ORCL', 'CVX', 'CRM', 'AMD', 'BAC', 'PEP', 'KO', 'NFLX',
    'TMO', 'WFC', 'ADBE', 'LIN', 'DIS', 'MCD', 'ABT', 'CSCO', 'INTC', 'CMCSA',
    'IBM', 'QCOM', 'CAT', 'DHR', 'PFE', 'AMAT', 'NOW', 'GE', 'TXN', 'AXP'
]

def fetch_history(ticker, start, end):
    try:
        hist = yf.download(ticker, start=start, end=end, progress=False)
        if hist.empty: return None
        if isinstance(hist.columns, pd.MultiIndex):
            hist.columns = hist.columns.get_level_values(0)
        hist = hist.rename(columns={"Close": "close", "Volume": "volume", "Open": "open", "High": "high", "Low": "low"})
        hist.index = pd.to_datetime(hist.index).tz_localize(None)
        return hist
    except Exception as e:
        return None

def compute_features(df):
    df = df.copy()
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
    return df

def run_backtest():
    logging.info("Downloading historical data (2020-2023) for Top 50 S&P 500 stocks...")
    data_dict = {}
    for ticker in TOP_50_TICKERS:
        df = fetch_history(ticker, start="2020-01-01", end="2024-01-01")
        if df is not None and len(df) > 100:
            df = compute_features(df)
            df['target'] = np.log(df['close'].shift(-1) / df['close'])
            data_dict[ticker] = df.dropna()

    if not data_dict:
        logging.error("Failed to download data.")
        return
    
    logging.info("Training Global Model on 2020-2022 data...")
    train_dfs = []
    test_dfs = []
    
    for ticker, df in data_dict.items():
        train_df = df[df.index < '2023-01-01']
        test_df = df[(df.index >= '2023-01-01') & (df.index < '2024-01-01')]
        if len(train_df) > 0: train_dfs.append(train_df)
        if len(test_df) > 0: test_dfs.append(test_df)
        
    train_combined = pd.concat(train_dfs)
    test_combined = pd.concat(test_dfs)
    
    features = ['rsi_14', 'sma_20', 'sma_50', 'macd', 'macd_hist', 'macd_signal',
                'bb_lower', 'bb_mid', 'bb_upper', 'bb_bandwidth', 'atr_14',
                'volatility_20', 'ret_1d', 'ret_5d', 'ret_10d', 'ret_20d', 'volume']
                
    X_train = train_combined[features].values
    y_train = train_combined['target'].values
    X_test = test_combined[features].values
    y_test = test_combined['target'].values
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    model = LassoCV(cv=5, random_state=42, max_iter=10000)
    model.fit(X_train_scaled, y_train)
    
    y_pred = model.predict(X_test_scaled)
    
    pred_dir = np.sign(y_pred)
    actual_dir = np.sign(y_test)
    
    hit_rate = np.mean(pred_dir == actual_dir)
    
    # Portfolio returns: equal weight on all positive predictions daily
    # To compute this correctly without SettingWithCopyWarning
    test_combined = test_combined.copy()
    test_combined['prediction'] = y_pred
    test_combined['pred_dir'] = pred_dir
    
    daily_returns = []
    dates = sorted(test_combined.index.unique())
    
    for d in dates:
        day_df = test_combined[test_combined.index == d]
        # Go long only on stocks predicted to go UP
        long_stocks = day_df[day_df['pred_dir'] > 0]
        if len(long_stocks) > 0:
            daily_ret = long_stocks['target'].mean() # equal weight
            daily_returns.append(np.exp(daily_ret) - 1)
        else:
            daily_returns.append(0)
            
    # Baseline: Buy and Hold all 50
    baseline_daily = []
    for d in dates:
        day_df = test_combined[test_combined.index == d]
        baseline_ret = day_df['target'].mean()
        baseline_daily.append(np.exp(baseline_ret) - 1)
        
    cum_ret_strategy = np.prod([1 + r for r in daily_returns]) - 1
    cum_ret_baseline = np.prod([1 + r for r in baseline_daily]) - 1
    
    logging.info(f"\n--- BACKTEST RESULTS (Out-of-Sample 2023) ---")
    logging.info(f"Hit Rate (Directional Accuracy): {hit_rate*100:.2f}%")
    logging.info(f"Strategy Cumulative Return: {cum_ret_strategy*100:.2f}%")
    logging.info(f"Baseline (Equal Weight Top 50) Return: {cum_ret_baseline*100:.2f}%")
    logging.info(f"\nVariables Selected (Lasso Weights):")
    for f, c in zip(features, model.coef_):
        if abs(c) > 1e-6:
             logging.info(f"  {f}: {c:.6f}")

if __name__ == "__main__":
    run_backtest()
