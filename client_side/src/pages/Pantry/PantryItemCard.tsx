// src/pages/Pantry/PantryItemCard.tsx
export default function PantryItemCard({ item }: any) {
  return (
    <div className="pantry-card">
      <h3>{item.ingredient?.name}</h3>
      <p>Quantity: {item.quantity} {item.unit}</p>
      <p>Expires: {item.expiry_date}</p>
    </div>
  );
}
