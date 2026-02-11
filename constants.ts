import { IceCreamLine } from './types';

export const FLAVORS = [
  "Kem Bơ", "Kem Bubble gum", "Kem Cà phê", "Kem Chocolate cookie", "Kem Cốm",
  "Kem Đào", "Kem Dâu tằm", "Kem Dâu tây", "Kem Dừa", "Kem Dừa lưới",
  "Kem Khoai môn", "Kem Kiwi", "Kem Măng cầu", "Kem Mè đen", "Kem Nhãn",
  "Kem Ổi hồng", "Kem Rum nho", "Kem Sầu riêng", "Kem Socola", "Kem Sữa chua phô mai",
  "Kem Trà sữa", "Kem Trà xanh", "Kem Vải", "Kem Vani", "Kem Việt quất",
  "Kem Xoài", "Kem Bạc hà chip", "Kem Ngân hà", "Kem sữa chua", "Kem sữa gạo",
  "Kem Phúc Bồn Tử", "Kem Sorbet Chanh bạc hà", "Kem Sorbet Chanh dây", "Kem Sorbet Dứa mật"
];

export const PRICING = {
  PRO: {
    "80ml": 15000,
    "500ml": 48000,
    "2700ml": 235000,
    "3500ml": 295000,
  },
  // Adding variants for case insensitivity mapping
  Pro: {
    "80ml": 15000,
    "500ml": 48000,
    "2700ml": 235000,
    "3500ml": 295000,
  },
  PROMAX: {
    "80gr": 21000,
    "500ml": 79000,
    "2700ml": 279000,
    "3500ml": 375000,
  },
  "Pro Max": {
    "80gr": 21000,
    "500ml": 79000,
    "2700ml": 279000,
    "3500ml": 375000,
  }
};

export const SIZES_BY_LINE: Record<string, string[]> = {
  PRO: ["80ml", "500ml", "2700ml", "3500ml"],
  Pro: ["80ml", "500ml", "2700ml", "3500ml"],
  PROMAX: ["80gr", "500ml", "2700ml", "3500ml"],
  "Pro Max": ["80gr", "500ml", "2700ml", "3500ml"]
};

// Danh sách 34 Tỉnh/Thành phố trọng điểm 2025
export const TARGET_PROVINCES = [
    "Thành phố Hà Nội", "Thành phố Hồ Chí Minh", "Thành phố Hải Phòng", "Thành phố Đà Nẵng", "Thành phố Cần Thơ",
    "Tỉnh Quảng Ninh", "Tỉnh Bắc Ninh", "Tỉnh Hải Dương", "Tỉnh Hưng Yên", "Tỉnh Vĩnh Phúc", 
    "Tỉnh Thái Nguyên", "Tỉnh Bắc Giang", "Tỉnh Phú Thọ", "Tỉnh Nam Định", "Tỉnh Thái Bình", 
    "Tỉnh Hà Nam", "Tỉnh Ninh Bình", "Tỉnh Thanh Hóa", "Tỉnh Nghệ An", "Tỉnh Hà Tĩnh", 
    "Tỉnh Thừa Thiên Huế", "Tỉnh Khánh Hòa", "Tỉnh Lâm Đồng", "Tỉnh Bình Thuận", "Tỉnh Đồng Nai", 
    "Tỉnh Bình Dương", "Tỉnh Bà Rịa - Vũng Tàu", "Tỉnh Long An", "Tỉnh Tiền Giang", "Tỉnh Bến Tre", 
    "Tỉnh Vĩnh Long", "Tỉnh Kiên Giang", "Tỉnh Cà Mau", "Tỉnh Bình Phước"
];