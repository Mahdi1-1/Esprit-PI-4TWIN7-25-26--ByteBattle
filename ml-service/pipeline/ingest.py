"""
Ingest pipeline – legacy entry point (kept for compatibility)
Delegates to ingest_deepmind.py by default.
"""
from pipeline.ingest_deepmind import main

if __name__ == "__main__":
    main()
