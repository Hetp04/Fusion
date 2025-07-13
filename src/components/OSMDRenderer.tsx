// components/OSMDRenderer.tsx
import { useEffect, useRef } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

interface OSMDRendererProps {
  musicXML: string;
}

const OSMDRenderer: React.FC<OSMDRendererProps> = ({ musicXML }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !musicXML) return;

    const osmd = new OpenSheetMusicDisplay(containerRef.current, {
      autoResize: true,
      drawPartNames: false,
      drawTitle: false,
    });

    osmd
      .load(musicXML)
      .then(() => osmd.render())
      .catch((err) => console.error("OSMD Error:", err));

    return () => {
      osmd.clear();
    };
  }, [musicXML]);

  return <div ref={containerRef} className="mt-4 w-full ml-35 overflow-x-auto" />;
};

export default OSMDRenderer;