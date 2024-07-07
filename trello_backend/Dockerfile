# Use the official Python 3.8 image.
FROM python:3.8

# Set the working directory inside the container.
WORKDIR /app

# Copy the requirements.txt to the working directory.
COPY requirements.txt .

# Install the Python dependencies.
RUN pip install -r requirements.txt

# Copy the rest of the application code to the working directory.
COPY . .

# Expose port 5000.
EXPOSE 5000

# Start the Flask app.
CMD ["python", "app.py"]

