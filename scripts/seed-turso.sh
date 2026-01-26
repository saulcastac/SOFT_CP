#!/bin/bash

# Script to seed Turso database with regímenes fiscales
# Usage: ./scripts/seed-turso.sh

echo "🌱 Seeding Turso database with regímenes fiscales..."

# Set DATABASE_URL to Turso temporarily
TURSO_URL=$(turso db show carta-porte-prod --url)
TURSO_TOKEN=$(turso db tokens create carta-porte-prod)

export DATABASE_URL="${TURSO_URL}?authToken=${TURSO_TOKEN}"

# Run seed
npx tsx prisma/seed.ts

echo "✅ Turso database seeded successfully!"
