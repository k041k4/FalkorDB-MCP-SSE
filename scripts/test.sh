#!/bin/bash

# Start FalkorDB in a Docker container for testing
docker run -d --name falkordb-test -p 6379:6379 falkordb/falkordb:latest

# Wait for FalkorDB to be ready
echo "Waiting for FalkorDB to be ready..."
sleep 5

# Run the tests
npm test

# Clean up
docker stop falkordb-test
docker rm falkordb-test 