FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml* pnpm-lock.yaml* tsconfig.base.json ./
COPY libs ./libs
COPY apps/resume-service ./apps/resume-service
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter resume-service build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/apps/resume-service/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/main.js"]
