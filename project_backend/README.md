# bdm

ssh backend_dev@76.13.100.33

cd projects/bdm

git pull
cd project_backend
source venv/bin/activate
sudo systemctl restart bdm-backend

cd project_frontend
sudo npm run build

sudo systemctl restart bdm-frontend