#!/bin/bash
set -e

curl -X POST http://localhost:8000/professional_create.php \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Pro",
    "email": "testpro@email.com",
    "primary_role": "data_analyst",
    "years_experience": "3_5",
    "industry_experience": ["aiml", "fintech"],
    "portfolio_url": "https://portfolio.com/test",
    "linkedin_url": "https://linkedin.com/in/test",
    "hourly_rate_range": "75_100",
    "availability": "part_time",
    "professional_summary": "I am a data analyst with experience in machine learning, data dashboards, forecasting, and product analytics in fintech and AI projects."
  }'
