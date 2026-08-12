FROM node:26-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml  ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:26-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]

