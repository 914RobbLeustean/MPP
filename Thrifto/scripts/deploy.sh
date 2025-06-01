#!/bin/bash

# Deployment script for Thrifto application

set -e

# Variables
STACK_NAME="thrifto-infrastructure"
IAM_STACK_NAME="thrifto-iam-roles"
REGION="us-east-1"

echo "Deploying Thrifto IAM roles..."

# Deploy IAM roles first
aws cloudformation deploy \
  --template-file iam-roles.yml \
  --stack-name $IAM_STACK_NAME \
  --capabilities CAPABILITY_NAMED_IAM \
  --region $REGION

echo "Deploying Thrifto infrastructure..."

# Deploy main infrastructure
aws cloudformation deploy \
  --template-file cloudformation.yml \
  --stack-name $STACK_NAME \
  --capabilities CAPABILITY_IAM \
  --region $REGION

# Get outputs
VPC_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`VPCId`].OutputValue' \
  --output text \
  --region $REGION)

DB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
  --output text \
  --region $REGION)

S3_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
  --output text \
  --region $REGION)

LB_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
  --output text \
  --region $REGION)

echo "Infrastructure deployed successfully!"
echo "Database Endpoint: $DB_ENDPOINT"
echo "S3 Bucket: $S3_BUCKET"
echo "Load Balancer URL: $LB_URL"
echo "VPC ID: $VPC_ID"

# Store additional secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name "thrifto/jwt" \
  --description "Thrifto JWT token key" \
  --secret-string "$(openssl rand -base64 64)" \
  --region $REGION || echo "JWT secret already exists"

aws secretsmanager create-secret \
  --name "thrifto/s3bucket" \
  --description "Thrifto S3 bucket name" \
  --secret-string "$S3_BUCKET" \
  --region $REGION || echo "S3 bucket secret already exists"

echo "Secrets stored in AWS Secrets Manager"
echo "Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Set up GitHub Actions secrets in your repository:"
echo "   - AWS_ACCESS_KEY_ID"
echo "   - AWS_SECRET_ACCESS_KEY"
echo "2. Push your code to trigger the CI/CD pipeline"
echo "3. Access your application at: $LB_URL"