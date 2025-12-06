FROM node:20

WORKDIR /app

COPY package*.json .

RUN npm install react-leaflet --legacy-peer-deps

COPY . . 

EXPOSE 5173

CMD ["npm","run","dev","--","--host"]