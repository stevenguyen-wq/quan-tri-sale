import React, { useState } from 'react';
import { DataService } from '../services/dataService';
import { User } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import { RefreshCw, Phone, AlertCircle } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

export const Login: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
        // 1. Attempt to sync data first
        setLoadingMessage('Đang kết nối hệ thống...');
        const syncSuccess = await DataService.syncWithSheet();
        
        // 2. Perform login check against local data (whether sync succeeded or not)
        setLoadingMessage('Đang kiểm tra thông tin...');
        const user = DataService.login(username, password);
        
        if (user) {
            if (!syncSuccess) {
                alert("Cảnh báo: Không thể kết nối với Google Sheet. Bạn đang đăng nhập bằng dữ liệu cũ trên thiết bị.");
            }
            onLogin(user);
        } else {
            if (!syncSuccess) {
                 setError('Lỗi kết nối Server và không tìm thấy tài khoản. Vui lòng kiểm tra internet hoặc đường dẫn API.');
            } else {
                 setError('Tên đăng nhập hoặc mật khẩu không đúng');
            }
        }
    } catch (err) {
        setError('Đã xảy ra lỗi không xác định.');
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="bg-baby-navy p-8 text-center">
            <div className="w-20 h-20 bg-baby-pink rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg">
                <span className="text-3xl font-bold text-baby-navy">BB</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Baby Boss JSC</h1>
            <p className="text-blue-200 text-sm mt-1">Hệ thống quản lý bán hàng</p>
        </div>
        
        <div className="p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
                label="Tên đăng nhập"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nhập username"
                disabled={isLoading}
            />
            <Input
                label="Mật khẩu"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nhập password"
                disabled={isLoading}
            />
            {error && (
                <div className="bg-red-50 p-3 rounded-lg flex gap-2 items-start text-red-600 text-sm">
                    <AlertCircle size={16} className="mt-0.5 shrink-0"/>
                    <span>{error}</span>
                </div>
            )}
            {isLoading && (
                <div className="flex items-center justify-center gap-2 text-baby-navy text-sm py-2">
                    <RefreshCw className="animate-spin" size={16}/>
                    {loadingMessage}
                </div>
            )}
            
            <Button type="submit" fullWidth className="mt-2 text-lg py-3" disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
            </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <div className="flex items-center justify-center gap-2 text-baby-navy font-bold text-lg">
                    <Phone size={20} className="text-baby-pink" />
                    <span>Hotline: 0937152521</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
