import React, { useState } from 'react';
import { User, Role } from '../types';
import { Button } from './Button';
import { AddCustomer } from './AddCustomer';
import { CreateOrder } from './CreateOrder';
import { CustomerList, SalesLog, TotalSales } from './Reports';
import { Analysis } from './Analysis';
import { Overview } from './Overview';
import { UserManagement } from './UserManagement';
import { Users, FileText, ShoppingCart, PieChart, LogOut, TrendingUp, Menu, X, Home, ChevronRight, LayoutDashboard, UserCog } from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

type View = 'OVERVIEW' | 'ADD_CUSTOMER' | 'CREATE_ORDER' | 'CUSTOMER_LIST' | 'SALES_LOG' | 'TOTAL_SALES' | 'ANALYSIS' | 'USER_MANAGEMENT';

export const Dashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState<View>('OVERVIEW');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    closeMenu();
  };

  const SidebarItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => handleNavigate(view)}
        className={`
            w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 mb-1.5 font-medium
            ${isActive 
                ? 'bg-gradient-to-r from-baby-pink to-pink-300 text-baby-navy shadow-md translate-x-1' 
                : 'text-blue-100 hover:bg-white/10 hover:text-white hover:translate-x-1'}
        `}
      >
        <Icon size={20} className={isActive ? 'text-baby-navy' : 'text-blue-200 group-hover:text-white'} />
        <span>{label}</span>
        {isActive && <ChevronRight size={16} className="ml-auto opacity-70" />}
      </button>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'OVERVIEW':
        return <Overview user={user} />;
      case 'ADD_CUSTOMER':
        return <AddCustomer user={user} onBack={() => setCurrentView('OVERVIEW')} />;
      case 'CREATE_ORDER':
        return <CreateOrder user={user} onBack={() => setCurrentView('OVERVIEW')} />;
      case 'CUSTOMER_LIST':
        return <CustomerList user={user} onBack={() => setCurrentView('OVERVIEW')} onAddCustomer={() => setCurrentView('ADD_CUSTOMER')} />;
      case 'SALES_LOG':
        return <SalesLog user={user} onBack={() => setCurrentView('OVERVIEW')} />;
      case 'TOTAL_SALES':
        return <TotalSales user={user} onBack={() => setCurrentView('OVERVIEW')} />;
      case 'ANALYSIS':
        return <Analysis user={user} onBack={() => setCurrentView('OVERVIEW')} />;
      case 'USER_MANAGEMENT':
        return <UserManagement currentUser={user} onBack={() => setCurrentView('OVERVIEW')} />;
      default:
        return <Overview user={user} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans text-slate-800">
      
      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-baby-navy/80 z-[60] lg:hidden transition-opacity backdrop-blur-sm"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar - Navy Blue Background with Gradient */}
      <aside 
        className={`fixed inset-y-0 left-0 z-[70] w-72 bg-gradient-to-b from-baby-navy to-[#0d1245] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col lg:static lg:translate-x-0 lg:shadow-none lg:z-auto ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Sidebar Header */}
        <div className="p-4 bg-transparent text-white flex justify-between items-center lg:hidden shrink-0 border-b border-white/10">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-baby-pink rounded-full flex items-center justify-center text-baby-navy font-bold text-xl shadow-lg border-2 border-white">
                    BB
                </div>
                <div>
                  <h2 className="font-bold leading-tight tracking-wide">Baby Boss</h2>
                  <p className="text-xs text-blue-200 opacity-80">Manager App</p>
                </div>
             </div>
             <button onClick={closeMenu} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
               <X size={24} />
             </button>
        </div>

        {/* Desktop Sidebar Header */}
        <div className="hidden lg:flex p-6 items-center gap-3 border-b border-white/10 shrink-0">
             <div className="w-12 h-12 bg-gradient-to-br from-baby-pink to-pink-300 rounded-full flex items-center justify-center text-baby-navy font-extrabold text-xl shadow-lg border-4 border-white/20">
                BB
            </div>
            <div>
              <h2 className="font-extrabold text-white leading-tight text-xl tracking-wide">Baby Boss</h2>
              <p className="text-xs text-blue-200 font-medium tracking-wider uppercase">Manager App</p>
            </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-white/10 shrink-0 bg-white/5 backdrop-blur-sm">
           <div className="text-sm font-bold text-white truncate text-lg">{user.fullName}</div>
           <div className="text-xs text-blue-200 mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                {user.position}
           </div>
           <div className="text-[10px] text-baby-pink mt-2 font-bold uppercase tracking-wider bg-baby-pink/10 inline-block px-2 py-1 rounded">{user.branch}</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-1">
          <SidebarItem view="OVERVIEW" icon={LayoutDashboard} label="Tổng quan" />
          <div className="my-3 border-t border-white/10"></div>
          <SidebarItem view="ADD_CUSTOMER" icon={Users} label="Nhập khách hàng" />
          <SidebarItem view="CREATE_ORDER" icon={ShoppingCart} label="Tạo đơn hàng" />
          <div className="my-3 border-t border-white/10"></div>
          <SidebarItem view="CUSTOMER_LIST" icon={FileText} label="DS Khách hàng" />
          <SidebarItem view="SALES_LOG" icon={FileText} label="Nhật ký bán hàng" />
          <SidebarItem view="TOTAL_SALES" icon={PieChart} label="Tổng doanh số" />
          {(user.role === Role.ADMIN || user.role === Role.MANAGER) && (
             <SidebarItem view="ANALYSIS" icon={TrendingUp} label="Phân tích" />
          )}
          {user.role === Role.ADMIN && (
             <React.Fragment>
                <div className="my-3 border-t border-white/10"></div>
                <SidebarItem view="USER_MANAGEMENT" icon={UserCog} label="Quản lý nhân sự" />
             </React.Fragment>
          )}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10 shrink-0 bg-black/10">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-200 hover:bg-red-500/20 hover:text-red-100 rounded-xl transition-all font-medium group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-gray-50">
        {/* Header - Sticky on Mobile - White */}
        <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm lg:hidden shrink-0">
          <div className="px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <button 
                    onClick={toggleMenu}
                    className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors text-baby-navy"
                    aria-label="Open menu"
                  >
                    <Menu size={28} />
                  </button>
                  <span className="font-bold text-lg text-baby-navy truncate">Baby Boss Manager</span>
              </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow p-3 md:p-6 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-10">
             {renderContent()}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 text-center text-gray-400 text-xs shrink-0 hidden md:block">
          <p className="font-medium">© 2026 Baby Boss JSC., All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};
