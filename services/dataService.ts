import { User, Customer, Order, Role, Branch, IceCreamItem, ToppingItem } from '../types';

// *** CẤU HÌNH API ***
// Thay thế URL dưới đây bằng Web App URL bạn nhận được khi deploy Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbxUu8EPOofL5lb3ohU-x8EQ1lhMK5cuke1zwBLHcZMWXbmZXhvaSTIyLpZ-ur2XD96L/exec'; 

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
            // Removed explicit Content-Type to allow browser to handle Simple Request (text/plain) automatically
            // This prevents CORS Preflight (OPTIONS) which Apps Script does not support well.
            body: JSON.stringify({ action, data })
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const text = await response.text();
        
        try {
            const json = JSON.parse(text);
            if (json.status === 'error') throw new Error(json.message);
            return json.data;
        } catch (e) {
            console.error("Invalid JSON response:", text);
            throw new Error("Lỗi dữ liệu từ Server. Vui lòng kiểm tra lại đường truyền hoặc Script.");
        }
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};

export const DataService = {
  // --- SYNC DATA ---
  syncWithSheet: async () => {
      try {
          const data = await callApi('GET_ALL_DATA');
          if (data) {
              // 1. Sync Users
              if (data.users && data.users.length > 0) {
                  // Normalize Roles just in case
                  const normalizedUsers = data.users.map((u: any) => ({
                      ...u,
                      role: u.role ? u.role.toLowerCase() : Role.STAFF
                  }));
                  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(normalizedUsers));
              }

              // 2. Sync Customers
              if (data.customers) {
                  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers));
              }

              // 3. Sync Orders
              if (data.orders) {
                  // Với cấu trúc Sheet mới, dữ liệu trả về đã chuẩn, chỉ cần đảm bảo items/toppings là mảng
                  const cleanOrders = data.orders.map((o: any) => ({
                      ...o,
                      id: String(o.id),
                      customerId: String(o.customerId),
                      items: Array.isArray(o.items) ? o.items : [],
                      toppings: Array.isArray(o.toppings) ? o.toppings : [],
                      hasInvoice: o.hasInvoice === true || o.hasInvoice === "TRUE"
                  }));
                  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(cleanOrders));
              }
              localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
              return true;
          }
          return false;
      } catch (e) {
          console.error("Sync failed", e);
          return false;
      }
  },

  // --- AUTH ---
  login: (username: string, password: string): User | null => {
    const users = DataService.getUsers();
    // Simple matching
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

  // --- USER MANAGEMENT (NEW) ---
  addUser: async (newUser: User) => {
      const users = DataService.getUsers();
      if (users.some(u => u.username === newUser.username)) {
          throw new Error("Tên đăng nhập đã tồn tại!");
      }
      users.push(newUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      
      try {
          await callApi('ADD_USER', newUser); // Requires backend support
      } catch (e) {
          console.error("Cloud save failed", e);
          throw new Error("Lỗi kết nối Server: Đã lưu offline, nhưng chưa đồng bộ lên Sheet.");
      }
  },

  updateUser: async (updatedUser: User) => {
      const users = DataService.getUsers();
      const index = users.findIndex(u => u.id === updatedUser.id);
      if (index !== -1) {
          users[index] = updatedUser;
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
          try {
             await callApi('UPDATE_USER', updatedUser); // Requires backend support
          } catch (e) {
              console.error("Cloud update failed", e);
               throw new Error("Lỗi kết nối Server: Đã cập nhật offline.");
          }
      }
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

    try {
        // Gửi nguyên object Order lên, Apps Script mới đã xử lý được cấu trúc này
        await callApi('ADD_ORDER', order);
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
