#!/bin/bash

# Step 1: Compile TypeScript
echo "Compiling TypeScript..."
bun run tsc --build

# Step 2: Create build directory
BUILD_DIR="./.cache/build"
ZIP_FILE="./.cache/function.zip"

# Step 3: Copy compiled JS and other necessary files
echo "Copying compiled JS, package.json, and node_modules..."
cp package.json bun.lockb $BUILD_DIR
# cp -R node_modules $BUILD_DIR
cd $BUILD_DIR
bun install --production
# # Step 4: Create ZIP file
# echo "Creating ZIP file: $ZIP_FILE"
# cd $BUILD_DIR
# zip -rq function.zip .
# mv function.zip ..
# cd ../..

# # Cleanup
# echo "Cleaning up..."
# rm -rf $BUILD_DIR

# echo "Build and packaging complete. ZIP file: $ZIP_FILE"
