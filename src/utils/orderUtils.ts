// src/utils/orderUtils.ts
import { OrderItem } from '../types';

export function calculateTotal(items: OrderItem[]): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function formatCurrency(amount: number): string {
  return `${amount.toFixed(2)} TL`;
}

// Adisyon'dan gelen fonksiyonları burada birebir kullanabiliriz
// Örneğin: vergi ekleme, indirim uygulama
export function applyTax(total: number, taxRate: number = 0.18): number {
  return total * (1 + taxRate);
}

export function applyDiscount(total: number, discount: number): number {
  return total - discount;
}
