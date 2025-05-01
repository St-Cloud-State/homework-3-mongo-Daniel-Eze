# Acme Loan Tracker (Flask + MongoDB + JS/HTML)

## Setup

1. **Install MongoDB** in your Codespace:
   ```bash
   sudo apt-get update
   sudo apt-get install -y mongodb
   sudo mkdir -p /data/db
   sudo chown -R `id -u` /data/db
   sudo mongod --fork --logpath /var/log/mongodb.log --dbpath /data/db
