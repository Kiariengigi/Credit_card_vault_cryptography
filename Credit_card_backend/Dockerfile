# Step 1: Use official Python image
FROM python:3.13-slim

# Step 2: Set working directory
WORKDIR /app

# Step 3: Copy your app code
COPY . /app

# Step 4: Install Python dependencies
RUN pip install --no-cache-dir flask mysql-connector-python gunicorn

# Step 5: Install MySQL server
RUN apt-get update && \
    apt-get install -y default-mysql-server && \
    rm -rf /var/lib/apt/lists/*

# Step 6: Expose Flask port
EXPOSE 5000

# Step 7: Start MySQL and your app
CMD service mysql start && \
    mysql -e "CREATE DATABASE IF NOT EXISTS mydb;" && \
    mysql -e "CREATE USER IF NOT EXISTS 'user'@'localhost' IDENTIFIED BY 'password';" && \
    mysql -e "GRANT ALL PRIVILEGES ON mydb.* TO 'user'@'localhost';" && \
    gunicorn app:app --bind 0.0.0.0:5000
