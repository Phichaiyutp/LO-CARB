# NestJS + Docker + Heroku Deployment Guide

## 📌 Prerequisites
Before proceeding, make sure you have the following installed:
- [Node.js (LTS)](https://nodejs.org/)
- [Docker](https://www.docker.com/get-started)
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

---

## 📦 Install NestJS
1. Install NestJS CLI globally:
   ```sh
   npm install -g @nestjs/cli
   ```
2. Create a new NestJS project:
   ```sh
   nest new my-nest-app
   ```
3. Navigate to the project directory:
   ```sh
   cd my-nest-app
   ```
4. Install dependencies:
   ```sh
   npm install
   ```

---

## 🐳 Setup Docker for NestJS
1. Create a `Dockerfile` in the root directory:
   ```dockerfile
   # Use Node.js as base image
   FROM node:18-alpine

   # Set working directory
   WORKDIR /app

   # Copy package.json and install dependencies
   COPY package*.json ./
   RUN npm install

   # Copy application code
   COPY . .

   # Build NestJS app
   RUN npm run build

   # Expose port
   EXPOSE 3000

   # Start the application
   CMD ["npm", "run", "start"]
   ```
2. Create a `.dockerignore` file to exclude unnecessary files:
   ```
   node_modules
   dist
   .git
   .env
   ```
3. Build and run the Docker container:
   ```sh
   docker build -t my-nest-app .
   docker run -p 3000:3000 my-nest-app
   ```

Now, the NestJS app should be running inside a Docker container at `http://localhost:3000` 🚀

---

## ☁️ Deploy NestJS to Heroku using Docker
### **1. Login to Heroku CLI**
```sh
heroku login
```

### **2. Create a new Heroku app**
```sh
heroku create my-nest-app
```

### **3. Add Heroku Container Registry**
```sh
heroku container:login
```

### **4. Create `heroku.yml` for Deployment**
In the root directory, create a `heroku.yml` file:
```yaml
build:
  docker:
    web: Dockerfile
run:
  web: npm run start
```  

### **5. Push and Release to Heroku**
1. Build and push the Docker image:
   ```sh
   heroku container:push web -a my-nest-app
   ```
2. Release the app:
   ```sh
   heroku container:release web -a my-nest-app
   ```

### **6. Open the deployed app**
```sh
heroku open
```

🚀 Your NestJS app is now deployed on Heroku using Docker! 🎉

---

## 🔄 Update & Redeploy
Whenever you make changes, you can redeploy using:
```sh
heroku container:push web -a my-nest-app
heroku container:release web -a my-nest-app
```

---

## 🔧 Environment Variables
To configure your NestJS application, you need to set up the following environment variables in your `.env` file:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
REDIS_URL=redis://default:password@redis-host:6379
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production  # or development
PORT=3000
```

In Heroku, set them using:
```sh
heroku config:set MONGO_URI=mongodb+srv://your-uri
heroku config:set REDIS_URL=redis://your-redis-url
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set NODE_ENV=production
heroku config:set PORT=3000
```

---

## 🛠 Troubleshooting
- If the app doesn't start, check logs:
  ```sh
  heroku logs --tail -a my-nest-app
  ```
- Make sure `PORT=3000` is set in the code, as Heroku dynamically assigns ports:
  ```typescript
  const port = process.env.PORT || 3000;
  await app.listen(port);
  ```

