# Combo POS - Offline-First System Guide

## 🌍 Perfect for African Restaurants

This POS system is specifically designed for restaurants in Africa and other regions with unreliable internet connectivity. It works **completely offline** and syncs data when internet becomes available.

## 🗄️ Database Architecture

### Local Storage (SQLite)
- **File-based database**: `combo_pos.db` stored locally on each device
- **No server required**: Works without any network connection
- **Fast performance**: All operations happen locally
- **Reliable**: Data is never lost due to internet outages

### Cloud Sync (End-of-Day)
- **Manual sync**: Sync when internet is available
- **Automatic backup**: Export data as JSON files
- **Flexible timing**: Sync daily, weekly, or whenever convenient

## 📊 Data Management

### What Gets Stored Locally
- ✅ **Menu Items** - All your restaurant's dishes and prices
- ✅ **Categories** - Food categories and organization
- ✅ **Orders** - All customer orders and order history
- ✅ **Payments** - Cash and mobile money transactions
- ✅ **Daily Sales** - Revenue tracking and analytics
- ✅ **User Accounts** - Staff and admin accounts
- ✅ **Inventory** - Stock levels and raw materials (if used)

### Sync Features
- 🌐 **Connection Detection** - Automatically detects internet availability
- 📤 **Data Export** - Download complete backups as JSON files
- ☁️ **Cloud Sync** - Upload to remote server when online
- 📱 **Status Monitoring** - Real-time sync status in admin panel

## 🔧 How to Use

### Daily Operations (Offline)
1. **Start the app** - Works immediately, no internet needed
2. **Take orders** - All POS functions work offline
3. **Process payments** - Record cash and mobile payments
4. **Generate receipts** - Print receipts locally
5. **View sales** - Check daily totals and analytics

### End-of-Day Sync
1. **Connect to internet** - Use WiFi, mobile data, or any connection
2. **Open Admin Panel** - Go to Dashboard → Sync
3. **Check status** - See if connection is available
4. **Export backup** - Download JSON backup file (recommended)
5. **Sync to cloud** - Upload data to remote server (optional)

## 🛡️ Data Safety

### Local Backup
- Data is automatically saved to local SQLite file
- Database file can be copied as backup: `combo_pos.db`
- Works even if device crashes or loses power

### Export Backup
- **JSON Export**: Human-readable backup format
- **Complete Data**: All orders, menu, payments, users
- **Timestamped**: Each backup includes creation date
- **Portable**: Can be restored on any device

### Remote Sync
- **End-of-day Upload**: Send all data to cloud server
- **Conflict Resolution**: Handles multiple locations
- **Secure Transfer**: Encrypted data transmission
- **Audit Trail**: Track all sync operations

## 💡 Best Practices

### For Restaurant Owners
1. **Export daily** - Download JSON backup every day
2. **Store backups safely** - Keep copies on USB drives or cloud storage
3. **Test sync regularly** - Ensure system works when internet available
4. **Train staff** - Show staff that system works offline

### For Multiple Locations
1. **Separate databases** - Each location has own local database
2. **Central sync server** - All locations sync to same cloud server
3. **Unique identifiers** - Each location has restaurant ID
4. **Consolidated reporting** - Combine data from all locations

## 🔗 Sync Endpoints

### Local API Endpoints
- `GET /api/sync/status` - Check internet connection status
- `POST /api/sync/export` - Export all data as JSON
- `GET /sync` - Admin sync management page

### Remote Sync Configuration
```javascript
// Example sync configuration
const syncConfig = {
  endpoint: 'https://your-server.com/api/restaurants/sync',
  apiKey: 'your-api-key',
  restaurantId: 'combo-restaurant-location-1'
}
```

## 📱 Electron App Benefits

### Why Electron for Offline POS
- **Desktop Application**: Installs like traditional software
- **Always Available**: No browser required, no internet needed
- **File System Access**: Direct database file storage
- **Print Support**: Direct printer integration
- **Auto-start**: Can start with Windows/computer boot

### Installation
1. **Download installer**: `combo-pos-system Setup 1.0.0.exe`
2. **Run installer**: Standard Windows installation
3. **Launch app**: Desktop icon or Start menu
4. **First setup**: Create admin account, seed sample data
5. **Start using**: Fully functional offline POS system

## 🌟 Key Advantages

### For African Restaurants
- ✅ **No internet dependency** - Works during power outages affecting internet
- ✅ **Low cost** - No monthly server fees or hosting costs
- ✅ **Fast performance** - No network delays
- ✅ **Data ownership** - Your data stays with you
- ✅ **Flexible sync** - Sync when convenient and affordable

### Business Continuity
- 📈 **Never miss sales** - System always works
- 💰 **No lost transactions** - All data saved locally
- 📊 **Complete records** - Perfect for tax and accounting
- 🔄 **Easy recovery** - Restore from backups if needed
- 🎯 **Multi-location ready** - Scale to multiple restaurants

## 🚀 Getting Started

1. **Install** the Windows app from the installer
2. **Login** with default admin account: `admin@combo.com` / `admin123`
3. **Customize menu** - Add your dishes and prices
4. **Create staff accounts** - Set up cashier accounts
5. **Start selling** - Take your first orders!
6. **Setup sync** - Configure backup and cloud sync when ready

Your POS system is now ready to work **completely offline** with the peace of mind that you can sync and backup your data whenever internet is available!