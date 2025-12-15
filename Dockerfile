FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/server.js /app/server.js
COPY --from=builder /app/package.json /app/package.json
RUN npm ci --omit=dev
ARG DATABASE_URL
ARG JWT_SECRET
ARG APP_URL
ARG BREVO_SMTP_LOGIN
ARG BREVO_SMTP_PASSWORD
ENV DATABASE_URL=$DATABASE_URL
ENV JWT_SECRET=$JWT_SECRET
ENV APP_URL=$APP_URL
ENV BREVO_SMTP_LOGIN=$BREVO_SMTP_LOGIN
ENV BREVO_SMTP_PASSWORD=$BREVO_SMTP_PASSWORD
EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "server.js"]
