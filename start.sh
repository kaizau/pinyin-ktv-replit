#!/bin/bash

# Build static assets first
npm run build

# Start the express server to serve the static assets
npm run start