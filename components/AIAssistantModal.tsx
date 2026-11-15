"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Invoice, CompanyProfile, Client } from "@/lib/mock-data";
import { formatFCFA, calculateTotals } from "@/lib/money";
import { parseInvoiceWithAI, AIParsedInvoiceResult } from "@/lib/ai-invoice-parser";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import {
  IconClose,
  IconDownload,
  IconEye,
  IconMicrophone,
  IconSearch,
  IconCheck,
} from "./Icons";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  generatedResult?: AIParsedInvoiceResult;
  imagePreviewUrl?: string;
  fileName?: string;
}

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCompany: CompanyProfile;
  clients?: Client[];
  invoices?: Invoice[];
  onSaveGeneratedInvoice: (invoice: Invoice, newClient?: Client) => void;
  onOpenInEditor?: (invoice: Invoice, newClient?: Client) => void;
  onSelectInvoice?: (invoice: Invoice) => void;
  onShareWhatsApp?: (invoice: Invoice) => void;
}


// ── SOUS-ÉCHANTILLONNEUR AUDIO HAUTE FIDÉLITÉ (Conversion du taux système 44.1/48kHz vers 16kHz) ──
function downsampleBuffer(
  buffer: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number = 16000
): Float32Array {
  if (inputSampleRate === outputSampleRate) {
    return buffer;
  }
  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

// ── ENCODEUR PCM AUDIO WAV PUR (16kHz 16-bit Mono pour transcription vocale) ──
function encodeWAV(samples: Float32Array, sampleRate: number = 16000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // format 1 = PCM
  view.setUint16(22, 1, true); // 1 canal = mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); // 16 bits
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([view], { type: "audio/wav" });
}

export default function AIAssistantModal({
  isOpen,
  onClose,
  activeCompany,
  clients = [],
  invoices = [],
  onSaveGeneratedInvoice,
  onOpenInEditor,
  onSelectInvoice,
}: AIAssistantModalProps) {
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  // État pour le menu de choix d'importation (Extérieur vs Intérieur)
  const [showImportMenu, setShowImportMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // État pour la sélection d'une facture similaire à importer de l'intérieur
  const [showSimilarPicker, setShowSimilarPicker] = useState(false);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
  const [selectedBaseInvoice, setSelectedBaseInvoice] = useState<Invoice | null>(null);
  const [targetClientName, setTargetClientName] = useState("");
  const [isTargetNewClient, setIsTargetNewClient] = useState(false);

  // Enregistrement manuel des factures (NE PAS enregistrer automatiquement)
  const [savedInvoiceIds, setSavedInvoiceIds] = useState<Set<string>>(new Set());

  // États pour la copie dans le presse-papier ("tu me copies ça aussi")
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Enregistrement audio local & Transcription automatique
  const [isLocalAudioRecording, setIsLocalAudioRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioBuffersRef = useRef<Float32Array[]>([]);
  const sourceSampleRateRef = useRef<number>(44100);
  const timerIntervalRef = useRef<any>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Ref pour maintenir l'écoute vocale active en continu même après de courtes pauses
  const isListeningActiveRef = useRef(false);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // ── NOUVELLE CONVERSATION STYLE CHATGPT / CLAUDE ──
  const handleNewChat = () => {
    if (isListening || isLocalAudioRecording) {
      stopUnifiedVoice();
    }
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "bot",
        text: "👋 Nouvelle conversation démarrée. Choisissez un type de facture ci-dessous ou dictez directement au micro :",
        timestamp: "À l'instant",
      },
    ]);
    setInputText("");
    setVoiceFeedback(null);
    setShowImportMenu(false);
    setShowSimilarPicker(false);
    setSelectedBaseInvoice(null);
    setTargetClientName("");
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "👋 Choisissez un type de facture ci-dessous ou dictez directement au micro :",
      timestamp: "À l'instant",
    },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating, isListening, isTranscribing]);

  // Nettoyage des écoutes à la fermeture
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) { }
      }
      if (audioStreamRef.current) {
        try {
          audioStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch (_) { }
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        try {
          audioContextRef.current.close();
        } catch (_) { }
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  if (!isOpen || !mounted) return null;

  // ── ENREGISTREUR AUDIO LOCAL DE SECOURS (WAV 16kHz + API Locale) ──
  const startLocalAudioRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setVoiceFeedback("ℹ️ Microphone non disponible.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      audioStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === "suspended") {
        try {
          await audioCtx.resume();
        } catch (_) {}
      }
      audioContextRef.current = audioCtx;
      sourceSampleRateRef.current = audioCtx.sampleRate || 44100;

      const source = audioCtx.createMediaStreamSource(stream);
      audioSourceRef.current = source;

      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      audioProcessorRef.current = processor;
      audioBuffersRef.current = [];

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        audioBuffersRef.current.push(new Float32Array(inputData));
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      setIsLocalAudioRecording(true);
      setRecordingSeconds(0);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("Local recording error:", err);
      setIsLocalAudioRecording(false);
      setVoiceFeedback("ℹ️ Microphone non accessible.");
    }
  };

  const stopLocalAudioRecording = async () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsLocalAudioRecording(false);

    try {
      if (audioSourceRef.current && audioProcessorRef.current) {
        try {
          audioSourceRef.current.disconnect();
          audioProcessorRef.current.disconnect();
        } catch (_) {}
      }

      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        try {
          await audioContextRef.current.close();
        } catch (_) {}
      }

      if (inputText.trim()) {
        setTimeout(() => textInputRef.current?.focus(), 150);
        return;
      }

      const buffers = audioBuffersRef.current;
      if (!buffers || buffers.length === 0) {
        setVoiceFeedback("ℹ️ Aucune voix captée. Cliquez sur le micro pour réessayer.");
        return;
      }

      const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
      const merged = new Float32Array(totalLength);
      let offset = 0;
      for (const b of buffers) {
        merged.set(b, offset);
        offset += b.length;
      }

      const sourceRate = sourceSampleRateRef.current || 44100;
      const downsampled = downsampleBuffer(merged, sourceRate, 16000);
      const wavBlob = encodeWAV(downsampled, 16000);

      setIsTranscribing(true);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "audio/wav",
        },
        body: wavBlob,
      });

      const data = await response.json();
      setIsTranscribing(false);

      if (data && data.text && data.text.trim()) {
        const text = data.text.trim();
        setInputText(text);
        setVoiceFeedback(`✅ Voix transcrite : « ${text} »`);
        setTimeout(() => textInputRef.current?.focus(), 150);
      } else {
        setVoiceFeedback(null);
      }
    } catch (_) {
      setIsTranscribing(false);
      setVoiceFeedback(null);
    }
  };

  // ── DÉMARRAGE DU VOCAL (Reconnaissance vocale directe en temps réel & continue) ──
  const startUnifiedVoice = () => {
    setVoiceFeedback(null);
    isListeningActiveRef.current = true;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch (_) {}
        }

        const rec = new SpeechRec();
        rec.lang = "fr-FR";
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          setIsListening(true);
          setRecordingSeconds(0);
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = setInterval(() => {
            setRecordingSeconds((prev) => prev + 1);
          }, 1000);
        };

        rec.onresult = (event: any) => {
          let text = "";
          for (let i = 0; i < event.results.length; ++i) {
            text += event.results[i][0].transcript;
          }
          const spoken = text.trim();
          if (spoken) {
            setInputText(spoken);
          }
        };

        rec.onerror = (event: any) => {
          console.warn("SpeechRec error:", event.error);
          if (event.error === "no-speech") {
            // Pause de silence normale : on laisse le microphone continuer
            return;
          }
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            isListeningActiveRef.current = false;
            setIsListening(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setVoiceFeedback("❌ Accès au microphone non autorisé. Vérifiez vos autorisations.");
            return;
          }
          if (event.error === "network") {
            // Si le serveur en ligne de Google est bloqué par le réseau, basculer sur l'audio local
            try { rec.abort(); } catch (_) {}
            startLocalAudioRecording();
          }
        };

        rec.onend = () => {
          // Si l'utilisateur n'a pas arrêté manuellement, Chrome coupe après un silence : on redémarre instantanément !
          if (isListeningActiveRef.current) {
            try {
              rec.start();
            } catch (_) {}
          } else {
            setIsListening(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          }
        };

        recognitionRef.current = rec;
        rec.start();
        return;
      } catch (err) {
        console.warn("Failed to start SpeechRec, falling back:", err);
      }
    }

    startLocalAudioRecording();
  };

  // ── ARRÊT DU VOCAL & VALIDATION DE LA TRANSCRIPTION ──
  const stopUnifiedVoice = async () => {
    isListeningActiveRef.current = false;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    setIsListening(false);

    if (inputText.trim()) {
      setVoiceFeedback(`✅ Voix transcrite : « ${inputText.trim()} »`);
      setTimeout(() => textInputRef.current?.focus(), 150);
    }

    if (isLocalAudioRecording) {
      await stopLocalAudioRecording();
    }
  };

  // ── IMPORTATION D'UNE FACTURE DEPUIS L'EXTÉRIEUR (Photo, Galerie, Scan, Dossier) ──
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const sizeKB = Math.round(file.size / 1024);

      // Nom nettoyé sans extension pour l'analyse intelligente
      const cleanFileName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

      const userMsgId = `usr-file-${Date.now()}`;
      const userMsg: ChatMessage = {
        id: userMsgId,
        sender: "user",
        text: `📸 **Facture importée de l'extérieur (${isImage ? "Photo/Galerie" : "Dossier"})** : \`${file.name}\` (${sizeKB} Ko)`,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        imagePreviewUrl: isImage ? dataUrl : undefined,
        fileName: file.name,
      };

      setMessages((prev) => [...prev, userMsg]);
      setShowImportMenu(false);
      setIsGenerating(true);

      setTimeout(() => {
        const parsed = parseInvoiceWithAI(cleanFileName, activeCompany, clients);

        const botMsgId = `bot-${Date.now()}`;
        const botMsg: ChatMessage = {
          id: botMsgId,
          sender: "bot",
          text: `📸 **Facture importée avec succès depuis votre ${isImage ? "galerie photo" : "dossier"}** (\`${file.name}\`) :\n\n` +
            `• **Client déduit** : ${parsed.invoice.clientName}\n` +
            `• **Montant Brut HT** : ${formatFCFA(parsed.invoice.subtotalHT)}\n` +
            `• **TVA légale & Décomptes OHADA** calculés fidèlement.\n` +
            `🎯 **Net à payer réel** : **${formatFCFA(parsed.invoice.netToPay ?? parsed.invoice.totalTTC)}**\n\n` +
            `Cliquez ci-dessous pour enregistrer, modifier, copier ou exporter en PDF.`,
          timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          generatedResult: parsed,
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsGenerating(false);
      }, 700);
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── COPIER LA FACTURE DANS LE PRESSE-PAPIER (Demande utilisateur : "tu me copies ça aussi") ──
  const handleCopyInvoice = (inv: Invoice) => {
    const lines: string[] = [
      `📄 FACTURE : ${inv.number}`,
      `👤 Client : ${inv.clientName}`,
      inv.object ? `📋 Objet : ${inv.object}` : "",
      `📅 Émission : ${inv.issueDate} | Échéance : ${inv.dueDate}`,
      `💰 Montant Brut HT : ${formatFCFA(inv.subtotalHT)}`,
      inv.discountAmount && inv.discountAmount > 0 ? `🏷️ Remise (${inv.discountPercent}%) : -${formatFCFA(inv.discountAmount)}` : "",
      inv.escompteAmount && inv.escompteAmount > 0 ? `🏷️ Escompte (${inv.escomptePercent}%) : -${formatFCFA(inv.escompteAmount)}` : "",
      inv.advanceAmount && inv.advanceAmount > 0 ? `💵 Avance : -${formatFCFA(inv.advanceAmount)}` : "",
      `🏛️ TVA (${inv.taxRate}%) : +${formatFCFA(inv.taxAmount)}`,
      inv.precompteAmount && inv.precompteAmount > 0 ? `⚖️ Précompte (${inv.precompteRate}%) : -${formatFCFA(inv.precompteAmount)}` : "",
      `🎯 NET À PAYER RÉEL : ${formatFCFA(inv.netToPay ?? inv.totalTTC)}`,
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedInvoiceId(inv.id);
    setTimeout(() => setCopiedInvoiceId(null), 2500);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2500);
  };

  // ── ENVOI D'UN PROMPT TEXTE À L'IA (SANS ENREGISTREMENT AUTOMATIQUE DIRECT) ──
  const handleSendPrompt = (promptText?: string) => {
    if (isListening || isLocalAudioRecording) {
      stopUnifiedVoice();
    }

    const textToSend = (promptText || inputText).trim();
    if (!textToSend || isGenerating) return;

    const userMsgId = `usr-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setVoiceFeedback(null);
    setIsGenerating(true);

    setTimeout(() => {
      const parsed = parseInvoiceWithAI(textToSend, activeCompany, clients);

      const botMsgId = `bot-${Date.now()}`;
      const botMsg: ChatMessage = {
        id: botMsgId,
        sender: "bot",
        text: parsed.summaryText,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        generatedResult: parsed,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsGenerating(false);
    }, 600);
  };

  // ── CRÉER UNE FACTURE SIMILAIRE À PARTIR D'UNE FACTURE EXISTANTE ──
  const handleCreateSimilarInvoice = (baseInv: Invoice, clientName: string) => {
    const cleanClient = clientName.trim() || baseInv.clientName;
    const isNew = !clients.some(
      (c) => c.name.trim().toLowerCase() === cleanClient.toLowerCase()
    );

    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const prefix = baseInv.invoiceType === "avoir" ? "AVOIR" : baseInv.invoiceType === "proforma" ? "PRO" : "FAC";
    const newNumber = `${prefix}-${year}-${rand}`;

    // Cloner fidèlement les lignes et le calcul en cascade
    const clonedItems = (baseInv.items || []).map((it, idx) => ({
      ...it,
      id: `item-clone-${Date.now()}-${idx}`,
    }));

    const totals = calculateTotals(
      clonedItems,
      baseInv.discountPercent || 0,
      baseInv.taxRate ?? 19,
      baseInv.escomptePercent || 0,
      baseInv.advanceAmount || 0,
      baseInv.precompteRate || 0,
      baseInv.consignationAmount || 0,
      baseInv.secondDiscountPercent || 0
    );

    const similarInvoice: Invoice = {
      ...baseInv,
      id: `inv-sim-${Date.now()}-${rand}`,
      number: newNumber,
      clientName: cleanClient,
      clientEmail: isNew ? `${cleanClient.toLowerCase().replace(/[^a-z0-9]/g, "")}@exemple.com` : baseInv.clientEmail,
      clientPhone: isNew ? "+227 90 00 00 00" : baseInv.clientPhone,
      clientCity: baseInv.clientCity || "Niamey",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
      status: "envoyee",
      subtotalHT: totals.rawSubtotalHT,
      discountPercent: totals.discountPercent,
      discountAmount: totals.discountAmount,
      secondDiscountPercent: totals.secondDiscountPercent,
      secondDiscountAmount: totals.secondDiscountAmount,
      netCommercial1: totals.netCommercial1,
      netCommercial: totals.netCommercial,
      escomptePercent: totals.escomptePercent,
      escompteAmount: totals.escompteAmount,
      netFinancier: totals.netFinancier,
      advanceAmount: totals.advanceAmount,
      taxableHT: totals.subtotalHT,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      totalTTC: totals.totalTTC,
      precompteRate: totals.precompteRate,
      precompteAmount: totals.precompteAmount,
      netToPay: totals.netToPay,
      paidAmount: 0,
      items: clonedItems,
    };

    const clientNotice = isNew
      ? `✨ Nouveau client "${cleanClient}" (sera ajouté à votre annuaire CRM lors de l'enregistrement)`
      : `👤 Client existant "${cleanClient}" (aucun doublon ne sera créé)`;

    let detailsText = `📋 **Facture similaire créée à partir de ${baseInv.number}**\n\n`;
    detailsText += `• ${clientNotice}\n`;
    detailsText += `• Objet : ${similarInvoice.object || "Prestation de services"}\n`;
    detailsText += `• Montant Brut HT : ${formatFCFA(totals.rawSubtotalHT)}\n`;
    if (totals.discountAmount > 0) {
      detailsText += `• Remise (${totals.discountPercent}%) : -${formatFCFA(totals.discountAmount)} (➔ Net Commercial : ${formatFCFA(totals.netCommercial)})\n`;
    }
    if (totals.escompteAmount > 0) {
      detailsText += `• Escompte (${totals.escomptePercent}%) : -${formatFCFA(totals.escompteAmount)} (➔ Net Financier : ${formatFCFA(totals.netFinancier)})\n`;
    }
    if (totals.advanceAmount > 0) {
      detailsText += `• Avance déduite : -${formatFCFA(totals.advanceAmount)}\n`;
    }
    detailsText += `• TVA légale (${totals.taxRate}%) : +${formatFCFA(totals.taxAmount)}\n`;
    detailsText += `• Montant TTC : ${formatFCFA(totals.totalTTC)}\n`;
    if (totals.precompteAmount > 0) {
      detailsText += `• Précompte (${totals.precompteRate}%) : -${formatFCFA(totals.precompteAmount)}\n`;
    }
    detailsText += `\n🎯 **NET À PAYER RÉEL : ${formatFCFA(totals.netToPay)}**\n\nCliquez sur « 💾 Enregistrer la facture » ci-dessous pour confirmer.`;

    const parsedResult: AIParsedInvoiceResult = {
      invoice: similarInvoice,
      confidence: 1.0,
      extractedClient: cleanClient,
      isNewClient: isNew,
      extractedAmount: totals.netToPay,
      extractedObject: similarInvoice.object || "",
      extractedType: similarInvoice.invoiceType || "doit",
      discountPercent: totals.discountPercent,
      secondDiscountPercent: totals.secondDiscountPercent,
      escomptePercent: totals.escomptePercent,
      advanceAmount: totals.advanceAmount,
      taxRate: totals.taxRate,
      precompteRate: totals.precompteRate,
      summaryText: detailsText,
    };

    const botMsgId = `bot-${Date.now()}`;
    const botMsg: ChatMessage = {
      id: botMsgId,
      sender: "bot",
      text: detailsText,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      generatedResult: parsedResult,
    };

    setMessages((prev) => [...prev, botMsg]);
    setShowSimilarPicker(false);
    setSelectedBaseInvoice(null);
    setTargetClientName("");
  };

  // Sauvegarde manuelle d'une facture générée
  const handleManualSave = (invoice: Invoice, newClient?: Client) => {
    onSaveGeneratedInvoice(invoice, newClient);
    setSavedInvoiceIds((prev) => new Set(prev).add(invoice.id));
  };

  // Liste filtrée des factures pour l'import similaire
  const filteredInvoices = invoices.filter((inv) => {
    if (!invoiceSearchQuery.trim()) return true;
    const q = invoiceSearchQuery.toLowerCase();
    return (
      inv.number.toLowerCase().includes(q) ||
      inv.clientName.toLowerCase().includes(q) ||
      (inv.object && inv.object.toLowerCase().includes(q))
    );
  });

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      {/* Fond obscurci */}
      <div
        className="fixed inset-0 bg-[#0c111d]/75 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (isListening || isLocalAudioRecording) {
            stopUnifiedVoice();
          }
          onClose();
        }}
      />

      {/* Boîte de dialogue Assistant IA - Spacieuse style ChatGPT / Claude (max-w-4xl) */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#e8e7e2] overflow-hidden flex flex-col h-[90vh] sm:h-[88vh] z-10">
        {/* En-tête de l'Agent IA */}
        <div className="px-5 py-3.5 bg-[#111522] text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ffdc45] text-[#111522] flex items-center justify-center shadow-md shadow-[#ffdc45]/20 text-lg font-bold">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-medium text-base sm:text-lg tracking-tight text-white">
                  Assistant IA AMOMD — Vocal &amp; Facturation
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#ffdc45]/15 text-[#ffdc45] border border-[#ffdc45]/30">
                  Actif
                </span>
                {isListening && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                    🎙️ Écoute
                  </span>
                )}
                {isLocalAudioRecording && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white animate-pulse">
                    🔴 Enregistrement {recordingSeconds}s
                  </span>
                )}
              </div>
              <p className="text-xs text-[#c4c7d1] mt-0.5">
                Dictez au micro, écrivez ou importez une facture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton Nouvelle conversation comme ChatGPT / Claude */}
            <button
              type="button"
              onClick={handleNewChat}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[#e5e6ea] hover:text-white border border-white/15 hover:border-[#ffdc45]/50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              title="Nouvelle conversation (comme ChatGPT ou Claude)"
            >
              <span className="text-[#ffdc45] font-extrabold text-sm">+</span>
              <span className="hidden sm:inline">Nouveau chat</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isListening || isLocalAudioRecording) {
                  stopUnifiedVoice();
                }
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-600 text-[#c4c7d1] hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Fermer"
            >
              <IconClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal / Tiroir : Importer une facture similaire */}
        {showSimilarPicker && (
          <div className="p-4 bg-[#111522] text-white border-b border-white/10 animate-fade-in space-y-3 max-h-[50vh] overflow-y-auto modal-scrollbar">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <span>📋</span>
                  <span>Sélectionnez une facture à dupliquer / imiter :</span>
                </h4>
                <p className="text-[11px] text-[#9096a5] mt-0.5">
                  L&apos;IA reprendra les lignes, montants et réductions en cascade pour un autre client.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSimilarPicker(false);
                  setSelectedBaseInvoice(null);
                }}
                className="text-xs text-[#c4c7d1] hover:text-white px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer"
              >
                Fermer
              </button>
            </div>

            {/* Si aucune facture n'est encore sélectionnée : afficher la liste */}
            {!selectedBaseInvoice ? (
              <div className="space-y-2">
                <div className="relative">
                  <IconSearch className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#9096a5]" />
                  <input
                    type="text"
                    value={invoiceSearchQuery}
                    onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                    placeholder="Rechercher par N° facture, client ou objet..."
                    className="w-full pl-8 pr-3 py-2 bg-[#191f30] border border-white/10 rounded-xl text-xs text-white placeholder-[#9096a5] focus:outline-none focus:border-[#ffdc45]"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 modal-scrollbar">
                  {filteredInvoices.length === 0 ? (
                    <p className="text-xs text-[#9096a5] p-3 text-center">
                      Aucune facture trouvée pour &quot;{invoiceSearchQuery}&quot;.
                    </p>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        onClick={() => {
                          setSelectedBaseInvoice(inv);
                          setTargetClientName(inv.clientName);
                        }}
                        className="p-2.5 bg-[#191f30] hover:bg-[#1f273d] border border-white/10 hover:border-[#ffdc45]/50 rounded-xl flex items-center justify-between text-xs transition cursor-pointer"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-mono font-bold text-white flex items-center gap-2">
                            <span>{inv.number}</span>
                            <span className="text-[10px] font-normal text-[#9096a5]">
                              · {inv.clientName}
                            </span>
                          </div>
                          {inv.object && (
                            <p className="text-[11px] text-[#9096a5] truncate mt-0.5">
                              {inv.object}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-[#ffdc45]">
                            {formatFCFA(inv.netToPay ?? inv.totalTTC)}
                          </span>
                          <span className="block text-[9px] text-[#9096a5]">
                            {inv.items?.length || 1} prestation(s)
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Facture sélectionnée : Choix du client de destination */
              <div className="p-3.5 bg-[#191f30] rounded-2xl border border-[#ffdc45]/40 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-[#9096a5]">Modèle source : </span>
                    <strong className="font-mono text-[#ffdc45]">{selectedBaseInvoice.number}</strong>
                    <span className="text-[#9096a5]"> ({formatFCFA(selectedBaseInvoice.netToPay ?? selectedBaseInvoice.totalTTC)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBaseInvoice(null)}
                    className="text-[11px] text-[#c4c7d1] hover:text-white underline cursor-pointer"
                  >
                    Changer de modèle
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#e5e6ea] mb-1">
                    Pour quel client émettre cette facture similaire ?
                  </label>
                  <input
                    type="text"
                    value={targetClientName}
                    onChange={(e) => setTargetClientName(e.target.value)}
                    placeholder="Tapez le nom du client (ex : Société STS, M. Ibrahim...)"
                    className="w-full px-3 py-2 bg-[#111522] border border-white/15 rounded-xl text-xs text-white placeholder-[#808392] focus:outline-none focus:border-[#ffdc45] font-bold"
                  />
                  <div className="mt-1 flex items-center justify-between text-[10px] text-[#9096a5]">
                    <span>
                      {clients.some((c) => c.name.toLowerCase() === targetClientName.trim().toLowerCase()) ? (
                        <span className="text-[#b9dfc8] font-bold">✓ Client existant dans l&apos;annuaire</span>
                      ) : targetClientName.trim() ? (
                        <span className="text-[#ffdc45] font-bold">✨ Nouveau client (sera ajouté à l&apos;annuaire)</span>
                      ) : (
                        <span>Sélectionnez ou tapez un nom</span>
                      )}
                    </span>
                    {clients.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {clients.slice(0, 3).map((cl) => (
                          <button
                            key={cl.id}
                            type="button"
                            onClick={() => setTargetClientName(cl.name)}
                            className="text-[9.5px] px-1.5 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[#e5e6ea] cursor-pointer"
                          >
                            {cl.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedBaseInvoice(null)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-[#e5e6ea] cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleCreateSimilarInvoice(selectedBaseInvoice, targetClientName)
                    }
                    disabled={!targetClientName.trim()}
                    className="px-3.5 py-1.5 rounded-xl bg-[#ffdc45] hover:bg-[#ffe879] disabled:opacity-50 text-[#111522] text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>⚡ Générer la facture similaire</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Zone des messages de conversation */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#f8f7f3] modal-scrollbar">
          {/* Liste des messages */}
          {messages.map((m) => {
            const isSaved = m.generatedResult ? savedInvoiceIds.has(m.generatedResult.invoice.id) : false;
            const isClientAlreadyKnown = m.generatedResult
              ? clients.some((c) => c.name.toLowerCase().trim() === m.generatedResult!.invoice.clientName.toLowerCase().trim())
              : false;

            return (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"} space-y-1`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed ${m.sender === "user"
                      ? "bg-[#111522] text-white rounded-br-xs shadow-md"
                      : "bg-white text-[#111522] rounded-bl-xs border border-[#e8e7e2] shadow-sm"
                    }`}
                >
                  {/* Prévisualisation de l'image si importée de l'extérieur */}
                  {m.imagePreviewUrl && (
                    <div className="mb-2.5 rounded-xl overflow-hidden border border-white/15 max-w-[220px] shadow-sm">
                      <img
                        src={m.imagePreviewUrl}
                        alt={m.fileName || "Facture importée"}
                        className="w-full h-auto object-cover max-h-48"
                      />
                    </div>
                  )}

                  <div className="whitespace-pre-line font-sans">{m.text}</div>

                  {/* Bouton Copier le texte du message bot ("tu me copies ça aussi") */}
                  {m.sender === "bot" && m.id !== "welcome" && (
                    <div className="mt-2 pt-2 border-t border-[#edece6] flex items-center justify-end text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleCopyText(m.id, m.text)}
                        className="text-[#697080] hover:text-[#111522] font-semibold flex items-center gap-1 transition cursor-pointer"
                        title="Copier ce texte dans le presse-papier"
                      >
                        <span>{copiedMessageId === m.id ? "✓ Texte copié !" : "📋 Copier le texte"}</span>
                      </button>
                    </div>
                  )}

                  {/* Carte interactive si une facture a été générée */}
                  {m.generatedResult && (
                    <div className="mt-3.5 pt-3.5 border-t border-[#edece6] space-y-2.5">
                      {/* Badge d'indication sur le client */}
                      <div className="flex items-center justify-between text-[10.5px] p-2 rounded-xl bg-[#f8f7f3] border border-[#e8e7e2]">
                        <div className="flex items-center gap-1.5 font-bold">
                          {isClientAlreadyKnown ? (
                            <span className="text-[#111522] flex items-center gap-1">
                              <span>👤</span>
                              <span>Client existant : <strong>{m.generatedResult.invoice.clientName}</strong> (aucun doublon)</span>
                            </span>
                          ) : (
                            <span className="text-[#453700] flex items-center gap-1">
                              <span>✨</span>
                              <span>Nouveau client : <strong>{m.generatedResult.invoice.clientName}</strong> (sera ajouté au CRM)</span>
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-[#111522]">
                          {formatFCFA(m.generatedResult.invoice.netToPay ?? 0)}
                        </span>
                      </div>

                      {/* Boutons d'action clairs */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {/* 1. Bouton Enregistrer (Validation manuelle explicite) */}
                        <button
                          type="button"
                          onClick={() =>
                            handleManualSave(
                              m.generatedResult!.invoice,
                              m.generatedResult?.isNewClient ? m.generatedResult?.newClientRecord : undefined
                            )
                          }
                          disabled={isSaved}
                          className={`px-2 py-2 rounded-xl font-extrabold text-[11px] transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${isSaved
                              ? "bg-[#d9f0df] text-[#285b35] border border-[#b9dfc8] cursor-default"
                              : "bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] shadow-md shadow-[#ffdc45]/15"
                            }`}
                          title={isSaved ? "Cette facture est déjà enregistrée" : "Enregistrer cette facture dans vos données"}
                        >
                          {isSaved ? (
                            <>
                              <IconCheck className="w-3.5 h-3.5 text-[#285b35]" />
                              <span>Enregistrée</span>
                            </>
                          ) : (
                            <>
                              <span>💾</span>
                              <span>Enregistrer</span>
                            </>
                          )}
                        </button>

                        {/* 2. Bouton Modifier dans l'éditeur */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenInEditor) {
                              onOpenInEditor(
                                m.generatedResult!.invoice,
                                m.generatedResult?.isNewClient ? m.generatedResult?.newClientRecord : undefined
                              );
                              onClose();
                            }
                          }}
                          className="px-2 py-2 rounded-xl bg-white hover:bg-[#f2f0e8] text-[#111522] font-bold text-[11px] border border-[#e4e2d9] transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                          title="Ouvrir dans le formulaire pour ajuster les champs"
                        >
                          <span>✏️ Modifier</span>
                        </button>

                        {/* 3. Télécharger PDF A4 */}
                        <button
                          type="button"
                          onClick={() => downloadInvoicePdf(m.generatedResult!.invoice, activeCompany)}
                          className="px-2 py-2 rounded-xl bg-[#111522] hover:bg-[#191f30] text-[#ffdc45] font-bold text-[11px] border border-[#111522] transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                          title="Télécharger le PDF A4 officiel"
                        >
                          <IconDownload className="w-3.5 h-3.5" />
                          <span>PDF A4</span>
                        </button>

                        {/* 4. Bouton Copier la facture (Demande expresse utilisateur : "tu me copies ça aussi") */}
                        <button
                          type="button"
                          onClick={() => handleCopyInvoice(m.generatedResult!.invoice)}
                          className="px-2 py-2 rounded-xl bg-[#fff0a6] hover:bg-[#ffdc45] text-[#453700] font-bold text-[11px] border border-[#ffe36a] transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                          title="Copier les données de la facture dans le presse-papier"
                        >
                          <span>{copiedInvoiceId === m.generatedResult!.invoice.id ? "✓ Copié !" : "📋 Copier"}</span>
                        </button>

                        {/* 5. Aperçu */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectInvoice) {
                              onSelectInvoice(m.generatedResult!.invoice);
                              onClose();
                            }
                          }}
                          className="px-2 py-2 rounded-xl bg-[#f2f0e8] hover:bg-[#e8e7e2] text-[#111522] font-bold text-[10.5px] border border-[#e4e2d9] transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                          title="Afficher l'aperçu complet de la facture"
                        >
                          <IconEye className="w-3.5 h-3.5 text-[#5f6571]" />
                          <span>Aperçu</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-[#808392] px-1 font-mono">{m.timestamp}</span>
              </div>
            );
          })}

          {/* Animation pendant la génération */}
          {isGenerating && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-white border border-[#e8e7e2] text-xs text-[#5f6571] animate-pulse w-fit">
              <span className="w-2 h-2 rounded-full bg-[#ffdc45] animate-ping" />
              <span>Calcul en cascade des déductions et génération de la facture...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message de statut vocal avec confirmation & bouton rapide de génération */}
        {!isListening && !isLocalAudioRecording && !isTranscribing && voiceFeedback && (
          <div className="px-4 py-2 bg-[#111522] border-t border-white/10 text-xs text-[#e5e6ea] flex items-center justify-between animate-fade-in">
            <span className="truncate font-medium">{voiceFeedback}</span>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {inputText.trim() && (
                <button
                  type="button"
                  onClick={() => handleSendPrompt()}
                  className="px-2.5 py-1 bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] rounded-lg text-[11px] font-extrabold transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <span>⚡ Générer</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setVoiceFeedback(null)}
                className="text-[#9096a5] hover:text-white font-bold cursor-pointer px-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Barre de saisie style ChatGPT / Claude (Spacieuse, bouton +, champ input toujours présent, micro & 3 boutons) */}
        <div className="p-3.5 sm:p-4 bg-[#0c111d] border-t border-white/10 relative shrink-0">
          {/* Backdrop pour fermer le menu + au clic à l'extérieur */}
          {showImportMenu && (
            <div
              className="fixed inset-0 z-20"
              onClick={() => setShowImportMenu(false)}
            />
          )}

          {/* Menu flottant déclenché par le bouton + (Style ChatGPT/Claude) */}
          {showImportMenu && (
            <div className="absolute bottom-24 left-4 z-30 bg-[#111522] border border-white/15 rounded-2xl shadow-2xl p-2 w-72 sm:w-80 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="text-[10px] font-extrabold text-[#9096a5] px-3 py-1.5 uppercase tracking-wider border-b border-white/10 mb-1">
                Actions &amp; Importation
              </div>

              {/* 1. Nouvelle conversation */}
              <button
                type="button"
                onClick={handleNewChat}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-[#ffdc45]/15 text-[#ffdc45] flex items-center justify-center font-extrabold text-sm group-hover:scale-105 transition-transform shrink-0">
                  +
                </div>
                <div>
                  <div className="font-bold text-white group-hover:text-[#ffdc45]">Nouvelle conversation</div>
                  <div className="text-[10px] text-[#9096a5]">Démarrer un nouveau chat comme ChatGPT</div>
                </div>
              </button>

              {/* 2. Importer de l'extérieur */}
              <button
                type="button"
                onClick={() => {
                  setShowImportMenu(false);
                  fileInputRef.current?.click();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer group mt-0.5"
              >
                <div className="w-7 h-7 rounded-lg bg-[#c9d4ff]/15 text-[#c9d4ff] flex items-center justify-center text-sm group-hover:scale-105 transition-transform shrink-0">
                  📸
                </div>
                <div>
                  <div className="font-bold text-white group-hover:text-[#c9d4ff]">Importer de l&apos;extérieur</div>
                  <div className="text-[10px] text-[#9096a5]">Galerie photos, scan, image ou dossier</div>
                </div>
              </button>

              {/* 3. Importer de l'intérieur */}
              <button
                type="button"
                onClick={() => {
                  setShowImportMenu(false);
                  setShowSimilarPicker(true);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer group mt-0.5"
              >
                <div className="w-7 h-7 rounded-lg bg-[#b9dfc8]/15 text-[#b9dfc8] flex items-center justify-center text-sm group-hover:scale-105 transition-transform shrink-0">
                  📋
                </div>
                <div>
                  <div className="font-bold text-white group-hover:text-[#b9dfc8]">Importer de l&apos;intérieur</div>
                  <div className="text-[10px] text-[#9096a5]">Dupliquer une facture de votre base</div>
                </div>
              </button>
            </div>
          )}

          {/* Input fichier caché pour importer de l'extérieur */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,application/pdf"
            className="hidden"
          />

          {/* Bandeau d'écoute active (si enregistrement en cours) avec bouton Arrêter visible */}
          {(isListening || isLocalAudioRecording) && (
            <div className="mb-2 px-3.5 py-2 rounded-2xl bg-rose-950/70 border border-rose-500/40 flex items-center justify-between text-xs animate-fade-in shadow-inner">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
                <span className="font-bold text-rose-300">
                  🎙️ Dictée vocale active {recordingSeconds > 0 ? `(${recordingSeconds}s)` : ""}
                </span>
                <span className="text-[11px] text-[#c4c7d1] hidden sm:inline">
                  — Parlez naturellement, la transcription s&apos;écrit ci-dessous
                </span>
              </div>
              <button
                type="button"
                onClick={stopUnifiedVoice}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold transition active:scale-95 cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <span>⏹️</span>
                <span>Arrêter</span>
              </button>
            </div>
          )}

          {/* Capsule d'entrée unifiée inspirée de ChatGPT - Champ toujours présent et spacieux */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="relative flex items-center bg-[#111522] border border-white/15 rounded-full px-2.5 py-2 shadow-lg gap-2"
          >
            {/* Bouton + rond style ChatGPT */}
            <button
              type="button"
              onClick={() => setShowImportMenu((prev) => !prev)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-[#e5e6ea] hover:text-white flex items-center justify-center font-bold text-lg cursor-pointer transition active:scale-95 shrink-0"
              title="Nouvelle conversation ou importer une facture"
            >
              <span className="leading-none">{showImportMenu ? "✕" : "+"}</span>
            </button>

            {/* Le champ <input> est TOUJOURS visible et spacieux */}
            <input
              ref={textInputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isListening || isLocalAudioRecording
                  ? "🎙️ Écoute active... parlez, vos paroles s'inscrivent ici"
                  : isTranscribing
                  ? "Transcription audio en cours..."
                  : "Ask AMOMD IA ou dictez : « Facture Salifou 1 500 000 FCFA »..."
              }
              className="flex-1 bg-transparent text-white placeholder-[#808392] text-xs sm:text-sm px-2 focus:outline-none min-w-0"
              disabled={isGenerating || isTranscribing}
            />

            {/* Bouton Microphone */}
            <button
              type="button"
              onClick={() => {
                if (isListening || isLocalAudioRecording) {
                  stopUnifiedVoice();
                } else {
                  startUnifiedVoice();
                }
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0 ${
                isListening || isLocalAudioRecording
                  ? "bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/40"
                  : isTranscribing
                  ? "bg-[#ffdc45]/20 text-[#ffdc45]"
                  : "bg-white/10 hover:bg-white/20 text-[#e5e6ea] hover:text-white"
              }`}
              title={
                isListening || isLocalAudioRecording
                  ? "Arrêter la dictée"
                  : "Dicter au micro (Transcription automatique)"
              }
              disabled={isTranscribing || isGenerating}
            >
              <IconMicrophone className="w-4 h-4" />
            </button>

            {/* Bouton Envoyer / Générer rond style ChatGPT */}
            <button
              type="submit"
              disabled={!inputText.trim() || isGenerating || isTranscribing}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition active:scale-95 cursor-pointer shrink-0 ${
                inputText.trim() && !isGenerating && !isTranscribing
                  ? "bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] shadow-md shadow-[#ffdc45]/30"
                  : "bg-white/5 text-[#697080] cursor-not-allowed"
              }`}
              title="Générer la facture"
            >
              <span className="leading-none text-base">⚡</span>
            </button>
          </form>

          {/* Uniquement les 3 types de factures demandés : Facture de Doit, Facture d'Avoir, Facture Proforma */}
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setInputText("Facture de Doit pour ");
                setTimeout(() => textInputRef.current?.focus(), 100);
              }}
              className="py-2.5 px-3 rounded-2xl bg-[#111522] hover:bg-[#191f30] text-[#b9dfc8] border border-[#b9dfc8]/30 text-xs font-bold transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              title="Créer une Facture de Doit"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#b9dfc8] shrink-0" />
              <span className="truncate">Facture de Doit</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInputText("Facture d'Avoir pour ");
                setTimeout(() => textInputRef.current?.focus(), 100);
              }}
              className="py-2.5 px-3 rounded-2xl bg-[#111522] hover:bg-[#191f30] text-[#c9d4ff] border border-[#c9d4ff]/30 text-xs font-bold transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              title="Créer une Facture d'Avoir"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#c9d4ff] shrink-0" />
              <span className="truncate">Facture d&apos;Avoir</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInputText("Facture Proforma pour ");
                setTimeout(() => textInputRef.current?.focus(), 100);
              }}
              className="py-2.5 px-3 rounded-2xl bg-[#111522] hover:bg-[#191f30] text-[#ffdc45] border border-[#ffdc45]/30 text-xs font-bold transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              title="Créer une Facture Proforma"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffdc45] shrink-0" />
              <span className="truncate">Facture Proforma</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
