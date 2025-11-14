import csv
import shutil
import inspect
from pathlib import Path
from typing import Dict, List, Optional, Any
import pandas as pd
from fastapi import UploadFile
from app.config import Config


class UploadValidationError(Exception):
    """Raised when uploaded files fail validation."""
    pass


async def save_uploaded_files(
    uploaded_files: Dict[str, Any],
    upload_dir: Path
) -> Dict[str, Path]:
    """
    Save uploaded files to disk.
    
    Args:
        uploaded_files: Dictionary mapping filename to file object
        upload_dir: Directory to save files to
        
    Returns:
        Dictionary mapping CSV key to saved file path
    """
    upload_dir.mkdir(parents=True, exist_ok=True)
    saved_paths = {}
    
    for key, filename in Config.REQUIRED_CSV_FILES.items():
        if filename in uploaded_files:
            file_obj = uploaded_files[filename]
            file_path = upload_dir / filename
            
            # Save file
            # Check if read() is a coroutine (async method)
            is_async_read = (
                hasattr(file_obj, 'read') and 
                inspect.iscoroutinefunction(getattr(file_obj, 'read', None))
            )
            
            if is_async_read or isinstance(file_obj, UploadFile):
                # FastAPI UploadFile object - async read
                content = await file_obj.read()
                with open(file_path, 'wb') as f:
                    f.write(content)
                # Reset file pointer if needed (check if seek is async)
                if hasattr(file_obj, 'seek'):
                    try:
                        # Try to check if seek is async
                        if inspect.iscoroutinefunction(getattr(file_obj, 'seek', None)):
                            await file_obj.seek(0)
                        else:
                            file_obj.seek(0)
                    except (AttributeError, TypeError):
                        # If seek doesn't exist or fails, just skip it
                        pass
            elif isinstance(file_obj, (str, Path)):
                # Path string or Path object
                shutil.copy(str(file_obj), str(file_path))
            else:
                # Generic file-like object (sync read)
                try:
                    if hasattr(file_obj, 'read'):
                        content = file_obj.read()
                        if isinstance(content, bytes):
                            with open(file_path, 'wb') as f:
                                f.write(content)
                        else:
                            with open(file_path, 'w') as f:
                                f.write(content)
                        if hasattr(file_obj, 'seek'):
                            file_obj.seek(0)
                    else:
                        # Fallback: try to copy if it's a path
                        shutil.copy(str(file_obj), str(file_path))
                except Exception as e:
                    # Fallback: try to copy if it's a path
                    shutil.copy(str(file_obj), str(file_path))
            
            saved_paths[key] = file_path
    
    return saved_paths


def load_uploaded_csvs(upload_dir: Path) -> Dict[str, pd.DataFrame]:
    """
    Load all required CSV files from upload directory.
    
    Args:
        upload_dir: Directory containing CSV files
        
    Returns:
        Dictionary mapping CSV key to DataFrame
        
    Raises:
        UploadValidationError: If files are missing or invalid
    """
    dataframes = {}
    missing_files = []
    
    # Check all required files exist
    for key, filename in Config.REQUIRED_CSV_FILES.items():
        file_path = upload_dir / filename
        if not file_path.exists():
            missing_files.append(filename)
        else:
            try:
                df = pd.read_csv(file_path)
                dataframes[key] = df
            except Exception as e:
                raise UploadValidationError(
                    f"Error reading {filename}: {str(e)}"
                )
    
    if missing_files:
        raise UploadValidationError(
            f"Missing required files: {', '.join(missing_files)}"
        )
    
    # Validate required columns (basic check)
    validate_csv_columns(dataframes)
    
    return dataframes


def validate_csv_columns(dataframes: Dict[str, pd.DataFrame]) -> None:
    """
    Validate that required columns exist in CSV files.
    
    Args:
        dataframes: Dictionary of loaded DataFrames
        
    Raises:
        UploadValidationError: If required columns are missing
    """
    # Required columns for each CSV type (flexible to match actual data)
    required_columns = {
        "sites": ["site_id", "region"],  # site_name is optional
        "enrollment": ["site_id"],  # Flexible - accept any enrollment columns
        "dispense": ["site_id"],  # Flexible - accept weekly_dispense_kits or calculate
        "inventory": ["site_id", "current_inventory"],  # expiry_date can be batch_expiry_date
        "shipment": ["site_id"],  # Flexible - accept any shipment columns
        "waste": ["site_id"],  # Flexible - accept any waste columns
    }
    
    for key, df in dataframes.items():
        if key in required_columns:
            missing_cols = [
                col for col in required_columns[key]
                if col not in df.columns
            ]
            if missing_cols:
                raise UploadValidationError(
                    f"Missing required columns in {Config.REQUIRED_CSV_FILES[key]}: "
                    f"{', '.join(missing_cols)}"
                )

