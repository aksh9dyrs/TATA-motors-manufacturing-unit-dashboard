# syntax=docker/dockerfile:1

# --- Build Stage ---
FROM node:20-alpine AS build
WORKDIR /app
# Copy only package.json and package-lock.json if present for install step
COPY --link package.json ./
# If you have a lock file, uncomment the next line (but do NOT copy lock files if not present)
# COPY --link package-lock.json ./
# Install dependencies (if any)
RUN if [ -f package.json ]; then npm install --production=false || true; fi
# Copy the rest of the frontend source
COPY --link . ./

# --- Final Stage ---
FROM nginx:1.25-alpine AS final
# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*
# Copy built frontend files to nginx html directory
COPY --from=build /app/index.html /usr/share/nginx/html/
COPY --from=build /app/app.js /usr/share/nginx/html/
COPY --from=build /app/style.css /usr/share/nginx/html/
# (If you have other static assets, add COPY lines as needed)

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose port 80 (nginx default)
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
