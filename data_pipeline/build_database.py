import pandas as pd
import sqlite3
import os

print("Downloading the latest Jonathan McDowell GCAT Launch Log (continuously updated)...")
tsv_url = "https://planet4589.org/space/gcat/tsv/derived/launchlog.tsv"

# Read TSV
df = pd.read_csv(tsv_url, sep='\t', low_memory=False)
df = df.drop(0) # Drop the 'Updated YYYY MMM DD' header row

# Drop duplicates to get 1 row per Launch
df = df.drop_duplicates(subset=['#Launch_Tag'])

print(f"Downloaded {len(df)} total unique orbital launches. Cleaning data...")

def assign_agency(row):
    agency_str = str(row.get('Agency', '')).upper()
    state_code = str(row.get('LVState', '')).upper()
    
    if 'SPX' in agency_str or 'SPACEX' in agency_str: return 'SpaceX'
    elif 'VORB' in agency_str or 'VIRGIN' in agency_str: return 'Virgin Orbit'
    elif 'ULA' in agency_str: return 'ULA'
    elif 'RLAB' in agency_str or 'ROCKET LAB' in agency_str: return 'Rocket Lab'
    elif 'AE' in agency_str or 'ARIANE' in agency_str: return 'Arianespace'
    
    elif state_code == 'IN': return 'ISRO'
    elif state_code == 'US': return 'NASA' # Grouping legacy US under NASA for dashboard parity
    elif state_code in ['RU', 'SU']: return 'Roscosmos'
    elif state_code == 'CN': return 'CNSA'
    elif 'ESA' in agency_str or state_code in ['F', 'I-ESA', 'I-ELDO']: return 'ESA'
    return 'Other'

df['dashboard_agency'] = df.apply(assign_agency, axis=1)

# Build the final dataframe to match the dashboard's expected schema perfectly
final_df = pd.DataFrame()
final_df['dashboard_agency'] = df['dashboard_agency']
final_df['real_agency'] = df['Agency'].fillna('Unknown')
final_df['year'] = df['Launch_Date'].str[:4].fillna('Unknown')
final_df['rocket_type'] = df['LV_Type'].fillna('Unknown')
final_df['mission'] = df['Name'].fillna('Classified / Unknown Payload')
final_df['state_code'] = df['LVState'].fillna('Unknown')

def check_success(code):
    code = str(code).upper()
    # In JSR, 'OS' is Orbital Success, 'DS' Deep Space, 'XS' suborbital but success.
    # 'OF' is Orbital Failure.
    if 'S' in code and 'OF' not in code:
        return True
    return False

final_df['is_success'] = df['Launch_Code'].apply(check_success)
final_df['success_status'] = final_df['is_success'].apply(lambda x: 'O' if x else 'F')

print("Saving cleaned modern data to SQLite database...")

db_dir = os.path.join("..", "backend")
if not os.path.exists(db_dir):
    os.makedirs(db_dir)

db_path = os.path.join(db_dir, "space_data.db")
conn = sqlite3.connect(db_path)
final_df.to_sql("launches", conn, if_exists="replace", index=False)
conn.close()

print(f"Success! Processed {len(final_df)} global records up to today.")