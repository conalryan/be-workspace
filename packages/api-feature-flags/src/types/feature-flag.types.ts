export interface UIFeatureFlag {
    description?: string;
    enabled: boolean;
    id: string; // UUID
    value?: boolean | string | number | object;
}

export interface UIFeatureFlags {
    [name: string]: UIFeatureFlag;
}

export interface BEFeatureFlag extends UIFeatureFlag {
    archived?: boolean;
    created_at: string;
    created_by: string;
    updated_at?: string;
    updated_by?: string;
}

export interface BEFeatureFlags {
    [name: string]: BEFeatureFlag;
}