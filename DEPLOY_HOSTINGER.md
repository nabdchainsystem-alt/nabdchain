# Deploying NABD to Hostinger

Since you have a **Frontend + Backend** application, deployment requires two parts.

## Part 1: The Frontend (React/Vite)
I have just built your frontend code into the `dist` folder. This is a static website that can be hosted anywhere.

### Option A: Shared Hosting / Business Hosting (File Manager)
1.  **Login** to your Hostinger Dashboard.
2.  Go to **Websites** -> **Manage** -> **File Manager**.
3.  Navigate to `public_html`.
4.  **Delete** entirely `default.php` or `hosting-welcome.php` if they exist.
5.  **Upload** the **contents** of the `dist` folder (from your local computer) into `public_html`.
    *   *Note: Do not upload the `dist` folder itself, upload the files INSIDE it (`index.html`, `assets`, etc.).*
6.  **Visit your domain**. You should see the NABD App load!
    *   *Warning: You might see "Network Error" or infinite loading spinners because the Backend is not connected yet.*

## Part 2: The Backend (Node.js/Database)
Your app needs a server to handle logins, saves, and data. `localhost:3001` does not exist on the internet.

### Scenario 1: You have Hostinger "Shared/Business" Hosting
You **cannot** easily run this Node.js backend on Shared hosting.
**Recommended Solution:** Use **Railway.app** (Free/Cheap) for the backend.
1.  Deploy your `server` folder to Railway.
2.  Get your **Railway URL** (e.g., `https://nabd-api.up.railway.app`).
3.  **Re-build your Frontend**:
    *   You must tell React where the API is.
    *   Run this command in your terminal:
        ```bash
        VITE_API_URL=https://nabd-api.up.railway.app npm run build
        ```
    *   **Re-upload** the new `dist` folder to Hostinger.

### Scenario 2: You have Hostinger "VPS"
You can host everything yourself.
1.  **SSH** into your VPS: `ssh root@your_server_ip`
2.  **Install Node.js 20+**:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    npm install -g pm2
    ```
3.  **Upload your code** (e.g. using `scp` or `git clone`).
4.  **Start the Backend**:
    ```bash
    cd server
    npm install
    npx prisma migrate deploy
    pm2 start dist/index.js --name "backend"
    ```
    *   *Note: Ensure your `server/.env` uses a persistent database path or switch to Postgres.*
5.  **Serve the Frontend**:
    *   Install **Nginx**: `apt install nginx`
    *   Copy your `dist` folder to `/var/www/html`
    *   Configure Nginx to serve index.html and proxy `/api` to `localhost:3001`.

## Important: API Connection
Right now, your build defaults to `http://localhost:3001`.
**If you upload the current build, the app will open, but it won't be able to log in.**
You must deploy the backend first, get its URL, and then run `npm run build` again with that URL.
