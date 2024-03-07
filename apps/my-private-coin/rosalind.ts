
import { JSON } from '@klave/sdk';

// export enum AcctTp {
//     Personal = "Personal",
//     Business = "Business",
// }

@serializable
export class Allowed {
    spender: string;
    value: number;

    constructor(spender: string, value: number) {
        this.spender = spender;
        this.value = value;
    }

    findSpender(spender: string): boolean {
        return this.spender === spender;
    }
}

@serializable
export class Account {    
    AccountType: string;    
    balance: number;
    allowed: Allowed[];

    constructor() {
        this.AccountType = "Personal";
        this.balance = 0;
        this.allowed = [];
    }

    addAllowed(spender: string, value: number) {
        this.allowed.push(new Allowed(spender, value));
    }

    findAllowed(spender: string): number {        
        return this.allowed.findIndex(a => a.findSpender(spender));
    }
}
