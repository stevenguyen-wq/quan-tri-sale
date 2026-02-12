import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './Button';
import { Input, Select } from './Input';
import { DataService } from '../services/dataService';
import { User, Customer, IceCreamItem, ToppingItem, Order, IceCreamLine, Role } from '../types';
import { FLAVORS, PRICING, SIZES_BY_LINE } from '../constants';
import { Trash2, Plus, ArrowLeft, CheckCircle, Gift, Eye, X, User as UserIcon, Building2, Phone, MapPin, Briefcase, Package, Truck, Download, Percent, CreditCard, Loader2 } from 'lucide-react';

interface Props {
  user: User;
  onBack: () => void;
}

export const CreateOrder: React.FC<Props> = ({ user, onBack }) => {
  const [step, setStep] = useState<1 | 2>(1); // 1: Entry, 2: Review
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [hasInvoice, setHasInvoice] = useState(false);
  const [isFirstOrder, setIsFirstOrder] = useState(false);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [deposit, setDeposit] = useState<number>(0); // Tiền cọc
  
  // 1. Paid Items
  const [iceCreamItems, setIceCreamItems] = useState<IceCreamItem[]>([]);
  
  // 2. Discount Items (Available for ALL customers - Type: IceCreamItem)
  const [discountItems, setDiscountItems] = useState<IceCreamItem[]>([]);

  // 3. First Order Gift Items (Only for NEW customers - Type: ToppingItem)
  const [giftToppingItems, setGiftToppingItems] = useState<ToppingItem[]>([]);

  // 4. Toppings (Paid)
  const [toppingItems, setToppingItems] = useState<ToppingItem[]>([]);


  useEffect(() => {
    setCustomers(DataService.getCustomersForUser(user));
  }, [user]);

  // Check for first order when customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      const allOrders = DataService.getOrders();
      const hasPreviousOrders = allOrders.some(o => o.customerId === selectedCustomerId);
      const isNew = !hasPreviousOrders;
      setIsFirstOrder(isNew);
      
      // Reset gifts if not new
      if (!isNew) {
        setGiftToppingItems([]);
      }
      
      // Reset other fields on customer change for safety
      setDiscountItems([]); 
      setIceCreamItems([]);
      setToppingItems([]);
      setDeposit(0);
    } else {
      setIsFirstOrder(false);
      setGiftToppingItems([]);
      setDiscountItems([]);
      setIceCreamItems([]);
      setToppingItems([]);
      setDeposit(0);
    }
  }, [selectedCustomerId]);

  // --- Ice Cream Logic (Paid) ---
  const addIceCreamRow = () => {
    setIceCreamItems([
      ...iceCreamItems,
      { line: 'PRO', size: '', flavor: '', quantity: 1, price: 0, total: 0 }
    ]);
  };

  const removeIceCreamRow = (index: number) => {
    const newItems = [...iceCreamItems];
    newItems.splice(index, 1);
    setIceCreamItems(newItems);
  };

  const updateIceCreamRow = (index: number, field: keyof IceCreamItem, value: any) => {
    const newItems = [...iceCreamItems];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'line' || field === 'size' || field === 'quantity') {
      if (item.line && item.size) {
        // @ts-ignore
        const unitPrice = PRICING[item.line][item.size] || 0;
        item.price = unitPrice;
        item.total = unitPrice * item.quantity;
      }
      if (field === 'line') {
        item.size = '';
        item.price = 0;
        item.total = 0;
      }
    }
    newItems[index] = item;
    setIceCreamItems(newItems);
  };

  // --- Discount Items (Ice Cream Structure) ---
  const addDiscountRow = () => {
      setDiscountItems([...discountItems, { line: 'PRO', size: '', flavor: '', quantity: 1, price: 0, total: 0, isGift: true }]);
  };
  const removeDiscountRow = (index: number) => {
      const newItems = [...discountItems];
      newItems.splice(index, 1);
      setDiscountItems(newItems);
  };
  const updateDiscountRow = (index: number, field: keyof IceCreamItem, value: any) => {
      const newItems = [...discountItems];
      const item = { ...newItems[index], [field]: value };
      if (field === 'line' || field === 'size') {
          if (item.line && item.size) {
                // @ts-ignore
              const unitPrice = PRICING[item.line][item.size] || 0;
              item.price = unitPrice; 
          }
          if (field === 'line') item.size = '';
      }
      if (field === 'line' || field === 'size' || field === 'quantity' || field === 'price') {
          item.total = item.price * item.quantity;
      }
      newItems[index] = item;
      setDiscountItems(newItems);
  };

  // --- First Order Gifts (Topping Structure) ---
  const addGiftRow = () => {
      setGiftToppingItems([...giftToppingItems, { name: '', unit: '', quantity: 1, price: 0, total: 0, isGift: true }]);
  };
  const removeGiftRow = (index: number) => {
      const newItems = [...giftToppingItems];
      newItems.splice(index, 1);
      setGiftToppingItems(newItems);
  };
  const updateGiftRow = (index: number, field: keyof ToppingItem, value: any) => {
      const newItems = [...giftToppingItems];
      const item = { ...newItems[index], [field]: value };
      if (field === 'quantity' || field === 'price') {
          item.total = item.quantity * item.price;
      }
      newItems[index] = item;
      setGiftToppingItems(newItems);
  };

  // --- Topping Logic ---
  const addToppingRow = () => {
    setToppingItems([
      ...toppingItems,
      { name: '', unit: '', quantity: 1, price: 0, total: 0 }
    ]);
  };

  const removeToppingRow = (index: number) => {
    const newItems = [...toppingItems];
    newItems.splice(index, 1);
    setToppingItems(newItems);
  };

  const updateToppingRow = (index: number, field: keyof ToppingItem, value: any) => {
    const newItems = [...toppingItems];
    const item = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'price') {
      item.total = item.quantity * item.price;
    }
    newItems[index] = item;
    setToppingItems(newItems);
  };

  // Totals
  const revenueIceCream = iceCreamItems.reduce((sum, item) => sum + item.total, 0);
  const revenueTopping = toppingItems.reduce((sum, item) => sum + item.total, 0);
  const totalRevenue = revenueIceCream + revenueTopping; 
  const totalPayment = totalRevenue + shippingCost;
  const remainingPayment = totalPayment - deposit;

  // Values (Display Only)
  const totalDiscountValue = discountItems.reduce((sum, item) => sum + item.total, 0);
  const totalGiftValue = giftToppingItems.reduce((sum, item) => sum + item.total, 0);

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // --- PDF EXPORT ---
  const handleExportPDF = () => {
        const element = document.getElementById('printable-preview-invoice'); // Correct ID
        const customer = customers.find(c => c.id === selectedCustomerId);
        if (!element || !customer) {
            console.error("Cannot find printable element or customer");
            return;
        }
        setIsExporting(true);
        const opt = {
            margin:       [10, 10, 10, 10], 
            filename:     `Don_Hang_${customer.name.replace(/\s+/g, '_')}_${orderDate}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        // @ts-ignore
        if (window.html2pdf) {
             // @ts-ignore
            window.html2pdf().set(opt).from(element).save().then(() => setIsExporting(false));
        } else {
            alert("Lỗi: Thư viện xuất PDF chưa tải xong. Vui lòng tải lại trang.");
            setIsExporting(false);
        }
  };

  const handleReview = () => {
    if (!selectedCustomerId) {
        alert("Vui lòng chọn khách hàng");
        return;
    }
    if (iceCreamItems.length === 0 && toppingItems.length === 0 && giftToppingItems.length === 0 && discountItems.length === 0) {
        alert("Vui lòng nhập ít nhất một sản phẩm");
        return;
    }
    
    // Validate rows
    const invalidIceCream = iceCreamItems.some(i => !i.line || !i.size || !i.flavor || i.quantity <= 0);
    const invalidDiscount = discountItems.some(i => !i.line || !i.size || !i.flavor || i.quantity <= 0);
    const invalidGift = giftToppingItems.some(i => !i.name || !i.unit || i.quantity <= 0); 
    const invalidTopping = toppingItems.some(i => !i.name || !i.unit || i.quantity <= 0);

    if (invalidIceCream || invalidDiscount || invalidGift || invalidTopping) {
        alert("Vui lòng điền đầy đủ thông tin (Tên, Quy cách, Số lượng > 0) cho tất cả các dòng sản phẩm/topping.");
        return;
    }
    
    if (deposit > totalPayment) {
        alert("Tiền cọc không thể lớn hơn tổng thanh toán!");
        return;
    }

    setStep(2);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
        const customer = customers.find(c => c.id === selectedCustomerId);
        if (!customer) {
            alert("Lỗi: Không tìm thấy thông tin khách hàng đã chọn. Vui lòng chọn lại.");
            setIsSubmitting(false);
            return;
        }

        // Merge Items
        // Ice Cream items (Paid + Discount)
        const allIceCreamItems = [
            ...iceCreamItems, 
            ...discountItems.map(i => ({...i, isGift: true}))
        ];

        // Topping items (Paid + Gift)
        const allToppingItems = [
            ...toppingItems,
            ...giftToppingItems.map(i => ({...i, isGift: true}))
        ];

        const newOrder: Order = {
            id: Date.now().toString(),
            date: orderDate,
            customerId: customer.id,
            customerName: customer.name,
            companyName: customer.company,
            items: allIceCreamItems,
            toppings: allToppingItems,
            hasInvoice,
            revenueIceCream, 
            revenueTopping,
            totalRevenue,
            shippingCost,
            totalPayment,
            deposit,
            createdBy: user.id,
            createdByName: user.fullName
        };

        // Async save
        await DataService.addOrder(newOrder);
        alert("Đơn hàng đã được lưu vào nhật ký!");
        onBack();
    } catch (e: any) {
        alert("Có lỗi xảy ra khi lưu đơn hàng: " + e.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const tableInputClass = "w-full bg-white text-baby-navy placeholder-baby-navy/60 border border-baby-navy rounded-md px-2 py-2 text-sm focus:ring-2 focus:ring-baby-pink/50 outline-none transition-all";

  // Prepare options for select, including ownership info for Admin/Managers
  const customerOptions = useMemo(() => {
      return customers.map(c => {
          let label = `${c.name} - ${c.company}`;
          // If User is Admin or Manager, show who owns the customer to avoid confusion
          if ((user.role === Role.ADMIN || user.role === Role.MANAGER) && c.createdByName) {
              label += ` (${c.createdByName})`;
          }
          return { value: c.id, label };
      });
  }, [customers, user.role]);

  // --- VIEW: CONFIRMATION STEP ---
  if (step === 2) {
    const customer = customers.find(c => c.id === selectedCustomerId);
    
    // Calculate PDF specific totals
    const totalQtySold = iceCreamItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalQtyGift = discountItems.reduce((sum, i) => sum + i.quantity, 0) + giftToppingItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalValueGiftAll = totalDiscountValue + totalGiftValue;

    return (
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-baby-navy mb-6 text-center">Xác nhận đơn hàng</h2>
            
            {/* HIDDEN PRINTABLE INVOICE TEMPLATE (Matches Reports.tsx) */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div 
                    id="printable-preview-invoice" 
                    className="bg-white p-8 w-[190mm] min-h-[200mm] text-black"
                    style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '13px' }}
                >
                     <style>{`
                        .bg-navy-print {
                            background-color: #1a237e !important;
                            color: white !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                    `}</style>
                    <div className="border border-baby-navy flex mb-4">
                        <div className="w-1/4 border-r border-baby-navy flex items-center justify-center p-3">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-baby-pink rounded-full flex items-center justify-center text-baby-navy font-bold text-lg border-4 border-baby-navy mx-auto">BB</div>
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
                        <div className="text-right text-xs italic mt-1">Ngày đặt hàng: {new Date(orderDate).toLocaleDateString('vi-VN')}</div>
                    </div>
                     <div className="mb-4 text-[13px]">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                            <div className="flex"><span className="font-bold w-36">Tên Khách hàng:</span><span>{customer?.name}</span></div>
                            <div className="flex"><span className="font-bold w-36">Nhân viên phụ trách:</span><span>{user.fullName}</span></div>
                            <div className="flex"><span className="font-bold w-36">Số điện thoại:</span><span>{customer?.phone}</span></div>
                            <div className="flex col-span-2"><span className="font-bold w-36 shrink-0">Địa chỉ:</span><span>{customer?.address}</span></div>
                        </div>
                    </div>
                    {/* TABLE I */}
                    <table className="w-full text-[12px] border-collapse border border-gray-300 mb-4">
                        <thead>
                            <tr className="bg-navy-print bg-baby-navy text-white text-center font-bold"><th colSpan={8} className="p-1 text-left uppercase">I. Bảng liệt kê đơn hàng bán</th></tr>
                            <tr className="bg-gray-100 text-center font-bold text-[11px]">
                                <th className="border p-1 w-8">STT</th><th className="border p-1">Tên sản phẩm</th><th className="border p-1">Dòng</th><th className="border p-1">Quy cách</th>
                                <th className="border p-1">SL</th><th className="border p-1">ĐVT</th><th className="border p-1">Đơn giá</th><th className="border p-1">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {iceCreamItems.map((item, idx) => (
                                <tr key={idx} className="border-b text-center">
                                    <td className="border p-1">{idx + 1}</td><td className="border p-1 text-left font-medium">Kem {item.flavor}</td>
                                    <td className="border p-1">{item.line}</td><td className="border p-1">{item.size}</td><td className="border p-1">{item.quantity}</td>
                                    <td className="border p-1">Hộp</td><td className="border p-1 text-right">{formatCurrency(item.price)}</td><td className="border p-1 text-right font-medium">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold bg-gray-50"><td colSpan={4} className="border p-1 text-right uppercase">Tổng hàng bán (I)</td><td className="border p-1 text-center">{totalQtySold}</td><td colSpan={2} className="border p-1"></td><td className="border p-1 text-right text-baby-navy">{formatCurrency(revenueIceCream)}</td></tr>
                        </tfoot>
                    </table>
                     {/* TABLE II */}
                     <table className="w-full text-[12px] border-collapse border border-gray-300 mb-4">
                        <thead>
                            <tr className="bg-navy-print bg-baby-navy text-white text-center font-bold"><th colSpan={8} className="p-1 text-left uppercase">II. Bảng liệt kê dụng cụ và topping</th></tr>
                            <tr className="bg-gray-100 text-center font-bold text-[11px]">
                                <th className="border p-1 w-8">STT</th><th className="border p-1">Tên sản phẩm</th><th className="border p-1">Dòng</th><th className="border p-1">Quy cách</th>
                                <th className="border p-1">SL</th><th className="border p-1">ĐVT</th><th className="border p-1">Đơn giá</th><th className="border p-1">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {toppingItems.map((item, idx) => (
                                <tr key={idx} className="border-b text-center">
                                    <td className="border p-1">{idx + 1}</td><td className="border p-1 text-left font-medium">{item.name}</td>
                                    <td className="border p-1">-</td><td className="border p-1">-</td><td className="border p-1">{item.quantity}</td>
                                    <td className="border p-1">{item.unit}</td><td className="border p-1 text-right">{formatCurrency(item.price)}</td><td className="border p-1 text-right font-medium">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                            {toppingItems.length === 0 && <tr><td colSpan={8} className="p-1 border text-center italic">Không có dụng cụ/topping bán kèm</td></tr>}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold bg-gray-50"><td colSpan={7} className="border p-1 text-right uppercase">Tổng dụng cụ và topping (II)</td><td className="border p-1 text-right text-baby-navy">{formatCurrency(revenueTopping)}</td></tr>
                        </tfoot>
                    </table>
                    {/* TABLE III */}
                    <table className="w-full text-[12px] border-collapse border border-gray-300 mb-4">
                        <thead>
                            <tr className="bg-navy-print bg-baby-navy text-white text-center font-bold"><th colSpan={8} className="p-1 text-left uppercase">III. Bảng liệt kê Chiết khấu và Quà tặng</th></tr>
                            <tr className="bg-gray-100 text-center font-bold text-[11px]">
                                <th className="border p-1 w-8">STT</th><th className="border p-1">Tên sản phẩm</th><th className="border p-1">Dòng</th><th className="border p-1">Quy cách</th>
                                <th className="border p-1">SL</th><th className="border p-1">ĐVT</th><th className="border p-1">Đơn giá</th><th className="border p-1">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                             {discountItems.map((item, idx) => (
                                <tr key={`d-${idx}`} className="border-b text-center italic text-gray-600">
                                    <td className="border p-1">{idx + 1}</td><td className="border p-1 text-left font-medium">Chiết khấu: Kem {item.flavor}</td>
                                    <td className="border p-1">{item.line}</td><td className="border p-1">{item.size}</td><td className="border p-1">{item.quantity}</td>
                                    <td className="border p-1">Hộp</td><td className="border p-1 text-right">{formatCurrency(item.price)}</td><td className="border p-1 text-right font-medium">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                             {giftToppingItems.map((item, idx) => (
                                <tr key={`g-${idx}`} className="border-b text-center italic text-gray-600">
                                    <td className="border p-1">{discountItems.length + idx + 1}</td><td className="border p-1 text-left font-medium">Tặng: {item.name}</td>
                                    <td className="border p-1">-</td><td className="border p-1">-</td><td className="border p-1">{item.quantity}</td>
                                    <td className="border p-1">{item.unit}</td><td className="border p-1 text-right">{formatCurrency(item.price)}</td><td className="border p-1 text-right font-medium">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                            {discountItems.length === 0 && giftToppingItems.length === 0 && <tr><td colSpan={8} className="p-1 border text-center italic">Không có chiết khấu hay quà tặng</td></tr>}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold bg-gray-50"><td colSpan={4} className="border p-1 text-right uppercase">Tổng giá trị chiết khấu & quà tặng (III)</td><td className="border p-1 text-center">{totalQtyGift}</td><td colSpan={2} className="border p-1"></td><td className="border p-1 text-right text-baby-navy">{formatCurrency(totalValueGiftAll)}</td></tr>
                        </tfoot>
                    </table>
                    {/* TABLE IV */}
                    <table className="w-full text-[12px] border-collapse border border-gray-300 mb-6">
                        <thead>
                            <tr className="bg-navy-print bg-baby-navy text-white text-center font-bold"><th className="p-1 text-left uppercase">IV. Chi phí vận chuyển và bảo quản</th><th className="p-1 text-right bg-white text-black border-l border-gray-300 w-48">{formatCurrency(shippingCost)}</th></tr>
                        </thead>
                    </table>
                     <div className="flex flex-col items-end space-y-1 text-[13px] border-t-2 border-baby-navy pt-3 mb-6">
                        <div className="flex justify-between w-full md:w-1/2 border-b border-gray-100 pb-1"><span className="font-bold">Tổng giá trị đơn hàng (I + II + III + IV):</span><span className="font-bold text-lg">{formatCurrency(totalRevenue + totalValueGiftAll + shippingCost)}</span></div>
                        <div className="flex justify-between w-full md:w-1/2 pt-1"><span className="font-bold text-red-600 uppercase">Tổng giá trị thanh toán (I + II + IV):</span><span className="font-bold text-[14px] text-red-600">{formatCurrency(totalPayment)}</span></div>
                        {deposit > 0 && (
                            <React.Fragment>
                                <div className="flex justify-between w-full md:w-1/2 pt-1 border-t border-gray-200 mt-1 italic"><span className="">Đã cọc:</span><span>{formatCurrency(deposit)}</span></div>
                                <div className="flex justify-between w-full md:w-1/2 pt-1 font-bold text-blue-800"><span className="">Còn lại phải thu:</span><span>{formatCurrency(remainingPayment)}</span></div>
                            </React.Fragment>
                        )}
                    </div>
                     <div className="flex justify-between text-center mt-8">
                        <div className="w-1/3"><div className="font-bold uppercase mb-16">NGƯỜI ĐẶT HÀNG</div><div className="font-bold">{customer?.name}</div></div>
                        <div className="w-1/3"><div className="font-bold uppercase mb-16">NGƯỜI LẬP ĐƠN</div><div className="font-bold">{user.fullName}</div></div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 gap-4">
                    <p><strong>Khách hàng:</strong> {customer?.name}</p>
                    <p><strong>Ngày đặt:</strong> {orderDate}</p>
                </div>
            </div>
            
            <div className="flex flex-col items-end text-lg text-gray-700 mb-6 bg-gray-50 p-4 rounded space-y-2">
                <div className="flex justify-between w-full md:w-1/2"><span>Tổng kem (Mua):</span><span className="font-medium">{formatCurrency(revenueIceCream)}</span></div>
                <div className="flex justify-between w-full md:w-1/2"><span>Tổng topping:</span><span className="font-medium">{formatCurrency(revenueTopping)}</span></div>
                 <div className="flex justify-between w-full md:w-1/2"><span>Vận chuyển & Bảo quản:</span><span className="font-medium">{formatCurrency(shippingCost)}</span></div>
                <div className="flex justify-between w-full md:w-1/2 text-xl font-bold text-red-600 border-t-2 border-red-200 pt-2">
                    <span>Tổng thanh toán:</span><span>{formatCurrency(totalPayment)}</span>
                </div>
                {deposit > 0 && (
                     <div className="flex justify-between w-full md:w-1/2 text-sm text-green-700">
                        <span>Đã cọc:</span><span>{formatCurrency(deposit)}</span>
                    </div>
                )}
                 {deposit > 0 && (
                     <div className="flex justify-between w-full md:w-1/2 text-lg font-bold text-blue-800 border-t border-blue-200 pt-1">
                        <span>Còn lại:</span><span>{formatCurrency(remainingPayment)}</span>
                    </div>
                )}
                {totalDiscountValue > 0 && <div className="text-xs text-orange-600 italic">Chiết khấu (Kem): {formatCurrency(totalDiscountValue)}</div>}
                {totalGiftValue > 0 && <div className="text-xs text-green-600 italic">Tặng đơn đầu (Hàng hóa): {formatCurrency(totalGiftValue)}</div>}
            </div>

            <div className="flex justify-between gap-4">
                <Button variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>Sửa lại</Button>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleExportPDF} disabled={isExporting || isSubmitting}>
                         {isExporting ? 'Đang tạo...' : 'Xuất file PDF'}
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <><Loader2 className="mr-2 animate-spin" size={18}/> Đang lưu...</>
                        ) : (
                            <><CheckCircle className="mr-2" size={18}/> Xác nhận & Lưu</>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
  }

  // --- VIEW: INPUT FORM ---
  return (
    <div className="max-w-6xl mx-auto bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
      <div className="flex items-center mb-6 gap-2">
        <button onClick={onBack} className="text-gray-500 hover:text-baby-navy"><ArrowLeft size={24} /></button>
        <h2 className="text-2xl font-bold text-baby-navy">Tạo đơn hàng mới</h2>
      </div>

      <div className="flex flex-col gap-6 mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="w-full">
            <label className="text-sm font-medium text-gray-700 block mb-1">Chọn Khách hàng *</label>
            <div className="flex gap-2">
                <div className="flex-grow">
                    <Select 
                        value={selectedCustomerId} 
                        onChange={e => setSelectedCustomerId(e.target.value)} 
                        options={customerOptions}
                        className="w-full"
                    />
                </div>
            </div>
            {selectedCustomerId && isFirstOrder && (
               <div className="mt-2 flex items-center gap-2 text-sm font-bold text-green-600 bg-green-50 p-2 rounded border border-green-200 animate-pulse">
                  <Gift size={16} /><span>Khách hàng mới: Có quà tặng đơn đầu!</span>
               </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><Input label="Ngày mua hàng" type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)}/></div>
            <div>
                 <label className="text-sm font-medium text-baby-navy block mb-1">Vận chuyển & Bảo quản (VNĐ)</label>
                 <div className="flex items-center gap-2">
                     <div className="flex-grow">
                         <Input type="number" min="0" step="1000" value={shippingCost} onChange={e => setShippingCost(parseFloat(e.target.value) || 0)} placeholder="0"/>
                     </div>
                     <div className="text-baby-navy p-2 bg-white border border-baby-navy rounded-lg"><Truck size={20} /></div>
                </div>
            </div>
            <div>
                 <label className="text-sm font-medium text-green-700 block mb-1">Tiền cọc (VNĐ)</label>
                 <div className="flex items-center gap-2">
                     <div className="flex-grow">
                         <Input type="number" min="0" step="1000" value={deposit} onChange={e => setDeposit(parseFloat(e.target.value) || 0)} placeholder="0"/>
                     </div>
                     <div className="text-green-700 p-2 bg-white border border-green-700 rounded-lg"><CreditCard size={20} /></div>
                </div>
            </div>
        </div>
      </div>

      <div className="flex items-end pb-3 pl-1 mb-4">
             <label className="flex items-center space-x-2 cursor-pointer select-none group">
                <input type="checkbox" className="w-5 h-5 text-baby-navy rounded focus:ring-baby-navy border-baby-navy accent-baby-navy" checked={hasInvoice} onChange={e => setHasInvoice(e.target.checked)}/>
                <span className="font-medium text-baby-navy group-hover:text-blue-800">Yêu cầu xuất hóa đơn</span>
             </label>
      </div>

      {/* 1. Paid Items Section (Ice Cream) */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-baby-navy border-l-4 border-baby-pink pl-2">Sản phẩm Kem (Mua)</h3>
            <Button variant="secondary" onClick={addIceCreamRow} size="sm"><Plus size={16} /> Thêm dòng kem</Button>
        </div>
        {iceCreamItems.length === 0 ? (
             <div className="text-gray-400 italic text-center py-4 border border-dashed rounded-lg">Chưa có sản phẩm kem mua nào</div>
        ) : (
            <div className="overflow-x-auto shadow-sm border rounded-lg">
                 <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-gray-100 text-sm text-gray-700">
                        <tr>
                            <th className="p-2 w-32">Dòng</th>
                            <th className="p-2 w-32">Định lượng</th>
                            <th className="p-2 min-w-[200px]">Vị Kem</th>
                            <th className="p-2 w-24">SL</th>
                            <th className="p-2 w-32 text-right">Đơn giá</th>
                            <th className="p-2 w-32 text-right">Thành tiền</th>
                            <th className="p-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {iceCreamItems.map((item, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                                <td className="p-2">
                                    <select className={tableInputClass} value={item.line} onChange={(e) => updateIceCreamRow(idx, 'line', e.target.value)}>
                                        <option value="PRO">PRO</option>
                                        <option value="PROMAX">PROMAX</option>
                                    </select>
                                </td>
                                <td className="p-2">
                                    <select className={tableInputClass} value={item.size} onChange={(e) => updateIceCreamRow(idx, 'size', e.target.value)}>
                                        <option value="">Chọn</option>
                                        {SIZES_BY_LINE[item.line].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </td>
                                <td className="p-2">
                                    <select className={tableInputClass} value={item.flavor} onChange={(e) => updateIceCreamRow(idx, 'flavor', e.target.value)}>
                                        <option value="">Chọn vị</option>
                                        {FLAVORS.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </td>
                                <td className="p-2"><input type="number" min="1" className={`${tableInputClass} text-center`} value={item.quantity} onChange={(e) => updateIceCreamRow(idx, 'quantity', parseInt(e.target.value) || 0)}/></td>
                                <td className="p-2 text-right text-sm text-gray-600">{formatCurrency(item.price)}</td>
                                <td className="p-2 text-right font-medium">{formatCurrency(item.total)}</td>
                                <td className="p-2 text-center"><button onClick={() => removeIceCreamRow(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* 2. Discount Section (Ice Cream - Available for everyone) */}
      <div className="mb-8 p-4 rounded-lg border border-orange-200 bg-orange-50/30">
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-orange-700 flex items-center gap-2">
                <Percent size={24}/> Chiết khấu kem theo đơn hàng
            </h3>
            <Button className="bg-orange-600 text-white hover:bg-orange-700" onClick={addDiscountRow} size="sm">
                <Plus size={16} /> Thêm chiết khấu
            </Button>
        </div>
        {discountItems.length === 0 ? (
             <div className="text-gray-400 italic text-center py-4 border border-dashed border-orange-200 rounded-lg bg-white">
                Chưa có sản phẩm chiết khấu nào
            </div>
        ) : (
            <div className="overflow-x-auto bg-white rounded-lg border border-orange-200 shadow-sm">
                 <table className="w-full text-left min-w-[800px]">
                    <thead className="text-sm bg-orange-100 text-orange-800">
                        <tr>
                            <th className="p-2 w-32">Dòng</th>
                            <th className="p-2 w-32">Định lượng</th>
                            <th className="p-2 min-w-[200px]">Vị Kem</th>
                            <th className="p-2 w-24">SL</th>
                            <th className="p-2 w-32 text-right">Đơn giá (Gốc)</th>
                            <th className="p-2 w-32 text-right">Giá trị</th>
                            <th className="p-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {discountItems.map((item, idx) => (
                            <tr key={idx} className="border-b last:border-0 hover:bg-orange-50/50">
                                <td className="p-2">
                                    <select className={tableInputClass} value={item.line} onChange={(e) => updateDiscountRow(idx, 'line', e.target.value)}>
                                        <option value="PRO">PRO</option>
                                        <option value="PROMAX">PROMAX</option>
                                    </select>
                                </td>
                                <td className="p-2">
                                    <select className={tableInputClass} value={item.size} onChange={(e) => updateDiscountRow(idx, 'size', e.target.value)}>
                                        <option value="">Chọn</option>
                                        {SIZES_BY_LINE[item.line as IceCreamLine].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </td>
                                <td className="p-2">
                                    <select className={tableInputClass} value={item.flavor} onChange={(e) => updateDiscountRow(idx, 'flavor', e.target.value)}>
                                        <option value="">Chọn vị</option>
                                        {FLAVORS.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </td>
                                <td className="p-2">
                                    <input type="number" min="1" className={`${tableInputClass} text-center`} value={item.quantity} onChange={(e) => updateDiscountRow(idx, 'quantity', parseInt(e.target.value) || 0)} />
                                </td>
                                <td className="p-2">
                                    <input type="number" min="0" step="1000" className={`${tableInputClass} text-right`} value={item.price} onChange={(e) => updateDiscountRow(idx, 'price', parseFloat(e.target.value) || 0)} placeholder="0" />
                                </td>
                                <td className="p-2 text-right font-medium text-orange-600">
                                    {formatCurrency(item.total)}
                                </td>
                                <td className="p-2 text-center">
                                    <button onClick={() => removeDiscountRow(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="font-bold bg-orange-50 text-orange-800">
                        <tr>
                            <td colSpan={5} className="p-2 text-right">Tổng giá trị chiết khấu:</td>
                            <td className="p-2 text-right">{formatCurrency(totalDiscountValue)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        )}
      </div>

      {/* 3. First Order Gift Section (Topping/Tools - Conditional) */}
      {selectedCustomerId && isFirstOrder && (
          <div className="mb-8 p-4 rounded-lg border border-green-200 bg-green-50/30">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-green-700 flex items-center gap-2">
                    <Gift size={24}/> Tặng Đơn Đầu (Hàng tặng kèm)
                </h3>
                <Button className="bg-green-600 text-white hover:bg-green-700" onClick={addGiftRow} size="sm">
                    <Plus size={16} /> Thêm quà tặng
                </Button>
            </div>
            {giftToppingItems.length === 0 ? (
                <div className="text-gray-400 italic text-center py-4 border border-dashed border-green-200 rounded-lg bg-white">
                    Chưa có quà tặng nào
                </div>
            ) : (
                <div className="overflow-x-auto bg-white rounded-lg border border-green-200 shadow-sm">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="text-sm bg-green-100 text-green-800">
                            <tr>
                                <th className="p-2 min-w-[200px]">Tên quà tặng/dụng cụ</th>
                                <th className="p-2 w-32">Đơn vị tính</th>
                                <th className="p-2 w-24">Số lượng</th>
                                <th className="p-2 w-32 text-right">Đơn giá (Chỉ hiển thị)</th>
                                <th className="p-2 w-32 text-right">Thành tiền</th>
                                <th className="p-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {giftToppingItems.map((item, idx) => (
                                <tr key={idx} className="border-b last:border-0 hover:bg-green-50/50">
                                    <td className="p-2">
                                        <input type="text" className={tableInputClass} value={item.name} placeholder="Nhập tên..." onChange={(e) => updateGiftRow(idx, 'name', e.target.value)} />
                                    </td>
                                    <td className="p-2">
                                        <input type="text" className={tableInputClass} value={item.unit} placeholder="Cái/Bộ..." onChange={(e) => updateGiftRow(idx, 'unit', e.target.value)} />
                                    </td>
                                    <td className="p-2">
                                        <input type="number" min="1" className={`${tableInputClass} text-center`} value={item.quantity} onChange={(e) => updateGiftRow(idx, 'quantity', parseInt(e.target.value) || 0)} />
                                    </td>
                                    <td className="p-2">
                                        <input type="number" min="0" step="1000" className={`${tableInputClass} text-right`} value={item.price} onChange={(e) => updateGiftRow(idx, 'price', parseFloat(e.target.value) || 0)} placeholder="0" />
                                    </td>
                                    <td className="p-2 text-right font-medium text-green-600">
                                        {formatCurrency(item.total)}
                                    </td>
                                    <td className="p-2 text-center">
                                        <button onClick={() => removeGiftRow(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="font-bold bg-green-50 text-green-800">
                            <tr>
                                <td colSpan={4} className="p-2 text-right">Tổng giá trị quà tặng:</td>
                                <td className="p-2 text-right">{formatCurrency(totalGiftValue)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
          </div>
      )}

      {/* 4. Topping Section (Paid) */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-baby-navy border-l-4 border-baby-pink pl-2">Topping & Dụng cụ (Mua)</h3>
            <Button variant="secondary" onClick={addToppingRow} size="sm"><Plus size={16} /> Thêm dòng</Button>
        </div>
        {toppingItems.length === 0 ? (
             <div className="text-gray-400 italic text-center py-4 border border-dashed rounded-lg">Không có topping hoặc dụng cụ mua thêm</div>
        ) : (
            <div className="overflow-x-auto shadow-sm border rounded-lg">
                 <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-gray-100 text-sm text-gray-700">
                        <tr>
                            <th className="p-2 min-w-[200px]">Tên Topping/Dụng cụ</th>
                            <th className="p-2 w-32">ĐVT</th>
                            <th className="p-2 w-24">SL</th>
                            <th className="p-2 w-32 text-right">Đơn giá</th>
                            <th className="p-2 w-32 text-right">Thành tiền</th>
                            <th className="p-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {toppingItems.map((item, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                                <td className="p-2"><input type="text" className={tableInputClass} value={item.name} placeholder="Nhập tên..." onChange={(e) => updateToppingRow(idx, 'name', e.target.value)}/></td>
                                <td className="p-2"><input type="text" className={tableInputClass} value={item.unit} placeholder="Cái/Gói..." onChange={(e) => updateToppingRow(idx, 'unit', e.target.value)}/></td>
                                <td className="p-2"><input type="number" min="1" className={`${tableInputClass} text-center`} value={item.quantity} onChange={(e) => updateToppingRow(idx, 'quantity', parseInt(e.target.value) || 0)}/></td>
                                <td className="p-2"><input type="number" min="0" step="1000" className={`${tableInputClass} text-right`} value={item.price} onChange={(e) => updateToppingRow(idx, 'price', parseFloat(e.target.value) || 0)}/></td>
                                <td className="p-2 text-right font-medium">{formatCurrency(item.total)}</td>
                                <td className="p-2 text-center"><button onClick={() => removeToppingRow(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
        <Button variant="outline" onClick={onBack}>Hủy bỏ</Button>
        <Button variant="primary" onClick={handleReview} className="px-8">Tiếp tục</Button>
      </div>
    </div>
  );
};
