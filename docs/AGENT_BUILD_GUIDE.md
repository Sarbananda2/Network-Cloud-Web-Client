# NetworkCloud Agent Build Guide

This guide walks you through setting up your local environment and using Cursor AI to build the Windows network agent.

---

## Part 1: Your Prerequisites

### 1. Install Go

Download and install Go from: https://go.dev/dl/

Choose the **Windows installer** (`.msi` file). After installation, open PowerShell and verify:

```powershell
go version
```

You should see something like: `go version go1.22.0 windows/amd64`

### 2. Install Git

Download from: https://git-scm.com/download/win

Use default settings during installation. Verify:

```powershell
git --version
```

### 3. Install Cursor

Download from: https://cursor.com

Install and sign in with your account.

### 4. Create a GitHub Repository

1. Go to https://github.com/new
2. Name it `networkcloud` (or your preferred name)
3. Set to **Private** (recommended for security)
4. **Don't initialize** with README (we'll push existing files)
5. Click **Create repository**

### 5. Get Your API Token

1. Open the NetworkCloud web app (your Replit deployment)
2. Log in with Google
3. Go to **Agent Tokens** in the navigation header
4. Click **Create Token**
5. Name it "Development Agent"
6. **Copy the token immediately** - save it somewhere secure (you won't see it again)

---

## Part 2: Push to GitHub (From Replit)

In the Replit Shell, run these commands:

```bash
# Configure Git identity (use your actual email/name)
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"

# Add your GitHub repository as a remote
git remote add origin https://github.com/YOUR_USERNAME/networkcloud.git

# Push to GitHub
git push origin main
```

> **Note**: You may need to authenticate. Use a GitHub Personal Access Token as your password.
> Create one at: https://github.com/settings/tokens

---

## Part 3: Clone Locally on Windows

Open PowerShell on your Windows machine:

```powershell
# Create a projects folder (or use your preferred location)
mkdir C:\Projects
cd C:\Projects

# Clone your repository
git clone https://github.com/YOUR_USERNAME/networkcloud.git
cd networkcloud

# Create the agent folder
mkdir agent
cd agent

# Initialize Go module
go mod init networkcloud-agent
```

---

## Part 4: Open in Cursor

1. Open **Cursor**
2. **File** > **Open Folder**
3. Select `C:\Projects\networkcloud\agent`
4. Cursor will recognize it as a Go project

---

## Part 5: Cursor AI Prompt

Copy and paste this entire block into Cursor's chat window:

---

```
Build a Windows network discovery agent in Go for the NetworkCloud application.

## Project Overview

This agent runs on Windows machines, scans the local network for devices, and reports them to a web API. It should run as a Windows Service in production but also support foreground mode for testing.

## Monorepo Context

This agent lives in the `agent/` folder of a larger monorepo:
- The web app (Node.js/React) is in the parent directory
- API documentation is at `../docs/AGENT_API.md`
- This agent folder is a standalone Go module

## Technical Requirements

### 1. Configuration (config/config.go)

Create a YAML-based configuration system:

```yaml
# config.yaml
api:
  # Development: https://your-app.replit.app
  # Production: https://networkcloud.tech
  baseUrl: "https://your-app.replit.app"
  token: "nc_your_token_here"

scanner:
  interval: 60          # seconds between scans
  interface: ""         # empty = auto-detect primary interface
  timeout: 5            # seconds to wait for device responses

logging:
  level: "info"         # debug, info, warn, error
  file: "agent.log"     # empty = stdout only
```

Load config from:
1. `./config.yaml` (current directory)
2. `%APPDATA%\NetworkCloud\config.yaml`
3. Command-line flag `--config`

### 2. API Client (api/client.go)

Implement HTTP client for NetworkCloud API:

**Base URL**: From config (e.g., https://your-app.replit.app)

**Authentication**: Bearer token in header
```
Authorization: Bearer nc_xxxxx
```

**Endpoints to implement**:

1. **Heartbeat** - Call every scan cycle
   ```
   POST /api/agent/heartbeat
   Response: { "status": "ok", "serverTime": "..." }
   ```

2. **Sync Devices** - Send all discovered devices
   ```
   PUT /api/agent/devices/sync
   Content-Type: application/json
   
   Request:
   {
     "devices": [
       {
         "name": "DESKTOP-ABC123",
         "macAddress": "AA:BB:CC:DD:EE:FF",
         "status": "online",
         "ipAddress": "192.168.1.100"
       }
     ]
   }
   
   Response:
   { "created": 1, "updated": 0, "deleted": 0 }
   ```
   
   **Important**: This endpoint deletes devices NOT in the request. If a device was previously synced but isn't in the current list, it gets removed. Status can be `online`, `offline`, or `away`.

**Error handling**:
- Retry on network failures (3 attempts, exponential backoff)
- Log but don't crash on API errors
- Queue failed syncs for next cycle

### 3. Network Scanner (scanner/scanner.go)

Implement local network discovery:

**Discovery method**: ARP scanning
- Use `github.com/google/gopacket` for packet capture
- Fall back to `arp -a` command parsing if gopacket fails

**For each discovered device, collect**:
- IP address (required)
- MAC address (required, format: `AA:BB:CC:DD:EE:FF`)
- Hostname (resolve via reverse DNS, use "Unknown" if fails)
- Status: "online" (all discovered devices are online)

**Network detection**:
- Auto-detect the primary network interface
- Get local subnet (e.g., 192.168.1.0/24)
- Support manual interface override via config

**Performance**:
- Scan timeout: configurable (default 5 seconds)
- Don't block main loop if scan takes too long

### 4. Windows Service (service/service.go)

Use `github.com/kardianos/service` for Windows Service support:

**Service details**:
- Name: `NetworkCloudAgent`
- Display Name: `NetworkCloud Agent`
- Description: `Monitors local network and reports devices to NetworkCloud`

**Lifecycle**:
- Install: Register with Windows Service Manager
- Start: Begin scan loop
- Stop: Graceful shutdown, complete current sync
- Uninstall: Remove from Windows Service Manager

### 5. Main Entry Point (main.go)

CLI commands using `github.com/spf13/cobra`:

```
agent install     # Install as Windows Service
agent uninstall   # Remove Windows Service
agent start       # Start the service
agent stop        # Stop the service
agent run         # Run in foreground (for testing)
agent scan        # Single scan, print results, exit
agent version     # Print version info
```

**Flags**:
- `--config <path>` - Custom config file path
- `--verbose` - Enable debug logging

### 6. Main Loop Logic

```
1. Load configuration
2. Validate API connectivity (heartbeat)
3. Enter loop:
   a. Scan local network
   b. Format device list
   c. Send heartbeat
   d. Sync devices to API
   e. Log results
   f. Sleep for interval
4. On shutdown signal: complete current cycle, exit cleanly
```

## File Structure

```
agent/
├── main.go                 # Entry point, CLI setup
├── go.mod                  # Go module definition
├── go.sum                  # Dependencies checksum
├── config/
│   └── config.go           # Configuration loading
├── api/
│   └── client.go           # NetworkCloud API client
├── scanner/
│   └── scanner.go          # Network discovery
├── service/
│   └── service.go          # Windows Service wrapper
├── config.example.yaml     # Sample configuration
└── README.md               # Agent-specific documentation
```

## Dependencies

Add these to go.mod:

```
github.com/kardianos/service   # Windows Service
github.com/google/gopacket     # Packet capture (ARP)
github.com/spf13/cobra         # CLI framework
gopkg.in/yaml.v3               # YAML config
```

Install with:
```powershell
go get github.com/kardianos/service
go get github.com/google/gopacket
go get github.com/spf13/cobra
go get gopkg.in/yaml.v3
```

**Note**: gopacket requires Npcap on Windows. Download from: https://npcap.com/

## Sample config.example.yaml

Create this file for users to copy:

```yaml
# NetworkCloud Agent Configuration
# Copy this file to config.yaml and update values

api:
  # Your NetworkCloud web app URL
  baseUrl: "https://your-app.replit.app"
  
  # API token from Agent Tokens page (shown only once when created)
  token: "nc_paste_your_token_here"

scanner:
  # Seconds between network scans (minimum: 30)
  interval: 60
  
  # Network interface name (empty = auto-detect)
  # Example: "Ethernet", "Wi-Fi"
  interface: ""
  
  # Seconds to wait for device responses
  timeout: 5

logging:
  # Log level: debug, info, warn, error
  level: "info"
  
  # Log file path (empty = console only)
  # Example: "C:\\ProgramData\\NetworkCloud\\agent.log"
  file: ""
```

## Important Notes

1. **Administrator Required**: ARP scanning needs elevated privileges
2. **Npcap Required**: Install from https://npcap.com/ for packet capture
3. **Firewall**: May need Windows Firewall exceptions
4. **Token Security**: Never commit config.yaml with real tokens

## Testing Steps

After building, test in this order:

1. `go build -o agent.exe`
2. `.\agent.exe version` - Verify build
3. `.\agent.exe scan` - Test network scanning
4. `.\agent.exe run` - Test full loop (Ctrl+C to stop)
5. `.\agent.exe install` - Install service (run as Admin)
6. `.\agent.exe start` - Start service

Start by implementing the configuration loader, then the API client with heartbeat, then add scanning, and finally wrap it in the service.
```

---

## Part 6: Testing Your Agent

### Build and Test Locally

```powershell
# Build the executable
cd C:\Projects\networkcloud\agent
go build -o agent.exe

# Check version
.\agent.exe version

# Run a single network scan (requires Admin)
.\agent.exe scan

# Run in foreground mode (Ctrl+C to stop)
.\agent.exe run
```

### Install as Windows Service

Run PowerShell **as Administrator**:

```powershell
# Install the service
.\agent.exe install

# Start the service
.\agent.exe start

# Check status
Get-Service NetworkCloudAgent

# View logs
Get-EventLog -LogName Application -Source NetworkCloudAgent -Newest 20

# Stop and uninstall when done testing
.\agent.exe stop
.\agent.exe uninstall
```

---

## Part 7: Troubleshooting

### "Access Denied" during network scan

ARP scanning requires Administrator privileges. Right-click PowerShell and select "Run as Administrator".

### "Npcap not found" or gopacket errors

Install Npcap from https://npcap.com/. During installation, check "Install Npcap in WinPcap API-compatible mode".

### No devices found

- Verify you're on the correct network interface
- Check Windows Firewall isn't blocking the scan
- Try specifying the interface explicitly in config.yaml
- Run `arp -a` in PowerShell to verify ARP works

### API connection fails

Test manually first:

```powershell
# Test heartbeat (replace with your URL and token)
Invoke-RestMethod -Method POST `
  -Uri "https://your-app.replit.app/api/agent/heartbeat" `
  -Headers @{ "Authorization" = "Bearer nc_your_token" }
```

If this fails:
- Verify the web app is running (check Replit)
- Verify the token is correct (tokens are shown only once)
- Check for typos in config.yaml

### Service won't start

1. Check Windows Event Viewer:
   - Open Event Viewer
   - Windows Logs > Application
   - Look for "NetworkCloudAgent" errors

2. Common issues:
   - Config file not found (copy to `%APPDATA%\NetworkCloud\config.yaml`)
   - Invalid token
   - Npcap not installed

---

## Part 8: Development Workflow

### Making Changes

1. Edit code in Cursor
2. Build: `go build -o agent.exe`
3. Test: `.\agent.exe run`
4. Check NetworkCloud dashboard for device updates

### Syncing with Git

```powershell
# From the agent folder
cd C:\Projects\networkcloud\agent

# Stage and commit
git add .
git commit -m "Add network scanning feature"

# Push to GitHub
git push origin main
```

### Updating the Web App

When you make changes to the web app in Replit, pull them locally:

```powershell
cd C:\Projects\networkcloud
git pull origin main
```

---

## Part 9: Production Deployment

When ready for production:

1. **Deploy web app** on Replit with custom domain
2. **Update agent config** with production URL (networkcloud.tech)
3. **Create production token** (separate from dev token)
4. **Install agent** on target Windows machines
5. **Configure** each machine with its own config.yaml

### Distributing to Other Machines

Package for distribution:

```
networkcloud-agent/
├── agent.exe              # Built executable
├── config.example.yaml    # Template config
├── install.ps1            # Installation script
└── README.txt             # Quick start guide
```

---

## Security Checklist

- [ ] Never commit `config.yaml` with real tokens
- [ ] Add `config.yaml` to `.gitignore`
- [ ] Use separate tokens for dev and production
- [ ] Store production config in `%APPDATA%\NetworkCloud\`
- [ ] Revoke tokens when no longer needed
- [ ] Run service under a dedicated Windows account (optional)
