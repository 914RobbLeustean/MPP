FROM node:18-alpine AS build
WORKDIR /app
COPY thrifto.client/package*.json ./
RUN npm ci --only=production
COPY thrifto.client/ .
RUN npm run build -- --configuration=production

FROM nginx:alpine AS final
COPY --from=build /app/dist/thrifto.client /usr/share/nginx/html
COPY thrifto.client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]