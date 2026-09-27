import { create } from 'zustand';
type RegisterStore = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  registerData: Partial<RegisterStore> | null;
  setRegisterData: (data: Partial<RegisterStore>) => void;
  setPhone: (phone: string) => void;
  setPassword: (password: string) => void;
  clear: () => void;
};

export const useRegisterStore = create<RegisterStore>((set) => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  registerData: null,
  setRegisterData: (data: Partial<RegisterStore>) => set({ ...data, registerData: data }),
  setPhone: (phone: string) => set({ phone }),
  setPassword: (password: string) => set({ password }),
  clear: () =>
    set({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      registerData: null
    })
}));
