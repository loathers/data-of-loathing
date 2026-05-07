FROM node:22

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY packages/etl/package.json packages/etl/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

RUN corepack enable && yarn install --frozen-lockfile

COPY . .

RUN yarn workspace data-of-loathing run build

ENV PORT=3000
ENV SQLITE_PATH=/dol.sqlite

EXPOSE 3000

WORKDIR /app/packages/server
CMD ["node", "--import", "tsx", "src/index.ts"]
