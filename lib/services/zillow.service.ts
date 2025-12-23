/**
 * Zillow API Service
 * Uses RapidAPI's Zillow API for property data
 * 
 * Features:
 * - Property search by address
 * - Property details (beds, baths, sqft, year built)
 * - Zestimate (property value)
 * - Rent Zestimate
 * - Property images
 * - Comparable properties
 */

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'zillow-com1.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;

export interface ZillowPropertySearchResult {
  zpid: string;
  address: {
    streetAddress: string;
    city: string;
    state: string;
    zipcode: string;
  };
  bedrooms: number;
  bathrooms: number;
  livingArea: number;
  yearBuilt: number;
  homeType: string;
  zestimate: number;
  rentZestimate: number;
  price: number;
  imgSrc: string;
}

export interface ZillowPropertyDetails {
  zpid: string;
  address: {
    streetAddress: string;
    city: string;
    state: string;
    zipcode: string;
    neighborhood?: string;
    county?: string;
  };
  bedrooms: number;
  bathrooms: number;
  livingArea: number;
  lotSize: number;
  yearBuilt: number;
  homeType: string;
  propertyTypeDimension: string;
  
  // Valuations
  zestimate: number;
  rentZestimate: number;
  taxAssessedValue: number;
  taxAssessedYear: number;
  
  // Property features
  description: string;
  features: string[];
  appliances: string[];
  flooring: string[];
  heating: string[];
  cooling: string[];
  parking: string[];
  
  // Images
  images: string[];
  
  // Schools
  schools: Array<{
    name: string;
    rating: number;
    distance: number;
    type: string;
    grades: string;
  }>;
  
  // Price history
  priceHistory: Array<{
    date: string;
    price: number;
    event: string;
  }>;
  
  // Tax history
  taxHistory: Array<{
    year: number;
    taxPaid: number;
    value: number;
  }>;
}

export interface ZillowComparable {
  zpid: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  livingArea: number;
  yearBuilt: number;
  zestimate: number;
  rentZestimate: number;
  distance: number;
  imgSrc: string;
  lastSoldPrice?: number;
  lastSoldDate?: string;
}

export interface ZillowSearchResponse {
  success: boolean;
  property?: ZillowPropertySearchResult;
  message?: string;
}

export interface ZillowDetailsResponse {
  success: boolean;
  details?: ZillowPropertyDetails;
  message?: string;
}

export interface ZillowCompsResponse {
  success: boolean;
  comps?: ZillowComparable[];
  message?: string;
}

class ZillowService {
  private async makeRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY is not configured');
    }

    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zillow API error:', response.status, errorText);
      throw new Error(`Zillow API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Search for a property by address
   */
  async searchByAddress(address: string): Promise<ZillowSearchResponse> {
    try {
      const data = await this.makeRequest('/propertyExtendedSearch', {
        location: address,
        status_type: 'ForSale,RecentlySold',
      });

      if (!data?.props || data.props.length === 0) {
        return {
          success: false,
          message: 'No property found at this address',
        };
      }

      const prop = data.props[0];
      
      return {
        success: true,
        property: {
          zpid: prop.zpid?.toString() || '',
          address: {
            streetAddress: prop.streetAddress || prop.address || '',
            city: prop.city || '',
            state: prop.state || '',
            zipcode: prop.zipcode || '',
          },
          bedrooms: prop.bedrooms || 0,
          bathrooms: prop.bathrooms || 0,
          livingArea: prop.livingArea || 0,
          yearBuilt: prop.yearBuilt || 0,
          homeType: prop.homeType || prop.propertyType || 'Unknown',
          zestimate: prop.zestimate || 0,
          rentZestimate: prop.rentZestimate || 0,
          price: prop.price || prop.zestimate || 0,
          imgSrc: prop.imgSrc || '',
        },
      };
    } catch (error: any) {
      console.error('Zillow search error:', error);
      return {
        success: false,
        message: error.message || 'Failed to search property',
      };
    }
  }

  /**
   * Get detailed property information by ZPID
   */
  async getPropertyDetails(zpid: string): Promise<ZillowDetailsResponse> {
    try {
      const data = await this.makeRequest('/property', {
        zpid,
      });

      if (!data) {
        return {
          success: false,
          message: 'Property details not found',
        };
      }

      return {
        success: true,
        details: {
          zpid: data.zpid?.toString() || zpid,
          address: {
            streetAddress: data.streetAddress || data.address?.streetAddress || '',
            city: data.city || data.address?.city || '',
            state: data.state || data.address?.state || '',
            zipcode: data.zipcode || data.address?.zipcode || '',
            neighborhood: data.neighborhood || '',
            county: data.county || '',
          },
          bedrooms: data.bedrooms || 0,
          bathrooms: data.bathrooms || 0,
          livingArea: data.livingArea || data.livingAreaValue || 0,
          lotSize: data.lotSize || data.lotAreaValue || 0,
          yearBuilt: data.yearBuilt || 0,
          homeType: data.homeType || 'Unknown',
          propertyTypeDimension: data.propertyTypeDimension || '',
          
          zestimate: data.zestimate || 0,
          rentZestimate: data.rentZestimate || 0,
          taxAssessedValue: data.taxAssessedValue || 0,
          taxAssessedYear: data.taxAssessedYear || 0,
          
          description: data.description || '',
          features: this.extractFeatures(data),
          appliances: data.resoFacts?.appliances || [],
          flooring: data.resoFacts?.flooring || [],
          heating: data.resoFacts?.heating || [],
          cooling: data.resoFacts?.cooling || [],
          parking: data.resoFacts?.parking || [],
          
          images: this.extractImages(data),
          
          schools: (data.schools || []).map((s: any) => ({
            name: s.name || '',
            rating: s.rating || 0,
            distance: s.distance || 0,
            type: s.type || '',
            grades: s.grades || '',
          })),
          
          priceHistory: (data.priceHistory || []).map((p: any) => ({
            date: p.date || '',
            price: p.price || 0,
            event: p.event || '',
          })),
          
          taxHistory: (data.taxHistory || []).map((t: any) => ({
            year: t.year || 0,
            taxPaid: t.taxPaid || 0,
            value: t.value || 0,
          })),
        },
      };
    } catch (error: any) {
      console.error('Zillow details error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get property details',
      };
    }
  }

  /**
   * Get comparable properties
   */
  async getComparables(zpid: string): Promise<ZillowCompsResponse> {
    try {
      const data = await this.makeRequest('/propertyComps', {
        zpid,
      });

      if (!data?.comps || data.comps.length === 0) {
        return {
          success: false,
          message: 'No comparable properties found',
        };
      }

      return {
        success: true,
        comps: data.comps.map((comp: any) => ({
          zpid: comp.zpid?.toString() || '',
          address: comp.address || comp.streetAddress || '',
          bedrooms: comp.bedrooms || 0,
          bathrooms: comp.bathrooms || 0,
          livingArea: comp.livingArea || 0,
          yearBuilt: comp.yearBuilt || 0,
          zestimate: comp.zestimate || 0,
          rentZestimate: comp.rentZestimate || 0,
          distance: comp.distance || 0,
          imgSrc: comp.imgSrc || '',
          lastSoldPrice: comp.lastSoldPrice,
          lastSoldDate: comp.lastSoldDate,
        })),
      };
    } catch (error: any) {
      console.error('Zillow comps error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get comparable properties',
      };
    }
  }

  /**
   * Search and get full details in one call
   */
  async getPropertyByAddress(address: string): Promise<{
    success: boolean;
    property?: ZillowPropertyDetails;
    comps?: ZillowComparable[];
    message?: string;
  }> {
    // First search for the property
    const searchResult = await this.searchByAddress(address);
    
    if (!searchResult.success || !searchResult.property) {
      return {
        success: false,
        message: searchResult.message || 'Property not found',
      };
    }

    const zpid = searchResult.property.zpid;

    // Get detailed info and comps in parallel
    const [detailsResult, compsResult] = await Promise.all([
      this.getPropertyDetails(zpid),
      this.getComparables(zpid),
    ]);

    return {
      success: detailsResult.success,
      property: detailsResult.details,
      comps: compsResult.comps,
      message: detailsResult.message,
    };
  }

  private extractFeatures(data: any): string[] {
    const features: string[] = [];
    
    if (data.resoFacts) {
      const facts = data.resoFacts;
      if (facts.hasGarage) features.push('Garage');
      if (facts.hasPool) features.push('Pool');
      if (facts.hasSpa) features.push('Spa');
      if (facts.hasFireplace) features.push('Fireplace');
      if (facts.hasView) features.push('View');
      if (facts.hasWaterfront) features.push('Waterfront');
      if (facts.hasBasement) features.push('Basement');
      if (facts.hasAC) features.push('Air Conditioning');
      if (facts.hasHeating) features.push('Heating');
      if (facts.hasPatio) features.push('Patio');
      if (facts.hasDeck) features.push('Deck');
      if (facts.hasFence) features.push('Fenced Yard');
    }
    
    return features;
  }

  private extractImages(data: any): string[] {
    const images: string[] = [];
    
    // Try different image sources
    if (data.photos && Array.isArray(data.photos)) {
      data.photos.forEach((photo: any) => {
        if (photo.url) images.push(photo.url);
        else if (photo.mixedSources?.jpeg?.[0]?.url) {
          images.push(photo.mixedSources.jpeg[0].url);
        }
      });
    }
    
    if (data.responsivePhotos && Array.isArray(data.responsivePhotos)) {
      data.responsivePhotos.forEach((photo: any) => {
        if (photo.url) images.push(photo.url);
      });
    }
    
    if (data.imgSrc && !images.includes(data.imgSrc)) {
      images.unshift(data.imgSrc);
    }
    
    return images.slice(0, 20); // Limit to 20 images
  }
}

export const zillowService = new ZillowService();
