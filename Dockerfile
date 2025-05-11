# Use official Python image
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y \
    libpq-dev gcc python3-dev musl-dev netcat-openbsd && \
    apt-get clean

# Install Python deps
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy Django code
COPY ./argpuu /app

# Collect static files
RUN mkdir -p /vol/web/static /vol/web/media
RUN chmod -R 755 /vol/web

# Entrypoint
COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
