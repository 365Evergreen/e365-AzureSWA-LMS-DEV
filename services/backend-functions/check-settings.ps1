$subId = '1a8d0fdd-e8b1-4c62-8ff8-6e9f52765943'
$rg = 'rg-lms-dev'; $appName = 'lms-func-365ev-dev'; $apiVersion = '2022-03-01'
$baseUrl = "https://management.azure.com/subscriptions/$subId/resourceGroups/$rg/providers/Microsoft.Web/sites/$appName"
$token = (az account get-access-token --resource 'https://management.azure.com' --query accessToken -o tsv)
$headers = @{ 'Authorization' = "Bearer $token"; 'Content-Type' = 'application/json' }

# Show current settings raw from ARM
$current = Invoke-RestMethod -Uri "$baseUrl/config/appsettings/list?api-version=$apiVersion" -Method Post -Headers $headers
$current.properties | ConvertTo-Json -Depth 5
