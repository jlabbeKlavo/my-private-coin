
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
}

@serializable
export class Account {    
    accountType: string;    
    balance: u64;
    allowed: Array<Allowed>;

    constructor() {
        this.accountType = "Personal";
        this.balance = 0;
        this.allowed = new Array<Allowed>();
    }

    addAllowed(spender: string, value: u64): void {
        this.allowed.push(new Allowed(spender, value));
    }

    findAllowed(spender: string): u32 {
        for (let i = 0; i < this.allowed.length; i++) 
        {
            if (this.allowed[i].spender == spender) {
                return i;
            }
        } 
        return -1;
    }
}