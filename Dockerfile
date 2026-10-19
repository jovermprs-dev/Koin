# Builds the Expo web export and serves it as a static site.
FROM node:22-alpine AS build
WORKDIR /app

ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY
# "true" = public demo build: fictional data in memory, no backend (see lib/demo.ts).
ARG EXPO_PUBLIC_DEMO=false

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Expo reads EXPO_PUBLIC_* from .env.local *and* from the process environment (build ARGs are environment variables
# here) and inlines them into the bundle. A demo build must never carry Supabase credentials, even if the build
# environment has them, so it drops them from both places.
RUN if [ "$EXPO_PUBLIC_DEMO" = "true" ]; then \
      printf "EXPO_PUBLIC_DEMO=true\n" > .env.local \
      && env -u EXPO_PUBLIC_SUPABASE_URL -u EXPO_PUBLIC_SUPABASE_ANON_KEY npx expo export --platform web; \
    else \
      printf "EXPO_PUBLIC_SUPABASE_URL=%s\nEXPO_PUBLIC_SUPABASE_ANON_KEY=%s\n" \
        "$EXPO_PUBLIC_SUPABASE_URL" "$EXPO_PUBLIC_SUPABASE_ANON_KEY" > .env.local \
      && npx expo export --platform web; \
    fi

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
