"""One-command data refresh.

Use this to pull the latest OSM snapshot and rerun the entire pipeline.
Reports what changed since the last run (new districts gained data,
coverage delta, facility count delta).

    python refresh.py                # uses existing GPKG, just re-runs pipeline
    python refresh.py --pull         # re-downloads OSM extract first (TODO)
    python refresh.py --no-boundaries # skip boundary re-fetch
"""
from __future__ import annotations
import argparse, json, sys
from datetime import datetime, timezone
from pathlib import Path

from pipeline.config import BACKEND_DATA_DIR
from pipeline.run_all import main as run_pipeline

COVERAGE_LOG = BACKEND_DATA_DIR / "coverage_history.json"


def previous_run() -> dict | None:
    if not COVERAGE_LOG.exists():
        return None
    history = json.loads(COVERAGE_LOG.read_text())
    return history[-1] if history else None


def print_delta(before: dict | None):
    if not COVERAGE_LOG.exists():
        return
    after = json.loads(COVERAGE_LOG.read_text())[-1]
    if before is None:
        print("\nFirst pipeline run. Baseline captured.")
        return
    print("\nDelta since previous run:")
    for key in ("scored", "no_data_yet", "canonical", "facilities"):
        d = after[key] - before[key]
        arrow = "+" if d > 0 else ""
        print(f"  {key:<14s} {before[key]:>5d}  ->  {after[key]:>5d}  ({arrow}{d})")
    d_pct = after["coverage_pct"] - before["coverage_pct"]
    arrow = "+" if d_pct > 0 else ""
    print(f"  {'coverage %':<14s} {before['coverage_pct']:>5.2f}  ->  "
          f"{after['coverage_pct']:>5.2f}  ({arrow}{d_pct:.2f})")
    if d > 0:
        print("\nNew districts gained data! Recommend re-deploy.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pull", action="store_true",
                        help="Re-download OSM extract first (not yet implemented).")
    parser.add_argument("--no-boundaries", action="store_true",
                        help="Skip boundary re-fetch (faster).")
    args = parser.parse_args()

    if args.pull:
        print("OSM auto-pull not yet implemented. Manually replace "
              "data/facilities/health_facilities.gpkg with a fresh export "
              "from https://data.humdata.org/dataset/hotosm_gha_health_facilities")

    before = previous_run()
    print(f"Refresh started at {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)
    run_pipeline()
    print("=" * 60)
    print_delta(before)
    return 0


if __name__ == "__main__":
    sys.exit(main())
