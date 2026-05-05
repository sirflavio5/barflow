import { motion } from "framer-motion";
import { X, CreditCard, Smartphone, Hash, Banknote, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { base44 } from "@/api/base44Client";

const methods = [
  { id: "mbway", label: "MB WAY", icon: Smartphone },
  { id: "multibanco", label: "Multibanco", icon: Hash },
  { id: "cartao", label: "Cartão", icon: CreditCard },
  { id: "numerario", label: "Numerário", icon: Banknote },
];

export default function PaymentModal({ items, total, tableNumber, onClose, onOrderPlaced }) {
  const [method, setMethod] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    if (!method) return;
    setLoading(true);
    await base44.entities.Order.create({
      table_number: tableNumber,
      items: items.map((i) => ({
        product_id: i.id,
        product_name: i.name,
        quantity: i.quantity,
        unit_price: i.price,
        total: i.total,
      })),
      total_amount: total,
      status: "pendente",
      payment_method: method,
      notes,
    });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      onOrderPlaced();
    }, 2500);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        onClick={!success ? onClose : undefined}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-card rounded-3xl p-6 border border-border max-w-md mx-auto"
      >
        {success ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
            >
              <CheckCircle2 className="w-16 h-16 text-primary" />
            </motion.div>
            <h2 className="font-playfair font-bold text-2xl">Pedido enviado!</h2>
            <p className="text-muted-foreground text-sm">
              O teu pedido foi recebido. Podes pagar na mesa ou ao balcão com {methods.find(m=>m.id===method)?.label}.
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-playfair font-semibold text-xl">Método de pagamento</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {methods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    method === m.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/50 hover:border-primary/40"
                  }`}
                >
                  <m.icon className={`w-6 h-6 ${method === m.id ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium ${method === m.id ? "text-primary" : "text-foreground"}`}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações (alergias, preferências...)"
              className="w-full bg-secondary border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none h-20 mb-5 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground text-sm">Total a pagar</span>
              <span className="font-playfair font-bold text-2xl text-primary">€{total.toFixed(2)}</span>
            </div>

            <button
              onClick={handleConfirm}
              disabled={!method || loading}
              className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-semibold text-base disabled:opacity-40 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              {loading ? "A processar..." : "Confirmar pedido"}
            </button>
          </>
        )}
      </motion.div>
    </>
  );
}