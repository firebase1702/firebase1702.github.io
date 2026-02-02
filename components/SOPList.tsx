import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, onSnapshot, query, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Book, Upload, X, FileText, CheckCircle, Link as LinkIcon, Globe, Eye, Trash2, Layers } from 'lucide-react';
import { SOP, SOPTargetUnit } from '../types';

interface SOPListProps {
  user: User | null;
  isAdmin?: boolean;
}

const SOPList: React.FC<SOPListProps> = ({ user, isAdmin = false }) => {
  const [sops, setSops] = useState<SOP[]>([]);
  const [activeTab, setActiveTab] = useState<SOPTargetUnit>('Unit 1-2');
  
  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file');
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'Operasional',
    targetUnit: 'Unit 1-2' as SOPTargetUnit,
    file: null as File | null,
    url: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewSop, setPreviewSop] = useState<SOP | null>(null);
  const [deleteSopData, setDeleteSopData] = useState<SOP | null>(null);

  // Firestore Listener for SOPs
  useEffect(() => {
    if (!user) {
      setSops([]);
      return;
    }

    // Rule: match /sop/{sopId} { allow read: if isSignedIn(); }
    // Fetch from root 'sop' collection. Everyone can read.
    const q = query(collection(db, "sop"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSops: SOP[] = [];
      snapshot.forEach((doc) => {
        fetchedSops.push({ 
          ...doc.data(), 
          path: doc.ref.path 
        } as SOP);
      });
      // Sort by updated date
      fetchedSops.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
      setSops(fetchedSops);
    }, (error) => {
      console.error("Error fetching SOPs:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredSops = sops.filter(sop => sop.targetUnit === activeTab);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadForm(prev => ({
        ...prev,
        file: file,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "") // Auto-fill title if empty
      }));
    }
  };

  const handleUploadOpen = () => {
    // Set default target unit in form to match current active tab
    setUploadForm(prev => ({ ...prev, targetUnit: activeTab }));
    setIsUploadOpen(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    if (!uploadForm.title) return;
    if (uploadType === 'file' && !uploadForm.file) return;
    if (uploadType === 'url' && !uploadForm.url) return;

    let contentSimulated = '';
    let fileUrl = '';
    
    if (uploadType === 'file' && uploadForm.file) {
      contentSimulated = `Konten diekstrak dari file lokal: ${uploadForm.file.name}. (Simulasi konten dokumen SOP baru...)`;
      fileUrl = URL.createObjectURL(uploadForm.file);
    } else {
      contentSimulated = `Dokumen SOP diakses melalui tautan eksternal: ${uploadForm.url}.`;
      fileUrl = uploadForm.url;
    }

    const newId = Date.now().toString();
    const newSOP: SOP = {
      id: newId,
      title: uploadForm.title,
      category: uploadForm.category,
      targetUnit: uploadForm.targetUnit,
      lastUpdated: new Date().toISOString().split('T')[0],
      content: contentSimulated,
      fileUrl: fileUrl,
      userEmail: user.email || 'Admin'
    };

    try {
      // Rule: allow write: if isAdmin();
      // Admin uploads to root 'sop' collection
      await setDoc(doc(db, "sop", newId), newSOP);
      
      // Reset and Close
      setUploadForm({ 
        title: '', 
        category: 'Operasional', 
        targetUnit: activeTab, // Reset to current tab
        file: null, 
        url: '' 
      });
      setUploadType('file');
      setIsUploadOpen(false);
    } catch (error) {
      console.error("Error adding SOP", error);
      alert("Failed to save SOP. Only Admins can upload.");
    }
  };

  const handleDeleteClick = (sop: SOP) => {
    setDeleteSopData(sop);
  };

  const handleConfirmDelete = async () => {
    if (deleteSopData && user && isAdmin) {
      try {
        // Rule: allow write: if isAdmin();
        await deleteDoc(doc(db, "sop", deleteSopData.id));
        setDeleteSopData(null);
      } catch (error) {
        console.error("Error deleting SOP", error);
        alert("Failed to delete SOP. Access denied.");
      }
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] relative flex flex-col gap-4">
      {/* Tab Navigation */}
      <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex overflow-x-auto shrink-0">
        {(['Unit 1-2', 'Unit 3-4', 'Umum'] as SOPTargetUnit[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[100px] py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === tab
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List Section */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Daftar SOP</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">
                {activeTab}
              </span>
              <p className="text-sm text-slate-500">Panduan standar operasional.</p>
            </div>
          </div>
          {isAdmin && (
            <button 
              onClick={handleUploadOpen}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload SOP</span>
              <span className="sm:hidden">Upload</span>
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredSops.length > 0 ? (
            filteredSops.map(sop => (
              <div key={sop.id} className="group p-4 border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all bg-white animate-fade-in">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <Book className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{sop.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-500">{sop.category} • Update: {sop.lastUpdated}</p>
                        {sop.fileUrl && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium border border-blue-100">
                            PDF Available
                          </span>
                        )}
                        {isAdmin && sop.userEmail && (
                           <span className="text-[10px] text-slate-400 border-l border-slate-200 pl-2 ml-1">
                             By: {sop.userEmail}
                           </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Only Admin can delete */}
                    {isAdmin && (
                      <button 
                        onClick={() => handleDeleteClick(sop)}
                        className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                        title="Hapus SOP"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    {sop.fileUrl ? (
                      <button 
                        onClick={() => setPreviewSop(sop)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>
                    ) : (
                      <div className="w-8"></div>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600 line-clamp-2 pl-12">{sop.content}</p>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Layers className="w-12 h-12 mb-3 opacity-20" />
              <p>Belum ada SOP untuk {activeTab}</p>
              {!isAdmin && <p className="text-xs text-slate-400 mt-2">Hubungi Admin untuk update.</p>}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal (Admin Only) */}
      {isUploadOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Upload SOP Baru (Admin)</h3>
              <button 
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Target Unit Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Target Unit</label>
                <select 
                  value={uploadForm.targetUnit}
                  onChange={(e) => setUploadForm({...uploadForm, targetUnit: e.target.value as SOPTargetUnit})}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white text-slate-900"
                >
                  <option value="Unit 1-2">Unit 1-2</option>
                  <option value="Unit 3-4">Unit 3-4</option>
                  <option value="Umum">Umum</option>
                </select>
              </div>

              {/* Upload Type Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => setUploadType('file')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                    uploadType === 'file'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType('url')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                    uploadType === 'url'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  Via URL
                </button>
              </div>

              {/* Conditional Input Section */}
              {uploadType === 'file' ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    uploadForm.file ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  {uploadForm.file ? (
                    <div className="text-center">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">{uploadForm.file.name}</p>
                      <p className="text-xs text-slate-500">{(uploadForm.file.size / 1024).toFixed(0)} KB</p>
                      <p className="text-xs text-emerald-600 font-medium mt-1">File dipilih</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <FileText className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">Klik untuk pilih file</p>
                      <p className="text-xs text-slate-400">PDF, DOC, DOCX (Max 5MB)</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Link Dokumen (PDF)</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="url" 
                      value={uploadForm.url}
                      onChange={(e) => setUploadForm({...uploadForm, url: e.target.value})}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white text-slate-900"
                      placeholder="https://example.com/dokumen.pdf"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Judul Dokumen</label>
                  <input 
                    type="text" 
                    required
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white text-slate-900"
                    placeholder="Contoh: Prosedur Keselamatan..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Kategori</label>
                  <select 
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white text-slate-900"
                  >
                    <option value="Operasional">Operasional</option>
                    <option value="Keselamatan (K3)">Keselamatan (K3)</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="HR">HR & Umum</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!uploadForm.title || (uploadType === 'file' ? !uploadForm.file : !uploadForm.url)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Simpan SOP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteSopData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Hapus SOP?</h3>
              <p className="text-slate-500 mb-6 text-sm">
                Apakah Anda yakin ingin menghapus dokumen ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteSopData(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewSop && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
           {/* Modal Header */}
           <div className="w-full max-w-5xl bg-slate-900 text-white px-4 py-3 rounded-t-2xl flex justify-between items-center">
             <div className="flex items-center gap-3">
               <div className="p-1.5 bg-slate-800 rounded-lg">
                 <FileText className="w-4 h-4" />
               </div>
               <div>
                 <h3 className="text-sm font-bold">{previewSop.title}</h3>
                 <p className="text-[10px] text-slate-400">Preview Mode</p>
               </div>
             </div>
             <button 
               onClick={() => setPreviewSop(null)}
               className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
             >
               <X className="w-5 h-5" />
             </button>
           </div>
           
           {/* Modal Content */}
           <div className="w-full max-w-5xl h-[80vh] bg-white rounded-b-2xl overflow-hidden relative shadow-2xl">
              {previewSop.fileUrl ? (
                <iframe 
                  src={previewSop.fileUrl} 
                  className="w-full h-full border-none"
                  title="PDF Preview"
                ></iframe>
              ) : (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <FileText className="w-16 h-16 mb-4 opacity-20" />
                    <p>File tidak dapat ditampilkan.</p>
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default SOPList;