// frontend/src/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { auth, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User, Upload, Loader, AlertCircle } from 'react-feather';
import './App.css';

function SettingsPage() {
  const [logoUrl, setLogoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load current logo from localStorage on mount
  useEffect(() => {
    const storedLogo = localStorage.getItem('userLogoUrl');
    if (storedLogo) {
      setLogoUrl(storedLogo);
    }
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError("File is too large. Max 5MB.");
      return;
    }

    if (!auth.currentUser) {
      setError("You must be logged in.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const storageRef = ref(storage, `logos/${auth.currentUser.uid}/${file.name}`);
    
    try {
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the public URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Save to localStorage and state
      localStorage.setItem('userLogoUrl', downloadURL);
      setLogoUrl(downloadURL);
      setSuccess("Logo updated successfully!");

    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload logo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="results-card" style={{ maxWidth: '500px', margin: '40px auto' }}>
      <h2><User size={28} /> Channel Settings</h2>
      
      <div className="settings-upload-box">
        <label>Channel Logo</label>
        <p>Upload a square logo (e.g., .png) to include in thumbnail designs. Max 5MB.</p>
        
        {logoUrl && (
          <div className="logo-preview">
            <img src={logoUrl} alt="Channel Logo Preview" />
            <p>Current Logo</p>
          </div>
        )}
        
        <input 
          type="file" 
          id="logoUpload" 
          accept="image/png, image/jpeg"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={isLoading}
        />
        
        <label htmlFor="logoUpload" className="generate-button" style={{ marginTop: '10px' }}>
          {isLoading ? (
            <Loader size={20} className="spinner" />
          ) : (
            <>
              <Upload size={20} />
              {logoUrl ? 'Upload New Logo' : 'Upload Logo'}
            </>
          )}
        </label>
        
        {error && <div className="error-message" style={{ marginTop: '15px' }}><AlertCircle size={16} /> {error}</div>}
        {success && <div className="success-message" style={{ marginTop: '15px' }}>{success}</div>}
      </div>
    </div>
  );
}

export default SettingsPage;