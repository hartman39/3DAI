# 🚀 Quick Setup Guide

## Installation

No installation needed! This is a pure client-side application.

### Method 1: Local File
1. Download or clone this repository
2. Open `index.html` in your web browser
3. Start designing!

### Method 2: GitHub Pages (Recommended)
1. Fork this repository
2. Go to Settings → Pages
3. Set source to "main" branch
4. Your app will be live at `https://yourusername.github.io/universal-3d-builder`

### Method 3: Local Server (Optional)
If you prefer to use a local server:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have npm installed)
npx serve
```

Then open `http://localhost:8000` in your browser.

## Requirements

- **Browser**: Chrome, Firefox, Safari, or Edge (latest version)
- **Internet Connection**: Required for AI features and CDN resources
- **WebGL**: Must be enabled in your browser

## First Steps

1. **Open the app** - Load `index.html` in your browser
2. **Try AI Chat** - Click "AI Chat" tab and type "Create a red car"
3. **Explore Manual Mode** - Click "Manual" tab to add shapes manually
4. **View Your Objects** - Click "Objects" tab to see and edit what you've created
5. **Export Your Design** - Click "Save/Export" tab to download STL files

## Troubleshooting

### App won't load
- Check browser console for errors (F12)
- Ensure you have internet connection (loads libraries from CDN)
- Try a different browser

### AI not responding
- Check your internet connection
- The AI feature uses the Anthropic API
- Try refreshing the page

### 3D view is black
- Check if WebGL is enabled in your browser
- Update your graphics drivers
- Try a different browser

### Objects not appearing
- Make sure you're in the right tab
- Try zooming out (scroll wheel)
- Check the Objects list on the right

## Tips for Best Experience

1. **Use Chrome or Firefox** for best performance
2. **Keep objects under 100** for smooth rendering
3. **Save frequently** using the Save Design feature
4. **Start with AI** to create templates, then refine manually
5. **Use different views** (Front, Top, etc.) for precision

## What's Next?

- Read the full [README.md](README.md) for detailed features
- Try the example AI prompts
- Export your first STL file
- Share your designs with the share link feature

---

**Need Help?** Open an issue on GitHub!

**Have Fun!** 🎨✨
