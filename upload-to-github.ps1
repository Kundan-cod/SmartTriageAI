# SmartTriage AI - GitHub Upload Script
# This script will initialize Git and push your project to GitHub

Write-Host "🚀 SmartTriage AI - GitHub Upload Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Git is available
try {
    $gitVersion = git --version 2>$null
    if ($gitVersion) {
        Write-Host "✓ Git is installed: $gitVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Git is not available in PATH" -ForegroundColor Red
    Write-Host "Please restart PowerShell or your computer after Git installation" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Use GitHub Desktop instead!" -ForegroundColor Cyan
    Write-Host "Download from: https://desktop.github.com/" -ForegroundColor Cyan
    exit
}

Write-Host ""
Write-Host "⚙️ Configuring Git..." -ForegroundColor Yellow

# Prompt for user information
$userName = Read-Host "Enter your GitHub username (or full name)"
$userEmail = Read-Host "Enter your GitHub email"

# Configure Git
git config --global user.name "$userName"
git config --global user.email "$userEmail"

Write-Host "✓ Git configured successfully" -ForegroundColor Green
Write-Host ""

# Initialize repository
Write-Host "📦 Initializing Git repository..." -ForegroundColor Yellow
git init

# Add all files
Write-Host "📝 Adding all files..." -ForegroundColor Yellow
git add .

# Create commit
Write-Host "💾 Creating initial commit..." -ForegroundColor Yellow
$commitMessage = @"
Initial commit: SmartTriage AI with doctor-patient workflow

Features:
- 9-step context-aware assessment
- 3-layer AI algorithm with explainable intelligence
- Real-time doctor notifications with sound alerts
- Complete patient details modal showing all 9 steps
- Doctor-patient workflow management
- Status tracking system (Waiting → Called → Consulting → Completed)
- Emergency prioritization with visual/audio alerts
- Beautiful glassmorphism UI with animations

Co-Authored-By: Warp <agent@warp.dev>
"@

git commit -m "$commitMessage"

Write-Host "✓ Initial commit created" -ForegroundColor Green
Write-Host ""

# Rename branch to main
Write-Host "🔄 Setting branch to 'main'..." -ForegroundColor Yellow
git branch -M main

Write-Host "✓ Branch renamed to main" -ForegroundColor Green
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ Local repository is ready!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to GitHub: https://github.com/new" -ForegroundColor White
Write-Host "2. Create a new repository named: SmartTriage-AI" -ForegroundColor White
Write-Host "3. DO NOT initialize with README, .gitignore, or license" -ForegroundColor White
Write-Host "4. Copy the repository URL (looks like: https://github.com/USERNAME/SmartTriage-AI.git)" -ForegroundColor White
Write-Host ""

$repoUrl = Read-Host "Paste your GitHub repository URL here"

Write-Host ""
Write-Host "🔗 Adding remote repository..." -ForegroundColor Yellow
git remote add origin $repoUrl

Write-Host "⬆️ Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🎉 SUCCESS! Your project is on GitHub!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 View your repository at:" -ForegroundColor Cyan
Write-Host $repoUrl.Replace(".git", "") -ForegroundColor White
Write-Host ""
Write-Host "📝 Suggested Repository Description:" -ForegroundColor Yellow
Write-Host "AI-powered tele-health triage system with real-time doctor-patient workflow management" -ForegroundColor White
Write-Host ""
