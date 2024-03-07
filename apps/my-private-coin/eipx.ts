import { JSON } from "@klave/sdk";

@serializable
export class Currency {
    id: string;
    name!: string;    
    symbol!: string;
    totalSupply!: u64;
    accounts: string[];

    constructor(id: string, name: string, symbol: string, totalSupply: u64) {
        this.id = id;
        this.name = name;
        this.symbol = symbol;
        this.totalSupply = totalSupply;
        this.accounts = [];
    }
}

