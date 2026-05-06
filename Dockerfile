FROM oven/bun:1.2.19-alpine

RUN apk add --no-cache build-base py3-pip python3 python3-dev

WORKDIR /app

COPY package.json .
RUN bun install --production

COPY web web
RUN bun build web/index.html --outdir dist --public-path / --minify

COPY api api

CMD ["bun", "api/main.jsx"]
