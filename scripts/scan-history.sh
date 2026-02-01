#!/usr/bin/env bash
#
# Scan entire git history for secrets before making repository public
# Usage: npm run scan:history
#

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 SCANNING GIT HISTORY FOR SECRETS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check gitleaks installation
if ! command -v gitleaks &> /dev/null; then
  echo "❌ ERROR: gitleaks not found"
  echo "📦 Install: brew install gitleaks"
  exit 1
fi

# Get commit count
COMMIT_COUNT=$(git rev-list --all --count)
echo "📊 Scanning $COMMIT_COUNT commits across all branches..."
echo ""

# Scan entire history
REPORT_FILE="gitleaks-history-report.json"
if gitleaks detect --report-path "$REPORT_FILE" --verbose --redact; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ SCAN COMPLETE: No secrets found in history"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "🎉 Repository is safe to make public!"
  rm -f "$REPORT_FILE"
  exit 0
else
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "❌ SECRETS DETECTED IN HISTORY"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "📋 Review report: $REPORT_FILE"
  echo ""
  echo "🛠️  Remediation options:"
  echo "   1. If false positive: Update .gitleaks.toml allowlist"
  echo "   2. If real secret: Use BFG Repo-Cleaner or git-filter-repo to remove"
  echo "   3. If committed recently: git rebase -i to edit commits"
  echo ""
  echo "⚠️  DO NOT make repository public until resolved!"
  exit 1
fi
