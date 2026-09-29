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
  QueryConstraint,
  documentId,
} from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { Product } from '../Models/ProductModel';
import { BrandService } from './brand.service';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private _brandService: BrandService) {}

  private readonly topicName: string = 'Sys_Products';
  private productCache = new Map<string, Product>();

  private clearCache() {
    this.productCache.clear();
  }

  private setProductInCache(product: Product) {
    if (product.id) this.productCache.set(product.id, product);
  }

  async getProducts(forceRefresh: boolean = false): Promise<Product[]> {
    if (!forceRefresh && this.productCache.size > 0) {
      return Array.from(this.productCache.values());
    }

    const snapshot = await getDocs(collection(firestore, this.topicName));
    this.productCache.clear();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const product: Product = {
        id: doc.id,
        name: data['name'] || '',
        brandId: data['brandId'] || '',
        brand: '',
        description: data['description'] || '',
        price: data['price'] || 0.0,
        status: data['status'] || '',
      };
      this.setProductInCache(product);
    });

    return Array.from(this.productCache.values());
  }

  async addProduct(_Product: Product): Promise<void> {
    const branchRef = collection(firestore, this.topicName);
    await addDoc(branchRef, _Product);
    this.clearCache();
  }

  async updateProduct(_Product: Product): Promise<void> {
    if (!_Product.id) {
      console.error('Branch ID is required for updating the branch.');
      return;
    }

    const productRef = doc(firestore, this.topicName, _Product.id);
    await setDoc(productRef, _Product, { merge: true });
    this.setProductInCache(_Product);
  }

  async deleteProduct(_ProductId: string): Promise<void> {
    const branchRef = doc(firestore, this.topicName, _ProductId);
    await deleteDoc(branchRef);
    this.productCache.delete(_ProductId);
  }

  async getProductById(productId: string): Promise<Product | null> {
    if (this.productCache.has(productId)) {
      return this.productCache.get(productId) ?? null;
    }
    const docRef = doc(firestore, this.topicName, productId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    const product: Product = {
      id: docSnap.id,
      name: data['name'] || '',
      brandId: data['brandId'] || '',
      brand: '',
      description: data['description'] || '',
      price: data['price'] || 0,
      status: data['status'] || '',
    };

    this.setProductInCache(product);
    return product;
  }

  async searchProducts(
    brandId?: string,
    name?: string,
    description?: string,
    _forceRefresh: boolean = false,
  ): Promise<Product[]> {
    const colRef = collection(firestore, this.topicName);
    const constraints: QueryConstraint[] = [];

    if (brandId) {
      constraints.push(where('brandId', '==', brandId));
    }

    if (name) {
      constraints.push(where('name', '>=', name));
      constraints.push(where('name', '<=', name + '\uf8ff'));
    }

    if (description) {
      constraints.push(where('description', '>=', description));
      constraints.push(where('description', '<=', description + '\uf8ff'));
    }

    const finalQuery = constraints.length > 0 ? query(colRef, ...constraints) : colRef;
    const snapshot = await getDocs(finalQuery);

    const freshProducts = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const product: Product = {
          id: doc.id,
          name: data['name'] || '',
          brandId: data['brandId'] || '',
          brand: '',
          description: data['description'] || '',
          price: data['price'] || 0,
          status: data['status'] || '',
          ...data,
        };

        this.setProductInCache(product);

        const brand = await this._brandService.getBrandById(product.brandId);
        product.brand = brand?.name || 'Unknown';

        return product;
      }),
    );

    return freshProducts;
  }
  async getProductsByIds(ids: string[]): Promise<Product[]> {
    const uncachedIds = ids.filter((id) => !this.productCache.has(id));
    const result: Product[] = [];

    for (let i = 0; i < uncachedIds.length; i += 10) {
      const batch = uncachedIds.slice(i, i + 10);
      const q = query(collection(firestore, this.topicName), where(documentId(), 'in', batch));
      const snap = await getDocs(q);
      snap.forEach((doc) => {
        const product = { id: doc.id, ...doc.data() } as Product;
        this.setProductInCache(product);
      });
    }

    ids.forEach((id) => {
      const cached = this.productCache.get(id);
      if (cached) result.push(cached);
    });

    return result;
  }
}
