# Navigate to the project directory first
Set-Location -Path "D:\Christ_Projects\Brix\website-generator"

# Then go to the backend directory and run the server
Set-Location -Path ".\backend"
node server.js

# Keep the window open
Read-Host -Prompt "Press Enter to exit" 