FROM node:26-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
RUN npm install -g pnpm@latest
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml  ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:26-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]

