FROM node:16.14 AS build

WORKDIR /app


# Install pnpm, & vite, copy over the project files, & build it
RUN npm install -g vite
RUN npm install -g pnpm@8.7.6
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]