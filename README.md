- install deps
npm ci || npm i

- create .env
`cat > .env <<'EOF'
SOURCE_STORE_DOMAIN=your-source-store.myshopify.com
SOURCE_ADMIN_TOKEN=shpat_source_xxx
TARGET_STORE_DOMAIN=your-target-store.myshopify.com
TARGET_ADMIN_TOKEN=shpat_target_xxx
EOF`

- build: `npm run build`

- export (from SOURCE → ./data_exported/<SOURCE_STORE_DOMAIN>/): `npm run export`
- or dev (no build): `npm run dev:export`

- import (into TARGET from ./data_exported/<SOURCE_STORE_DOMAIN>/): `npm run import`
- or dev (no build): `npm run dev:import`
