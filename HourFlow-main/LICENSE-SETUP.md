# License Key Verification Setup

This guide explains how to set up license key verification for your HourFlow application using Gumroad.

## How It Works

1. Customers purchase your product on Gumroad and receive a license key
2. When they visit your application, they'll be prompted to enter this license key
3. Your application verifies the key with Gumroad's API
4. If valid, the user can access your application

## Setup Instructions

### 1. Enable License Keys in Gumroad

1. Log in to your Gumroad account
2. Go to your product page
3. Click on "Edit"
4. Scroll down to "License keys" and enable them
5. Save your changes

### 2. Configure Your Application

1. Open `api/verify-license.js`
2. Find the line with `product_permalink: 'YOUR_PRODUCT_PERMALINK'`
3. Replace `YOUR_PRODUCT_PERMALINK` with your actual Gumroad product permalink
   - This is the unique identifier in your product's URL (e.g., if your product URL is `https://gumroad.com/l/your-product`, the permalink is `your-product`)

### 3. Deploy Your Application

1. Deploy your application to Vercel as usual
2. Test the license verification with a valid license key

## Testing

For testing purposes, the following license keys will always work:
- `DEMO-KEY-1234`
- `TEST-KEY-5678`

Remember to remove these test keys before going to production by editing the `testKeys` array in `api/verify-license.js`.

## Troubleshooting

If you encounter issues with license verification:

1. Check your browser console for any error messages
2. Verify that your Gumroad product permalink is correct
3. Ensure that license keys are enabled for your Gumroad product
4. Test with a known valid license key from a test purchase

For more information on Gumroad's license key API, visit: https://app.gumroad.com/api
