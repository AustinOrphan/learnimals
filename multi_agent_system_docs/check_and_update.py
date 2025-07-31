#!/usr/bin/env python3
"""
Streamlined Agent Status Checker
Run this before updating prompts to get latest status and recommendations
"""

import subprocess
import sys
import os
from pathlib import Path

def main():
    # Change to project directory
    base_path = "/Users/austinorphan/Library/Mobile Documents/com~apple~CloudDocs/src/devTools/gh_pr_dump"
    os.chdir(base_path)
    
    print("🔍 CHECKING AGENT STATUS...")
    print("=" * 60)
    
    # Run the automatic status checker
    result = subprocess.run(
        [sys.executable, "gh_pr_dump_fix_plan/AGENT_INITIALIZATION/auto_status_updater.py"],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print(result.stdout)
        
        # Check if we should save the report
        if "--save" in sys.argv:
            print("\n💾 Saving recommendations...")
            subprocess.run([
                sys.executable, 
                "gh_pr_dump_fix_plan/AGENT_INITIALIZATION/auto_status_updater.py",
                "--save"
            ])
        
        # Quick summary for prompt updates
        if "CRITICAL" in result.stdout or "FINAL_WARNING" in result.stdout:
            print("\n⚠️  PROMPT UPDATES NEEDED!")
            print("Run prompt updates for agents listed above with CRITICAL or FINAL_WARNING status.")
        else:
            print("\n✅ All agents documenting properly - no urgent updates needed!")
    else:
        print("❌ Error running status check:")
        print(result.stderr)

if __name__ == "__main__":
    main()