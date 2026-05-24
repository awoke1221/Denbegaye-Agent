### 4. Add Pages API

1. Go back to "Add Product" and find "Facebook Login for Business"
2. Set it up and add these permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list`

```env
NEXT_PUBLIC_TIKTOK_CLIENT_KEY=your_client_key_here
```

## Testing the Integration

1. Start your development server: `npm run dev`
2. Go to the Facebook or TikTok management tools
3. Click the "Login with [Platform]" button
4. You'll be redirected to authenticate
5. After authentication, you'll be redirected back and automatically connected

## Production Deployment

When deploying to production:

1. Update all redirect URIs to use your production domain
2. Ensure your environment variables are set in your hosting platform
3. Test the OAuth flow in production
4. Consider implementing proper token storage (database) instead of localStorage

## Security Notes

- Never expose your app secrets in client-side code
- Store access tokens securely (consider encryption)
- Implement token refresh logic for long-term use
- Regularly rotate your app secrets
- Use HTTPS in production

If you encounter issues, check the browser console and server logs for error messages.
