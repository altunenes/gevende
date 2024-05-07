import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import './App.css';
import { FaDownload } from 'react-icons/fa';
import Footer from './dooter'; 
interface URLInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
}
const URLInputModal: React.FC<URLInputModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [url, setUrl] = useState<string>('');
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Enter Image URL</h3>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="http://example.com/image.jpg"
          autoFocus
        />
        <button onClick={() => { onSubmit(url); onClose(); }}>Load Image</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};
function App() {
  const [originalImageSrc, setOriginalImageSrc] = useState<string>('');
  const [filteredImageSrc, setFilteredImageSrc] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [cutoffFrequencyRatio, setCutoffFrequencyRatio] = useState<number>(0.1);
  const [highPass, setHighPass] = useState<boolean>(true);
  const [order, setOrder] = useState<number>(7.0);
  const [squared, setSquared] = useState<boolean>(false);
  const [npad, setNpad] = useState<number>(0);
  const handleLoadImageFromUrl = (url: string) => {
    setOriginalImageSrc(url);
    setImageFile(null);
    setModalOpen(false);
  };
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      const file = files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (typeof e.target?.result === 'string') {
          setOriginalImageSrc(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const applyButterworthFilter = async () => {
    let buffer;
    setProcessing(true);
    setErrorMessage('');
    if (imageFile) {
      buffer = await imageFile.arrayBuffer();
    } else if (originalImageSrc) {
      try {
        const response = await fetch(originalImageSrc);
        const blob = await response.blob();
        buffer = await blob.arrayBuffer();
      } catch (error) {
        setErrorMessage('Failed to fetch and process image from URL.');
        setProcessing(false);
        return;
      }
    } else {
      setErrorMessage('Please upload an image first.');
      setProcessing(false);
      return;
    }
    try {
      const uint8Array = new Uint8Array(buffer);
      const response = await invoke('apply_butterworth_filter', {
        imageBuffer: Array.from(uint8Array),
        cutoffFrequencyRatio,
        highPass,
        order,
        squared,
        npad
      });
      if (Array.isArray(response)) {
        const byteArray = new Uint8Array(response);
        const blob = new Blob([byteArray], { type: 'image/png' });
        const imageUrl = URL.createObjectURL(blob);
        setFilteredImageSrc(imageUrl);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error('Error applying filter:', error);
      setErrorMessage(`Error applying filter: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setProcessing(false);
    }
  };
  const downloadImage = () => {
    if (!filteredImageSrc) {
      alert("No filtered image to download!");
      return;
    }
    const link = document.createElement('a');
    link.href = filteredImageSrc;
    link.download = 'filtered-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="App">
      <h1>Butter2D</h1>
      <input type="file" id="file" className="input-file" accept="image/*" onChange={handleImageChange} />
      <label htmlFor="file">Import from Disk</label>
      <button onClick={() => setModalOpen(true)}>Import from URL</button>
      <URLInputModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleLoadImageFromUrl}
      />
      <button onClick={() => setShowOptions(!showOptions)}>Options</button>
      {showOptions && (
        <div className="options">
          <div className="label">
            <span>Cutoff: {cutoffFrequencyRatio.toFixed(2)}</span>
            <input type="range" min="0" max="0.5" step="0.01" value={cutoffFrequencyRatio} onChange={e => setCutoffFrequencyRatio(parseFloat(e.target.value))} />
          </div>
          <div className="label">
            <span>High Pass?</span>
            <input type="checkbox" checked={highPass} onChange={e => setHighPass(e.target.checked)} />
          </div>
          <div className="label">
            <span>Order: {order}</span>
            <input type="range" min="1.0" max="100" step="1.0" value={order} onChange={e => setOrder(parseFloat(e.target.value))} />
          </div>
          <div className="label">
            <span>Squared?</span>
            <input type="checkbox" checked={squared} onChange={e => setSquared(e.target.checked)} />
          </div>
          <div className="label">
            <span>npad:</span>
            <input type="number" value={npad} onChange={e => setNpad(parseInt(e.target.value, 10))} />
          </div>
        </div>
      )}
      <button onClick={applyButterworthFilter} disabled={processing}>
        {processing ? 'Processing...' : 'Apply Butterworth Filter'}
      </button>
      {errorMessage && <p className="error">{errorMessage}</p>}
      <div className="image-display">
        <div className="image-container">
          <h2>Original Image</h2>
          {originalImageSrc && <img src={originalImageSrc} alt="Original" />}
        </div>
        <div className="image-container">
          <h2>Filtered Image</h2>
          {filteredImageSrc && <img src={filteredImageSrc} alt="Filtered" />}
          {filteredImageSrc && (
         <button onClick={downloadImage} className="download-button"><FaDownload /> Download</button>
         
)}        </div>
      <Footer /> {/* Add the Footer component */}

      </div>
    </div>
  );
}
export default App;