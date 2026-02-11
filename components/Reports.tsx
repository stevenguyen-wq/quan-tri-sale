import React, { useMemo, useState, useEffect } from 'react';
import { User, Customer, Order, Role, Branch } from '../types';
import { DataService } from '../services/dataService';
import { ArrowLeft, Filter, User as UserIcon, Package, Phone, Building2, MapPin, Briefcase, Printer, X, Edit2, Save, Download, StickyNote, Eye, ChevronRight, Calendar, DollarSign, TrendingUp, Plus, Search } from 'lucide-react';
import { Select, Input } from './Input';
import { Button } from './Button';

export interface ReportProps {
  user: User;
  onBack: () => void;
  onAddCustomer?: () => void;
}

interface LocationOption {
    code: number;
    name: string;
}

interface OrderDetailModalProps {
    order: Order;
    user: User;
    onClose: () => void;
}

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, user, onClose }) => {
    const customer = DataService.getCustomers().find(c => c.id === order.customerId);
    const [isExporting, setIsExporting] = useState(false);
    
    // Ensure items/toppings are arrays to prevent crashes on bad data
    const safeItems = Array.isArray(order.items) ? order.items : [];
    const safeToppings = Array.isArray(order.toppings) ? order.toppings : [];

    // --- 1. Filter Items ---
    const soldIceCreams = safeItems.filter(i => !i.isGift);
    const soldToppings = safeToppings.filter(i => !i.isGift);
    
    const discountIceCreams = safeItems.filter(i => i.isGift);
    const giftToppings = safeToppings.filter(i => i.isGift);
    
    // --- 2. Calculate Totals ---
    const totalQtySold = soldIceCreams.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const totalAmountSold = order.revenueIceCream || 0; 

    const totalAmountToppings = order.revenueTopping || 0; 

    const totalQtyGift = discountIceCreams.reduce((sum, i) => sum + (i.quantity || 0), 0) + giftToppings.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const totalValueGift = discountIceCreams.reduce((sum, i) => sum + (i.total || 0), 0) + giftToppings.reduce((sum, i) => sum + (i.total || 0), 0);

    const shippingCost = order.shippingCost || 0; 
    const totalOrderValue = totalAmountSold + totalAmountToppings + totalValueGift + shippingCost; 
    const totalPayment = totalAmountSold + totalAmountToppings + shippingCost; // Matches finalAmount
    const deposit = order.deposit || 0;
    const remaining = totalPayment - deposit;

    const handleExportPDF = () => {
        const element = document.getElementById('printable-invoice');
        if (!element) return;
        
        setIsExporting(true);

        const opt = {
            margin:       [10, 10, 10, 10], 
            filename:     `Don_Hang_${(order.customerName || 'KH').replace(/\s+/g, '_')}_${order.date}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // @ts-ignore
        if (window.html2pdf) {
             // @ts-ignore
            window.html2pdf().set(opt).from(element).save().then(() => {
                setIsExporting(false);
            });
        } else {
            alert("Lỗi: Thư viện xuất PDF chưa tải xong. Vui lòng tải lại trang.");
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-2 sm:p-4 animate-fade-in backdrop-blur-md">
            <div className="bg-gray-100 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] border border-white/20">
                <div className="flex justify-between items-center p-4 border-b bg-white shrink-0">
                    <h3 className="text-lg sm:text-xl font-bold text-baby-navy truncate pr-2">Chi tiết đơn hàng</h3>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" onClick={handleExportPDF} disabled={isExporting} className="hidden md:flex shadow-md">
                            {isExporting ? <span className="animate-spin mr-2">⏳</span> : <Download size={16} />}
                            {isExporting ? 'Đang tạo...' : 'Xuất File PDF'}
                        </Button>
                         <Button size="sm" onClick={handleExportPDF} disabled={isExporting} className="md:hidden">
                            <Download size={16} />
                        </Button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-red-500">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="overflow-auto flex-1 bg-gray-50 p-4 flex justify-center custom-scrollbar">
                    <div 
                        id="printable-invoice" 
                        className="bg-white p-8 shadow-xl w-[190mm] min-h-[200mm] text-black shrink-0 transition-transform"
                        style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '13px' }}
                    >
                        {/* HEADER */}
                        <style>{`
                            .bg-navy-print {
                                background-color: #1a237e !important;
                                color: white !important;
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                            }
                            .no-break {
                                page-break-inside: avoid;
                            }
                        `}</style>

                        <div className="border border-baby-navy flex mb-4">
                            <div className="w-1/4 border-r border-baby-navy flex items-center justify-center p-3">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-baby-pink rounded-full flex items-center justify-center text-baby-navy font-bold text-lg border-4 border-baby-navy mx-auto">
                                        BB
                                    </div>
                                    <div className="font-bold text-baby-navy mt-1 text-[10px]">BABY BOSS</div>
                                </div>
                            </div>
                            <div className="w-3/4 p-3 text-center">
                                <h1 className="font-bold text-lg text-baby-navy uppercase mb-1">CÔNG TY CỔ PHẦN ĐẦU TƯ BABY BOSS</h1>
                                <p className="text-[11px] font-bold">MST: 0316366057</p>
                                <p className="text-[11px]">Địa chỉ: Tầng 14, Toà nhà HM Town, 412, Nguyễn Thị Minh Khai, phường Bàn Cờ, Thành phố Hồ Chí Minh.</p>
                                <p className="text-[11px] font-bold text-red-600">Hotline: 1900 99 88 80</p>
                                <p className="text-[11px] text-blue-800 underline">Website: www.babyboss.com.vn</p>
                            </div>
                        </div>

                        <div className="text-center mb-4">
                            <h2 className="text-xl font-bold text-baby-navy uppercase">ĐƠN ĐẶT HÀNG KEM</h2>
                            <div className="text-right text-xs italic mt-1">
                                Ngày đặt hàng: {new Date(order.date).toLocaleDateString('vi-VN')}
                            </div>
                        </div>

                        {/* CUSTOMER INFO */}
                        <div className="mb-4 text-[13px]">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                                <div className="flex">
                                    <span className="font-bold w-36">Tên Khách hàng:</span>
                                    <span>{order.customerName}</span>
                                </div>
                                <div className="flex">
                                    <span className="font-bold w-36">Nhân viên phụ trách:</span>
                                    <span>{order.createdByName}</span>
                                </div>
                                <div className="flex">
                                    <span className="font-bold w-36">Số điện thoại khách hàng:</span>
                                    <span>{customer?.phone || '---'}</span>
                                </div>
                                <div className="flex col-span-2">
                                    <span className="font-bold w-36 shrink-0">Địa chỉ khách hàng:</span>
                                    <span>{customer?.address || order.companyName}</span>
                                </div>
                            </div>
                        </div>

                        {/* TABLE I: SOLD ITEMS */}
                        <table className="w-full text-[12px] border-collapse border border-gray-300 mb-4">
                            <thead>
                                <tr className="bg-navy-print bg-baby-navy text-white text-center font-bold">
                                    <th colSpan={8} className="p-1 text-left uppercase">I. Bảng liệt kê đơn hàng bán</th>
                                </tr>
                                <tr className="bg-gray-100 text-center font-bold text-[11px]">
                                    <th className="border p-1 w-8">STT</th>
                                    <th className="border p-1">Tên sản phẩm</th>
                                    <th className="border p-1">Dòng sản phẩm</th>
                                    <th className="border p-1">Quy cách</th>
                                    <th className="border p-1">SL</th>
                                    <th className="border p-1">ĐVT</th>
                                    <th className="border p-1">Đơn giá (VNĐ)</th>
                                    <th className="border p-1">Thành tiền (VNĐ)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {soldIceCreams.map((item, idx) => (
                                    <tr key={idx} className="border-b text-center">
                                        <td className="border p-1">{idx + 1}</td>
                                        <td className="border p-1 text-left font-medium">Kem {item.flavor}</td>
                                        <td className="border p-1">{item.line}</td>
                                        <td className="border p-1">{item.size}</td>
                                        <td className="border p-1">{item.quantity}</td>
                                        <td className="border p-1">Hộp</td>
                                        <td className="border p-1 text-right">{formatCurrency(item.price)}</td>
                                        <td className="border p-1 text-right font-medium">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold bg-gray-50">
                                    <td colSpan={4} className="border p-1 text-right uppercase">Tổng hàng bán (I)</td>
                                    <td className="border p-1 text-center">{totalQtySold}</td>
                                    <td colSpan={2} className="border p-1"></td>
                                    <td className="border p-1 text-right text-baby-navy">{formatCurrency(totalAmountSold)}</td>
                                </tr>
                            </tfoot>
                        </table>
                        
                        {/* TABLE II: TOPPINGS (SOLD) */}
                        <table className="w-full text-[12px] border-collapse border border-gray-300 mb-4 no-break">
                            <thead>
                                <tr className="bg-navy-print bg-baby-navy text-white text-center font-bold">
                                    <th colSpan={8} className="p-1 text-left uppercase">II. Bảng liệt kê dụng cụ và topping</th>
                                </tr>
                                <tr className="bg-gray-100 text-center font-bold text-[11px]">
                                    <th className="border p-1 w-8">STT</th>
                                    <th className="border p-1">Tên sản phẩm</th>
                                    <th className="border p-1">Dòng sản phẩm</th>
                                    <th className="border p-1">Quy cách</th>
                                    <th className="border p-1">SL</th>
                                    <th className="border p-1">ĐVT</th>
                                    <th className="border p-1">Đơn giá (VNĐ)</th>
                                    <th className="border p-1">Thành tiền (VNĐ)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {soldToppings.map((item, idx) => (
                                    <tr key={idx} className="border-b text-center">
                                        <td className="border p-1">{idx + 1}</td>
                                        <td className="border p-1 text-left font-medium">{item.name}</td>
                                        <td className="border p-1">-</td>
                                        <td className="border p-1">-</td>
                                        <td className="border p-1">{item.quantity}</td>
                                        <td className="border p-1">{item.unit}</td>
                                        <td className="border p-1 text-right">{formatCurrency(item.price)}</td>
                                        <td className="border p-1 text-right font-medium">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                                {soldToppings.length === 0 && (
                                    <tr><td colSpan={8} className="p-1 border text-center italic">Không có dụng cụ/topping bán kèm</td></tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold bg-gray-50">
                                    <td colSpan={7} className="border p-1 text-right uppercase">Tổng dụng cụ và topping (II)</td>
                                    <td className="border p-1 text-right text-baby-navy">{formatCurrency(totalAmountToppings)}</td>
                                </tr>
                            </tfoot>
                        </table>

                        {/* TABLE III: GIFTS & DISCOUNTS */}
                        <table className="w-full text-[12px] border-collapse border border-gray-300 mb-4 no-break">
                            <thead>
                                <tr className="bg-navy-print bg-baby-navy text-white text-center font-bold">
                                    <th colSpan={8} className="p-1 text-left uppercase">III. Bảng liệt kê Chiết khấu và Quà tặng</th>
                                </tr>
                                <tr className="bg-gray-100 text-center font-bold text-[11px]">
                                    <th className="border p-1 w-8">STT</th>
                                    <th className="border p-1">Tên sản phẩm</th>
                                    <th className="border p-1">Dòng sản phẩm</th>
                                    <th className="border p-1">Quy cách</th>
                                    <th className="border p-1">SL</th>
                                    <th className="border p-1">ĐVT</th>
                                    <th className="border p-1">Đơn giá (Gốc)</th>
                                    <th className="border p-1">Thành tiền (VNĐ)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Discount Items (Ice Cream) */}
                                {discountIceCreams.map((item, idx) => (
                                    <tr key={`d-${idx}`} className="border-b text-center italic text-gray-600">
                                        <td className="border p-1">{idx + 1}</td>
                                        <td className="border p-1 text-left font-medium">Chiết khấu: Kem {item.flavor}</td>
                                        <td className="border p-1">{item.line}</td>
                                        <td className="border p-1">{item.size}</td>
                                        <td className="border p-1">{item.quantity}</td>
                                        <td className="border p-1">Hộp</td>
                                        <td className="border p-1 text-right">{formatCurrency(item.price)}</td>
                                        <td className="border p-1 text-right font-medium">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                                {/* Gift Items (Toppings/First Order Gifts) */}
                                {giftToppings.map((item, idx) => (
                                    <tr key={`g-${idx}`} className="border-b text-center italic text-gray-600">
                                        <td className="border p-1">{discountIceCreams.length + idx + 1}</td>
                                        <td className="border p-1 text-left font-medium">Tặng: {item.name}</td>
                                        <td className="border p-1">-</td>
                                        <td className="border p-1">-</td>
                                        <td className="border p-1">{item.quantity}</td>
                                        <td className="border p-1">{item.unit}</td>
                                        <td className="border p-1 text-right">{formatCurrency(item.price)}</td>
                                        <td className="border p-1 text-right font-medium">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                                
                                {discountIceCreams.length === 0 && giftToppings.length === 0 && (
                                    <tr><td colSpan={8} className="p-1 border text-center italic">Không có chiết khấu hay quà tặng</td></tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold bg-gray-50">
                                    <td colSpan={4} className="border p-1 text-right uppercase">Tổng giá trị chiết khấu & quà tặng (III)</td>
                                    <td className="border p-1 text-center">{totalQtyGift}</td>
                                    <td colSpan={2} className="border p-1"></td>
                                    <td className="border p-1 text-right text-baby-navy">{formatCurrency(totalValueGift)}</td>
                                </tr>
                            </tfoot>
                        </table>

                        {/* TABLE IV: SHIPPING & SUMMARY */}
                        <table className="w-full text-[12px] border-collapse border border-gray-300 mb-6 no-break">
                            <thead>
                                <tr className="bg-navy-print bg-baby-navy text-white text-center font-bold">
                                    <th className="p-1 text-left uppercase">IV. Chi phí vận chuyển và bảo quản</th>
                                    <th className="p-1 text-right bg-white text-black border-l border-gray-300 w-48">{formatCurrency(shippingCost)}</th>
                                </tr>
                            </thead>
                        </table>

                        <div className="flex flex-col items-end space-y-1 text-[13px] border-t-2 border-baby-navy pt-3 mb-6 no-break">
                            <div className="flex justify-between w-full md:w-1/2 border-b border-gray-100 pb-1">
                                <span className="font-bold">Tổng giá trị đơn hàng (I + II + III + IV):</span>
                                <span className="font-bold text-lg">{formatCurrency(totalOrderValue)}</span>
                            </div>
                            <div className="flex justify-between w-full md:w-1/2 pt-1">
                                <span className="font-bold text-red-600 uppercase">Tổng giá trị thanh toán (I + II + IV):</span>
                                <span className="font-bold text-[14px] text-red-600">{formatCurrency(totalPayment)}</span>
                            </div>
                            {deposit > 0 && (
                                <React.Fragment>
                                    <div className="flex justify-between w-full md:w-1/2 pt-1 border-t border-gray-200 mt-1 italic">
                                        <span className="">Đã đặt cọc:</span>
                                        <span className="">{formatCurrency(deposit)}</span>
                                    </div>
                                    <div className="flex justify-between w-full md:w-1/2 pt-1 font-bold text-blue-800">
                                        <span className="">Còn lại phải thu:</span>
                                        <span className="">{formatCurrency(remaining)}</span>
                                    </div>
                                </React.Fragment>
                            )}
                        </div>

                        {/* FOOTER & SIGNATURES */}
                        <div className="text-[12px] space-y-2 mb-8 no-break">
                            <div className="font-bold uppercase underline">1. Thanh toán:</div>
                            <p>Thanh toán lần 1 với 50% giá trị đơn hàng ngay sau khi khách hàng xác nhận đơn hàng.</p>
                            <p>Thanh toán lần 2 với 50% giá trị đơn hàng còn lại ngay sau khi khách hàng nhận và kiểm tra hàng.</p>
                            
                            <div className="mt-3">
                                <span className="font-bold">Phương thức thanh toán: Chuyển khoản hoặc tiền mặt</span>
                                <ul className="list-disc pl-5 mt-1">
                                    <li>Số tài khoản: <span className="font-bold">112568</span></li>
                                    <li>Chủ tài khoản: <span className="font-bold">CONG TY CO PHAN DAU TU BABY BOSS</span></li>
                                    <li>Ngân hàng: <span className="font-bold">EXIMBANK</span></li>
                                </ul>
                            </div>
                            
                            <p className="italic mt-3">
                                Thời gian làm việc và giao hàng: từ thứ hai đến thứ bảy; sáng từ 8 giờ đến 12 giờ, chiều từ 13 giờ đến 17 giờ; Chủ nhật nghỉ.
                            </p>
                        </div>

                        <div className="flex justify-between text-center no-break mt-8">
                            <div className="w-1/3">
                                <div className="font-bold uppercase mb-16">NGƯỜI ĐẶT HÀNG</div>
                                <div className="font-bold">{order.customerName}</div>
                            </div>
                            <div className="w-1/3">
                                <div className="font-bold uppercase mb-16">NGƯỜI LẬP ĐƠN</div>
                                <div className="font-bold">{order.createdByName}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const CustomerList: React.FC<ReportProps> = ({ user, onBack, onAddCustomer }) => {
    // ... existing implementation ...
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [branchFilter, setBranchFilter] = useState<string>('');
    const [userFilter, setUserFilter] = useState<string>('');
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [filterFirstBuyMonth, setFilterFirstBuyMonth] = useState('');
    const [filterLastBuyMonth, setFilterLastBuyMonth] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [availableCities, setAvailableCities] = useState<LocationOption[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Customer>>({});
    const [cities, setCities] = useState<LocationOption[]>([]);
    const [districts, setDistricts] = useState<LocationOption[]>([]);
    const [wards, setWards] = useState<LocationOption[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');
    const [selectedWard, setSelectedWard] = useState<string>('');
    const [street, setStreet] = useState<string>('');
  
    const availableCustomers = DataService.getCustomersForUser(user);
    const allOrders = DataService.getOrders(); 
    const users = DataService.getUsers();
  
    useEffect(() => {
      const fetchCities = async () => {
          try {
              const response = await fetch('https://provinces.open-api.vn/api/?depth=1');
              const data = await response.json();
              const sorted = data.sort((a: any, b: any) => {
                  if (a.name === "Thành phố Hồ Chí Minh") return -1;
                  if (b.name === "Thành phố Hồ Chí Minh") return 1;
                  if (a.name === "Thành phố Hà Nội") return -1;
                  if (b.name === "Thành phố Hà Nội") return 1;
                  return a.name.localeCompare(b.name);
              });
              setAvailableCities(sorted);
              setCities(sorted); 
          } catch (error) { console.error(error); }
      };
      fetchCities();
    }, []);
  
    const filteredCustomers = useMemo(() => {
      let result = availableCustomers;
  
      if (user.role === Role.ADMIN && branchFilter) {
          const userIdsInBranch = users.filter(u => u.branch === branchFilter).map(u => u.id);
          result = result.filter(c => userIdsInBranch.includes(c.createdBy));
      }
  
      if ((user.role === Role.ADMIN || user.role === Role.MANAGER) && userFilter) {
          result = result.filter(c => c.createdBy === userFilter);
      }
  
      if (filterCity) {
          const cityName = availableCities.find(c => c.code === Number(filterCity))?.name;
          if (cityName) {
              result = result.filter(c => c.address.includes(cityName));
          }
      }
  
      if (filterFirstBuyMonth || filterLastBuyMonth) {
          result = result.filter(c => {
              const customerOrders = allOrders.filter(o => o.customerId === c.id);
              if (customerOrders.length === 0) return false;
              
              const dates = customerOrders.map(o => o.date).sort();
              const firstDate = dates[0];
              const lastDate = dates[dates.length - 1];
  
              if (filterFirstBuyMonth && !firstDate.startsWith(filterFirstBuyMonth)) return false;
              if (filterLastBuyMonth && !lastDate.startsWith(filterLastBuyMonth)) return false;
  
              return true;
          });
      }
  
      return result;
    }, [availableCustomers, branchFilter, userFilter, user.role, users, filterFirstBuyMonth, filterLastBuyMonth, filterCity, availableCities, allOrders]);
  
    useEffect(() => {
      if (isEditing && selectedCity) {
          const fetchDistricts = async () => {
              try {
                  const response = await fetch(`https://provinces.open-api.vn/api/p/${selectedCity}?depth=2`);
                  const data = await response.json();
                  setDistricts(data.districts || []);
              } catch (error) { console.error(error); }
          };
          fetchDistricts();
      } else {
          setDistricts([]);
      }
    }, [isEditing, selectedCity]);
  
    useEffect(() => {
      if (isEditing && selectedDistrict) {
           const fetchWards = async () => {
              try {
                  const response = await fetch(`https://provinces.open-api.vn/api/d/${selectedDistrict}?depth=2`);
                  const data = await response.json();
                  setWards(data.wards || []);
              } catch (error) { console.error(error); }
          };
          fetchWards();
      } else {
          setWards([]);
      }
    }, [isEditing, selectedDistrict]);
  
  
    const getCustomerStats = (customerId: string) => {
      const orders = allOrders.filter(o => o.customerId === customerId);
      if (orders.length === 0) return null;
  
      const sortedDates = orders.map(o => new Date(o.date).getTime()).sort((a, b) => a - b);
      const firstDateObj = new Date(sortedDates[0]);
      const lastDateObj = new Date(sortedDates[sortedDates.length - 1]);
      
      const firstDate = firstDateObj.toLocaleDateString('vi-VN');
      const lastDate = lastDateObj.toLocaleDateString('vi-VN');
      const diffTime = Math.abs(new Date().getTime() - lastDateObj.getTime());
      const daysSinceLastPurchase = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
      const totalIceCreamBoxes = orders.reduce((sum, o) => {
          // Robust checking for items array
          const items = Array.isArray(o.items) ? o.items : [];
          const paidItemsCount = items.filter(i => !i.isGift).reduce((s, i) => s + (i.quantity || 0), 0);
          return sum + paidItemsCount;
      }, 0);
  
      const invoiceCount = orders.filter(o => o.hasInvoice).length;
      const totalRev = orders.reduce((sum, o) => sum + (o.totalRevenue || 0), 0);
  
      return { firstDate, lastDate, daysSinceLastPurchase, totalIceCreamBoxes, invoiceCount, totalRev };
    };
  
    const getCustomerOrderHistory = (customerId: string) => {
        return allOrders
          .filter(o => o.customerId === customerId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };
  
    const handleStartEdit = () => {
        if (!selectedCustomer) return;
        setEditForm(selectedCustomer);
        setStreet(selectedCustomer.address);
        setIsEditing(true);
    };
  
    const handleSaveEdit = () => {
        if (!selectedCustomer || !editForm.name) return;
        let finalAddress = editForm.address || "";
        if (selectedCity && selectedDistrict && selectedWard) {
            const c = cities.find(x => x.code === Number(selectedCity))?.name;
            const d = districts.find(x => x.code === Number(selectedDistrict))?.name;
            const w = wards.find(x => x.code === Number(selectedWard))?.name;
            if (c && d && w) {
              finalAddress = `${street}, ${w}, ${d}, ${c}`;
            }
        } else if (street !== selectedCustomer.address) {
            finalAddress = street;
        }
  
        let creatorId = selectedCustomer.createdBy;
        let creatorName = selectedCustomer.createdByName;
        
        if ((user.role === Role.ADMIN || user.role === Role.MANAGER) && editForm.createdBy && editForm.createdBy !== selectedCustomer.createdBy) {
            const newUser = users.find(u => u.id === editForm.createdBy);
            if (newUser) {
                creatorId = newUser.id;
                creatorName = newUser.fullName;
            }
        }
  
        const updatedCustomer: Customer = {
            ...selectedCustomer,
            ...editForm,
            name: editForm.name!,
            company: editForm.company!,
            phone: editForm.phone!,
            address: finalAddress,
            createdBy: creatorId,
            createdByName: creatorName,
            note: editForm.note
        };
  
        DataService.updateCustomer(updatedCustomer);
        setSelectedCustomer(updatedCustomer);
        setIsEditing(false);
        
        setSelectedCity('');
        setSelectedDistrict('');
        setSelectedWard('');
    };
  
    const userOptions = useMemo(() => {
        let filteredUsers = users;
        if (user.role === Role.MANAGER) {
            filteredUsers = users.filter(u => u.branch === user.branch);
        } else if (user.role === Role.ADMIN && branchFilter) {
            filteredUsers = users.filter(u => u.branch === branchFilter);
        }
        return filteredUsers.map(u => ({ value: u.id, label: u.fullName }));
    }, [users, user.role, user.branch, branchFilter]);
  
    const availableStaff = user.role === Role.ADMIN ? users : users.filter(u => u.branch === user.branch);
    const canReassign = user.role === Role.ADMIN || user.role === Role.MANAGER;
  
    if (selectedCustomer) {
      const orderHistory = getCustomerOrderHistory(selectedCustomer.id);
      const overview = getCustomerStats(selectedCustomer.id);
  
      return (
          <div className="bg-white p-6 rounded-2xl shadow-xl min-h-screen animate-fade-in relative text-black border border-gray-100">
               {viewingOrder && (
                  <OrderDetailModal 
                      order={viewingOrder} 
                      user={user} 
                      onClose={() => setViewingOrder(null)} 
                  />
              )}
  
               <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
                  <Button variant="outline" size="sm" onClick={() => { setSelectedCustomer(null); setIsEditing(false); }}>
                      <ArrowLeft size={18} /> Quay lại
                  </Button>
                  
                  {!isEditing ? (
                      <Button variant="secondary" size="sm" onClick={handleStartEdit}>
                          <Edit2 size={16} /> Chỉnh sửa
                      </Button>
                  ) : (
                      <div className="flex gap-2">
                           <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                              Hủy
                          </Button>
                          <Button variant="primary" size="sm" onClick={handleSaveEdit}>
                              <Save size={16} /> Lưu
                          </Button>
                      </div>
                  )}
              </div>
  
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                  <div className="md:w-1/3 bg-white p-6 rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      {!isEditing ? (
                          <React.Fragment>
                              <div className="text-center mb-6">
                                  <div className="w-24 h-24 bg-gradient-to-br from-baby-pink to-pink-300 rounded-full flex items-center justify-center mx-auto text-baby-navy font-bold text-4xl mb-4 shadow-md ring-4 ring-white">
                                      {selectedCustomer.name.charAt(0)}
                                  </div>
                                  <h2 className="text-2xl font-bold text-gray-800">{selectedCustomer.name}</h2>
                                  <div className="text-baby-navy font-medium bg-blue-50 inline-block px-3 py-1 rounded-full text-sm mt-1">{selectedCustomer.position}</div>
                              </div>
  
                              <div className="space-y-4 text-sm">
                                  <div className="flex gap-3 items-center group">
                                      <div className="p-2 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-baby-navy transition-colors"><Building2 size={18} /></div>
                                      <div className="font-medium text-gray-800">{selectedCustomer.company}</div>
                                  </div>
                                  <div className="flex gap-3 items-center group">
                                      <div className="p-2 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-baby-navy transition-colors"><Phone size={18} /></div>
                                      <div className="text-gray-800 font-mono">{selectedCustomer.phone}</div>
                                  </div>
                                  <div className="flex gap-3 items-center group">
                                      <div className="p-2 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-baby-navy transition-colors font-bold w-[34px] text-center">@</div>
                                      <div className="truncate text-gray-800">{selectedCustomer.email || 'Chưa cập nhật'}</div>
                                  </div>
                                  <div className="flex gap-3 items-start group">
                                      <div className="p-2 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-baby-navy transition-colors"><MapPin size={18} /></div>
                                      <div className="text-gray-800 leading-relaxed">{selectedCustomer.address}</div>
                                  </div>
                                  
                                  {selectedCustomer.note && (
                                      <div className="flex gap-3 mt-4 bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-gray-700 italic shadow-sm">
                                          <StickyNote className="text-yellow-500 shrink-0" size={18} />
                                          <div>{selectedCustomer.note}</div>
                                      </div>
                                  )}
  
                                  <div className="mt-6 pt-4 border-t border-gray-100">
                                      <div className="flex gap-3 items-center">
                                          <UserIcon className="text-gray-400 shrink-0" size={18} />
                                          <div>
                                              <span className="text-xs text-gray-500 block uppercase tracking-wider">Phụ trách</span>
                                              <span className="font-bold text-baby-navy">{selectedCustomer.createdByName}</span>
                                          </div>
                                      </div>
                                  </div>
  
                                  {(selectedCustomer.repName) && (
                                      <div className="mt-6 pt-4 border-t border-gray-100">
                                          <h4 className="font-bold text-baby-navy mb-3 flex items-center gap-2">
                                              <Briefcase size={16}/> Người đại diện
                                          </h4>
                                          <div className="space-y-2 pl-3 border-l-2 border-baby-pink">
                                              <div><span className="text-gray-500">Họ tên:</span> <strong className="text-gray-800">{selectedCustomer.repName}</strong></div>
                                              <div><span className="text-gray-500">Chức vụ:</span> <span className="text-gray-800">{selectedCustomer.repPosition}</span></div>
                                              <div><span className="text-gray-500">SĐT:</span> <span className="text-gray-800">{selectedCustomer.repPhone}</span></div>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          </React.Fragment>
                      ) : (
                          <div className="space-y-4">
                              <h3 className="font-bold text-baby-navy border-b pb-2 mb-2">Sửa thông tin</h3>
                              <Input label="Tên khách hàng" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                              <Input label="Chức vụ" value={editForm.position} onChange={e => setEditForm({...editForm, position: e.target.value})} />
                              <Input label="Công ty" value={editForm.company} onChange={e => setEditForm({...editForm, company: e.target.value})} />
                              <Input label="SĐT" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                              <Input label="Email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                              
                              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                  <label className="text-xs font-bold text-baby-navy block mb-2">Cập nhật địa chỉ</label>
                                  <Input placeholder="Số nhà / Đường (Hiện tại)" value={street} onChange={e => setStreet(e.target.value)} className="mb-2"/>
                                  <div className="grid grid-cols-1 gap-2">
                                      <Select 
                                          options={cities.map(c => ({value: c.code, label: c.name}))} 
                                          value={selectedCity} 
                                          onChange={e => setSelectedCity(e.target.value)} 
                                          placeholder="Tỉnh/Thành"
                                      />
                                      <Select 
                                          options={districts.map(d => ({value: d.code, label: d.name}))} 
                                          value={selectedDistrict} 
                                          onChange={e => setSelectedDistrict(e.target.value)} 
                                          placeholder="Quận/Huyện"
                                          disabled={!selectedCity}
                                      />
                                      <Select 
                                          options={wards.map(w => ({value: w.code, label: w.name}))} 
                                          value={selectedWard} 
                                          onChange={e => setSelectedWard(e.target.value)} 
                                          placeholder="Phường/Xã"
                                          disabled={!selectedDistrict}
                                      />
                                  </div>
                              </div>
  
                              <div className="border-t pt-2">
                                  <label className="text-sm font-semibold text-baby-navy block mb-1">Ghi chú</label>
                                  <textarea
                                      className="w-full bg-white text-baby-navy placeholder-baby-navy/50 border border-baby-navy rounded-xl px-3 py-2 text-sm h-20 resize-none outline-none focus:ring-4 focus:ring-baby-pink/30 hover:border-baby-navy/80 transition-all"
                                      value={editForm.note || ''}
                                      onChange={e => setEditForm({...editForm, note: e.target.value})}
                                  />
                              </div>
  
                              {canReassign && (
                                  <div className="border-t pt-2">
                                      <Select 
                                          label="Nhân viên phụ trách"
                                          options={availableStaff.map(u => ({value: u.id, label: u.fullName}))}
                                          value={editForm.createdBy || selectedCustomer.createdBy}
                                          onChange={e => setEditForm({...editForm, createdBy: e.target.value})}
                                      />
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
  
                  <div className="md:w-2/3">
                      <h3 className="text-xl font-bold text-baby-navy mb-4 flex items-center gap-2">
                          <Package /> Tổng quan mua hàng
                      </h3>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                              <div className="text-xs text-gray-500 uppercase font-bold tracking-wide">Ngày mua đầu</div>
                              <div className="font-bold text-baby-navy text-lg mt-1">{overview?.firstDate || '---'}</div>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                              <div className="text-xs text-gray-500 uppercase font-bold tracking-wide">Lần mua gần nhất</div>
                              <div className="font-bold text-baby-navy text-lg mt-1">{overview?.lastDate || '---'}</div>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                              <div className="text-xs text-gray-500 uppercase font-bold tracking-wide">Tổng đơn</div>
                              <div className="font-bold text-purple-600 text-2xl mt-1">{allOrders.filter(o => o.customerId === selectedCustomer.id).length}</div>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                              <div className="text-xs text-gray-500 uppercase font-bold tracking-wide">Tổng doanh thu</div>
                              <div className="font-bold text-green-600 text-xl mt-1">{formatCurrency(overview?.totalRev || 0)}</div>
                          </div>
                      </div>
  
                      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                          <div className="bg-gray-50 px-6 py-4 font-bold text-baby-navy border-b border-gray-200 flex justify-between items-center">
                              <span>Lịch sử đơn hàng</span>
                              <span className="text-xs font-normal text-gray-500 italic hidden sm:inline bg-white px-3 py-1 rounded-full border">Nhấn vào đơn để xem chi tiết</span>
                          </div>
                          {orderHistory.length > 0 ? (
                               <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                  <table className="w-full text-sm text-left">
                                      <thead className="bg-gray-50 text-gray-500 sticky top-0 uppercase text-xs tracking-wider">
                                          <tr>
                                              <th className="p-4 border-b">Ngày mua</th>
                                              <th className="p-4 border-b text-center">SL Kem (Hộp)</th>
                                              <th className="p-4 border-b text-right">Tổng tiền</th>
                                              <th className="p-4 border-b w-10"></th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {orderHistory.map((order) => (
                                              <tr 
                                                  key={order.id} 
                                                  onClick={() => setViewingOrder(order)}
                                                  className="border-b last:border-0 hover:bg-blue-50/50 cursor-pointer transition-colors group"
                                              >
                                                  <td className="p-4 font-medium text-baby-navy group-hover:text-blue-700 transition-colors">
                                                      {new Date(order.date).toLocaleDateString('vi-VN')}
                                                  </td>
                                                  <td className="p-4 text-center text-gray-800 font-bold">
                                                      {(Array.isArray(order.items) ? order.items : []).filter(i => !i.isGift).reduce((s, i) => s + (i.quantity || 0), 0)}
                                                  </td>
                                                  <td className="p-4 text-right font-bold text-green-600">
                                                      {formatCurrency(order.totalRevenue)}
                                                  </td>
                                                  <td className="p-4 text-gray-300 group-hover:text-baby-navy transition-colors">
                                                      <ChevronRight size={18} />
                                                  </td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                               </div>
                          ) : (
                              <div className="p-10 text-center text-gray-400 italic">Khách hàng chưa có lịch sử mua hàng.</div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      );
    }
  
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg min-h-screen border border-gray-100">
         <div className="flex flex-col mb-8 gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button onClick={onBack} className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-all">
                      <ArrowLeft size={24} />
                  </button>
                  <div>
                      <h2 className="text-2xl font-bold text-baby-navy">Danh sách khách hàng</h2>
                      <p className="text-sm text-gray-500">Quản lý thông tin và lịch sử mua hàng</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                    {onAddCustomer && (
                      <Button size="md" onClick={onAddCustomer} className="shadow-md shadow-baby-navy/20">
                          <Plus size={18} /> Nhập hàng mới
                      </Button>
                    )}
                </div>
            </div>
  
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-baby-pink/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
  
               <div className="flex items-center gap-2 mb-4 text-sm font-bold text-baby-navy uppercase tracking-widest border-b border-gray-100 pb-2">
                  <Filter size={14} /> Bộ lọc nâng cao
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                   {(user.role === Role.ADMIN || user.role === Role.MANAGER) && (
                       <React.Fragment>
                          {user.role === Role.ADMIN && (
                              <Select 
                                  label="Chi nhánh"
                                  options={[
                                      { value: Branch.HOI_SO, label: Branch.HOI_SO },
                                      { value: Branch.MIEN_BAC, label: Branch.MIEN_BAC }
                                  ]}
                                  value={branchFilter}
                                  onChange={(e) => { setBranchFilter(e.target.value); setUserFilter(''); }}
                                  placeholder="-- Tất cả --"
                              />
                          )}
                          <Select 
                              label="Nhân viên phụ trách"
                              options={userOptions}
                              value={userFilter}
                              onChange={(e) => setUserFilter(e.target.value)}
                              placeholder="-- Chọn nhân viên --"
                          />
                       </React.Fragment>
                   )}
  
                   <Input 
                      label="Đơn đầu tiên (Tháng)" 
                      type="month" 
                      value={filterFirstBuyMonth} 
                      onChange={e => setFilterFirstBuyMonth(e.target.value)} 
                   />
                   <Input 
                      label="Đơn gần nhất (Tháng)" 
                      type="month" 
                      value={filterLastBuyMonth} 
                      onChange={e => setFilterLastBuyMonth(e.target.value)} 
                   />
                   <div className="sm:col-span-2 lg:col-span-4">
                      <Select
                          label="Khu vực (Tỉnh / Thành phố)"
                          options={availableCities.map(c => ({ value: c.code, label: c.name }))}
                          value={filterCity}
                          onChange={e => setFilterCity(e.target.value)}
                          placeholder="-- Lọc theo khu vực --"
                      />
                   </div>
               </div>
            </div>
        </div>
  
        <div className="overflow-x-auto shadow-md border border-gray-200 rounded-xl">
          <table className="w-full text-sm text-left border-collapse cursor-pointer min-w-[1000px]">
              <thead className="bg-baby-navy text-white whitespace-nowrap text-xs uppercase tracking-wider">
                  <tr>
                      <th className="p-4 font-semibold">Họ tên</th>
                      <th className="p-4 font-semibold">Công ty</th>
                      <th className="p-4 font-semibold">SĐT</th>
                      <th className="p-4 font-semibold">Địa chỉ</th>
                      <th className="p-4 font-semibold text-center" title="Chỉ tính kem bán, không tính quà tặng">Tổng hộp <br/><span className="text-[9px] lowercase opacity-80">(đã mua)</span></th>
                      <th className="p-4 font-semibold text-center">Lần mua cuối</th>
                      <th className="p-4 font-semibold">Ghi chú</th>
                      <th className="p-4 font-semibold text-center">Số HĐ</th>
                      <th className="p-4 font-semibold text-right">Tổng DT</th>
                      <th className="p-4 font-semibold">Phụ trách</th>
                  </tr>
              </thead>
              <tbody className="text-gray-700">
                  {filteredCustomers.map((cust, idx) => {
                      const stats = getCustomerStats(cust.id);
                      return (
                          <tr 
                              key={cust.id} 
                              onClick={() => setSelectedCustomer(cust)}
                              className={`
                                  hover:bg-blue-50/80 border-b last:border-0 transition-all duration-200 group
                                  ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}
                              `}
                              title="Nhấn để xem chi tiết"
                          >
                              <td className="p-4 font-bold text-baby-navy group-hover:text-blue-700 group-hover:translate-x-1 transition-transform">{cust.name}</td>
                              <td className="p-4">{cust.company}</td>
                              <td className="p-4 font-mono text-xs">{cust.phone}</td>
                              <td className="p-4 truncate max-w-[150px] text-xs text-gray-500">{cust.address}</td>
                              <td className="p-4 text-center font-bold text-lg text-baby-navy bg-blue-50/50">{stats?.totalIceCreamBoxes || 0}</td>
                              <td className="p-4 text-center font-medium text-xs">
                                  {stats?.lastDate || '-'}
                              </td>
                              <td className="p-4 max-w-[150px] truncate text-gray-400 italic text-xs" title={cust.note}>
                                  {cust.note || ''}
                              </td>
                              <td className="p-4 text-center">{stats?.invoiceCount || 0}</td>
                              <td className="p-4 text-right font-bold text-green-700">{formatCurrency(stats?.totalRev || 0)}</td>
                              <td className="p-4 text-xs text-gray-500 font-medium bg-gray-50/50">{cust.createdByName}</td>
                          </tr>
                      );
                  })}
                  {filteredCustomers.length === 0 && (
                      <tr><td colSpan={10} className="p-10 text-center text-gray-400 flex flex-col items-center justify-center">
                          <Search size={40} className="mb-2 opacity-20"/>
                          Không tìm thấy dữ liệu phù hợp
                      </td></tr>
                  )}
              </tbody>
          </table>
        </div>
      </div>
    );
  };

export const SalesLog: React.FC<ReportProps> = ({ user, onBack }) => {
    // ... same code as before ...
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
  
    const orders = DataService.getOrdersForUser(user);
    const users = DataService.getUsers();
  
    const userOptions = useMemo(() => {
      let filteredUsers = users;
      if (user.role === Role.MANAGER) {
        filteredUsers = users.filter(u => u.branch === user.branch);
      } else if (user.role === Role.ADMIN && branchFilter) {
        filteredUsers = users.filter(u => u.branch === branchFilter);
      }
      return filteredUsers.map(u => ({ value: u.id, label: u.fullName }));
    }, [users, user.role, user.branch, branchFilter]);
  
    const filteredOrders = useMemo(() => {
      let result = orders;
      if (startDate) result = result.filter(o => o.date >= startDate);
      if (endDate) result = result.filter(o => o.date <= endDate);
      if (user.role === Role.ADMIN && branchFilter) {
          const userIdsInBranch = users.filter(u => u.branch === branchFilter).map(u => u.id);
          result = result.filter(o => userIdsInBranch.includes(o.createdBy));
      }
      if ((user.role === Role.ADMIN || user.role === Role.MANAGER) && userFilter) {
          result = result.filter(o => o.createdBy === userFilter);
      }
      return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [orders, startDate, endDate, branchFilter, userFilter, user.role, users]);
  
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg min-h-screen border border-gray-100">
        {viewingOrder && <OrderDetailModal order={viewingOrder} user={user} onClose={() => setViewingOrder(null)} />}
        
        <div className="flex flex-col mb-8 gap-6">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-all">
                  <ArrowLeft size={24} />
              </button>
              <div>
                  <h2 className="text-2xl font-bold text-baby-navy">Nhật ký bán hàng</h2>
                  <p className="text-sm text-gray-500">Theo dõi toàn bộ đơn hàng</p>
              </div>
            </div>
  
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg grid grid-cols-1 md:grid-cols-4 gap-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
  
               <Input label="Từ ngày" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
               <Input label="Đến ngày" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
               
               {(user.role === Role.ADMIN || user.role === Role.MANAGER) && (
                   <>
                      {user.role === Role.ADMIN && (
                          <Select 
                              label="Chi nhánh"
                              options={[{ value: Branch.HOI_SO, label: Branch.HOI_SO }, { value: Branch.MIEN_BAC, label: Branch.MIEN_BAC }]}
                              value={branchFilter}
                              onChange={(e) => { setBranchFilter(e.target.value); setUserFilter(''); }}
                              placeholder="-- Tất cả --"
                          />
                      )}
                      <Select 
                          label="Nhân viên"
                          options={userOptions}
                          value={userFilter}
                          onChange={(e) => setUserFilter(e.target.value)}
                          placeholder="-- Tất cả --"
                      />
                   </>
               )}
            </div>
        </div>
  
        <div className="overflow-x-auto shadow-md border border-gray-200 rounded-xl">
          <table className="w-full text-sm text-left border-collapse min-w-[900px]">
              <thead className="bg-baby-navy text-white text-xs uppercase tracking-wider">
                  <tr>
                      <th className="p-4 font-semibold">Ngày</th>
                      <th className="p-4 font-semibold">Khách hàng</th>
                      <th className="p-4 font-semibold text-center">SL Mua</th>
                      <th className="p-4 font-semibold text-center">SL Tặng</th>
                      <th className="p-4 font-semibold text-right">Doanh thu</th>
                      <th className="p-4 font-semibold">Người tạo</th>
                      <th className="p-4 font-semibold w-10"></th>
                  </tr>
              </thead>
              <tbody className="text-gray-700">
                  {filteredOrders.map((order, idx) => {
                       // Safely handle arrays
                       const items = Array.isArray(order.items) ? order.items : [];
                       const qtySold = items.filter(i => !i.isGift).reduce((s, i) => s + (i.quantity || 0), 0);
                       const qtyGift = items.filter(i => i.isGift).reduce((s, i) => s + (i.quantity || 0), 0);
                       return (
                          <tr 
                              key={order.id} 
                              onClick={() => setViewingOrder(order)} 
                              className={`
                                  hover:bg-blue-50/80 border-b last:border-0 cursor-pointer transition-colors
                                  ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}
                              `}
                          >
                              <td className="p-4 font-mono text-xs">{new Date(order.date).toLocaleDateString('vi-VN')}</td>
                              <td className="p-4 font-bold text-baby-navy">{order.customerName}</td>
                              <td className="p-4 text-center font-bold">{qtySold}</td>
                              <td className="p-4 text-center text-gray-400">{qtyGift > 0 ? <span className="text-green-600 font-bold">{qtyGift}</span> : '-'}</td>
                              <td className="p-4 text-right font-bold text-green-700 text-base">{formatCurrency(order.totalRevenue)}</td>
                              <td className="p-4 text-xs font-medium text-gray-500">{order.createdByName}</td>
                              <td className="p-4 text-center text-gray-400 hover:text-baby-navy transition-colors"><Eye size={18} /></td>
                          </tr>
                       );
                  })}
                  {filteredOrders.length === 0 && (
                      <tr><td colSpan={7} className="p-10 text-center text-gray-400">Không có đơn hàng nào</td></tr>
                  )}
              </tbody>
          </table>
        </div>
      </div>
    );
};

export const TotalSales: React.FC<ReportProps> = ({ user, onBack }) => {
    // ... same code as before ...
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [branchFilter, setBranchFilter] = useState('');
  
    const orders = DataService.getOrdersForUser(user);
    const users = DataService.getUsers();
  
    const stats = useMemo(() => {
      const [y, m] = month.split('-');
      
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentQuarter = Math.floor(currentMonth / 3);
  
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay() || 7; 
      if (day !== 1) startOfWeek.setHours(-24 * (day - 1)); 
      else startOfWeek.setHours(0,0,0,0);
      
      const currentWeekOrders = orders.filter(o => {
          const d = new Date(o.date);
          return d >= startOfWeek;
      });
  
      const currentMonthOrders = orders.filter(o => {
          const d = new Date(o.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
  
      const currentQuarterOrders = orders.filter(o => {
          const d = new Date(o.date);
          const q = Math.floor(d.getMonth() / 3);
          return q === currentQuarter && d.getFullYear() === currentYear;
      });

      const currentYearOrders = orders.filter(o => {
          const d = new Date(o.date);
          return d.getFullYear() === currentYear;
      });
  
      const revWeek = currentWeekOrders.reduce((sum, o) => sum + o.totalRevenue, 0);
      const revMonth = currentMonthOrders.reduce((sum, o) => sum + o.totalRevenue, 0);
      const revQuarter = currentQuarterOrders.reduce((sum, o) => sum + o.totalRevenue, 0);
      const revYear = currentYearOrders.reduce((sum, o) => sum + o.totalRevenue, 0);
  
      let filteredOrders = orders.filter(o => {
          const d = new Date(o.date);
          return d.getMonth() + 1 === parseInt(m) && d.getFullYear() === parseInt(y);
      });
  
      if (user.role === Role.ADMIN && branchFilter) {
           const userIdsInBranch = users.filter(u => u.branch === branchFilter).map(u => u.id);
           filteredOrders = filteredOrders.filter(o => userIdsInBranch.includes(o.createdBy));
      }
  
      const userStats: Record<string, { name: string, branch: string, orders: number, revenue: number }> = {};
      let relevantUsers = users;
      if (user.role === Role.MANAGER) {
          relevantUsers = users.filter(u => u.branch === user.branch);
      } else if (user.role === Role.STAFF) {
          relevantUsers = [user];
      } else if (user.role === Role.ADMIN && branchFilter) {
          relevantUsers = users.filter(u => u.branch === branchFilter);
      }
  
      relevantUsers.forEach(u => {
          if (u.role !== Role.ADMIN) { 
               userStats[u.id] = { name: u.fullName, branch: u.branch, orders: 0, revenue: 0 };
          } else if (user.role === Role.ADMIN) {
               userStats[u.id] = { name: u.fullName, branch: u.branch, orders: 0, revenue: 0 };
          }
      });
  
      filteredOrders.forEach(o => {
          if (userStats[o.createdBy]) {
              userStats[o.createdBy].orders += 1;
              userStats[o.createdBy].revenue += o.totalRevenue;
          } else {
               const creator = users.find(u => u.id === o.createdBy);
               if (creator) {
                    userStats[o.createdBy] = { 
                        name: creator.fullName, 
                        branch: creator.branch, 
                        orders: 1, 
                        revenue: o.totalRevenue 
                    };
               }
          }
      });
  
      const sortedUserStats = Object.values(userStats).sort((a, b) => b.revenue - a.revenue);
      
      return {
          revWeek,
          revMonth,
          revQuarter,
          revYear,
          sortedUserStats
      };
    }, [orders, month, branchFilter, users, user.role, user.branch]);
  
    const totalRev = stats.sortedUserStats.reduce((acc, curr) => acc + curr.revenue, 0);
  
    const KpiCard = ({ label, value, color }: any) => (
        <div className={`flex flex-col justify-center items-center p-6 rounded-2xl border bg-white shadow-lg hover:-translate-y-1 transition-transform duration-300 ${color}`}>
            <div className="text-gray-500 font-bold uppercase tracking-wider mb-2 text-xs">{label}</div>
            <div className="text-2xl font-extrabold text-gray-800 drop-shadow-sm">{formatCurrency(value)}</div>
        </div>
    );
  
    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg min-h-screen border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
               <div className="flex items-center gap-3">
                  <button onClick={onBack} className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-all">
                      <ArrowLeft size={24} />
                  </button>
                  <h2 className="text-2xl font-bold text-baby-navy">Tổng doanh số</h2>
              </div>
              
              <div className="flex gap-4 items-end bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                   {user.role === Role.ADMIN && (
                      <div className="w-48">
                          <Select 
                              label="Chi nhánh"
                              options={[{ value: Branch.HOI_SO, label: Branch.HOI_SO }, { value: Branch.MIEN_BAC, label: Branch.MIEN_BAC }]}
                              value={branchFilter}
                              onChange={(e) => setBranchFilter(e.target.value)}
                              placeholder="-- Tất cả CN --"
                          />
                      </div>
                  )}
                  <div>
                      <Input label="Chọn tháng (bảng chi tiết)" type="month" value={month} onChange={e => setMonth(e.target.value)} />
                  </div>
              </div>
          </div>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
               <KpiCard label="Doanh thu tuần này" value={stats.revWeek} color="border-blue-100 shadow-blue-50" />
               <KpiCard label="Doanh thu tháng này" value={stats.revMonth} color="border-green-100 shadow-green-50" />
               <KpiCard label="Doanh thu quý này" value={stats.revQuarter} color="border-purple-100 shadow-purple-50" />
               <KpiCard label="Doanh thu năm nay" value={stats.revYear} color="border-orange-100 shadow-orange-50" />
          </div>
  
          <h3 className="font-bold text-lg text-baby-navy mb-4 border-l-4 border-baby-navy pl-3 flex items-center gap-2">
              <TrendingUp size={20}/> Chi tiết theo nhân viên (Tháng được chọn)
          </h3>
          <div className="overflow-x-auto shadow-md border border-gray-200 rounded-xl">
              <table className="w-full text-sm text-left border-collapse min-w-[700px]">
                  <thead className="bg-baby-navy text-white text-xs uppercase tracking-wider">
                      <tr>
                          <th className="p-4 font-semibold">Họ tên nhân viên</th>
                          <th className="p-4 font-semibold">Chi nhánh</th>
                          <th className="p-4 font-semibold text-center">Tổng đơn hàng</th>
                          <th className="p-4 font-semibold text-right">Tổng doanh số</th>
                          <th className="p-4 font-semibold text-right">Tỷ trọng</th>
                      </tr>
                  </thead>
                  <tbody className="text-gray-700">
                      {stats.sortedUserStats.map((stat, idx) => (
                          <tr key={idx} className={`border-b hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                              <td className="p-4 font-bold text-baby-navy">{stat.name}</td>
                              <td className="p-4 text-gray-500">{stat.branch}</td>
                              <td className="p-4 text-center font-bold bg-gray-50">{stat.orders}</td>
                              <td className="p-4 text-right font-bold text-green-700">{formatCurrency(stat.revenue)}</td>
                               <td className="p-4 text-right text-gray-500 font-mono">
                                  {totalRev > 0 ? ((stat.revenue / totalRev) * 100).toFixed(1) : 0}%
                               </td>
                          </tr>
                      ))}
                      {stats.sortedUserStats.length === 0 && (
                          <tr><td colSpan={5} className="p-10 text-center text-gray-400">Không có dữ liệu</td></tr>
                      )}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold text-gray-800">
                      <tr>
                          <td colSpan={2} className="p-4 text-right uppercase text-xs tracking-wider">Tổng cộng</td>
                          <td className="p-4 text-center border-t border-gray-300">{stats.sortedUserStats.reduce((a,b) => a + b.orders, 0)}</td>
                          <td className="p-4 text-right text-green-700 text-lg border-t border-gray-300">{formatCurrency(totalRev)}</td>
                          <td className="p-4 border-t border-gray-300"></td>
                      </tr>
                  </tfoot>
              </table>
          </div>
        </div>
    );
};