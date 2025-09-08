# Clear Next.js Cache Commands

## For Windows PowerShell:
```powershell
# Stop the development server first (Ctrl+C)

# Clear Next.js cache
Remove-Item -Recurse -Force .next

# Clear node_modules (if needed)
Remove-Item -Recurse -Force node_modules
npm install

# Restart development server
npm run dev
```

## For Windows Command Prompt:
```cmd
# Stop the development server first (Ctrl+C)

# Clear Next.js cache
rmdir /s /q .next

# Clear node_modules (if needed)
rmdir /s /q node_modules
npm install

# Restart development server
npm run dev
```

## Quick Fix (Try this first):
```powershell
# Just clear Next.js cache
Remove-Item -Recurse -Force .next
npm run dev
```

