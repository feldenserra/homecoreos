# HomeCore Expo web — static export served by nginx.
# EXPO_PUBLIC_* must be passed as build-args (inlined at export time).

FROM node:22-bookworm AS builder

WORKDIR /app

RUN corepack enable && corepack prepare yarn@4.17.1 --activate

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY app.json tsconfig.json babel.config.js ./
COPY app ./app
COPY components ./components
COPY hooks ./hooks
COPY lib ./lib
COPY theme ./theme
COPY src ./src
COPY public ./public

RUN yarn install --immutable

ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY
ARG EXPO_PUBLIC_ALLOW_LOGINS=

ENV EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL \
    EXPO_PUBLIC_SUPABASE_ANON_KEY=$EXPO_PUBLIC_SUPABASE_ANON_KEY \
    EXPO_PUBLIC_ALLOW_LOGINS=$EXPO_PUBLIC_ALLOW_LOGINS \
    CI=1

RUN npx expo export --platform web --output-dir dist

FROM nginx:1.27-alpine AS runner

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
