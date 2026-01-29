FROM oven/bun:canary-alpine AS base
WORKDIR /usr/local/app

COPY bun.lock .
COPY package.json .
RUN bun i --production

COPY src src

RUN addgroup -S gamesgroup
RUN adduser -S retrouser -G gamesgroup
USER retrouser

CMD ["bun", "run", "dev"]
EXPOSE 3000/tcp