# Build Stage ====================================
FROM node:22-alpine AS builder 
WORKDIR /app

RUN apk add --no-cache curl && \
    curl -fsSL https://yarnpkg.com/install.sh | sh -
ENV PATH="/root/.yarn/bin:$PATH"

COPY . .
#COPY ./.env.prod ./.env
RUN yarn install
RUN yarn build

# --- Production Stage (Final Image) ---
FROM node:20.18-alpine3.20 AS runner

WORKDIR /app

# Copy only necessary files from the build stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]
