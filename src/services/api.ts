import {
  Buyer,
  DashboardSummary,
  Expense,
  Farm,
  MilkRecord,
  Sale,
  User,
} from '../types';

const TOKEN_KEY = 'dairypulse_session_token';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  }

  clearToken(): void {
    this.setToken(null);
  }

  /**
   * Core request dispatcher to /api/action
   */
  private async request<T = any>(action: string, payload: Record<string, any> = {}): Promise<T> {
    const token = this.getToken();

    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          token: token || undefined,
          ...payload,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.error || 'Unable to connect to DairyPulse. Please check your connection and try again.';
        throw new Error(errorMsg);
      }

      if (!data) {
        throw new Error('Unable to connect to DairyPulse. Please check your connection and try again.');
      }

      if (data.success === false) {
        throw new Error(data.error || 'Operation failed. Please try again.');
      }

      return data as T;
    } catch (err: any) {
      if (err instanceof TypeError || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        throw new Error('Unable to connect to DairyPulse. Please check your connection and try again.');
      }
      throw err;
    }
  }

  async checkStatus(): Promise<{ configured: boolean; connected: boolean; message?: string; sheets?: string[] }> {
    try {
      const res = await fetch('/api/status');
      return await res.json();
    } catch {
      return { configured: false, connected: false, message: 'Unable to connect to DairyPulse.' };
    }
  }

  async setAppsScriptUrl(url: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/configure-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Failed to update Google Apps Script URL.' };
    }
  }

  async register(params: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    farmName: string;
    farmLocation: string;
    farmPhone?: string;
    farmDescription?: string;
  }): Promise<{ token: string; user: User; farm: Farm }> {
    try {
      const res = await this.request<{ token: string; user: User; farm: Farm }>('register', params);
      if (res.token) {
        this.setToken(res.token);
      }
      return res;
    } catch (err: any) {
      if (err.message && !err.message.includes('Unable to connect')) {
        throw err;
      }
      throw new Error('Account creation failed. Please try again.');
    }
  }

  async login(email: string, password: string): Promise<{ token: string; user: User; farm: Farm }> {
    const res = await this.request<{ token: string; user: User; farm: Farm }>('login', {
      email,
      password,
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async validateSession(): Promise<{ user: User; farm: Farm }> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No active session.');
    }
    return await this.request<{ user: User; farm: Farm }>('validateSession', { token });
  }

  async logout(): Promise<void> {
    const token = this.getToken();
    try {
      if (token) {
        await this.request('logout', { token });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      this.clearToken();
    }
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const todayDate = new Date().toISOString().slice(0, 10);
    const res = await this.request<{ summary: DashboardSummary }>('getDashboardSummary', { todayDate });
    return res.summary;
  }

  async getMilkRecords(): Promise<MilkRecord[]> {
    const res = await this.request<{ records: MilkRecord[] }>('getMilkRecords');
    return res.records || [];
  }

  async createMilkRecord(params: {
    date: string;
    morningLitres: number;
    eveningLitres: number;
    notes?: string;
  }): Promise<MilkRecord> {
    try {
      const res = await this.request<{ record: MilkRecord }>('createMilkRecord', params);
      return res.record;
    } catch (err: any) {
      if (err.message && !err.message.includes('Unable to connect')) {
        throw err;
      }
      throw new Error('Milk record could not be saved. Please try again.');
    }
  }

  async getExpenses(): Promise<Expense[]> {
    const res = await this.request<{ expenses: Expense[] }>('getExpenses');
    return res.expenses || [];
  }

  async createExpense(params: {
    date: string;
    category: string;
    amount: number;
    description?: string;
  }): Promise<Expense> {
    const res = await this.request<{ expense: Expense }>('createExpense', params);
    return res.expense;
  }

  async getBuyers(): Promise<Buyer[]> {
    const res = await this.request<{ buyers: Buyer[] }>('getBuyers');
    return res.buyers || [];
  }

  async createBuyer(params: {
    name: string;
    phone?: string;
    location?: string;
    notes?: string;
  }): Promise<Buyer> {
    const res = await this.request<{ buyer: Buyer }>('createBuyer', params);
    return res.buyer;
  }

  async getSales(): Promise<Sale[]> {
    const res = await this.request<{ sales: Sale[] }>('getSales');
    return res.sales || [];
  }

  async createSale(params: {
    buyerId?: string;
    buyerName: string;
    date: string;
    quantityLitres: number;
    pricePerLitre: number;
  }): Promise<Sale> {
    const res = await this.request<{ sale: Sale }>('createSale', params);
    return res.sale;
  }

  async getFarmDetails(): Promise<Farm> {
    const res = await this.request<{ farm: Farm }>('getFarmDetails');
    return res.farm;
  }

  async updateFarmDetails(params: {
    name: string;
    location: string;
    phone?: string;
    description?: string;
  }): Promise<Farm> {
    const res = await this.request<{ farm: Farm }>('updateFarmDetails', params);
    return res.farm;
  }

  async getFarmUsers(): Promise<User[]> {
    const res = await this.request<{ users: User[] }>('getFarmUsers');
    return res.users || [];
  }

  async createHerdsman(params: {
    name: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<User> {
    const res = await this.request<{ user: User }>('createHerdsman', params);
    return res.user;
  }
}

export const api = new ApiService();
