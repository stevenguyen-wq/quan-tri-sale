
export enum Role {
  STAFF = 'staff',
  MANAGER = 'manager',
  ADMIN = 'admin'
}

export enum Branch {
  HOI_SO = 'Baby Boss Hội sở',
  MIEN_BAC = 'Baby Boss miền Bắc'
}

export interface User {
  id: string;
  fullName: string;
  phone: string;
  position: string;
  username: string;
  password: string;
  role: Role;
  branch: Branch;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  position: string;
  phone: string;
  email: string;
  address: string;
  note?: string; // Ghi chú
  repName?: string;
  repPhone?: string;
  repPosition?: string;
  createdBy: string; // User ID
  createdByName: string;
  createdAt: string;
}

export type IceCreamLine = 'Pro' | 'Pro Max' | 'PRO' | 'PROMAX'; // Support both casing

export interface IceCreamItem {
  id?: string;
  line: IceCreamLine;
  size: string;
  flavor: string;
  quantity: number;
  price: number;
  total: number;
  isGift?: boolean; 
}

export interface ToppingItem {
  id?: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
  isGift?: boolean; 
}

export interface Order {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  companyName: string;
  
  items: IceCreamItem[];     // Merged from iceCreamItems + discountItems
  toppings: ToppingItem[];   // Merged from toppingItems + giftItems
  
  hasInvoice: boolean;
  
  revenueIceCream: number; // Mapped from totalIceCreamRevenue
  revenueTopping: number;  // Mapped from totalToppingRevenue
  totalRevenue: number;    
  
  shippingCost: number;    
  totalPayment: number;    // Mapped from finalAmount
  deposit: number;         // Mapped from depositAmount

  createdBy: string;       // Mapped from salesId
  createdByName: string;
}