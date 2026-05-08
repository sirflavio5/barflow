import { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Wine, BellRing, BellOff } from "lucide-react";
import OrderCard from "@/components/admin/OrderCard";
import { useBarSettings } from "@/lib/BarSettingsContext";
import { useOrderNotification } from "@/hooks/useOrderNotification";

export default function Staff() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { settings } = useBarSettings();
  const { playSound } = useOrderNotification();

  const loadOrders = useCallback(async () => {
    const data = await base44.entities.Order.list("-created_date", 500);
    setOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();

    const unsubscribe = base44.entities.Order.subscribe((event) => {
      if (event.type === "create") {
        setOrders((prev) => [event.data, ...prev]);
        setNewOrderAlert(true);
        setNewOrderCount((c) => c + 1);
        if (soundEnabled) playSound();
        setTimeout(() => setNewOrderAlert(false), 5000);
      } else if (event.type === "update") {
        setOrders((prev) => prev.map((o) => o.id === event.id ? event.data : o));
      } else if (event.type === "delete") {
        setOrders((prev) => prev.filter((o) => o.id !== event.id));
      }
    });

    return () => unsubscribe();
  }, [loadOrders]);

  const activeOrders = orders.filter((o) => o.status !== "pago");
  const doneOrders = orders.filter((o) => o.status === "pago");

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Header — mobile-first, sticky */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border px-4 pt-safe-top">
        <div className="flex items-center justify-between py-3">
          {/* Left: brand */}
          <div className="flex items-center gap-2 min-w-0">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-7 h-7 object-contain rounded flex-shrink-0" />
            ) : (
              <Wine className="w-5 h-5 text-primary flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-primary text-xs font-semibold tracking-widest uppercase truncate leading-none mb-0.5">
                {settings.bar_name || "Bar Nobre"}
              </p>
              <h1 className="font-playfair font-bold text-lg leading-none">Staff</h1>
            </div>
            {newOrderCount > 0 && (
              <button
                onClick={() => setNewOrderCount(0)}
                className="ml-1 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full"
              >
                {newOrderCount}
              </button>
            )}
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled((v) => !v)}
              title={soundEnabled ? "Desativar som" : "Ativar som"}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                soundEnabled
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {soundEnabled ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-1.5 bg-green-500/10 text-green-400 text-xs font-medium px-2.5 py-1.5 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400"></span>
              </span>
              Live
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 max-w-2xl mx-auto">
        <AnimatePresence>
          {newOrderAlert && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="bg-primary/20 border border-primary/50 text-primary rounded-2xl px-4 py-3 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10"
            >
              <BellRing className="w-4 h-4 animate-bounce flex-shrink-0" />
              Novo pedido recebido!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section header */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">
            Pedidos ativos{" "}
            <span className="text-primary font-bold">({activeOrders.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-card rounded-2xl animate-pulse border border-border/30" />
            ))}
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <ClipboardList className="w-14 h-14 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Sem pedidos ativos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeOrders.map((o) => (
              <OrderCard key={o.id} order={o} onUpdate={loadOrders} />
            ))}
          </div>
        )}

        {doneOrders.length > 0 && (
          <div className="pt-2">
            <h2 className="font-semibold text-sm text-muted-foreground mb-3">
              Concluídos ({doneOrders.length})
            </h2>
            <div className="space-y-3 opacity-50">
              {doneOrders.slice(0, 5).map((o) => (
                <OrderCard key={o.id} order={o} onUpdate={loadOrders} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}