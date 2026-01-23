export interface CurrencyConfig {
    code: string;
    symbol: string;
    symbolEn?: string; // English symbol override (e.g., "SAR" instead of "﷼")
    name: string;
}

export interface CountryConfig {
    code: string;
    name: string;
    currency: CurrencyConfig;
    locale: string;
}

export const COUNTRIES: Record<string, CountryConfig> = {
    US: {
        code: 'US',
        name: 'United States',
        currency: {
            code: 'USD',
            symbol: '$',
            name: 'US Dollar',
        },
        locale: 'en-US',
    },
    SA: {
        code: 'SA',
        name: 'Saudi Arabia',
        currency: {
            code: 'SAR',
            symbol: '﷼',
            symbolEn: 'SAR',
            name: 'Saudi Riyal',
        },
        locale: 'ar-SA',
    },
    AE: {
        code: 'AE',
        name: 'United Arab Emirates',
        currency: {
            code: 'AED',
            symbol: 'د.إ',
            symbolEn: 'AED',
            name: 'UAE Dirham',
        },
        locale: 'ar-AE',
    },
    GB: {
        code: 'GB',
        name: 'United Kingdom',
        currency: {
            code: 'GBP',
            symbol: '£',
            name: 'British Pound',
        },
        locale: 'en-GB',
    },
    EU: {
        code: 'EU',
        name: 'European Union',
        currency: {
            code: 'EUR',
            symbol: '€',
            name: 'Euro',
        },
        locale: 'en-IE', // Using IE as generic English locale for EU
    },
    CN: {
        code: 'CN',
        name: 'China',
        currency: {
            code: 'CNY',
            symbol: '¥',
            name: 'Chinese Yuan',
        },
        locale: 'zh-CN',
    },
    JP: {
        code: 'JP',
        name: 'Japan',
        currency: {
            code: 'JPY',
            symbol: '¥',
            name: 'Japanese Yen',
        },
        locale: 'ja-JP',
    },
};

export const DEFAULT_COUNTRY_CODE = 'US';
