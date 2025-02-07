export interface EmissionSummary {
  metadata: {
    total: number | null;
  };
  data: {
    totalEmissions: number;
    country: Country;
    sector: Sector;
  }[];
}

export interface Sector {
  industry: string | null;
  seriesCode: string | null;
  gasType: string | null;
  unit: string | null;
}

export interface Country {
  name: string | null;
  alpha3: string | null;
}

export interface EmissionBySector {
  totalEmissions: number;
  year: number;
  count: number;
  sector: Sector;
  country: Country;
  sectorId: string;
}
