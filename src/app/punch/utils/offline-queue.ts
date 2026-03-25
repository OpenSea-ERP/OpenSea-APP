/**
 * Offline Punch Queue
 * Armazena registros de ponto quando offline e sincroniza quando online
 */

export interface OfflinePunch {
  id: string;
  employeeId: string;
  type: 'CLOCK_IN' | 'CLOCK_OUT';
  timestamp: string;
  latitude?: number;
  longitude?: number;
  photoData?: string;
  createdAt: string;
}

class OfflineQueue {
  private storageKey = 'opensea_offline_punches';

  add(punch: OfflinePunch): void {
    const queue = this.getAll();
    queue.push(punch);
    localStorage.setItem(this.storageKey, JSON.stringify(queue));
  }

  getAll(): OfflinePunch[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  remove(id: string): void {
    const queue = this.getAll().filter(p => p.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(queue));
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }

  get count(): number {
    return this.getAll().length;
  }
}

export const offlineQueue = new OfflineQueue();
