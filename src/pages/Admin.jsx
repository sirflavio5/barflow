import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, RefreshCw, LayoutGrid, ClipboardList, QrCode, Trash2, Pencil, Wine, BarChart2, Settings } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import OrderCard from "@/components/admin/OrderCard";
import ProductForm from "@/components/admin/ProductForm";
import SalesDashboard from "@/components/admin/SalesDashboard";
import SettingsPanel from "@/components/admin/SettingsPanel";
import QRCodesTab from "@/components/admin/QRCodesTab";
import { useBarSettings } from "@/lib/BarSettingsContext";

const tabs = [
  { id: "orders", label: "Pedidos", icon: ClipboardList },
  { id: "menu", label: "Menu", icon: LayoutGrid },
  { id: "sales", label: "Vendas", icon: BarChart2 },
  { id: "qr", label: "QR Codes", icon: QrCode },
  { id: "settings", label: "Config.", icon: Settings },
];

const statusOrder = ["pendente", "confirmado", "em_preparacao", "pronto", "pago"];

export default function Admin() {
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const { settings } = useBarSettings();

  const loadOrders = useCallback(async () => {
    const data = await base44.entities.Order.list("-created_date", 500);
    setOrders(data);
    setLoading(false);
  }, []);

  const loadProducts = useCallback(async () => {
    const data = await base44.entities.Product.list();
    setProducts(data);
  }, []);

  useEffect(() => {
    loadOrders();
    loadProducts();
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, [loadOrders, loadProducts]);

  const activeOrders = orders.filter((o) => o.status !== "pago");
  const doneOrders = orders.filter((o) => o.status === "pago");

  const deleteProduct = async (id) => {
    await base44.entities.Product.delete(id);
    loadProducts();
  };

  const toggleAvailability = async (product) => {
    await base44.entities.Product.update(product.id, { available: !product.available });
    loadProducts();
  };

  const baseUrl = window.location.origin + window.location.pathname.replace("/admin", "/menu");

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
        <h1 className="font-playfair font-bold text-2xl">Painel de Gestão</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
              tab === t.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
            {tab === t.id && (
              <motion.div layoutId="adminTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* ORDERS TAB */}
        {tab === "orders" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-lg">
                Pedidos ativos <span className="text-primary">({activeOrders.length})</span>
              </h2>
              <button onClick={loadOrders} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

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
        )}

        {/* MENU TAB */}
        {tab === "menu" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-lg">Produtos</h2>
              <button
                onClick={() => { setEditProduct(null); setShowProductForm(true); }}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </div>

            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-3">
                  {p.image_url && (
                    <img src={p.image_url} alt={p.name} className="w-14 h-14 rounded-xl object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-muted-foreground text-xs">{p.category}</p>
                    <p className="text-primary font-semibold text-sm">€{p.price?.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => toggleAvailability(p)}
                    title={p.available ? "Clica para desativar" : "Clica para ativar"}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                      p.available
                        ? "bg-green-500/15 text-green-400 hover:bg-red-500/15 hover:text-red-400"
                        : "bg-red-500/15 text-red-400 hover:bg-green-500/15 hover:text-green-400"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${p.available ? "bg-green-400" : "bg-red-400"}`} />
                    {p.available ? "Ativo" : "Inativo"}
                  </button>
                  <button
                    onClick={() => { setEditProduct(p); setShowProductForm(true); }}
                    className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80"
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center hover:bg-destructive/20"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SALES TAB */}
        {tab === "sales" && (
          <SalesDashboard orders={orders} />
        )}

        {/* SETTINGS TAB */}
        {tab === "settings" && <SettingsPanel />}

        {/* QR TAB */}
        {tab === "qr" && <QRCodesTab baseUrl={baseUrl} />}
      </div>

      <AnimatePresence>
        {showProductForm && (
          <ProductForm
            product={editProduct}
            onClose={() => setShowProductForm(false)}
            onSaved={() => { setShowProductForm(false); loadProducts(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}