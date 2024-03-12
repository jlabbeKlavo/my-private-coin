import { JSON } from "@klave/sdk"

@serializable
export class CreateInput {
    name!: string;
    symbol!: string;
    decimals!: u8;
    totalSupply!: u64;
}

@serializable
export class TransferInput {    
    to!: string;
    value!: u64;    
}

@serializable
export class ApproveInput {    
    spender!: string;
    value!: u64;    
}

@serializable
export class TransferFromInput {
    from!: string;
    to!: string;
    value!: u64;
}

@serializable
export class AllowanceInput {
    owner!: string;
    spender!: string;
}

@serializable
export class IncreaseAllowanceInput {
    spender!: string;
    addedValue!: u64;
}

@serializable
export class DecreaseAllowanceInput {
    spender!: string;
    subtractedValue!: u64;
}

@serializable
export class MintInput {
    to!: string;
    value!: u64;
}

@serializable
export class BurnInput {
    from!: string;
    value!: u64; 
}

@serializable
export class BurnFromInput {
    spender!: string;
    value!: u64;
}