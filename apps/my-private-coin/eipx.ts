import { JSON } from '@klave/sdk';
import { Account } from './rosalind';

@serializable
export class Currency {
    id: string;
    name: string;    
    symbol: string;
    totalSupply: number;
    accounts: string[];
}
