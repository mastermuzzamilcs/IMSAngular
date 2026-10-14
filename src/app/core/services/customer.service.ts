import { Injectable } from '@angular/core';
import { collection, addDoc, getDocs, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { asStatus } from '../enums/status.enum';
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
    this.cachedCustomers = querySnapshot.docs.map((item) => this.mapCustomer(item.id, item.data()));
    return this.cachedCustomers;
  }

  async searchCustomers(name?: string, phone?: string, email?: string): Promise<Customer[]> {
    const customers = await this.getCustomers(true);
    const nameFilter = name?.trim().toLowerCase() || '';
    const phoneFilter = phone?.trim().toLowerCase() || '';
    const emailFilter = email?.trim().toLowerCase() || '';
    return customers.filter((customer) => {
      const matchesName = !nameFilter || customer.name.toLowerCase().includes(nameFilter);
      const matchesPhone = !phoneFilter || customer.phone.toLowerCase().includes(phoneFilter);
      const matchesEmail = !emailFilter || customer.email.toLowerCase().includes(emailFilter);
      return matchesName && matchesPhone && matchesEmail;
    });
  }

  async addCustomer(_Customer: Customer): Promise<string> {
    const customerRef = collection(firestore, this.topicName);
    const created = await addDoc(customerRef, this.payload(_Customer));
    this.cachedCustomers = null;
    return created.id;
  }

  async updateCustomer(_Customer: Customer): Promise<void> {
    if (!_Customer.id) {
      console.error('Customer ID is required for updating the customer.');
      return;
    }
    const customerRef = doc(firestore, this.topicName, _Customer.id);
    await setDoc(customerRef, this.payload(_Customer));
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
    if (!docSnap.exists()) {
      return null;
    }
    return this.mapCustomer(docSnap.id, docSnap.data());
  }

  async ensureCustomer(details: Partial<Customer>): Promise<string | null> {
    const name = details.name?.trim() || '';
    if (!name && !details.id) {
      return null;
    }
    const existing = await this.findExisting(details);
    if (existing?.id) {
      return existing.id;
    }
    if (!name) {
      return null;
    }
    return this.addCustomer({
      name,
      phone: details.phone?.trim() || '',
      email: details.email?.trim() || '',
      address: details.address?.trim() || '',
      status: asStatus(details.status),
    });
  }

  private async findExisting(details: Partial<Customer>): Promise<Customer | null> {
    const customers = await this.getCustomers(true);
    if (details.id) {
      const byId = customers.find((customer) => customer.id === details.id);
      if (byId) {
        return byId;
      }
    }
    const phone = details.phone?.trim();
    if (phone) {
      const byPhone = customers.find((customer) => customer.phone.trim() === phone);
      if (byPhone) {
        return byPhone;
      }
    }
    const email = details.email?.trim().toLowerCase();
    if (email) {
      const byEmail = customers.find((customer) => customer.email.trim().toLowerCase() === email);
      if (byEmail) {
        return byEmail;
      }
    }
    const name = details.name?.trim().toLowerCase();
    if (name && !phone && !email) {
      return customers.find((customer) => customer.name.trim().toLowerCase() === name) || null;
    }
    return null;
  }

  private payload(customer: Customer) {
    return {
      name: customer.name?.trim() || '',
      phone: customer.phone?.trim() || '',
      email: customer.email?.trim() || '',
      address: customer.address?.trim() || '',
      status: asStatus(customer.status),
    };
  }

  private mapCustomer(id: string, data: Record<string, unknown>): Customer {
    return {
      id,
      name: String(data['name'] || ''),
      phone: String(data['phone'] || ''),
      email: String(data['email'] || ''),
      address: String(data['address'] || data['location'] || ''),
      status: asStatus(data['status']),
    };
  }
}
