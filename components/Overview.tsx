import React, { useMemo, useState } from 'react';
import { User, Order, Role, Branch } from '../types';
import { DataService } from '../services/dataService';
import { TrendingUp, ShoppingCart, Users, DollarSign, Calendar, Award, Star, Clock, User as UserIcon, Phone, Briefcase, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  user: User;
}

const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

export const Overview: React.FC<Props> = ({ user }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [showAllEmployees, setShowAllEmployees] = useState(false);
  const [showAllCustomers, setShowAllCustomers] = useState(false);
  const [showAllStaffCustomers, setShowAllStaffCustomers] = useState(false);

  // Get relevant data
  const orders = DataService.getOrdersForUser(user);
  const customers = DataService.getCustomersForUser(user);
  const allUsers = DataService.getUsers();
  
  const directManager = useMemo(() => {
      if (user.role === Role.ADMIN) return "N/A";
      if (user.role === Role.MANAGER) return "Ban Giám Đốc";
      const manager = allUsers.find(u => u.branch === user.branch && u.role === Role.MANAGER);
      return manager ? manager.fullName : "Chưa cập nhật";
  }, [user, allUsers]);

  // Manager specific: Count managed staff
  const managedStaffCount = useMemo(() => {
      if (user.role !== Role.MANAGER) return 0;
      return allUsers.filter(u => u.branch === user.branch && u.role === Role.STAFF).length;
  }, [user, allUsers]);

  // Calculate Stats
  const stats = useMemo(() => {
    const now = new Date();
    const filteredOrders = orders.filter(o => {
        const d = new Date(o.date);
        if (timeRange === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (timeRange === 'year') return d.getFullYear() === now.getFullYear();
        // Week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return d >= oneWeekAgo;
    });

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalRevenue, 0);
    const totalOrders = filteredOrders.length;
    
    // Group Revenue by Date for Chart
    const revenueByDate: Record<string, number> = {};
    const dates: string[] = [];

    if (timeRange === 'week' || timeRange === 'month') {
        filteredOrders.forEach(o => {
            const dateStr = new Date(o.date).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'});
            revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + o.totalRevenue;
        });
        Object.keys(revenueByDate).sort().forEach(k => dates.push(k));
    } else {
        filteredOrders.forEach(o => {
            const dateStr = new Date(o.date).toLocaleDateString('vi-VN', {month: '2-digit', year: 'numeric'});
            revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + o.totalRevenue;
        });
        Object.keys(revenueByDate).sort().forEach(k => dates.push(k));
    }

    const chartData = dates.map(d => ({ label: d, value: revenueByDate[d] }));
    const maxVal = Math.max(...chartData.map(d => d.value), 1); 

    // --- Leaderboards ---
    let topEmployees: any[] = [];
    let topCustomers: any[] = [];
    let latestOrders: Order[] = [];
    let staffTopCustomers: any[] = [];

    if (user.role === Role.ADMIN || user.role === Role.MANAGER) {
        const empMap: Record<string, any> = {};
        filteredOrders.forEach(o => {
            if (!empMap[o.createdBy]) empMap[o.createdBy] = { totalRevenue: 0, totalOrders: 0 };
            empMap[o.createdBy].totalRevenue += o.totalRevenue;
            empMap[o.createdBy].totalOrders += 1;
        });

        topEmployees = Object.entries(empMap)
            .map(([id, s]) => {
                const u = allUsers.find(foundUser => foundUser.id === id);
                return { name: u?.fullName || 'Unknown', branch: u?.branch || '', role: u?.role, ...s };
            })
            .filter(e => user.role === Role.ADMIN ? true : e.role !== Role.ADMIN)
            .sort((a, b) => b.totalRevenue - a.totalRevenue);
            // Removed .slice(0, 5) to allow pagination

        const custMap: Record<string, any> = {};
        filteredOrders.forEach(o => {
            if (!custMap[o.customerId]) custMap[o.customerId] = { name: o.customerName, pic: o.createdByName, totalRevenue: 0, totalOrders: 0 };
            custMap[o.customerId].totalRevenue += o.totalRevenue;
            custMap[o.customerId].totalOrders += 1;
        });

        topCustomers = Object.values(custMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
        // Removed .slice(0, 5) to allow pagination

        // Logic for Latest Orders (Global for Admin, Branch for Manager)
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        threeDaysAgo.setHours(0,0,0,0);
        
        // For 'latestOrders', we want to check ALL orders permitted to the user, not just the filtered ones by time range
        latestOrders = orders
            .filter(o => new Date(o.date) >= threeDaysAgo)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    } else if (user.role === Role.STAFF) {
        const currentMonthOrders = orders.filter(o => {
            const d = new Date(o.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const custMap: Record<string, any> = {};
        currentMonthOrders.forEach(o => {
             if (!custMap[o.customerId]) custMap[o.customerId] = { name: o.customerName, totalRevenue: 0, totalOrders: 0 };
            custMap[o.customerId].totalRevenue += o.totalRevenue;
            custMap[o.customerId].totalOrders += 1;
        });
        staffTopCustomers = Object.values(custMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
        // Removed .slice(0, 5) to allow pagination
    }

    return { totalRevenue, totalOrders, chartData, maxVal, topEmployees, topCustomers, latestOrders, staffTopCustomers };
  }, [orders, timeRange, user.role, allUsers]);

  const StatCard = ({ icon: Icon, label, value, colorClass, gradientClass }: any) => (
    <div className={`
        relative overflow-hidden
        bg-white p-6 rounded-2xl shadow-lg border border-gray-100 
        flex items-center gap-5 
        hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group
    `}>
        {/* Abstract Background Shape */}
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-20 blur-xl ${gradientClass}`}></div>

        <div className={`p-4 rounded-2xl text-white shadow-md ${gradientClass} group-hover:scale-110 transition-transform duration-300`}>
            <Icon size={28} />
        </div>
        <div className="z-10">
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">{label}</p>
            <h4 className={`text-3xl font-extrabold ${colorClass} mt-1`}>{value}</h4>
        </div>
    </div>
  );

  const getTimeLabel = () => {
      const now = new Date();
      if (timeRange === 'week') return "Tuần này";
      if (timeRange === 'month') return `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
      return `Năm ${now.getFullYear()}`;
  }

  const ToggleButton = ({ expanded, setExpanded }: { expanded: boolean, setExpanded: (v: boolean) => void }) => (
      <div className="p-3 border-t border-gray-50 bg-gray-50/50 text-center">
          <button 
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-bold text-baby-navy hover:text-blue-600 transition-colors uppercase tracking-wider flex items-center justify-center gap-1 mx-auto"
          >
              {expanded ? 'Thu gọn' : 'Xem thêm'}
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
      </div>
  );

  return (
    <div className="animate-fade-in p-2">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h2 className="text-3xl font-extrabold text-baby-navy tracking-tight">Tổng quan</h2>
                <p className="text-gray-500 font-medium">Xin chào, {user.fullName}!</p>
            </div>
            <div className="bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm flex overflow-x-auto max-w-full">
                {(['week', 'month', 'year'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTimeRange(t)}
                        className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                            timeRange === t 
                            ? 'bg-baby-navy text-white shadow-md transform scale-105' 
                            : 'text-gray-500 hover:bg-gray-100 hover:text-baby-navy'
                        }`}
                    >
                        {t === 'week' ? 'Tuần này' : t === 'month' ? 'Tháng này' : 'Năm nay'}
                    </button>
                ))}
            </div>
        </div>

        {/* Profile Card (Staff & Manager) */}
        {(user.role === Role.STAFF || user.role === Role.MANAGER) && (
            <div className="bg-gradient-to-r from-white to-blue-50/50 p-6 rounded-2xl shadow-md border border-blue-100 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-baby-pink/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <h3 className="font-bold text-baby-navy mb-5 flex items-center gap-2 border-b border-blue-100 pb-3 relative z-10">
                    <UserIcon size={20} className="text-baby-pink" /> Thông tin cá nhân
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow text-blue-500 border border-blue-100"><UserIcon size={18}/></div>
                        <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Họ và tên</span>
                            <span className="font-bold text-gray-800 text-base">{user.fullName}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow text-green-500 border border-green-100"><Phone size={18}/></div>
                        <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Số điện thoại</span>
                            <span className="font-bold text-gray-800 text-base">{user.phone}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow text-purple-500 border border-purple-100"><Briefcase size={18}/></div>
                        <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Chức vụ</span>
                            <span className="font-bold text-gray-800 text-base">{user.position}</span>
                        </div>
                    </div>
                    
                    {/* Role Specific Field */}
                    {user.role === Role.MANAGER ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow text-orange-500 border border-orange-100"><Users size={18}/></div>
                            <div>
                                <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">NV đang quản lý</span>
                                <span className="font-bold text-baby-navy text-base">{managedStaffCount} nhân viên</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow text-orange-500 border border-orange-100"><Users size={18}/></div>
                            <div>
                                <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Quản lý trực tiếp</span>
                                <span className="font-bold text-baby-navy text-base">{directManager}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 lg:col-span-4 border-t pt-4 mt-2">
                        <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow text-red-500 border border-red-100"><MapPin size={18}/></div>
                        <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Chi nhánh làm việc</span>
                            <span className="font-bold text-gray-800 text-base">{user.branch}</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard 
                icon={DollarSign} 
                label={`Doanh thu (${getTimeLabel()})`}
                value={formatCurrency(stats.totalRevenue)} 
                colorClass="text-green-600"
                gradientClass="bg-gradient-to-br from-green-400 to-green-600"
            />
            <StatCard 
                icon={ShoppingCart} 
                label={`Đơn hàng (${getTimeLabel()})`}
                value={stats.totalOrders} 
                colorClass="text-baby-navy"
                gradientClass="bg-gradient-to-br from-blue-500 to-baby-navy"
            />
            <StatCard 
                icon={Users} 
                label="Khách hàng phụ trách" 
                value={customers.length} 
                colorClass="text-pink-600"
                gradientClass="bg-gradient-to-br from-pink-400 to-rose-500"
            />
        </div>

        {/* Admin Specific: Latest Orders (Top) */}
        {user.role === Role.ADMIN && (
             <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 rounded-xl text-green-600">
                        <Clock size={24} />
                    </div>
                    <h3 className="font-bold text-xl text-gray-800">Đơn hàng mới nhất (3 ngày qua)</h3>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[600px]">
                        <thead>
                            <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                                <th className="p-3">Ngày</th>
                                <th className="p-3">Khách hàng</th>
                                <th className="p-3 text-right">Giá trị đơn</th>
                                <th className="p-3 text-right">Người tạo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.latestOrders.map((order) => (
                                <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-green-50/30 transition-colors">
                                    <td className="p-3 font-medium text-baby-navy">{new Date(order.date).toLocaleDateString('vi-VN')}</td>
                                    <td className="p-3 font-bold text-gray-700">{order.customerName}</td>
                                    <td className="p-3 text-right font-bold text-green-700">{formatCurrency(order.totalRevenue)}</td>
                                    <td className="p-3 text-right text-xs text-gray-500 italic">{order.createdByName}</td>
                                </tr>
                            ))}
                            {stats.latestOrders.length === 0 && (
                                <tr><td colSpan={4} className="p-6 text-center text-gray-400 italic">Không có đơn hàng mới nào trong 3 ngày qua</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Staff Specific: Top Customers Table */}
        {user.role === Role.STAFF && (
             <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 rounded-xl text-purple-600 shadow-inner">
                        <Star size={24} />
                    </div>
                    <h3 className="font-bold text-xl text-gray-800">Xếp hạng doanh số Khách hàng (Tháng này)</h3>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[400px]">
                        <thead>
                            <tr className="border-b-2 border-gray-100 text-gray-400 text-left uppercase text-xs tracking-wider">
                                <th className="pb-4 font-semibold pl-2">#</th>
                                <th className="pb-4 font-semibold">Khách hàng</th>
                                <th className="pb-4 font-semibold text-center">Đơn hàng</th>
                                <th className="pb-4 font-semibold text-right pr-2">Tổng doanh số</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.staffTopCustomers.slice(0, showAllStaffCustomers ? undefined : 5).map((cust, idx) => (
                                <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-purple-50/50 transition-colors">
                                    <td className="py-4 pl-2 font-bold text-gray-300 text-lg">0{idx + 1}</td>
                                    <td className="py-4 font-bold text-baby-navy text-base">{cust.name}</td>
                                    <td className="py-4 text-center">
                                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">{cust.totalOrders}</span>
                                    </td>
                                    <td className="py-4 text-right pr-2 font-bold text-green-600 text-base">{formatCurrency(cust.totalRevenue)}</td>
                                </tr>
                            ))}
                            {stats.staffTopCustomers.length === 0 && (
                                <tr><td colSpan={4} className="py-8 text-center text-gray-400 italic">Chưa có dữ liệu tháng này</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {stats.staffTopCustomers.length > 5 && (
                    <ToggleButton expanded={showAllStaffCustomers} setExpanded={setShowAllStaffCustomers} />
                )}
            </div>
        )}

        {/* Revenue Chart (CSS Bar Chart) */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-x-auto hover:shadow-xl transition-shadow duration-300">
            <div className="min-w-[600px]">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-blue-50 rounded-lg text-baby-navy">
                        <TrendingUp size={24} />
                    </div>
                    <h3 className="font-bold text-xl text-gray-800">Biểu đồ doanh thu - {getTimeLabel()}</h3>
                </div>
                
                <div className="h-72 flex items-end justify-between gap-4 pb-2 border-b border-gray-100">
                    {stats.chartData.length > 0 ? (
                        stats.chartData.map((d, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end">
                                <div className="relative w-full flex justify-center h-full items-end">
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-1 bg-gray-800 text-white text-xs py-1.5 px-3 rounded-lg whitespace-nowrap z-10 pointer-events-none shadow-lg">
                                        {formatCurrency(d.value)}
                                        <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                    {/* Bar */}
                                    <div 
                                        className="w-full max-w-[40px] bg-gradient-to-t from-baby-navy to-blue-400 rounded-t-lg group-hover:from-baby-pink group-hover:to-pink-400 transition-all duration-500 ease-out shadow-sm relative overflow-hidden"
                                        style={{ height: d.value > 0 ? `${(d.value / stats.maxVal) * 100}%` : '4px' }}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </div>
                                </div>
                                <div className="text-[10px] font-medium text-gray-400 mt-3 truncate w-full text-center group-hover:text-baby-navy transition-colors">{d.label}</div>
                            </div>
                        ))
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 font-medium italic">
                            Chưa có dữ liệu cho khoảng thời gian này
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Leaderboards & Latest Orders for Admin/Manager */}
        {(user.role === Role.ADMIN || user.role === Role.MANAGER) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Employee Leaderboard */}
                <div className="bg-white p-0 rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow flex flex-col h-full">
                    <div className="p-6 pb-0 flex items-center gap-3 mb-6">
                        <div className="p-2 bg-yellow-50 rounded-xl text-yellow-600">
                            <Award size={24} />
                        </div>
                        <h3 className="font-bold text-lg text-gray-800">Bảng xếp hạng Nhân viên ({getTimeLabel()})</h3>
                    </div>
                    
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-sm min-w-[400px]">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-400 text-left uppercase text-xs tracking-wider">
                                    <th className="pb-3 font-semibold pl-6">#</th>
                                    <th className="pb-3 font-semibold">Nhân viên</th>
                                    <th className="pb-3 font-semibold text-center">Đơn</th>
                                    <th className="pb-3 font-semibold text-right pr-6">Doanh thu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.topEmployees.slice(0, showAllEmployees ? undefined : 5).map((emp, idx) => (
                                    <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-yellow-50/30 transition-colors">
                                        <td className="py-3 pl-6 font-bold text-gray-300">0{idx + 1}</td>
                                        <td className="py-3">
                                            <div className="font-bold text-gray-800">{emp.name}</div>
                                            <div className="text-[10px] text-gray-400 uppercase">{emp.branch}</div>
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{emp.totalOrders}</span>
                                        </td>
                                        <td className="py-3 text-right pr-6 font-bold text-green-600">{formatCurrency(emp.totalRevenue)}</td>
                                    </tr>
                                ))}
                                {stats.topEmployees.length === 0 && (
                                    <tr><td colSpan={4} className="py-6 text-center text-gray-400 italic">Chưa có dữ liệu</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {stats.topEmployees.length > 5 && (
                        <ToggleButton expanded={showAllEmployees} setExpanded={setShowAllEmployees} />
                    )}
                </div>

                 {/* Customer Leaderboard */}
                 <div className="bg-white p-0 rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow flex flex-col h-full">
                    <div className="p-6 pb-0 flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                            <Star size={24} />
                        </div>
                        <h3 className="font-bold text-lg text-gray-800">Bảng xếp hạng Khách hàng ({getTimeLabel()})</h3>
                    </div>
                    
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-sm min-w-[400px]">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-400 text-left uppercase text-xs tracking-wider">
                                    <th className="pb-3 font-semibold pl-6">Khách hàng</th>
                                    <th className="pb-3 font-semibold">Phụ trách</th>
                                    <th className="pb-3 font-semibold text-center">Đơn</th>
                                    <th className="pb-3 font-semibold text-right pr-6">Giá trị</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.topCustomers.slice(0, showAllCustomers ? undefined : 5).map((cust, idx) => (
                                    <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-purple-50/30 transition-colors">
                                        <td className="py-3 pl-6 font-bold text-baby-navy">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-300 font-normal w-5">0{idx + 1}</span>
                                                {cust.name}
                                            </div>
                                        </td>
                                        <td className="py-3 text-gray-500 text-xs">{cust.pic}</td>
                                        <td className="py-3 text-center">
                                            <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-bold">{cust.totalOrders}</span>
                                        </td>
                                        <td className="py-3 text-right pr-6 font-bold text-gray-800">{formatCurrency(cust.totalRevenue)}</td>
                                    </tr>
                                ))}
                                {stats.topCustomers.length === 0 && (
                                    <tr><td colSpan={4} className="py-6 text-center text-gray-400 italic">Chưa có dữ liệu</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {stats.topCustomers.length > 5 && (
                        <ToggleButton expanded={showAllCustomers} setExpanded={setShowAllCustomers} />
                    )}
                </div>
            </div>
        )}
    </div>
  );
};