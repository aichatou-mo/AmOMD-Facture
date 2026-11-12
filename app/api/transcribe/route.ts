import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let tempFilePath = "";
  try {
    let buffer: Buffer | null = null;
    const contentType = (req.headers.get("content-type") || "").toLowerCase();

    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      try {
        const formData = await req.formData();
        const audioBlob = formData.get("audio") as Blob | null;
        if (audioBlob) {
          buffer = Buffer.from(await audioBlob.arrayBuffer());
        }
      } catch (_) {
        // Fallback to arrayBuffer if formData parser fails
      }
    } else if (contentType.includes("application/json")) {
      try {
        const json = await req.json();
        const b64 = json.audio || json.audioBase64 || "";
        if (b64) {
          buffer = Buffer.from(b64.replace(/^data:audio\/\w+;base64,/, ""), "base64");
        }
      } catch (_) {}
    }

    if (!buffer || buffer.length === 0) {
      try {
        const arrayBuf = await req.arrayBuffer();
        if (arrayBuf && arrayBuf.byteLength > 0) {
          buffer = Buffer.from(arrayBuf);
        }
      } catch (_) {}
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ success: false, text: "", error: "Aucun flux audio reçu" }, { status: 200 });
    }

    const tempDir = os.tmpdir();
    const tempId = `izivoice_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    tempFilePath = path.join(tempDir, `${tempId}.wav`);

    fs.writeFileSync(tempFilePath, buffer);

    const safePath = tempFilePath.replace(/'/g, "''");
    const psScript = `
Add-Type -AssemblyName System.Speech
try {
  $culture = New-Object System.Globalization.CultureInfo('fr-FR')
  $r = New-Object System.Speech.Recognition.SpeechRecognitionEngine($culture)
  $r.SetInputToWaveFile('${safePath}')
  $grammar = New-Object System.Speech.Recognition.DictationGrammar
  $r.LoadGrammar($grammar)
  $res = $r.Recognize([TimeSpan]::FromSeconds(8))
  $text = ""
  if ($res -and $res.Text) {
    $text = $res.Text
  }
  $r.Dispose()
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
  Write-Output $text
} catch {
  Write-Output ""
}
`.trim();

    const encoded = Buffer.from(psScript, "utf16le").toString("base64");

    const transcribed = await new Promise<string>((resolve) => {
      exec(
        `powershell.exe -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
        { timeout: 12000, encoding: "utf8" },
        (error, stdout) => {
          if (error) {
            console.warn("Transcription PowerShell error:", error);
            resolve("");
          } else {
            resolve((stdout || "").trim());
          }
        }
      );
    });

    return NextResponse.json({
      success: true,
      text: transcribed,
    });
  } catch (err: any) {
    console.warn("Transcribe API handled error:", err?.message || err);
    return NextResponse.json({ success: false, text: "", error: err?.message || "Erreur" }, { status: 200 });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (_) {}
    }
  }
}
