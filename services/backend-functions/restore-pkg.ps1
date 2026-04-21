$subId = '1a8d0fdd-e8b1-4c62-8ff8-6e9f52765943'
$rg = 'rg-lms-dev'; $appName = 'lms-func-365ev-dev'; $apiVersion = '2022-03-01'
$baseUrl = "https://management.azure.com/subscriptions/$subId/resourceGroups/$rg/providers/Microsoft.Web/sites/$appName"
$token = (az account get-access-token --resource 'https://management.azure.com' --query accessToken -o tsv)
$headers = @{ 'Authorization' = "Bearer $token"; 'Content-Type' = 'application/json' }
$current = Invoke-RestMethod -Uri "$baseUrl/config/appsettings/list?api-version=$apiVersion" -Method Post -Headers $headers
$origSas = 'https://stlms365evdev.blob.core.windows.net/function-releases/20260422060203-8025ca3c-a431-49f9-bf01-67fd30725660.zip?st=2026-04-21T19%3A52%3A04Z&se=2036-04-08T20%3A02%3A04Z&sp=r&sv=2022-11-02&sr=b&sig=Ki72/oOrSQXTMBwDITk7%2BHxwRrmDhmzeLfkZfYbnXd8%3D'
$current.properties | Add-Member -MemberType NoteProperty -Name 'WEBSITE_RUN_FROM_PACKAGE' -Value $origSas -Force
$body = $current | ConvertTo-Json -Depth 10
$result = Invoke-RestMethod -Uri "$baseUrl/config/appsettings?api-version=$apiVersion" -Method Put -Headers $headers -Body $body
Write-Host "Restored WEBSITE_RUN_FROM_PACKAGE"
