import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Flex, Typography, Button, IconButton, Modal } from '@strapi/design-system';
import { Expand, Collapse, ArrowClockwise } from '@strapi/icons';
import type { LayoutItem, GridConfig, ComponentWithSource } from '../../types';

// The URL of the layout-renderer preview page
const PREVIEW_URL = process.env.LAYOUT_RENDERER_URL || 'http://localhost:3001/preview';

interface PreviewFrameProps {
  items: LayoutItem[];
  gridConfig: GridConfig;
  components: ComponentWithSource[];
  isOpen: boolean;
  onClose: () => void;
}

interface ExportedLayoutData {
  version: string;
  exportedAt: string;
  page: {
    name: string;
    slug: string;
    description?: string;
  };
  grid: GridConfig;
  layout: {
    items: LayoutItem[];
  };
  remotes: Record<number, { name: string; remoteEntry: string; scope: string }>;
}

export function PreviewFrame({
  items,
  gridConfig,
  components,
  isOpen,
  onClose,
}: PreviewFrameProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Build the exported layout data structure that the preview page expects
  const buildExportData = useCallback((): ExportedLayoutData => {
    // Build remotes map from components
    const remotes: Record<number, { name: string; remoteEntry: string; scope: string }> = {};

    components.forEach((component) => {
      if (component.sourceId && !remotes[component.sourceId]) {
        remotes[component.sourceId] = {
          name: component.sourceName,
          remoteEntry: component.remoteEntry || '',
          scope: component.scope || '',
        };
      }
    });

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      page: {
        name: 'Preview',
        slug: 'preview',
      },
      grid: gridConfig,
      layout: {
        items,
      },
      remotes,
    };
  }, [items, gridConfig, components]);

  // Send layout data to iframe
  const sendLayoutData = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      const data = buildExportData();
      console.log('[PreviewFrame] Sending layout data to iframe:', data);
      iframeRef.current.contentWindow.postMessage({ type: 'PREVIEW_LAYOUT', data }, '*');
    }
  }, [buildExportData]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'PREVIEW_REFRESH' }, '*');
      // Also resend the data in case items changed
      setTimeout(sendLayoutData, 150);
    }
  }, [sendLayoutData]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PREVIEW_READY') {
        console.log('[PreviewFrame] Iframe is ready');
        setIsIframeReady(true);
        sendLayoutData();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sendLayoutData]);

  // Send data when items/gridConfig change and iframe is ready
  useEffect(() => {
    if (isOpen && isIframeReady) {
      sendLayoutData();
    }
  }, [isOpen, isIframeReady, items, gridConfig, sendLayoutData]);

  // Reset iframe ready state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsIframeReady(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal.Root open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <Modal.Content style={{ maxWidth: isFullscreen ? '95vw' : '900px', width: '100%' }}>
        <Modal.Header>
          <Flex justifyContent="space-between" alignItems="center" style={{ width: '100%' }}>
            <Typography variant="beta">Live Preview</Typography>
            <Flex gap={2}>
              <IconButton
                label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Collapse /> : <Expand />}
              </IconButton>
              <Button
                onClick={handleRefresh}
                variant="secondary"
                size="S"
                startIcon={<ArrowClockwise />}
              >
                Refresh
              </Button>
            </Flex>
          </Flex>
        </Modal.Header>
        <Modal.Body>
          <Box
            background="neutral100"
            hasRadius
            style={{
              height: isFullscreen ? 'calc(85vh - 150px)' : '500px',
              width: '100%',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {!isIframeReady && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f6f6f9',
                  zIndex: 1,
                }}
              >
                <div style={{ textAlign: 'center', color: '#666' }}>
                  <p>Connecting to preview...</p>
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={PREVIEW_URL}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                opacity: isIframeReady ? 1 : 0,
              }}
              title="Layout Preview"
            />
          </Box>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onClose} variant="tertiary">
            Close
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}
