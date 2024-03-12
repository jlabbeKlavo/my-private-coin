import {JSON} from "@klave/sdk"
import {address} from "../../klave/types"


@serializable
export class Allowance {
    spender: address;
    value: u64;

    constructor(spender: address, value: u64) {
        this.spender = spender;
        this.value = value;
    }
}

@serializable
export class Account {        
    owner: address;
    balance: u64;
    allowance: Array<Allowance>;    

    constructor(owner: address, balance: u64) {
        this.owner = owner;
        this.balance = balance;
        this.allowance = new Array<Allowance>();
    }

    findAllowance(spender: address): i32 {
        for (let i = 0; i < this.allowance.length; i++) {
            if (this.allowance[i].spender == spender) {
                return i;
            }
        }
        return -1;
    }

    addToAllowance(spender: address, value: u64): void {
        let index = this.findAllowance(spender);
        if (index !== -1) {
            this.allowance[index].value += value;
        } else {
            this.allowance.push(new Allowance(spender, value));
        }
    }

    subtractFromAllowance(spender: address, value: u64): void {
        let index = this.findAllowance(spender);
        if (index !== -1) {
            this.allowance[index].value -= value;
        } else {
            this.allowance.push(new Allowance(spender, 0));
        }
    }

    getAllowance(spender: address): u64 {
        let index = this.findAllowance(spender);
        if (index !== -1) {
            return this.allowance[index].value;
        }
        return 0;
    }
}

