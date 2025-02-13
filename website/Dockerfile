FROM node:22-alpine AS base

WORKDIR /app

COPY package.json yarn.lock* ./

RUN yarn install

COPY public ./public
COPY src ./src
COPY next.config.mjs .
COPY tsconfig.json .



FROM base AS build

ARG NEXT_PUBLIC_CLASSIFICATION_URL
ENV NEXT_PUBLIC_CLASSIFICATION_URL=${NEXT_PUBLIC_CLASSIFICATION_URL}

RUN yarn run build



FROM base AS development

CMD yarn run dev



FROM base AS production

COPY --from=build app/public ./public
COPY --from=build app/.next ./.next

CMD yarn run start
