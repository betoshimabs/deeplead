'use client';
import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { createContact } from '@/lib/services/contacts';
import { useApp } from '@/context/AppContext';

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportContactsModal({ isOpen, onClose, onSuccess }: ImportContactsModalProps) {
  const { t } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith('.csv')) {
      setError('Por favor, selecione um arquivo CSV.');
      setFile(null);
      setPreview([]);
      return;
    }

    setError(null);
    setFile(selected);

    // Preview
    Papa.parse(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`Erro ao ler CSV: ${results.errors[0].message}`);
        } else {
          setPreview(results.data.slice(0, 3));
        }
      },
    });
  };

  const handleImport = () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows: any[] = results.data;
          
          // Map fields based on common headers
          const payload = rows.map((row) => {
            const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('nome') || k.toLowerCase().includes('name'));
            const emailKey = Object.keys(row).find(k => k.toLowerCase().includes('email') || k.toLowerCase().includes('e-mail'));
            const phoneKey = Object.keys(row).find(k => k.toLowerCase().includes('telefone') || k.toLowerCase().includes('celular') || k.toLowerCase().includes('phone'));

            return {
              name: nameKey ? row[nameKey] : 'Sem Nome',
              email: emailKey ? row[emailKey] : null,
              phone: phoneKey ? row[phoneKey] : null,
              source: 'import',
              status: 'new'
            };
          });

          // Send bulk request
          await createContact(payload);
          onSuccess();
          onClose();
        } catch (err: any) {
          setError(err.message || 'Erro ao importar contatos. Verifique o formato do arquivo.');
        } finally {
          setLoading(false);
        }
      },
      error: (err) => {
        setError(`Erro de parsing: ${err.message}`);
        setLoading(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-[#0A1A2B]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#EDF0F4] flex items-center justify-between bg-[#F8FAFB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF7FA] text-[#127284] flex items-center justify-center">
              <Upload size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2F4251]">Importar Contatos</h2>
              <p className="text-xs text-[#8A9BB0]">Faça upload de um CSV com seus contatos.</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#8A9BB0] hover:bg-[#EDF0F4] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-[#FFEAEA] border border-[#FCA5A5] rounded-xl flex items-start gap-3 text-[#E03131]">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {!file ? (
            <div className="border-2 border-dashed border-[#DAE1EA] rounded-2xl p-8 text-center hover:bg-[#F8FAFB] hover:border-[#127284] transition-all relative group">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-12 h-12 rounded-xl bg-[#F4F7FA] text-[#8A9BB0] flex items-center justify-center mx-auto mb-3 group-hover:text-[#127284] group-hover:bg-[#EBF7FA] transition-colors">
                <FileText size={24} />
              </div>
              <p className="text-sm font-semibold text-[#2F4251] mb-1">Clique ou arraste um CSV aqui</p>
              <p className="text-xs text-[#8A9BB0]">A planilha deve conter colunas como &quot;Nome&quot;, &quot;Email&quot; e &quot;Telefone&quot;.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-[#F8FAFB] border border-[#DAE1EA] rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="text-[#127284]" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-[#2F4251]">{file.name}</p>
                    <p className="text-xs text-[#8A9BB0]">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setFile(null); setPreview([]); setError(null); }}
                  className="text-xs text-[#E03131] hover:underline font-medium"
                >
                  Trocar arquivo
                </button>
              </div>

              {preview.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#8A9BB0] uppercase tracking-wider mb-3">Pré-visualização (3 primeiras linhas)</h4>
                  <div className="overflow-x-auto border border-[#DAE1EA] rounded-xl text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-[#F8FAFB] border-b border-[#DAE1EA]">
                        <tr>
                          {Object.keys(preview[0]).slice(0, 4).map(key => (
                            <th key={key} className="px-3 py-2 font-semibold text-[#555D6F] truncate">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDF0F4]">
                        {preview.map((row, i) => (
                          <tr key={i}>
                            {Object.values(row).slice(0, 4).map((val: any, j) => (
                              <td key={j} className="px-3 py-2 text-[#2F4251] truncate max-w-[120px]">{val}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#EDF0F4] flex items-center justify-end gap-3 bg-white">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-[#555D6F] hover:bg-[#F4F7FA] rounded-xl transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button 
            onClick={handleImport}
            disabled={!file || loading}
            className="px-5 py-2 bg-[#127284] text-white rounded-xl text-sm font-bold hover:bg-[#0E5B6A] disabled:opacity-50 disabled:hover:bg-[#127284] transition-all flex items-center gap-2"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Importando...</>
            ) : (
              <><CheckCircle2 size={16} /> Importar Contatos</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
