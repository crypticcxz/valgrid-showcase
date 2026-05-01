export PATH="$HOME/.orbstack/bin:$PATH"

docker compose down --remove-orphans
docker compose up --build
