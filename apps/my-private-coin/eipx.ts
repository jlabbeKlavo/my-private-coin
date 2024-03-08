import { JSON } from "@klave/sdk";

@serializable
export class Currency {
    id: string;
    publicKey: string;
    name: string;    
    symbol: string;
    totalSupply: u64;
    decimals: u8;
    accounts: string[];

    constructor(name: string, symbol: string, totalSupply: u64) {
        this.id = "";
        this.publicKey = "";
        this.name = name;
        this.symbol = symbol;
        this.totalSupply = totalSupply;
        this.decimals = 0;
        this.accounts = [];
    }
}

