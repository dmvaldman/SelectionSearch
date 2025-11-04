#!/bin/bash

# Script to bump version and create distribution zip for Chrome extension

# Get current version from manifest.json
current_version=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)

# Parse version components (keep only major.minor)
IFS='.' read -ra VERSION_PARTS <<< "$current_version"
major=${VERSION_PARTS[0]}
minor=${VERSION_PARTS[1]}

# Bump minor version
new_minor=$((minor + 1))
new_version="$major.$new_minor"

# Update manifest.json with new version
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" manifest.json
else
    # Linux
    sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" manifest.json
fi

echo "Version bumped from $current_version to $new_version"

# Create zip file
zip_name="betweenTheLines.zip"

# Remove old zip if it exists
if [ -f "$zip_name" ]; then
    rm "$zip_name"
    echo "Removed old $zip_name"
fi

# Create new zip
zip -r "$zip_name" . -x "*.git*" "*.DS_Store" "*.zip" ".env*" "package.sh" "build.sh"

echo "Created $zip_name with version $new_version"
echo "Ready for Chrome Web Store upload!"

