# 0) (optional) ensure Node 18+
# If you use nvm:
#   brew install nvm && mkdir -p ~/.nvm
#   nvm install 18 && nvm use 18

# 1) from repo root
cd shopify-meta

# 2) install deps
npm ci || npm i

# 3) create .env
cat > .env <<'EOF'
SOURCE_STORE_DOMAIN=your-source-store.myshopify.com
SOURCE_ADMIN_TOKEN=shpat_source_xxx
TARGET_STORE_DOMAIN=your-target-store.myshopify.com
TARGET_ADMIN_TOKEN=shpat_target_xxx
EOF

# 4) build
npm run build

# 5) export (from SOURCE → ./data_exported/<SOURCE_STORE_DOMAIN>/)
npm run export
# or dev (no build):
# npm run dev:export

# 6) import (into TARGET from ./data_exported/<SOURCE_STORE_DOMAIN>/)
npm run import
# or dev (no build):
# npm run dev:import
