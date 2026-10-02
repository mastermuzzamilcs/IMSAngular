import { Injectable } from '@angular/core';
import { collection, addDoc, getDocs, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { Customer } from '../Models/CustomerModel';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  constructor() {}

  private readonly topicName: string = 'Sys_Customers';
  private cachedCustomers: Customer[] | null = null;
  async getCustomers(forceRefresh: boolean = false): Promise<Customer[]> {
    if (this.cachedCustomers && !forceRefresh) {
      return this.cachedCustomers;
    }
    const querySnapshot = await getDocs(collection(firestore, this.topicName));
    this.cachedCustomers = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data['name'] || '',
        location: data['location'] || '',
        description: data['description'] || '',
        status: data['status'] || '',
      };
    });
    return this.cachedCustomers;
  }

  async addCustomer(_Customer: Customer): Promise<void> {
    const customerRef = collection(firestore, this.topicName);
    await addDoc(customerRef, _Customer);
    this.cachedCustomers = null;
  }
  async updateCustomer(_Customer: Customer): Promise<void> {
    if (!_Customer.id) {
      console.error('Customer ID is required for updating the customer.');
      return;
    }
    const customerRef = doc(firestore, this.topicName, _Customer.id);
    await setDoc(customerRef, _Customer);
    this.cachedCustomers = null;
  }
  async deleteCustomer(_CustomerId: string): Promise<void> {
    const customerRef = doc(firestore, this.topicName, _CustomerId);
    await deleteDoc(customerRef);
    this.cachedCustomers = null;
  }
  async getCustomerById(customerid: string): Promise<Customer | null> {
    const docRef = doc(firestore, this.topicName, customerid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data['name'] || '',
        location: data['location'] || '',
        description: data['description'] || '',
        status: data['status'] || '',
      } as Customer;
    } else {
      return null;
    }
  }
}
