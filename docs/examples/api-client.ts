/**
 * Example API Client
 * 
 * A TypeScript client for the Property Manager API.
 * Use this as a reference or starting point for your integration.
 */

interface ApiConfig {
  apiKey: string;
  baseUrl?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasMore: boolean;
  };
}

interface ApiError {
  error: {
    message: string;
    code: string;
    status: number;
  };
}

interface Property {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  type: string;
  status: string;
  amenities: string[];
  unitCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Unit {
  id: string;
  propertyId: string;
  propertyName: string;
  name: string;
  type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqFt: number | null;
  rentAmount: number;
  isAvailable: boolean;
  availableFrom: string | null;
  amenities: string[];
  createdAt: string;
  updatedAt: string;
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  lease: {
    id: string;
    status: string;
    startDate: string;
    endDate: string | null;
    rentAmount: number;
  };
  unit: {
    id: string;
    name: string;
  };
  property: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface Lease {
  id: string;
  unitId: string;
  tenantId: string;
  startDate: string;
  endDate: string | null;
  rentAmount: number;
  billingDayOfMonth: number;
  status: string;
  tenant: {
    id: string;
    name: string;
    email: string;
  };
  unit: {
    id: string;
    name: string;
  };
  property: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Payment {
  id: string;
  leaseId: string;
  tenantId: string;
  dueDate: string;
  paidAt: string | null;
  amount: number;
  status: string;
  paymentMethod: string | null;
  tenant: {
    id: string;
    name: string;
    email: string;
  };
  unit: {
    id: string;
    name: string;
  };
  property: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface MaintenanceTicket {
  id: string;
  unitId: string | null;
  tenantId: string | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  cost: number | null;
  resolvedAt: string | null;
  unit: {
    id: string;
    name: string;
  } | null;
  property: {
    id: string;
    name: string;
  } | null;
  tenant: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

class PropertyManagerApiError extends Error {
  code: string;
  status: number;

  constructor(error: ApiError['error']) {
    super(error.message);
    this.name = 'PropertyManagerApiError';
    this.code = error.code;
    this.status = error.status;
  }
}

export class PropertyManagerClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ApiConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://your-domain.com/api/v1';
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
    params?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, value);
        }
      });
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new PropertyManagerApiError(data.error);
    }

    return data;
  }

  // ============ Properties ============

  async listProperties(options?: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Property>> {
    return this.request('GET', '/properties', undefined, {
      status: options?.status,
      type: options?.type,
      page: options?.page?.toString(),
      limit: options?.limit?.toString(),
    } as any);
  }

  async getProperty(id: string): Promise<{ data: Property }> {
    return this.request('GET', `/properties/${id}`);
  }

  async createProperty(data: {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
    type: string;
    description?: string;
    amenities?: string[];
  }): Promise<{ data: Property }> {
    return this.request('POST', '/properties', data);
  }

  async updateProperty(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      address: any;
      type: string;
      status: string;
      amenities: string[];
    }>
  ): Promise<{ data: Property }> {
    return this.request('PATCH', `/properties/${id}`, data);
  }

  async deleteProperty(id: string): Promise<{ data: { deleted: boolean } }> {
    return this.request('DELETE', `/properties/${id}`);
  }

  // ============ Units ============

  async listUnits(options?: {
    propertyId?: string;
    isAvailable?: boolean;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Unit>> {
    return this.request('GET', '/units', undefined, {
      propertyId: options?.propertyId,
      isAvailable: options?.isAvailable?.toString(),
      type: options?.type,
      page: options?.page?.toString(),
      limit: options?.limit?.toString(),
    } as any);
  }

  async createUnit(data: {
    propertyId: string;
    name: string;
    type: string;
    bedrooms?: number;
    bathrooms?: number;
    sizeSqFt?: number;
    rentAmount: number;
    amenities?: string[];
  }): Promise<{ data: Unit }> {
    return this.request('POST', '/units', data);
  }

  // ============ Tenants ============

  async listTenants(options?: {
    propertyId?: string;
    unitId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Tenant>> {
    return this.request('GET', '/tenants', undefined, {
      propertyId: options?.propertyId,
      unitId: options?.unitId,
      status: options?.status,
      page: options?.page?.toString(),
      limit: options?.limit?.toString(),
    } as any);
  }

  // ============ Leases ============

  async listLeases(options?: {
    propertyId?: string;
    unitId?: string;
    status?: string;
    tenantId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Lease>> {
    return this.request('GET', '/leases', undefined, {
      propertyId: options?.propertyId,
      unitId: options?.unitId,
      status: options?.status,
      tenantId: options?.tenantId,
      page: options?.page?.toString(),
      limit: options?.limit?.toString(),
    } as any);
  }

  async createLease(data: {
    unitId: string;
    tenantId: string;
    startDate: string;
    endDate?: string;
    rentAmount: number;
    billingDayOfMonth?: number;
  }): Promise<{ data: Lease }> {
    return this.request('POST', '/leases', data);
  }

  // ============ Payments ============

  async listPayments(options?: {
    leaseId?: string;
    tenantId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Payment>> {
    return this.request('GET', '/payments', undefined, {
      leaseId: options?.leaseId,
      tenantId: options?.tenantId,
      status: options?.status,
      startDate: options?.startDate,
      endDate: options?.endDate,
      page: options?.page?.toString(),
      limit: options?.limit?.toString(),
    } as any);
  }

  // ============ Maintenance ============

  async listMaintenanceTickets(options?: {
    unitId?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<MaintenanceTicket>> {
    return this.request('GET', '/maintenance', undefined, {
      unitId: options?.unitId,
      status: options?.status,
      priority: options?.priority,
      page: options?.page?.toString(),
      limit: options?.limit?.toString(),
    } as any);
  }

  async createMaintenanceTicket(data: {
    unitId?: string;
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<{ data: MaintenanceTicket }> {
    return this.request('POST', '/maintenance', data);
  }
}

// ============ Usage Example ============

async function main() {
  const client = new PropertyManagerClient({
    apiKey: 'pk_live_your_api_key_here',
    baseUrl: 'https://your-domain.com/api/v1',
  });

  try {
    // List all properties
    const properties = await client.listProperties({ status: 'active' });
    console.log('Properties:', properties.data);
    console.log('Total:', properties.pagination.total);

    // Get available units
    const units = await client.listUnits({ isAvailable: true });
    console.log('Available units:', units.data);

    // Create a maintenance ticket
    const ticket = await client.createMaintenanceTicket({
      unitId: 'unit-uuid-here',
      title: 'Broken AC',
      description: 'Air conditioning not working in bedroom',
      priority: 'high',
    });
    console.log('Created ticket:', ticket.data);

    // List recent payments
    const payments = await client.listPayments({
      status: 'paid',
      startDate: '2024-01-01',
    });
    console.log('Payments:', payments.data);

  } catch (error) {
    if (error instanceof PropertyManagerApiError) {
      console.error('API Error:', error.message);
      console.error('Code:', error.code);
      console.error('Status:', error.status);
    } else {
      throw error;
    }
  }
}

// Run example
main();

export default PropertyManagerClient;
