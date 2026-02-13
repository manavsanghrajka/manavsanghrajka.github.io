
import unittest
import pandas as pd
import numpy as np
from main import TrainingData, PredictionRequest, app, train_and_predict

class TestStockPredictor(unittest.TestCase):
    def test_hit_rate_logic(self):
        # Create a synthetic dataset
        # We'll create a scenario where the price goes UP every day
        # So the model should learn this and predict UP
        dates = pd.date_range(start='2023-01-01', periods=100)
        training_data = []
        for i, date in enumerate(dates):
            training_data.append(TrainingData(
                date=date.strftime('%Y-%m-%d'),
                close=100 + i, # steadily increasing
                volume=1000,
                sma_20=100 + i - 2,
                volatility=0.01,
                fed_funds=4.5,
                cpi=300
            ))
        
        current_features = {
            "close": 200,
            "volume": 1000,
            "sma_20": 198,
            "volatility": 0.01,
            "fed_funds": 4.5,
            "cpi": 300
        }
        
        request = PredictionRequest(
            training_data=training_data,
            current_features=current_features,
            days_ahead=1
        )
        
        # Run prediction
        result = train_and_predict(request)
        
        print(f"Result: {result}")
        
        # Assertions
        self.assertIn('hit_rate', result)
        self.assertGreaterEqual(result['hit_rate'], 0.0)
        self.assertLessEqual(result['hit_rate'], 1.0)
        
        # Check new feature importance keys exist
        self.assertIn('Momentum_1D', result['feature_importance'])
        self.assertIn('Momentum_20D', result['feature_importance'])
        
        # In a perfectly linear upward trend:
        # P_t = 100 + t. Returns are const approx 1%.
        # Momentum features will be perfect predictors of future positive return.
        # So hit rate should be 1.0 (or close to it)
        print(f"Test Result Metrics: R2={result['r_squared']:.4f}, HitRate={result['hit_rate']:.4f}")
        self.assertGreater(result['hit_rate'], 0.8)

if __name__ == '__main__':
    unittest.main()
