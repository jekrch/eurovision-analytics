import pandas as pd
import argparse
import os

def merge_csv_files(source_filepath, target_filepath):
    """
    Merges YouTube URLs from a source CSV to a target CSV. It uses a robust
    two-pass mapping strategy, first matching on year, country, and artist,
    then on year and country for unambiguous cases. This version correctly
    matches country codes and prevents duplicate columns.

    Args:
        source_filepath (str): Path to the source CSV file.
        target_filepath (str): Path to the target CSV file. This file will be overwritten.
    """
    # --- 1. Input Validation ---
    if not os.path.exists(source_filepath):
        print(f"Error: Source file not found at '{source_filepath}'")
        return
    if not os.path.exists(target_filepath):
        print(f"Error: Target file not found at '{target_filepath}'")
        return

    print(f"Reading source data from: {source_filepath}")
    print(f"Reading target data from: {target_filepath}")

    # --- 2. Load the CSV files ---
    try:
        # Explicitly set dtype to string to avoid unintended type inference
        df_source = pd.read_csv(source_filepath, dtype=str)
        df_target = pd.read_csv(target_filepath, dtype=str)
    except Exception as e:
        print(f"Error reading CSV files: {e}")
        return

    # --- 3. Data Cleaning and Preparation ---
    value_column = 'youtube_url'
    
    source_col_map = {'year': 'year', 'performer': 'artist', 'to_country_id': 'country'}

    # Check if youtube_url column needs to be added or just filled
    if value_column not in df_target.columns:
        print(f"Creating '{value_column}' column in target.")
        df_target[value_column] = pd.NA
    else:
        print(f"'{value_column}' column already exists in target. Will fill in missing values.")
        # Ensure the existing column can hold NAs for filling
        df_target[value_column] = df_target[value_column].astype(object).where(pd.notna(df_target[value_column]), pd.NA)


    print("Standardizing key columns for a reliable match...")
    # Create temporary, cleaned columns for matching in both dataframes
    for source_col, target_col in source_col_map.items():
        if source_col == 'year':
            df_source[f'match_{target_col}'] = pd.to_numeric(df_source[source_col], errors='coerce').astype('Int64')
            df_target[f'match_{target_col}'] = pd.to_numeric(df_target[target_col], errors='coerce').astype('Int64')
        else:
            df_source[f'match_{target_col}'] = df_source[source_col].astype(str).str.strip().str.lower()
            df_target[f'match_{target_col}'] = df_target[target_col].astype(str).str.strip().str.lower()

    # --- 4. Create Mapping Dictionaries from Source Data ---
    # Map 1: Specific key (year, country, artist) -> URL
    source_specific = df_source.dropna(subset=['match_year', 'match_country', 'match_artist', value_column])
    source_specific = source_specific.drop_duplicates(subset=['match_year', 'match_country', 'match_artist'], keep='first')
    map_specific = source_specific.set_index(['match_year', 'match_country', 'match_artist'])[value_column].to_dict()

    # Map 2: General key (year, country) -> URL for UNAMBIGUOUS cases
    is_ambiguous_yc = df_source.duplicated(subset=['match_year', 'match_country'], keep=False)
    source_general = df_source[(~is_ambiguous_yc) & (df_source[value_column].notna())]
    map_general = source_general.set_index(['match_year', 'match_country'])[value_column].to_dict()

    print(f"Created a specific map with {len(map_specific)} artist-level entries.")
    print(f"Created a general map with {len(map_general)} unambiguous country-level entries.")

    # --- 5. Apply Mappings to Target DataFrame ---
    # Create tuple keys in the target for efficient mapping
    df_target['key_specific'] = list(zip(df_target['match_year'], df_target['match_country'], df_target['match_artist']))
    df_target['key_general'] = list(zip(df_target['match_year'], df_target['match_country']))

    # First pass: Apply the specific map.
    # We map to a new series and then use .fillna() to only update rows that are currently empty.
    specific_urls = df_target['key_specific'].map(map_specific)
    df_target[value_column] = df_target[value_column].fillna(specific_urls)
    matches_pass1 = specific_urls.notna().sum()
    print(f"Matched {matches_pass1} rows using the specific artist key.")
    
    # Second pass: Apply the general map to the remaining empty rows.
    general_urls = df_target['key_general'].map(map_general)
    df_target[value_column] = df_target[value_column].fillna(general_urls)
    matches_pass2 = df_target[value_column].notna().sum() - matches_pass1
    print(f"Matched an additional {matches_pass2} rows using the year/country fallback.")

    # --- 6. Clean up and Save ---
    # Remove all temporary columns
    df_final = df_target.drop(columns=[
        'match_year', 'match_country', 'match_artist',
        'key_specific', 'key_general'
    ])

    try:
        df_final.to_csv(target_filepath, index=False)
        print("\n--- Success! ---")
        print(f"The file '{target_filepath}' has been updated. Total rows with URLs: {df_final[value_column].notna().sum()}")
    except Exception as e:
        print(f"\nError writing to target file: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="""
        Matches rows from a source CSV to a target CSV by year, country, and artist,
        then adds the 'youtube_url' from the source to the target.
        WARNING: This script will overwrite the target file.
        """,
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument('source', help="The path to the source CSV file (e.g., a.csv)")
    parser.add_argument('target', help="The path to the target CSV file (e.g., b.csv)")
    args = parser.parse_args()
    merge_csv_files(args.source, args.target)
