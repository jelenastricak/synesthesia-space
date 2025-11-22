import { useState, useEffect } from 'react';
import { X, Download, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Screenshot {
  id: string;
  dataUrl: string;
  timestamp: number;
}

interface ScreenshotGalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'synesthesia-screenshots';

export const ScreenshotGallery = ({ isOpen, onClose }: ScreenshotGalleryProps) => {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadScreenshots();
  }, [isOpen]);

  const loadScreenshots = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setScreenshots(parsed);
      }
    } catch (error) {
      console.error('Error loading screenshots:', error);
    }
  };

  const handleDownload = (screenshot: Screenshot) => {
    const link = document.createElement('a');
    link.href = screenshot.dataUrl;
    link.download = `synesthesia-${new Date(screenshot.timestamp).toISOString()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Downloaded",
      description: "Screenshot saved to your device",
    });
  };

  const handleDelete = (id: string) => {
    try {
      const updated = screenshots.filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setScreenshots(updated);

      toast({
        title: "Deleted",
        description: "Screenshot removed from gallery",
      });
    } catch (error) {
      console.error('Error deleting screenshot:', error);
      toast({
        title: "Error",
        description: "Failed to delete screenshot",
        variant: "destructive",
      });
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all screenshots?')) {
      localStorage.removeItem(STORAGE_KEY);
      setScreenshots([]);
      toast({
        title: "Cleared",
        description: "All screenshots removed",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeInBlur">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-xl"
        style={{ background: 'hsl(var(--background) / 0.8)' }}
        onClick={onClose}
      />

      {/* Gallery Container */}
      <div 
        className="relative w-full max-w-6xl max-h-[90vh] rounded-2xl overflow-hidden"
        style={{
          background: 'hsl(var(--background) / 0.95)',
          border: '1px solid hsl(var(--border) / 0.5)',
          boxShadow: '0 20px 60px hsl(var(--aurora-purple) / 0.3)',
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'hsl(var(--border) / 0.3)' }}
        >
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5" style={{ color: 'hsl(var(--aurora-cyan))' }} />
            <h2 
              className="text-2xl font-light tracking-widest"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              GALLERY
            </h2>
            <span 
              className="text-sm opacity-60"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              {screenshots.length} {screenshots.length === 1 ? 'capture' : 'captures'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {screenshots.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs tracking-wider"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          {screenshots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ImageIcon 
                className="w-16 h-16 mb-4 opacity-30"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              />
              <p 
                className="text-lg font-light tracking-wide opacity-60"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                No screenshots yet
              </p>
              <p 
                className="text-sm mt-2 opacity-40"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                Capture moments using the camera button
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {screenshots.map((screenshot) => (
                <div
                  key={screenshot.id}
                  className="group relative rounded-lg overflow-hidden transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'hsl(var(--muted) / 0.3)',
                    border: '1px solid hsl(var(--border) / 0.3)',
                  }}
                >
                  {/* Screenshot Image */}
                  <img
                    src={screenshot.dataUrl}
                    alt={`Screenshot from ${new Date(screenshot.timestamp).toLocaleString()}`}
                    className="w-full aspect-video object-cover"
                  />

                  {/* Overlay with Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(screenshot)}
                      className="w-32"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(screenshot.id)}
                      className="w-32"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>

                  {/* Timestamp */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 p-2 text-xs text-center opacity-80"
                    style={{
                      background: 'linear-gradient(to top, hsl(var(--background)), transparent)',
                      color: 'hsl(var(--foreground))',
                    }}
                  >
                    {new Date(screenshot.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to save a screenshot (used from Index.tsx)
export const saveScreenshot = (dataUrl: string) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const existing = stored ? JSON.parse(stored) : [];
    
    const newScreenshot: Screenshot = {
      id: `screenshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dataUrl,
      timestamp: Date.now(),
    };

    // Keep only the last 50 screenshots to avoid localStorage limits
    const updated = [newScreenshot, ...existing].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    return true;
  } catch (error) {
    console.error('Error saving screenshot:', error);
    return false;
  }
};
