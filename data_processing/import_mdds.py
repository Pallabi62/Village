import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import os
import sys

# Expected Database schema connection parameters
DB_URL = os.environ.get("DATABASE_URL")

def get_connection():
    try:
        # Assumes DB_URL is in postgres://user:password@host:port/db format
        conn = psycopg2.connect(DB_URL)
        return conn
    except Exception as e:
        print(f"Database connection failed: {e}")
        return None

def import_mdds_data(file_path):
    print(f"Reading data from {file_path}...")
    try:
        if file_path.endswith('.xlsx'):
            df = pd.read_excel(file_path)
        elif file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            print("Unsupported file format. Please use .csv or .xlsx")
            return
    except Exception as e:
        print(f"Failed to read file: {e}")
        return

    # Basic data cleaning
    df = df.fillna('')
    print(f"Successfully loaded {len(df)} records. Starting import...")

    conn = get_connection()
    if not conn:
        print("Skipping import because no DB connection is available. (Set DATABASE_URL env var)")
        return

    cursor = conn.cursor()

    try:
        # Phase 3: Incremental Import implementation
        # Note: This is a robust conceptual stub that follows the strategy.
        # In a real environment, queries need to exactly match Prisma's generated tables.

        # 1. Insert/Update Country (India)
        cursor.execute("""
            INSERT INTO "Country" (code, name)
            VALUES ('IN', 'India')
            ON CONFLICT (code) DO NOTHING RETURNING id;
        """)
        country_res = cursor.fetchone()
        if country_res:
            country_id = country_res[0]
        else:
            cursor.execute("SELECT id FROM \"Country\" WHERE code='IN'")
            country_id = cursor.fetchone()[0]

        # In a full implementation, we would extract unique States, Districts, etc.,
        # and batch insert them using psycopg2's execute_values to optimize for performance.

        # Example chunked insertion logic for Villages
        # villages_data = [(row['MDDS PLCN'], row['Area Name'], sub_dist_id) for row in df.itertuples()]
        # chunk_size = 5000
        # for i in range(0, len(villages_data), chunk_size):
        #     chunk = villages_data[i:i + chunk_size]
        #     execute_values(cursor, """
        #         INSERT INTO "Village" (code, name, "subDistrictId") VALUES %s
        #         ON CONFLICT (code) DO NOTHING
        #     """, chunk)
        #     print(f"Inserted chunk {i//chunk_size + 1}")

        print("Data imported successfully (stub implementation executed).")
        conn.commit()

    except Exception as e:
        print(f"Error during import transaction: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_mdds.py <path_to_excel_or_csv>")
    else:
        file_path = sys.argv[1]
        import_mdds_data(file_path)
