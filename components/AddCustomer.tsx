import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Input, Select } from './Input';
import { DataService } from '../services/dataService';
import { User, Customer } from '../types';
import { Save, ArrowLeft, MapPin } from 'lucide-react';

interface Props {
  user: User;
  onBack: () => void;
}

interface LocationOption {
    code: number;
    name: string;
}

export const AddCustomer: React.FC<Props> = ({ user, onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    position: '',
    phone: '',
    email: '',
    repName: '',
    repPhone: '',
    repPosition: '',
    note: ''
  });

  // Address State
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [wards, setWards] = useState<LocationOption[]>([]);

  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [street, setStreet] = useState<string>('');
  
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Fetch Cities on Mount
  useEffect(() => {
    const fetchCities = async () => {
        try {
            const response = await fetch('https://provinces.open-api.vn/api/?depth=1');
            const data = await response.json();
            
            // Custom sort: HCM -> Hanoi -> Others A-Z
            const sorted = data.sort((a: any, b: any) => {
                if (a.name === "Thành phố Hồ Chí Minh") return -1;
                if (b.name === "Thành phố Hồ Chí Minh") return 1;
                if (a.name === "Thành phố Hà Nội") return -1;
                if (b.name === "Thành phố Hà Nội") return 1;
                return a.name.localeCompare(b.name);
            });

            setCities(sorted);
        } catch (error) {
            console.error("Failed to fetch cities", error);
        }
    };
    fetchCities();
  }, []);

  // Fetch Districts when City changes
  useEffect(() => {
    if (!selectedCity) {
        setDistricts([]);
        setWards([]);
        return;
    }
    const fetchDistricts = async () => {
        setIsLoadingLocation(true);
        try {
            const response = await fetch(`https://provinces.open-api.vn/api/p/${selectedCity}?depth=2`);
            const data = await response.json();
            setDistricts(data.districts || []);
            setWards([]); // Reset wards
            setSelectedDistrict('');
            setSelectedWard('');
        } catch (error) {
            console.error("Failed to fetch districts", error);
        } finally {
            setIsLoadingLocation(false);
        }
    };
    fetchDistricts();
  }, [selectedCity]);

  // Fetch Wards when District changes
  useEffect(() => {
    if (!selectedDistrict) {
        setWards([]);
        return;
    }
    const fetchWards = async () => {
        setIsLoadingLocation(true);
        try {
            const response = await fetch(`https://provinces.open-api.vn/api/d/${selectedDistrict}?depth=2`);
            const data = await response.json();
            setWards(data.wards || []);
            setSelectedWard('');
        } catch (error) {
            console.error("Failed to fetch wards", error);
        } finally {
            setIsLoadingLocation(false);
        }
    };
    fetchWards();
  }, [selectedDistrict]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.company || !formData.phone) {
      alert("Vui lòng điền đầy đủ các thông tin khách hàng bắt buộc (*)");
      return;
    }

    if (!selectedCity || !selectedDistrict || !selectedWard || !street) {
        alert("Vui lòng hoàn tất thông tin địa chỉ (Tỉnh, Quận/Huyện, Phường/Xã, Số nhà)");
        return;
    }

    // Construct Address String
    const cityName = cities.find(c => c.code === Number(selectedCity))?.name || '';
    const districtName = districts.find(d => d.code === Number(selectedDistrict))?.name || '';
    const wardName = wards.find(w => w.code === Number(selectedWard))?.name || '';
    
    const fullAddress = `${street}, ${wardName}, ${districtName}, ${cityName}`;

    const newCustomer: Customer = {
      id: Date.now().toString(),
      ...formData,
      address: fullAddress,
      createdBy: user.id,
      createdByName: user.fullName,
      createdAt: new Date().toISOString()
    };

    DataService.addCustomer(newCustomer);
    alert("Thêm khách hàng thành công!");
    onBack();
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <div className="flex items-center mb-6 gap-2">
        <button onClick={onBack} className="text-gray-500 hover:text-baby-navy">
            <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-baby-navy">Nhập khách hàng mới</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 text-sm text-gray-500 italic">* là thông tin bắt buộc</div>

        <Input 
          label="Tên khách hàng *" 
          required 
          value={formData.name} 
          onChange={e => setFormData({...formData, name: e.target.value})} 
        />
        <Input 
          label="Tên công ty/Cửa hàng *" 
          required 
          value={formData.company} 
          onChange={e => setFormData({...formData, company: e.target.value})} 
        />
        <Input 
          label="Chức vụ" 
          value={formData.position} 
          onChange={e => setFormData({...formData, position: e.target.value})} 
        />
        <Input 
          label="Số điện thoại *" 
          required 
          type="tel"
          value={formData.phone} 
          onChange={e => setFormData({...formData, phone: e.target.value})} 
        />
        <Input 
          label="Email" 
          type="email"
          value={formData.email} 
          onChange={e => setFormData({...formData, email: e.target.value})} 
        />
        
        {/* Address Section */}
        <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3 text-baby-navy font-bold">
                <MapPin size={18} />
                <h3>Địa chỉ liên hệ *</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select 
                    label="Tỉnh / Thành phố"
                    options={cities.map(c => ({ value: c.code, label: c.name }))}
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    placeholder="-- Chọn Tỉnh/Thành --"
                    required
                />
                <Select 
                    label="Quận / Huyện"
                    options={districts.map(d => ({ value: d.code, label: d.name }))}
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    placeholder={isLoadingLocation ? "Đang tải..." : "-- Chọn Quận/Huyện --"}
                    disabled={!selectedCity}
                    required
                />
                <Select 
                    label="Phường / Xã"
                    options={wards.map(w => ({ value: w.code, label: w.name }))}
                    value={selectedWard}
                    onChange={(e) => setSelectedWard(e.target.value)}
                    placeholder={isLoadingLocation ? "Đang tải..." : "-- Chọn Phường/Xã --"}
                    disabled={!selectedDistrict}
                    required
                />
                <Input 
                    label="Số nhà, Tên đường" 
                    value={street} 
                    onChange={e => setStreet(e.target.value)} 
                    placeholder="VD: 123 Nguyễn Huệ"
                    required 
                />
            </div>
        </div>

        <div className="md:col-span-2 border-t pt-4 mt-2">
           <h3 className="font-semibold text-baby-navy mb-4">Thông tin người đại diện (Nếu có)</h3>
        </div>

        <Input 
          label="Người liên hệ đại diện" 
          value={formData.repName} 
          onChange={e => setFormData({...formData, repName: e.target.value})} 
        />
        <Input 
          label="SĐT người đại diện" 
          type="tel"
          value={formData.repPhone} 
          onChange={e => setFormData({...formData, repPhone: e.target.value})} 
        />
        <Input 
          label="Chức vụ người đại diện" 
          value={formData.repPosition} 
          onChange={e => setFormData({...formData, repPosition: e.target.value})} 
        />

        <div className="md:col-span-2">
            <label className="text-sm font-semibold text-baby-navy block mb-1">Ghi chú</label>
            <textarea
                className="w-full bg-white text-baby-navy placeholder-baby-navy/60 border border-baby-navy rounded-xl px-3 py-2 text-sm h-24 resize-none outline-none focus:ring-4 focus:ring-baby-pink/30 hover:border-baby-navy/80 transition-all"
                value={formData.note}
                onChange={e => setFormData({...formData, note: e.target.value})}
                placeholder="Nhập ghi chú về khách hàng..."
            />
        </div>

        <div className="md:col-span-2 flex justify-end gap-3 mt-4">
          <Button type="button" variant="outline" onClick={onBack}>Hủy bỏ</Button>
          <Button type="submit" variant="primary">
            <Save size={18} /> Lưu khách hàng
          </Button>
        </div>
      </form>
    </div>
  );
};