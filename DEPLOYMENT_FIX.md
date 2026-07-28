# Fix for 500 Error and MIME Type Issues After Custom Domain Setup

## Problem
After setting up the custom domain `https://ai.stellarglobalsupplies.com`, the application was showing:
1. **500 Internal Server Error** in console
2. **MIME type error**: `Refused to apply style from 'https://ai.stellarglobalsupplies.com/assets/index-BmhvIoT2.css' because its MIME type ('text/html') is not a supported stylesheet MIME type`
3. **White screen** - application not loading

## Root Cause
The issue was caused by the Express.js catch-all route in `backend/src/index.js` serving `index.html` for ALL non-API routes, including requests for static assets (CSS, JS files). When static assets were requested:

1. The browser requests `/assets/index-BmhvIoT2.css`
2. If the file wasn't found or there was a path issue, the catch-all route would serve `index.html` instead
3. The browser receives HTML content with a 200 status code when it expects CSS
4. This causes the MIME type error and the application fails to load

## Solution

### 1. Updated Vite Configuration (`frontend/vite.config.js`)
Added explicit build configuration to ensure proper asset paths:

```javascript
export default defineConfig({
  plugins: [react()],
  base: "/",  // Ensure absolute paths from root
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});
```

### 2. Updated Express.js Server (`backend/src/index.js`)
Modified the catch-all route to properly handle static asset requests:

```javascript
// SPA fallback — serve index.html for all non-API, non-static routes
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
  // Don't serve index.html for asset requests - let them 404 properly
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json)$/)) {
    return res.status(404).json({ error: "Asset not found" });
  }
  res.sendFile("public/index.html", { root: "." });
});
```

## How It Works Now

1. **Static files**: `express.static("public")` serves files from the `public` directory (which contains the built frontend)
2. **API routes**: All `/api/*` routes are handled by the API routers
3. **SPA routes**: Non-API, non-static routes (like `/chat`, `/login`) serve `index.html` for client-side routing
4. **Missing assets**: If a static asset (CSS, JS, images) is not found, it returns a proper 404 error instead of serving HTML

## Deployment Steps

1. Commit these changes to your repository
2. Push to trigger a new deployment on Render
3. The Docker build will:
   - Build the frontend with `npm run build`
   - Copy the built files to `backend/public/`
   - Start the Express server
4. The application should now load correctly at `https://ai.stellarglobalsupplies.com`

## Verification

After deployment, verify:
- [ ] Application loads without white screen
- [ ] No 500 errors in console
- [ ] No MIME type errors for CSS/JS files
- [ ] All assets load correctly (check Network tab in DevTools)
- [ ] Application functionality works (chat, search, etc.)

## Additional Notes

- The build output shows assets are correctly generated in `dist/assets/` with hashed filenames
- The Dockerfile copies the built frontend to `./public` directory which is served by Express
- The `base: "/"` configuration ensures assets are referenced with absolute paths from the root
- The regex pattern in the catch-all route covers all common static file extensions