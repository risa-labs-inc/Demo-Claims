#!/bin/bash
set -e

echo "=== Claims Demo Deployment Script ==="
echo ""

# Step 1: Create Firebase hosting site (ignore error if already exists)
echo "Step 1: Creating Firebase hosting site..."
firebase hosting:sites:create claims-demo --project rapids-platform 2>/dev/null || echo "Site may already exist, continuing..."

# Step 2: Apply hosting target
echo "Step 2: Applying hosting target..."
firebase target:apply hosting claims-demo claims-demo --project rapids-platform

# Step 3: Deploy using Cloud Build
echo "Step 3: Deploying to Cloud Run and Firebase Hosting..."
echo "This will take a few minutes..."
gcloud builds submit --config=cloudbuild.yaml --project=rapids-platform

echo ""
echo "=== Deployment Complete ==="
echo "Your app should be available at: https://claims-demo.web.app"
