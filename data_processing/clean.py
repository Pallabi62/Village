import csv
import json

def clean_and_process_data(input_csv, output_json):
    """
    Reads raw geographic data from CSV, cleans it, and outputs a structured JSON
    ready for database insertion or API consumption.

    Expected CSV columns: State, District, SubDistrict, Village, Pincode
    """
    processed_data = []

    try:
        with open(input_csv, mode='r', encoding='utf-8') as infile:
            reader = csv.DictReader(infile)
            for row in reader:
                # Basic cleaning: strip whitespace, handle missing values
                state = row.get('State', '').strip()
                district = row.get('District', '').strip()
                sub_district = row.get('SubDistrict', '').strip()
                village = row.get('Village', '').strip()
                pincode = row.get('Pincode', '').strip()

                if state and district and village: # Minimal required data
                    processed_data.append({
                        "state": state,
                        "district": district,
                        "sub_district": sub_district,
                        "village": village,
                        "pincode": pincode
                    })

        with open(output_json, mode='w', encoding='utf-8') as outfile:
            json.dump(processed_data, outfile, indent=2)

        print(f"Successfully processed {len(processed_data)} records.")
        print(f"Data saved to {output_json}")

    except FileNotFoundError:
        print(f"Error: Could not find input file '{input_csv}'")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    # Example usage (files would need to exist)
    print("Data processing script initialized.")
    # clean_and_process_data('raw_data.csv', 'cleaned_data.json')
