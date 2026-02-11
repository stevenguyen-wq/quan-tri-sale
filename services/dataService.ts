import { User, Customer, Order, Role, Branch, IceCreamItem, ToppingItem } from '../types';

// *** CẤU HÌNH API ***
// Thay thế URL dưới đây bằng Web App URL bạn nhận được khi deploy Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbydhDn2A9Z1aki3i08BQ4UkH0SsHGpbVSkro3z0w5JfHJtQmyMAOFW-SDC9Ie8cg3hF/exec'; 

const STORAGE_KEYS = {
  USERS: 'babyboss_users',
  CUSTOMERS: 'babyboss_customers',
  ORDERS: 'babyboss_orders',
  CURRENT_USER: 'babyboss_current_user',
  LAST_SYNC: 'babyboss_last_sync'
};

const DEFAULT_ADMIN: User = {
    id: 'admin_init',
    fullName: 'System Admin',
    phone: '0909000000',
    position: 'Administrator',
    username: 'admin',
    password: '123',
    role: Role.ADMIN,
    branch: Branch.HOI_SO
};

// Helper function to call Apps Script
const callApi = async (action: string, data: any = {}) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action, data })
        });
        const json = await response.json();
        if (json.status === 'error') throw new Error(json.message);
        return json.data;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};

// Helper: Ensure we always have an array, even if Sheet returns a stringified JSON
const safeParseArray = (input: any): any[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') {
        try {
            const parsed = JSON.parse(input);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.warn("Failed to parse array from string:", input);
            return [];
        }
    }
    return [];
};

// *** DATA MAPPING HELPER ***
// Chuyển đổi dữ liệu JSON từ Sheet (format cũ/khác) sang format App đang dùng
const mapSheetOrderToAppOrder = (sheetOrder: any, users: User[]): Order => {
    // 1. Map Creator
    // JSON Sheet dùng 'salesId', App dùng 'createdBy'
    const createdBy = sheetOrder.salesId || sheetOrder.createdBy || '';
    let createdByName = sheetOrder.createdByName || '';
    
    // Nếu Sheet chưa có tên người tạo, tìm trong danh sách User
    if (!createdByName && createdBy) {
        const u = users.find(user => user.id === createdBy);
        if (u) createdByName = u.fullName;
    }
    // Fallback nếu vẫn không có tên
    if (!createdByName) createdByName = sheetOrder.salesName || 'Unknown';

    // 2. Map Items (Ice Cream) - Sử dụng safeParseArray
    const rawIceCream = safeParseArray(sheetOrder.iceCreamItems);
    const rawDiscount = safeParseArray(sheetOrder.discountItems);
    
    const items: IceCreamItem[] = [
        ...rawIceCream.map((i: any) => ({
            id: i.id,
            line: i.line, // Pro/Pro Max
            size: i.size,
            flavor: i.flavor,
            quantity: Number(i.quantity || 0),
            price: Number(i.pricePerUnit !== undefined ? i.pricePerUnit : (i.price || 0)), // Ưu tiên pricePerUnit
            total: Number(i.total || 0),
            isGift: false
        })),
        ...rawDiscount.map((i: any) => ({
            id: i.id,
            line: i.line,
            size: i.size,
            flavor: i.flavor,
            quantity: Number(i.quantity || 0),
            price: Number(i.pricePerUnit !== undefined ? i.pricePerUnit : (i.price || 0)),
            total: Number(i.total || 0),
            isGift: true
        }))
    ];

    // 3. Map Toppings - Sử dụng safeParseArray
    const rawTopping = safeParseArray(sheetOrder.toppingItems);
    const rawGift = safeParseArray(sheetOrder.giftItems); 

    const toppings: ToppingItem[] = [
        ...rawTopping.map((i: any) => ({
            id: i.id,
            name: i.name,
            unit: i.unit || 'Cái',
            quantity: Number(i.quantity || 0),
            price: Number(i.pricePerUnit !== undefined ? i.pricePerUnit : (i.price || 0)),
            total: Number(i.total || 0),
            isGift: false
        })),
        ...rawGift.map((i: any) => ({
            id: i.id,
            name: i.name || i.flavor || 'Quà tặng',
            unit: i.unit || 'Cái',
            quantity: Number(i.quantity || 0),
            price: Number(i.pricePerUnit !== undefined ? i.pricePerUnit : (i.price || 0)),
            total: Number(i.total || 0),
            isGift: true
        }))
    ];

    return {
        id: String(sheetOrder.id),
        date: sheetOrder.date,
        customerId: String(sheetOrder.customerId),
        customerName: sheetOrder.customerName,
        companyName: sheetOrder.companyName,
        hasInvoice: Boolean(sheetOrder.hasInvoice),
        
        // Map Revenue Fields
        revenueIceCream: Number(sheetOrder.totalIceCreamRevenue || sheetOrder.revenueIceCream || 0),
        revenueTopping: Number(sheetOrder.totalToppingRevenue || sheetOrder.revenueTopping || 0),
        totalRevenue: Number(sheetOrder.totalRevenue || 0),
        
        shippingCost: Number(sheetOrder.shippingCost || 0),
        
        // Map Payment Fields
        totalPayment: Number(sheetOrder.finalAmount || sheetOrder.totalPayment || 0),
        deposit: Number(sheetOrder.depositAmount || sheetOrder.deposit || 0),
        
        items,
        toppings,
        createdBy,
        createdByName
    };
};


export const DataService = {
  // --- SYNC DATA ---
  syncWithSheet: async () => {
      try {
          const data = await callApi('GET_ALL_DATA');
          if (data) {
              // 1. Sync Users
              if (data.users && data.users.length > 0) {
                  // Normalize Roles (Sheet might have 'admin', 'Admin', 'ADMIN')
                  const normalizedUsers = data.users.map((u: any) => ({
                      ...u,
                      role: u.role ? u.role.toLowerCase() : Role.STAFF
                  }));
                  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(normalizedUsers));
              }

              // 2. Sync Customers
              if (data.customers) {
                  // Ensure customers createdBy matches valid user IDs if possible, or keep as is
                  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers));
              }

              // 3. Sync Orders (With Mapping)
              if (data.orders) {
                  const currentUsers = DataService.getUsers();
                  const mappedOrders = data.orders.map((rawOrder: any) => {
                      // Xử lý trường hợp rawOrder có thể là chuỗi JSON do lỗi parse ở GAS
                      let orderData = rawOrder;
                      if (typeof rawOrder === 'string') {
                          try { orderData = JSON.parse(rawOrder); } catch(e) {}
                      }
                      
                      return mapSheetOrderToAppOrder(orderData, currentUsers);
                  });
                  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(mappedOrders));
              }
              localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
              return true;
          }
      } catch (e) {
          console.error("Sync failed", e);
          return false;
      }
  },

  // --- AUTH ---
  login: (username: string, password: string): User | null => {
    const users = DataService.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return stored ? JSON.parse(stored) : null;
  },

  getUsers: (): User[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    const users = stored ? JSON.parse(stored) : [];
    if (users.length === 0) return [DEFAULT_ADMIN];
    return users;
  },

  // --- CUSTOMERS ---
  getCustomers: (): Customer[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return stored ? JSON.parse(stored) : [];
  },

  addCustomer: async (customer: Customer) => {
    const customers = DataService.getCustomers();
    customers.push(customer);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    try {
        await callApi('ADD_CUSTOMER', customer);
    } catch (e) {
        alert("Lỗi lưu khách hàng lên Google Sheet! Dữ liệu chỉ được lưu tạm trên máy.");
    }
  },

  updateCustomer: async (updatedCustomer: Customer) => {
    const customers = DataService.getCustomers();
    const index = customers.findIndex(c => c.id === updatedCustomer.id);
    if (index !== -1) {
        customers[index] = updatedCustomer;
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
        try {
            await callApi('UPDATE_CUSTOMER', updatedCustomer);
        } catch (e) {
            alert("Lỗi cập nhật lên Google Sheet!");
        }
    }
  },

  // --- ORDERS ---
  getOrders: (): Order[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return stored ? JSON.parse(stored) : [];
  },

  addOrder: async (order: Order) => {
    const orders = DataService.getOrders();
    orders.push(order);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    // Convert App Order back to Sheet Structure (Map props correctly)
    const apiPayload = {
        ...order,
        salesId: order.createdBy, // Map createdBy -> salesId
        
        // Ensure arrays are arrays
        iceCreamItems: order.items.filter(i => !i.isGift),
        discountItems: order.items.filter(i => i.isGift),
        toppingItems: order.toppings.filter(i => !i.isGift),
        giftItems: order.toppings.filter(i => i.isGift),
        
        // Map Totals
        totalIceCreamRevenue: order.revenueIceCream,
        totalToppingRevenue: order.revenueTopping,
        finalAmount: order.totalPayment,
        depositAmount: order.deposit
    };

    try {
        await callApi('ADD_ORDER', apiPayload);
    } catch (e) {
        alert("Lỗi lưu đơn hàng lên Google Sheet! Dữ liệu chỉ được lưu tạm trên máy.");
    }
  },

  // --- PERMISSIONS ---
  
  getCustomersForUser: (user: User): Customer[] => {
    const all = DataService.getCustomers();
    
    // 1. ADMIN: Xem toàn bộ khách hàng
    if (user.role === Role.ADMIN) {
      return all;
    }

    // 2. MANAGER: Xem khách hàng của toàn bộ nhân viên trong Chi Nhánh
    if (user.role === Role.MANAGER) {
      const users = DataService.getUsers();
      const branchUserIds = users
        .filter(u => u.branch === user.branch && u.role !== Role.ADMIN)
        .map(u => u.id);
      
      // Add self
      if (!branchUserIds.includes(user.id)) branchUserIds.push(user.id);

      return all.filter(c => branchUserIds.includes(c.createdBy));
    }

    // 3. STAFF: Chỉ xem khách hàng do chính mình tạo
    return all.filter(c => c.createdBy === user.id);
  },

  getOrdersForUser: (user: User): Order[] => {
    const all = DataService.getOrders();
    
    // 1. ADMIN: Xem toàn bộ đơn hàng
    if (user.role === Role.ADMIN) {
      return all;
    }

    // 2. MANAGER: Xem đơn hàng của toàn bộ nhân viên trong Chi Nhánh
    if (user.role === Role.MANAGER) {
       const users = DataService.getUsers();
       const branchUserIds = users
         .filter(u => u.branch === user.branch && u.role !== Role.ADMIN)
         .map(u => u.id);
       
       if (!branchUserIds.includes(user.id)) branchUserIds.push(user.id);

       return all.filter(o => branchUserIds.includes(o.createdBy));
    }

    // 3. STAFF: Chỉ xem đơn hàng do chính mình tạo
    return all.filter(o => o.createdBy === user.id);
  }
};