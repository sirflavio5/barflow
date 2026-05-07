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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-5 pt-10 pb-4">
        <div className="flex items-center gap-2 mb-1">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="w-5 h-5 object-contain rounded" />
          ) : (
            <Wine className="w-5 h-5 text-primary" />
          )}
          <span className="text-primary text-sm font-medium tracking-widest uppercase">{settings.bar_name || "Bar Nobre"}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-playfair font-bold text-2xl">Dashboard Staff</h1>
            {newOrderCount > 0 && (
              <span
                onClick={() => setNewOrderCount(0)}
                className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full cursor-pointer hover:bg-primary/80 transition-colors"
                title="Clica para limpar"
              >
                {newOrderCount} novo{newOrderCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled((v) => !v)}
              title={soundEnabled ? "Desativar som" : "Ativar som"}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                soundEnabled
                  ? "bg-primary/20 text-primary hover:bg-primary/30"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {soundEnabled ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </span>
              Em direto
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <AnimatePresence>
          {newOrderAlert && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="bg-primary/20 border border-primary/50 text-primary rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10"
            >
              <BellRing className="w-4 h-4 animate-bounce" />
              Novo pedido recebido!
            </motion.div>
          )}
        </AnimatePresence>

        <h2 className="font-semibold text-lg">
          Pedidos ativos <span className="text-primary">({activeOrders.length})</span>
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 bg-card rounded-2xl animate-pulse border border-border/30" />
            ))}
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Sem pedidos ativos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeOrders.map((o) => (
              <OrderCard key={o.id} order={o} onUpdate={loadOrders} />
            ))}
          </div>
        )}

        {doneOrders.length > 0 && (
          <div className="mt-6">
            <h2 className="font-semibold text-base text-muted-foreground mb-3">Concluídos hoje ({doneOrders.length})</h2>
            <div className="space-y-3 opacity-60">
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