FROM node:20-alpine

CMD ["pnpm", "start"]

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN npm install -g pnpm
RUN chown -R node:node /home/node

USER node
WORKDIR /home/node

COPY --chown=node:node package.json /home/node/package.json

RUN pnpm install

COPY --chown=node:node . /home/node/

RUN pnpm build
