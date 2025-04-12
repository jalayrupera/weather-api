#!/bin/bash

echo "Creating virtual environment 'venv'..."
python3.10 -m venv venv

if [ $? -ne 0 ]; then
    echo "Failed to create virtual environment."
    exit 1
fi

echo "Activating virtual environment 'venv'..."
source venv/bin/activate

if [ $? -ne 0 ]; then
    echo "Failed to activate virtual environment."
    exit 1
fi

echo "Installing requirements from requirements.txt into 'venv'..."
./venv/bin/pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "Failed to install requirements."
    exit 1
fi

if [ ! -f .env ]; then
  echo ".env file not found. Copying .env.example to .env"
  cp .env.example .env
fi

echo "Setup complete."
