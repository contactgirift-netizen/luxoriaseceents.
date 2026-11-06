$ErrorActionPreference = "Stop"
$root = (Resolve-Path -LiteralPath $PSScriptRoot).Path
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:8000/")
try {
    $listener.Start()
    Write-Host "Luxoria Scents server running at http://127.0.0.1:8000/"
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        try {
            $relative = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart("/"))
            if ([string]::IsNullOrWhiteSpace($relative)) { $relative = "index.html" }
            $candidate = [IO.Path]::GetFullPath((Join-Path $root $relative))
            if (-not $candidate.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
                $context.Response.StatusCode = 404
                $bytes = [Text.Encoding]::UTF8.GetBytes("404 - File not found")
                $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $ext = [IO.Path]::GetExtension($candidate).ToLowerInvariant()
                $mime = @{
                    ".html"="text/html; charset=utf-8"; ".css"="text/css; charset=utf-8"
                    ".js"="application/javascript; charset=utf-8"; ".json"="application/json; charset=utf-8"
                    ".svg"="image/svg+xml"; ".png"="image/png"; ".jpg"="image/jpeg"
                    ".jpeg"="image/jpeg"; ".webp"="image/webp"; ".gif"="image/gif"
                    ".ico"="image/x-icon"; ".txt"="text/plain; charset=utf-8"
                    ".woff"="font/woff"; ".woff2"="font/woff2"; ".mp4"="video/mp4"
                }
                if ($mime.ContainsKey($ext)) { $context.Response.ContentType = $mime[$ext] } else { $context.Response.ContentType = "application/octet-stream" }
                $data = [IO.File]::ReadAllBytes($candidate)
                $context.Response.ContentLength64 = $data.Length
                $context.Response.OutputStream.Write($data, 0, $data.Length)
            }
        } catch {
            try { $context.Response.StatusCode = 500 } catch {}
        } finally {
            $context.Response.OutputStream.Close()
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
