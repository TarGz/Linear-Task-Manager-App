# Linear Task Manager PWA - Setup Guide

## 🚀 Quick Start

### 1. Access the App
Visit the live PWA: **[Linear Task Manager](https://targz.github.io/Linear-Task-Manager-App/)**

### 2. Get Your Linear API Key

#### Step 2.1: Login to Linear
1. Go to [linear.app](https://linear.app)
2. Sign in to your Linear account (or create one if needed)

#### Step 2.2: Generate API Key
1. Click on your workspace name (top left)
2. Go to **Settings** → **API** → **Personal API keys**
3. Click **"Create API key"**
4. Name it something like "Linear PWA" or "Task Manager"
5. **Copy the generated key immediately** (you won't see it again!)

#### Step 2.3: Verify Your Setup
- Make sure you have at least one **team** created in Linear
- Create a few **projects** and **issues** for testing
- Ensure you have **admin or write permissions** in your team

### 3. Configure the PWA

#### Step 3.1: Open Settings
1. Open the PWA in your browser
2. Click the **⚙️ Settings** tab in the bottom navigation

#### Step 3.2: Enter API Key
1. Find the **"Linear API Key"** field
2. Paste your copied API key
3. Click **"Save Settings"**
4. You should see a success message

#### Step 3.3: Verify Connection
1. Navigate to the **📋 Tasks** tab
2. You should see your Linear issues loading
3. Go to **📁 Projects** tab to see your projects
4. If nothing loads, check the troubleshooting section below

## 📱 Install as PWA (Optional)

### On iOS (iPhone/iPad):
1. Open the app in Safari
2. Tap the **Share** button (square with arrow up)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"** in the top right

### On Android:
1. Open the app in Chrome
2. Tap the **three dots menu** (⋮)
3. Tap **"Add to Home screen"**
4. Tap **"Add"**

### On Desktop:
1. Look for the **install icon** in the address bar
2. Click **"Install"** when prompted
3. The app will open in its own window

## 🔧 Troubleshooting

### No Data Loading?

**Check API Key:**
1. Go to Settings in the PWA
2. Verify your API key is correctly pasted
3. Try generating a new API key in Linear

**Check Browser Console:**
1. Press **F12** (or **Cmd+Option+I** on Mac)
2. Click the **Console** tab
3. Look for red error messages
4. Common errors:
   - `401 Unauthorized`: Invalid API key
   - `403 Forbidden`: Insufficient permissions
   - `Network Error`: Check internet connection

**Check Linear Account:**
1. Verify you're logged into the correct Linear workspace
2. Ensure you have at least one team
3. Check that your API key hasn't been revoked

### App Won't Update?

**Clear Browser Cache:**
1. Go to Settings in the PWA
2. Click **"Check for Updates"** 
3. Or manually refresh with **Ctrl+Shift+R** (or **Cmd+Shift+R** on Mac)

**Check PWA Update:**
1. Look for update notification in the app
2. Click **"Update"** when prompted
3. Or go to Settings → **"Update PWA"**

### Common Issues:

| Issue | Solution |
|-------|----------|
| "Permission denied" | Check API key has write permissions |
| "No teams found" | Join or create a team in Linear |
| App feels slow | Check internet connection, try refresh |
| Missing features | Ensure you're on the latest version |
| Swipe not working | Try on mobile device, enable touch events |

## 🔒 Security & Privacy

### API Key Security
- Your API key is stored **locally** in your browser only
- Never shared with anyone except Linear's official API
- Use password manager for secure storage
- You can revoke the key anytime in Linear settings

### Data Privacy
- App communicates directly with Linear's API
- No data is stored on external servers
- All data cached locally for offline use
- Clear browser data to remove all traces

### Permissions Required
The app needs these Linear API permissions:
- ✅ **Read**: View your issues, projects, and teams
- ✅ **Write**: Create, update, and delete issues
- ✅ **User Info**: Access your profile and team membership

## 🎯 Getting the Most Out of the App

### Essential Features:
1. **Swipe Actions**: Swipe right→left to complete tasks, left→right to delete
2. **Global Save**: Edit multiple fields, save all changes at once
3. **Offline Mode**: Works without internet, syncs when back online
4. **Quick Add**: Tap + to quickly create tasks with due dates
5. **Status Changes**: Tap status badges to quickly change task status

### Pro Tips:
- **Install as PWA** for the best native app experience
- **Enable notifications** to get update alerts
- **Use password manager** for secure API key management
- **Test offline mode** by turning off internet temporarily
- **Update regularly** for new features and bug fixes

## 🆘 Need Help?

### Support Channels:
1. **Check the Console**: Browser Developer Tools → Console tab
2. **GitHub Issues**: Report bugs or feature requests
3. **Linear Documentation**: [linear.app/docs](https://linear.app/docs)
4. **PWA Guidelines**: Modern browser PWA documentation

### Before Reporting Issues:
- [ ] Tried refreshing the app
- [ ] Verified API key is correct
- [ ] Checked browser console for errors
- [ ] Tested in different browser
- [ ] Confirmed Linear account has proper permissions

---

**Happy task managing! 🎉**

*Built with modern web technologies for the best possible experience.*