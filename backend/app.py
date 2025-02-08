# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
from datetime import datetime, timedelta
import pandas as pd
import calendar

app = Flask(__name__)
CORS(app)

class Nothing(Exception):
    pass

def calculate_investments(ticker, monthly_investment, start_day, num_months):
    try:
        # Get end date (current date)
        end_date = datetime.now()
        
        # Calculate start date based on number of months
        start_date = end_date - timedelta(days=num_months * 31)
        
        # Get stock data
        stock = yf.Ticker(ticker)
        hist = stock.history(start=start_date, end=end_date)
        
        if hist.empty:
            return {'error': 'No data found for the specified ticker'}
        
        investments = []
        current_date = start_date
        total_invested = 0
        total_shares = 0
        
        while current_date <= end_date:
            # Get the number of days in the current month
            days_in_month = calendar.monthrange(current_date.year, current_date.month)[1]
            
            # Find the closest trading day to the specified day of month
            target_day = min(int(start_day), days_in_month)
            target_date = current_date.replace(day=target_day)

            # Find the closest available trading day
            closest_date = min(hist.index, key=lambda x: abs(x.date() - target_date.date()))
            
            if closest_date in hist.index:
                price = hist.loc[closest_date, 'Close']
                shares_bought = monthly_investment / price
                
                total_invested += monthly_investment
                total_shares += shares_bought
                current_value = total_shares * price
                profit = current_value - total_invested
                
                investments.append({
                    'date': closest_date.strftime('%Y-%m-%d'),
                    'price': float(price),
                    'shares_bought': float(shares_bought),
                    'total_shares': float(total_shares),
                    'total_invested': float(total_invested),
                    'current_value': float(current_value),
                    'profit': float(profit),
                    'profit_percentage': float((profit / total_invested) * 100) if total_invested > 0 else 0
                })
            
            # Move to next month (first day of next month)
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1, day=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1, day=1)
        
        return investments

    except Nothing as e:
        return {'error': str(e)}

@app.route('/api/calculate', methods=['POST'])
def calculate():
    try:
        data = request.json
        ticker = data.get('ticker')
        monthly_investment = float(data.get('monthlyInvestment'))
        start_day = int(data.get('startDay'))
        num_months = int(data.get('numMonths'))
        
        if not all([ticker, monthly_investment, start_day, num_months]):
            return jsonify({'error': 'Missing required parameters'}), 400
            
        if start_day < 1 or start_day > 31:
            return jsonify({'error': 'Start day must be between 1 and 31'}), 400
            
        if monthly_investment <= 0:
            return jsonify({'error': 'Monthly investment must be positive'}), 400
            
        if num_months <= 0:
            return jsonify({'error': 'Number of months must be positive'}), 400
        
        result = calculate_investments(ticker, monthly_investment, start_day, num_months)
        
        if isinstance(result, dict) and 'error' in result:
            return jsonify(result), 400
            
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)