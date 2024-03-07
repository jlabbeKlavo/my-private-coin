
import { JSON } from '@klave/sdk';

// export enum AcctTp {
//     Personal = "Personal",
//     Business = "Business",
// }

@serializable
export class Allowed {
    spender: string;
    value: u64;

    constructor(spender: string, value: u64) {
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
    balance: u64;
    allowed: Allowed[];

    constructor() {
        this.AccountType = "Personal";
        this.balance = 0;
        this.allowed = [];
    }

    addAllowed(spender: string, value: u64): void {
        this.allowed.push(new Allowed(spender, value));
    }

    findAllowed(spender: string): u32 {        
        return 0;//this.allowed.findIndex(a => a.findSpender(spender));
    }
}
