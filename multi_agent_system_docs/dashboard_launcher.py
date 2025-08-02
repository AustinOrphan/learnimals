#!/usr/bin/env python3
"""
Quick dashboard launchers with different modes
"""

import subprocess
import sys
import os

def run_dashboard(mode="single"):
    """Run the agent dashboard in different modes"""
    base_path = "/Users/austinorphan/Library/Mobile Documents/com~apple~CloudDocs/src/devTools/gh_pr_dump"
    dashboard_script = f"{base_path}/gh_pr_dump_fix_plan/AGENT_INITIALIZATION/agent_dashboard.py"
    
    if mode == "single":
        subprocess.run([sys.executable, dashboard_script])
    elif mode == "continuous":
        subprocess.run([sys.executable, dashboard_script, "--continuous", "30"])
    elif mode == "snapshot":
        subprocess.run([sys.executable, dashboard_script, "--snapshot"])
    elif mode == "json":
        subprocess.run([sys.executable, dashboard_script, "--json"])

if __name__ == "__main__":
    if len(sys.argv) > 1:
        mode = sys.argv[1]
        if mode in ["single", "continuous", "snapshot", "json"]:
            run_dashboard(mode)
        else:
            print("Usage: python dashboard_launcher.py [single|continuous|snapshot|json]")
    else:
        run_dashboard("single")