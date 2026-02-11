import React, { useState, useEffect } from 'react';
import { User, Role, Branch } from '../types';
import { DataService } from '../services/dataService';
import { Button } from './Button';
import { Input, Select } from './Input';
import { Users, UserPlus, Edit2, Shield, Save, X, ArrowLeft } from 'lucide-react';

interface Props {
  currentUser: User;
  onBack: () => void;
}

export const UserManagement: React.FC<Props> = ({ currentUser, onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setUsers(DataService.getUsers());
  }, []);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleAddNew = () => {
      setEditingUser({
          role: Role.STAFF,
          branch: Branch.HOI_SO,
          position: 'Nhân viên kinh doanh'
      });
      setIsAdding(true);
      setIsEditing(true);
  };

  const handleSave = async () => {
      if (!editingUser.username || !editingUser.fullName || !editingUser.password) {
          alert("Vui lòng điền đầy đủ thông tin!");
          return;
      }

      if (isAdding) {
          try {
            const newUser: User = {
                id: `u${Date.now()}`,
                fullName: editingUser.fullName!,
                username: editingUser.username!,
                password: editingUser.password!,
                role: editingUser.role || Role.STAFF,
                branch: editingUser.branch || Branch.HOI_SO,
                phone: editingUser.phone || '',
                position: editingUser.position || ''
            };
            await DataService.addUser(newUser);
            alert("Thêm nhân viên thành công");
          } catch (e: any) {
              alert(e.message);
              return;
          }
      } else {
          // Update
           const updatedUser = { ...editingUser } as User;
           await DataService.updateUser(updatedUser);
           alert("Cập nhật thành công");
      }
      
      setUsers(DataService.getUsers());
      setIsEditing(false);
      setIsAdding(false);
  };

  const getDirectManager = (user: User) => {
      if (user.role === Role.ADMIN) return "---";
      if (user.role === Role.MANAGER) return "Admin (Ban Giám Đốc)";
      
      const managers = users.filter(u => u.branch === user.branch && u.role === Role.MANAGER);
      if (managers.length === 0) return <span className="text-red-500 italic">Chưa có quản lý</span>;
      return managers.map(m => m.fullName).join(', ');
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg min-h-screen border border-gray-100 text-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
             <button onClick={onBack} className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-all">
                  <ArrowLeft size={24} />
              </button>
            <div>
                <h2 className="text-2xl font-bold text-baby-navy flex items-center gap-2">
                    <Users size={24} /> Quản lý nhân sự
                </h2>
                <p className="text-sm text-gray-500">Phân quyền & Chỉ định quản lý theo Chi Nhánh</p>
            </div>
        </div>
        <Button onClick={handleAddNew}>
            <UserPlus size={18} /> Thêm nhân sự mới
        </Button>
      </div>

      {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                  <div className="bg-baby-navy p-4 text-white flex justify-between items-center">
                      <h3 className="font-bold text-lg">{isAdding ? 'Thêm nhân sự' : 'Cập nhật thông tin'}</h3>
                      <button onClick={() => setIsEditing(false)}><X size={24}/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <Input 
                        label="Họ và tên" 
                        value={editingUser.fullName || ''} 
                        onChange={e => setEditingUser({...editingUser, fullName: e.target.value})}
                      />
                      <div className="grid grid-cols-2 gap-4">
                           <Input 
                                label="Tên đăng nhập" 
                                value={editingUser.username || ''} 
                                onChange={e => setEditingUser({...editingUser, username: e.target.value})}
                                disabled={!isAdding} // Cannot change username
                           />
                           <Input 
                                label="Mật khẩu" 
                                value={editingUser.password || ''} 
                                onChange={e => setEditingUser({...editingUser, password: e.target.value})}
                           />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                           <Input 
                                label="Số điện thoại" 
                                value={editingUser.phone || ''} 
                                onChange={e => setEditingUser({...editingUser, phone: e.target.value})}
                           />
                           <Input 
                                label="Chức danh" 
                                value={editingUser.position || ''} 
                                onChange={e => setEditingUser({...editingUser, position: e.target.value})}
                           />
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                          <h4 className="font-bold text-baby-navy text-sm mb-3 flex items-center gap-2">
                              <Shield size={16}/> Phân quyền & Chi nhánh
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Select 
                                label="Vai trò (Role)"
                                options={[
                                    { value: Role.STAFF, label: 'Staff (Nhân viên)' },
                                    { value: Role.MANAGER, label: 'Manager (Quản lý)' },
                                    { value: Role.ADMIN, label: 'Admin (Quản trị)' }
                                ]}
                                value={editingUser.role}
                                onChange={e => setEditingUser({...editingUser, role: e.target.value as Role})}
                              />
                              <Select 
                                label="Chi nhánh làm việc"
                                options={[
                                    { value: Branch.HOI_SO, label: Branch.HOI_SO },
                                    { value: Branch.MIEN_BAC, label: Branch.MIEN_BAC }
                                ]}
                                value={editingUser.branch}
                                onChange={e => setEditingUser({...editingUser, branch: e.target.value as Branch})}
                              />
                          </div>
                          <p className="text-xs text-blue-600 mt-2 italic">
                              * Nhân viên sẽ tự động thuộc quyền quản lý của Manager trong cùng chi nhánh.
                          </p>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                          <Button variant="outline" onClick={() => setIsEditing(false)}>Hủy</Button>
                          <Button onClick={handleSave}><Save size={18}/> Lưu thông tin</Button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm text-left">
              <thead className="bg-baby-navy text-white text-xs uppercase tracking-wider">
                  <tr>
                      <th className="p-4">Họ tên</th>
                      <th className="p-4">Username / Password</th>
                      <th className="p-4">Vai trò</th>
                      <th className="p-4">Chi nhánh</th>
                      <th className="p-4 text-yellow-300 font-bold">Quản lý trực tiếp</th>
                      <th className="p-4 text-right">Thao tác</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="p-4">
                              <div className="font-bold text-baby-navy">{u.fullName}</div>
                              <div className="text-xs text-gray-500">{u.position}</div>
                          </td>
                          <td className="p-4 font-mono text-xs">
                              <div className="text-gray-700">{u.username}</div>
                              <div className="text-gray-400">******</div>
                          </td>
                          <td className="p-4">
                              <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                  ${u.role === Role.ADMIN ? 'bg-red-100 text-red-700' : 
                                    u.role === Role.MANAGER ? 'bg-purple-100 text-purple-700' : 
                                    'bg-green-100 text-green-700'}
                              `}>
                                  {u.role}
                              </span>
                          </td>
                          <td className="p-4 text-gray-700 font-medium">{u.branch}</td>
                          <td className="p-4 font-medium text-gray-600 bg-yellow-50/30">
                              {getDirectManager(u)}
                          </td>
                          <td className="p-4 text-right">
                              <button 
                                onClick={() => handleEdit(u)}
                                className="text-blue-500 hover:text-baby-navy hover:bg-blue-50 p-2 rounded-lg transition-all"
                              >
                                  <Edit2 size={18} />
                              </button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
};