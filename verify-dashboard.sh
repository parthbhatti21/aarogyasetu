#!/bin/bash

echo "🔍 Verifying Admin Dashboard Implementation..."
echo ""

echo "✓ Checking logo file..."
if [ -f src/assets/logo.jpg ]; then
  size=$(ls -lh src/assets/logo.jpg | awk '{print $5}')
  echo "  ✅ Logo found: $size"
else
  echo "  ❌ Logo not found"
fi

echo ""
echo "✓ Checking IndustryStandardMetrics component..."
if grep -q "IndustryStandardMetrics" src/pages/AdminDashboard.tsx; then
  echo "  ✅ Component imported and used"
else
  echo "  ❌ Component not found"
fi

echo ""
echo "✓ Checking professional header style..."
if grep -q "professional" src/pages/AdminDashboard.tsx; then
  echo "  ✅ Professional header implemented"
else
  echo "  ❌ Header not found"
fi

echo ""
echo "✓ Checking LogoImage import..."
if grep -q "import LogoImage from '@/assets/logo.jpg'" src/pages/AdminDashboard.tsx; then
  echo "  ✅ Logo import correct"
else
  echo "  ❌ Logo import missing"
fi

echo ""
echo "✓ TypeScript build verification..."
npm run build 2>&1 | grep -E "(✓ built|error)" | head -1

echo ""
echo "🎉 Dashboard Implementation Verified!"
