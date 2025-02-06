export interface EmissionData {
    industry: string;
    gasType: string;
    unit: string;
}

export const worldbankSeriesCode: Record<string, EmissionData> = {
    "EN.ATM.GHGT.ZG": { industry: "Energy", gasType: "CO₂", unit: "% change from 1990" },
    "EN.ATM.METH.AG.ZS": { industry: "Agriculture", gasType: "Methane", unit: "% of total" },
    "EN.ATM.NOXE.AG.ZS": { industry: "Agriculture", gasType: "NOx", unit: "% of total" },
    "EN.ATM.CO2E.KT": { industry: "All Sectors", gasType: "CO₂ Equivalent", unit: "kt" },
    "EN.CO2.ETOT.ZS": { industry: "Energy", gasType: "CO₂", unit: "% of total emissions" },
    "EN.CO2.MANF.ZS": { industry: "Manufacturing", gasType: "CO₂", unit: "% of total emissions" },
    "EN.CO2.OTHX.ZS": { industry: "Other", gasType: "CO₂", unit: "% of total emissions" },
    "EN.CO2.BLDG.ZS": { industry: "Buildings", gasType: "CO₂", unit: "% of total emissions" },
    "EN.CO2.TRAN.ZS": { industry: "Transport", gasType: "CO₂", unit: "% of total emissions" },
    "EN.ATM.METH.EG.ZS": { industry: "Energy", gasType: "Methane", unit: "% of total" },
    "EN.ATM.METH.ZG": { industry: "All Sectors", gasType: "Methane", unit: "% change from 1990" },
    "EN.ATM.HFCG.KT.CE": { industry: "Industry", gasType: "HFCs", unit: "kt CO₂e" },
    "EN.ATM.NOXE.EG.ZS": { industry: "Energy", gasType: "NOx", unit: "% of total" },
    "EN.ATM.GHGT.KT.CE": { industry: "All Sectors", gasType: "Total GHG", unit: "kt CO₂e" },
    "EN.ATM.SF6G.KT.CE": { industry: "Industry", gasType: "SF₆", unit: "kt CO₂e" },
    "EN.ATM.PFCG.KT.CE": { industry: "Industry", gasType: "PFCs", unit: "kt CO₂e" },
    "EN.ATM.NOXE.ZG": { industry: "All Sectors", gasType: "NOx", unit: "% change from 1990" },
    "EN.ATM.NOXE.KT.CE": { industry: "All Sectors", gasType: "NOx", unit: "kt CO₂e" },
    "EN.ATM.METH.EG.KT.CE": { industry: "Energy", gasType: "Methane", unit: "kt CO₂e" },
    "EN.ATM.NOXE.EG.KT.CE": { industry: "Energy", gasType: "NOx", unit: "kt CO₂e" },
    "EN.ATM.METH.KT.CE": { industry: "All Sectors", gasType: "Methane", unit: "kt CO₂e" },
    "EN.ATM.METH.AG.KT.CE": { industry: "Agriculture", gasType: "Methane", unit: "kt CO₂e" },
    "EN.ATM.NOXE.AG.KT.CE": { industry: "Agriculture", gasType: "NOx", unit: "kt CO₂e" }
};