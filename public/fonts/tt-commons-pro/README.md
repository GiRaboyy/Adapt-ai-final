# TT Commons Pro Font Files

This directory should contain the TT Commons Pro font files.

## Required Files

Place the following font files in this directory:

- `TTCommonsPro-Regular.woff2`
- `TTCommonsPro-Medium.woff2`
- `TTCommonsPro-DemiBold.woff2`
- `TTCommonsPro-Bold.woff2`

## Important Note

**TT Commons Pro is a commercial font.** You need to:

1. Purchase a license from the official TypeType foundry
2. Download the font files legally
3. Place them in this directory

## Fallback Behavior

Until the font files are added, the application will use the fallback fonts defined in `app/layout.tsx`:
- System UI
- -apple-system
- Segoe UI
- Arial
- sans-serif

The styling and layout are already configured to work with TT Commons Pro. Once you add the font files, they will be automatically loaded and applied.
