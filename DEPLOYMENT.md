# Deploying the LMS (free tier)

Database on **MongoDB Atlas**, API on **Render**, frontend on **Vercel**. All three have free plans
and deploy straight from this GitHub repository. Do the steps in order, because each one needs a
value from the previous one.

## 1. Database — MongoDB Atlas

1. Sign up at https://www.mongodb.com/cloud/atlas and create a free **M0** cluster.
2. **Database Access** → add a database user with a generated password (save it).
3. **Network Access** → add IP address `0.0.0.0/0`. Render's free plan has no fixed IP, so this is
   required; the database password is what protects it.
4. **Connect** → **Drivers** → copy the connection string and put the password and a database
   name in it:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/lms?retryWrites=true&w=majority`

## 2. Backend — Render

1. Sign up at https://render.com with GitHub → **New** → **Web Service** → pick this repository.
2. Settings:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free
3. **Environment variables:**

   | Key | Value |
   | --- | --- |
   | `MONGO_URI` | the Atlas connection string from step 1 |
   | `JWT_SECRET` | a new long random string (not the one from your old `.env`) |
   | `NODE_ENV` | `production` |
   | `TRUST_PROXY` | `1` |
   | `CLIENT_URL` | leave as `http://localhost:5173` for now; you update it in step 4 |
   | `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | optional: Razorpay **test** keys to enable paid courses |

   To generate a `JWT_SECRET`, run:
   `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

4. Deploy. When it is live, opening `https://<your-service>.onrender.com/` shows `API is running...`.

## 3. Frontend — Vercel

1. Sign up at https://vercel.com with GitHub → **Add New** → **Project** → import this repository.
2. **Root Directory:** `client`. Vercel detects Vite: build `npm run build`, output `dist`.
3. **Environment variable:** `VITE_API_ORIGIN` = `https://<your-service>.onrender.com` (no trailing
   slash).
4. Deploy. You get a URL such as `https://lms-yourname.vercel.app`. That is your live link.

## 4. Connect the two

1. In Render → your service → **Environment**, set `CLIENT_URL` to the Vercel URL from step 3
   (for example `https://lms-yourname.vercel.app`) and save. Render redeploys automatically.
2. Add demo data so visitors see courses. From your computer, using the Atlas connection string:

   ```bash
   cd server
   MONGO_URI="<atlas connection string>" npm run seed:demo
   ```

   (In PowerShell: `$env:MONGO_URI="<atlas connection string>"; npm run seed:demo`.) The seed needs
   `NODE_ENV` unset or not `production` on your machine.

3. Optional: create an admin account the same way with `npm run create-admin`
   (set `ADMIN_EMAIL` and `ADMIN_PASSWORD` too).

## Free-tier limitations to know about

- **Cold starts:** Render's free service sleeps after ~15 minutes without traffic. The first
  visit afterwards takes 30–60 seconds while it wakes up; after that it is fast. Opening the site
  a minute before showing it to someone avoids the wait.
- **Uploaded files are temporary:** Render's free disk is wiped on every redeploy or restart, so
  thumbnails, videos and materials uploaded through the API disappear. Course and user data in
  Atlas is not affected. Permanent uploads need object storage such as Cloudinary or S3.
- **Payments** only work after adding Razorpay test keys; free courses work without them.
