# Script PowerShell pour mettre Bobby au niveau 50
# Niveau 50 nécessite 49 000 XP
# 98 victoires × 500 XP = 49 000 XP

$body = @{
    pseudo = "bobby"
    wins = 98
    eventsCount = 10
} | ConvertTo-Json

Write-Host "🎮 Mise à jour de Bobby au niveau 50..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/update-user-stats" `
        -Method POST `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "`n✅ Succès !" -ForegroundColor Green
    Write-Host "`n📊 AVANT:" -ForegroundColor Yellow
    Write-Host "   Victoires: $($response.before.wins)"
    Write-Host "   Événements: $($response.before.eventsCount)"
    Write-Host "   XP: $($response.before.xp)"
    Write-Host "   Niveau: $($response.before.level)"
    
    Write-Host "`n📊 APRÈS:" -ForegroundColor Green
    Write-Host "   Victoires: $($response.after.wins)"
    Write-Host "   Événements: $($response.after.eventsCount)"
    Write-Host "   XP: $($response.after.xp)"
    Write-Host "   Niveau: $($response.after.level)"
    
    if ($response.after.level -eq 50) {
        Write-Host "`n🏆 BOBBY EST MAINTENANT NIVEAU 50 - LEGENDARY !" -ForegroundColor Magenta
    }
} catch {
    Write-Host "`n❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    
    # Essayer avec Bobby (majuscule)
    Write-Host "`n🔄 Tentative avec 'Bobby' (majuscule)..." -ForegroundColor Yellow
    
    $body2 = @{
        pseudo = "Bobby"
        wins = 98
        eventsCount = 10
    } | ConvertTo-Json
    
    try {
        $response2 = Invoke-RestMethod -Uri "http://localhost:3000/api/update-user-stats" `
            -Method POST `
            -Body $body2 `
            -ContentType "application/json"
        
        Write-Host "`n✅ Succès avec Bobby !" -ForegroundColor Green
        Write-Host "Niveau: $($response2.after.level)" -ForegroundColor Magenta
    } catch {
        Write-Host "`n❌ Échec: $($_.Exception.Message)" -ForegroundColor Red
    }
}
