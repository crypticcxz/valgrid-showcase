FROM oven/bun:alpine

RUN apk add --no-cache build-base py3-pip python3 python3-dev

WORKDIR /app

COPY package.json .
RUN bun install --production

COPY frontend frontend
RUN bun build frontend/index.html --outdir dist --public-path / --minify

COPY backend backend

CMD ["bun", "backend/main.jsx"]
