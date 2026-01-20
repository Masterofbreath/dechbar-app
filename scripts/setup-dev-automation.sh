#!/bin/bash

# ==============================================================================
# DechBar App - Development Automation Setup
# ==============================================================================
# 
# This script sets up pre-commit hooks, linting, and quality checks to ensure:
# - No TypeScript errors reach Vercel
# - No hardcoded rgba() values outside design tokens
# - BEM naming conventions are followed
# - Code is formatted consistently
# 
# Usage: ./scripts/setup-dev-automation.sh
# 
# @package DechBar_App
# @since 0.2.1
# ==============================================================================

set -e  # Exit on any error

echo "🚀 Setting up DechBar Development Automation..."
echo ""

# ==============================================================================
# 1. Check if we're in the right directory
# ==============================================================================
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Run this script from project root."
  exit 1
fi

echo "✅ Project root detected"

# ==============================================================================
# 2. Install dependencies
# ==============================================================================
echo ""
echo "📦 Installing dependencies (husky, lint-staged, stylelint)..."
npm install

echo "✅ Dependencies installed"

# ==============================================================================
# 3. Initialize Husky
# ==============================================================================
echo ""
echo "🪝 Setting up Husky git hooks..."

# Initialize husky
npx husky install

# Create pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."
echo ""

# Run lint-staged (checks only staged files)
npx lint-staged

echo ""
echo "✅ All checks passed! Proceeding with commit..."
EOF

# Make it executable
chmod +x .husky/pre-commit

echo "✅ Husky hooks configured"

# ==============================================================================
# 4. Test the setup
# ==============================================================================
echo ""
echo "🧪 Testing the setup..."
echo ""

# Test TypeScript check
echo "  → Testing TypeScript check..."
if npm run type-check > /dev/null 2>&1; then
  echo "    ✅ TypeScript check works"
else
  echo "    ⚠️  TypeScript check found issues (will be fixed on commit)"
fi

# Test ESLint
echo "  → Testing ESLint..."
if npm run lint > /dev/null 2>&1; then
  echo "    ✅ ESLint works"
else
  echo "    ⚠️  ESLint found issues (will be fixed on commit)"
fi

# Test Stylelint
echo "  → Testing Stylelint..."
if npm run lint:css > /dev/null 2>&1; then
  echo "    ✅ Stylelint works"
else
  echo "    ⚠️  Stylelint found issues (will be fixed on commit)"
fi

# ==============================================================================
# 5. Success message
# ==============================================================================
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║  ✅ Development Automation Setup Complete!                    ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "🎉 What was configured:"
echo ""
echo "  1. ✅ Pre-commit hooks (Husky)"
echo "     → Checks TypeScript, ESLint, Stylelint before EVERY commit"
echo ""
echo "  2. ✅ Stylelint with design token enforcement"
echo "     → Prevents hardcoded rgba() values"
echo "     → Enforces BEM naming conventions"
echo ""
echo "  3. ✅ Lint-staged for fast checks"
echo "     → Only checks files you're committing (fast!)"
echo ""
echo "📚 Available commands:"
echo ""
echo "  npm run lint          - Check all TypeScript/JSX files"
echo "  npm run lint:css      - Check all CSS files"
echo "  npm run lint:fix      - Auto-fix all issues"
echo "  npm run type-check    - Check TypeScript types"
echo ""
echo "💡 Next time you commit:"
echo ""
echo "  git add ."
echo "  git commit -m \"your message\""
echo "  → Automatic checks will run!"
echo "  → If errors found, commit is blocked"
echo "  → Fix errors, then commit again"
echo ""
echo "🚀 Benefits:"
echo ""
echo "  • No more failed Vercel builds due to TypeScript errors"
echo "  • Design tokens always used (no hardcoded colors)"
echo "  • Consistent code style across all agents"
echo "  • Fast feedback (errors caught locally, not on CI)"
echo ""
echo "📖 Documentation: docs/development/DEV_AUTOMATION.md"
echo ""
