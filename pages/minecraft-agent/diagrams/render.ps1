param([string]$PuppeteerConfig)

$ErrorActionPreference = 'Stop'
$articleDirectory = Split-Path -Parent $PSScriptRoot
$renderDirectory = Join-Path ([IO.Path]::GetTempPath()) ('minecraft-diagrams-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $renderDirectory | Out-Null

try {
    foreach ($diagramName in @('bot-capabilities', 'async-queue', 'execution-loop', 'agent-architecture')) {
        $sourcePath = Join-Path $PSScriptRoot "$diagramName.mmd"
        $source = [IO.File]::ReadAllText($sourcePath)
        if ($diagramName -eq 'bot-capabilities') {
            # Embed the cutout so the exported SVG also works in an HTML img element.
            $imagePath = Join-Path $articleDirectory 'images/minecraft-bot.png'
            $imageData = [Convert]::ToBase64String([IO.File]::ReadAllBytes($imagePath))
            $source = $source.Replace('../images/minecraft-bot.png', "data:image/png;base64,$imageData")
        }
        $inputPath = Join-Path $renderDirectory "$diagramName.mmd"
        [IO.File]::WriteAllText($inputPath, $source, [Text.UTF8Encoding]::new($false))
        $cliArguments = @('--yes', '--package', '@mermaid-js/mermaid-cli@12.0.0', 'mmdc',
            '-i', $inputPath, '-o', (Join-Path $articleDirectory "images/$diagramName.svg"),
            '-c', (Join-Path $PSScriptRoot 'mermaid-config.json'), '-b', '#101722')
        if ($PuppeteerConfig) { $cliArguments += @('-p', $PuppeteerConfig) }
        & npx.cmd @cliArguments
        if ($LASTEXITCODE -ne 0) { throw "Mermaid export failed: $diagramName" }
        $svg = [IO.File]::ReadAllText((Join-Path $articleDirectory "images/$diagramName.svg"))
        if ($svg -match 'Maximum text size in diagram exceeded|Syntax error in text') {
            throw "Mermaid produced an error diagram: $diagramName"
        }
        if ($diagramName -eq 'bot-capabilities' -and $svg -notmatch 'data:image/png;base64,') {
            throw 'Character image is missing from the capabilities diagram.'
        }
    }
} finally {
    # Delete only this run's known generated inputs, never a recursive directory target.
    foreach ($diagramName in @('bot-capabilities', 'async-queue', 'execution-loop', 'agent-architecture')) {
        $inputPath = Join-Path $renderDirectory "$diagramName.mmd"
        if (Test-Path -LiteralPath $inputPath) { Remove-Item -LiteralPath $inputPath }
    }
    Remove-Item -LiteralPath $renderDirectory
}
