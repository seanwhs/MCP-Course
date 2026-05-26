// shopping-list-service.ts
import { randomUUID } from 'crypto';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  purchased: boolean;
}

export class ShoppingListService{
  private items: ShoppingItem[];

  constructor() {
    this.items = [
      { id: randomUUID(), name: "Milk", quantity: 2, purchased: true },
      { id: randomUUID(), name: "Bread", quantity: 1, purchased: false },
      { id: randomUUID(), name: "Eggs", quantity: 12, purchased: true },
      { id: randomUUID(), name: "Apples", quantity: 6, purchased: false },
      { id: randomUUID(), name: "Coffee", quantity: 1, purchased: false }
    ];
  }

  getItems(purchased?: boolean): ShoppingItem[] {
    if (purchased === undefined) {
      return [...this.items];
    }
    return this.items.filter(item => item.purchased === purchased);
  }

  addItem(name: string, quantity: number): ShoppingItem {
    const newItemId = randomUUID();
    const newItem: ShoppingItem = {
      id: newItemId,
      name,
      quantity,
      purchased: false
    };
    this.items.push(newItem);
    return newItem;
  }

  removeItem(itemId: string): boolean {
    const index = this.items.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }

  setPurchased(itemId: string, purchased: boolean = true): boolean {
    const item = this.items.find(item => item.id === itemId);
    if (item) {
      item.purchased = purchased;
      return true;
    }
    return false;
  }
}