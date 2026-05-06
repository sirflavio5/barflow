import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

const statusColors = {
  pendente: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmado: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  em_preparacao: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  pronto: "bg-green-500/20 text-green-400 border-green-500/30",
  pago: "bg-muted text-muted-foreground border-border",
};

const statusLabel = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  em_preparacao: "Em preparação",
  pronto: "Pronto",
  pago: "Pago",
};

const nextStatus = {
  pendente: "confirmado",
  confirmado: "em_preparacao",
  em_preparacao: "pronto",
  pronto: "pago",
};

export default function OrderCard({ order, onUpdate }) {
  const handleAdvance = async () => {
    const next = nextStatus[order.status];
    if (!next) return;

    // When confirming an order, deduct stock from products
    if (order.status === "pendente" && next === "confirmado") {
      const products = await base44.entities.Product.list();
      for (const item of (order.items || [])) {
        const product = products.find((p) => p.id === item.product_id);
        if (product && product.stock_enabled && product.stock > 0) {
          const newStock = Math.max(0, product.stock - item.quantity);
          const updates = { stock: newStock };
          if (newStock === 0) updates.available = false;
          await base44.entities.Product.update(product.id, updates);
        }
      }
    }

    await base44.entities.Order.update(order.id, { status: next });
    onUpdate();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border/50 rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-playfair font-semibold text-lg">Mesa {order.table_number}</p>
          <p className="text-muted-foreground text-xs">
            {new Date(order.created_date).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full border ${statusColors[order.status]}`}>
          {statusLabel[order.status]}
        </span>
      </div>

      <div className="space-y-1">
        {order.items?.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-foreground">{item.quantity}× {item.product_name}</span>
            <span className="text-muted-foreground">€{item.total?.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {order.notes && (
        <p className="text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2 italic">
          "{order.notes}"
        </p>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="font-semibold text-primary">€{order.total_amount?.toFixed(2)}</span>
        {nextStatus[order.status] && (
          <button
            onClick={handleAdvance}
            className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
          >
            → {statusLabel[nextStatus[order.status]]}
          </button>
        )}
      </div>
    </motion.div>
  );
}