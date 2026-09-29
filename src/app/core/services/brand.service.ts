import { Injectable } from '@angular/core';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  getDoc,
  query,
  where,
} from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { Brand } from '../Models/BrandModel';

@Injectable({ providedIn: 'root' })
export class BrandService {
  constructor() {}
  private readonly topicName: string = 'Sys_Brands';
  private brandCache = new Map<string, Brand>();

  private setBrandInCache(brand: Brand) {
    if (brand.id) this.brandCache.set(brand.id, brand);
  }
  private clearCache() {
    this.brandCache.clear();
  }
  async getBrands(forceRefresh: boolean = false): Promise<Brand[]> {
    if (!forceRefresh && this.brandCache.size > 0) {
      return Array.from(this.brandCache.values());
    }

    const snapshot = await getDocs(collection(firestore, this.topicName));
    this.brandCache.clear();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const brand: Brand = {
        id: doc.id,
        name: data['name'] || '',
        alias: data['alias'] || '',
        description: data['description'] || '',
        country: data['country'] || '',
        status: data['status'] || '',
      };
      this.setBrandInCache(brand);
    });

    return Array.from(this.brandCache.values());
  }

  async addBrand(_brand: Brand): Promise<void> {
    await addDoc(collection(firestore, this.topicName), _brand);
    this.clearCache(); // invalidate
  }

  async updateBrand(_brand: Brand): Promise<void> {
    if (!_brand.id) {
      console.error('Brand ID is required for update.');
      return;
    }

    const brandRef = doc(firestore, this.topicName, _brand.id);
    await setDoc(brandRef, _brand);
    this.setBrandInCache(_brand); // update cache
  }

  async deleteBrand(_brandId: string): Promise<void> {
    await deleteDoc(doc(firestore, this.topicName, _brandId));
    this.brandCache.delete(_brandId);
  }

  async getBrandById(brandId: string): Promise<Brand | null> {
    if (this.brandCache.has(brandId)) {
      return this.brandCache.get(brandId) ?? null;
    }

    const docSnap = await getDoc(doc(firestore, this.topicName, brandId));
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    const brand: Brand = {
      id: docSnap.id,
      name: data['name'] || '',
      alias: data['alias'] || '',
      description: data['description'] || '',
      country: data['country'] || '',
      status: data['status'] || '',
    };
    this.setBrandInCache(brand);
    return brand;
  }

  async getBrandsByIds(ids: string[]): Promise<Brand[]> {
    const uncachedIds = ids.filter((id) => !this.brandCache.has(id));
    const result: Brand[] = [];

    for (let i = 0; i < uncachedIds.length; i += 10) {
      const batch = uncachedIds.slice(i, i + 10);
      const q = query(collection(firestore, this.topicName), where('__name__', 'in', batch));
      const snap = await getDocs(q);
      snap.forEach((doc) => {
        const brand = { id: doc.id, ...doc.data() } as Brand;
        this.setBrandInCache(brand);
      });
    }

    ids.forEach((id) => {
      const cached = this.brandCache.get(id);
      if (cached) result.push(cached);
    });

    return result;
  }
}
