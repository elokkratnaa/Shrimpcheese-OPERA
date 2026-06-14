# Deployment

OPERA is deployed on Vercel.

## Environment Checklist

Before deploying, ensure the following environment variables are set in the Vercel project settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GROQ_API_KEY`

## Deployment Steps

1. Connect the repository to Vercel.
2. Configure the build settings for the `opera` directory.
3. Add the environment variables listed above.
4. Deploy the project.

## Post-Deployment

- Configure Supabase Auth redirect URLs to point to your Vercel production domain.
- Verify that Google OAuth credentials are updated in the Supabase/Google Cloud console.
