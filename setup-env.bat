@echo off
echo Setting up Cloudflare Workers environment variables...
echo.
echo Run these commands one by one:
echo.
echo wrangler secret put VITE_YOUTUBE_API_KEY
echo (Enter: AIzaSyD9fOmxAC75yt7af0J0UsgZMD3jHxOXK3o)
echo.
echo wrangler secret put VITE_SPOTIFY_CLIENT_ID
echo (Enter: 4f60b6a5accf4e329987b3d71b280d9a)
echo.
echo wrangler secret put VITE_SPOTIFY_CLIENT_SECRET
echo (Enter: 1249ed0458124bb184225611d2b3f8cb)
echo.
echo After setting secrets, run: wrangler deploy
pause
