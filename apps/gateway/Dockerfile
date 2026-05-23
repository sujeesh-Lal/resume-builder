FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml* pnpm-lock.yaml* tsconfig.base.json ./
COPY libs ./libs
COPY apps/gateway ./apps/gateway
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter gateway build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/apps/gateway/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
