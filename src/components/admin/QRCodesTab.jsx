import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Copy } from "lucide-react";

function QRCard({ mesa, url }) {
  const svgRef = useRef();

  const handleDownload = () => {
    const svg = svgRef.current.querySelector("svg");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 300, 300);
      ctx.drawImage(img, 0, 0, 300, 300);
      URL.revokeObjectURL(svgUrl);
      const a = document.createElement("a");
      a.download = `mesa-${mesa}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = svgUrl;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col items-center gap-4">
      <p className="font-playfair font-semibold text-lg">Mesa {mesa}</p>
      <div ref={svgRef} className="bg-white p-3 rounded-xl">
        <QRCodeSVG value={url} size={150} />
      </div>
      <p className="text-muted-foreground text-xs break-all text-center">{url}</p>
      <div className="flex gap-2 w-full">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 bg-secondary text-muted-foreground hover:text-foreground text-xs font-medium py-2 rounded-xl transition-colors"
        >
          <Copy className="w-3.5 h-3.5" /> Copiar link
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium py-2 rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Download
        </button>
      </div>
    </div>
  );
}

export default function QRCodesTab({ baseUrl }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-lg">QR Codes por Mesa</h2>
        <p className="text-muted-foreground text-sm mt-1">Faz download e imprime os QR codes para cada mesa.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[...Array(10)].map((_, i) => {
          const mesa = i + 1;
          const url = `${baseUrl}?mesa=${mesa}`;
          return <QRCard key={mesa} mesa={mesa} url={url} />;
        })}
      </div>
    </div>
  );
}