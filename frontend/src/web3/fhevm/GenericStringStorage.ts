export class GenericStringStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  async setItem(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }
}



