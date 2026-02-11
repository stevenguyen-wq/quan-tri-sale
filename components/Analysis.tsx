import React, { useState, useMemo } from 'react';
import { User, Order, Branch, Role } from '../types';
import { DataService } from '../services/dataService';
import { ArrowLeft, TrendingUp, BarChart2, Map, Users, MapPin } from 'lucide-react';
import { Select } from './Input';

interface Props {
  user: User;
  onBack: () => void;
}

export const Analysis: React.FC<Props> = ({ user, onBack }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [branchFilter, setBranchFilter] = useState<string>('');

  // Use getOrdersForUser to respect permissions for Sales stats
  const availableOrders = DataService.getOrdersForUser(user); 
  
  // Get customers scoped by permissions
  const scopedCustomers = DataService.getCustomersForUser(user);
  const users = DataService.getUsers();

  const stats = useMemo(() => {
    // 1. Filter Orders by Time
    const now = new Date();
    let filteredOrders = availableOrders.filter(o => {
        const d = new Date(o.date);
        if (timeRange === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (timeRange === 'year') return d.getFullYear() === now.getFullYear();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return d >= oneWeekAgo;
    });

    // 2. Filter Orders by Branch (Only Admin can use branchFilter dropdown)
    if (user.role === Role.ADMIN && branchFilter) {
        const userIdsInBranch = users.filter(u => u.branch === branchFilter).map(u => u.id);
        filteredOrders = filteredOrders.filter(o => userIdsInBranch.includes(o.createdBy));
    }

    // 3. Aggregate Flavors (EXCLUDE GIFTS)
    const flavorCounts: Record<string, number> = {};
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            // Only count items that are NOT gifts
            if (!item.isGift && item.flavor && item.quantity) {
                flavorCounts[item.flavor] = (flavorCounts[item.flavor] || 0) + item.quantity;
            }
        });
    });

    const topFlavors = Object.entries(flavorCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // 4. Aggregate Toppings (EXCLUDE GIFTS)
    const toppingCounts: Record<string, number> = {};
    filteredOrders.forEach(order => {
        order.toppings.forEach(item => {
             // Only count items that are NOT gifts
            if (!item.isGift && item.name && item.quantity) {
                toppingCounts[item.name] = (toppingCounts[item.name] || 0) + item.quantity;
            }
        });
    });

    const topToppings = Object.entries(toppingCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // 5. Aggregate Provinces (Admin & Manager)
    let provinceStats: { name: string, count: number }[] = [];
    let totalProvinces = 0;
    let totalPartners = 0;

    if (user.role === Role.ADMIN || user.role === Role.MANAGER) {
        // Determine source customers based on role and branch filter (for Admin)
        let targetCustomers = scopedCustomers;
        
        if (user.role === Role.ADMIN && branchFilter) {
             const userIdsInBranch = users.filter(u => u.branch === branchFilter).map(u => u.id);
             targetCustomers = targetCustomers.filter(c => userIdsInBranch.includes(c.createdBy));
        }

        totalPartners = targetCustomers.length;
        const provinceCounts: Record<string, number> = {};
        
        targetCustomers.forEach(customer => {
            // Address format assumption: "Street, Ward, District, City"
            // We try to take the last part of the address string
            const parts = customer.address.split(',');
            if (parts.length > 0) {
                const city = parts[parts.length - 1].trim();
                provinceCounts[city] = (provinceCounts[city] || 0) + 1;
            }
        });
        
        provinceStats = Object.entries(provinceCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
            
        totalProvinces = provinceStats.length;
    }

    return { topFlavors, topToppings, provinceStats, totalProvinces, totalPartners };
  }, [availableOrders, timeRange, branchFilter, users, user.role, scopedCustomers]);

  if (user.role === Role.STAFF) {
      return (
          <div className="p-8 text-center text-red-500">
              Bạn không có quyền truy cập trang này.
              <button onClick={onBack} className="block mx-auto mt-4 text-blue-500 underline">Quay lại</button>
          </div>
      );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md min-h-screen text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-baby-navy p-4 rounded-lg shadow">
        <div className="flex items-center gap-2 text-white">
            <button onClick={onBack} className="text-white hover:text-baby-pink">
                <ArrowLeft size={24} />
            </button>
            <h2 className="text-2xl font-bold">Phân tích hành vi & Thị trường</h2>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
            {user.role === Role.ADMIN && (
                <Select 
                    className="w-48"
                    options={[
                        { value: Branch.HOI_SO, label: Branch.HOI_SO },
                        { value: Branch.MIEN_BAC, label: Branch.MIEN_BAC }
                    ]}
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    placeholder="-- Toàn hệ thống --"
                />
            )}
            {user.role === Role.MANAGER && (
                <div className="px-4 py-2 bg-white/10 rounded text-sm font-medium text-white border border-white/20">
                    <span className="text-gray-300 text-xs uppercase mr-2">Khu vực:</span>
                    {user.branch}
                </div>
            )}
             <div className="flex bg-white/20 rounded-lg p-1">
                {(['week', 'month', 'year'] as const).map(t => (
                    <button 
                        key={t}
                        onClick={() => setTimeRange(t)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${timeRange === t ? 'bg-baby-pink text-baby-navy shadow-sm font-bold' : 'text-white hover:bg-white/10'}`}
                    >
                        {t === 'week' ? 'Tuần' : t === 'month' ? 'Tháng' : 'Năm'}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Top Flavors */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-blue-100 rounded-full text-baby-navy">
                      <TrendingUp size={20}/>
                  </div>
                  <h3 className="font-bold text-lg text-baby-navy">Top 5 Vị Kem Bán Chạy (Đã trừ hàng tặng)</h3>
              </div>
              
              {stats.topFlavors.length > 0 ? (
                  <div className="space-y-4">
                      {stats.topFlavors.map((item, idx) => (
                          <div key={idx} className="relative">
                              <div className="flex justify-between text-sm mb-1 font-medium">
                                  <span>#{idx + 1} {item.name}</span>
                                  <span className="text-blue-700">{item.count} hộp</span>
                              </div>
                              <div className="w-full bg-blue-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${(item.count / stats.topFlavors[0].count) * 100}%` }}
                                  ></div>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="text-center text-gray-500 py-8 italic">Chưa có dữ liệu bán hàng</div>
              )}
          </div>

          {/* Top Toppings */}
          <div className="bg-pink-50 rounded-xl p-6 border border-pink-100">
              <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-pink-100 rounded-full text-baby-navy">
                      <BarChart2 size={20}/>
                  </div>
                  <h3 className="font-bold text-lg text-baby-navy">Top 5 Topping/Dụng Cụ Bán Kèm</h3>
              </div>

              {stats.topToppings.length > 0 ? (
                  <div className="space-y-4">
                      {stats.topToppings.map((item, idx) => (
                          <div key={idx} className="relative">
                              <div className="flex justify-between text-sm mb-1 font-medium">
                                  <span>#{idx + 1} {item.name}</span>
                                  <span className="text-pink-700">{item.count}</span>
                              </div>
                              <div className="w-full bg-pink-200 rounded-full h-2">
                                  <div 
                                    className="bg-pink-600 h-2 rounded-full" 
                                    style={{ width: `${(item.count / stats.topToppings[0].count) * 100}%` }}
                                  ></div>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="text-center text-gray-500 py-8 italic">Chưa có dữ liệu bán hàng</div>
              )}
          </div>
      </div>

      {/* Admin/Manager Province Analysis */}
      {(user.role === Role.ADMIN || user.role === Role.MANAGER) && (
          <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 rounded-full text-baby-navy">
                            <Map size={20}/>
                        </div>
                        <h3 className="font-bold text-lg text-baby-navy">Phân bố khách hàng & Thị trường</h3>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 rounded-full text-indigo-700">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Đã có mặt tại</div>
                            <div className="text-2xl font-bold text-baby-navy">{stats.totalProvinces} <span className="text-sm font-normal text-gray-500">Tỉnh/Thành</span></div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 rounded-full text-indigo-700">
                            <Users size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Tổng đối tác/Đại lý</div>
                            <div className="text-2xl font-bold text-baby-navy">{stats.totalPartners} <span className="text-sm font-normal text-gray-500">Khách hàng</span></div>
                        </div>
                    </div>
                </div>
              
                <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Chi tiết phân bố (Theo địa chỉ khách hàng)</h4>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="max-h-80 overflow-y-auto overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[500px]">
                            <thead className="bg-gray-50 text-gray-600 sticky top-0">
                                <tr>
                                    <th className="p-3 font-medium">Tỉnh / Thành phố</th>
                                    <th className="p-3 font-medium text-right">Số lượng Đlý</th>
                                    <th className="p-3 font-medium text-right">Tỷ trọng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.provinceStats.map((prov, idx) => (
                                    <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-3 font-medium text-gray-800">{prov.name}</td>
                                        <td className="p-3 text-right font-bold text-baby-navy">{prov.count}</td>
                                        <td className="p-3 text-right text-gray-500">
                                            {stats.totalPartners > 0 ? ((prov.count / stats.totalPartners) * 100).toFixed(1) : 0}%
                                        </td>
                                    </tr>
                                ))}
                                {stats.provinceStats.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-gray-400 italic">Chưa có dữ liệu khách hàng</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
          </div>
      )}
    </div>
  );
};