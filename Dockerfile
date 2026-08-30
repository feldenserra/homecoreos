# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

FROM base AS deps
COPY .yarn ./.yarn
COPY .yarnrc.yml package.json yarn.lock ./
RUN yarn install --immutable

FROM deps AS builder
COPY . .
# Import-time checks in db/auth need placeholders during `next build`
ENV DATABASE_URL=postgres://postgres:password@db:5432/app_local
ENV AUTH_SECRET=build-time-placeholder
ENV AUTH_URL=http://localhost:3000
RUN yarn build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

FROM deps AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 3000
CMD ["yarn", "dev", "--hostname", "0.0.0.0", "--port", "3000"]
