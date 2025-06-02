# Base Python image
FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    build-essential \
    libpq-dev \
    postgresql-client

# Set working dir
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy full project
COPY . .

# Install frontend dependencies
RUN npm install

# Collect React static files and Django static
RUN npm run build
RUN python manage.py collectstatic --noinput

EXPOSE 8000
