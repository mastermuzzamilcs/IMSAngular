import { Injectable } from '@angular/core';
import { collection, addDoc, getDocs, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { Vendor } from '../Models/VendorModel';

@Injectable({ providedIn: 'root' })
export class VendorService {
  constructor() {}
  private readonly topicName: string = 'Sys_Vendors';
  private cachedVendors: Vendor[] | null = null;

  async getVendors(forceRefresh: boolean = false): Promise<Vendor[]> {
    if (this.cachedVendors && !forceRefresh) {
      return this.cachedVendors;
    }
    const querySnapshot = await getDocs(collection(firestore, this.topicName));
    this.cachedVendors = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data['name'] || '',
        location: data['location'] || '',
        description: data['description'] || '',
        status: data['status'] || '',
      };
    });
    return this.cachedVendors;
  }

  async addVendor(_Vendor: Vendor): Promise<void> {
    const branchRef = collection(firestore, this.topicName);
    await addDoc(branchRef, _Vendor);
    this.cachedVendors = null;
  }

  async updateVendor(_Vendor: Vendor): Promise<void> {
    if (!_Vendor.id) {
      console.error('Branch ID is required for updating the branch.');
      return;
    }

    const branchRef = doc(firestore, this.topicName, _Vendor.id);
    await setDoc(branchRef, _Vendor);
    this.cachedVendors = null;
  }

  async deleteVendor(_VendorId: string): Promise<void> {
    const branchRef = doc(firestore, this.topicName, _VendorId);
    await deleteDoc(branchRef);
    this.cachedVendors = null;
  }
  async getVendorById(vendorid: string): Promise<Vendor | null> {
    const docRef = doc(firestore, this.topicName, vendorid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data['name'] || '',
        location: data['location'] || '',
        description: data['description'] || '',
        status: data['status'] || '',
      } as Vendor;
    } else {
      return null;
    }
  }
}
