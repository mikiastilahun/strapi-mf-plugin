FROM node:20-alpine

CMD ["pnpm", "start"]

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN apk add --no-cache curl

RUN npm install -g pnpm yalc
RUN chown -R node:node /home/node

USER node
WORKDIR /home/node

COPY --chown=node:node package.json /home/node/package.json

RUN pnpm install

COPY --chown=node:node . /home/node/

RUN pnpm build


# # only for troubleshooting !!! PLEASE ALWAYS DISABLE THIS BEFORE PUSHING THE IMAGE !!!
# COPY .env /home/node/mf-demo-strapi/.env

