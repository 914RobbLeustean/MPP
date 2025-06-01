#!/bin/bash
set -e  # Exit on any error

echo "🚀 Starting Thrifto 2FA Deployment and Testing..."

# ECR Login
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 330042664746.dkr.ecr.us-east-1.amazonaws.com

# Build with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
echo "🏗️ Building image with timestamp: $TIMESTAMP"
docker build -t 330042664746.dkr.ecr.us-east-1.amazonaws.com/thrifto-backend:$TIMESTAMP -f Thrifto.Server/Dockerfile . --no-cache

# Tag and push
echo "📤 Tagging and pushing images..."
docker tag 330042664746.dkr.ecr.us-east-1.amazonaws.com/thrifto-backend:$TIMESTAMP 330042664746.dkr.ecr.us-east-1.amazonaws.com/thrifto-backend:latest
docker push 330042664746.dkr.ecr.us-east-1.amazonaws.com/thrifto-backend:$TIMESTAMP
docker push 330042664746.dkr.ecr.us-east-1.amazonaws.com/thrifto-backend:latest

# Deploy
echo "🚢 Deploying to ECS..."
aws ecs update-service --cluster thrifto-cluster --service thrifto-service --desired-count 1 --force-new-deployment --region us-east-1

# Monitor deployment
echo "⏳ Monitoring deployment..."
for i in {1..10}; do
    RUNNING=$(aws ecs describe-services --cluster thrifto-cluster --services thrifto-service --region us-east-1 --query 'services[0].runningCount')
    echo "Attempt $i: Running tasks: $RUNNING"
    if [ "$RUNNING" -eq 1 ]; then
        echo "✅ Deployment successful!"
        break
    fi
    sleep 30
done

# Wait for service to be ready
echo "⏳ Waiting for service to be ready..."
sleep 60

# Test basic endpoints
echo "🧪 Testing basic endpoints..."
curl -w "HTTP Status: %{http_code}\n" http://thrifto-alb-1677825063.us-east-1.elb.amazonaws.com/api/health
curl -w "HTTP Status: %{http_code}\n" -X GET http://thrifto-alb-1677825063.us-east-1.elb.amazonaws.com/api/auth/2fa/status

# Test login and extract token
echo "🔑 Testing login..."
LOGIN_RESPONSE=$(curl -s -H "Content-Type: application/json" -X POST http://thrifto-alb-1677825063.us-east-1.elb.amazonaws.com/api/auth/login -d '{"email": "test2fa@example.com", "password": "TestPassword123!"}')
echo "Login response: $LOGIN_RESPONSE"

# Check if 2FA is required
if echo "$LOGIN_RESPONSE" | grep -q "requiresTwoFactor"; then
    echo "✅ 2FA is enabled - login requires 2FA verification"
    echo "⚠️  Manual step: Use your authenticator app to complete 2FA verification"
    echo "   Run: curl -H 'Content-Type: application/json' -X POST http://thrifto-alb-1677825063.us-east-1.elb.amazonaws.com/api/auth/2fa/verify -d '{\"email\": \"test2fa@example.com\", \"code\": \"YOUR_CODE\", \"useRecoveryCode\": false}'"
else
    # Extract token if 2FA not enabled
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
        echo "✅ Got JWT token, testing 2FA status..."
        curl -w "HTTP Status: %{http_code}\n" -H "Authorization: Bearer $TOKEN" -X GET http://thrifto-alb-1677825063.us-east-1.elb.amazonaws.com/api/auth/2fa/status
    fi
fi

# Test error case
echo "🚫 Testing invalid 2FA code..."
curl -w "HTTP Status: %{http_code}\n" -H "Content-Type: application/json" -X POST http://thrifto-alb-1677825063.us-east-1.elb.amazonaws.com/api/auth/2fa/verify -d '{"email": "test2fa@example.com", "code": "000000", "useRecoveryCode": false}'

echo "🎉 Deployment and basic testing complete!"
echo "📝 Notes:"
echo "   - For complete 2FA testing, use fresh codes from your authenticator app"
echo "   - Recovery codes: QGXT4-RPFD7, C27BB-QK3HB, R5PN4-F9R4P, etc."
echo "   - JWT tokens expire in 7 days"
