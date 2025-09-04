#!/bin/bash

# Test script that starts server and runs tests
echo "🚀 Starting Enhanced Analysis Feature Testing..."

# Check if server is already running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Server is already running on port 3000"
    SERVER_RUNNING=true
else
    echo "🔄 Starting development server..."
    npm run dev &
    SERVER_PID=$!
    SERVER_RUNNING=false
    
    # Wait for server to start
    echo "⏳ Waiting for server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ Server started successfully"
            break
        fi
        sleep 2
        echo "   Attempt $i/30..."
    done
    
    if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "❌ Failed to start server"
        exit 1
    fi
fi

# Run the feature tests
echo "🧪 Running feature tests..."
node tests/feature-test-runner.js

TEST_EXIT_CODE=$?

# Stop server if we started it
if [ "$SERVER_RUNNING" = false ] && [ ! -z "$SERVER_PID" ]; then
    echo "🛑 Stopping development server..."
    kill $SERVER_PID
    wait $SERVER_PID 2>/dev/null
fi

# Run component tests
echo "🧪 Running component tests..."
npm test -- tests/components/enhanced-dashboard.test.js --passWithNoTests

COMPONENT_TEST_EXIT_CODE=$?

# Final result
if [ $TEST_EXIT_CODE -eq 0 ] && [ $COMPONENT_TEST_EXIT_CODE -eq 0 ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "❌ Some tests failed"
    exit 1
fi