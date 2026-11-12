"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Client } from "@/lib/mock-data";
import { formatFCFA } from "@/lib/money";
import {
  IconSearch,
  IconPlus,
  IconTrash,
  IconClose,
  IconEye,
  IconWhatsApp,
} from "./Icons";
import ConfirmDialog from "./ConfirmDialog";
import { useTranslation } from "@/lib/i18n";

export interface ExtendedClient extends Client {
  nif?: string;
  whatsapp?: string;
}

interface ClientsPageProps {
  clients: Client[];
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onCreateInvoiceForClient: (client: Client) => void;
  globalSearchQuery?: string;
}

export default function ClientsPage({
  clients,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onCreateInvoiceForClient,
  globalSearchQuery = "",
}: ClientsPageProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ExtendedClient | null>(null);
  const [viewingClient, setViewingClient] = useState<ExtendedClient | null>(null);
  const [clientToDelete, setClientToDelete] = useState<ExtendedClient | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{
    client: ExtendedClient;
    top: number;
    right: number;
  } | null>(null);
  const clientMenuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isModalOpen || viewingClient) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen, viewingClient]);

  useEffect(() => {
    if (!menuAnchor) return;
    const handleOutside = (e: MouseEvent) => {
      if (clientMenuRef.current && !clientMenuRef.current.contains(e.target as Node)) {
        setMenuAnchor(null);
      }
    };
    const handleClose = () => setMenuAnchor(null);
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
    };
  }, [menuAnchor]);

  // Form State
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Niger");
  const [nif, setNif] = useState("");

  const openAddModal = () => {
    setEditingClient(null);
    setName("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setWhatsapp("");
    setAddress("");
    setCity("");
    setCountry("Niger");
    setNif("");
    setIsModalOpen(true);
  };

  const openEditModal = (client: ExtendedClient) => {
    setEditingClient(client);
    setName(client.name);
    setContactPerson(client.contactPerson || "");
    setEmail(client.email || "");
    setPhone(client.phone || "");
    setWhatsapp(client.whatsapp || "");
    setAddress(client.address || "");
    setCity(client.city || "");
    setCountry(client.country || "Niger");
    setNif(client.nif || "");
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingClient) {
      const updated: ExtendedClient = {
        ...editingClient,
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim(),
        country: country.trim() || "Niger",
        nif: nif.trim() || undefined,
      };
      onUpdateClient(updated);
    } else {
      const newClient: ExtendedClient = {
        id: `cl-${Date.now()}`,
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim(),
        country: country.trim() || "Niger",
        totalBilled: 0,
        invoicesCount: 0,
        nif: nif.trim() || undefined,
      };
      onAddClient(newClient);
    }

    setIsModalOpen(false);
  };

  const effectiveQuery = (searchQuery || globalSearchQuery || "").trim().toLowerCase();

  const filteredClients = (clients as ExtendedClient[]).filter((c) => {
    if (!effectiveQuery) return true;
    return (
      c.name.toLowerCase().includes(effectiveQuery) ||
      (c.contactPerson || "").toLowerCase().includes(effectiveQuery) ||
      (c.city || "").toLowerCase().includes(effectiveQuery) ||
      (c.country || "").toLowerCase().includes(effectiveQuery) ||
      (c.phone || "").toLowerCase().includes(effectiveQuery) ||
      (c.email || "").toLowerCase().includes(effectiveQuery) ||
      (c.address || "").toLowerCase().includes(effectiveQuery) ||
      (c.nif || "").toLowerCase().includes(effectiveQuery)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedClients = filteredClients.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, globalSearchQuery]);

  const handleToggleMenu = (e: React.MouseEvent<HTMLButtonElement>, client: ExtendedClient) => {
    e.stopPropagation();
    if (menuAnchor?.client.id === client.id) {
      setMenuAnchor(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuHeight = 190;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < menuHeight + 16 && rect.top > menuHeight + 16;
      const calculatedTop = openUp ? rect.top - menuHeight - 6 : rect.bottom + 6;
      const safeTop = Math.max(12, Math.min(calculatedTop, window.innerHeight - menuHeight - 12));
      const safeRight = Math.max(12, window.innerWidth - rect.right);

      setMenuAnchor({ client, top: safeTop, right: safeRight });
    }
  };

  const openWhatsAppChat = (rawPhone?: string) => {
    if (!rawPhone) return;
    const digits = rawPhone.replace(/[^0-9]/g, "");
    if (!digits) return;
    window.open(`https://wa.me/${digits}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 pt-1">
      {/* En-tête lumineux */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.clientsDirectory || t.clients || "Clients"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t.clientsSubtitle || "Répertoire complet de vos clients, coordonnées et volume facturé."}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-slate-900/15 transition-all duration-150 active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <IconPlus className="w-4 h-4 text-emerald-400" />
          <span>{t.newClient || "Ajouter un client"}</span>
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <IconSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t.searchClientPlaceholder || "Rechercher par nom, contact, NIF, téléphone, ville..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition"
          />
        </div>
        <span className="text-xs font-mono font-semibold text-slate-500">
          {filteredClients.length} client(s)
        </span>
      </div>

      {/* Tableau complet et aéré */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_-8px_rgba(15,23,42,0.04)] overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="p-14 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/70 text-slate-400 flex items-center justify-center mx-auto text-xl">
              👥
            </div>
            <h4 className="font-bold text-slate-800 text-sm">Aucun client enregistré</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Ajoutez votre premier client pour retrouver toutes ses coordonnées lors de la création de vos factures.
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition active:scale-95"
            >
              <IconPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.newClient || "Ajouter un client"}</span>
            </button>
          </div>
        ) : (
          <>
            {/* Vue Desktop complète */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-500 font-semibold border-b border-slate-100 bg-slate-50/60 text-[11px] uppercase tracking-wider">
                    <th className="py-4 pl-6 pr-3">{t.clientNameCol || "Client & Contact"}</th>
                    <th className="py-4 px-3">{t.clientNifLabel || "NIF"}</th>
                    <th className="py-4 px-3">Téléphone & Email</th>
                    <th className="py-4 px-3">Ville & Adresse</th>
                    <th className="py-4 pl-2 pr-6 text-right w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedClients.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => setViewingClient(client)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold text-xs flex items-center justify-center shrink-0">
                            {client.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                              {client.name}
                            </p>
                            {client.contactPerson && (
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {client.contactPerson}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-3 whitespace-nowrap">
                        {client.nif && client.nif.trim() ? (
                          <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                            {client.nif}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-xs">—</span>
                        )}
                      </td>

                      <td className="py-4 px-3">
                        <div className="space-y-0.5">
                          {client.phone ? (
                            <p className="font-mono font-semibold text-slate-800 text-xs">
                              {client.phone}
                            </p>
                          ) : null}
                          {client.email ? (
                            <p className="text-[11px] text-slate-500 break-all">
                              {client.email}
                            </p>
                          ) : null}
                          {!client.phone && !client.email && (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-3">
                        <div className="space-y-0.5">
                          {client.city || client.country ? (
                            <p className="font-semibold text-slate-800 text-xs">
                              {[client.city, client.country].filter(Boolean).join(", ")}
                            </p>
                          ) : null}
                          {client.address ? (
                            <p className="text-[11px] text-slate-500">
                              {client.address}
                            </p>
                          ) : null}
                          {!client.city && !client.address && (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 pl-2 pr-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={(e) => handleToggleMenu(e, client)}
                            className={`w-8 h-8 rounded-xl border transition-all duration-150 active:scale-90 flex items-center justify-center gap-0.5 shrink-0 ${
                              menuAnchor?.client.id === client.id
                                ? "bg-slate-900 border-slate-800 text-white"
                                : "bg-white border-slate-200 hover:border-slate-300 text-slate-600"
                            }`}
                            title="Plus d'actions"
                          >
                            <span className={`w-1 h-1 rounded-full ${menuAnchor?.client.id === client.id ? "bg-white" : "bg-slate-700"}`} />
                            <span className={`w-1 h-1 rounded-full ${menuAnchor?.client.id === client.id ? "bg-white" : "bg-slate-700"}`} />
                            <span className={`w-1 h-1 rounded-full ${menuAnchor?.client.id === client.id ? "bg-white" : "bg-slate-700"}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vue Mobile complète */}
            <div className="block md:hidden divide-y divide-slate-100">
              {pagedClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => setViewingClient(client)}
                  className="p-4 space-y-2.5 active:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm">{client.name}</p>
                      {client.contactPerson && (
                        <p className="text-xs text-slate-500">{client.contactPerson}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    {client.phone && <p className="font-mono">{client.phone}</p>}
                    {client.email && <p className="break-all text-slate-500">{client.email}</p>}
                    {(client.city || client.address) && (
                      <p className="text-slate-500">
                        {[client.address, client.city, client.country].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => openEditModal(client)}
                      className="py-2 px-3.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 text-xs active:scale-95 transition"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientToDelete(client)}
                      className="py-2 px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-xs active:scale-95 transition"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Clients par page :</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-mono font-bold text-slate-800">
                  {(safePage - 1) * pageSize + 1} – {Math.min(safePage * pageSize, filteredClients.length)} sur {filteredClients.length}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, safePage - 1))}
                    disabled={safePage <= 1}
                    className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-30"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, safePage + 1))}
                    disabled={safePage >= totalPages}
                    className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-30"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Modale Fiche Client Complète (Voir tous les détails) ── */}
      {mounted && viewingClient && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setViewingClient(null)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-slate-900 text-emerald-400 font-extrabold text-sm flex items-center justify-center shrink-0">
                  {viewingClient.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                    {viewingClient.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {viewingClient.contactPerson || "Fiche client complète"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingClient(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Total Facturé
                  </span>
                  <span className="font-mono font-extrabold text-base text-emerald-700 mt-0.5 block">
                    {formatFCFA(viewingClient.totalBilled || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Factures émises
                  </span>
                  <span className="font-mono font-extrabold text-base text-slate-900 mt-0.5 block">
                    {viewingClient.invoicesCount || 0}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Interlocuteur</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {viewingClient.contactPerson || "Non renseigné"}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">NIF / Identifiant fiscal</span>
                  <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                    {viewingClient.nif || "Non renseigné"}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Téléphone</span>
                  <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                    {viewingClient.phone || "Non renseigné"}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">WhatsApp</span>
                  <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                    {viewingClient.whatsapp || viewingClient.phone || "Non renseigné"}
                  </span>
                </div>
                <div className="sm:col-span-2 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Email</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block break-all">
                    {viewingClient.email || "Non renseigné"}
                  </span>
                </div>
                <div className="sm:col-span-2 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Adresse & Ville</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {[viewingClient.address, viewingClient.city, viewingClient.country]
                      .filter(Boolean)
                      .join(", ") || "Non renseignée"}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cl = viewingClient;
                      setViewingClient(null);
                      openEditModal(cl);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 transition"
                  >
                    Modifier
                  </button>
                  {(viewingClient.whatsapp || viewingClient.phone) && (
                    <button
                      type="button"
                      onClick={() => openWhatsAppChat(viewingClient.whatsapp || viewingClient.phone)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold inline-flex items-center gap-1.5 transition"
                    >
                      <IconWhatsApp className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const cl = viewingClient;
                    setViewingClient(null);
                    onCreateInvoiceForClient(cl);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-sm inline-flex items-center gap-1.5 transition active:scale-95"
                >
                  <IconPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Créer une facture</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Modal Ajout / Modification Client ── */}
      {mounted && isModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg animate-scale-up max-h-[92vh] flex flex-col overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 bg-white z-10 flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {editingClient ? "Modifier la fiche client" : "Nouveau client"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Renseignez les coordonnées réelles du client
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nom du client / Entreprise *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Société Alpha SARL ou M. Diallo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Interlocuteur / Contact
                  </label>
                  <input
                    type="text"
                    placeholder="Nom du responsable"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    NIF (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Identifiant fiscal"
                    value={nif}
                    onChange={(e) => setNif(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: +227 90 00 00 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    WhatsApp (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Numéro WhatsApp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="client@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Ville
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Niamey, Dakar, Abidjan..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Pays
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Niger"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Adresse complète
                </label>
                <input
                  type="text"
                  placeholder="Quartier, rue, immeuble..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md transition active:scale-95"
                >
                  {editingClient ? "Enregistrer" : "Créer le client"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation suppression */}
      <ConfirmDialog
        isOpen={!!clientToDelete}
        title="Supprimer ce client ?"
        message="Voulez-vous vraiment supprimer cette fiche client ?"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        isDestructive={true}
        onConfirm={() => {
          if (clientToDelete) onDeleteClient(clientToDelete.id);
          setClientToDelete(null);
        }}
        onCancel={() => setClientToDelete(null)}
      />

      {/* Menu contextuel complet via Portal */}
      {mounted && menuAnchor && createPortal(
        <div
          ref={clientMenuRef}
          style={{
            position: "fixed",
            top: `${menuAnchor.top}px`,
            right: `${menuAnchor.right}px`,
            zIndex: 99999,
          }}
          className="min-w-[200px] bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden animate-scale-up py-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              const cl = menuAnchor.client;
              setMenuAnchor(null);
              setViewingClient(cl);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition text-left"
          >
            <IconEye className="w-4 h-4 text-slate-500" />
            <span>Voir la fiche complète</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const cl = menuAnchor.client;
              setMenuAnchor(null);
              openEditModal(cl);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition text-left"
          >
            <span className="w-4 text-center">✏️</span>
            <span>Modifier</span>
          </button>

          <div className="h-px bg-slate-100 my-1 mx-3" />

          <button
            type="button"
            onClick={() => {
              const cl = menuAnchor.client;
              setMenuAnchor(null);
              setClientToDelete(cl);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left"
          >
            <IconTrash className="w-4 h-4" />
            <span>Supprimer</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
