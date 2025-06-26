import psycopg2
import json
from datetime import datetime
from decimal import Decimal

# Your database connection parameters
params = {
    'dbname': 'postgres',
    'user': 'postgres',
    'password': 'postgres',
    'host': 'localhost',
    'port': '5132'
}

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

try:
    # Connect to the database
    conn = psycopg2.connect(**params)
    cur = conn.cursor()
    
    # Execute a simple query
    cur.execute("SELECT * FROM manufacturing_events LIMIT 5")
    rows = cur.fetchall()
    
    # Get column names
    colnames = [desc[0] for desc in cur.description]
    
    # Convert to list of dicts for better readability
    results = []
    for row in rows:
        row_dict = {}
        for i, col in enumerate(colnames):
            # Convert datetime objects to strings for JSON serialization
            if isinstance(row[i], datetime):
                row_dict[col] = row[i].isoformat()
            elif isinstance(row[i], Decimal):
                row_dict[col] = float(row[i])
            else:
                row_dict[col] = row[i]
        results.append(row_dict)
    
    print("Database connection successful!")
    print("\nFound", len(results), "events:")
    print(json.dumps(results, indent=2, default=decimal_default))

except Exception as e:
    print("Error connecting to the database:")
    print(str(e))

finally:
    if 'cur' in locals():
        cur.close()
    if 'conn' in locals():
        conn.close() 